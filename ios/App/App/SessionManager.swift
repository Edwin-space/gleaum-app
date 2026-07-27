import Foundation

enum SessionValidation: Equatable {
    case valid
    case refreshed
    case temporaryFailure
    case invalid
}

enum SessionAccessError: Error {
    case temporaryFailure
    case invalid
}

struct GleaumSupabaseConfiguration: Sendable {
    let baseURL: URL
    let anonKey: String

    static let app: GleaumSupabaseConfiguration = {
        let bundle = Bundle.main
        let rawURL = bundle.object(
            forInfoDictionaryKey: "GleaumSupabaseURL"
        ) as? String ?? "https://tyvjdsescukaeorcuaga.supabase.co"
        let anonKey = bundle.object(
            forInfoDictionaryKey: "GleaumSupabaseAnonKey"
        ) as? String ?? ""

        guard let baseURL = URL(string: rawURL) else {
            preconditionFailure("GleaumSupabaseURL must be a valid URL.")
        }
        return GleaumSupabaseConfiguration(baseURL: baseURL, anonKey: anonKey)
    }()
}

enum SessionRefreshResult: Equatable {
    case success(String)
    case rejected
    case temporaryFailure
}

protocol SessionRefreshTransport: Sendable {
    func refresh(refreshToken: String) async -> SessionRefreshResult
}

struct SupabaseSessionRefreshTransport: SessionRefreshTransport {
    private let configuration: GleaumSupabaseConfiguration
    private let session: URLSession
    private let now: @Sendable () -> Date

    init(
        configuration: GleaumSupabaseConfiguration = .app,
        session: URLSession = .shared,
        now: @escaping @Sendable () -> Date = { Date() }
    ) {
        self.configuration = configuration
        self.session = session
        self.now = now
    }

    func refresh(refreshToken: String) async -> SessionRefreshResult {
        guard !configuration.anonKey.isEmpty,
              let url = URL(
                string: "auth/v1/token?grant_type=refresh_token",
                relativeTo: configuration.baseURL
              )?.absoluteURL else {
            return .temporaryFailure
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 8
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.setValue(configuration.anonKey, forHTTPHeaderField: "apikey")
        request.setValue(
            "Bearer \(configuration.anonKey)",
            forHTTPHeaderField: "Authorization"
        )
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        guard let body = try? JSONSerialization.data(
            withJSONObject: ["refresh_token": refreshToken]
        ) else {
            return .temporaryFailure
        }
        request.httpBody = body

        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else {
                return .temporaryFailure
            }

            switch http.statusCode {
            case 200..<300:
                guard let normalized = SessionPayload.normalizedRefreshJSON(
                    from: data,
                    now: now()
                ) else {
                    return .temporaryFailure
                }
                return .success(normalized)
            case 400..<500:
                return Self.isExplicitRefreshRejection(data)
                    ? .rejected
                    : .temporaryFailure
            default:
                return .temporaryFailure
            }
        } catch {
            return .temporaryFailure
        }
    }

    private static func isExplicitRefreshRejection(_ data: Data) -> Bool {
        let message = String(data: data, encoding: .utf8)?.lowercased() ?? ""
        return [
            "refresh_token_not_found",
            "invalid_refresh_token",
            "invalid_grant",
            "invalid refresh token",
            "refresh token not found",
            "refresh token has already been used",
        ].contains { message.contains($0) }
    }
}

enum SessionPayload {
    static func isUsable(_ raw: String, now: Date = Date()) -> Bool {
        guard let json = dictionary(from: raw),
              nonEmptyString(json["access_token"]) != nil else {
            return false
        }

        if let expiresAt = number(json["expires_at"]),
           expiresAt > 0,
           now.timeIntervalSince1970 > expiresAt - 60 {
            return false
        }
        return true
    }

    static func accessToken(from raw: String) -> String? {
        guard let json = dictionary(from: raw) else {
            return nil
        }
        return nonEmptyString(json["access_token"])
    }

    static func refreshToken(from raw: String) -> String? {
        guard let json = dictionary(from: raw) else {
            return nil
        }
        return nonEmptyString(json["refresh_token"])
    }

    static func normalizedRefreshJSON(from data: Data, now: Date) -> String? {
        guard var json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              nonEmptyString(json["access_token"]) != nil,
              nonEmptyString(json["refresh_token"]) != nil else {
            return nil
        }

        if number(json["expires_at"]) == nil {
            let expiresIn = number(json["expires_in"]) ?? 3_600
            json["expires_at"] = now.timeIntervalSince1970 + expiresIn
        }
        if nonEmptyString(json["token_type"]) == nil {
            json["token_type"] = "bearer"
        }

        guard let normalized = try? JSONSerialization.data(
            withJSONObject: json,
            options: [.sortedKeys]
        ) else {
            return nil
        }
        return String(data: normalized, encoding: .utf8)
    }

    private static func dictionary(from raw: String) -> [String: Any]? {
        guard let data = raw.data(using: .utf8) else {
            return nil
        }
        return try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    }

