import SwiftUI
import LocalAuthentication

enum GleaumBiometryKind {
    case faceID
    case touchID
    case deviceCredential

    var title: String {
        switch self {
        case .faceID:
            return "Face ID"
        case .touchID:
            return "Touch ID"
        case .deviceCredential:
            return "기기 암호"
        }
    }

    var symbolName: String {
        switch self {
        case .faceID:
            return "faceid"
        case .touchID:
            return "touchid"
        case .deviceCredential:
            return "lock.shield"
        }
    }
}

final class GleaumBiometricPreferences {
    static let shared = GleaumBiometricPreferences()

    private enum Key {
        static let prefix = "CapacitorStorage."
        static let enabled = prefix + "gleaum:biometric-lock-enabled"
        static let scopes = prefix + "gleaum:biometric-lock-scopes"
        static let unlockedAt = prefix + "gleaum:biometric-unlocked-at"
        static let relockInterval = prefix + "gleaum:biometric-relock-interval"
    }

    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    var protectsEntireApp: Bool {
        guard defaults.string(forKey: Key.enabled) == "true" else {
            return false
        }

        guard let rawScopes = defaults.string(forKey: Key.scopes),
              let data = rawScopes.data(using: .utf8),
              let scopes = try? JSONSerialization.jsonObject(with: data) as? [String] else {
            return true
        }

        return scopes.contains("app")
    }

    func shouldRequireUnlock(now: Date = Date()) -> Bool {
        guard protectsEntireApp else {
            return false
        }

        let unlockedAtMilliseconds = TimeInterval(
            defaults.string(forKey: Key.unlockedAt) ?? ""
        ) ?? 0
        let elapsed = now.timeIntervalSince1970 - (unlockedAtMilliseconds / 1_000)

        // 네이티브 게이트를 통과한 직후 WebView 게이트가 연속 표시되지 않게 한다.
        if unlockedAtMilliseconds > 0, elapsed < 15 {
            return false
        }

        switch defaults.string(forKey: Key.relockInterval) ?? "always" {
        case "5m":
            return elapsed >= 5 * 60
        case "15m":
            return elapsed >= 15 * 60
        case "30m":
            return elapsed >= 30 * 60
        default:
            return true
        }
    }

    func markUnlocked(now: Date = Date()) {
        let milliseconds = Int64(now.timeIntervalSince1970 * 1_000)
        defaults.set(String(milliseconds), forKey: Key.unlockedAt)
    }
}

final class GleaumBiometricAuthenticator {
    func availableKind() -> GleaumBiometryKind {
        let context = LAContext()
        var error: NSError?

        guard context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            error: &error
        ) else {
            return .deviceCredential
        }

        switch context.biometryType {
        case .faceID:
            return .faceID
        case .touchID:
            return .touchID
        default:
            return .deviceCredential
        }
    }

    func authenticate(completion: @escaping (Result<Void, Error>) -> Void) {
        let context = LAContext()
        context.localizedCancelTitle = "취소"
        context.localizedFallbackTitle = "암호 사용"

        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            completion(.failure(error ?? LAError(.authenticationFailed)))
            return
        }

        context.evaluatePolicy(
            .deviceOwnerAuthentication,
            localizedReason: "개인 일정과 가계부 정보를 안전하게 확인합니다."
        ) { success, evaluationError in
            if success {
                completion(.success(()))
            } else {
                completion(.failure(evaluationError ?? LAError(.authenticationFailed)))
            }
        }
    }
}

@MainActor
final class GleaumBiometricLockViewModel: ObservableObject {
    @Published private(set) var isAuthenticating = false
    @Published private(set) var message: String?

    let kind: GleaumBiometryKind

    private let authenticator: GleaumBiometricAuthenticator
    private let preferences: GleaumBiometricPreferences
    private let onUnlock: () -> Void

