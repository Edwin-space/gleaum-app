import SwiftUI
import UIKit

struct IOSChildRegistrationNavigationView: View {
    let spaceId: String
    let onCreated: () async -> Void

    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    IOSChildRegistrationView(spaceId: spaceId, onCreated: onCreated)
                }
            } else {
                NavigationView {
                    IOSChildRegistrationView(spaceId: spaceId, onCreated: onCreated)
                }
                .navigationViewStyle(.stack)
            }
        }
    }
}

private struct IOSChildRegistrationView: View {
    let spaceId: String
    let onCreated: () async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var displayName = ""
    @State private var birthDate = Calendar.current.date(
        byAdding: .year,
        value: -10,
        to: Date()
    ) ?? Date()
    @State private var expectedEmail = ""
    @State private var relationshipType = "parent"
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        Form {
            Section {
                TextField("자녀 이름", text: $displayName)
                    .textContentType(.name)
                DatePicker(
                    "생년월일",
                    selection: $birthDate,
                    in: IOSFamilyChildFormat.minimumBirthDate...Date(),
                    displayedComponents: .date
                )
            } header: {
                Text("기본 정보")
            }

            Section {
                TextField("이메일 주소", text: $expectedEmail)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            } header: {
                Text("연결 허용 이메일 (선택)")
            } footer: {
                Text("모르면 비워 두세요. 입력한 경우 해당 이메일 계정만 초대를 수락할 수 있습니다.")
            }

            Section {
                Picker("보호자 관계", selection: $relationshipType) {
                    Text("부모").tag("parent")
                    Text("법정대리인").tag("guardian")
                }
                .pickerStyle(.segmented)
            }

            if let errorMessage {
                Section {
                    Label(errorMessage, systemImage: "exclamationmark.circle")
                        .foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("자녀 정보 등록")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("취소") { dismiss() }
                    .disabled(isSaving)
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("등록") {
                    Task { await save() }
                }
                .disabled(!canSave || isSaving)
            }
        }
        .interactiveDismissDisabled(isSaving)
        .overlay {
            if isSaving {
                ProgressView()
                    .padding(16)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            }
        }
    }

    private var canSave: Bool {
        let name = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        let email = expectedEmail.trimmingCharacters(in: .whitespacesAndNewlines)
        return !name.isEmpty
            && name.count <= 40
            && (email.isEmpty || IOSFamilyChildFormat.isValidEmail(email))
    }

    private func save() async {
        guard canSave else { return }
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }
        do {
            let email = expectedEmail.trimmingCharacters(in: .whitespacesAndNewlines)
            _ = try await NativeAPIClient.shared.createFamilyDependent(
                spaceId: spaceId,
                displayName: displayName.trimmingCharacters(in: .whitespacesAndNewlines),
                birthDate: IOSFamilyChildFormat.apiDate(birthDate),
                expectedEmail: email.isEmpty ? nil : email,
                relationshipType: relationshipType
            )
            await onCreated()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct IOSGuardianVerificationNavigationView: View {
    let dependent: NativeFamilyDependent
    let initialChallenge: NativeGuardianChallenge
    let onCompleted: () async -> Void

    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    IOSGuardianVerificationView(
                        dependent: dependent,
                        initialChallenge: initialChallenge,
                        onCompleted: onCompleted
                    )
                }
            } else {
                NavigationView {
                    IOSGuardianVerificationView(
                        dependent: dependent,
                        initialChallenge: initialChallenge,
                        onCompleted: onCompleted
                    )
                }
                .navigationViewStyle(.stack)
            }
        }
    }
}

private struct IOSGuardianVerificationView: View {
    private enum Phase {
        case otp
        case consent
    }

    let dependent: NativeFamilyDependent
    let onCompleted: () async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var challenge: NativeGuardianChallenge
    @State private var phase: Phase = .otp
    @State private var code = ""
    @State private var serviceConsent = false
    @State private var privacyConsent = false
    @State private var sharingConsent = false
    @State private var isBusy = false
    @State private var errorMessage: String?
    @State private var legalDocument: IOSLegalDocument?

