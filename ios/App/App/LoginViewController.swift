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
 * - 이메일 주소로 사용하기 → OTP 입력 화면
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
        ]
        guard let url = components.url else { return }

        let safariVC = SFSafariViewController(url: url)
        safariVC.preferredBarTintColor = bgColor
        safariVC.preferredControlTintColor = .white
        safariVC.modalPresentationStyle = .fullScreen
        safariVC.delegate = self
        present(safariVC, animated: true)
    }

    // MARK: - Email OTP

    @objc private func handleEmailSignIn() {
        let emailVC = EmailLoginViewController()
        emailVC.modalPresentationStyle = .fullScreen
        present(emailVC, animated: true)
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

        // ── 이메일 링크 ───────────────────────────────────────────────
        let emailBtn = UIButton(type: .system)
        let emailAttr = NSAttributedString(
            string: "이메일 주소로 사용하기",
            attributes: [
                .font: UIFont.systemFont(ofSize: 13, weight: .regular),
                .foregroundColor: grayColor,
                .underlineStyle: NSUnderlineStyle.single.rawValue,
            ]
        )
        emailBtn.setAttributedTitle(emailAttr, for: .normal)
        emailBtn.addTarget(self, action: #selector(handleEmailSignIn), for: .touchUpInside)
        emailBtn.translatesAutoresizingMaskIntoConstraints = false

        // ── 약관 ──────────────────────────────────────────────────────
        let termsLabel = UILabel()
        termsLabel.text          = "로그인 시 이용약관 및 개인정보처리방침에\n동의하는 것으로 간주됩니다."
        termsLabel.font          = .systemFont(ofSize: 11)
        termsLabel.textColor     = UIColor(white: 1, alpha: 0.28)
        termsLabel.textAlignment = .center
        termsLabel.numberOfLines = 0
        termsLabel.translatesAutoresizingMaskIntoConstraints = false

        // ── 뷰 계층 ───────────────────────────────────────────────────
        [logo, appName, subText, tagline, googleBtn, emailBtn, termsLabel].forEach {
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
            googleBtn.bottomAnchor.constraint(equalTo: emailBtn.topAnchor, constant: -16),
            googleBtn.heightAnchor.constraint(equalToConstant: 54),

            // 이메일 버튼
            emailBtn.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            emailBtn.bottomAnchor.constraint(equalTo: termsLabel.topAnchor, constant: -20),

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

// MARK: - EmailLoginViewController (이메일 OTP)

class EmailLoginViewController: UIViewController {

    private let bgColor    = UIColor(red: 0.039, green: 0.043, blue: 0.063, alpha: 1)
    private let blueColor  = UIColor(red: 0.000, green: 0.518, blue: 0.800, alpha: 1)
    private let supabaseUrl = "https://tyvjdsescukaeorcuaga.supabase.co"
    private let anonKey     = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5dmpkc2VzY3VrYWVvcmN1YWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODUxNDksImV4cCI6MjA5MzA2MTE0OX0.oFPpDadJIGbEe7du222Wr0ZdRnBJp46-v7oQbBfszqE"

    private var emailField = UITextField()
    private var otpField   = UITextField()
    private var currentEmail = ""
    private var isOtpStep  = false

    private lazy var titleLabel: UILabel = {
        let l = UILabel()
        l.text      = "이메일로 로그인"
        l.font      = .systemFont(ofSize: 22, weight: .bold)
        l.textColor = .white
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private lazy var descLabel: UILabel = {
        let l = UILabel()
        l.text          = "이전에 Google로 가입한 이메일을 입력하세요."
        l.font          = .systemFont(ofSize: 13)
        l.textColor     = UIColor(white: 1, alpha: 0.55)
        l.numberOfLines = 0
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private lazy var actionButton: UIButton = {
        let b = UIButton(type: .custom)
        b.setTitle("인증 코드 발송", for: .normal)
        b.backgroundColor    = blueColor
        b.layer.cornerRadius = 14
        b.titleLabel?.font   = .systemFont(ofSize: 16, weight: .semibold)
        b.addTarget(self, action: #selector(handleAction), for: .touchUpInside)
        b.translatesAutoresizingMaskIntoConstraints = false
        return b
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = bgColor
        setupUI()
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    private func setupUI() {
        let backBtn = UIButton(type: .system)
        backBtn.setTitle("← 뒤로", for: .normal)
        backBtn.setTitleColor(UIColor(white: 1, alpha: 0.55), for: .normal)
        backBtn.addTarget(self, action: #selector(goBack), for: .touchUpInside)
        backBtn.translatesAutoresizingMaskIntoConstraints = false

        emailField.placeholder        = "이메일 주소"
        emailField.keyboardType       = .emailAddress
        emailField.textColor          = .white
        emailField.backgroundColor    = UIColor(white: 1, alpha: 0.08)
        emailField.layer.cornerRadius = 12
        emailField.setLeftPadding(16)
        emailField.translatesAutoresizingMaskIntoConstraints = false

        otpField.placeholder        = "6자리 코드"
        otpField.keyboardType       = .numberPad
        otpField.textColor          = .white
        otpField.backgroundColor    = UIColor(white: 1, alpha: 0.08)
        otpField.layer.cornerRadius = 12
        otpField.setLeftPadding(16)
        otpField.isHidden           = true
        otpField.translatesAutoresizingMaskIntoConstraints = false

        [backBtn, titleLabel, descLabel, emailField, otpField, actionButton].forEach {
            view.addSubview($0)
        }

        let safe = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            backBtn.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            backBtn.topAnchor.constraint(equalTo: safe.topAnchor, constant: 16),

            titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            titleLabel.topAnchor.constraint(equalTo: backBtn.bottomAnchor, constant: 32),

            descLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            descLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
            descLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),

            emailField.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            emailField.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
            emailField.topAnchor.constraint(equalTo: descLabel.bottomAnchor, constant: 32),
            emailField.heightAnchor.constraint(equalToConstant: 52),

            otpField.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            otpField.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
            otpField.topAnchor.constraint(equalTo: descLabel.bottomAnchor, constant: 32),
            otpField.heightAnchor.constraint(equalToConstant: 52),

            actionButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            actionButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
            actionButton.topAnchor.constraint(equalTo: emailField.bottomAnchor, constant: 20),
            actionButton.heightAnchor.constraint(equalToConstant: 52),
        ])
    }

    @objc private func goBack() { dismiss(animated: true) }

    @objc private func handleAction() {
        if isOtpStep {
            verifyOTP()
        } else {
            sendOTP()
        }
    }

    private func sendOTP() {
        guard let email = emailField.text?.trimmingCharacters(in: .whitespaces), !email.isEmpty else { return }
        currentEmail = email

        guard let url = URL(string: "\(supabaseUrl)/auth/v1/otp") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue(anonKey, forHTTPHeaderField: "apikey")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["email": email, "create_user": false])

        URLSession.shared.dataTask(with: req) { [weak self] _, response, _ in
            DispatchQueue.main.async {
                if let httpResp = response as? HTTPURLResponse, httpResp.statusCode == 200 {
                    self?.switchToOtpStep()
                } else {
                    self?.showAlert("이메일을 찾을 수 없습니다. Google 로그인을 먼저 이용해 주세요.")
                }
            }
        }.resume()
    }

    private func switchToOtpStep() {
        isOtpStep = true
        emailField.isHidden = true
        otpField.isHidden   = false
        descLabel.text = "\(currentEmail)으로\n6자리 코드를 보냈습니다."
        actionButton.setTitle("확인", for: .normal)
    }

    private func verifyOTP() {
        guard let otp = otpField.text?.trimmingCharacters(in: .whitespaces), otp.count == 6 else { return }

        guard let url = URL(string: "\(supabaseUrl)/auth/v1/verify") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue(anonKey, forHTTPHeaderField: "apikey")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: [
            "type": "email", "token": otp, "email": currentEmail,
        ])

        URLSession.shared.dataTask(with: req) { [weak self] data, response, _ in
            guard let self = self,
                  let httpResp = response as? HTTPURLResponse,
                  httpResp.statusCode == 200,
                  let data = data,
                  var json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            else {
                DispatchQueue.main.async { self?.showAlert("인증 코드가 올바르지 않습니다.") }
                return
            }

            // expires_at 추가
            let expiresIn = json["expires_in"] as? TimeInterval ?? 3600
            json["expires_at"] = Date().timeIntervalSince1970 + expiresIn
            if let sessionData = try? JSONSerialization.data(withJSONObject: json),
               let sessionStr = String(data: sessionData, encoding: .utf8) {
                SessionManager.shared.saveSession(sessionStr)
            }

            DispatchQueue.main.async { self.dismiss(animated: true) }
        }.resume()
    }

    private func showAlert(_ msg: String) {
        let alert = UIAlertController(title: nil, message: msg, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "확인", style: .default))
        present(alert, animated: true)
    }
}

// MARK: - UITextField 패딩 헬퍼

private extension UITextField {
    func setLeftPadding(_ amount: CGFloat) {
        let v = UIView(frame: CGRect(x: 0, y: 0, width: amount, height: frame.height))
        leftView = v
        leftViewMode = .always
    }
}
