import AuthenticationServices
import SwiftUI
import UIKit

/// iOS 인증 진입점입니다.
/// 별도 회원가입 화면은 제공하지 않으며 신규 사용자는 Apple 또는 Google 인증 후
/// 네이티브 온보딩에서 프로필과 필수 동의를 완료합니다.
struct IOSLoginView: View {
    @StateObject private var model = IOSLoginViewModel()
    @FocusState private var focusedField: EmailField?

    private enum EmailField {
        case email
        case password
    }

    var body: some View {
        ZStack {
            GleaumLoginPalette.background
                .ignoresSafeArea()

            LinearGradient(
                colors: [
                    GleaumLoginPalette.heroGlow,
                    .clear,
                ],
                startPoint: .top,
                endPoint: .center
            )
            .ignoresSafeArea()
            .accessibilityHidden(true)

            GeometryReader { geometry in
                ScrollView {
                    VStack(spacing: 0) {
                        Spacer(minLength: 24)

                        brandHeader

                        Color.clear
                            .frame(height: model.route == .providers ? 38 : 24)
                            .accessibilityHidden(true)

                        Group {
                            switch model.route {
                            case .providers:
                                providerSection
                                    .transition(.opacity.combined(with: .move(edge: .leading)))
                            case .email:
                                emailSection
                                    .transition(.opacity.combined(with: .move(edge: .trailing)))
                            }
                        }
                        .frame(maxWidth: GleaumIOSMetric.readableContentWidth)

                        Color.clear
                            .frame(height: 18)
                            .accessibilityHidden(true)
                    }
                    .padding(.horizontal, GleaumIOSMetric.pageHorizontalPadding)
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: geometry.size.height)
                }
            }
        }
        .preferredColorScheme(.dark)
        .animation(.easeInOut(duration: 0.22), value: model.route)
        .alert(
            "로그인 안내",
            isPresented: $model.showsAlert,
            actions: {
                Button("확인", role: .cancel) {}
            },
            message: {
                Text(model.alertMessage)
            }
        )
    }

    private var brandHeader: some View {
        VStack(spacing: 8) {
            VStack(spacing: GleaumIOSMetric.brandAssetSpacing) {
                Image("Splash")
                    .resizable()
                    .scaledToFit()
                    .frame(
                        width: GleaumIOSMetric.brandMarkSize,
                        height: GleaumIOSMetric.brandMarkSize
                    )
                    .accessibilityLabel("글리움")

                Image("GleaumBIInverse")
                    .resizable()
                    .scaledToFit()
                    .frame(
                        width: GleaumIOSMetric.brandWordmarkWidth,
                        height: GleaumIOSMetric.brandWordmarkHeight
                    )
                    .accessibilityLabel("gleaum")
            }

            Text("나와 소중한 사람의 일상을 한곳에서")
                .font(.subheadline)
                .foregroundStyle(GleaumLoginPalette.secondaryText)
                .multilineTextAlignment(.center)
        }
    }

    private var providerSection: some View {
        VStack(spacing: 12) {
            AppleContinueButton {
                model.continueWithApple()
            }
            .frame(height: GleaumIOSMetric.authenticationControlHeight)
            .disabled(model.isLoading)
            .opacity(model.isLoading ? 0.56 : 1)

            GoogleContinueButton(isEnabled: !model.isLoading) {
                model.continueWithGoogle()
            }

            authenticationDivider
                .padding(.vertical, 6)

            Button {
                model.showEmail()
                focusedField = .email
            } label: {
                Label("이메일로 로그인", systemImage: "envelope")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .frame(height: GleaumIOSMetric.authenticationControlHeight)
            }
            .buttonStyle(GleaumSecondaryAuthenticationButtonStyle())
            .disabled(model.isLoading)

            statusMessage
                .padding(.top, 4)

            legalNotice
                .padding(.top, 10)
        }
    }

    private var emailSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                focusedField = nil
                model.showProviders()
            } label: {
                Label("다른 방법 선택", systemImage: "chevron.left")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(GleaumLoginPalette.secondaryText)
            }
            .buttonStyle(.plain)
            .disabled(model.isLoading)

            Text("이메일로 로그인")
                .font(.largeTitle.bold())
                .foregroundStyle(.white)
                .padding(.top, 26)

            Text("기존 글리움 계정의 이메일과 비밀번호를 입력해 주세요.")
                .font(.subheadline)
                .foregroundStyle(GleaumLoginPalette.secondaryText)
                .padding(.top, 8)

            VStack(spacing: 12) {
                TextField(
                    "이메일",
                    text: $model.email,
                    prompt: Text("이메일").foregroundColor(
                        GleaumLoginPalette.placeholder
                    )
                )
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .submitLabel(.next)
                .focused($focusedField, equals: .email)
                .onSubmit {
                    focusedField = .password
                }
                .gleaumLoginFieldStyle()

                SecureField(
                    "비밀번호",
                    text: $model.password,
                    prompt: Text("비밀번호").foregroundColor(
                        GleaumLoginPalette.placeholder
                    )
                )
                .textContentType(.password)
                .submitLabel(.go)
                .focused($focusedField, equals: .password)
                .onSubmit {
                    signInWithEmail()
                }
                .gleaumLoginFieldStyle()
            }
            .font(.body)
            .foregroundStyle(.white)
            .padding(.top, 24)

            statusMessage
                .padding(.top, 16)

            Button {
                signInWithEmail()
            } label: {
                ZStack {
                    Text("로그인")
                        .font(.headline)
                        .opacity(model.isLoading ? 0 : 1)

                    if model.isLoading {
                        ProgressView()
                            .tint(.white)
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: GleaumIOSMetric.authenticationControlHeight)
            }
            .buttonStyle(.borderedProminent)
            .buttonBorderShape(.roundedRectangle(radius: GleaumIOSMetric.controlCornerRadius))
            .tint(Color(uiColor: GleaumUIColor.brandBlue))
            .disabled(model.isLoading || !model.canSubmitEmail)
            .padding(.top, 18)

            Text("처음 이용하시나요? Apple 또는 Google 계정으로 시작해 주세요.")
                .font(.footnote)
                .foregroundStyle(GleaumLoginPalette.secondaryText)
                .frame(maxWidth: .infinity, alignment: .center)
                .multilineTextAlignment(.center)
                .padding(.top, 18)
        }
    }

    @ViewBuilder
    private var statusMessage: some View {
        if let message = model.inlineMessage {
            Label(
                message.text,
                systemImage: message.isError ? "exclamationmark.circle.fill" : "checkmark.circle.fill"
            )
            .font(.footnote)
            .foregroundStyle(
                message.isError
                    ? GleaumLoginPalette.error
                    : Color(uiColor: GleaumUIColor.brandTeal)
            )
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityElement(children: .combine)
        }
    }

    private var authenticationDivider: some View {
        HStack(spacing: 12) {
            Rectangle()
                .fill(GleaumLoginPalette.separator)
                .frame(height: 1)

            Text("또는")
                .font(.caption)
                .foregroundStyle(GleaumLoginPalette.tertiaryText)

            Rectangle()
                .fill(GleaumLoginPalette.separator)
                .frame(height: 1)
        }
        .accessibilityHidden(true)
    }

    private var legalNotice: some View {
        VStack(spacing: 8) {
            Text("계속하면 글리움의 이용약관과 개인정보처리방침에 동의하게 됩니다.")
                .font(.caption2)
                .foregroundStyle(GleaumLoginPalette.tertiaryText)
                .multilineTextAlignment(.center)

            HStack(spacing: 18) {
                Button("이용약관") {
                    model.openLegalDocument(path: "/legal/terms")
                }
                Button("개인정보처리방침") {
                    model.openLegalDocument(path: "/legal/privacy")
                }
            }
            .font(.caption.weight(.semibold))
            .foregroundStyle(GleaumLoginPalette.secondaryText)
            .buttonStyle(.plain)
        }
    }

    private func signInWithEmail() {
        focusedField = nil
        model.signInWithEmail()
    }
}