    init(
        dependent: NativeFamilyDependent,
        initialChallenge: NativeGuardianChallenge,
        onCompleted: @escaping () async -> Void
    ) {
        self.dependent = dependent
        self.onCompleted = onCompleted
        _challenge = State(initialValue: initialChallenge)
    }

    var body: some View {
        Form {
            if phase == .otp {
                otpSections
            } else {
                consentSections
            }

            if let errorMessage {
                Section {
                    Label(errorMessage, systemImage: "exclamationmark.circle")
                        .foregroundStyle(.red)
                }
            }
        }
        .navigationTitle(phase == .otp ? "보호자 이메일 확인" : "보호자 필수 동의")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("닫기") { dismiss() }
                    .disabled(isBusy)
            }
        }
        .interactiveDismissDisabled(isBusy)
        .overlay {
            if isBusy {
                ProgressView()
                    .padding(16)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            }
        }
        .fullScreenCover(item: $legalDocument) { document in
            IOSLegalDocumentContainer(document: document)
                .ignoresSafeArea()
        }
    }

    @ViewBuilder
    private var otpSections: some View {
        Section {
            Label(challenge.email, systemImage: "envelope")
            TextField("8자리 확인 코드", text: $code)
                .keyboardType(.numberPad)
                .textContentType(.oneTimeCode)
                .onChange(of: code) { value in
                    let filtered = value.filter(\.isNumber)
                    code = String(filtered.prefix(8))
                }
        } header: {
            Text("\(dependent.displayName) 보호자 확인")
        } footer: {
            Text("보호자 로그인 이메일로 보낸 8자리 코드를 입력해 주세요.")
        }

        Section {
            Button("코드 확인") {
                Task { await verifyCode() }
            }
            .disabled(code.count != 8 || isBusy)

            Button("확인 코드 다시 보내기") {
                Task { await resendCode() }
            }
            .disabled(isBusy)
        }
    }

    @ViewBuilder
    private var consentSections: some View {
        Section {
            IOSGuardianConsentToggle(
                isOn: $serviceConsent,
                title: "서비스 가입 및 이용",
                message: "자녀 계정 생성과 연령 기반 기능 제한에 동의합니다."
            )
            IOSGuardianConsentToggle(
                isOn: $privacyConsent,
                title: "개인정보 처리",
                message: "자녀 정보와 연결 계정 식별정보 처리에 동의합니다."
            )
            IOSGuardianConsentToggle(
                isOn: $sharingConsent,
                title: "가족 공간 정보 공유",
                message: "허용된 일정과 활동 정보를 가족 구성원에게 공유하는 데 동의합니다."
            )
        } header: {
            Text("필수 동의")
        } footer: {
            Text("위치 정보는 포함되지 않습니다. 별도 기능과 동의가 마련되기 전에는 수집하지 않습니다.")
        }

        Section("문서 확인") {
            Button("이용약관 보기") { legalDocument = .terms }
            Button("개인정보처리방침 보기") { legalDocument = .privacy }
        }

        Section {
            Button("동의하고 계속") {
                Task { await completeConsent() }
            }
            .disabled(!hasAllConsents || isBusy)
        }
    }

    private var hasAllConsents: Bool {
        serviceConsent && privacyConsent && sharingConsent
    }

    private func verifyCode() async {
        guard code.count == 8 else { return }
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }
        do {
            try await NativeAPIClient.shared.verifyGuardianOTP(
                challengeToken: challenge.challengeToken,
                code: code
            )
            phase = .consent
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func resendCode() async {
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }
        do {
            challenge = try await NativeAPIClient.shared.startGuardianVerification(for: dependent)
            code = ""
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func completeConsent() async {
        guard hasAllConsents else { return }
        isBusy = true
        errorMessage = nil
        do {
            try await NativeAPIClient.shared.completeGuardianConsent(
                challengeToken: challenge.challengeToken
            )
            await onCompleted()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
            isBusy = false
        }
    }
}

private struct IOSGuardianConsentToggle: View {
    @Binding var isOn: Bool
    let title: String
    let message: String

    var body: some View {
        Toggle(isOn: $isOn) {
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.body)
                Text(message)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .toggleStyle(.switch)
    }
}

struct IOSChildClaimNavigationView: View {
    let invitationToken: String
    let signedInEmail: String?

    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    IOSChildClaimView(
                        invitationToken: invitationToken,
                        signedInEmail: signedInEmail
                    )
                }
            } else {
                NavigationView {
                    IOSChildClaimView(
                        invitationToken: invitationToken,
                        signedInEmail: signedInEmail
                    )
                }
                .navigationViewStyle(.stack)
            }
        }
    }
}

