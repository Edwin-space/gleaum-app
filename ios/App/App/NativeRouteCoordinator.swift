import UIKit
import WebKit
import Capacitor

final class NativeRouteCoordinator {
    static let shared = NativeRouteCoordinator()

    // 운영 API(`/api/native/home-summary`)가 배포되기 전까지는 네이티브 홈을 시도하지 않는다.
    // true로 전환하면 /home 진입 시 NativeHomeViewController를 먼저 표시한다.
    private let nativeHomeEnabled = true
    var prefersNativeHome = true
    private var pendingPath: String?

    private init() {}

    func consumePendingPath() -> String? {
        let path = pendingPath
        pendingPath = nil
        return path
    }

    @discardableResult
    func handle(url: URL) -> Bool {
        if url.scheme == "gleaum", url.host == "logout" { return false }
        if url.scheme == "gleaum", url.host == "auth" { return false }

        if url.scheme == "gleaum" {
            let path = nativePath(from: url)
            route(path: path)
            return true
        }

        if url.host == "gleaum.com" || url.host == "www.gleaum.com" {
            route(path: url.path.isEmpty ? "/home" : url.path)
            return true
        }

        return false
    }

    func route(path: String) {
        if path == "/" || path == "/home" {
            if nativeHomeEnabled {
                prefersNativeHome = true
                presentNativeHome()
            } else {
                openWebPath("/home")
            }
            return
        }

        prefersNativeHome = false
        pendingPath = path
        openWebPath(path)
    }

    func openWebPath(_ path: String) {
        prefersNativeHome = false

        guard let root = rootBridgeViewController() else {
            pendingPath = path
            return
        }

        let encodedPath = path.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? path
        let url = URL(string: "https://www.gleaum.com\(encodedPath)")!

        DispatchQueue.main.async {
            root.dismiss(animated: false) {
                root.webView?.load(URLRequest(url: url))
            }
        }
    }

    func presentNativeHome() {
        guard nativeHomeEnabled else {
            openWebPath("/home")
            return
        }

        guard SessionManager.shared.hasValidSession() else { return }
        guard let root = rootBridgeViewController() else { return }
        let top = topMostViewController(from: root)
        if top is LoginViewController { return }
        if top is NativeHomeViewController { return }

        DispatchQueue.main.async {
            let home = NativeHomeViewController()
            home.modalPresentationStyle = .fullScreen
            home.modalTransitionStyle = .crossDissolve
            top.present(home, animated: true)
        }
    }

    private func nativePath(from url: URL) -> String {
        if url.host == "invite" {
            let code = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
            return code.isEmpty ? "/invite" : "/invite/\(code)"
        }
        if let host = url.host, host != "" {
            let suffix = url.path == "/" ? "" : url.path
            return "/\(host)\(suffix)"
        }
        return url.path.isEmpty ? "/home" : url.path
    }

    private func rootBridgeViewController() -> CAPBridgeViewController? {
        let root = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first(where: \.isKeyWindow)?
            .rootViewController
        return root as? CAPBridgeViewController
    }

    private func topMostViewController(from root: UIViewController) -> UIViewController {
        if let nav = root as? UINavigationController, let visible = nav.visibleViewController {
            return topMostViewController(from: visible)
        }
        if let tab = root as? UITabBarController, let selected = tab.selectedViewController {
            return topMostViewController(from: selected)
        }
        if let presented = root.presentedViewController {
            return topMostViewController(from: presented)
        }
        return root
    }
}
