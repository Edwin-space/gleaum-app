import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    // ── URL Scheme 처리 (gleaum:// — Google OAuth 콜백) ──────────────────────
    func application(_ app: UIApplication, open url: URL,
                     options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Capacitor ApplicationDelegateProxy가 URL을 WebView로 전달
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    // ── Universal Links 처리 (https://www.gleaum.com 딥링크) ─────────────────
    func application(_ application: UIApplication,
                     continue userActivity: NSUserActivity,
                     restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application,
                                                           continue: userActivity,
                                                           restorationHandler: restorationHandler)
    }

    // ── APNs 푸시 알림 등록 성공 ──────────────────────────────────────────────
    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // Capacitor에 APNs 토큰 전달 (LocalNotifications 플러그인 사용)
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
        #if targetEnvironment(macCatalyst)
        // Mac Catalyst: 최소/최대 윈도우 크기 설정
        if let windowScene = application.connectedScenes.first as? UIWindowScene {
            // 최소 800×600, 최대 무제한 (자유 리사이즈)
            windowScene.sizeRestrictions?.minimumSize = CGSize(width: 800, height: 600)
            windowScene.sizeRestrictions?.maximumSize = CGSize(
                width: CGFloat.greatestFiniteMagnitude,
                height: CGFloat.greatestFiniteMagnitude
            )
        }
        #endif
    }
}
