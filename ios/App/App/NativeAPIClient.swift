import Foundation

final class NativeAPIClient {
    static let shared = NativeAPIClient()

    private let baseURL = URL(string: "https://www.gleaum.com")!
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    private init() {}

    func fetchHomeSummary() async throws -> NativeHomeSummary {
        let request = try authorizedRequest(path: "/api/native/home-summary", method: "GET")
        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)
        return try decoder.decode(NativeHomeSummary.self, from: data)
    }

    func createSchedule(_ payload: NativeCreateScheduleRequest) async throws -> NativeScheduleItem {
        var request = try authorizedRequest(path: "/api/native/schedules", method: "POST")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)
        return try decoder.decode(NativeCreateScheduleResponse.self, from: data).schedule
    }

    private func authorizedRequest(path: String, method: String) throws -> URLRequest {
        guard let token = SessionManager.shared.accessToken() else {
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
    case invalidURL
    case http(status: Int, body: String)

    var errorDescription: String? {
        switch self {
        case .missingSession:
            return "로그인 세션을 찾을 수 없습니다. 다시 로그인해 주세요."
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
        case .missingSession, .invalidURL:
            return false
        }
    }
}
