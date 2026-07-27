import UIKit
import WebKit
import Capacitor
import FirebaseCore
import FirebaseMessaging
import SafariServices
import SwiftUI
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder,
                   UIApplicationDelegate,
                   MessagingDelegate,
                   UNUserNotificationCenterDelegate {

    var window: UIWindow?
    private let loginPresentationDelay: TimeInterval = 0.45
    private weak var sessionRecoveryController: GleaumSessionRecoveryViewController?
    private var sessionValidationTask: Task<Void, Never>?
    private var webSessionScriptInstalled = false

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
#if DEBUG
        if launchDesignSystemCatalogIfRequested() {
            return true
        }
#endif

        // ── 1. Firebase 초기화 ────────────────────────────────────────────────
        FirebaseApp.configure()
        Messaging.messaging().delegate = self

        // ── 2. APNs 토큰 등록 (권한 팝업 없음 — 토큰만 취득) ─────────────────
        //    UNUserNotificationCenter.requestAuthorization 은 앱 설정 화면에서
        //    사용자가 알림을 켤 때 호출합니다 (런치 시 즉시 팝업 X → UX 개선).
        application.registerForRemoteNotifications()

        // ── 3. 알림 센터 delegate 설정 ────────────────────────────────────────
        UNUserNotificationCenter.current().delegate = self

        // ── 4. 유효 세션 → 앱, 만료 저장 세션 → refresh, 미저장 → 로그인 ──────
        if SessionManager.shared.hasValidSession() {
            routeAuthenticatedSessionAfterLaunch()
        } else if SessionManager.shared.hasStoredSession() {
            showSessionRecoveryAfterLaunch()
        } else {
            showLoginScreenAfterLaunch()
        }

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onNativeSessionSaved),
            name: .gleaumSessionSaved,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onNativeSessionRefreshed),
            name: .gleaumSessionRefreshed,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onNativeSessionInvalidated),
            name: .gleaumSessionInvalidated,
            object: nil
        )

        return true
    }

#if DEBUG
    private func launchDesignSystemCatalogIfRequested() -> Bool {
        guard isDevelopmentPreviewRequested else {
            return false
        }

        if isSessionRecoveryPreviewRequested {
            presentSessionRecoveryPreview()
        } else if isBiometricPreviewRequested {
            presentBiometricPreview()
        } else {
            presentDesignSystemCatalog()
        }
        return true
    }

    private func presentDesignSystemCatalog() {
        presentDevelopmentPreview(AnyView(GleaumDesignSystemCatalog()))
    }

    private func presentBiometricPreview() {
        presentDevelopmentPreview(
            AnyView(
                GleaumBiometricLockView(
                    automaticallyAuthenticates: false,
                    onUnlock: {},
                    onUseOtherAccount: {}
                )
            )
        )
    }

    private func presentSessionRecoveryPreview() {
        let viewModel = GleaumSessionRecoveryViewModel()
        viewModel.showTemporaryFailure()
        presentDevelopmentPreview(
            AnyView(
                GleaumSessionRecoveryView(
                    viewModel: viewModel,
                    onRetry: {},
                    onUseOtherAccount: {}
                )
            )
        )
    }

    private func presentDevelopmentPreview(_ rootView: AnyView) {
        DispatchQueue.main.async { [weak self] in
            let connectedWindow = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap(\.windows)
                .first { $0.isKeyWindow }

            guard let catalogWindow = connectedWindow ?? self?.window else {
                return
            }

            catalogWindow.rootViewController = UIHostingController(
                rootView: rootView
            )
            catalogWindow.makeKeyAndVisible()
            self?.window = catalogWindow
        }
    }

    private var isDesignSystemCatalogRequested: Bool {
        let processInfo = ProcessInfo.processInfo
        return processInfo.arguments.contains("-GleaumDesignCatalog") ||
            UserDefaults.standard.bool(forKey: "GleaumDesignCatalog") ||
            processInfo.environment["GLEAUM_DESIGN_CATALOG"] == "1"
    }

    private var isBiometricPreviewRequested: Bool {
        let processInfo = ProcessInfo.processInfo
        return processInfo.arguments.contains("-GleaumBiometricPreview") ||
            processInfo.environment["GLEAUM_BIOMETRIC_PREVIEW"] == "1"
    }

    private var isSessionRecoveryPreviewRequested: Bool {
        let processInfo = ProcessInfo.processInfo
        return processInfo.arguments.contains("-GleaumSessionRecoveryPreview") ||
            processInfo.environment["GLEAUM_SESSION_RECOVERY_PREVIEW"] == "1"
    }

    private var isDevelopmentPreviewRequested: Bool {
        isDesignSystemCatalogRequested ||
            isBiometricPreviewRequested ||
            isSessionRecoveryPreviewRequested
    }