    init(
        authenticator: GleaumBiometricAuthenticator = GleaumBiometricAuthenticator(),
        preferences: GleaumBiometricPreferences = .shared,
        onUnlock: @escaping () -> Void
    ) {
        self.authenticator = authenticator
        self.preferences = preferences
        self.onUnlock = onUnlock
        self.kind = authenticator.availableKind()
    }

    func authenticate() {
        guard !isAuthenticating else {
            return
        }

        isAuthenticating = true
        message = nil

        authenticator.authenticate { [weak self] result in
            DispatchQueue.main.async {
                guard let self else {
                    return
                }

                self.isAuthenticating = false
                switch result {
                case .success:
                    self.preferences.markUnlocked()
                    self.onUnlock()
                case .failure(let error):
                    self.message = Self.userMessage(for: error)
                }
            }
        }
    }

    private static func userMessage(for error: Error) -> String {
        guard let authenticationError = error as? LAError else {
            return "인증을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요."
        }

        switch authenticationError.code {
        case .userCancel, .systemCancel, .appCancel:
            return "인증이 취소되었습니다. 준비되면 다시 시도해 주세요."
        case .biometryLockout:
            return "생체인증이 잠겼습니다. 기기 암호로 잠금을 해제해 주세요."
        case .biometryNotEnrolled:
            return "설정에서 생체인증을 등록하거나 기기 암호를 사용해 주세요."
        case .passcodeNotSet:
            return "먼저 iPhone에 기기 암호를 설정해 주세요."
        default:
            return "인증을 확인하지 못했습니다. 다시 시도해 주세요."
        }
    }
}

struct GleaumLoginView: View {
    let onGoogleSignIn: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var contentVisible = false
    @State private var isOpeningBrowser = false

    var body: some View {
        ZStack {
            GleaumBrandBackdrop()

            GeometryReader { proxy in
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: GleaumSpacing.section) {
                        hero
                            .frame(minHeight: max(300, proxy.size.height * 0.48))

                        signInPanel
                    }
                    .padding(.horizontal, GleaumLayout.phoneHorizontalPadding)
                    .padding(.top, GleaumSpacing.xxLarge)
                    .padding(.bottom, GleaumSpacing.section)
                    .frame(minHeight: proxy.size.height)
                }
            }
        }
        .tint(GleaumColors.brandBlue)
        .opacity(contentVisible ? 1 : 0)
        .offset(y: contentVisible || reduceMotion ? 0 : 12)
        .onAppear {
            withAnimation(reduceMotion ? nil : .easeOut(duration: 0.35)) {
                contentVisible = true
            }
        }
        .onReceive(NotificationCenter.default.publisher(
            for: UIApplication.didBecomeActiveNotification
        )) { _ in
            isOpeningBrowser = false
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: GleaumSpacing.xLarge) {
            GleaumBrandMark()

            Spacer(minLength: GleaumSpacing.xLarge)

            VStack(alignment: .leading, spacing: GleaumSpacing.medium) {
                Text("가장 가까운 사람들과\n하루를 함께 이어가세요.")
                    .font(.largeTitle.weight(.bold))
                    .foregroundStyle(.primary)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)

                Text("일정, 공간, 가계부를 한곳에서 안전하게 공유합니다.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var signInPanel: some View {
        VStack(spacing: GleaumSpacing.large) {
            VStack(spacing: GleaumSpacing.small) {
                Text("글리움 시작하기")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(.primary)

                Text("사용하던 Google 계정으로 안전하게 계속할 수 있어요.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            Button {
                isOpeningBrowser = true
                onGoogleSignIn()
            } label: {
                HStack(spacing: GleaumSpacing.medium) {
                    if isOpeningBrowser {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Image("google_icon")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 22, height: 22)
                            .background(Color.white, in: Circle())
                            .accessibilityHidden(true)
                    }

                    Text(isOpeningBrowser ? "Google 연결 중…" : "Google로 계속하기")
                }
            }
            .gleaumPrimaryAction()
            .disabled(isOpeningBrowser)
            .accessibilityHint("Google 계정 선택 화면을 엽니다.")

            legalText
        }
        .padding(GleaumSpacing.xxLarge)
        .background(.ultraThinMaterial, in: RoundedRectangle(
            cornerRadius: GleaumRadius.card,
            style: .continuous
        ))
        .overlay(
            RoundedRectangle(cornerRadius: GleaumRadius.card, style: .continuous)
                .stroke(GleaumColors.separator, lineWidth: GleaumLayout.cardStrokeWidth)
        )
    }

    private var legalText: some View {
        VStack(spacing: GleaumSpacing.xSmall) {
            Text("계속하면 아래 정책에 동의한 것으로 간주합니다.")
                .font(.caption)
                .foregroundStyle(.secondary)

            HStack(spacing: GleaumSpacing.large) {
                Link("이용약관", destination: URL(string: "https://www.gleaum.com/legal/terms")!)
                Link(
                    "개인정보처리방침",
                    destination: URL(string: "https://www.gleaum.com/legal/privacy")!
                )
            }
            .font(.caption.weight(.semibold))
        }
        .multilineTextAlignment(.center)
    }
}

