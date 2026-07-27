import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging
import UserNotifications
import SwiftUI

@UIApplicationMain
class AppDelegate: UIResponder,
                   UIApplicationDelegate,
                   MessagingDelegate,
                   UNUserNotificationCenterDelegate,
                   AppSessionRouting {

    var window: UIWindow?
    private var legacyBridgeViewController: AppBridgeViewController?
    private lazy var sessionStateCoordinator = AppSessionStateCoordinator(router: self)

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // ── 1. Firebase 초기화 ────────────────────────────────────────────────
        FirebaseApp.configure()
        Messaging.messaging().delegate = self
        GleaumThemeManager.shared.applyToConnectedWindows()

        // ── 2. APNs 토큰 등록 (권한 팝업 없음 — 토큰만 취득) ─────────────────
        //    UNUserNotificationCenter.requestAuthorization 은 앱 설정 화면에서
        //    사용자가 알림을 켤 때 호출합니다 (런치 시 즉시 팝업 X → UX 개선).
        application.registerForRemoteNotifications()

        // ── 3. 알림 센터 delegate 설정 ────────────────────────────────────────
        UNUserNotificationCenter.current().delegate = self

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onNativeSessionSaved),
            name: .gleaumSessionSaved,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onNativeSessionInvalidated),
            name: .gleaumSessionInvalidated,
            object: nil
        )

        // Capacitor는 아직 네이티브 전환 전인 경로에서만 지연 로드합니다.
        // 앱 시작 시 WebView를 만들지 않아 iPhone 시작 시간과 화면 안정성을 지킵니다.
        let legacyBridge = AppBridgeViewController()
        legacyBridgeViewController = legacyBridge
        NativeRouteCoordinator.shared.attachLegacyBridge(legacyBridge)

        let root = UIHostingController(rootView: IOSAppRootView(model: .shared))
        root.view.backgroundColor = UIColor(red: 0.039, green: 0.043, blue: 0.063, alpha: 1)
        window?.rootViewController = root
        window?.makeKeyAndVisible()

        // 저장된 access token이 만료되어도 refresh 결과를 확인하기 전 로그인으로
        // 보내지 않는다. 화면 전환은 sessionStateCoordinator 한 곳에서 결정한다.
        sessionStateCoordinator.start()

        return true
    }

    @objc private func onNativeSessionSaved() {
        sessionStateCoordinator.sessionSaved()
    }

    @objc private func onNativeSessionInvalidated() {
        sessionStateCoordinator.sessionCleared()
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

        // ASWebAuthenticationSession 외부 복귀나 이메일 확인 링크의 세션을
        // 네이티브 인증과 동일한 형식으로 저장한다.
        if url.scheme == "gleaum", url.host == "auth",
           let sessionJSON = NativeAuthClient.sessionJSON(fromOAuthCallback: url) {
            SessionManager.shared.saveSession(sessionJSON)
            dismissAuthPresentation()
        }

        // 로그아웃: gleaum://logout
        // NativeSessionPlugin 미등록 시 폴백 경로
        if url.scheme == "gleaum", url.host == "logout" {
            SessionManager.shared.clearSession()
        }

        if NativeRouteCoordinator.shared.handle(url: url) {
            return true
        }

        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
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
        GleaumThemeManager.shared.applyToConnectedWindows()
        sessionStateCoordinator.resume()

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

    func showSignedOutState() {
        if let bridge = legacyBridgeViewController, bridge.presentingViewController != nil {
            bridge.dismiss(animated: false)
        }
        IOSAppModel.shared.apply(sessionState: .signedOut)
    }

    func showAuthenticatedState() {
        if let pendingPath = NativeRouteCoordinator.shared.consumePendingPath() {
            NativeRouteCoordinator.shared.openWebPath(pendingPath)
        } else {
            IOSAppModel.shared.apply(sessionState: .authenticated)
        }
    }

    func showAuthenticatedOfflineState() {
        IOSAppModel.shared.apply(sessionState: .authenticatedOffline)
    }

    func retrySessionValidation() {
        sessionStateCoordinator.retry()
    }

}
