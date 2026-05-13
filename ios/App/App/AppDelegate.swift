import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // ── Firebase 초기화 ───────────────────────────────────────────────────
        FirebaseApp.configure()
        Messaging.messaging().delegate = self

        // ── 원격 알림 등록 요청 ───────────────────────────────────────────────
        UNUserNotificationCenter.current().delegate = self as? UNUserNotificationCenterDelegate
        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
        UNUserNotificationCenter.current().requestAuthorization(
            options: authOptions,
            completionHandler: { _, _ in }
        )
        application.registerForRemoteNotifications()

        return true
    }

    // ── FCM 토큰 갱신 시 콜백 ─────────────────────────────────────────────────
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        // FCM 토큰이 갱신될 때마다 호출됨 — Capacitor Firebase Messaging 플러그인이 자동 처리
        NotificationCenter.default.post(
            name: Notification.Name("FCMToken"),
            object: nil,
            userInfo: ["token": fcmToken ?? ""]
        )
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
        // FCM에 APNs 토큰 전달 (FCM이 내부적으로 APNs 토큰 ↔ FCM 토큰 매핑)
        Messaging.messaging().apnsToken = deviceToken
        // Capacitor에도 전달
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