#endif

    private func showLoginScreenAfterLaunch() {
        // 스플래시가 3초 유지되는 동안 LoginVC를 미리 올려둔다.
        // 스플래시가 사라질 때 WebView /login이 아니라 네이티브 로그인 화면이 바로 보이게 한다.
        DispatchQueue.main.asyncAfter(deadline: .now() + loginPresentationDelay) { [weak self] in
            self?.presentLoginScreenWhenReady()
        }
    }

    private func showSessionRecoveryAfterLaunch() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
            self?.presentSessionRecoveryWhenReady()
        }
    }

    private func routeAuthenticatedSessionAfterLaunch() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
            if GleaumBiometricPreferences.shared.shouldRequireUnlock() {
                self?.presentBiometricLockWhenReady()
            } else {
                self?.completeAuthenticatedRoute()
            }
        }
    }

    @objc private func onNativeSessionSaved() {
        // OAuth 직후 WebView의 생체 게이트가 연속으로 표시되지 않게 짧은 유예를 공유한다.
        GleaumBiometricPreferences.shared.markUnlocked()
        syncSessionToWebView()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak self] in
            self?.completeAuthenticatedRoute()
        }
    }

    @objc private func onNativeSessionRefreshed() {
        syncSessionToWebView()
    }

    @objc private func onNativeSessionInvalidated() {
        guard sessionRecoveryController == nil else {
            return
        }

        sessionValidationTask?.cancel()
        sessionValidationTask = nil
        DispatchQueue.main.async { [weak self] in
            guard let self else {
                return
            }
            self.currentRootViewController()?.dismiss(animated: false) {
                self.showLoginScreenAfterLaunch()
            }
        }
    }

    private func completeAuthenticatedRoute() {
        if let pendingPath = NativeRouteCoordinator.shared.consumePendingPath() {
            NativeRouteCoordinator.shared.openWebPath(pendingPath)
        } else if NativeRouteCoordinator.shared.prefersNativeHome {
            NativeRouteCoordinator.shared.presentNativeHome()
        }
    }

    private func presentLoginScreenWhenReady(attempt: Int = 0) {
        if SessionManager.shared.hasValidSession() { return }
        if SessionManager.shared.hasStoredSession() {
            presentSessionRecoveryWhenReady()
            return
        }

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

    private func presentSessionRecoveryWhenReady(attempt: Int = 0) {
        if SessionManager.shared.hasValidSession() {
            routeAuthenticatedSessionAfterLaunch()
            return
        }
        guard SessionManager.shared.hasStoredSession() else {
            showLoginScreenAfterLaunch()
            return
        }

        guard let rootVC = currentRootViewController() else {
            if attempt < 20 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
                    self?.presentSessionRecoveryWhenReady(attempt: attempt + 1)
                }
            }
            return
        }

        guard rootVC.isViewLoaded, rootVC.view.window != nil else {
            if attempt < 20 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
                    self?.presentSessionRecoveryWhenReady(attempt: attempt + 1)
                }
            }
            return
        }

        let presenter = topMostViewController(from: rootVC)
        if let recovery = presenter as? GleaumSessionRecoveryViewController {
            sessionRecoveryController = recovery
            if sessionValidationTask == nil {
                validateStoredSession(using: recovery)
            }
            return
        }
        if presenter is SFSafariViewController {
            return
        }

        let recovery = GleaumSessionRecoveryViewController(
            onRetry: { [weak self] in
                guard let recovery = self?.sessionRecoveryController else {
                    return
                }
                self?.validateStoredSession(using: recovery)
            },
            onUseOtherAccount: { [weak self] in
                self?.useOtherAccountFromSessionRecovery()
            }
        )
        recovery.modalPresentationStyle = .fullScreen
        recovery.modalTransitionStyle = .crossDissolve
        sessionRecoveryController = recovery
        presenter.present(recovery, animated: false) { [weak self, weak recovery] in
            guard let recovery else {
                return
            }
            self?.validateStoredSession(using: recovery)
        }
    }

    private func validateStoredSession(
        using recovery: GleaumSessionRecoveryViewController
    ) {
        sessionValidationTask?.cancel()
        recovery.showPreparing()

        sessionValidationTask = Task { [weak self, weak recovery] in
            let result = await SessionManager.shared.validateForLaunch()
            guard !Task.isCancelled else {
                return
            }

            await MainActor.run {
                guard let self, let recovery else {
                    return
                }
                self.sessionValidationTask = nil
                self.handleSessionValidation(result, recovery: recovery)
            }
        }
    }

    private func handleSessionValidation(
        _ result: SessionValidation,
        recovery: GleaumSessionRecoveryViewController
    ) {
        switch result {
        case .valid, .refreshed:
            sessionRecoveryController = nil
            recovery.dismiss(animated: true) { [weak self] in
                self?.routeAuthenticatedSessionAfterLaunch()
            }
        case .temporaryFailure:
            recovery.showTemporaryFailure()
        case .invalid:
            sessionRecoveryController = nil
            recovery.dismiss(animated: true) { [weak self] in
                self?.showLoginScreenAfterLaunch()
            }
        }
    }

    private func useOtherAccountFromSessionRecovery() {
        sessionValidationTask?.cancel()
        sessionValidationTask = nil
        SessionManager.shared.clearSession()

        guard let recovery = sessionRecoveryController else {
            showLoginScreenAfterLaunch()
            return
        }
        sessionRecoveryController = nil
        recovery.dismiss(animated: true) { [weak self] in
            self?.showLoginScreenAfterLaunch()
        }
    }

    private func presentBiometricLockWhenReady(attempt: Int = 0) {
        guard SessionManager.shared.hasValidSession(),
              GleaumBiometricPreferences.shared.shouldRequireUnlock() else {
            completeAuthenticatedRoute()
            return
        }

        guard let rootVC = currentRootViewController() else {
            if attempt < 20 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
                    self?.presentBiometricLockWhenReady(attempt: attempt + 1)
                }
            }
            return
        }

        guard rootVC.isViewLoaded, rootVC.view.window != nil else {
            if attempt < 20 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
                    self?.presentBiometricLockWhenReady(attempt: attempt + 1)
                }
            }
            return
        }

        let presenter = topMostViewController(from: rootVC)
        if presenter is GleaumBiometricLockViewController { return }
        if presenter is LoginViewController { return }
        if presenter is SFSafariViewController { return }

        let lockController = GleaumBiometricLockViewController(
            onUnlock: { [weak self, weak presenter] in
                presenter?.dismiss(animated: true) {
                    self?.completeAuthenticatedRoute()
                }
            },
            onUseOtherAccount: { [weak self, weak presenter] in
                SessionManager.shared.clearSession()
                presenter?.dismiss(animated: true) {
                    self?.showLoginScreenAfterLaunch()
                }
            }
        )
        lockController.modalPresentationStyle = .fullScreen
        lockController.modalTransitionStyle = .crossDissolve
        presenter.present(lockController, animated: true)
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

