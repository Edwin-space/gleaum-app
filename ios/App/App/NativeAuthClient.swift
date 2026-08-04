import Foundation

enum NativeIdentityProvider: String {
    case apple
    case google
    case kakao
}

struct NativeAuthResponse {
    let sessionJSON: String?

    var requiresEmailConfirmation: Bool {
        sessionJSON == nil
    }
}

enum NativeAuthError: LocalizedError, Equatable {
    case invalidConfiguration
    case invalidResponse
    case requestFailed(status: Int, message: String)
    case networkUnavailable

    var errorDescription: String? {
        switch self {
        case .invalidConfiguration:
            return "로그인 설정을 확인할 수 없습니다. 앱을 최신 버전으로 업데이트해 주세요."
        case .invalidResponse:
            return "로그인 응답을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요."
        case .networkUnavailable:
            return "네트워크 연결을 확인한 뒤 다시 시도해 주세요."
        case .requestFailed(_, let message):
            let normalized = message.lowercased()
            if normalized.contains("invalid login") || normalized.contains("invalid credentials") {
                return "이메일 또는 비밀번호가 올바르지 않아요."
            }
            if normalized.contains("email not confirmed") {
                return "이메일 인증이 아직 완료되지 않았어요. 메일함을 확인해 주세요."
            }
            if normalized.contains("already registered") || normalized.contains("user already") {
                return "이미 가입된 이메일이에요. 로그인으로 진행해 주세요."
            }
            if normalized.contains("password") {
                return "비밀번호 조건을 확인해 주세요. 최소 6자 이상이어야 해요."
            }
            return message.isEmpty
                ? "인증 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."
                : message
        }
    }
}

protocol NativeAuthTransport: Sendable {
    func send(_ request: URLRequest) async throws -> (Data, URLResponse)
}

struct URLSessionNativeAuthTransport: NativeAuthTransport {
    func send(_ request: URLRequest) async throws -> (Data, URLResponse) {
        try await URLSession.shared.data(for: request)
    }
}

/// Apple·Google ID token과 이메일 인증을 동일한 Supabase 세션 JSON으로 정규화합니다.
final class NativeAuthClient: @unchecked Sendable {
    static let shared = NativeAuthClient()

    private let configuration: GleaumSupabaseConfiguration
    private let transport: NativeAuthTransport
    private let now: @Sendable () -> Date

    init(
        configuration: GleaumSupabaseConfiguration = .app,
        transport: NativeAuthTransport = URLSessionNativeAuthTransport(),
        now: @escaping @Sendable () -> Date = { Date() }
    ) {
        self.configuration = configuration
        self.transport = transport
        self.now = now
    }

    func signIn(email: String, password: String) async throws -> NativeAuthResponse {
        try await request(
            path: "auth/v1/token?grant_type=password",
            body: [
                "email": email,
                "password": password,
            ]
        )
    }

    func signUp(email: String, password: String, displayName: String) async throws -> NativeAuthResponse {
        try await request(
            path: "auth/v1/signup?redirect_to=gleaum%3A%2F%2Fauth%2Fcallback",
            body: [
                "email": email,
                "password": password,
                "data": [
                    "full_name": displayName,
                    "name": displayName,
                    "display_name": displayName,
                ],
            ]
        )
    }

    func signIn(
        provider: NativeIdentityProvider,
        idToken: String,
        rawNonce: String,
        accessToken: String? = nil
    ) async throws -> NativeAuthResponse {
        var body: [String: Any] = [
            "provider": provider.rawValue,
            "id_token": idToken,
            "nonce": rawNonce,
        ]
        if let accessToken, !accessToken.isEmpty {
            body["access_token"] = accessToken
        }
        return try await request(
            path: "auth/v1/token?grant_type=id_token",
            body: body
        )
    }

    func updateDisplayName(_ displayName: String, sessionJSON: String) async {
        guard !displayName.isEmpty,
              let accessToken = SessionPayload.accessToken(from: sessionJSON),
              let request = makeRequest(
                path: "auth/v1/user",
                method: "PUT",
                authorization: accessToken,
                body: ["data": ["full_name": displayName, "name": displayName]]
              ) else {
            return
        }
        _ = try? await transport.send(request)
    }

    static func sessionJSON(fromOAuthCallback url: URL, now: Date = Date()) -> String? {
        let rawParameters = [url.fragment, url.query]
            .compactMap { $0 }
            .flatMap { $0.components(separatedBy: "&") }

        var values: [String: String] = [:]
        for pair in rawParameters {
            let components = pair.split(separator: "=", maxSplits: 1).map(String.init)
            guard components.count == 2 else {
                continue
            }
            values[components[0]] = components[1].removingPercentEncoding ?? components[1]
        }

        guard let accessToken = values["access_token"], !accessToken.isEmpty,
              let refreshToken = values["refresh_token"], !refreshToken.isEmpty else {
            return nil
        }

        let expiresIn = TimeInterval(values["expires_in"] ?? "3600") ?? 3_600
        let payload: [String: Any] = [
            "access_token": accessToken,
            "refresh_token": refreshToken,
            "token_type": values["token_type"] ?? "bearer",
            "expires_in": expiresIn,
            "expires_at": now.timeIntervalSince1970 + expiresIn,
        ]
        guard let data = try? JSONSerialization.data(withJSONObject: payload) else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }

