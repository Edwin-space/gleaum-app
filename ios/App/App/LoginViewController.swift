import AuthenticationServices
import UIKit

/// Apple·Google·이메일 인증을 하나의 Supabase 세션 상태로 연결하는 네이티브 로그인 화면입니다.
final class LoginViewController: UIViewController {
    private enum EmailMode {
        case signIn
        case signUp
    }

    private let backgroundColor = UIColor(red: 0.039, green: 0.043, blue: 0.063, alpha: 1)
    private let panelColor = UIColor(red: 0.071, green: 0.082, blue: 0.118, alpha: 0.96)
    private let textColor = UIColor.white
    private let mutedTextColor = UIColor(white: 1, alpha: 0.66)
    private let borderColor = UIColor(white: 1, alpha: 0.14)
    private let tealColor = GleaumUIColor.brandTeal

    private let scrollView = UIScrollView()
    private let contentStack = UIStackView()
    private let socialStack = UIStackView()
    private let emailStack = UIStackView()
    private weak var socialPanelContainer: UIView?
    private weak var emailPanelContainer: UIView?
    private let modeControl = UISegmentedControl(items: ["로그인", "회원가입"])
    private let nameField = LoginTextField(
        title: "이름 또는 닉네임",
        contentType: .name,
        secure: false
    )
    private let emailField = LoginTextField(
        title: "이메일",
        contentType: .emailAddress,
        secure: false
    )
    private let passwordField = LoginTextField(
        title: "비밀번호",
        contentType: .password,
        secure: true
    )
    private let consentStack = UIStackView()
    private let ageConsent = UISwitch()
    private let termsConsent = UISwitch()
    private let privacyConsent = UISwitch()
    private let allConsent = UISwitch()
    private let submitButton = UIButton(type: .system)
    private let googleButton = UIButton(type: .system)
    private let emailEntryButton = UIButton(type: .system)
    private let appleButton = ASAuthorizationAppleIDButton(type: .continue, style: .white)
    private let messageLabel = UILabel()
    private let loadingIndicator = UIActivityIndicatorView(style: .medium)

