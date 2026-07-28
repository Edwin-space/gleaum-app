import SwiftUI
import UIKit

struct IOSAppRootView: View {
    @ObservedObject var model: IOSAppModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Group {
            switch model.screen {
            case .launching:
                BrandTransitionView(reduceMotion: reduceMotion)
            case .signedOut:
                IOSLoginView()
            case .onboarding:
                IOSOnboardingView(profile: model.onboardingProfile) { profile in
                    await model.completeOnboarding(with: profile)
                }
            case .authenticated:
                IOSMainTabView(model: model)
            case .offline:
                OfflineRecoveryView(model: model)
            }
        }
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.22), value: model.screen)
    }
}

private struct BrandTransitionView: View {
    let reduceMotion: Bool

    @State private var appeared = false

    var body: some View {
        ZStack {
            Color(red: 0.039, green: 0.043, blue: 0.063)
                .ignoresSafeArea()

            VStack(spacing: GleaumIOSMetric.brandAssetSpacing) {
                Image("Splash")
                    .resizable()
                    .scaledToFit()
                    .frame(
                        width: GleaumIOSMetric.brandMarkSize,
                        height: GleaumIOSMetric.brandMarkSize
                    )
                    .scaleEffect(appeared ? 1 : 0.88)
                    .opacity(appeared ? 1 : 0)
                    .accessibilityLabel("글리움")

                Image("GleaumBIInverse")
                    .resizable()
                    .scaledToFit()
                    .frame(
                        width: GleaumIOSMetric.brandWordmarkWidth,
                        height: GleaumIOSMetric.brandWordmarkHeight
                    )
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared || reduceMotion ? 0 : 8)
                    .accessibilityLabel("gleaum")
            }
        }
        .onAppear {
            if reduceMotion {
                appeared = true
            } else {
                withAnimation(.spring(response: 0.72, dampingFraction: 0.82)) {
                    appeared = true
                }
            }
        }
    }
}

struct IOSMainTabView: View {
    @ObservedObject var model: IOSAppModel

    var body: some View {
        TabView(selection: $model.selectedTab) {
            IOSHomeNavigationView(model: model, store: model.startupStore)
                .tabItem {
                    Label("홈", systemImage: "house")
                }
                .tag(IOSMainTab.home)

            LegacyRouteLaunchView(tab: .schedules, model: model)
                .tabItem {
                    Label("일정", systemImage: "calendar")
                }
                .tag(IOSMainTab.schedules)

            LegacyRouteLaunchView(tab: .space, model: model)
                .tabItem {
                    Label("공간", systemImage: "person.2")
                }
                .tag(IOSMainTab.space)

            LegacyRouteLaunchView(tab: .budget, model: model)
                .tabItem {
                    Label("가계부", systemImage: "creditcard")
                }
                .tag(IOSMainTab.budget)

            LegacyRouteLaunchView(tab: .more, model: model)
                .tabItem {
                    Label("전체", systemImage: "line.3.horizontal")
                }
                .tag(IOSMainTab.more)
        }
        .tint(Color(uiColor: GleaumUIColor.brandTeal))
    }
}

private struct LegacyRouteLaunchView: View {
    let tab: IOSMainTab
    @ObservedObject var model: IOSAppModel
    @State private var opened = false

    var body: some View {
        VStack(spacing: 12) {
            ProgressView()
            Text("화면을 여는 중")
                .font(.callout)
                .foregroundStyle(.secondary)
        }
        .onAppear {
            guard !opened else { return }
            opened = true
            DispatchQueue.main.async {
                model.openLegacyRoute(for: tab)
            }
        }
        .onDisappear {
            opened = false
        }
    }
}

private struct OfflineRecoveryView: View {
    @ObservedObject var model: IOSAppModel

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "wifi.exclamationmark")
                .font(.system(size: 42))
                .foregroundStyle(.secondary)
            Text("연결을 확인할 수 없어요")
                .font(.title2.bold())
            Text("저장된 로그인 정보는 유지됩니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button("다시 시도") {
                model.retrySessionValidation()
            }
            .buttonStyle(.borderedProminent)
            Button("로그아웃", role: .destructive) {
                model.signOut()
            }
        }
        .padding(28)
    }
}
