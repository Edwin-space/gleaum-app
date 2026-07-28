import SwiftUI
import UIKit

struct IOSProfileEditNavigationView: View {
    let profile: NativeProfileSummary
    let onSaved: (NativeProfileSummary) -> Void

    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    IOSProfileEditView(profile: profile, onSaved: onSaved)
                }
            } else {
                NavigationView {
                    IOSProfileEditView(profile: profile, onSaved: onSaved)
                }
                .navigationViewStyle(.stack)
            }
        }
    }
}

private struct IOSProfileEditView: View {
    let profile: NativeProfileSummary
    let onSaved: (NativeProfileSummary) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var displayName: String
    @State private var realName: String
    @State private var nameDisplayMode: String
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(
        profile: NativeProfileSummary,
        onSaved: @escaping (NativeProfileSummary) -> Void
    ) {
        self.profile = profile
        self.onSaved = onSaved
        _displayName = State(initialValue: profile.displayName)
        _realName = State(initialValue: profile.realName ?? "")
        _nameDisplayMode = State(initialValue: profile.nameDisplayMode)
    }

    var body: some View {
        Form {
            Section {
                HStack {
                    Spacer()
                    IOSProfileAvatar(profile: profile, size: 82)
                    Spacer()
                }
                .listRowBackground(Color.clear)
            }

            Section {
                TextField("닉네임", text: $displayName)
                    .textContentType(.nickname)
                    .submitLabel(.done)
                TextField("실명 (선택)", text: $realName)
                    .textContentType(.name)
                    .submitLabel(.done)
            } header: {
                Text("이름")
            } footer: {
                Text("닉네임은 최대 24자까지 입력할 수 있습니다.")
            }

            Section {
                Picker("앱에서 부르는 이름", selection: $nameDisplayMode) {
                    Text("닉네임").tag("nickname")
                    Text("실명").tag("real_name")
                }
                .pickerStyle(.inline)
            } footer: {
                if nameDisplayMode == "real_name", realName.trimmed.isEmpty {
                    Text("실명 표시를 선택하려면 실명을 입력해 주세요.")
                        .foregroundStyle(.red)
                } else {
                    Text("일정과 공간에서 본인에게 표시되는 이름 기준입니다.")
                }
            }

            Section {
                HStack {
                    Text("로그인 이메일")
                    Spacer()
                    Text(profile.email)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            } footer: {
                Text("로그인 이메일은 이 화면에서 변경할 수 없습니다.")
            }

            if let errorMessage {
                Section {
                    Label(errorMessage, systemImage: "exclamationmark.circle")
                        .foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("프로필 편집")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("취소") { dismiss() }
                    .disabled(isSaving)
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("저장") {
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
        let nickname = displayName.trimmed
        let real = realName.trimmed
        return !nickname.isEmpty
            && nickname.count <= 24
            && (nameDisplayMode != "real_name" || !real.isEmpty)
    }

    private func save() async {
        guard canSave else { return }
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }
        do {
            let updated = try await NativeAPIClient.shared.updateProfile(
                displayName: displayName.trimmed,
                realName: realName.trimmed.isEmpty ? nil : realName.trimmed,
                nameDisplayMode: nameDisplayMode
            )
            onSaved(updated)
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct IOSAppearanceSettingsView: View {
    @State private var preference = GleaumThemeManager.shared.preference

    static var currentPreferenceTitle: String {
        title(for: GleaumThemeManager.shared.preference)
    }

    var body: some View {
        Form {
            Section {
                Picker("화면 모드", selection: $preference) {
                    Label("시스템 설정", systemImage: "circle.lefthalf.filled")
                        .tag(GleaumThemePreference.system)
                    Label("라이트", systemImage: "sun.max")
                        .tag(GleaumThemePreference.light)
                    Label("다크", systemImage: "moon")
                        .tag(GleaumThemePreference.dark)
                }
                .pickerStyle(.inline)
                .onChange(of: preference) { newValue in
                    GleaumThemeManager.shared.preference = newValue
                }
            } footer: {
                Text("시스템 설정은 iPhone의 화면 모드가 바뀌면 글리움도 함께 변경됩니다.")
            }

            Section {
                HStack(spacing: 12) {
                    IOSAppearancePreview(style: .light)
                    IOSAppearancePreview(style: .dark)
                }
                .padding(.vertical, 8)
                .listRowBackground(Color.clear)
            }
        }
        .navigationTitle("화면 모드")
        .navigationBarTitleDisplayMode(.inline)
    }

    static func title(for preference: GleaumThemePreference) -> String {
        switch preference {
        case .system: return "시스템 설정"
        case .light: return "라이트"
        case .dark: return "다크"
        }
    }
}

private struct IOSAppearancePreview: View {
    let style: ColorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.primary.opacity(0.85))
                .frame(width: 58, height: 7)
            RoundedRectangle(cornerRadius: 3)
                .fill(Color.secondary.opacity(0.35))
                .frame(height: 5)
            HStack(spacing: 5) {
                Circle()
                    .fill(Color(uiColor: GleaumUIColor.brandTeal))
                    .frame(width: 18, height: 18)
                RoundedRectangle(cornerRadius: 5)
                    .fill(Color.secondary.opacity(0.16))
                    .frame(height: 24)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 92, alignment: .topLeading)
        .background(Color(uiColor: GleaumUIColor.surface))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color(uiColor: GleaumUIColor.border), lineWidth: 1)
        )
        .environment(\.colorScheme, style)
        .accessibilityLabel(style == .light ? "라이트 모드 예시" : "다크 모드 예시")
    }
}

struct IOSSecuritySettingsView: View {
    @ObservedObject var security: IOSAppSecurityManager
    @State private var isUpdating = false
    @State private var errorMessage: String?

    var body: some View {
        Form {
            Section {
                Toggle(isOn: enabledBinding) {
                    Label(
                        "\(security.availability.kind.title) 앱 잠금",
                        systemImage: security.availability.kind.symbol
                    )
                }
                .disabled(!security.availability.isAvailable || isUpdating)
            } header: {
                Text("앱 잠금")
            } footer: {
                Text(security.availability.message)
            }

            Section {
                Label("앱을 벗어나면 다시 잠급니다.", systemImage: "lock.rotation")
                Label("인증 정보는 이 iPhone에만 저장됩니다.", systemImage: "iphone")
                Label("실패하면 iPhone 암호를 사용할 수 있습니다.", systemImage: "number.square")
            } header: {
                Text("보호 방식")
            }

            if !security.availability.isAvailable {
                Section {
                    Button("iPhone 설정 열기") {
                        guard let url = URL(string: UIApplication.openSettingsURLString) else {
                            return
                        }
                        UIApplication.shared.open(url)
                    }
                }
            }

            if let errorMessage {
                Section {
                    Label(errorMessage, systemImage: "exclamationmark.circle")
                        .foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("앱 잠금")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            security.refreshAvailability()
        }
        .overlay {
            if isUpdating || security.isAuthenticating {
                ProgressView()
                    .padding(16)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            }
        }
    }

    private var enabledBinding: Binding<Bool> {
        Binding(
            get: { security.isEnabled },
            set: { enabled in
                Task {
                    isUpdating = true
                    errorMessage = nil
                    let success = await security.setEnabled(enabled)
                    if !success {
                        errorMessage = security.availability.isAvailable
                            ? "인증이 완료되지 않아 설정을 변경하지 않았습니다."
                            : security.availability.message
                    }
                    isUpdating = false
                }
            }
        )
    }
}

struct IOSPasswordNavigationView: View {
    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    IOSPasswordView()
                }
            } else {
                NavigationView {
                    IOSPasswordView()
                }
                .navigationViewStyle(.stack)
            }
        }
    }
}

private struct IOSPasswordView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var password = ""
    @State private var confirmation = ""
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showsSuccess = false

