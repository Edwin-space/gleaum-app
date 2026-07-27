import Foundation

private final class MemorySessionStore: SessionStore, @unchecked Sendable {
    private let lock = NSLock()
    private var value: String?

    init(_ value: String? = nil) {
        self.value = value
    }

    func load() -> String? {
        lock.lock()
        defer { lock.unlock() }
        return value
    }

    func save(_ value: String) -> Bool {
        lock.lock()
        defer { lock.unlock() }
        self.value = value
        return true
    }

    func remove() {
        lock.lock()
        defer { lock.unlock() }
        value = nil
    }
}

private actor StubRefreshTransport: SessionRefreshTransport {
    private let result: SessionRefreshResult
    private let delayNanoseconds: UInt64
    private var storedCallCount = 0

    init(result: SessionRefreshResult, delayNanoseconds: UInt64 = 0) {
        self.result = result
        self.delayNanoseconds = delayNanoseconds
    }

    var callCount: Int { storedCallCount }

    func refresh(refreshToken: String) async -> SessionRefreshResult {
        storedCallCount += 1
        if delayNanoseconds > 0 {
            try? await Task.sleep(nanoseconds: delayNanoseconds)
        }
        return result
    }
}

private final class StubURLProtocol: URLProtocol, @unchecked Sendable {
    nonisolated(unsafe) static var statusCode = 200
    nonisolated(unsafe) static var responseData = Data()
    nonisolated(unsafe) static var responseError: Error?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        if let responseError = Self.responseError {
            client?.urlProtocol(self, didFailWithError: responseError)
            return
        }
        let response = HTTPURLResponse(
            url: request.url!,
            statusCode: Self.statusCode,
            httpVersion: "HTTP/1.1",
            headerFields: ["Content-Type": "application/json"]
        )!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Self.responseData)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}

@main
private enum SessionManagerScenarioRunner {
    private static let now = Date(timeIntervalSince1970: 2_000_000_000)

