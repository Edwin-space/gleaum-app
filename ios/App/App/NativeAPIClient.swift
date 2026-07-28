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

    func updateProfile(
        displayName: String,
        realName: String?,
        nameDisplayMode: String
    ) async throws -> NativeProfileSummary {
        let data = try await performAuthorizedRequest(
            path: "/api/native/profile",
            method: "PATCH",
            body: try JSONEncoder().encode(
                NativeProfileUpdateRequest(
                    displayName: displayName,
                    realName: realName ?? "",
                    nameDisplayMode: nameDisplayMode
                )
            )
        )
        return try JSONDecoder().decode(NativeProfileResponse.self, from: data).profile
    }

    func updatePassword(_ password: String) async throws {
        _ = try await performAuthorizedRequest(
            path: "/api/native/security/password",
            method: "PATCH",
            body: try JSONEncoder().encode(
                NativePasswordUpdateRequest(password: password)
            )
        )
    }

    func fetchAccountStatus() async throws -> NativeAccountStatus {
        let data = try await performAuthorizedRequest(
            path: "/api/account/status",
            method: "GET"
        )
        return try JSONDecoder().decode(NativeAccountStatus.self, from: data)
    }

    func requestWithdrawal(reason: String?) async throws -> NativeAccountActionResponse {
        let data = try await performAuthorizedRequest(
            path: "/api/account/withdraw",
            method: "POST",
            body: try JSONEncoder().encode(NativeWithdrawalRequest(reason: reason))
        )
        return try JSONDecoder().decode(NativeAccountActionResponse.self, from: data)
    }

    func restoreWithdrawal() async throws -> NativeAccountActionResponse {
        let data = try await performAuthorizedRequest(
            path: "/api/account/restore",
            method: "POST"
        )
        return try JSONDecoder().decode(NativeAccountActionResponse.self, from: data)
    }

    func updateNotificationSettings(
        _ settings: NativeNotificationSettings
    ) async throws -> NativeProfileSummary {
        let data = try await performAuthorizedRequest(
            path: "/api/native/profile",
            method: "PATCH",
            body: try JSONEncoder().encode(
                NativeNotificationSettingsUpdateRequest(notificationSettings: settings)
            )
        )
        return try JSONDecoder().decode(NativeProfileResponse.self, from: data).profile
    }

    func fetchNotifications() async throws -> NativeNotificationSummary {
        let data = try await performAuthorizedRequest(
            path: "/api/native/notifications",
            method: "GET"
        )
        return try JSONDecoder().decode(NativeNotificationSummary.self, from: data)
    }

    func markNotificationRead(id: String) async throws {
        _ = try await performAuthorizedRequest(
            path: "/api/native/notifications/\(id)",
            method: "PATCH"
        )
    }

    func markAllNotificationsRead() async throws {
        _ = try await performAuthorizedRequest(
            path: "/api/native/notifications",
            method: "PATCH"
        )
    }

    func registerPushToken(_ token: String) async throws {
        _ = try await performAuthorizedRequest(
            path: "/api/push/register-token",
            method: "POST",
            body: try JSONEncoder().encode(
                NativePushTokenRequest(token: token, platform: "ios")
            )
        )
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

    func fetchBudgetSummary(month: String? = nil) async throws -> NativeBudgetSummary {
        let query = month.map { "?month=\($0)" } ?? ""
        let data = try await performAuthorizedRequest(
            path: "/api/native/budget/summary\(query)",
            method: "GET"
        )
        return try JSONDecoder().decode(NativeBudgetSummary.self, from: data)
    }

    func fetchLedgerEntry(id: String) async throws -> NativeLedgerItem {
        let data = try await performAuthorizedRequest(
            path: "/api/native/budget/entries/\(id)",
            method: "GET"
        )
        return try JSONDecoder().decode(NativeLedgerResponse.self, from: data).entry
    }

    func createLedgerEntry(
        _ payload: NativeCreateLedgerRequest
    ) async throws -> NativeLedgerItem {
        let data = try await performAuthorizedRequest(
            path: "/api/native/budget/entries",
            method: "POST",
            body: try JSONEncoder().encode(payload)
        )
        return try JSONDecoder().decode(NativeLedgerResponse.self, from: data).entry
    }

    func updateLedgerEntry(
        id: String,
        payload: NativeUpdateLedgerRequest
    ) async throws -> NativeLedgerItem {
        let data = try await performAuthorizedRequest(
            path: "/api/native/budget/entries/\(id)",
            method: "PATCH",
            body: try JSONEncoder().encode(payload)
        )
        return try JSONDecoder().decode(NativeLedgerResponse.self, from: data).entry
    }

    func deleteLedgerEntry(id: String) async throws {
        _ = try await performAuthorizedRequest(
            path: "/api/native/budget/entries/\(id)",
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

    func fetchFamilyDependents(spaceId: String) async throws -> [NativeFamilyDependent] {
        guard let encodedSpaceId = spaceId.addingPercentEncoding(
            withAllowedCharacters: .urlQueryAllowed
        ) else {
            throw NativeAPIError.invalidURL
        }
        let data = try await performAuthorizedRequest(
            path: "/api/spaces/children?spaceId=\(encodedSpaceId)",
            method: "GET"
        )
        return try JSONDecoder().decode(
            NativeFamilyDependentsResponse.self,
            from: data
        ).dependents
    }

    func createFamilyDependent(
        spaceId: String,
        displayName: String,
        birthDate: String,
        expectedEmail: String?,
        relationshipType: String
    ) async throws -> NativeCreateFamilyDependentResponse {
        let data = try await performAuthorizedRequest(
            path: "/api/spaces/children",
            method: "POST",
            body: try JSONEncoder().encode(
                NativeCreateFamilyDependentRequest(
                    spaceId: spaceId,
                    displayName: displayName,
                    birthDate: birthDate,
                    expectedEmail: expectedEmail,
                    relationshipType: relationshipType
                )
            )
        )
        return try JSONDecoder().decode(NativeCreateFamilyDependentResponse.self, from: data)
    }

    func startGuardianVerification(
        for dependent: NativeFamilyDependent
    ) async throws -> NativeGuardianChallenge {
        let data = try await performAuthorizedRequest(
            path: "/api/spaces/children/\(dependent.id)/guardian-verification/start",
            method: "POST"
        )
        let response = try JSONDecoder().decode(NativeGuardianChallengeResponse.self, from: data)
        return NativeGuardianChallenge(
            dependentId: dependent.id,
            displayName: dependent.displayName,
            email: response.email,
            challengeToken: response.challengeToken,
            expiresAt: response.expiresAt
        )
    }

    func verifyGuardianOTP(challengeToken: String, code: String) async throws {
        _ = try await performAuthorizedRequest(
            path: "/api/spaces/children/guardian-verification/verify-otp",
            method: "POST",
            body: try JSONEncoder().encode(
                NativeGuardianOTPRequest(
                    challengeToken: challengeToken,
                    code: code
                )
            )
        )
    }

    func completeGuardianConsent(challengeToken: String) async throws {
        _ = try await performAuthorizedRequest(
            path: "/api/spaces/children/guardian-verification/complete",
            method: "POST",
            body: try JSONEncoder().encode(
                NativeGuardianConsentRequest(
                    token: challengeToken,
                    consentTypes: [
                        "service_registration",
                        "personal_data_processing",
                        "family_data_sharing",
                    ]
                )
            )
        )
    }

    func createChildInvitation(dependentId: String) async throws -> NativeChildInvitation {
        let data = try await performAuthorizedRequest(
            path: "/api/spaces/children/\(dependentId)/invite",
            method: "POST"
        )
        return try JSONDecoder().decode(NativeChildInvitation.self, from: data)
    }

    func approveChildLink(dependentId: String) async throws {
        _ = try await performAuthorizedRequest(
            path: "/api/spaces/children/\(dependentId)/approve",
            method: "POST"
        )
    }

    func rejectChildLink(dependentId: String) async throws {
        _ = try await performAuthorizedRequest(
            path: "/api/spaces/children/\(dependentId)/reject",
            method: "POST"
        )
    }

    func claimChildInvitation(token: String) async throws {
        _ = try await performAuthorizedRequest(
            path: "/api/spaces/children/invitations/claim",
            method: "POST",
            body: try JSONEncoder().encode(NativeChildInvitationClaimRequest(token: token))
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
                return "제목을 입력해 주세요."
            }
            if body.contains("amount_required") {
                return "0원보다 큰 금액을 입력해 주세요."
            }
            if body.contains("invalid_occurred_at") {
                return "거래 날짜를 다시 확인해 주세요."
            }
            if body.contains("personal_space_required") {
                return "개인 가계부 공간을 찾지 못했습니다."
            }
            if body.contains("ledger_entry_not_found") {
                return "가계부 내역을 찾을 수 없습니다."
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
            if body.contains("display_name_required") {
                return "앱에서 사용할 이름을 입력해 주세요."
            }
            if body.contains("display_name_too_long") {
                return "앱에서 사용할 이름은 24자 이내로 입력해 주세요."
            }
            if body.contains("invalid_name_display_mode") {
                return "이름 표시 방식을 다시 선택해 주세요."
            }
            if body.contains("password_too_short") {
                return "비밀번호는 6자 이상 입력해 주세요."
            }
            if body.contains("password_too_long") {
                return "비밀번호는 72자 이내로 입력해 주세요."
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
            if body.contains("family_space_required") {
                return "가족 공간에서만 자녀 계정을 연결할 수 있습니다."
            }
            if body.contains("guardian_email_cannot_be_child_email") {
                return "보호자 이메일은 자녀 계정 제한값으로 사용할 수 없습니다."
            }
            if body.contains("expected_email_already_registered") {
                return "이미 등록된 자녀 이메일입니다."
            }
            if body.contains("invalid_expected_email") {
                return "연결 허용 이메일 형식을 확인해 주세요."
            }
            if body.contains("invalid_dependent_profile") {
                return "자녀 이름과 생년월일을 다시 확인해 주세요."
            }
            if body.contains("verification_rate_limited") {
                return "확인 코드는 1분 후 다시 요청할 수 있습니다."
            }
            if body.contains("verified_guardian_email_required") {
                return "이메일 확인이 완료된 보호자 계정이 필요합니다."
            }
            if body.contains("invalid_verification_code") {
                return "8자리 확인 코드가 올바르지 않습니다."
            }
            if body.contains("verification_expired") {
                return "확인 코드가 만료되었습니다. 새 코드를 받아 주세요."
            }
            if body.contains("guardian_verification_required")
                || body.contains("verified_guardian_consent_required")
                || body.contains("email_otp_verification_required") {
                return "보호자 이메일 확인과 필수 동의를 먼저 완료해 주세요."
            }
            if body.contains("required_consents_missing") {
                return "필수 동의 항목을 모두 확인해 주세요."
            }
            if body.contains("invited_email_mismatch") {
                return "초대에 지정된 이메일과 현재 로그인 계정이 다릅니다."
            }
            if body.contains("guardian_account_cannot_claim_child_invitation") {
                return "보호자 계정으로는 자녀 초대를 수락할 수 없습니다."
            }
            if body.contains("expired_invitation") {
                return "초대 링크가 만료되었습니다. 보호자에게 새 링크를 요청해 주세요."
            }
            if body.contains("invalid_or_used_invitation")
                || body.contains("invalid_invitation") {
                return "이미 사용되었거나 유효하지 않은 초대 링크입니다."
            }
            if body.contains("existing_space_member_requires_conversion") {
                return "이미 공간 멤버인 계정은 자녀 계정으로 바로 전환할 수 없습니다."
            }
            if body.contains("child_link_not_pending") {
                return "현재 승인 대기 중인 연결 요청이 없습니다."
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
