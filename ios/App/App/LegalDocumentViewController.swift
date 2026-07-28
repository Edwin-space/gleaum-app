import UIKit
import WebKit

/// 약관 원문을 앱 밖으로 이탈하지 않고 확인하는 최소 WebView 컨테이너입니다.
final class LegalDocumentViewController: UIViewController, WKNavigationDelegate {
    private let documentTitle: String
    private let url: URL
    private let onClose: (() -> Void)?
    private lazy var webView: WKWebView = {
        let configuration = WKWebViewConfiguration()
        let nativeContextScript = WKUserScript(
            source: """
            window.Capacitor = window.Capacitor || {};
            window.Capacitor.isNativePlatform = function() { return true; };
            window.Capacitor.getPlatform = function() { return 'ios'; };
            try { sessionStorage.setItem('gleaum_pwa_banner_dismissed', '1'); } catch (_) {}
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        configuration.userContentController.addUserScript(nativeContextScript)
        return WKWebView(frame: .zero, configuration: configuration)
    }()
    private let loadingIndicator = UIActivityIndicatorView(style: .medium)
    private let errorLabel = UILabel()

    init(title: String, url: URL, onClose: (() -> Void)? = nil) {
        self.documentTitle = title
        self.url = url
        self.onClose = onClose
        super.init(nibName: nil, bundle: nil)
        modalPresentationStyle = .fullScreen
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = GleaumUIColor.background
        setupLayout()
        webView.navigationDelegate = self
        webView.load(URLRequest(url: url))
        loadingIndicator.startAnimating()
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        traitCollection.userInterfaceStyle == .dark ? .lightContent : .darkContent
    }

    private func setupLayout() {
        let header = UIView()
        header.translatesAutoresizingMaskIntoConstraints = false
        header.backgroundColor = GleaumUIColor.surface

        let titleLabel = UILabel()
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.text = documentTitle
        titleLabel.textColor = GleaumUIColor.text
        titleLabel.font = .systemFont(ofSize: 17, weight: .bold)

        let closeTop = UIButton(type: .system)
        closeTop.translatesAutoresizingMaskIntoConstraints = false
        closeTop.setImage(UIImage(systemName: "xmark"), for: .normal)
        closeTop.tintColor = GleaumUIColor.text
        closeTop.accessibilityLabel = "닫기"
        closeTop.addTarget(self, action: #selector(close), for: .touchUpInside)

        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.isOpaque = false
        webView.backgroundColor = GleaumUIColor.background
        webView.scrollView.backgroundColor = GleaumUIColor.background

        let footer = UIView()
        footer.translatesAutoresizingMaskIntoConstraints = false
        footer.backgroundColor = GleaumUIColor.surface

        let closeBottom = UIButton(type: .system)
        closeBottom.translatesAutoresizingMaskIntoConstraints = false
        var configuration = UIButton.Configuration.filled()
        configuration.title = "확인하고 닫기"
        configuration.baseBackgroundColor = GleaumUIColor.brandTeal
        configuration.baseForegroundColor = UIColor(red: 0.039, green: 0.043, blue: 0.063, alpha: 1)
        configuration.cornerStyle = .fixed
        configuration.background.cornerRadius = 14
        closeBottom.configuration = configuration
        closeBottom.addTarget(self, action: #selector(close), for: .touchUpInside)

        loadingIndicator.translatesAutoresizingMaskIntoConstraints = false
        loadingIndicator.color = GleaumUIColor.brandTeal
        loadingIndicator.hidesWhenStopped = true

        errorLabel.translatesAutoresizingMaskIntoConstraints = false
        errorLabel.text = "문서를 불러오지 못했습니다.\n네트워크 연결을 확인한 뒤 다시 시도해 주세요."
        errorLabel.textColor = GleaumUIColor.mutedText
        errorLabel.font = .systemFont(ofSize: 14, weight: .medium)
        errorLabel.textAlignment = .center
        errorLabel.numberOfLines = 0
        errorLabel.isHidden = true

        view.addSubview(header)
        header.addSubview(titleLabel)
        header.addSubview(closeTop)
        view.addSubview(webView)
        view.addSubview(footer)
        footer.addSubview(closeBottom)
        view.addSubview(loadingIndicator)
        view.addSubview(errorLabel)

        NSLayoutConstraint.activate([
            header.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            header.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            header.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            header.heightAnchor.constraint(equalToConstant: 56),

            titleLabel.centerYAnchor.constraint(equalTo: header.centerYAnchor),
            titleLabel.leadingAnchor.constraint(equalTo: header.leadingAnchor, constant: 20),
            closeTop.centerYAnchor.constraint(equalTo: header.centerYAnchor),
            closeTop.trailingAnchor.constraint(equalTo: header.trailingAnchor, constant: -16),
            closeTop.widthAnchor.constraint(equalToConstant: 44),
            closeTop.heightAnchor.constraint(equalToConstant: 44),

            webView.topAnchor.constraint(equalTo: header.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: footer.topAnchor),

            footer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            footer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            footer.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -76),
            footer.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            closeBottom.leadingAnchor.constraint(equalTo: footer.leadingAnchor, constant: 20),
            closeBottom.trailingAnchor.constraint(equalTo: footer.trailingAnchor, constant: -20),
            closeBottom.topAnchor.constraint(equalTo: footer.topAnchor, constant: 12),
            closeBottom.heightAnchor.constraint(equalToConstant: 52),

            loadingIndicator.centerXAnchor.constraint(equalTo: webView.centerXAnchor),
            loadingIndicator.centerYAnchor.constraint(equalTo: webView.centerYAnchor),
            errorLabel.centerXAnchor.constraint(equalTo: webView.centerXAnchor),
            errorLabel.centerYAnchor.constraint(equalTo: webView.centerYAnchor),
            errorLabel.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 30),
            errorLabel.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -30),
        ])
    }

    @objc private func close() {
        if let onClose {
            onClose()
        } else {
            dismiss(animated: true)
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        loadingIndicator.stopAnimating()
        errorLabel.isHidden = true
    }

    func webView(
        _ webView: WKWebView,
        didFail navigation: WKNavigation!,
        withError error: Error
    ) {
        showLoadError()
    }

    func webView(
        _ webView: WKWebView,
        didFailProvisionalNavigation navigation: WKNavigation!,
        withError error: Error
    ) {
        showLoadError()
    }

    private func showLoadError() {
        loadingIndicator.stopAnimating()
        errorLabel.isHidden = false
    }
}
