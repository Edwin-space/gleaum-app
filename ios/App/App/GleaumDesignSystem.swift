import SwiftUI
import UIKit

/// Gleaum의 iPhone SwiftUI 화면이 공유하는 의미 기반 디자인 토큰입니다.
///
/// 배경, 텍스트, 구분선은 시스템 semantic color를 사용해 라이트·다크·고대비
/// 환경을 자동으로 따릅니다. 브랜드 색은 액션과 상태 의미에만 사용합니다.
enum GleaumColors {
    static let brandBlue = Color(red: 0.000, green: 0.518, blue: 0.800)
    static let brandTeal = Color(red: 0.047, green: 0.788, blue: 0.710)
    static let brandGreen = Color(red: 0.180, green: 0.910, blue: 0.584)

    static let screenBackground = Color(uiColor: .systemGroupedBackground)
    static let surface = Color(uiColor: .secondarySystemGroupedBackground)
    static let elevatedSurface = Color(uiColor: .tertiarySystemGroupedBackground)
    static let separator = Color(uiColor: .separator)
    static let destructive = Color(uiColor: .systemRed)
    static let warning = Color(uiColor: .systemOrange)
}

enum GleaumSpacing {
    static let xSmall: CGFloat = 4
    static let small: CGFloat = 8
    static let medium: CGFloat = 12
    static let large: CGFloat = 16
    static let xLarge: CGFloat = 20
    static let xxLarge: CGFloat = 24
    static let section: CGFloat = 32
}

enum GleaumRadius {
    static let compact: CGFloat = 8
    static let control: CGFloat = 16
    static let card: CGFloat = 24
    static let navigation: CGFloat = 32
    static let pill: CGFloat = 999
}

enum GleaumLayout {
    static let phoneHorizontalPadding: CGFloat = 20
    static let minimumTapTarget: CGFloat = 44
    static let cardStrokeWidth: CGFloat = 0.5
}

struct GleaumCard<Content: View>: View {
    private let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(GleaumSpacing.large)
            .background(
                RoundedRectangle(cornerRadius: GleaumRadius.card, style: .continuous)
                    .fill(GleaumColors.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: GleaumRadius.card, style: .continuous)
                    .stroke(GleaumColors.separator, lineWidth: GleaumLayout.cardStrokeWidth)
            )
    }
}

struct GleaumBrandBackdrop: View {
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    var body: some View {
        ZStack {
            // Light canvas base (#FFFFFF → #FAFAFD). 다크 지양 방침에 따라 밝은 배경 사용.
            LinearGradient(
                colors: [
                    Color(red: 1.000, green: 1.000, blue: 1.000),
                    Color(red: 0.980, green: 0.980, blue: 0.992),
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            if !reduceTransparency {
                Circle()
                    .fill(GleaumColors.brandTeal.opacity(0.16))
                    .frame(width: 300, height: 300)
                    .blur(radius: 80)
                    .offset(x: 150, y: -260)

                Circle()
                    .fill(GleaumColors.brandBlue.opacity(0.14))
                    .frame(width: 340, height: 340)
                    .blur(radius: 96)
                    .offset(x: -170, y: 250)

                Circle()
                    .fill(GleaumColors.brandGreen.opacity(0.12))
                    .frame(width: 240, height: 240)
                    .blur(radius: 88)
                    .offset(x: 120, y: 110)
            }
        }
        .ignoresSafeArea()
    }
}

struct GleaumBrandMark: View {
    var compact = false

    var body: some View {
        HStack(spacing: GleaumSpacing.medium) {
            Image("Splash")
                .resizable()
                .scaledToFit()
                .frame(width: compact ? 40 : 56, height: compact ? 40 : 56)
                .accessibilityHidden(true)

            Text("gleaum")
                .font(compact ? .title2.weight(.bold) : .largeTitle.weight(.bold))
                .foregroundStyle(.primary)
                .accessibilityAddTraits(.isHeader)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("글리움")
    }
}

struct GleaumStatusBadge: View {
    enum Tone {
        case primary
        case personal
        case success
        case warning
        case destructive

        fileprivate var color: Color {
            switch self {
            case .primary:
                return GleaumColors.brandBlue
            case .personal:
                return GleaumColors.brandTeal
            case .success:
                return GleaumColors.brandGreen
            case .warning:
                return GleaumColors.warning
            case .destructive:
                return GleaumColors.destructive
            }
        }
    }

    let title: LocalizedStringKey
    let tone: Tone

    var body: some View {
        Text(title)
            .font(.caption.weight(.semibold))
            .foregroundStyle(tone.color)
            .padding(.horizontal, GleaumSpacing.medium)
            .padding(.vertical, GleaumSpacing.xSmall)
            .background(tone.color.opacity(0.12), in: Capsule())
            .accessibilityAddTraits(.isStaticText)
    }
}

struct GleaumSectionHeader: View {
    let title: LocalizedStringKey
    var actionTitle: LocalizedStringKey?
    var action: (() -> Void)?

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: GleaumSpacing.medium) {
            Text(title)
                .font(.headline)
                .foregroundStyle(.primary)

            Spacer(minLength: GleaumSpacing.small)

            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .font(.subheadline.weight(.semibold))
                    .buttonStyle(.plain)
                    .foregroundStyle(GleaumColors.brandBlue)
                    .frame(minHeight: GleaumLayout.minimumTapTarget)
            }
        }
    }
}

extension View {
    func gleaumPrimaryAction() -> some View {
        buttonStyle(.borderedProminent)
            .buttonBorderShape(.capsule)
            .controlSize(.large)
            .tint(GleaumColors.brandBlue)
            .font(.headline)
            .frame(maxWidth: .infinity, minHeight: 52)
    }

    func gleaumPhoneScreen() -> some View {
        frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(GleaumColors.screenBackground.ignoresSafeArea())
            .tint(GleaumColors.brandBlue)
    }
}