@MainActor
private final class IOSLoginViewModel: ObservableObject {
    enum Route: Equatable {
        case providers
        case email
    }

    struct InlineMessage {
        let text: String
        let isError: Bool
    }

    @Published var route: Route = .providers
    @Published var email = ""
    @Published var password = ""
    @Published private(set) var isLoading = false
    @Published private(set) var inlineMessage: InlineMessage?
    @Published var showsAlert = false
    @Published private(set) var alertMessage = ""

    private let appleCoordinator = NativeAppleSignInCoordinator()
    private let googleCoordinator = NativeGoogleOAuthCoordinator()

    var canSubmitEmail: Bool {
        Self.isValidEmail(email) && password.count >= 6
    }

    func showEmail() {
        inlineMessage = nil
        route = .email
    }

    func showProviders() {
        inlineMessage = nil
        password = ""
        route = .providers
    }

    func continueWithApple() {
        guard !isLoading, let window = Self.presentationWindow else { return }
        setLoading(true)
        appleCoordinator.start(presentationWindow: window) { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let credential):
                Task { @MainActor in
                    await self.exchangeAppleCredential(credential)
                }
            case .failure(let error):
                self.setLoading(false)
                if (error as? NativeAuthenticationCoordinatorError) != .cancelled {
                    self.showError(error.localizedDescription)
                }
            }
        }
    }

    func continueWithGoogle() {
        guard !isLoading, let window = Self.presentationWindow else { return }
        setLoading(true)
        googleCoordinator.start(presentationWindow: window) { [weak self] result in
            guard let self else { return }
            self.setLoading(false)
            switch result {
            case .success(let sessionJSON):
                self.completeAuthentication(sessionJSON)
            case .failure(let error):
                if (error as? NativeAuthenticationCoordinatorError) != .cancelled {
                    self.showError(error.localizedDescription)
                }
            }
        }
    }

    func signInWithEmail() {
        guard !isLoading else { return }
        let normalizedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard Self.isValidEmail(normalizedEmail), password.count >= 6 else {
            showInlineError("이메일과 비밀번호를 확인해 주세요.")
            return
        }

        setLoading(true)
        Task { @MainActor in
            do {
                let response = try await NativeAuthClient.shared.signIn(
                    email: normalizedEmail,
                    password: password
                )
                guard let sessionJSON = response.sessionJSON else {
                    throw NativeAuthError.invalidResponse
                }
                completeAuthentication(sessionJSON)
            } catch {
                setLoading(false)
                showInlineError(error.localizedDescription)
            }
        }
    }

    func openLegalDocument(path: String) {
        guard let url = URL(string: "https://www.gleaum.com\(path)?platform=ios"),
              let presenter = Self.topViewController else {
            return
        }
        let title = path.contains("privacy") ? "개인정보처리방침" : "이용약관"
        presenter.present(LegalDocumentViewController(title: title, url: url), animated: true)
    }

    private func exchangeAppleCredential(_ credential: NativeAppleCredential) async {
        do {
            let response = try await NativeAuthClient.shared.signIn(
                provider: .apple,
                idToken: credential.idToken,
                rawNonce: credential.rawNonce
            )
            guard let sessionJSON = response.sessionJSON else {
                throw NativeAuthError.invalidResponse
            }
            if let displayName = credential.displayName {
                await NativeAuthClient.shared.updateDisplayName(
                    displayName,
                    sessionJSON: sessionJSON
                )
            }
            completeAuthentication(sessionJSON)
        } catch {
            setLoading(false)
            showError(error.localizedDescription)
        }
    }

    private func completeAuthentication(_ sessionJSON: String) {
        guard SessionManager.shared.saveSession(sessionJSON) else {
            setLoading(false)
            showError("로그인 정보를 안전하게 저장하지 못했습니다. 다시 시도해 주세요.")
            return
        }
        setLoading(false)
    }

    private func setLoading(_ loading: Bool) {
        isLoading = loading
        if loading {
            inlineMessage = nil
        }
    }

    private func showInlineError(_ message: String) {
        inlineMessage = InlineMessage(text: message, isError: true)
        UIAccessibility.post(notification: .announcement, argument: message)
    }

    private func showError(_ message: String) {
        alertMessage = message
        showsAlert = true
    }

    private static func isValidEmail(_ email: String) -> Bool {
        let pattern = #"^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$"#
        return email.range(
            of: pattern,
            options: [.regularExpression, .caseInsensitive]
        ) != nil
    }

    private static var presentationWindow: UIWindow? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow)
    }

    private static var topViewController: UIViewController? {
        var controller = presentationWindow?.rootViewController
        while let presented = controller?.presentedViewController {
            controller = presented
        }
        return controller
    }
}

