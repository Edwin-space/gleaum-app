import SwiftUI
import UIKit

struct IOSMoreNavigationView: View {
    @ObservedObject var appModel: IOSAppModel
    @ObservedObject var store: StartupSnapshotStore

    @StateObject private var model = IOSMoreViewModel()
    @StateObject private var security = IOSAppSecurityManager.shared
    @State private var themePreference = GleaumThemeManager.shared.preference
    @State private var presentedSheet: IOSMoreSheet?
    @State private var legalDocument: IOSLegalDocument?
    @State private var showsLogoutConfirmation = false

    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    rootContent
                }
            } else {
                NavigationView {
                    rootContent
                }
                .navigationViewStyle(.stack)
            }
        }
        .sheet(item: $presentedSheet) { sheet in
            sheetContent(sheet)
        }
        .fullScreenCover(item: $legalDocument) { document in
            IOSLegalDocumentContainer(document: document)
                .ignoresSafeArea()
        }
        .confirmationDialog(
            "로그아웃할까요?",
            isPresented: $showsLogoutConfirmation,
            titleVisibility: .visible
        ) {
            Button("로그아웃", role: .destructive) {
                appModel.signOut()
            }
            Button("취소", role: .cancel) {}
        } message: {
            Text("이 iPhone에 저장된 로그인 정보가 삭제됩니다.")
        }
        .task {
            await model.load(initialProfile: appModel.onboardingProfile)
            security.refreshAvailability()
        }
        .onReceive(NotificationCenter.default.publisher(for: .gleaumThemeChanged)) { _ in
            themePreference = GleaumThemeManager.shared.preference
        }
    }

    @ViewBuilder
    private var rootContent: some View {
#if DEBUG
        if CommandLine.arguments.contains("-GLEAUMPreviewAppearance") {
            IOSAppearanceSettingsView()
        } else if CommandLine.arguments.contains("-GLEAUMPreviewCalendar") {
            IOSCalendarSettingsView(snapshotStore: store)
        } else {
            content
        }
#else
        content
#endif
    }

    private var content: some View {
        List {
            if let status = model.accountStatus, status.withdrawalPending {
                withdrawalPendingSection(status)
            }

            profileSection
            preferencesSection
            securitySection
            serviceSection
            accountSection
        }
        .listStyle(.insetGrouped)
        .dynamicTypeSize(.small ... .accessibility2)
        .gleaumTabBarScrollTracking(for: .more)
        .navigationTitle("전체")
        .navigationBarTitleDisplayMode(.large)
        .refreshable {
            await model.load(initialProfile: nil, force: true)
        }
        .overlay {
            if model.isLoading, model.profile == nil {
                ProgressView("계정 정보를 불러오는 중이에요")
                    .padding(18)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14))
            }
        }
        .alert("작업을 완료하지 못했어요", isPresented: model.errorBinding) {
            Button("확인", role: .cancel) {}
        } message: {
            Text(model.errorMessage ?? "잠시 후 다시 시도해 주세요.")
        }
    }

    private var profileSection: some View {
        Section {
            Button {
                guard model.profile != nil else { return }
                presentedSheet = .profile
            } label: {
                HStack(spacing: 14) {
                    IOSProfileAvatar(profile: model.profile, size: 54)

                    VStack(alignment: .leading, spacing: 3) {
                        Text(model.profile?.displayName ?? "프로필")
                            .font(.headline)
                            .foregroundStyle(.primary)
                        Text(model.profile?.email ?? "계정 정보를 확인하고 있어요")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }

                    Spacer(minLength: 8)
                    Image(systemName: "chevron.right")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.tertiary)
                }
                .padding(.vertical, 5)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .disabled(model.profile == nil)
            .accessibilityHint("이름과 표시 방식을 편집합니다.")
        }
    }

    private var preferencesSection: some View {
        Section("앱 설정") {
            Button {
                presentedSheet = .notifications
            } label: {
                IOSMoreRow(
                    title: "알림 설정",
                    subtitle: "받을 알림과 iPhone 권한",
                    symbol: "bell.badge",
                    tint: .orange
                )
            }
            .buttonStyle(.plain)

            NavigationLink {
                IOSAppearanceSettingsView()
            } label: {
                IOSMoreRow(
                    title: "화면 모드",
                    subtitle: IOSAppearanceSettingsView.title(for: themePreference),
                    symbol: "circle.lefthalf.filled",
                    tint: Color(uiColor: GleaumUIColor.brandBlue),
                    showsChevron: false
                )
            }

            NavigationLink {
                IOSCalendarSettingsView(snapshotStore: store)
            } label: {
                IOSMoreRow(
                    title: "기기 캘린더",
                    subtitle: "iPhone 일정 가져오기와 내보내기",
                    symbol: "calendar.badge.checkmark",
                    tint: Color(uiColor: GleaumUIColor.brandTeal),
                    showsChevron: false
                )
            }
        }
    }

    private var securitySection: some View {
        Section("보안") {
            NavigationLink {
                IOSSecuritySettingsView(security: security)
            } label: {
                IOSMoreRow(
                    title: "앱 잠금",
                    subtitle: security.isEnabled
                        ? "\(security.availability.kind.title) 사용 중"
                        : "Face ID 또는 Touch ID",
                    symbol: security.availability.kind.symbol,
                    tint: Color(uiColor: GleaumUIColor.brandTeal),
                    showsChevron: false
                )
            }

            Button {
                presentedSheet = .password
            } label: {
                IOSMoreRow(
                    title: "비밀번호 설정",
                    subtitle: "이메일 로그인 비밀번호 변경",
                    symbol: "key",
                    tint: .indigo
                )
            }
            .buttonStyle(.plain)
        }
    }

    private var serviceSection: some View {
        Section("서비스 정보") {
            Button {
                legalDocument = .terms
            } label: {
                IOSMoreRow(
                    title: "이용약관",
                    subtitle: nil,
                    symbol: "doc.text",
                    tint: .secondary
                )
            }
            .buttonStyle(.plain)

            Button {
                legalDocument = .privacy
            } label: {
                IOSMoreRow(
                    title: "개인정보처리방침",
                    subtitle: nil,
                    symbol: "hand.raised",
                    tint: .secondary
                )
            }
            .buttonStyle(.plain)

            Link(destination: URL(string: "mailto:helper@gleaum.com")!) {
                IOSMoreRow(
                    title: "문의하기",
                    subtitle: "helper@gleaum.com",
                    symbol: "envelope",
                    tint: Color(uiColor: GleaumUIColor.brandBlue),
                    showsChevron: false
                )
            }
            .buttonStyle(.plain)

            HStack {
                Label("앱 버전", systemImage: "info.circle")
                Spacer()
                Text(IOSAppVersion.current)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var accountSection: some View {
        Section {
            Button(role: .destructive) {
                showsLogoutConfirmation = true
            } label: {
                Label("로그아웃", systemImage: "rectangle.portrait.and.arrow.right")
            }

            Button(role: .destructive) {
                presentedSheet = .withdrawal
            } label: {
                Label("계정 탈퇴", systemImage: "person.crop.circle.badge.minus")
            }
        } footer: {
            Text("탈퇴 신청 후 30일 동안 계정을 복구할 수 있습니다.")
        }
    }

    private func withdrawalPendingSection(_ status: NativeAccountStatus) -> some View {
        Section {
            VStack(alignment: .leading, spacing: 10) {
                Label("계정 탈퇴가 예약되어 있어요", systemImage: "clock.badge.exclamationmark")
                    .font(.headline)
                    .foregroundStyle(.orange)
                Text("남은 기간 \(status.daysLeft ?? 0)일 안에는 계정과 데이터를 복구할 수 있습니다.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Button("탈퇴 신청 취소") {
                    Task { await model.restoreWithdrawal() }
                }
                .buttonStyle(.bordered)
                .disabled(model.isPerformingAccountAction)
            }
            .padding(.vertical, 4)
        }
    }

    @ViewBuilder
    private func sheetContent(_ sheet: IOSMoreSheet) -> some View {
        switch sheet {
        case .profile:
            if let profile = model.profile {
                IOSProfileEditNavigationView(profile: profile) { updatedProfile in
                    model.applyProfile(updatedProfile)
                    appModel.applyProfile(updatedProfile)
                }
            }
        case .notifications:
            IOSNotificationSettingsNavigationView(store: store)
        case .password:
            IOSPasswordNavigationView()
        case .withdrawal:
            IOSWithdrawalNavigationView { reason in
                let success = await model.requestWithdrawal(reason: reason)
                if success {
                    appModel.signOut()
                }
                return success
            }
        }
    }
}

private struct IOSMoreRow: View {
    let title: String
    let subtitle: String?
    let symbol: String
    let tint: Color
    var showsChevron = true

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.body.weight(.semibold))
                .foregroundStyle(tint)
                .frame(width: 30)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .foregroundStyle(.primary)
                if let subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
            }
            Spacer(minLength: 8)
            if showsChevron {
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.tertiary)
                    .accessibilityHidden(true)
            }
        }
        .contentShape(Rectangle())
    }
}

