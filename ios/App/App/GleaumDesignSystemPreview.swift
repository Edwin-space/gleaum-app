#if DEBUG
import SwiftUI

struct GleaumDesignSystemCatalog: View {
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: GleaumSpacing.section) {
                    statusSection
                    cardSection
                    actionSection
                    symbolSection
                }
                .padding(.horizontal, GleaumLayout.phoneHorizontalPadding)
                .padding(.vertical, GleaumSpacing.xxLarge)
            }
            .navigationTitle("Apple 디자인 시스템")
        }
        .gleaumPhoneScreen()
    }

    private var statusSection: some View {
        VStack(alignment: .leading, spacing: GleaumSpacing.medium) {
            GleaumSectionHeader(title: "상태")

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: GleaumSpacing.small) {
                    GleaumStatusBadge(title: "공유", tone: .primary)
                    GleaumStatusBadge(title: "개인", tone: .personal)
                    GleaumStatusBadge(title: "완료", tone: .success)
                    GleaumStatusBadge(title: "주의", tone: .warning)
                    GleaumStatusBadge(title: "오류", tone: .destructive)
                }
            }
        }
    }

    private var cardSection: some View {
        VStack(alignment: .leading, spacing: GleaumSpacing.medium) {
            GleaumSectionHeader(title: "콘텐츠 카드", actionTitle: "전체 보기", action: {})

            GleaumCard {
                VStack(alignment: .leading, spacing: GleaumSpacing.small) {
                    Label("오늘의 일정", systemImage: GleaumSymbol.schedule.rawValue)
                        .font(.headline)

                    Text("오후 3:00 · 가족 모임")
                        .font(.body)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var actionSection: some View {
        VStack(alignment: .leading, spacing: GleaumSpacing.medium) {
            GleaumSectionHeader(title: "표준 액션")

            Button("일정 추가", action: {})
                .buttonStyle(.borderedProminent)
                .controlSize(.large)

            Button("나중에 하기", action: {})
                .buttonStyle(.bordered)
                .controlSize(.large)
        }
    }

    private var symbolSection: some View {
        VStack(alignment: .leading, spacing: GleaumSpacing.medium) {
            GleaumSectionHeader(title: "iPhone 섹션")

            HStack {
                ForEach(GleaumPhoneSection.allCases) { section in
                    VStack(spacing: GleaumSpacing.xSmall) {
                        section.symbol.image
                            .font(.title3)
                        Text(section.title)
                            .font(.caption2)
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundStyle(
                        section == .home ? GleaumColors.brandBlue : Color.secondary
                    )
                }
            }
            .frame(minHeight: GleaumLayout.minimumTapTarget)
        }
    }
}

struct GleaumDesignSystemCatalog_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            GleaumDesignSystemCatalog()
                .preferredColorScheme(.light)

            GleaumDesignSystemCatalog()
                .preferredColorScheme(.dark)
        }
        .previewDevice("iPhone 17 Pro")
    }
}
#endif
