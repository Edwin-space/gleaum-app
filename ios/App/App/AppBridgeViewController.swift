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
    private let launchShield = UIView()

    override open func viewDidLoad() {
        super.viewDidLoad()
        installLaunchShield()
        webView?.isHidden = true
    }

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

    func prepareForNativePresentation() {
        webView?.isHidden = true
        launchShield.isHidden = false
        launchShield.alpha = 1
    }

    func revealWebContent() {
        webView?.isHidden = false
        guard !launchShield.isHidden else {
            return
        }
        UIView.animate(
            withDuration: 0.2,
            delay: 0,
            options: [.curveEaseOut, .beginFromCurrentState]
        ) {
            self.launchShield.alpha = 0
        } completion: { _ in
            self.launchShield.isHidden = true
        }
    }

    private func installLaunchShield() {
        launchShield.translatesAutoresizingMaskIntoConstraints = false
        launchShield.backgroundColor = UIColor(
            red: 0.039,
            green: 0.043,
            blue: 0.063,
            alpha: 1
        )
        launchShield.isUserInteractionEnabled = true

        let mark = UIImageView(image: UIImage(named: "Splash") ?? UIImage(named: "AppIcon"))
        mark.translatesAutoresizingMaskIntoConstraints = false
        mark.contentMode = .scaleAspectFit
        mark.accessibilityLabel = "글리움"

        let title = UILabel()
        title.translatesAutoresizingMaskIntoConstraints = false
        title.text = "gleaum"
        title.textColor = .white
        title.font = .systemFont(ofSize: 22, weight: .bold)
        title.textAlignment = .center

        launchShield.addSubview(mark)
        launchShield.addSubview(title)
        view.addSubview(launchShield)
        NSLayoutConstraint.activate([
            launchShield.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            launchShield.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            launchShield.topAnchor.constraint(equalTo: view.topAnchor),
            launchShield.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            mark.centerXAnchor.constraint(equalTo: launchShield.centerXAnchor),
            mark.centerYAnchor.constraint(equalTo: launchShield.centerYAnchor, constant: -18),
            mark.widthAnchor.constraint(equalToConstant: 112),
            mark.heightAnchor.constraint(equalToConstant: 112),

            title.centerXAnchor.constraint(equalTo: launchShield.centerXAnchor),
            title.topAnchor.constraint(equalTo: mark.bottomAnchor, constant: 16),
        ])
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
