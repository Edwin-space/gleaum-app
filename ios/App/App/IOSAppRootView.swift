import SwiftUI
import UIKit

struct IOSAppRootView: View {
    @ObservedObject var model: IOSAppModel
    @StateObject private var security = IOSAppSecurityManager.shared
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
                ZStack {
                    IOSMainTabView(model: model, store: model.startupStore)
                    if security.isLocked {
                        IOSAppLockView(security: security)
                            .transition(.opacity)
                            .zIndex(10)
                    }
                }
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
    @ObservedObject var store: StartupSnapshotStore

    var body: some View {
        TabView(selection: $model.selectedTab) {
            IOSHomeNavigationView(model: model, store: model.startupStore)
                .tabItem {
                    Label("홈", systemImage: "house")
                }
                .tag(IOSMainTab.home)

            IOSScheduleNavigationView(store: model.startupStore)
                .tabItem {
                    Label("일정", systemImage: "calendar")
                }
                .tag(IOSMainTab.schedules)

            IOSSpaceNavigationView(store: model.startupStore)
                .tabItem {
                    Label("공간", systemImage: "person.2")
                }
                .tag(IOSMainTab.space)

            if store.accountContext?.capabilities.canViewHouseholdBudget == true {
                IOSBudgetNavigationView(store: store)
                    .tabItem {
                        Label("가계부", systemImage: "creditcard")
                    }
                    .tag(IOSMainTab.budget)
            }

            IOSMoreNavigationView(appModel: model, store: store)
                .tabItem {
                    Label("전체", systemImage: "line.3.horizontal")
                }
                .tag(IOSMainTab.more)
        }
        .tint(Color(uiColor: GleaumUIColor.brandTeal))
        .onChange(of: store.accountContext?.capabilities.canViewHouseholdBudget) { canViewBudget in
            if canViewBudget != true, model.selectedTab == .budget {
                model.selectedTab = .home
            }
        }
        .sheet(isPresented: $model.isPresentingNotifications) {
            IOSNotificationNavigationView(model: model, store: store)
        }
        .sheet(item: $model.presentedSchedule) { schedule in
            Group {
                if #available(iOS 16.0, *) {
                    NavigationStack {
                        IOSScheduleDetailView(store: store, initialSchedule: schedule)
                    }
                } else {
                    NavigationView {
                        IOSScheduleDetailView(store: store, initialSchedule: schedule)
                    }
                    .navigationViewStyle(.stack)
                }
            }
        }
        .sheet(item: $model.presentedFamilyFlow) { route in
            IOSFamilyRouteContainer(route: route, appModel: model, store: store)
        }
    }
}

private struct IOSAppLockView: View {
    @ObservedObject var security: IOSAppSecurityManager
    @State private var attemptedAutomatically = false

    var body: some View {
        ZStack {
            Color(uiColor: GleaumUIColor.background)
                .ignoresSafeArea()

            VStack(spacing: 22) {
                Image(systemName: security.availability.kind.symbol)
                    .font(.system(size: 46, weight: .medium))
                    .foregroundStyle(Color(uiColor: GleaumUIColor.brandTeal))
                    .accessibilityHidden(true)

                VStack(spacing: 7) {
                    Text("글리움이 잠겨 있어요")
                        .font(.title2.bold())
                    Text("\(security.availability.kind.title)로 일정과 자금 정보를 확인해 주세요.")
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }

                Button {
                    Task { _ = await security.unlock() }
                } label: {
                    Label(
                        "\(security.availability.kind.title)로 잠금 해제",
                        systemImage: security.availability.kind.symbol
                    )
                    .frame(maxWidth: 280)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color(uiColor: GleaumUIColor.brandTeal))
                .disabled(security.isAuthenticating)
            }
            .padding(28)
        }
        .task {
            guard !attemptedAutomatically else { return }
            attemptedAutomatically = true
            _ = await security.unlock()
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