struct GleaumBiometricLockView: View {
    @StateObject private var viewModel: GleaumBiometricLockViewModel
    @State private var confirmOtherAccount = false

    private let automaticallyAuthenticates: Bool
    private let onUseOtherAccount: () -> Void

    init(
        automaticallyAuthenticates: Bool = true,
        onUnlock: @escaping () -> Void,
        onUseOtherAccount: @escaping () -> Void
    ) {
        _viewModel = StateObject(
            wrappedValue: GleaumBiometricLockViewModel(onUnlock: onUnlock)
        )
        self.automaticallyAuthenticates = automaticallyAuthenticates
        self.onUseOtherAccount = onUseOtherAccount
    }

    var body: some View {
        ZStack {
            GleaumColors.screenBackground
                .ignoresSafeArea()

            VStack(spacing: GleaumSpacing.section) {
                GleaumBrandMark(compact: true)
                    .padding(.horizontal, GleaumSpacing.xLarge)
                    .padding(.vertical, GleaumSpacing.medium)
                    .background(
                        LinearGradient(
                            colors: [GleaumColors.brandBlue, GleaumColors.brandTeal],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        in: Capsule()
                    )

                VStack(spacing: GleaumSpacing.xLarge) {
                    Image(systemName: viewModel.kind.symbolName)
                        .font(.system(size: 52, weight: .regular))
                        .symbolRenderingMode(.hierarchical)
                        .foregroundStyle(GleaumColors.brandBlue)
                        .frame(width: 88, height: 88)
                        .background(GleaumColors.brandBlue.opacity(0.10), in: Circle())
                        .accessibilityHidden(true)

                    VStack(spacing: GleaumSpacing.small) {
                        Text("\(viewModel.kind.title)로 잠금 해제")
                            .font(.title2.weight(.bold))
                            .foregroundStyle(.primary)
                            .accessibilityAddTraits(.isHeader)

                        Text("개인 일정과 가계부 정보를 보호하고 있습니다.")
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }

                    if let message = viewModel.message {
                        Label(message, systemImage: "exclamationmark.circle")
                            .font(.footnote)
                            .foregroundStyle(GleaumColors.destructive)
                            .multilineTextAlignment(.center)
                            .accessibilityLabel("인증 안내. \(message)")
                    }

                    VStack(spacing: GleaumSpacing.small) {
                        Button {
                            viewModel.authenticate()
                        } label: {
                            HStack(spacing: GleaumSpacing.small) {
                                if viewModel.isAuthenticating {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Image(systemName: viewModel.kind.symbolName)
                                        .accessibilityHidden(true)
                                }
                                Text(viewModel.isAuthenticating ? "확인 중…" : "잠금 해제")
                            }
                        }
                        .gleaumPrimaryAction()
                        .disabled(viewModel.isAuthenticating)

                        Button("다른 계정으로 로그인") {
                            confirmOtherAccount = true
                        }
                        .buttonStyle(.borderless)
                        .frame(minHeight: GleaumLayout.minimumTapTarget)
                        .disabled(viewModel.isAuthenticating)
                    }
                }
                .padding(GleaumSpacing.xxLarge)
                .background(
                    RoundedRectangle(cornerRadius: GleaumRadius.card, style: .continuous)
                        .fill(GleaumColors.surface)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: GleaumRadius.card, style: .continuous)
                        .stroke(GleaumColors.separator, lineWidth: 0.5)
                )
            }
            .padding(.horizontal, GleaumLayout.phoneHorizontalPadding)
        }
        .tint(GleaumColors.brandBlue)
        .confirmationDialog(
            "저장된 로그인 정보를 지울까요?",
            isPresented: $confirmOtherAccount,
            titleVisibility: .visible
        ) {
            Button("다른 계정으로 로그인", role: .destructive) {
                onUseOtherAccount()
            }
            Button("취소", role: .cancel) {}
        } message: {
            Text("현재 기기의 세션만 삭제되며 계정 데이터는 유지됩니다.")
        }
        .onAppear {
            guard automaticallyAuthenticates else {
                return
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                viewModel.authenticate()
            }
        }
    }
}

