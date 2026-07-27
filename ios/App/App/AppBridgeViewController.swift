import Capacitor
import WebKit

/**
 * Web fallback 전용 Capacitor 컨테이너입니다.
 *
 * iOS의 주 화면은 SwiftUI 루트가 소유하고, 아직 네이티브 전환 전인 경로만
 * 이 컨트롤러를 전체 화면으로 표시합니다.
 */
final class AppBridgeViewController: CAPBridgeViewController, WKScriptMessageHandler {
    override func viewDidLoad() {
        super.viewDidLoad()
        webView?.isHidden = true
        configureWebViewSurface()
    }

    override func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let configuration = super.webViewConfiguration(for: instanceConfiguration)
        configuration.userContentController.add(self, name: "gleaumRoute")
        installUserScripts(on: configuration.userContentController)
        return configuration
    }

    override func capacitorDidLoad() {
        super.capacitorDidLoad()

        bridge?.registerPluginInstance(NativeSessionPlugin())
        bridge?.registerPluginInstance(NativeBiometricPlugin())
        bridge?.registerPluginInstance(NativeCalendarPlugin())
        NativeRouteCoordinator.shared.attachLegacyBridge(self)

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onWebViewNavigationDecision(_:)),
            name: .capacitorDecidePolicyForNavigationAction,
            object: nil
        )
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

        NativeRouteCoordinator.shared.presentNativeHome()
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "gleaumRoute",
              let path = message.body as? String,
              path == "/" || path == "/home",
              NativeRouteCoordinator.shared.isNativeHomeEnabled,
              SessionManager.shared.hasValidSession() else {
            return
        }

        NativeRouteCoordinator.shared.presentNativeHome()
    }

    func prepareForNativePresentation() {
        webView?.isHidden = true
        if let controller = webView?.configuration.userContentController {
            installUserScripts(on: controller)
        }
    }

    func revealWebContent() {
        webView?.isHidden = false
    }

    private func configureWebViewSurface() {
        guard let webView else { return }
        let scrollView = webView.scrollView

        view.backgroundColor = GleaumUIColor.background
        scrollView.bounces = false
        scrollView.alwaysBounceVertical = false
        scrollView.alwaysBounceHorizontal = false
        // 아직 네이티브 전환 전인 웹 화면도 iPhone의 상태·홈 인디케이터를 침범하지 않습니다.
        scrollView.contentInsetAdjustmentBehavior = .always
        scrollView.showsVerticalScrollIndicator = false
        scrollView.showsHorizontalScrollIndicator = false

        webView.isOpaque = false
        webView.backgroundColor = GleaumUIColor.background
        scrollView.backgroundColor = GleaumUIColor.background
    }

    private func installUserScripts(on controller: WKUserContentController) {
        controller.removeAllUserScripts()
        controller.addUserScript(WKUserScript(
            source: Self.routeObserverScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))

        guard let sessionJSON = SessionManager.shared.getSession() else { return }
        let escaped = sessionJSON
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
            .replacingOccurrences(of: "\n", with: "\\n")
        controller.addUserScript(WKUserScript(
            source: """
            (function() {
              try {
                localStorage.setItem('sb-tyvjdsescukaeorcuaga-auth-token', '\(escaped)');
              } catch (_) {}
            })();
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))
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
