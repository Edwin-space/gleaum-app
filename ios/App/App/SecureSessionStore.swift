import Foundation
import Security

protocol SessionStore: Sendable {
    func load() -> String?
    @discardableResult
    func save(_ value: String) -> Bool
    func remove()
}

/// Supabase access/refresh token을 앱 전용 Keychain 항목에 저장합니다.
final class KeychainSessionStore: SessionStore, @unchecked Sendable {
    static let shared = KeychainSessionStore()

    private let service: String
    private let account: String

    init(
        service: String = Bundle.main.bundleIdentifier ?? "com.gleaum.app",
        account: String = "supabase-native-session"
    ) {
        self.service = service
        self.account = account
    }

    func load() -> String? {
        var query = baseQuery
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }

    @discardableResult
    func save(_ value: String) -> Bool {
        guard let data = value.data(using: .utf8) else {
            return false
        }

        let attributes: [String: Any] = [
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        ]
        let updateStatus = SecItemUpdate(
            baseQuery as CFDictionary,
            attributes as CFDictionary
        )

        if updateStatus == errSecSuccess {
            return true
        }
        guard updateStatus == errSecItemNotFound else {
            return false
        }

        var insert = baseQuery
        attributes.forEach { insert[$0.key] = $0.value }
        return SecItemAdd(insert as CFDictionary, nil) == errSecSuccess
    }

    func remove() {
        SecItemDelete(baseQuery as CFDictionary)
    }

    private var baseQuery: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }
}

/// 기존 버전의 UserDefaults 세션을 한 번만 Keychain으로 옮깁니다.
struct LegacySessionMigrator {
    private let defaults: UserDefaults
    private let legacyKey: String

    init(
        defaults: UserDefaults = .standard,
        legacyKey: String = "gleaum_native_session"
    ) {
        self.defaults = defaults
        self.legacyKey = legacyKey
    }

    func migrateIfNeeded(to store: SessionStore) {
        guard store.load() == nil,
              let legacy = defaults.string(forKey: legacyKey),
              !legacy.isEmpty else {
            return
        }

        if store.save(legacy) {
            defaults.removeObject(forKey: legacyKey)
        }
    }
}