@MainActor
final class GleaumSessionRecoveryViewModel: ObservableObject {
    enum State {
        case preparing
        case temporaryFailure
    }

    @Published private(set) var state: State = .preparing

    func showPreparing() {
        state = .preparing
    }

    func showTemporaryFailure() {
        state = .temporaryFailure
    }
}

struct GleaumSessionRecoveryView: View {
    @ObservedObject var viewModel: GleaumSessionRecoveryViewModel
    let onRetry: () -> Void
    let onUseOtherAccount: () -> Void

    @State private var confirmOtherAccount = false

    var body: some View {
        ZStack {
            GleaumColors.screenBackground
                .ignoresSafeArea()

            GeometryReader { proxy in
                ScrollView(showsIndicators: false) {
                    VStack(spacing: GleaumSpacing.section) {
                        GleaumBrandMark(compact: true)
                            .padding(.horizontal, GleaumSpacing.xLarge)
                            .padding(.vertical, GleaumSpacing.medium)
                            .background(
                                LinearGradient(
                                    colors: [GleaumColors.brandBlue, GleaumColors.brandTeal],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                ),
                                in: Capsule()
                            )

                        VStack(spacing: GleaumSpacing.xLarge) {
                            stateSymbol

                            VStack(spacing: GleaumSpacing.small) {
                                Text(title)
                                    .font(.title2.weight(.bold))
                                    .foregroundStyle(.primary)
                                    .multilineTextAlignment(.center)
                                    .accessibilityAddTraits(.isHeader)

                                Text(message)
                                    .font(.body)
                                    .foregroundStyle(.secondary)
                                    .multilineTextAlignment(.center)
                                    .fixedSize(horizontal: false, vertical: true)
                            }

                            if viewModel.state == .preparing {
                                ProgressView()
                                    .controlSize(.large)
                                    .tint(GleaumColors.brandBlue)
                                    .accessibilityLabel("로그인 상태 확인 중")
                            } else {
                                VStack(spacing: GleaumSpacing.small) {
                                    Button {
                                        onRetry()
                                    } label: {
                                        Label("다시 확인", systemImage: "arrow.clockwise")
                                    }
                                    .gleaumPrimaryAction()

                                    Button("다른 계정으로 로그인") {
                                        confirmOtherAccount = true
                                    }
                                    .buttonStyle(.borderless)
                                    .frame(minHeight: GleaumLayout.minimumTapTarget)
                                }
                            }
                        }
                        .padding(GleaumSpacing.xxLarge)
                        .background(
                            RoundedRectangle(cornerRadius: GleaumRadius.card, style: .continuous)
                                .fill(GleaumColors.surface)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: GleaumRadius.card, style: .continuous)
                                .stroke(GleaumColors.separator, lineWidth: 0.5)
                        )
                    }
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: proxy.size.height)
                    .padding(.horizontal, GleaumLayout.phoneHorizontalPadding)
                    .padding(.vertical, GleaumSpacing.large)
                }
            }
        }
        .tint(GleaumColors.brandBlue)
        .confirmationDialog(
            "저장된 로그인 정보를 지울까요?",
            isPresented: $confirmOtherAccount,
            titleVisibility: .visible
        ) {
            Button("다른 계정으로 로그인", role: .destructive) {
                onUseOtherAccount()
            }
            Button("취소", role: .cancel) {}
        } message: {
            Text("현재 기기의 세션만 삭제되며 계정 데이터는 유지됩니다.")
        }
    }

    @ViewBuilder
    private var stateSymbol: some View {
        switch viewModel.state {
        case .preparing:
            Image(systemName: "person.crop.circle.badge.clock")
                .font(.system(size: 50, weight: .regular))
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(GleaumColors.brandBlue)
                .frame(width: 88, height: 88)
                .background(GleaumColors.brandBlue.opacity(0.10), in: Circle())
                .accessibilityHidden(true)
        case .temporaryFailure:
            Image(systemName: "wifi.exclamationmark")
                .font(.system(size: 46, weight: .regular))
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(GleaumColors.warning)
                .frame(width: 88, height: 88)
                .background(GleaumColors.warning.opacity(0.12), in: Circle())
                .accessibilityHidden(true)
        }
    }

    private var title: String {
        switch viewModel.state {
        case .preparing:
            return "사용하던 계정으로 준비 중"
        case .temporaryFailure:
            return "연결을 다시 확인해 주세요"
        }
    }

    private var message: String {
        switch viewModel.state {
        case .preparing:
            return "저장된 로그인 상태를 안전하게 확인하고 있어요."
        case .temporaryFailure:
            return "로그인 정보는 이 기기에 그대로 보관했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요."
        }
    }
}

