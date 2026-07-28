import UIKit
import WebKit

@MainActor
final class NativeRouteCoordinator {
    static let shared = NativeRouteCoordinator()

    private let nativeHomeEnabled = true
    var prefersNativeHome = true

    private weak var legacyBridge: AppBridgeViewController?
    private var pendingPath: String?

    private init() {}

    var isNativeHomeEnabled: Bool {
        nativeHomeEnabled
    }

    func attachLegacyBridge(_ bridge: AppBridgeViewController) {
        legacyBridge = bridge
        bridge.modalPresentationStyle = .fullScreen
    }

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
            route(path: nativePath(from: url))
            return true
        }

        if url.host == "gleaum.com" || url.host == "www.gleaum.com" {
            route(path: url.path.isEmpty ? "/home" : url.path)
            return true
        }

        return false
    }

    func route(path: String) {
        if nativeHomeEnabled,
           SessionManager.shared.hasValidSession(),
           IOSAppModel.shared.handleNativeRoute(path: path) {
            prefersNativeHome = true
            pendingPath = nil
            dismissLegacyBridgeIfNeeded()
            return
        }

        prefersNativeHome = false
        pendingPath = path
        openWebPath(path)
    }

    func openWebPath(_ path: String) {
        prefersNativeHome = false
        pendingPath = path

        guard let root = rootViewController(), let bridge = legacyBridge else {
            return
        }

        bridge.modalPresentationStyle = .fullScreen
        bridge.prepareForNativePresentation()

        let presentAndLoad = { [weak self, weak bridge] in
            guard let self, let bridge else { return }
            self.load(path: path, in: bridge)
        }

        if bridge.presentingViewController != nil || root.presentedViewController === bridge {
            presentAndLoad()
        } else {
            root.present(bridge, animated: true, completion: presentAndLoad)
        }
    }

    func presentNativeHome() {
        guard nativeHomeEnabled, SessionManager.shared.hasValidSession() else { return }

        prefersNativeHome = true
        pendingPath = nil
        IOSAppModel.shared.showNativeHome()

        dismissLegacyBridgeIfNeeded()
    }

    func shouldPresentNativeHome(for url: URL) -> Bool {
        guard nativeHomeEnabled, SessionManager.shared.hasValidSession() else { return false }
        guard url.host == "gleaum.com" || url.host == "www.gleaum.com" else { return false }
        let path = url.path.isEmpty ? "/home" : url.path
        return path == "/" || path == "/home"
    }

    private func load(path: String, in bridge: AppBridgeViewController, attempt: Int = 0) {
        guard let webView = bridge.webView else {
            guard attempt < 30 else { return }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self, weak bridge] in
                guard let self, let bridge else { return }
                self.load(path: path, in: bridge, attempt: attempt + 1)
            }
            return
        }

        let encodedPath = path.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? path
        guard let url = URL(string: "https://www.gleaum.com\(encodedPath)") else { return }

        webView.load(URLRequest(url: url))
        if SessionManager.shared.hasValidSession(), pendingPath == path {
            pendingPath = nil
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            bridge.revealWebContent()
        }
    }

    private func dismissLegacyBridgeIfNeeded() {
        if let bridge = legacyBridge, bridge.presentingViewController != nil {
            bridge.prepareForNativePresentation()
            bridge.dismiss(animated: true)
        }
    }

    private func rootViewController() -> UIViewController? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow)?
            .rootViewController
    }

    private func nativePath(from url: URL) -> String {
        if url.host == "invite" {
            let code = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
            return code.isEmpty ? "/invite" : "/invite/\(code)"
        }
        if let host = url.host, !host.isEmpty {
            let suffix = url.path == "/" ? "" : url.path
            return "/\(host)\(suffix)"
        }
        return url.path.isEmpty ? "/home" : url.path
    }
}
