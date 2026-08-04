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
            socialAccountsSection
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

    private var socialAccountsSection: some View {
        Section("소셜 계정 연동") {
            IOSSocialIdentityRow(
                providerName: "카카오",
                assetName: nil,
                systemSymbolName: "message.fill",
                tint: Color(red: 0.98, green: 0.85, blue: 0.0),
                identity: model.identity(for: "kakao")
            )

            IOSSocialIdentityRow(
                providerName: "Apple",
                assetName: nil,
                systemSymbolName: "applelogo",
                tint: .primary,
                identity: model.identity(for: "apple")
            )

            IOSSocialIdentityRow(
                providerName: "Google",
                assetName: "GoogleGOfficial",
                systemSymbolName: nil,
                tint: .red,
                identity: model.identity(for: "google")
            )
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

            Button {
                legalDocument = .support
            } label: {
                IOSMoreRow(
                    title: "고객지원·광고 신고",
                    subtitle: "FAQ와 1:1 문의",
                    symbol: "questionmark.bubble",
                    tint: Color(uiColor: GleaumUIColor.brandBlue)
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

private struct IOSSocialIdentityRow: View {
    let providerName: String
    let assetName: String?
    let systemSymbolName: String?
    let tint: Color
    let identity: NativeUserIdentity?

    var body: some View {
        HStack(spacing: 12) {
            Group {
                if let assetName {
                    Image(assetName)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 20, height: 20)
                } else if let systemSymbolName {
                    Image(systemName: systemSymbolName)
                        .font(.body.weight(.bold))
                        .foregroundStyle(tint)
                        .frame(width: 20, height: 20)
                }
            }
            .frame(width: 26)

            VStack(alignment: .leading, spacing: 2) {
                Text(providerName)
                    .font(.body.weight(.medium))
                    .foregroundStyle(.primary)
                if let identity, let email = identity.email, !email.isEmpty {
                    Text(email)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    Text("추가 연동 기능 준비 중")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }

            Spacer()

            if let identity {
                Text("연동됨")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.green)
            } else {
                Text("연동 준비 중입니다")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color(uiColor: GleaumUIColor.mutedSurface))
                    .clipShape(Capsule())
            }
        }
        .padding(.vertical, 3)
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
    @Published private(set) var identities: [NativeUserIdentity] = []
    @Published private(set) var linkingProvider: String?
    @Published private(set) var isLoading = false
    @Published private(set) var isPerformingAccountAction = false
    @Published var errorMessage: String?

    var canUnlink: Bool {
        identities.count > 1
    }

    func identity(for provider: String) -> NativeUserIdentity? {
        identities.first { $0.provider.lowercased() == provider.lowercased() }
    }

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
        async let fetchedIdentities = NativeAuthClient.shared.fetchIdentities()

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

        do {
            identities = try await fetchedIdentities
        } catch {}
    }

    private var activeAppleCoordinator: NativeAppleSignInCoordinator?
    private var activeKakaoCoordinator: NativeKakaoSignInCoordinator?
    private var activeSocialOAuthCoordinator: NativeSocialOAuthCoordinator?

    func linkKakao() async {
        linkingProvider = "kakao"
        let coordinator = NativeKakaoSignInCoordinator()
        activeKakaoCoordinator = coordinator

        coordinator.start { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                self.activeKakaoCoordinator = nil
                switch result {
                case .success(let cred):
                    if !cred.idToken.isEmpty {
                        do {
                            self.identities = try await NativeAuthClient.shared.linkIdentity(
                                provider: .kakao,
                                idToken: cred.idToken,
                                rawNonce: cred.rawNonce,
                                accessToken: cred.accessToken
                            )
                            self.linkingProvider = nil
                        } catch {
                            if let window = self.getKeyWindow() {
                                await self.linkSocialOAuth(provider: .kakao, window: window)
                            } else {
                                self.linkingProvider = nil
                                self.errorMessage = error.localizedDescription
                            }
                        }
                    } else if let window = self.getKeyWindow() {
                        await self.linkSocialOAuth(provider: .kakao, window: window)
                    } else {
                        self.linkingProvider = nil
                    }
                case .failure(let error):
                    if (error as? NativeAuthenticationCoordinatorError) != .cancelled {
                        if let window = self.getKeyWindow() {
                            await self.linkSocialOAuth(provider: .kakao, window: window)
                        } else {
                            self.linkingProvider = nil
                            self.errorMessage = error.localizedDescription
                        }
                    } else {
                        self.linkingProvider = nil
                    }
                }
            }
        }
    }

    func linkApple(window: UIWindow?) async {
        guard let window else {
            errorMessage = "인증 화면을 준비하지 못했습니다."
            return
        }
        linkingProvider = "apple"
        let coordinator = NativeAppleSignInCoordinator()
        activeAppleCoordinator = coordinator

        coordinator.start(presentationWindow: window) { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                self.activeAppleCoordinator = nil
                self.linkingProvider = nil
                switch result {
                case .success(let cred):
                    do {
                        self.identities = try await NativeAuthClient.shared.linkIdentity(
                            provider: .apple,
                            idToken: cred.idToken,
                            rawNonce: cred.rawNonce
                        )
                    } catch {
                        self.errorMessage = error.localizedDescription
                    }
                case .failure(let error):
                    if (error as? NativeAuthenticationCoordinatorError) != .cancelled {
                        self.errorMessage = error.localizedDescription
                    }
                }
            }
        }
    }

    func linkGoogle(window: UIWindow?) async {
        guard let window else {
            errorMessage = "인증 화면을 준비하지 못했습니다."
            return
        }
        await linkSocialOAuth(provider: .google, window: window)
    }

    func linkSocialOAuth(provider: NativeSocialOAuthProvider, window: UIWindow) async {
        linkingProvider = provider.rawValue
        let coordinator = NativeSocialOAuthCoordinator(provider: provider)
        activeSocialOAuthCoordinator = coordinator

        coordinator.start(presentationWindow: window, isLinking: true) { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                self.activeSocialOAuthCoordinator = nil
                self.linkingProvider = nil
                switch result {
                case .success:
                    if let fetched = try? await NativeAuthClient.shared.fetchIdentities() {
                        self.identities = fetched
                    }
                case .failure(let error):
                    if (error as? NativeAuthenticationCoordinatorError) != .cancelled {
                        self.errorMessage = error.localizedDescription
                    }
                }
            }
        }
    }

    private func getKeyWindow() -> UIWindow? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }
    }

    func unlinkIdentity(id: String) async {
        guard canUnlink else {
            errorMessage = "최소 하나 이상의 로그인 수단이 연결되어 있어야 해요."
            return
        }
        isPerformingAccountAction = true
        defer { isPerformingAccountAction = false }
        do {
            identities = try await NativeAuthClient.shared.unlinkIdentity(identityId: id)
        } catch {
            errorMessage = error.localizedDescription
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
    case support

    var id: String { rawValue }
    var title: String {
        switch self {
        case .terms: "이용약관"
        case .privacy: "개인정보처리방침"
        case .support: "고객지원·광고 신고"
        }
    }
    var url: URL {
        switch self {
        case .terms, .privacy:
            URL(string: "https://www.gleaum.com/legal/\(rawValue)?app=1")!
        case .support:
            URL(string: "https://www.gleaum.com/support?app=1#inquiry")!
        }
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