final class GleaumSessionRecoveryViewController: UIViewController {
    private let viewModel = GleaumSessionRecoveryViewModel()
    private let onRetry: () -> Void
    private let onUseOtherAccount: () -> Void
    private var hostingController: UIHostingController<GleaumSessionRecoveryView>?

    init(
        onRetry: @escaping () -> Void,
        onUseOtherAccount: @escaping () -> Void
    ) {
        self.onRetry = onRetry
        self.onUseOtherAccount = onUseOtherAccount
        super.init(nibName: nil, bundle: nil)
        isModalInPresentation = true
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        let content = GleaumSessionRecoveryView(
            viewModel: viewModel,
            onRetry: onRetry,
            onUseOtherAccount: onUseOtherAccount
        )
        let host = UIHostingController(rootView: content)
        addChild(host)
        host.view.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(host.view)
        NSLayoutConstraint.activate([
            host.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            host.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            host.view.topAnchor.constraint(equalTo: view.topAnchor),
            host.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
        host.didMove(toParent: self)
        hostingController = host
    }

    func showPreparing() {
        viewModel.showPreparing()
    }

    func showTemporaryFailure() {
        viewModel.showTemporaryFailure()
    }
}

final class GleaumBiometricLockViewController: UIViewController {
    private let onUnlock: () -> Void
    private let onUseOtherAccount: () -> Void
    private var hostingController: UIHostingController<GleaumBiometricLockView>?

    init(
        onUnlock: @escaping () -> Void,
        onUseOtherAccount: @escaping () -> Void
    ) {
        self.onUnlock = onUnlock
        self.onUseOtherAccount = onUseOtherAccount
        super.init(nibName: nil, bundle: nil)
        isModalInPresentation = true
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        let content = GleaumBiometricLockView(
            onUnlock: onUnlock,
            onUseOtherAccount: onUseOtherAccount
        )
        let host = UIHostingController(rootView: content)
        addChild(host)
        host.view.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(host.view)
        NSLayoutConstraint.activate([
            host.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            host.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            host.view.topAnchor.constraint(equalTo: view.topAnchor),
            host.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
        host.didMove(toParent: self)
        hostingController = host
    }
}