private struct IOSChildClaimView: View {
    let invitationToken: String
    let signedInEmail: String?

    @Environment(\.dismiss) private var dismiss
    @State private var isSubmitting = false
    @State private var isCompleted = false
    @State private var errorMessage: String?

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 12) {
                    Image(systemName: isCompleted ? "checkmark.shield.fill" : "figure.and.child.holdinghands")
                        .font(.system(size: 34))
                        .foregroundStyle(Color(uiColor: GleaumUIColor.brandTeal))
                    Text(isCompleted ? "보호자 승인을 기다리고 있어요" : "가족 공간 초대가 도착했어요")
                        .font(.title2.bold())
                    Text(
                        isCompleted
                            ? "연결 요청이 보호자에게 전달되었습니다. 보호자가 계정을 확인하고 승인하면 가족 공간을 사용할 수 있습니다."
                            : "현재 로그인한 계정으로 연결을 요청합니다. 보호자 최종 승인 전에는 가족 공간 정보에 접근할 수 없습니다."
                    )
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.vertical, 8)
            }

            if let signedInEmail, !signedInEmail.isEmpty {
                Section("연결할 계정") {
                    Label(signedInEmail, systemImage: "person.crop.circle")
                }
            }

            Section {
                Label("이 링크는 한 번만 사용할 수 있습니다.", systemImage: "link.badge.plus")
                Label("승인 전에는 공간 정보가 공개되지 않습니다.", systemImage: "lock")
            } header: {
                Text("안전한 연결")
            }

            if let errorMessage {
                Section {
                    Label(errorMessage, systemImage: "exclamationmark.circle")
                        .foregroundStyle(.red)
                }
            }

            if !isCompleted {
                Section {
                    Button("이 계정으로 연결 요청") {
                        Task { await claim() }
                    }
                    .disabled(isSubmitting)
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("자녀 계정 연결")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button(isCompleted ? "완료" : "닫기") { dismiss() }
                    .disabled(isSubmitting)
            }
        }
        .overlay {
            if isSubmitting {
                ProgressView("연결 요청 중이에요")
            }
        }
    }

    private func claim() async {
        guard !invitationToken.isEmpty else {
            errorMessage = "유효하지 않은 초대 링크입니다."
            return
        }
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }
        do {
            try await NativeAPIClient.shared.claimChildInvitation(token: invitationToken)
            isCompleted = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct IOSGuardianConsentEntryNavigationView: View {
    let challengeToken: String

    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    IOSGuardianConsentEntryView(challengeToken: challengeToken)
                }
            } else {
                NavigationView {
                    IOSGuardianConsentEntryView(challengeToken: challengeToken)
                }
                .navigationViewStyle(.stack)
            }
        }
    }
}

private struct IOSGuardianConsentEntryView: View {
    let challengeToken: String

    @Environment(\.dismiss) private var dismiss
    @State private var serviceConsent = false
    @State private var privacyConsent = false
    @State private var sharingConsent = false
    @State private var isSubmitting = false
    @State private var errorMessage: String?
    @State private var legalDocument: IOSLegalDocument?

