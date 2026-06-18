import Capacitor
import WebKit

/**
 * AppBridgeViewController
 *
 * Capacitor CLI가 생성하는 packageClassList는 npm 플러그인만 자동 수집한다.
 * 앱 타깃 내부의 커스텀 Swift 플러그인은 cap sync 이후 누락될 수 있으므로
 * bridge 로드 직후 명시적으로 등록한다.
 */
class AppBridgeViewController: CAPBridgeViewController, WKScriptMessageHandler {
    private var didRequestInitialNativeHome = false

    override open func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let configuration = super.webViewConfiguration(for: instanceConfiguration)
        configuration.userContentController.add(self, name: "gleaumRoute")
        configuration.userContentController.addUserScript(WKUserScript(
            source: Self.routeObserverScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))
        return configuration
    }

    override open func capacitorDidLoad() {
        super.capacitorDidLoad()

        bridge?.registerPluginInstance(NativeSessionPlugin())
        bridge?.registerPluginInstance(NativeBiometricPlugin())
        bridge?.registerPluginInstance(NativeCalendarPlugin())

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onWebViewNavigationDecision(_:)),
            name: .capacitorDecidePolicyForNavigationAction,
            object: nil
        )
    }

    override open func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        guard !didRequestInitialNativeHome,
              NativeRouteCoordinator.shared.isNativeHomeEnabled,
              SessionManager.shared.hasValidSession() else { return }

        didRequestInitialNativeHome = true
        webView?.isHidden = true
        NativeRouteCoordinator.shared.presentNativeHome()
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func onWebViewNavigationDecision(_ notification: Notification) {
        guard let navigationAction = notification.object as? WKNavigationAction,
              navigationAction.targetFrame?.isMainFrame ?? true,
              let url = navigationAction.request.url,
              NativeRouteCoordinator.shared.shouldPresentNativeHome(for: url) else {
            return
        }

        webView?.isHidden = true
        NativeRouteCoordinator.shared.prefersNativeHome = true
        DispatchQueue.main.async {
            NativeRouteCoordinator.shared.presentNativeHome()
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "gleaumRoute",
              let path = message.body as? String,
              path == "/" || path == "/home",
              NativeRouteCoordinator.shared.isNativeHomeEnabled,
              SessionManager.shared.hasValidSession() else {
            return
        }

        webView?.isHidden = true
        NativeRouteCoordinator.shared.prefersNativeHome = true
        DispatchQueue.main.async {
            NativeRouteCoordinator.shared.presentNativeHome()
        }
    }

    private static let routeObserverScript = """
    (function() {
      if (window.__gleaumNativeRouteObserverInstalled) return;
      window.__gleaumNativeRouteObserverInstalled = true;

      function notify() {
        try {
          if (window.webkit &&
              window.webkit.messageHandlers &&
              window.webkit.messageHandlers.gleaumRoute) {
            window.webkit.messageHandlers.gleaumRoute.postMessage(window.location.pathname || '/');
          }
        } catch (_) {}
      }

      var originalPushState = history.pushState;
      var originalReplaceState = history.replaceState;

      history.pushState = function() {
        var result = originalPushState.apply(this, arguments);
        setTimeout(notify, 0);
        return result;
      };

      history.replaceState = function() {
        var result = originalReplaceState.apply(this, arguments);
        setTimeout(notify, 0);
        return result;
      };

      window.addEventListener('popstate', function() {
        setTimeout(notify, 0);
      });
      document.addEventListener('click', function() {
        setTimeout(notify, 80);
      }, true);
      setTimeout(notify, 0);
    })();
    """
}
