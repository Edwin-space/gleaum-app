import Foundation
import Capacitor

/**
 * NativeSessionPlugin — iOS Capacitor 브리지 플러그인
 *
 * JS 호출:
 *   NativeSession.getSession()    → { session: String | null }
 *   NativeSession.saveSession()   → void
 *   NativeSession.clearSession()  → void
 *   NativeSession.logout()        → void (세션 삭제 + LoginViewController 표시)
 */
@objc(NativeSessionPlugin)
public class NativeSessionPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "NativeSessionPlugin"
    public let jsName = "NativeSession"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getSession",    returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveSession",   returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearSession",  returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "logout",        returnType: CAPPluginReturnPromise),
    ]

    // 저장된 세션 반환 (만료 확인 포함)
    @objc func getSession(_ call: CAPPluginCall) {
        let session = SessionManager.shared.getSession()
        call.resolve(["session": session as Any])
    }

    // 세션 저장 (웹 OAuth 완료 후 NativeAppProvider에서 호출)
    @objc func saveSession(_ call: CAPPluginCall) {
        guard let sessionJson = call.getString("session") else {
            call.reject("session parameter required")
            return
        }
        SessionManager.shared.saveSession(sessionJson)
        call.resolve()
    }

    // 세션 삭제
    @objc func clearSession(_ call: CAPPluginCall) {
        SessionManager.shared.clearSession()
        call.resolve()
    }

    // 로그아웃: 세션 삭제 + LoginViewController 표시
    @objc func logout(_ call: CAPPluginCall) {
        SessionManager.shared.clearSession()
        call.resolve()

        DispatchQueue.main.async {
            self.presentLoginScreen()
        }
    }

    private func presentLoginScreen() {
        guard let rootVC = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap({ $0.windows })
            .first(where: \.isKeyWindow)?.rootViewController else { return }
        let loginVC = LoginViewController()
        loginVC.modalPresentationStyle = .fullScreen
        loginVC.modalTransitionStyle   = .crossDissolve

        // 이미 LoginViewController가 표시 중이면 스킵
        if rootVC.presentedViewController is LoginViewController { return }
        rootVC.present(loginVC, animated: true)
    }
}
