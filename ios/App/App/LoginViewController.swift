import UIKit
import SwiftUI
import SafariServices

/// 기존 Google OAuth·세션 계약을 유지하면서 화면 계층만 SwiftUI로 전환합니다.
final class LoginViewController: UIViewController, SFSafariViewControllerDelegate {
    private var hostingController: UIHostingController<GleaumLoginView>?

    override func viewDidLoad() {
        super.viewDidLoad()
        installSwiftUIContent()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        checkSessionAndDismiss()

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onSessionSaved),
            name: .gleaumSessionSaved,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onAppDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        NotificationCenter.default.removeObserver(self)
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        .darkContent
    }

    private func installSwiftUIContent() {
        let content = GleaumLoginView { [weak self] in
            self?.presentGoogleSignIn()
        }
        let host = UIHostingController(rootView: content)
        host.view.backgroundColor = .clear

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

    @objc private func onSessionSaved() {
        checkSessionAndDismiss()
    }

    @objc private func onAppDidBecomeActive() {
        var attempts = 0

        func retry() {
            attempts += 1
            if SessionManager.shared.hasValidSession() {
                DispatchQueue.main.async { [weak self] in
                    self?.dismiss(animated: true)
                }
                return
            }

            if attempts < 10 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    retry()
                }
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            retry()
        }
    }

    private func checkSessionAndDismiss() {
        guard SessionManager.shared.hasValidSession() else {
            return
        }
        dismiss(animated: true)
    }

    private func presentGoogleSignIn() {
        guard var components = URLComponents(
            url: GleaumSupabaseConfiguration.app.baseURL
                .appendingPathComponent("auth/v1/authorize"),
            resolvingAgainstBaseURL: false
        ) else {
            return
        }

        components.queryItems = [
            URLQueryItem(name: "provider", value: "google"),
            URLQueryItem(name: "redirect_to", value: "gleaum://auth/callback"),
            URLQueryItem(name: "flow_type", value: "implicit"),
            URLQueryItem(name: "prompt", value: "select_account"),
        ]

        guard let url = components.url else {
            return
        }

        let safariController = SFSafariViewController(url: url)
        safariController.preferredBarTintColor = UIColor(
            red: 0.039,
            green: 0.043,
            blue: 0.063,
            alpha: 1
        )
        safariController.preferredControlTintColor = .white
        safariController.modalPresentationStyle = .fullScreen
        safariController.delegate = self
        present(safariController, animated: true)
    }
}
