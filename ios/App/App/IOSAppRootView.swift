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
                IOSOnboardingView(
                    profile: model.onboardingProfile,
                    authenticationContext: model.onboardingContext
                ) { profile in
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
    @StateObject private var tabBarState = IOSFloatingTabBarState()
    @Environment(\.scenePhase) private var scenePhase
    private let adFitController = IOSAdFitAppTransitionController.shared

    var body: some View {
        Group {
            if #available(iOS 18.0, *) {
                adaptiveTabs
            } else {
                tabs
            }
        }
        .environmentObject(tabBarState)
        .tint(Color(uiColor: GleaumUIColor.brandTeal))
        .onChange(of: model.selectedTab) { selectedTab in
            tabBarState.activate(selectedTab)
            adFitController.presentWhenHomeIsReady()
        }
        .onChange(of: store.accountContext?.capabilities.canViewHouseholdBudget) { canViewBudget in
            if canViewBudget != true, model.selectedTab == .budget {
                model.selectedTab = .home
            }
        }
        .onChange(of: store.accountContext?.capabilities.canShowAds) { _ in
            adFitController.presentWhenHomeIsReady()
        }
        .onChange(of: scenePhase) { phase in
            if phase == .active {
                adFitController.presentWhenHomeIsReady()
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
        .sheet(isPresented: spaceJoinBinding) {
            IOSSpaceJoinView(store: store, initialCode: model.presentedSpaceJoinCode ?? "")
        }
        .onAppear {
            tabBarState.activate(model.selectedTab, expandsBar: false)
            adFitController.presentWhenHomeIsReady()
        }
    }

    private var spaceJoinBinding: Binding<Bool> {
        Binding(
            get: { model.presentedSpaceJoinCode != nil },
            set: { if !$0 { model.presentedSpaceJoinCode = nil } }
        )
    }

    @available(iOS 18.0, *)
    private var adaptiveTabs: some View {
        tabs
            .overlay(alignment: .bottom) {
                if !tabBarState.isHidden {
                    IOSFloatingTabBar(
                        tabs: availableTabs,
                        selection: $model.selectedTab,
                        state: tabBarState
                    )
                    .frame(maxWidth: .infinity)
                    .frame(height: tabBarState.isCompact ? 58 : 76, alignment: .bottom)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .background(
                Color(uiColor: GleaumUIColor.background)
                    .ignoresSafeArea()
            )
            .animation(.spring(response: 0.34, dampingFraction: 0.86), value: tabBarState.isCompact)
    }

    private var availableTabs: [IOSMainTab] {
        var result: [IOSMainTab] = [.home, .schedules, .space]
        if store.accountContext?.capabilities.canViewHouseholdBudget ?? true {
            result.append(.budget)
        }
        result.append(.more)
        return result
    }

    private var tabs: some View {
        TabView(selection: $model.selectedTab) {
            IOSHomeNavigationView(model: model, store: model.startupStore)
                .gleaumSystemTabBarHidden()
                .tabItem {
                    Label("홈", systemImage: "house")
                }
                .tag(IOSMainTab.home)

            IOSScheduleNavigationView(store: model.startupStore)
                .gleaumSystemTabBarHidden()
                .tabItem {
                    Label("일정", systemImage: "calendar")
                }
                .tag(IOSMainTab.schedules)

            IOSSpaceNavigationView(store: model.startupStore)
                .gleaumSystemTabBarHidden()
                .tabItem {
                    Label("공간", systemImage: "person.2")
                }
                .tag(IOSMainTab.space)

            if store.accountContext?.capabilities.canViewHouseholdBudget ?? true {
                IOSBudgetNavigationView(store: store)
                    .gleaumSystemTabBarHidden()
                    .tabItem {
                        Label("가계부", systemImage: "creditcard")
                    }
                    .tag(IOSMainTab.budget)
            }

            IOSMoreNavigationView(appModel: model, store: store)
                .gleaumSystemTabBarHidden()
                .tabItem {
                    Label("전체", systemImage: "line.3.horizontal")
                }
                .tag(IOSMainTab.more)
        }
    }
}

@MainActor
final class IOSFloatingTabBarState: ObservableObject {
    @Published private(set) var isCompact = false
    @Published private(set) var isHidden = false

    private var activeTab: IOSMainTab = .home
    private var lastOffset: CGFloat = 0
    private var compactTravel: CGFloat = 0
    private var expandTravel: CGFloat = 0
    private var hiddenOwners: Set<UUID> = []

    func activate(_ tab: IOSMainTab, expandsBar: Bool = true) {
        activeTab = tab
        lastOffset = 0
        compactTravel = 0
        expandTravel = 0
        if expandsBar {
            setCompact(false)
        }
    }

    func update(offset: CGFloat, for tab: IOSMainTab) {
        guard tab == activeTab else { return }

        let normalizedOffset = max(0, offset)
        if normalizedOffset <= 2 {
            lastOffset = normalizedOffset
            compactTravel = 0
            expandTravel = 0
            setCompact(false)
            return
        }

        let rawDelta = normalizedOffset - lastOffset
        lastOffset = normalizedOffset
        guard abs(rawDelta) >= 0.75 else { return }
        let delta = min(max(rawDelta, -12), 12)

        if delta > 0, normalizedOffset >= 24 {
            compactTravel += delta
            expandTravel = 0
            if compactTravel >= 14 {
                setCompact(true)
                compactTravel = 0
            }
        } else {
            expandTravel += -delta
            compactTravel = 0
            if expandTravel >= 30 {
                setCompact(false)
                expandTravel = 0
            }
        }
    }

    func setHidden(_ hidden: Bool, owner: UUID) {
        if hidden {
            hiddenOwners.insert(owner)
        } else {
            hiddenOwners.remove(owner)
        }
        isHidden = !hiddenOwners.isEmpty
    }

    private func setCompact(_ compact: Bool) {
        guard isCompact != compact else { return }
        isCompact = compact
    }
}

private struct IOSFloatingTabBar: View {
    let tabs: [IOSMainTab]
    @Binding var selection: IOSMainTab
    @ObservedObject var state: IOSFloatingTabBarState

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.sizeCategory) private var sizeCategory

    private var isCompact: Bool {
        state.isCompact && !sizeCategory.isAccessibilityCategory
    }

    private var compactWidth: CGFloat {
        CGFloat(tabs.count) * 50 + 16
    }

    var body: some View {
        HStack(spacing: isCompact ? 2 : 4) {
            ForEach(tabs, id: \.self) { tab in
                Button {
                    selection = tab
                } label: {
                    VStack(spacing: isCompact ? 0 : 2) {
                        Image(systemName: selection == tab ? tab.selectedSymbol : tab.symbol)
                            .font(.system(
                                size: isCompact ? 17 : 20,
                                weight: selection == tab ? .semibold : .regular
                            ))
                            .frame(height: isCompact ? 22 : 25)

                        if !isCompact {
                            Text(tab.title)
                                .font(.caption2.weight(selection == tab ? .semibold : .regular))
                                .lineLimit(1)
                                .minimumScaleFactor(0.82)
                                .transition(.opacity.combined(with: .scale(scale: 0.86)))
                        }
                    }
                    .foregroundStyle(
                        selection == tab
                            ? Color(uiColor: GleaumUIColor.brandTeal)
                            : Color.primary
                    )
                    .frame(maxWidth: isCompact ? nil : .infinity)
                    .frame(width: isCompact ? 46 : nil, height: isCompact ? 42 : 56)
                    .background {
                        if selection == tab {
                            RoundedRectangle(cornerRadius: isCompact ? 21 : 15, style: .continuous)
                                .fill(Color(uiColor: GleaumUIColor.brandTeal).opacity(0.13))
                        }
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(tab.title)
                .accessibilityAddTraits(selection == tab ? .isSelected : [])
            }
        }
        .padding(isCompact ? 4 : 6)
        .frame(maxWidth: isCompact ? compactWidth : .infinity)
        .background(.ultraThinMaterial, in: Capsule())
        .overlay {
            Capsule()
                .stroke(Color(uiColor: .separator).opacity(0.28), lineWidth: 0.5)
        }
        .shadow(color: Color.black.opacity(0.10), radius: isCompact ? 10 : 14, y: 5)
        .padding(.horizontal, isCompact ? 44 : 14)
        .padding(.top, 4)
        .padding(.bottom, isCompact ? 3 : 5)
        .animation(
            reduceMotion ? nil : .spring(response: 0.34, dampingFraction: 0.86),
            value: isCompact
        )
    }
}

private extension IOSMainTab {
    var title: String {
        switch self {
        case .home: return "홈"
        case .schedules: return "일정"
        case .space: return "공간"
        case .budget: return "가계부"
        case .more: return "전체"
        }
    }

    var symbol: String {
        switch self {
        case .home: return "house"
        case .schedules: return "calendar"
        case .space: return "person.2"
        case .budget: return "creditcard"
        case .more: return "line.3.horizontal"
        }
    }

    var selectedSymbol: String {
        switch self {
        case .home: return "house.fill"
        case .schedules: return "calendar"
        case .space: return "person.2.fill"
        case .budget: return "creditcard.fill"
        case .more: return "line.3.horizontal"
        }
    }
}

extension View {
    func gleaumFloatingTabBarHidden() -> some View {
        modifier(IOSFloatingTabBarVisibilityModifier())
    }

    @ViewBuilder
    func gleaumSystemTabBarHidden() -> some View {
        if #available(iOS 18.0, *) {
            toolbar(.hidden, for: .tabBar)
        } else {
            self
        }
    }

    @ViewBuilder
    func gleaumTabBarScrollTracking(for tab: IOSMainTab) -> some View {
        if #available(iOS 18.0, *) {
            modifier(IOSFloatingTabBarScrollModifier(tab: tab))
        } else {
            self
        }
    }
}

private struct IOSFloatingTabBarVisibilityModifier: ViewModifier {
    @EnvironmentObject private var state: IOSFloatingTabBarState
    @State private var owner = UUID()

    func body(content: Content) -> some View {
        content
            .onAppear {
                state.setHidden(true, owner: owner)
            }
            .onDisappear {
                state.setHidden(false, owner: owner)
            }
    }
}

@available(iOS 18.0, *)
private struct IOSFloatingTabBarScrollModifier: ViewModifier {
    let tab: IOSMainTab
    @EnvironmentObject private var tabBarState: IOSFloatingTabBarState

    func body(content: Content) -> some View {
        content
            .contentMargins(
                .bottom,
                tabBarState.isHidden ? 0 : 76,
                for: .scrollContent
            )
            .onScrollGeometryChange(for: CGFloat.self) { geometry in
                geometry.contentOffset.y + geometry.contentInsets.top
            } action: { _, newOffset in
                tabBarState.update(offset: newOffset, for: tab)
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
