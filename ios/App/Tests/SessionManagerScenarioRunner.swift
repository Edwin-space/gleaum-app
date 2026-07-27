import Foundation

private actor StubRefreshTransport: SessionRefreshTransport {
    private let result: SessionRefreshResult
    private let delayNanoseconds: UInt64
    private var storedCallCount = 0

    init(
        result: SessionRefreshResult,
        delayNanoseconds: UInt64 = 0
    ) {
        self.result = result
        self.delayNanoseconds = delayNanoseconds
    }

    var callCount: Int {
        storedCallCount
    }

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

    override class func canInit(with request: URLRequest) -> Bool {
        true
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        request
    }

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
@MainActor
private enum SessionManagerScenarioRunner {
    private static let now = Date(timeIntervalSince1970: 2_000_000_000)

    static func main() async {
        var failures: [String] = []

        await run("valid session skips refresh", failures: &failures) {
            let transport = StubRefreshTransport(result: .temporaryFailure)
            let fixture = makeFixture(transport: transport)
            fixture.manager.saveSession(session(expiresAt: now.timeIntervalSince1970 + 3_600))

            let result = await fixture.manager.validateForLaunch()
            try expect(result == .valid, "expected valid")
            let callCount = await transport.callCount
            try expect(callCount == 0, "refresh should not run")
            fixture.cleanup()
        }

        await run("expired session refreshes and persists", failures: &failures) {
            let refreshed = session(
                accessToken: "new-access",
                refreshToken: "new-refresh",
                expiresAt: now.timeIntervalSince1970 + 3_600
            )
            let transport = StubRefreshTransport(result: .success(refreshed))
            let fixture = makeFixture(transport: transport)
            fixture.manager.saveSession(session(expiresAt: now.timeIntervalSince1970 - 1))

            let result = await fixture.manager.validateForLaunch()
            try expect(result == .refreshed, "expected refreshed")
            try expect(fixture.manager.hasValidSession(), "refreshed session should be valid")
            let token = try await fixture.manager.accessTokenForRequest()
            try expect(token == "new-access", "new access token should be used")
            fixture.cleanup()
        }

        await run("temporary failure preserves stored session", failures: &failures) {
            let transport = StubRefreshTransport(result: .temporaryFailure)
            let fixture = makeFixture(transport: transport)
            let expired = session(expiresAt: now.timeIntervalSince1970 - 1)
            fixture.manager.saveSession(expired)

            let result = await fixture.manager.validateForLaunch()
            try expect(result == .temporaryFailure, "expected temporary failure")
            try expect(fixture.manager.getRawSession() == expired, "stored session must remain")
            fixture.cleanup()
        }

        await run("explicit rejection invalidates session", failures: &failures) {
            let transport = StubRefreshTransport(result: .rejected)
            let fixture = makeFixture(transport: transport)
            fixture.manager.saveSession(session(expiresAt: now.timeIntervalSince1970 - 1))

            let result = await fixture.manager.validateForLaunch()
            try expect(result == .invalid, "expected invalid")
            try expect(!fixture.manager.hasStoredSession(), "rejected session must be removed")
            fixture.cleanup()
        }

        await run("unrecoverable payload invalidates session", failures: &failures) {
            let transport = StubRefreshTransport(result: .temporaryFailure)
            let fixture = makeFixture(transport: transport)
            fixture.manager.saveSession(#"{"access_token":"expired","expires_at":1}"#)

            let result = await fixture.manager.validateForLaunch()
            try expect(result == .invalid, "missing refresh token should be invalid")
            let callCount = await transport.callCount
            try expect(callCount == 0, "transport should not run")
            try expect(!fixture.manager.hasStoredSession(), "bad payload must be removed")
            fixture.cleanup()
        }

        await run("concurrent validation shares one refresh", failures: &failures) {
            let refreshed = session(expiresAt: now.timeIntervalSince1970 + 3_600)
            let transport = StubRefreshTransport(
                result: .success(refreshed),
                delayNanoseconds: 80_000_000
            )
            let fixture = makeFixture(transport: transport)
            fixture.manager.saveSession(session(expiresAt: now.timeIntervalSince1970 - 1))
            let manager = fixture.manager

            async let first = manager.validateForLaunch()
            async let second = manager.validateForLaunch()
            let results = await [first, second]
            try expect(
                results.allSatisfy { $0 == .refreshed },
                "both callers should share refreshed result"
            )
            let callCount = await transport.callCount
            try expect(callCount == 1, "refresh must run once")
            fixture.cleanup()
        }

        await run("logout during refresh does not resurrect session", failures: &failures) {
            let refreshed = session(expiresAt: now.timeIntervalSince1970 + 3_600)
            let transport = StubRefreshTransport(
                result: .success(refreshed),
                delayNanoseconds: 80_000_000
            )
            let fixture = makeFixture(transport: transport)
            fixture.manager.saveSession(session(expiresAt: now.timeIntervalSince1970 - 1))
            let manager = fixture.manager

            async let validation = manager.validateForLaunch()
            try? await Task.sleep(nanoseconds: 20_000_000)
            manager.clearSession()
            let result = await validation

            try expect(result == .invalid, "logged-out refresh should finish invalid")
            try expect(!manager.hasStoredSession(), "late refresh must not restore session")
            fixture.cleanup()
        }

        await run("refresh response normalization", failures: &failures) {
            let data = Data(
                #"{"access_token":"next","refresh_token":"rotate","expires_in":7200}"#.utf8
            )
            guard let normalized = SessionPayload.normalizedRefreshJSON(
                from: data,
                now: now
            ) else {
                throw ScenarioFailure("normalization unexpectedly failed")
            }
            try expect(SessionPayload.isUsable(normalized, now: now), "normalized session should be usable")
            try expect(
                SessionPayload.refreshToken(from: normalized) == "rotate",
                "rotated refresh token should remain"
            )
        }

        await run("malformed refresh response is rejected", failures: &failures) {
            let data = Data(#"{"access_token":"next"}"#.utf8)
            try expect(
                SessionPayload.normalizedRefreshJSON(from: data, now: now) == nil,
                "refresh token is required"
            )
        }

        await run("transport maps success response", failures: &failures) {
            StubURLProtocol.statusCode = 200
            StubURLProtocol.responseData = Data(
                #"{"access_token":"next","refresh_token":"rotate","expires_in":3600}"#.utf8
            )
            StubURLProtocol.responseError = nil

            let result = await makeURLTransport().refresh(refreshToken: "stored")
            guard case .success(let json) = result else {
                throw ScenarioFailure("expected transport success")
            }
            try expect(
                SessionPayload.accessToken(from: json) == "next",
                "transport should normalize the response"
            )
        }

        await run("transport maps 4xx to rejection", failures: &failures) {
            StubURLProtocol.statusCode = 401
            StubURLProtocol.responseData = Data(#"{"error":"invalid_grant"}"#.utf8)
            StubURLProtocol.responseError = nil

            let result = await makeURLTransport().refresh(refreshToken: "stored")
            try expect(result == .rejected, "4xx should invalidate the session")
        }

        await run("transport maps 5xx to temporary failure", failures: &failures) {
            StubURLProtocol.statusCode = 503
            StubURLProtocol.responseData = Data()
            StubURLProtocol.responseError = nil

            let result = await makeURLTransport().refresh(refreshToken: "stored")
            try expect(result == .temporaryFailure, "5xx should preserve the session")
        }

        await run("transport maps network error to temporary failure", failures: &failures) {
            StubURLProtocol.responseError = URLError(.notConnectedToInternet)

            let result = await makeURLTransport().refresh(refreshToken: "stored")
            try expect(
                result == .temporaryFailure,
                "network error should preserve the session"
            )
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
            failures.append("\(name) — \(error)")
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
    ) -> (
        manager: SessionManager,
        cleanup: () -> Void
    ) {
        let suiteName = "SessionManagerScenarioRunner.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        let fixedNow = Date(timeIntervalSince1970: 2_000_000_000)
        let manager = SessionManager(
            defaults: defaults,
            refresher: transport,
            now: { fixedNow }
        )
        return (
            manager,
            { defaults.removePersistentDomain(forName: suiteName) }
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
            now: { Date(timeIntervalSince1970: 2_000_000_000) }
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
        let data = try! JSONSerialization.data(
            withJSONObject: payload,
            options: [.sortedKeys]
        )
        return String(data: data, encoding: .utf8)!
    }
}

private struct ScenarioFailure: Error, CustomStringConvertible {
    let description: String

    init(_ description: String) {
        self.description = description
    }
}