    static func main() async {
        var failures: [String] = []

        await run("valid session skips refresh", failures: &failures) {
            let transport = StubRefreshTransport(result: .temporaryFailure)
            let fixture = makeFixture(transport: transport)
            fixture.manager.saveSession(session(expiresAt: now.timeIntervalSince1970 + 3_600))
            let validation = await fixture.manager.validateForLaunch()
            let callCount = await transport.callCount
            try expect(validation == .valid, "expected valid")
            try expect(callCount == 0, "refresh should not run")
        }

        await run("expired session refreshes and persists", failures: &failures) {
            let refreshed = session(
                accessToken: "new-access",
                refreshToken: "new-refresh",
                expiresAt: now.timeIntervalSince1970 + 3_600
            )
            let fixture = makeFixture(transport: StubRefreshTransport(result: .success(refreshed)))
            fixture.manager.saveSession(session(expiresAt: now.timeIntervalSince1970 - 1))
            let validation = await fixture.manager.validateForLaunch()
            let token = try await fixture.manager.accessTokenForRequest()
            try expect(validation == .refreshed, "expected refreshed")
            try expect(token == "new-access", "new token required")
        }

        await run("temporary failure preserves session", failures: &failures) {
            let expired = session(expiresAt: now.timeIntervalSince1970 - 1)
            let fixture = makeFixture(transport: StubRefreshTransport(result: .temporaryFailure))
            fixture.manager.saveSession(expired)
            let validation = await fixture.manager.validateForLaunch()
            try expect(validation == .temporaryFailure, "expected temporary")
            try expect(fixture.manager.getRawSession() == expired, "session must remain")
        }

        await run("explicit rejection clears session", failures: &failures) {
            let fixture = makeFixture(transport: StubRefreshTransport(result: .rejected))
            fixture.manager.saveSession(session(expiresAt: now.timeIntervalSince1970 - 1))
            let validation = await fixture.manager.validateForLaunch()
            try expect(validation == .invalid, "expected invalid")
            try expect(!fixture.manager.hasStoredSession(), "session must be removed")
        }

        await run("legacy UserDefaults session migrates once", failures: &failures) {
            let suiteName = "SessionMigration.\(UUID().uuidString)"
            let defaults = UserDefaults(suiteName: suiteName)!
            let store = MemorySessionStore()
            let legacy = session(expiresAt: now.timeIntervalSince1970 + 3_600)
            defaults.set(legacy, forKey: "gleaum_native_session")

            LegacySessionMigrator(defaults: defaults).migrateIfNeeded(to: store)
            try expect(store.load() == legacy, "legacy session must move to secure store")
            try expect(
                defaults.string(forKey: "gleaum_native_session") == nil,
                "legacy value must be removed after a successful save"
            )
            defaults.removePersistentDomain(forName: suiteName)
        }

        await run("malformed stored payload is invalidated", failures: &failures) {
            let store = MemorySessionStore(#"{"access_token":"expired","expires_at":1}"#)
            let manager = SessionManager(
                store: store,
                refresher: StubRefreshTransport(result: .temporaryFailure),
                now: { now },
                migrateLegacySession: false
            )
            let validation = await manager.validateForLaunch()
            try expect(validation == .invalid, "missing refresh token is invalid")
            try expect(store.load() == nil, "malformed payload must be removed")
        }

        await run("concurrent validation shares refresh", failures: &failures) {
            let transport = StubRefreshTransport(
                result: .success(session(expiresAt: now.timeIntervalSince1970 + 3_600)),
                delayNanoseconds: 80_000_000
            )
            let fixture = makeFixture(transport: transport)
            fixture.manager.saveSession(session(expiresAt: now.timeIntervalSince1970 - 1))
            async let first = fixture.manager.validateForLaunch()
            async let second = fixture.manager.validateForLaunch()
            let results = await [first, second]
            let callCount = await transport.callCount
            try expect(results.allSatisfy { $0 == .refreshed }, "shared result required")
            try expect(callCount == 1, "refresh must run once")
        }

        await run("logout during refresh cannot restore session", failures: &failures) {
            let transport = StubRefreshTransport(
                result: .success(session(expiresAt: now.timeIntervalSince1970 + 3_600)),
                delayNanoseconds: 80_000_000
            )
            let fixture = makeFixture(transport: transport)
            fixture.manager.saveSession(session(expiresAt: now.timeIntervalSince1970 - 1))
            async let validation = fixture.manager.validateForLaunch()
            try? await Task.sleep(nanoseconds: 20_000_000)
            fixture.manager.clearSession()
            let result = await validation
            try expect(result == .invalid, "late refresh must finish invalid")
            try expect(!fixture.manager.hasStoredSession(), "late refresh must not restore")
        }

        await run("successful response is normalized", failures: &failures) {
            StubURLProtocol.statusCode = 200
            StubURLProtocol.responseData = Data(
                #"{"access_token":"next","refresh_token":"rotate","expires_in":3600}"#.utf8
            )
            StubURLProtocol.responseError = nil
            guard case .success(let json) = await makeURLTransport().refresh(refreshToken: "stored") else {
                throw ScenarioFailure("expected success")
            }
            try expect(SessionPayload.accessToken(from: json) == "next", "normalized token required")
        }

        await run("explicit invalid refresh response rejects", failures: &failures) {
            StubURLProtocol.statusCode = 400
            StubURLProtocol.responseData = Data(#"{"code":"refresh_token_not_found"}"#.utf8)
            let result = await makeURLTransport().refresh(refreshToken: "stored")
            try expect(result == .rejected, "explicit invalid token must reject")
        }

        await run("generic 401 remains temporary", failures: &failures) {
            StubURLProtocol.statusCode = 401
            StubURLProtocol.responseData = Data(#"{"message":"authorization unavailable"}"#.utf8)
            let result = await makeURLTransport().refresh(refreshToken: "stored")
            try expect(result == .temporaryFailure, "configuration failures must not log the user out")
        }

        await run("rate limit remains temporary", failures: &failures) {
            StubURLProtocol.statusCode = 429
            StubURLProtocol.responseData = Data()
            let result = await makeURLTransport().refresh(refreshToken: "stored")
            try expect(result == .temporaryFailure, "rate limiting must preserve session")
        }

        await run("server and network errors remain temporary", failures: &failures) {
            StubURLProtocol.statusCode = 503
            StubURLProtocol.responseData = Data()
            let serverResult = await makeURLTransport().refresh(refreshToken: "stored")
            try expect(serverResult == .temporaryFailure, "server failure must preserve session")
            StubURLProtocol.responseError = URLError(.notConnectedToInternet)
            let networkResult = await makeURLTransport().refresh(refreshToken: "stored")
            try expect(networkResult == .temporaryFailure, "network failure must preserve session")
            StubURLProtocol.responseError = nil
        }

        if failures.isEmpty {
            print("SessionManager scenarios: 13/13 passed")
        } else {
            failures.forEach { print("FAIL: \($0)") }
            exit(1)
        }
    }

    private static func run(
        _ name: String,
        failures: inout [String],
        operation: () async throws -> Void
    ) async {
        do {
            try await operation()
            print("PASS: \(name)")
        } catch {
            failures.append("\(name) - \(error)")
        }
    }

    private static func expect(
        _ condition: @autoclosure () -> Bool,
        _ message: String
    ) throws {
        if !condition() {
            throw ScenarioFailure(message)
        }
    }

    private static func makeFixture(
        transport: SessionRefreshTransport
    ) -> (manager: SessionManager, store: MemorySessionStore) {
        let store = MemorySessionStore()
        return (
            SessionManager(
                store: store,
                refresher: transport,
                now: { now },
                migrateLegacySession: false
            ),
            store
        )
    }

    private static func makeURLTransport() -> SupabaseSessionRefreshTransport {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        return SupabaseSessionRefreshTransport(
            configuration: GleaumSupabaseConfiguration(
                baseURL: URL(string: "https://session.test")!,
                anonKey: "public-anon-key"
            ),
            session: URLSession(configuration: configuration),
            now: { now }
        )
    }

    private static func session(
        accessToken: String = "access",
        refreshToken: String = "refresh",
        expiresAt: TimeInterval
    ) -> String {
        let payload: [String: Any] = [
            "access_token": accessToken,
            "refresh_token": refreshToken,
            "expires_at": expiresAt,
            "token_type": "bearer",
        ]
        let data = try! JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys])
        return String(data: data, encoding: .utf8)!
    }
}

private struct ScenarioFailure: Error, CustomStringConvertible {
    let description: String
    init(_ description: String) { self.description = description }
}
