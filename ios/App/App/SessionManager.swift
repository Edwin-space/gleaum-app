import Foundation

/**
 * SessionManager — Supabase 세션을 UserDefaults에 저장/조회/삭제
 * Android의 SessionManager.kt와 동일한 역할
 */
class SessionManager {

    static let shared = SessionManager()
    private init() {}

    private let key = "gleaum_native_session"

    // MARK: - Save

    func saveSession(_ json: String) {
        UserDefaults.standard.set(json, forKey: key)
        // LoginViewController 에 세션 저장 알림
        NotificationCenter.default.post(name: .gleaumSessionSaved, object: nil)
    }

    // MARK: - Get (유효한 세션만 반환)

    func getSession() -> String? {
        guard let raw = UserDefaults.standard.string(forKey: key) else { return nil }
        // 만료 60초 전부터 nil 반환
        if let data = raw.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let expiresAt = json["expires_at"] as? TimeInterval {
            let nowSec = Date().timeIntervalSince1970
            if expiresAt > 0 && nowSec > expiresAt - 60 { return nil }
        }
        return raw
    }

    // MARK: - Raw (만료 무관 — 갱신용)

    func getRawSession() -> String? {
        return UserDefaults.standard.string(forKey: key)
    }

    // MARK: - Valid

    func hasValidSession() -> Bool {
        return getSession() != nil
    }

    // MARK: - Access Token

    func accessToken() -> String? {
        guard let raw = getSession(),
              let data = raw.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }
        return json["access_token"] as? String
    }

    // MARK: - Clear

    func clearSession() {
        UserDefaults.standard.removeObject(forKey: key)
    }
}

// MARK: - Notification

extension Notification.Name {
    static let gleaumSessionSaved = Notification.Name("gleaum_session_saved")
}