    private func request(path: String, body: [String: Any]) async throws -> NativeAuthResponse {
        guard let request = makeRequest(
            path: path,
            method: "POST",
            authorization: configuration.anonKey,
            body: body
        ) else {
            throw NativeAuthError.invalidConfiguration
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await transport.send(request)
        } catch {
            throw NativeAuthError.networkUnavailable
        }

        guard let http = response as? HTTPURLResponse else {
            throw NativeAuthError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            throw NativeAuthError.requestFailed(
                status: http.statusCode,
                message: Self.errorMessage(from: data)
            )
        }

        let sessionJSON = SessionPayload.normalizedSessionJSON(from: data, now: now())
        return NativeAuthResponse(sessionJSON: sessionJSON)
    }

    func fetchIdentities() async throws -> [NativeUserIdentity] {
        let accessToken = try await SessionManager.shared.accessTokenForRequest()
        guard let request = makeRequest(
            path: "auth/v1/user",
            method: "GET",
            authorization: accessToken,
            body: nil
        ) else {
            throw NativeAuthError.invalidConfiguration
        }

        let (data, response) = try await transport.send(request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw NativeAuthError.invalidResponse
        }

        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let identitiesRaw = json["identities"] as? [[String: Any]] else {
            return []
        }

        var identities: [NativeUserIdentity] = []
        for dict in identitiesRaw {
            guard let id = dict["id"] as? String,
                  let provider = dict["provider"] as? String else { continue }
            let identityData = dict["identity_data"] as? [String: Any]
            let email = (identityData?["email"] as? String) ?? (identityData?["preferred_username"] as? String)
            let lastSignInAt = dict["last_sign_in_at"] as? String
            identities.append(NativeUserIdentity(id: id, provider: provider, email: email, lastSignInAt: lastSignInAt))
        }
        return identities
    }

    func linkIdentity(
        provider: NativeIdentityProvider,
        idToken: String,
        rawNonce: String,
        accessToken kakaoToken: String? = nil
    ) async throws -> [NativeUserIdentity] {
        let accessToken = try await SessionManager.shared.accessTokenForRequest()
        var body: [String: Any] = [
            "provider": provider.rawValue,
            "id_token": idToken,
            "nonce": rawNonce,
        ]
        if let kakaoToken, !kakaoToken.isEmpty {
            body["access_token"] = kakaoToken
        }

        guard let request = makeRequest(
            path: "auth/v1/user/identities",
            method: "POST",
            authorization: accessToken,
            body: body
        ) else {
            throw NativeAuthError.invalidConfiguration
        }

        let (data, response) = try await transport.send(request)
        guard let http = response as? HTTPURLResponse else {
            throw NativeAuthError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            let msg = Self.errorMessage(from: data)
            throw NativeAuthError.requestFailed(status: http.statusCode, message: msg)
        }

        return try await fetchIdentities()
    }

    func unlinkIdentity(identityId: String) async throws -> [NativeUserIdentity] {
        let accessToken = try await SessionManager.shared.accessTokenForRequest()
        guard !configuration.anonKey.isEmpty,
              let url = URL(string: "auth/v1/user/identities/\(identityId)", relativeTo: configuration.baseURL)?.absoluteURL else {
            throw NativeAuthError.invalidConfiguration
        }

        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.timeoutInterval = 20
        request.setValue(configuration.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await transport.send(request)
        guard let http = response as? HTTPURLResponse else {
            throw NativeAuthError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            let msg = Self.errorMessage(from: data)
            throw NativeAuthError.requestFailed(status: http.statusCode, message: msg)
        }

        return try await fetchIdentities()
    }

    private func makeRequest(
        path: String,
        method: String,
        authorization: String,
        body: [String: Any]?
    ) -> URLRequest? {
        guard !configuration.anonKey.isEmpty,
              let url = URL(string: path, relativeTo: configuration.baseURL)?.absoluteURL else {
            return nil
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 20
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.setValue(configuration.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(authorization)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let body {
            request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        }
        return request
    }

    private static func errorMessage(from data: Data) -> String {
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return String(data: data, encoding: .utf8) ?? ""
        }
        return [
            json["msg"],
            json["message"],
            json["error_description"],
            json["error"],
        ]
        .compactMap { $0 as? String }
        .first { !$0.isEmpty } ?? ""
    }
}

struct NativeUserIdentity: Identifiable, Codable, Equatable {
    let id: String
    let provider: String
    let email: String?
    let lastSignInAt: String?

    var providerDisplayName: String {
        switch provider.lowercased() {
        case "apple": return "Apple"
        case "google": return "Google"
        case "kakao": return "카카오"
        case "email": return "이메일"
        default: return provider.capitalized
        }
    }
}