private struct AppleContinueButton: UIViewRepresentable {
    let action: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(action: action)
    }

    func makeUIView(context: Context) -> ASAuthorizationAppleIDButton {
        let button = ASAuthorizationAppleIDButton(type: .continue, style: .white)
        button.cornerRadius = GleaumIOSMetric.controlCornerRadius
        button.addTarget(
            context.coordinator,
            action: #selector(Coordinator.trigger),
            for: .touchUpInside
        )
        return button
    }

    func updateUIView(_ uiView: ASAuthorizationAppleIDButton, context: Context) {
        context.coordinator.action = action
    }

    final class Coordinator: NSObject {
        var action: () -> Void

        init(action: @escaping () -> Void) {
            self.action = action
        }

        @objc func trigger() {
            action()
        }
    }
}

private struct GoogleContinueButton: View {
    let isEnabled: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image("GoogleGOfficial")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 20, height: 20)

                Text("Google로 계속하기")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color(red: 0.122, green: 0.122, blue: 0.122))
            }
            .frame(maxWidth: .infinity)
            .frame(height: GleaumIOSMetric.authenticationControlHeight)
            .background(.white)
            .overlay {
                RoundedRectangle(cornerRadius: GleaumIOSMetric.controlCornerRadius)
                    .stroke(Color(red: 0.455, green: 0.467, blue: 0.459), lineWidth: 1)
            }
            .clipShape(
                RoundedRectangle(cornerRadius: GleaumIOSMetric.controlCornerRadius)
            )
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .opacity(isEnabled ? 1 : 0.56)
        .accessibilityLabel("Google로 계속하기")
    }
}

private struct GleaumSecondaryAuthenticationButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(.white)
            .background(
                configuration.isPressed
                    ? Color.white.opacity(0.12)
                    : Color.white.opacity(0.06)
            )
            .overlay {
                RoundedRectangle(cornerRadius: GleaumIOSMetric.controlCornerRadius)
                    .stroke(GleaumLoginPalette.separator, lineWidth: 1)
            }
            .clipShape(
                RoundedRectangle(cornerRadius: GleaumIOSMetric.controlCornerRadius)
            )
    }
}

private enum GleaumLoginPalette {
    static let background = Color(
        red: 0.039,
        green: 0.043,
        blue: 0.063
    )
    static let heroGlow = Color(
        red: 0.035,
        green: 0.086,
        blue: 0.145
    )
    static let field = Color.white.opacity(0.08)
    static let separator = Color.white.opacity(0.16)
    static let secondaryText = Color.white.opacity(0.70)
    static let tertiaryText = Color.white.opacity(0.48)
    static let placeholder = Color.white.opacity(0.36)
    static let error = Color(
        red: 1,
        green: 0.47,
        blue: 0.43
    )
}

private extension View {
    func gleaumLoginFieldStyle() -> some View {
        self
            .padding(.horizontal, 16)
            .frame(height: GleaumIOSMetric.textFieldHeight)
            .background(GleaumLoginPalette.field)
            .overlay {
                RoundedRectangle(cornerRadius: GleaumIOSMetric.controlCornerRadius)
                    .stroke(GleaumLoginPalette.separator, lineWidth: 1)
            }
            .clipShape(
                RoundedRectangle(cornerRadius: GleaumIOSMetric.controlCornerRadius)
            )
    }
}
