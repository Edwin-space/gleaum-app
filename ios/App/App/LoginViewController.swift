import UIKit
import SafariServices

/**
 * LoginViewController — iOS 네이티브 로그인 화면
 *
 * - 검정 배경 + gleaum 브랜딩
 * - Google로 계속하기 → SFSafariViewController (Chrome Custom Tab 상당)
 *   → Supabase OAuth → gleaum://auth/callback
 *   → NativeAppProvider가 코드 교환 + NativeSession.saveSession() 호출
 *   → SessionManager 세션 저장 알림 → 자동 dismiss
 */
class LoginViewController: UIViewController, SFSafariViewControllerDelegate {

    // MARK: - 색상
    private let bgColor    = UIColor(red: 0.039, green: 0.043, blue: 0.063, alpha: 1)  // #0A0B10
    private let tealColor  = UIColor(red: 0.047, green: 0.788, blue: 0.710, alpha: 1)  // #0CC9B5
    private let blueColor  = UIColor(red: 0.000, green: 0.518, blue: 0.800, alpha: 1)  // #0084CC
    private let grayColor  = UIColor(red: 0.557, green: 0.557, blue: 0.576, alpha: 1)  // #8E8E93

    // MARK: - Supabase
    private let supabaseUrl = "https://tyvjdsescukaeorcuaga.supabase.co"

    // MARK: - Life Cycle

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = bgColor
        setupUI()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        checkSessionAndDismiss()
        NotificationCenter.default.addObserver(
            self, selector: #selector(onSessionSaved),
            name: .gleaumSessionSaved, object: nil
        )
        NotificationCenter.default.addObserver(
            self, selector: #selector(onAppDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification, object: nil
        )
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        NotificationCenter.default.removeObserver(self)
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    // MARK: - Session Check

    @objc private func onSessionSaved() {
        checkSessionAndDismiss()
    }