struct IOSProfileAvatar: View {
    let profile: NativeProfileSummary?
    let size: CGFloat

    var body: some View {
        Group {
            if let avatar = profile?.avatar,
               let url = URL(string: avatar),
               url.scheme != nil {
                AsyncImage(url: url) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFill()
                    } else {
                        fallback
                    }
                }
            } else if let avatar = profile?.avatar, !avatar.isEmpty {
                Text(avatar)
                    .font(.system(size: size * 0.46))
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(uiColor: GleaumUIColor.mutedSurface))
            } else {
                fallback
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
        .overlay(Circle().stroke(Color(uiColor: GleaumUIColor.border), lineWidth: 1))
        .accessibilityHidden(true)
    }

    private var fallback: some View {
        Text(String((profile?.displayName ?? "글").prefix(1)))
            .font(.title2.bold())
            .foregroundStyle(Color(uiColor: GleaumUIColor.brandBlue))
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(uiColor: GleaumUIColor.activeControl))
    }
}

@MainActor
final class IOSMoreViewModel: ObservableObject {
    @Published private(set) var profile: NativeProfileSummary?
    @Published private(set) var accountStatus: NativeAccountStatus?
    @Published private(set) var isLoading = false
    @Published private(set) var isPerformingAccountAction = false
    @Published var errorMessage: String?