    private var emailMode: EmailMode = .signIn
    private var isLoading = false
    private var keyboardObservers: [NSObjectProtocol] = []
    private let appleCoordinator = NativeAppleSignInCoordinator()
    private let googleCoordinator = NativeGoogleOAuthCoordinator()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = backgroundColor
        setupBackground()
        setupLayout()
        setupKeyboardHandling()
        applyEmailMode(.signIn)
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onSessionSaved),
            name: .gleaumSessionSaved,
            object: nil
        )
        closeIfAuthenticated()
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        NotificationCenter.default.removeObserver(self)
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        keyboardObservers.forEach(NotificationCenter.default.removeObserver)
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    @objc private func onSessionSaved() {
        closeIfAuthenticated()
    }

    private func closeIfAuthenticated() {
        guard SessionManager.shared.hasValidSession() else {
            return
        }
        dismiss(animated: true)
    }

    private func setupBackground() {
        let gradient = CAGradientLayer()
        gradient.name = "login-background"
        gradient.colors = [
            UIColor(red: 0.059, green: 0.102, blue: 0.180, alpha: 1).cgColor,
            backgroundColor.cgColor,
        ]
        gradient.startPoint = CGPoint(x: 0.5, y: 0)
        gradient.endPoint = CGPoint(x: 0.5, y: 0.75)
        view.layer.insertSublayer(gradient, at: 0)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        view.layer.sublayers?
            .first(where: { $0.name == "login-background" })?
            .frame = view.bounds
    }

    private func setupLayout() {
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.keyboardDismissMode = .interactive
        scrollView.alwaysBounceVertical = true

        contentStack.translatesAutoresizingMaskIntoConstraints = false
        contentStack.axis = .vertical
        contentStack.spacing = 20
        contentStack.alignment = .fill

        socialStack.axis = .vertical
        socialStack.spacing = 12
        emailStack.axis = .vertical
        emailStack.spacing = 14

        view.addSubview(scrollView)
        scrollView.addSubview(contentStack)

        let readableWidth = contentStack.widthAnchor.constraint(lessThanOrEqualToConstant: 520)
        readableWidth.priority = .required
        NSLayoutConstraint.activate([
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.topAnchor.constraint(equalTo: view.topAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            contentStack.topAnchor.constraint(equalTo: scrollView.contentLayoutGuide.topAnchor, constant: 34),
            contentStack.bottomAnchor.constraint(equalTo: scrollView.contentLayoutGuide.bottomAnchor, constant: -32),
            contentStack.centerXAnchor.constraint(equalTo: scrollView.frameLayoutGuide.centerXAnchor),
            contentStack.leadingAnchor.constraint(greaterThanOrEqualTo: scrollView.frameLayoutGuide.leadingAnchor, constant: 24),
            contentStack.trailingAnchor.constraint(lessThanOrEqualTo: scrollView.frameLayoutGuide.trailingAnchor, constant: -24),
            readableWidth,
        ])

        let preferredWidth = contentStack.widthAnchor.constraint(
            equalTo: scrollView.frameLayoutGuide.widthAnchor,
            constant: -48
        )
        preferredWidth.priority = .defaultHigh
        preferredWidth.isActive = true

        contentStack.addArrangedSubview(brandHeader())
        contentStack.setCustomSpacing(30, after: contentStack.arrangedSubviews.last!)
        let socialPanel = socialPanel()
        let emailPanel = emailPanel()
        emailPanel.isHidden = true
        contentStack.addArrangedSubview(socialPanel)
        contentStack.addArrangedSubview(emailPanel)
        contentStack.addArrangedSubview(statusArea())
    }

    private func brandHeader() -> UIView {
        let stack = UIStackView()
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 8

        let logo = UIImageView(image: UIImage(named: "Splash"))
        logo.contentMode = .scaleAspectFit
        logo.accessibilityLabel = "글리움"
        NSLayoutConstraint.activate([
            logo.widthAnchor.constraint(equalToConstant: 70),
            logo.heightAnchor.constraint(equalToConstant: 70),
        ])

        let title = UILabel()
        title.text = "gleaum"
        title.font = .systemFont(ofSize: 34, weight: .black)
        title.textColor = textColor

        let subtitle = UILabel()
        subtitle.text = "Making everyday life shine together"
        subtitle.font = .systemFont(ofSize: 12, weight: .semibold)
        subtitle.textColor = tealColor

        let tagline = UILabel()
        tagline.text = "나, 그리고 연인/가족의 일상 네트워크"
        tagline.font = .systemFont(ofSize: 15, weight: .medium)
        tagline.textColor = mutedTextColor
        tagline.textAlignment = .center
        tagline.numberOfLines = 0

        [logo, title, subtitle, tagline].forEach(stack.addArrangedSubview)
        stack.setCustomSpacing(14, after: subtitle)
        return stack
    }

    private func socialPanel() -> UIView {
        let panel = panelContainer()
        socialPanelContainer = panel
        let title = sectionTitle("계정으로 계속하기")

        appleButton.cornerRadius = 14
        appleButton.heightAnchor.constraint(equalToConstant: 54).isActive = true
        appleButton.addTarget(self, action: #selector(startAppleSignIn), for: .touchUpInside)

        configureGoogleButton()
        configureEmailEntryButton()

        let legal = UILabel()
        legal.text = "로그인 또는 회원가입을 진행하면 글리움의 이용약관과 개인정보처리방침에 동의하는 것으로 간주됩니다."
        legal.textColor = UIColor(white: 1, alpha: 0.52)
        legal.font = .systemFont(ofSize: 11)
        legal.textAlignment = .center
        legal.numberOfLines = 0

        [title, appleButton, googleButton, emailEntryButton, legal, legalLinksRow()]
            .forEach(socialStack.addArrangedSubview)
        socialStack.setCustomSpacing(18, after: title)
        socialStack.setCustomSpacing(18, after: emailEntryButton)
        panel.addArrangedSubview(socialStack)
        return panel
    }

    private func emailPanel() -> UIView {
        let panel = panelContainer()
        emailPanelContainer = panel

        let backButton = UIButton(type: .system)
        var backConfiguration = UIButton.Configuration.plain()
        backConfiguration.title = "다른 방법 선택"
        backConfiguration.image = UIImage(systemName: "chevron.left")
        backConfiguration.imagePadding = 6
        backConfiguration.baseForegroundColor = mutedTextColor
        backConfiguration.contentInsets = .zero
        backButton.configuration = backConfiguration
        backButton.contentHorizontalAlignment = .leading
        backButton.addTarget(self, action: #selector(showSocialPanel), for: .touchUpInside)

        modeControl.selectedSegmentIndex = 0
        modeControl.selectedSegmentTintColor = tealColor
        modeControl.setTitleTextAttributes([.foregroundColor: UIColor.white], for: .selected)
        modeControl.setTitleTextAttributes([.foregroundColor: mutedTextColor], for: .normal)
        modeControl.addTarget(self, action: #selector(emailModeChanged), for: .valueChanged)
        modeControl.heightAnchor.constraint(equalToConstant: 38).isActive = true

        [nameField, emailField, passwordField].forEach {
            $0.heightAnchor.constraint(equalToConstant: 54).isActive = true
        }
        emailField.keyboardType = .emailAddress
        emailField.autocapitalizationType = .none
        emailField.autocorrectionType = .no
        passwordField.textContentType = .password

        configureConsentStack()
        configureSubmitButton()

        [backButton, sectionTitle("이메일 계정"), modeControl, nameField, emailField, passwordField, consentStack, submitButton]
            .forEach(emailStack.addArrangedSubview)
        emailStack.setCustomSpacing(6, after: backButton)
        emailStack.setCustomSpacing(18, after: modeControl)
        emailStack.setCustomSpacing(20, after: consentStack)
        panel.addArrangedSubview(emailStack)
        return panel
    }

    private func configureGoogleButton() {
        var configuration = UIButton.Configuration.filled()
        configuration.title = "Google로 계속하기"
        configuration.image = UIImage(named: "google_icon") ?? UIImage(systemName: "globe")
        configuration.imagePadding = 10
        configuration.baseBackgroundColor = .white
        configuration.baseForegroundColor = UIColor(red: 0.102, green: 0.106, blue: 0.180, alpha: 1)
        configuration.cornerStyle = .fixed
        configuration.background.cornerRadius = 14
        googleButton.configuration = configuration
        googleButton.heightAnchor.constraint(equalToConstant: 54).isActive = true
        googleButton.addTarget(self, action: #selector(startGoogleSignIn), for: .touchUpInside)
    }

    private func configureEmailEntryButton() {
        var configuration = UIButton.Configuration.bordered()
        configuration.title = "이메일로 계속하기"
        configuration.image = UIImage(systemName: "envelope")
        configuration.imagePadding = 10
        configuration.baseForegroundColor = .white
        configuration.cornerStyle = .fixed
        configuration.background.cornerRadius = 14
        configuration.background.strokeColor = borderColor
        configuration.background.strokeWidth = 1
        emailEntryButton.configuration = configuration
        emailEntryButton.heightAnchor.constraint(equalToConstant: 54).isActive = true
        emailEntryButton.addTarget(self, action: #selector(showEmailPanel), for: .touchUpInside)
    }

    private func configureConsentStack() {
        consentStack.axis = .vertical
        consentStack.spacing = 10

        let allRow = consentRow(
            title: "필수 항목 전체 동의",
            toggle: allConsent,
            weight: .bold
        )
        allConsent.addTarget(self, action: #selector(allConsentChanged), for: .valueChanged)

        let ageRow = consentRow(title: "[필수] 만 14세 이상입니다", toggle: ageConsent)
        ageConsent.addTarget(self, action: #selector(individualConsentChanged), for: .valueChanged)

        let termsRow = consentRow(
            title: "[필수] 이용약관 동의",
            toggle: termsConsent,
            actionTitle: "보기",
            action: #selector(openTerms)
        )
        termsConsent.addTarget(self, action: #selector(individualConsentChanged), for: .valueChanged)

        let privacyRow = consentRow(
            title: "[필수] 개인정보 수집·이용 동의",
            toggle: privacyConsent,
            actionTitle: "보기",
            action: #selector(openPrivacy)
        )
        privacyConsent.addTarget(self, action: #selector(individualConsentChanged), for: .valueChanged)

        [allRow, divider(), ageRow, termsRow, privacyRow].forEach(consentStack.addArrangedSubview)
    }

    private func consentRow(
        title: String,
        toggle: UISwitch,
        weight: UIFont.Weight = .regular,
        actionTitle: String? = nil,
        action: Selector? = nil
    ) -> UIView {
        let row = UIStackView()
        row.axis = .horizontal
        row.alignment = .center
        row.spacing = 8

        let label = UILabel()
        label.text = title
        label.textColor = textColor
        label.font = .systemFont(ofSize: 13, weight: weight)
        label.numberOfLines = 0
        toggle.onTintColor = tealColor
        toggle.transform = CGAffineTransform(scaleX: 0.82, y: 0.82)

        row.addArrangedSubview(label)
        row.addArrangedSubview(UIView())
        if let actionTitle, let action {
            let button = UIButton(type: .system)
            button.setTitle(actionTitle, for: .normal)
            button.setTitleColor(tealColor, for: .normal)
            button.titleLabel?.font = .systemFont(ofSize: 12, weight: .bold)
            button.addTarget(self, action: action, for: .touchUpInside)
            row.addArrangedSubview(button)
        }
        row.addArrangedSubview(toggle)
        return row
    }

    private func configureSubmitButton() {
        var configuration = UIButton.Configuration.filled()
        configuration.title = "로그인"
        configuration.baseBackgroundColor = tealColor
        configuration.baseForegroundColor = UIColor(red: 0.039, green: 0.043, blue: 0.063, alpha: 1)
        configuration.cornerStyle = .fixed
        configuration.background.cornerRadius = 14
        submitButton.configuration = configuration
        submitButton.titleLabel?.font = .systemFont(ofSize: 16, weight: .bold)
        submitButton.heightAnchor.constraint(equalToConstant: 54).isActive = true
        submitButton.addTarget(self, action: #selector(submitEmail), for: .touchUpInside)
    }

    private func legalLinksRow() -> UIView {
        let row = UIStackView()
        row.axis = .horizontal
        row.alignment = .center
        row.distribution = .equalCentering

        let terms = UIButton(type: .system)
        terms.setTitle("이용약관 보기", for: .normal)
        terms.addTarget(self, action: #selector(openTerms), for: .touchUpInside)

        let privacy = UIButton(type: .system)
        privacy.setTitle("개인정보처리방침 보기", for: .normal)
        privacy.addTarget(self, action: #selector(openPrivacy), for: .touchUpInside)

        [terms, privacy].forEach {
            $0.setTitleColor(tealColor, for: .normal)
            $0.titleLabel?.font = .systemFont(ofSize: 12, weight: .semibold)
            row.addArrangedSubview($0)
        }
        return row
    }

    private func statusArea() -> UIView {
        let stack = UIStackView()
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 10

        messageLabel.textColor = mutedTextColor
        messageLabel.font = .systemFont(ofSize: 13, weight: .medium)
        messageLabel.textAlignment = .center
        messageLabel.numberOfLines = 0
        messageLabel.isHidden = true

        loadingIndicator.color = tealColor
        loadingIndicator.hidesWhenStopped = true

        stack.addArrangedSubview(loadingIndicator)
        stack.addArrangedSubview(messageLabel)
        return stack
    }

    private func panelContainer() -> UIStackView {
        let panel = UIStackView()
        panel.axis = .vertical
        panel.layoutMargins = UIEdgeInsets(top: 22, left: 20, bottom: 22, right: 20)
        panel.isLayoutMarginsRelativeArrangement = true
        panel.backgroundColor = panelColor
        panel.layer.cornerRadius = 24
        panel.layer.borderWidth = 1
        panel.layer.borderColor = borderColor.cgColor
        return panel
    }

    private func sectionTitle(_ text: String) -> UILabel {
        let label = UILabel()
        label.text = text
        label.textColor = textColor
        label.font = .systemFont(ofSize: 18, weight: .bold)
        return label
    }

    private func divider() -> UIView {
        let line = UIView()
        line.backgroundColor = borderColor
        line.heightAnchor.constraint(equalToConstant: 1).isActive = true
        return line
    }

    @objc private func startAppleSignIn() {
        guard !isLoading, let window = view.window else {
            return
        }
        setLoading(true)
        appleCoordinator.start(presentationWindow: window) { [weak self] result in
            guard let self else {
                return
            }
            switch result {
            case .success(let credential):
                Task { @MainActor in
                    await self.exchangeAppleCredential(credential)
                }
            case .failure(let error):
                self.setLoading(false)
                if (error as? NativeAuthenticationCoordinatorError) != .cancelled {
                    self.showMessage(error.localizedDescription, isError: true)
                }
            }
        }
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
                await NativeAuthClient.shared.updateDisplayName(displayName, sessionJSON: sessionJSON)
            }
            completeAuthentication(sessionJSON)
        } catch {
            setLoading(false)
            showMessage(error.localizedDescription, isError: true)
        }
    }

    @objc private func startGoogleSignIn() {
        guard !isLoading, let window = view.window else {
            return
        }
        setLoading(true)
        googleCoordinator.start(presentationWindow: window) { [weak self] result in
            guard let self else {
                return
            }
            self.setLoading(false)
            switch result {
            case .success(let sessionJSON):
                self.completeAuthentication(sessionJSON)
            case .failure(let error):
                if (error as? NativeAuthenticationCoordinatorError) != .cancelled {
                    self.showMessage(error.localizedDescription, isError: true)
                }
            }
        }
    }

    @objc private func showEmailPanel() {
        guard !isLoading else {
            return
        }
        hideMessage()
        socialPanelContainer?.isHidden = true
        emailPanelContainer?.isHidden = false
        emailField.becomeFirstResponder()
    }

    @objc private func showSocialPanel() {
        guard !isLoading else {
            return
        }
        view.endEditing(true)
        hideMessage()
        emailPanelContainer?.isHidden = true
        socialPanelContainer?.isHidden = false
    }

    @objc private func emailModeChanged() {
        applyEmailMode(modeControl.selectedSegmentIndex == 0 ? .signIn : .signUp)
    }

    private func applyEmailMode(_ mode: EmailMode) {
        emailMode = mode
        let isSignUp = mode == .signUp
        nameField.isHidden = !isSignUp
        consentStack.isHidden = !isSignUp
        passwordField.textContentType = isSignUp ? .newPassword : .password
        submitButton.configuration?.title = isSignUp ? "회원가입" : "로그인"
        hideMessage()
    }

    @objc private func allConsentChanged() {
        [ageConsent, termsConsent, privacyConsent].forEach {
            $0.setOn(allConsent.isOn, animated: true)
        }
    }

    @objc private func individualConsentChanged() {
        let isAllOn = ageConsent.isOn && termsConsent.isOn && privacyConsent.isOn
        allConsent.setOn(isAllOn, animated: true)
    }

    @objc private func openTerms() {
        openLegalDocument(path: "/legal/terms")
    }

    @objc private func openPrivacy() {
        openLegalDocument(path: "/legal/privacy")
    }

    private func openLegalDocument(path: String) {
        guard let url = URL(
            string: "https://www.gleaum.com\(path)?view=android-app&device=phone&platform=ios"
        ) else {
            return
        }
        let title = path.contains("privacy") ? "개인정보처리방침" : "이용약관"
        let controller = LegalDocumentViewController(title: title, url: url)
        present(controller, animated: true)
    }

    @objc private func submitEmail() {
        guard !isLoading else {
            return
        }
        view.endEditing(true)

        let displayName = nameField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let email = emailField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let password = passwordField.text ?? ""

        guard Self.isValidEmail(email) else {
            showMessage("올바른 이메일 형식을 입력해 주세요.", isError: true)
            return
        }
        guard password.count >= 6 else {
            showMessage("비밀번호는 최소 6자 이상이어야 해요.", isError: true)
            return
        }
        if emailMode == .signUp {
            guard !displayName.isEmpty else {
                showMessage("이름 또는 닉네임을 입력해 주세요.", isError: true)
                return
            }
            guard ageConsent.isOn, termsConsent.isOn, privacyConsent.isOn else {
                showMessage("필수 동의 항목을 모두 확인해 주세요.", isError: true)
                return
            }
        }

        setLoading(true)
        Task { @MainActor in
            do {
                let response: NativeAuthResponse
                switch emailMode {
                case .signIn:
                    response = try await NativeAuthClient.shared.signIn(
                        email: email,
                        password: password
                    )
                case .signUp:
                    response = try await NativeAuthClient.shared.signUp(
                        email: email,
                        password: password,
                        displayName: displayName
                    )
                }

                if let sessionJSON = response.sessionJSON {
                    completeAuthentication(sessionJSON)
                } else {
                    setLoading(false)
                    modeControl.selectedSegmentIndex = 0
                    applyEmailMode(.signIn)
                    passwordField.text = ""
                    showMessage(
                        "가입 확인 메일을 보냈어요. 메일 인증 후 로그인해 주세요.",
                        isError: false
                    )
                }
            } catch {
                setLoading(false)
                showMessage(error.localizedDescription, isError: true)
            }
        }
    }

    private func completeAuthentication(_ sessionJSON: String) {
        guard SessionManager.shared.saveSession(sessionJSON) else {
            setLoading(false)
            showMessage("로그인 정보를 안전하게 저장하지 못했습니다. 다시 시도해 주세요.", isError: true)
            return
        }
        setLoading(false)
        closeIfAuthenticated()
    }

    private func setLoading(_ loading: Bool) {
        isLoading = loading
        if loading {
            loadingIndicator.startAnimating()
        } else {
            loadingIndicator.stopAnimating()
        }
        [googleButton, emailEntryButton, appleButton, submitButton, modeControl].forEach {
            $0.isEnabled = !loading
        }
        [nameField, emailField, passwordField, allConsent, ageConsent, termsConsent, privacyConsent].forEach {
            $0.isEnabled = !loading
        }
    }

    private func showMessage(_ message: String, isError: Bool) {
        messageLabel.text = message
        messageLabel.textColor = isError
            ? UIColor(red: 1, green: 0.55, blue: 0.50, alpha: 1)
            : tealColor
        messageLabel.isHidden = false
        UIAccessibility.post(notification: .announcement, argument: message)
    }

    private func hideMessage() {
        messageLabel.text = nil
        messageLabel.isHidden = true
    }

    private func setupKeyboardHandling() {
        keyboardObservers.append(NotificationCenter.default.addObserver(
            forName: UIResponder.keyboardWillChangeFrameNotification,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let self,
                  let frame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect else {
                return
            }
            let frameInView = self.view.convert(frame, from: nil)
            let overlap = max(0, self.view.bounds.maxY - frameInView.minY)
            self.scrollView.contentInset.bottom = overlap
            self.scrollView.verticalScrollIndicatorInsets.bottom = overlap
        }
        )
        keyboardObservers.append(NotificationCenter.default.addObserver(
            forName: UIResponder.keyboardWillHideNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.scrollView.contentInset.bottom = 0
            self?.scrollView.verticalScrollIndicatorInsets.bottom = 0
        }
        )
    }

    private static func isValidEmail(_ email: String) -> Bool {
        let pattern = #"^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$"#
        return email.range(of: pattern, options: [.regularExpression, .caseInsensitive]) != nil
    }
}

private final class LoginTextField: UITextField {
    init(title: String, contentType: UITextContentType?, secure: Bool) {
        super.init(frame: .zero)
        placeholder = title
        textContentType = contentType
        isSecureTextEntry = secure
        textColor = .white
        tintColor = GleaumUIColor.brandTeal
        backgroundColor = UIColor(white: 1, alpha: 0.07)
        layer.cornerRadius = 14
        layer.borderWidth = 1
        layer.borderColor = UIColor(white: 1, alpha: 0.12).cgColor
        font = .systemFont(ofSize: 15, weight: .medium)
        attributedPlaceholder = NSAttributedString(
            string: title,
            attributes: [.foregroundColor: UIColor(white: 1, alpha: 0.43)]
        )
        leftView = UIView(frame: CGRect(x: 0, y: 0, width: 16, height: 1))
        leftViewMode = .always
        rightView = UIView(frame: CGRect(x: 0, y: 0, width: 16, height: 1))
        rightViewMode = .always
        returnKeyType = .next
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
