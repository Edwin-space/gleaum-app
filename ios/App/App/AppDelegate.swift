import UIKit
import WebKit
import Capacitor
import FirebaseCore
import FirebaseMessaging
import SafariServices
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate {

    var window: UIWindow?
    private let loginPresentationDelay: TimeInterval = 0.45

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // ── 1. Firebase 초기화 ────────────────────────────────────────────────
        FirebaseApp.configure()
        Messaging.messaging().delegate = self

        // ── 2. APNs 토큰 등록 (권한 팝업 없음 — 토큰만 취득) ─────────────────
        //    UNUserNotificationCenter.requestAuthorization 은 앱 설정 화면에서
        //    사용자가 알림을 켤 때 호출합니다 (런치 시 즉시 팝업 X → UX 개선).
        application.registerForRemoteNotifications()

        // ── 3. 알림 센터 delegate 설정 ────────────────────────────────────────
        UNUserNotificationCenter.current().delegate = self as? UNUserNotificationCenterDelegate

        // ── 4. 세션 없으면 LoginViewController 표시 ──────────────────────────
        if !SessionManager.shared.hasValidSession() {
            showLoginScreenAfterLaunch()
        } else {
            presentNativeHomeAfterLaunch()
        }

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onNativeSessionSaved),
            name: .gleaumSessionSaved,
            object: nil
        )

        return true
    }

    private func showLoginScreenAfterLaunch() {
        // 스플래시가 3초 유지되는 동안 LoginVC를 미리 올려둔다.
        // 스플래시가 사라질 때 WebView /login이 아니라 네이티브 로그인 화면이 바로 보이게 한다.
        DispatchQueue.main.asyncAfter(deadline: .now() + loginPresentationDelay) { [weak self] in
            self?.presentLoginScreenWhenReady()
        }
    }

    private func presentNativeHomeAfterLaunch() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.55) {
            NativeRouteCoordinator.shared.presentNativeHome()
        }
    }

    @objc private func onNativeSessionSaved() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
            if let pendingPath = NativeRouteCoordinator.shared.consumePendingPath() {
                NativeRouteCoordinator.shared.openWebPath(pendingPath)
            } else if NativeRouteCoordinator.shared.prefersNativeHome {
                NativeRouteCoordinator.shared.presentNativeHome()
            }
        }
    }

    private func presentLoginScreenWhenReady(attempt: Int = 0) {
        if SessionManager.shared.hasValidSession() { return }

        guard let rootVC = currentRootViewController() else {
            if attempt < 20 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
                    self?.presentLoginScreenWhenReady(attempt: attempt + 1)
                }
            }
            return
        }

        guard rootVC.isViewLoaded, rootVC.view.window != nil else {
            if attempt < 20 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
                    self?.presentLoginScreenWhenReady(attempt: attempt + 1)
                }
            }
            return
        }

        let presenter = topMostViewController(from: rootVC)
        if presenter is LoginViewController { return }
        if presenter is SFSafariViewController { return }
        if presenter.presentedViewController is LoginViewController { return }
        if presenter.presentedViewController is SFSafariViewController { return }

        let loginVC = LoginViewController()
        loginVC.modalPresentationStyle = .fullScreen
        loginVC.modalTransitionStyle   = .crossDissolve
        presenter.present(loginVC, animated: false)
    }

    private func currentRootViewController() -> UIViewController? {
        if let rootVC = window?.rootViewController {
            return rootVC
        }

        let keyWindow = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }

        if let keyWindow {
            window = keyWindow
            return keyWindow.rootViewController
        }

        return nil
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

    // ── FCM 토큰 갱신 시 콜백 ─────────────────────────────────────────────────
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        NotificationCenter.default.post(
            name: Notification.Name("FCMToken"),
            object: nil,
            userInfo: ["token": fcmToken ?? ""]
        )
    }

    // ── URL Scheme 처리 (gleaum:// — Google OAuth 콜백) ──────────────────────
    func application(_ app: UIApplication, open url: URL,
                     options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {

        // OAuth implicit 콜백: gleaum://auth/callback#access_token=...
        if url.scheme == "gleaum", url.host == "auth",
           let fragment = url.fragment, fragment.contains("access_token") {
            handleOAuthCallback(fragment: fragment)
            dismissAuthPresentation()
        }

        // 로그아웃: gleaum://logout
        // NativeSessionPlugin 미등록 시 폴백 경로
        if url.scheme == "gleaum", url.host == "logout" {
            SessionManager.shared.clearSession()
            showLoginScreenAfterLaunch()
        }

        if NativeRouteCoordinator.shared.handle(url: url) {
            return true
        }

        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    /// OAuth 콜백 fragment 파싱 → SessionManager 저장
    private func handleOAuthCallback(fragment: String) {
        var params: [String: String] = [:]
        for pair in fragment.components(separatedBy: "&") {
            let kv = pair.components(separatedBy: "=")
            if kv.count == 2 {
                params[kv[0]] = kv[1].removingPercentEncoding ?? kv[1]
            }
        }
        guard let accessToken  = params["access_token"],
              let refreshToken = params["refresh_token"] else { return }

        let expiresIn = TimeInterval(params["expires_in"] ?? "3600") ?? 3600
        let expiresAt = Date().timeIntervalSince1970 + expiresIn

        let sessionDict: [String: Any] = [
            "access_token":  accessToken,
            "refresh_token": refreshToken,
            "token_type":    params["token_type"] ?? "bearer",
            "expires_in":    expiresIn,
            "expires_at":    expiresAt,
        ]
        if let data = try? JSONSerialization.data(withJSONObject: sessionDict),
           let json = String(data: data, encoding: .utf8) {
            SessionManager.shared.saveSession(json)
        }
    }

    /// OAuth 성공 후 SFSafariViewController / LoginViewController 스택을 자동으로 닫는다.
    /// 사용자가 직접 "닫기"를 눌러야 세션이 반영되는 iOS 타이밍 문제를 방지한다.
    private func dismissAuthPresentation() {
        DispatchQueue.main.async { [weak self] in
            self?.window?.rootViewController?.dismiss(animated: true)
        }
    }

    // ── Universal Links 처리 (https://www.gleaum.com 딥링크) ─────────────────
    func application(_ application: UIApplication,
                     continue userActivity: NSUserActivity,
                     restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        if let url = userActivity.webpageURL,
           NativeRouteCoordinator.shared.handle(url: url) {
            return true
        }

        return ApplicationDelegateProxy.shared.application(application,
                                                           continue: userActivity,
                                                           restorationHandler: restorationHandler)
    }

    // ── APNs 푸시 알림 등록 성공 ──────────────────────────────────────────────
    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
        NotificationCenter.default.post(
            name: .capacitorDidRegisterForRemoteNotifications,
            object: deviceToken
        )
    }

    // ── APNs 푸시 알림 등록 실패 ──────────────────────────────────────────────
    func application(_ application: UIApplication,
                     didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(
            name: .capacitorDidFailToRegisterForRemoteNotifications,
            object: error
        )
    }

    // ── 앱 상태 메서드 (Capacitor 플러그인 호환) ─────────────────────────────
    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func applicationDidBecomeActive(_ application: UIApplication) {
        // ── WKWebView 성능 최적화 ────────────────────────────────────────────
        setupWebView()

        // window/rootViewController 준비 타이밍에 따라 didFinishLaunching 시점의
        // 네이티브 로그인 화면 표시가 누락될 수 있어 앱 활성화 시 한 번 더 보장한다.
        if !SessionManager.shared.hasValidSession() {
            presentLoginScreenWhenReady()
        } else if NativeRouteCoordinator.shared.prefersNativeHome {
            NativeRouteCoordinator.shared.presentNativeHome()
        }

        #if targetEnvironment(macCatalyst)
        // Mac Catalyst: 최소/최대 윈도우 크기 설정
        if let windowScene = application.connectedScenes.first as? UIWindowScene {
            windowScene.sizeRestrictions?.minimumSize = CGSize(width: 800, height: 600)
            windowScene.sizeRestrictions?.maximumSize = CGSize(
                width: CGFloat.greatestFiniteMagnitude,
                height: CGFloat.greatestFiniteMagnitude
            )
        }
        #endif
    }

    // ── WKWebView 성능 설정 (Android WebView 최적화와 대칭) ─────────────────
    private func setupWebView() {
        guard let rootVC = currentRootViewController() as? CAPBridgeViewController,
              let webView = rootVC.webView else { return }

        // 네이티브 로그인 세션 → WebView localStorage 주입
        // Android의 addDocumentStartJavaScript 와 동일한 역할
        if let sessionJson = SessionManager.shared.getSession() {
            let escaped = sessionJson
                .replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "'",  with: "\\'")
                .replacingOccurrences(of: "\n", with: "\\n")
            let projectRef = "tyvjdsescukaeorcuaga"
            let storageKey = "sb-\(projectRef)-auth-token"
            let script = WKUserScript(
                source: "(function(){try{localStorage.setItem('\(storageKey)','\(escaped)');}catch(e){}})()",
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
            webView.configuration.userContentController.addUserScript(script)
        }

        let scrollView = webView.scrollView

        // 고무줄 스크롤 비활성화 → 네이티브 앱 느낌
        scrollView.bounces = false
        scrollView.alwaysBounceVertical = false
        scrollView.alwaysBounceHorizontal = false

        // CSS env(safe-area-inset-*) 직접 처리
        // capacitor.config ios.contentInset = 'never' 와 일관성 유지
        scrollView.contentInsetAdjustmentBehavior = .never

        // 스크롤바 숨김 (globals.css ::-webkit-scrollbar와 일치)
        scrollView.showsVerticalScrollIndicator = false
        scrollView.showsHorizontalScrollIndicator = false

        // WebView 배경: 로드 전 흰 화면 플래시 방지
        // app 배경색 #FAFAFD 와 동일하게 설정
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.980, green: 0.980, blue: 0.992, alpha: 1.0)
        scrollView.backgroundColor = UIColor(red: 0.980, green: 0.980, blue: 0.992, alpha: 1.0)
    }
}
