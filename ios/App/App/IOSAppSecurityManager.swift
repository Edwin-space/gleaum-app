import Foundation
import LocalAuthentication

enum IOSBiometryKind: String {
    case faceID
    case touchID
    case none

    var title: String {
        switch self {
        case .faceID:
            return "Face ID"
        case .touchID:
            return "Touch ID"
        case .none:
            return "생체인증"
        }
    }

    var symbol: String {
        switch self {
        case .faceID:
            return "faceid"
        case .touchID:
            return "touchid"
        case .none:
            return "lock.shield"
        }
    }
}

struct IOSBiometricAvailability: Equatable {
    let isAvailable: Bool
    let kind: IOSBiometryKind
    let message: String
}

@MainActor
final class IOSAppSecurityManager: ObservableObject {
    static let shared = IOSAppSecurityManager()

    @Published private(set) var isEnabled: Bool
    @Published private(set) var isLocked: Bool
    @Published private(set) var availability = IOSBiometricAvailability(
        isAvailable: false,
        kind: .none,
        message: "생체인증 상태를 확인하는 중이에요."
    )
    @Published private(set) var isAuthenticating = false

    private let defaults: UserDefaults
    private let enabledKey = "gleaum:biometric-lock-enabled"
    private var authenticationTask: Task<Bool, Never>?

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        let enabled = defaults.bool(forKey: enabledKey)
        isEnabled = enabled
        isLocked = enabled
        refreshAvailability()
    }

    func refreshAvailability() {
        let context = LAContext()
        var error: NSError?
        let available = context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            error: &error
        )
        let kind: IOSBiometryKind
        switch context.biometryType {
        case .faceID:
            kind = .faceID
        case .touchID:
            kind = .touchID
        default:
            kind = .none
        }

        availability = IOSBiometricAvailability(
            isAvailable: available,
            kind: kind,
            message: available
                ? "\(kind.title)로 앱을 잠글 수 있어요."
                : availabilityMessage(for: error)
        )
    }

    func setEnabled(_ enabled: Bool) async -> Bool {
        refreshAvailability()
        if enabled {
            guard availability.isAvailable else { return false }
            guard await authenticate(reason: "글리움 앱 잠금을 설정합니다.") else {
                return false
            }
            defaults.set(true, forKey: enabledKey)
            isEnabled = true
            isLocked = false
            return true
        }

        if isEnabled {
            guard await authenticate(reason: "글리움 앱 잠금을 해제합니다.") else {
                return false
            }
        }
        defaults.set(false, forKey: enabledKey)
        isEnabled = false
        isLocked = false
        return true
    }

    func lockIfNeeded() {
        guard isEnabled else { return }
        isLocked = true
    }

    func unlock() async -> Bool {
        guard isEnabled else {
            isLocked = false
            return true
        }
        guard await authenticate(reason: "글리움의 일정과 자금 정보를 확인합니다.") else {
            return false
        }
        isLocked = false
        return true
    }

    private func authenticate(reason: String) async -> Bool {
        if let authenticationTask {
            return await authenticationTask.value
        }

        let task = Task<Bool, Never> { [weak self] in
            guard let self else { return false }
            self.isAuthenticating = true
            defer { self.isAuthenticating = false }

            let context = LAContext()
            context.localizedCancelTitle = "취소"
            context.localizedFallbackTitle = "암호 사용"
            var error: NSError?
            guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
                self.refreshAvailability()
                return false
            }

            return await withCheckedContinuation { continuation in
                context.evaluatePolicy(
                    .deviceOwnerAuthentication,
                    localizedReason: reason
                ) { success, _ in
                    continuation.resume(returning: success)
                }
            }
        }
        authenticationTask = task
        let success = await task.value
        authenticationTask = nil
        return success
    }

    private func availabilityMessage(for error: NSError?) -> String {
        guard let error,
              error.domain == LAError.errorDomain,
              let code = LAError.Code(rawValue: error.code) else {
            return "이 기기에서는 생체인증을 사용할 수 없어요."
        }

        switch code {
        case .biometryNotEnrolled:
            return "iPhone 설정에서 Face ID 또는 Touch ID를 먼저 등록해 주세요."
        case .passcodeNotSet:
            return "iPhone에 기기 암호를 먼저 설정해 주세요."
        case .biometryLockout:
            return "생체인증이 잠겼습니다. 기기 암호로 잠금을 해제해 주세요."
        default:
            return "이 기기에서는 생체인증을 사용할 수 없어요."
        }
    }
}