    @objc private func onAppDidBecomeActive() {
        // OAuth 브라우저에서 앱 복귀 후 세션 반복 확인
        // NativeSession.saveSession() 처리 시간 고려해 최대 5초 재시도
        var attempts = 0
        func retry() {
            attempts += 1
            if SessionManager.shared.hasValidSession() {
                DispatchQueue.main.async { [weak self] in self?.dismiss(animated: true) }
                return
            }
            if attempts < 10 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { retry() }
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { retry() }
    }

    private func checkSessionAndDismiss() {
        if SessionManager.shared.hasValidSession() {
            dismiss(animated: true)
        }
    }

    // MARK: - Google Sign-In (SFSafariViewController)

    @objc private func handleGoogleSignIn() {
        guard var components = URLComponents(string: "\(supabaseUrl)/auth/v1/authorize") else { return }
        components.queryItems = [
            URLQueryItem(name: "provider",    value: "google"),
            URLQueryItem(name: "redirect_to", value: "gleaum://auth/callback"),
            URLQueryItem(name: "flow_type",   value: "implicit"),
            // Google 계정 선택 화면을 항상 노출해 최근 계정 자동 로그인을 방지한다.
            URLQueryItem(name: "prompt",      value: "select_account"),
        ]
        guard let url = components.url else { return }

        let safariVC = SFSafariViewController(url: url)
        safariVC.preferredBarTintColor = bgColor
        safariVC.preferredControlTintColor = .white
        safariVC.modalPresentationStyle = .fullScreen
        safariVC.delegate = self
        present(safariVC, animated: true)
    }

    // MARK: - UI

    private func setupUI() {
        // ── 상단 그라디언트 배경 ──────────────────────────────────────
        let gradientLayer = CAGradientLayer()
        gradientLayer.colors = [
            UIColor(red: 0.059, green: 0.102, blue: 0.180, alpha: 1).cgColor, // #0F1A2E
            bgColor.cgColor,
        ]
        gradientLayer.startPoint = CGPoint(x: 0.5, y: 0)
        gradientLayer.endPoint   = CGPoint(x: 0.5, y: 1)
        gradientLayer.frame      = CGRect(x: 0, y: 0, width: UIScreen.main.bounds.width,
                                          height: UIScreen.main.bounds.height * 0.6)
        view.layer.addSublayer(gradientLayer)

        // ── 로고 ──────────────────────────────────────────────────────
        let logo = UIImageView(image: UIImage(named: "AppIcon"))
        logo.contentMode    = .scaleAspectFit
        logo.layer.cornerRadius = 18
        logo.clipsToBounds  = true
        logo.translatesAutoresizingMaskIntoConstraints = false

        // ── 앱 이름 ───────────────────────────────────────────────────
        let appName = UILabel()
        appName.text          = "gleaum"
        appName.font          = .systemFont(ofSize: 34, weight: .black)
        appName.textColor     = .white
        appName.textAlignment = .center
        appName.translatesAutoresizingMaskIntoConstraints = false

        // ── 서브 텍스트 ───────────────────────────────────────────────
        let subText = UILabel()
        subText.text          = "Making everyday life shine together"
        subText.font          = .systemFont(ofSize: 12, weight: .medium)
        subText.textColor     = tealColor
        subText.textAlignment = .center
        subText.translatesAutoresizingMaskIntoConstraints = false

        // ── 태그라인 ──────────────────────────────────────────────────
        let tagline = UILabel()
        tagline.numberOfLines = 0
        tagline.textAlignment = .center
        tagline.translatesAutoresizingMaskIntoConstraints = false

        let tagText = NSMutableAttributedString(
            string: "나, 그리고 연인/가족의\n",
            attributes: [
                .font: UIFont.systemFont(ofSize: 16, weight: .regular),
                .foregroundColor: UIColor(white: 1, alpha: 0.7),
            ]
        )
        tagText.append(NSAttributedString(
            string: "일상 네트워크",
            attributes: [
                .font: UIFont.systemFont(ofSize: 16, weight: .bold),
                .foregroundColor: tealColor,
            ]
        ))
        tagline.attributedText = tagText

        // ── Google 버튼 ───────────────────────────────────────────────
        let googleBtn = makeGoogleButton()

        // ── 약관 ──────────────────────────────────────────────────────
        let termsLabel = UILabel()
        termsLabel.text          = "로그인 시 이용약관 및 개인정보처리방침에\n동의하는 것으로 간주됩니다."
        termsLabel.font          = .systemFont(ofSize: 11)
        termsLabel.textColor     = UIColor(white: 1, alpha: 0.28)
        termsLabel.textAlignment = .center
        termsLabel.numberOfLines = 0
        termsLabel.translatesAutoresizingMaskIntoConstraints = false

        // ── 뷰 계층 ───────────────────────────────────────────────────
        [logo, appName, subText, tagline, googleBtn, termsLabel].forEach {
            view.addSubview($0)
        }

        let safe = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            // 로고
            logo.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            logo.topAnchor.constraint(equalTo: safe.topAnchor, constant: 72),
            logo.widthAnchor.constraint(equalToConstant: 72),
            logo.heightAnchor.constraint(equalToConstant: 72),

            // 앱 이름
            appName.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            appName.topAnchor.constraint(equalTo: logo.bottomAnchor, constant: 14),

            // 서브 텍스트
            subText.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            subText.topAnchor.constraint(equalTo: appName.bottomAnchor, constant: 8),

            // 태그라인
            tagline.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            tagline.topAnchor.constraint(equalTo: subText.bottomAnchor, constant: 16),

            // Google 버튼
            googleBtn.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            googleBtn.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
            googleBtn.bottomAnchor.constraint(equalTo: termsLabel.topAnchor, constant: -36),
            googleBtn.heightAnchor.constraint(equalToConstant: 54),

            // 약관
            termsLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            termsLabel.bottomAnchor.constraint(equalTo: safe.bottomAnchor, constant: -36),
            termsLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            termsLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
        ])
    }

    private func makeGoogleButton() -> UIButton {
        let btn = UIButton(type: .custom)
        btn.backgroundColor    = .white
        btn.layer.cornerRadius = 14
        btn.layer.shadowColor  = UIColor.black.cgColor
        btn.layer.shadowOpacity = 0.12
        btn.layer.shadowOffset = CGSize(width: 0, height: 2)
        btn.layer.shadowRadius = 6
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.addTarget(self, action: #selector(handleGoogleSignIn), for: .touchUpInside)

        // Google G 아이콘
        let iconConfig = UIImage.SymbolConfiguration(pointSize: 18, weight: .regular)
        let iconView = UIImageView()
        iconView.image = UIImage(named: "google_icon") ??
                         UIImage(systemName: "globe", withConfiguration: iconConfig)
        iconView.tintColor = UIColor(red: 0.255, green: 0.467, blue: 0.851, alpha: 1) // Google Blue
        iconView.contentMode = .scaleAspectFit
        iconView.translatesAutoresizingMaskIntoConstraints = false

        // 텍스트
        let label = UILabel()
        label.text      = "Google로 계속하기"
        label.font      = .systemFont(ofSize: 16, weight: .semibold)
        label.textColor = UIColor(red: 0.102, green: 0.106, blue: 0.180, alpha: 1) // #1A1B2E
        label.translatesAutoresizingMaskIntoConstraints = false

        btn.addSubview(iconView)
        btn.addSubview(label)

        NSLayoutConstraint.activate([
            iconView.widthAnchor.constraint(equalToConstant: 22),
            iconView.heightAnchor.constraint(equalToConstant: 22),
            iconView.leadingAnchor.constraint(equalTo: btn.leadingAnchor, constant: 20),
            iconView.centerYAnchor.constraint(equalTo: btn.centerYAnchor),

            label.centerXAnchor.constraint(equalTo: btn.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: btn.centerYAnchor),
        ])
        return btn
    }
}
