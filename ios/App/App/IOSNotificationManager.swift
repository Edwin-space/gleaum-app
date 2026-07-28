import FirebaseMessaging
import SwiftUI
import UIKit
import UserNotifications

enum IOSPushAuthorizationState: Equatable {
    case unknown
    case notDetermined
    case denied
    case authorized
    case provisional

    var title: String {
        switch self {
        case .unknown: return "확인 중"
        case .notDetermined: return "설정하지 않음"
        case .denied: return "허용하지 않음"
        case .authorized: return "허용됨"
        case .provisional: return "조용히 받기"
        }
    }

    var symbol: String {
        switch self {
        case .unknown: return "hourglass"
        case .notDetermined: return "bell"
        case .denied: return "bell.slash"
        case .authorized: return "bell.badge"
        case .provisional: return "bell.and.waves.left.and.right"
        }
    }

    var canReceiveNotifications: Bool {
        self == .authorized || self == .provisional
    }
}

@MainActor
final class IOSNotificationPermissionManager: ObservableObject {
    static let shared = IOSNotificationPermissionManager()

    @Published private(set) var authorizationState: IOSPushAuthorizationState = .unknown
    @Published private(set) var isWorking = false
    @Published private(set) var lastRegisteredAt: Date?
    @Published var errorMessage: String?

    private var lastRegisteredToken: String?

    private init() {}

    func refreshAuthorizationState() async {
        let settings = await notificationSettings()
        switch settings.authorizationStatus {
        case .notDetermined:
            authorizationState = .notDetermined
        case .denied:
            authorizationState = .denied
        case .authorized:
            authorizationState = .authorized
        case .provisional, .ephemeral:
            authorizationState = .provisional
        @unknown default:
            authorizationState = .unknown
        }
    }

    func requestAuthorization() async {
        guard !isWorking else { return }
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }

        do {
            let granted = try await requestSystemAuthorization()
            await refreshAuthorizationState()
            guard granted || authorizationState.canReceiveNotifications else { return }

            UIApplication.shared.registerForRemoteNotifications()
            if let token = try await fetchFCMToken() {
                await register(token: token)
            }
        } catch {
            errorMessage = "알림 권한을 설정하지 못했습니다. 잠시 후 다시 시도해 주세요."
        }
    }

    func register(token: String) async {
        guard SessionManager.shared.hasValidSession(),
              !token.isEmpty,
              token != lastRegisteredToken else {
            return
        }

        do {
            try await NativeAPIClient.shared.registerPushToken(token)
            lastRegisteredToken = token
            lastRegisteredAt = Date()
            errorMessage = nil
        } catch {
            errorMessage = "푸시 알림 기기를 등록하지 못했습니다. 연결 상태를 확인해 주세요."
        }
    }

    func openSystemSettings() {
        guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
        UIApplication.shared.open(url)
    }

    private func notificationSettings() async -> UNNotificationSettings {
        await withCheckedContinuation { continuation in
            UNUserNotificationCenter.current().getNotificationSettings {
                continuation.resume(returning: $0)
            }
        }
    }

    private func requestSystemAuthorization() async throws -> Bool {
        try await withCheckedThrowingContinuation { continuation in
            UNUserNotificationCenter.current().requestAuthorization(
                options: [.alert, .badge, .sound]
            ) { granted, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: granted)
                }
            }
        }
    }

    private func fetchFCMToken() async throws -> String? {
        try await withCheckedThrowingContinuation { continuation in
            Messaging.messaging().token { token, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: token)
                }
            }
        }
    }
}