    var body: some View {
        Form {
            Section {
                SecureField("새 비밀번호", text: $password)
                    .textContentType(.newPassword)
                SecureField("새 비밀번호 확인", text: $confirmation)
                    .textContentType(.newPassword)
            } header: {
                Text("이메일 로그인 비밀번호")
            } footer: {
                Text("6자 이상 72자 이하로 입력해 주세요.")
            }

            if !confirmation.isEmpty, password != confirmation {
                Section {
                    Label("비밀번호가 서로 일치하지 않습니다.", systemImage: "exclamationmark.circle")
                        .foregroundStyle(.red)
                }
            }

            if let errorMessage {
                Section {
                    Label(errorMessage, systemImage: "exclamationmark.circle")
                        .foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("비밀번호 설정")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("취소") { dismiss() }
                    .disabled(isSaving)
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("변경") {
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
        .alert("비밀번호를 변경했어요", isPresented: $showsSuccess) {
            Button("확인") { dismiss() }
        } message: {
            Text("다음 이메일 로그인부터 새 비밀번호를 사용해 주세요.")
        }
    }

    private var canSave: Bool {
        password.count >= 6
            && password.count <= 72
            && password == confirmation
    }

    private func save() async {
        guard canSave else { return }
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }
        do {
            try await NativeAPIClient.shared.updatePassword(password)
            showsSuccess = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct IOSWithdrawalNavigationView: View {
    let onConfirm: (String?) async -> Bool

    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    IOSWithdrawalView(onConfirm: onConfirm)
                }
            } else {
                NavigationView {
                    IOSWithdrawalView(onConfirm: onConfirm)
                }
                .navigationViewStyle(.stack)
            }
        }
    }
}

private struct IOSWithdrawalView: View {
    let onConfirm: (String?) async -> Bool

    @Environment(\.dismiss) private var dismiss
    @State private var reason = ""
    @State private var hasAcknowledged = false
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    var body: some View {
        Form {
            Section {
                Label("탈퇴 신청 즉시 푸시 알림이 중단됩니다.", systemImage: "bell.slash")
                Label("30일 동안 계정을 복구할 수 있습니다.", systemImage: "clock.arrow.circlepath")
                Label("30일 후 개인정보가 삭제됩니다.", systemImage: "trash")
            } header: {
                Text("탈퇴 전 확인")
            }

            Section("탈퇴 사유 (선택)") {
                TextEditor(text: $reason)
                    .frame(minHeight: 96)
                    .onChange(of: reason) { value in
                        if value.count > 200 {
                            reason = String(value.prefix(200))
                        }
                    }
                Text("\(reason.count)/200")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }

            Section {
                Toggle("안내 내용을 확인했습니다.", isOn: $hasAcknowledged)
            }

            Section {
                Button(role: .destructive) {
                    Task { await submit() }
                } label: {
                    HStack {
                        Spacer()
                        if isSubmitting {
                            ProgressView()
                        } else {
                            Text("계정 탈퇴 신청")
                                .font(.headline)
                        }
                        Spacer()
                    }
                }
                .disabled(!hasAcknowledged || isSubmitting)
            }

            if let errorMessage {
                Section {
                    Label(errorMessage, systemImage: "exclamationmark.circle")
                        .foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("계정 탈퇴")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("취소") { dismiss() }
                    .disabled(isSubmitting)
            }
        }
        .interactiveDismissDisabled(isSubmitting)
    }

    private func submit() async {
        guard hasAcknowledged else { return }
        isSubmitting = true
        errorMessage = nil
        let trimmedReason = reason.trimmed
        let success = await onConfirm(trimmedReason.isEmpty ? nil : trimmedReason)
        if success {
            dismiss()
        } else {
            errorMessage = "탈퇴 신청을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요."
        }
        isSubmitting = false
    }
}

struct IOSLegalDocumentContainer: UIViewControllerRepresentable {
    let document: IOSLegalDocument
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> LegalDocumentViewController {
        LegalDocumentViewController(
            title: document.title,
            url: document.url,
            onClose: { dismiss() }
        )
    }

    func updateUIViewController(
        _ uiViewController: LegalDocumentViewController,
        context: Context
    ) {}
}

private extension String {
    var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