    var body: some View {
        Form {
            Section {
                IOSGuardianConsentToggle(
                    isOn: $serviceConsent,
                    title: "서비스 가입 및 이용",
                    message: "자녀 계정 생성과 연령 기반 기능 제한에 동의합니다."
                )
                IOSGuardianConsentToggle(
                    isOn: $privacyConsent,
                    title: "개인정보 처리",
                    message: "자녀 정보와 연결 계정 식별정보 처리에 동의합니다."
                )
                IOSGuardianConsentToggle(
                    isOn: $sharingConsent,
                    title: "가족 공간 정보 공유",
                    message: "허용된 일정과 활동 정보를 가족 구성원에게 공유하는 데 동의합니다."
                )
            } header: {
                Text("보호자 필수 동의")
            }

            Section("문서 확인") {
                Button("이용약관 보기") { legalDocument = .terms }
                Button("개인정보처리방침 보기") { legalDocument = .privacy }
            }

            Section {
                Button("동의하고 계속") {
                    Task { await complete() }
                }
                .disabled(!hasAllConsents || isSubmitting)
            }

            if let errorMessage {
                Section {
                    Label(errorMessage, systemImage: "exclamationmark.circle")
                        .foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("보호자 확인")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("닫기") { dismiss() }
                    .disabled(isSubmitting)
            }
        }
        .fullScreenCover(item: $legalDocument) { document in
            IOSLegalDocumentContainer(document: document)
                .ignoresSafeArea()
        }
    }

    private var hasAllConsents: Bool {
        serviceConsent && privacyConsent && sharingConsent
    }

    private func complete() async {
        guard hasAllConsents, !challengeToken.isEmpty else { return }
        isSubmitting = true
        errorMessage = nil
        do {
            try await NativeAPIClient.shared.completeGuardianConsent(
                challengeToken: challengeToken
            )
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
            isSubmitting = false
        }
    }
}

enum IOSFamilyChildFormat {
    static let minimumBirthDate = Calendar(identifier: .gregorian).date(
        from: DateComponents(year: 1900, month: 1, day: 1)
    ) ?? Date(timeIntervalSince1970: 0)

    static func statusTitle(_ status: String) -> String {
        switch status {
        case "consent_pending": return "보호자 확인 필요"
        case "ready": return "초대 준비 완료"
        case "invited": return "초대 발급됨"
        case "approval_pending": return "최종 승인 대기"
        case "linked": return "연결 완료"
        case "suspended": return "이용 중지"
        default: return "연결 해제"
        }
    }

    static func statusMessage(_ status: String) -> String {
        switch status {
        case "consent_pending":
            return "이메일 코드 확인과 필수 동의를 진행해 주세요."
        case "ready":
            return "자녀에게 보낼 72시간 일회성 초대를 만들 수 있습니다."
        case "invited":
            return "필요하면 기존 링크를 폐기하고 새 링크를 공유할 수 있습니다."
        case "approval_pending":
            return "연결 요청 계정을 확인한 뒤 승인하거나 거절해 주세요."
        case "linked":
            return "가족 공간 멤버로 안전하게 연결되었습니다."
        case "suspended":
            return "자녀 계정 이용이 일시 중지되었습니다."
        default:
            return "자녀 계정 연결이 해제되었습니다."
        }
    }

    static func primaryActionTitle(_ status: String) -> String? {
        switch status {
        case "consent_pending": return "내 이메일로 보호자 확인"
        case "ready", "invited": return "일회성 초대 링크 공유"
        case "approval_pending": return "최종 승인"
        default: return nil
        }
    }

    static func apiDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }

    static func birthDate(_ raw: String) -> String {
        let input = DateFormatter()
        input.calendar = Calendar(identifier: .gregorian)
        input.locale = Locale(identifier: "en_US_POSIX")
        input.timeZone = TimeZone(secondsFromGMT: 0)
        input.dateFormat = "yyyy-MM-dd"
        guard let date = input.date(from: raw) else { return raw }

        let output = DateFormatter()
        output.locale = Locale(identifier: "ko_KR")
        output.dateStyle = .medium
        return output.string(from: date)
    }

    static func isValidEmail(_ value: String) -> Bool {
        value.range(
            of: #"^[^\s@]+@[^\s@]+\.[^\s@]+$"#,
            options: .regularExpression
        ) != nil
    }
}
