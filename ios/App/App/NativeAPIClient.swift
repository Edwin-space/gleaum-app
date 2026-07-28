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

    func fetchProfile() async throws -> NativeProfileSummary {
        let data = try await performAuthorizedRequest(
            path: "/api/native/profile",
            method: "GET"
        )
        return try JSONDecoder().decode(NativeProfileResponse.self, from: data).profile
    }

    func completeOnboarding(
        _ payload: NativeCompleteOnboardingRequest
    ) async throws -> NativeProfileSummary {
        let data = try await performAuthorizedRequest(
            path: "/api/native/onboarding/complete",
            method: "POST",
            body: try JSONEncoder().encode(payload)
        )
        return try JSONDecoder().decode(NativeProfileResponse.self, from: data).profile
    }

    func fetchSchedules() async throws -> [NativeScheduleItem] {
        let data = try await performAuthorizedRequest(
            path: "/api/native/schedules",
            method: "GET"
        )
        return try JSONDecoder().decode(NativeSchedulesResponse.self, from: data).schedules
    }

    func fetchSchedule(id: String) async throws -> NativeScheduleItem {
        let data = try await performAuthorizedRequest(
            path: "/api/native/schedules/\(id)",
            method: "GET"
        )
        return try JSONDecoder().decode(NativeScheduleResponse.self, from: data).schedule
    }

    func createSchedule(_ payload: NativeCreateScheduleRequest) async throws -> NativeScheduleItem {
        let data = try await performAuthorizedRequest(
            path: "/api/native/schedules",
            method: "POST",
            body: try JSONEncoder().encode(payload)
        )
        return try JSONDecoder().decode(NativeScheduleResponse.self, from: data).schedule
    }

    func updateSchedule(
        id: String,
        payload: NativeUpdateScheduleRequest
    ) async throws -> NativeScheduleItem {
        let data = try await performAuthorizedRequest(
            path: "/api/native/schedules/\(id)",
            method: "PATCH",
            body: try JSONEncoder().encode(payload)
        )
        return try JSONDecoder().decode(NativeScheduleResponse.self, from: data).schedule
    }

    func deleteSchedule(id: String) async throws {
        _ = try await performAuthorizedRequest(
            path: "/api/native/schedules/\(id)",
            method: "DELETE"
        )
    }

    func fetchSpaceSummary() async throws -> NativeSpaceSummary {
        let data = try await performAuthorizedRequest(
            path: "/api/native/spaces/summary",
            method: "GET"
        )
        return try JSONDecoder().decode(NativeSpaceSummary.self, from: data)
    }

    func createSpace(name: String) async throws -> NativeSpaceSummary {
        try await performSpaceMutation(
            path: "/api/native/spaces",
            method: "POST",
            payload: NativeSpaceNameRequest(name: name)
        )
    }

    func joinSpace(code: String) async throws -> NativeSpaceSummary {
        try await performSpaceMutation(
            path: "/api/native/spaces/join",
            method: "POST",
            payload: NativeSpaceJoinRequest(code: code)
        )
    }

    func activateSpace(id: String) async throws -> NativeSpaceSummary {
        try await performSpaceMutation(
            path: "/api/native/spaces/\(id)/activate",
            method: "POST"
        )
    }

    func updateSpaceName(id: String, name: String) async throws -> NativeSpaceSummary {
        try await performSpaceMutation(
            path: "/api/native/spaces/\(id)",
            method: "PATCH",
            payload: NativeSpaceNameRequest(name: name)
        )
    }

    func regenerateInviteCode(spaceId: String) async throws -> NativeSpaceSummary {
        try await performSpaceMutation(
            path: "/api/native/spaces/\(spaceId)/invite-code",
            method: "POST"
        )
    }

    func createSpacePost(spaceId: String, content: String) async throws -> NativeSpaceSummary {
        try await performSpaceMutation(
            path: "/api/native/spaces/\(spaceId)/posts",
            method: "POST",
            payload: NativeSpacePostRequest(content: content)
        )
    }

    func updateSpaceMemberRole(
        spaceId: String,
        userId: String,
        role: String
    ) async throws -> NativeSpaceSummary {
        try await performSpaceMutation(
            path: "/api/native/spaces/\(spaceId)/members/\(userId)",
            method: "PATCH",
            payload: NativeSpaceMemberUpdateRequest(role: role, familyRole: nil)
        )
    }

    func updateSpaceMemberFamilyRole(
        spaceId: String,
        userId: String,
        familyRole: String
    ) async throws -> NativeSpaceSummary {
        try await performSpaceMutation(
            path: "/api/native/spaces/\(spaceId)/members/\(userId)",
            method: "PATCH",
            payload: NativeSpaceMemberUpdateRequest(role: nil, familyRole: familyRole)
        )
    }

    func removeSpaceMember(spaceId: String, userId: String) async throws -> NativeSpaceSummary {
        try await performSpaceMutation(
            path: "/api/native/spaces/\(spaceId)/members/\(userId)",
            method: "DELETE"
        )
    }

    func convertSpaceToFamily(id: String) async throws -> NativeSpaceSummary {
        try await performSpaceMutation(
            path: "/api/native/spaces/\(id)/family",
            method: "POST"
        )
    }

    func deleteSpace(id: String) async throws -> NativeSpaceSummary {
        try await performSpaceMutation(
            path: "/api/native/spaces/\(id)",
            method: "DELETE"
        )
    }

    private func performSpaceMutation<Payload: Encodable>(
        path: String,
        method: String,
        payload: Payload
    ) async throws -> NativeSpaceSummary {
        let data = try await performAuthorizedRequest(
            path: path,
            method: method,
            body: try JSONEncoder().encode(payload)
        )
        return try JSONDecoder().decode(NativeSpaceSummary.self, from: data)
    }

    private func performSpaceMutation(
        path: String,
        method: String
    ) async throws -> NativeSpaceSummary {
        let data = try await performAuthorizedRequest(path: path, method: method)
        return try JSONDecoder().decode(NativeSpaceSummary.self, from: data)
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
            if body.contains("Unauthorized") {
                return "로그인이 만료되었습니다. 다시 로그인해 주세요."
            }
            if body.contains("title_required") {
                return "일정 제목을 입력해 주세요."
            }
            if body.contains("invalid_start_time") || body.contains("invalid_end_time") {
                return "일정 날짜와 시간을 다시 확인해 주세요."
            }
            if body.contains("space_required") {
                return "일정을 저장할 공간을 찾지 못했습니다."
            }
            if body.contains("space_editor_required") {
                return "공유 일정은 공간 운영자 이상만 변경할 수 있어요."
            }
            if body.contains("schedule_not_found") {
                return "일정을 찾을 수 없습니다."
            }
            if body.contains("space_name_required") {
                return "공간 이름을 입력해 주세요."
            }
            if body.contains("space_name_too_long") {
                return "공간 이름은 40자 이내로 입력해 주세요."
            }
            if body.contains("shared_space_limit_reached") {
                return "무료 계정은 공유 공간을 최대 2개까지 사용할 수 있어요."
            }
            if body.contains("space_access_denied") || body.contains("space_admin_required") {
                return "이 공간을 관리할 권한이 없습니다."
            }
            if body.contains("personal_space_locked") {
                return "개인 공간에서는 이 작업을 할 수 없어요."
            }
            if body.contains("invite_code_required") {
                return "초대 코드를 입력해 주세요."
            }
            if body.contains("invalid_code") {
                return "유효한 초대 코드를 찾을 수 없습니다."
            }
            if body.contains("expired_code") {
                return "만료된 초대 코드입니다. 공간 지기에게 새 코드를 요청해 주세요."
            }
            if body.contains("content_required") {
                return "공간에 공유할 내용을 입력해 주세요."
            }
            if body.contains("content_too_long") {
                return "소식은 2,000자 이내로 작성해 주세요."
            }
            if body.contains("space_has_other_members") {
                return "다른 멤버가 있는 공간은 바로 삭제할 수 없습니다."
            }
            if body.contains("family_space_has_dependents") {
                return "연결된 가족 구성원이 있어 공간을 삭제할 수 없습니다."
            }
            if body.contains("cannot_remove_self") {
                return "공간 지기 본인은 멤버 목록에서 제거할 수 없습니다."
            }
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
