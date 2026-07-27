import Foundation

final class NativeAPIClient: @unchecked Sendable {
    static let shared = NativeAPIClient()

    private let baseURL = URL(string: "https://www.gleaum.com")!

    private init() {}

    func fetchHomeSummary() async throws -> NativeHomeSummary {
        let data = try await performAuthorizedRequest(
            path: "/api/native/home-summary",
            method: "GET"
        )
        return try JSONDecoder().decode(NativeHomeSummary.self, from: data)
    }

    func fetchSnapshot(path: String) async throws -> Data {
        try await performAuthorizedRequest(path: path, method: "GET")
    }

    func createSchedule(_ payload: NativeCreateScheduleRequest) async throws -> NativeScheduleItem {
        let data = try await performAuthorizedRequest(
            path: "/api/native/schedules",
            method: "POST",
            body: try JSONEncoder().encode(payload)
        )
        return try JSONDecoder().decode(NativeCreateScheduleResponse.self, from: data).schedule
    }

    private func performAuthorizedRequest(
        path: String,
        method: String,
        body: Data? = nil
    ) async throws -> Data {
        var request = try await authorizedRequest(path: path, method: method, body: body)
        var (data, response) = try await URLSession.shared.data(for: request)

        if let http = response as? HTTPURLResponse, http.statusCode == 401 {
            switch await SessionManager.shared.refreshAfterUnauthorized() {
            case .valid, .refreshed:
                request = try await authorizedRequest(path: path, method: method, body: body)
                (data, response) = try await URLSession.shared.data(for: request)
            case .temporaryFailure:
                throw NativeAPIError.sessionTemporarilyUnavailable
            case .invalid:
                throw NativeAPIError.missingSession
            }
        }

        try validate(response: response, data: data)
        return data
    }

    private func authorizedRequest(
        path: String,
        method: String,
        body: Data?
    ) async throws -> URLRequest {
        let token: String
        do {
            token = try await SessionManager.shared.accessTokenForRequest()
        } catch SessionAccessError.temporaryFailure {
            throw NativeAPIError.sessionTemporarilyUnavailable
        } catch {
            throw NativeAPIError.missingSession
        }

        guard let url = URL(string: path, relativeTo: baseURL)?.absoluteURL else {
            throw NativeAPIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.timeoutInterval = 20
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Gleaum-iOS-Native", forHTTPHeaderField: "X-Gleaum-Client")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = body
        }
        return request
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else { return }
        guard (200..<300).contains(http.statusCode) else {
            let body = String(data: data, encoding: .utf8) ?? ""
            throw NativeAPIError.http(status: http.statusCode, body: body)
        }
    }
}

enum NativeAPIError: LocalizedError {
    case missingSession
    case sessionTemporarilyUnavailable
    case invalidURL
    case http(status: Int, body: String)

    var errorDescription: String? {
        switch self {
        case .missingSession:
            return "로그인 세션을 찾을 수 없습니다. 다시 로그인해 주세요."
        case .sessionTemporarilyUnavailable:
            return "연결이 원활하지 않아 로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
        case .invalidURL:
            return "요청 주소를 만들 수 없습니다."
        case .http(let status, let body):
            if body.contains("Unauthorized") { return "로그인이 만료되었습니다. 다시 로그인해 주세요." }
            return "서버 요청에 실패했습니다. (\(status))"
        }
    }

    var shouldFallbackToWebHome: Bool {
        switch self {
        case .http(let status, _):
            // 네이티브 API가 아직 운영에 배포되지 않았거나 일시 장애인 경우
            // 앱 진입 자체를 막지 말고 기존 WebView 홈으로 돌린다.
            return status == 404 || status >= 500
        case .missingSession, .sessionTemporarilyUnavailable, .invalidURL:
            return false
        }
    }
}
