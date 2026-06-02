import Foundation
import Capacitor
import LocalAuthentication

/**
 * NativeBiometricPlugin — iOS 앱 잠금용 Face ID / Touch ID 브리지.
 */
@objc(NativeBiometricPlugin)
public class NativeBiometricPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "NativeBiometricPlugin"
    public let jsName = "NativeBiometric"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable",  returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise),
    ]

    @objc func isAvailable(_ call: CAPPluginCall) {
        let context = LAContext()
        var error: NSError?
        let available = context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)

        call.resolve([
            "available": available,
            "biometryType": biometryTypeName(context.biometryType),
            "reason": available ? NSNull() : (error?.localizedDescription ?? "biometric_not_available"),
        ])
    }

    @objc func authenticate(_ call: CAPPluginCall) {
        let context = LAContext()
        context.localizedCancelTitle = "취소"
        let reason = call.getString("reason") ?? "글리움 앱 잠금을 해제합니다."

        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            call.reject(error?.localizedDescription ?? "biometric_not_available")
            return
        }

        context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason) { success, evalError in
            DispatchQueue.main.async {
                if success {
                    call.resolve(["success": true])
                } else {
                    call.reject(evalError?.localizedDescription ?? "authentication_failed")
                }
            }
        }
    }

    private func biometryTypeName(_ type: LABiometryType) -> String {
        switch type {
        case .faceID:
            return "faceId"
        case .touchID:
            return "touchId"
        default:
            return "deviceCredential"
        }
    }
}
