import SwiftUI
import UIKit

enum GleaumThemePreference: String, CaseIterable {
    case system
    case light
    case dark

    var interfaceStyle: UIUserInterfaceStyle {
        switch self {
        case .system:
            return .unspecified
        case .light:
            return .light
        case .dark:
            return .dark
        }
    }
}

/// iPhone 화면 전반에서 공유하는 기본 간격과 컨트롤 규격입니다.
/// 화면별 임의 수치를 추가하지 말고 이 기준을 우선 사용합니다.
enum GleaumIOSMetric {
    static let pageHorizontalPadding: CGFloat = 24
    static let readableContentWidth: CGFloat = 420
    static let authenticationControlHeight: CGFloat = 52
    static let textFieldHeight: CGFloat = 52
    static let controlCornerRadius: CGFloat = 12
    static let brandMarkSize: CGFloat = 76
    static let brandWordmarkWidth: CGFloat = 140
    static let brandWordmarkHeight: CGFloat = 35
    static let brandAssetSpacing: CGFloat = 12
}

/// iOS 화면과 WebView가 동일한 라이트·다크·시스템 선택을 사용하도록 관리합니다.
final class GleaumThemeManager {
    static let shared = GleaumThemeManager()

    private let defaults: UserDefaults
    private let key = "gleaum:theme-mode"

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    var preference: GleaumThemePreference {
        get {
            guard let rawValue = defaults.string(forKey: key),
                  let value = GleaumThemePreference(rawValue: rawValue) else {
                return .system
            }
            return value
        }
        set {
            defaults.set(newValue.rawValue, forKey: key)
            applyToConnectedWindows()
            NotificationCenter.default.post(name: .gleaumThemeChanged, object: newValue)
        }
    }

    func apply(to window: UIWindow?) {
        window?.overrideUserInterfaceStyle = preference.interfaceStyle
    }

    func applyToConnectedWindows() {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .forEach { apply(to: $0) }
    }
}

enum GleaumUIColor {
    static let brandBlue = UIColor(
        red: 0.000,
        green: 0.518,
        blue: 0.800,
        alpha: 1
    )
    static let brandTeal = UIColor(
        red: 0.047,
        green: 0.788,
        blue: 0.710,
        alpha: 1
    )
    static let brandGreen = UIColor(
        red: 0.180,
        green: 0.910,
        blue: 0.584,
        alpha: 1
    )

    static let background = dynamic(
        light: UIColor(red: 0.980, green: 0.980, blue: 0.992, alpha: 1),
        dark: UIColor(red: 0.059, green: 0.090, blue: 0.165, alpha: 1)
    )
    static let surface = dynamic(
        light: .white,
        dark: UIColor(red: 0.082, green: 0.114, blue: 0.184, alpha: 1)
    )
    static let mutedSurface = dynamic(
        light: UIColor(red: 0.969, green: 0.973, blue: 0.984, alpha: 1),
        dark: UIColor(red: 0.114, green: 0.149, blue: 0.220, alpha: 1)
    )
    static let text = dynamic(
        light: UIColor(red: 0.102, green: 0.106, blue: 0.180, alpha: 1),
        dark: UIColor(red: 0.973, green: 0.980, blue: 0.988, alpha: 1)
    )
    static let mutedText = dynamic(
        light: UIColor(red: 0.431, green: 0.431, blue: 0.400, alpha: 1),
        dark: UIColor(red: 0.796, green: 0.835, blue: 0.882, alpha: 1)
    )
    static let subtleText = dynamic(
        light: UIColor(red: 0.557, green: 0.557, blue: 0.576, alpha: 1),
        dark: UIColor(red: 0.580, green: 0.639, blue: 0.722, alpha: 1)
    )
    static let border = dynamic(
        light: UIColor(red: 0.102, green: 0.106, blue: 0.180, alpha: 0.08),
        dark: UIColor(white: 1, alpha: 0.10)
    )
    static let activeControl = dynamic(
        light: UIColor(red: 0.047, green: 0.788, blue: 0.710, alpha: 0.14),
        dark: UIColor(red: 0.047, green: 0.788, blue: 0.710, alpha: 0.22)
    )
    static let heroSurface = dynamic(
        light: UIColor(red: 0.918, green: 0.953, blue: 0.980, alpha: 1),
        dark: UIColor(red: 0.105, green: 0.137, blue: 0.260, alpha: 1)
    )
    private static func dynamic(light: UIColor, dark: UIColor) -> UIColor {
        UIColor { traits in
            traits.userInterfaceStyle == .dark ? dark : light
        }
    }
}

private struct GleaumSectionSurfaceModifier: ViewModifier {
    let color: UIColor

    func body(content: Content) -> some View {
        content
            .padding(18)
            .background(Color(uiColor: color))
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(Color(uiColor: GleaumUIColor.border), lineWidth: 0.5)
            }
    }
}

extension View {
    func gleaumSectionSurface(_ color: UIColor) -> some View {
        modifier(GleaumSectionSurfaceModifier(color: color))
    }
}

extension Notification.Name {
    static let gleaumThemeChanged = Notification.Name("gleaum_theme_changed")
}