    private static func nonEmptyString(_ value: Any?) -> String? {
        guard let string = value as? String,
              !string.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return nil
        }
        return string
    }

    private static func number(_ value: Any?) -> TimeInterval? {
        if let number = value as? NSNumber {
            return number.doubleValue
        }
        if let string = value as? String {
            return TimeInterval(string)
        }
        return nil
    }
}

private actor SessionRefreshGate {
    private var inFlight: Task<SessionValidation, Never>?

    func run(
        operation: @escaping @Sendable () async -> SessionValidation
    ) async -> SessionValidation {
        if let inFlight {
            return await inFlight.value
        }

        let task = Task { await operation() }
        inFlight = task
        let result = await task.value
        inFlight = nil
        return result
    }
}

/// 세션 저장, 만료 판단, 단일 refresh 요청을 한 경계에서 관리합니다.
final class SessionManager: @unchecked Sendable {
    static let shared = SessionManager()

    private let store: SessionStore
    private let refresher: SessionRefreshTransport
    private let now: @Sendable () -> Date
    private let refreshGate = SessionRefreshGate()

    init(
        store: SessionStore = KeychainSessionStore.shared,
        refresher: SessionRefreshTransport = SupabaseSessionRefreshTransport(),
        now: @escaping @Sendable () -> Date = { Date() },
        migrateLegacySession: Bool = true
    ) {
        self.store = store
        self.refresher = refresher
        self.now = now

        if migrateLegacySession {
            LegacySessionMigrator().migrateIfNeeded(to: store)
        }
    }

    func saveSession(_ json: String) {
        guard SessionPayload.accessToken(from: json) != nil,
              SessionPayload.refreshToken(from: json) != nil,
              store.save(json) else {
            return
        }
        postOnMain(.gleaumSessionSaved)
    }

    func getSession() -> String? {
        guard let raw = getRawSession(),
              SessionPayload.isUsable(raw, now: now()) else {
            return nil
        }
        return raw
    }

    func getRawSession() -> String? {
        store.load()
    }

    func hasValidSession() -> Bool {
        getSession() != nil
    }

    func hasStoredSession() -> Bool {
        guard let raw = getRawSession() else {
            return false
        }
        return !raw.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    func validateForLaunch() async -> SessionValidation {
        if hasValidSession() {
            return .valid
        }
        return await refreshGate.run { [weak self] in
            guard let self else {
                return .invalid
            }
            return await self.performValidation(forceRefresh: false)
        }
    }

    func refreshAfterUnauthorized() async -> SessionValidation {
        await refreshGate.run { [weak self] in
            guard let self else {
                return .invalid
            }
            return await self.performValidation(forceRefresh: true)
        }
    }

    func accessTokenForRequest() async throws -> String {
        if let token = currentAccessToken() {
            return token
        }

        switch await validateForLaunch() {
        case .valid, .refreshed:
            guard let token = currentAccessToken() else {
                invalidateStoredSession()
                throw SessionAccessError.invalid
            }
            return token
        case .temporaryFailure:
            throw SessionAccessError.temporaryFailure
        case .invalid:
            throw SessionAccessError.invalid
        }
    }

    func accessToken() -> String? {
        currentAccessToken()
    }

    func clearSession() {
        store.remove()
        postOnMain(.gleaumSessionInvalidated)
    }

    private func performValidation(forceRefresh: Bool) async -> SessionValidation {
        if !forceRefresh, hasValidSession() {
            return .valid
        }

        guard let raw = getRawSession() else {
            return .invalid
        }
        guard let refreshToken = SessionPayload.refreshToken(from: raw) else {
            invalidateStoredSession()
            return .invalid
        }

        let result = await refresher.refresh(refreshToken: refreshToken)

        // 늦게 도착한 이전 계정의 refresh가 로그아웃이나 새 로그인을 덮지 않게 합니다.
        guard getRawSession() == raw else {
            if hasValidSession() {
                return .valid
            }
            return hasStoredSession() ? .temporaryFailure : .invalid
        }

        switch result {
        case .success(let refreshedJSON):
            guard store.save(refreshedJSON) else {
                return .temporaryFailure
            }
            postOnMain(.gleaumSessionRefreshed)
            return .refreshed
        case .rejected:
            invalidateStoredSession()
            return .invalid
        case .temporaryFailure:
            return .temporaryFailure
        }
    }

    private func currentAccessToken() -> String? {
        guard let raw = getSession() else {
            return nil
        }
        return SessionPayload.accessToken(from: raw)
    }

    private func invalidateStoredSession() {
        store.remove()
        postOnMain(.gleaumSessionInvalidated)
    }

    private func postOnMain(_ name: Notification.Name) {
        if Thread.isMainThread {
            NotificationCenter.default.post(name: name, object: nil)
        } else {
            DispatchQueue.main.async {
                NotificationCenter.default.post(name: name, object: nil)
            }
        }
    }
}

extension Notification.Name {
    static let gleaumSessionSaved = Notification.Name("gleaum_session_saved")
    static let gleaumSessionRefreshed = Notification.Name("gleaum_session_refreshed")
    static let gleaumSessionInvalidated = Notification.Name("gleaum_session_invalidated")
}