#if DEBUG
        if url.scheme == "gleaum",
           url.host == "debug",
           url.path == "/design-system" {
            presentDesignSystemCatalog()
            return true
        }
#endif

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

    // 포그라운드에서도 일정·가족 알림을 배너로 표시한다.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .badge, .sound])
    }

    // ── 앱 상태 메서드 (Capacitor 플러그인 호환) ─────────────────────────────
    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func applicationDidBecomeActive(_ application: UIApplication) {
#if DEBUG
        if isDevelopmentPreviewRequested {
            if isSessionRecoveryPreviewRequested {
                presentSessionRecoveryPreview()
            } else if isBiometricPreviewRequested {
                presentBiometricPreview()
            } else {
                presentDesignSystemCatalog()
            }
            return
        }
#endif

        // ── WKWebView 성능 최적화 ────────────────────────────────────────────
        setupWebView()

        // window/rootViewController 준비 타이밍에 따라 didFinishLaunching 시점의
        // 네이티브 로그인 화면 표시가 누락될 수 있어 앱 활성화 시 한 번 더 보장한다.
        if isSessionRecoveryPresented {
            return
        } else if SessionManager.shared.hasValidSession() {
            if isBiometricLockPresented {
                return
            } else if GleaumBiometricPreferences.shared.shouldRequireUnlock() {
                presentBiometricLockWhenReady()
            } else if NativeRouteCoordinator.shared.prefersNativeHome {
                NativeRouteCoordinator.shared.presentNativeHome()
            }
        } else if SessionManager.shared.hasStoredSession() {
            presentSessionRecoveryWhenReady()
        } else {
            presentLoginScreenWhenReady()
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

    private var isSessionRecoveryPresented: Bool {
        if sessionRecoveryController != nil {
            return true
        }
        guard let rootViewController = currentRootViewController() else {
            return false
        }
        return topMostViewController(
            from: rootViewController
        ) is GleaumSessionRecoveryViewController
    }

    private var isBiometricLockPresented: Bool {
        guard let rootViewController = currentRootViewController() else {
            return false
        }
        return topMostViewController(
            from: rootViewController
        ) is GleaumBiometricLockViewController
    }

    // ── WKWebView 성능 설정 (Android WebView 최적화와 대칭) ─────────────────
    private func setupWebView() {
        guard let rootVC = currentRootViewController() as? CAPBridgeViewController,
              let webView = rootVC.webView else { return }

        // 네이티브 로그인 세션 → WebView localStorage 주입
        // Android의 addDocumentStartJavaScript 와 동일한 역할
        if !webSessionScriptInstalled,
           let sessionJson = SessionManager.shared.getSession() {
            let script = WKUserScript(
                source: sessionInjectionScript(for: sessionJson),
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
            webView.configuration.userContentController.addUserScript(script)
            webSessionScriptInstalled = true
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

    private func syncSessionToWebView() {
        guard let rootVC = currentRootViewController() as? CAPBridgeViewController,
              let webView = rootVC.webView,
              let sessionJson = SessionManager.shared.getSession() else {
            return
        }

        if !webSessionScriptInstalled {
            let script = WKUserScript(
                source: sessionInjectionScript(for: sessionJson),
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
            webView.configuration.userContentController.addUserScript(script)
            webSessionScriptInstalled = true
        }
        webView.evaluateJavaScript(sessionInjectionScript(for: sessionJson))
    }

    private func sessionInjectionScript(for sessionJson: String) -> String {
        let escaped = sessionJson
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
        let storageKey = "sb-tyvjdsescukaeorcuaga-auth-token"
        return "(function(){try{localStorage.setItem('\(storageKey)','\(escaped)');}catch(e){}})()"
    }
}
