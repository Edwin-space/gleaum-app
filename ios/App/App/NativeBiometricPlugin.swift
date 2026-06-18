import Foundation
import Capacitor
import LocalAuthentication

/**
 * NativeBiometricPlugin — iOS 앱 잠금용 Face ID / Touch ID / 기기 암호 브리지.
 *
 * isAvailable():
 *   - 설정 화면에서 "생체인증 사용 가능"으로 볼지는 Face ID / Touch ID 등록 여부만 기준으로 판단한다.
 *   - iOS Simulator의 .deviceOwnerAuthentication 결과는 실제 기기 잠금 상태와 다를 수 있어,
 *     availability 단계에서는 기기 암호만으로 available 처리하지 않는다.
 *
 * authenticate():
 *   - .deviceOwnerAuthentication 사용 → Face ID/Touch ID + 기기 암호 자동 폴백
 *   - 실패 시 call.reject() 대신 call.resolve({ success: false }) 반환
 *     (JS에서 오류 throw 없이 false 로 처리하도록)
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
        var bioError: NSError?

        // 생체인식(Face ID / Touch ID) 가능 여부 체크 — biometryType이 여기서 채워짐
        if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &bioError) {
            call.resolve([
                "available": true,
                "biometryType": biometryTypeName(context.biometryType),
                "reason": NSNull(),
            ])
            return
        }

        // 기기 암호는 authenticate()의 시스템 폴백으로만 허용한다.
        // 여기서 available=true로 반환하면 Face ID 설정 화면에 기기 비밀번호 설정 흐름이 노출된다.
        let reason = availabilityReason(bioError)
        call.resolve([
            "available": false,
            "biometryType": "none",
            "reason": reason,
        ])
    }

    @objc func authenticate(_ call: CAPPluginCall) {
        let context = LAContext()
        context.localizedCancelTitle = "취소"
        context.localizedFallbackTitle = "암호 사용"
        let reason = call.getString("reason") ?? "글리움 앱 잠금을 해제합니다."

        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            // 기기 잠금 자체가 설정되지 않은 경우
            call.resolve(["success": false])
            return
        }

        // deviceOwnerAuthentication = Face ID / Touch ID + 기기 암호 자동 폴백
        context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason) { success, _ in
            DispatchQueue.main.async {
                // 성공/실패 모두 resolve — reject 시 JS catch → false 반환 문제 방지
                call.resolve(["success": success])
            }
        }
    }

    private func biometryTypeName(_ type: LABiometryType) -> String {
        switch type {
        case .faceID:   return "faceId"
        case .touchID:  return "touchId"
        default:        return "deviceCredential"
        }
    }

    private func availabilityReason(_ error: NSError?) -> String {
        guard let error else { return "not_available" }
        guard error.domain == LAError.errorDomain,
              let code = LAError.Code(rawValue: error.code) else {
            return error.localizedDescription
        }

        switch code {
        case .biometryNotEnrolled:
            return "biometry_not_enrolled"
        case .passcodeNotSet:
            return "passcode_not_set"
        case .biometryNotAvailable:
            return "biometry_not_available"
        case .biometryLockout:
            return "biometry_lockout"
        default:
            return error.localizedDescription
        }
    }
}