    var errorBinding: Binding<Bool> {
        Binding(
            get: { self.errorMessage != nil },
            set: { if !$0 { self.errorMessage = nil } }
        )
    }

    func load(initialProfile: NativeProfileSummary?, force: Bool = false) async {
        if profile == nil, let initialProfile {
            profile = initialProfile
        }
        guard force || profile == nil || accountStatus == nil else { return }

#if DEBUG
        if CommandLine.arguments.contains("-GLEAUMPreviewMore")
            || CommandLine.arguments.contains("-GLEAUMPreviewAppearance") {
            profile = NativeProfileSummary.preview
            accountStatus = NativeAccountStatus(
                withdrawalPending: false,
                isWithdrawn: false,
                withdrawalRequestedAt: nil,
                deleteScheduledAt: nil,
                daysLeft: nil
            )
            return
        }
#endif

        isLoading = true
        defer { isLoading = false }
        async let fetchedProfile = NativeAPIClient.shared.fetchProfile()
        async let fetchedStatus = NativeAPIClient.shared.fetchAccountStatus()

        do {
            profile = try await fetchedProfile
        } catch {
            if profile == nil {
                errorMessage = error.localizedDescription
            }
        }

        do {
            accountStatus = try await fetchedStatus
        } catch {
            if errorMessage == nil {
                errorMessage = error.localizedDescription
            }
        }
    }

    func applyProfile(_ profile: NativeProfileSummary) {
        self.profile = profile
    }

    func restoreWithdrawal() async {
        isPerformingAccountAction = true
        defer { isPerformingAccountAction = false }
        do {
            _ = try await NativeAPIClient.shared.restoreWithdrawal()
            accountStatus = try await NativeAPIClient.shared.fetchAccountStatus()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func requestWithdrawal(reason: String?) async -> Bool {
        isPerformingAccountAction = true
        defer { isPerformingAccountAction = false }
        do {
            _ = try await NativeAPIClient.shared.requestWithdrawal(reason: reason)
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }
}

private enum IOSMoreSheet: String, Identifiable {
    case profile
    case notifications
    case password
    case withdrawal

    var id: String { rawValue }
}

enum IOSLegalDocument: String, Identifiable {
    case terms
    case privacy

    var id: String { rawValue }
    var title: String { self == .privacy ? "개인정보처리방침" : "이용약관" }
    var url: URL {
        URL(string: "https://www.gleaum.com/legal/\(rawValue)?app=1")!
    }
}

private enum IOSAppVersion {
    static var current: String {
        let version = Bundle.main.object(
            forInfoDictionaryKey: "CFBundleShortVersionString"
        ) as? String ?? "-"
        let build = Bundle.main.object(
            forInfoDictionaryKey: "CFBundleVersion"
        ) as? String ?? "-"
        return "\(version) (\(build))"
    }
}

#if DEBUG
extension NativeProfileSummary {
    static let preview = NativeProfileSummary(
        id: "preview",
        email: "preview@gleaum.com",
        name: "글리움 관리자",
        displayName: "글리움 관리자",
        realName: "유태수",
        nameDisplayMode: "nickname",
        avatar: nil,
        timezone: "Asia/Seoul",
        locale: "ko-KR",
        onboardingCompleted: true,
        notificationSettings: NativeNotificationSettings(
            scheduleReminders: true,
            routineReminders: true,
            expenseReminders: true,
            spaceUpdates: true
        )
    )
}
#endif
