import Foundation
import SwiftUI
import UIKit

enum IOSAppScreen: Equatable {
    case launching
    case signedOut
    case onboarding
    case authenticated
    case offline
}

enum IOSMainTab: Hashable {
    case home
    case schedules
    case space
    case budget
    case more

    var legacyPath: String? {
        switch self {
        case .home:
            return nil
        case .schedules:
            return "/schedules"
        case .space:
            return "/space"
        case .budget:
            return "/budget"
        case .more:
            return "/mypage"
        }
    }
}

/// SwiftUI 화면 전환과 시작 snapshot을 한 곳에서 소유합니다.
@MainActor
final class IOSAppModel: ObservableObject {
    static let shared = IOSAppModel()

    @Published private(set) var screen: IOSAppScreen = .launching
    @Published var selectedTab: IOSMainTab = .home
    @Published var isPresentingNotifications = false
    @Published var presentedSchedule: NativeScheduleItem?
    @Published var presentedFamilyFlow: IOSFamilyRoute?
    @Published private(set) var onboardingProfile: NativeProfileSummary?

    let startupStore = StartupSnapshotStore.shared

    private var transitionTask: Task<Void, Never>?
    private var prefetchTask: Task<Void, Never>?
    private var routeTask: Task<Void, Never>?
    private var pendingNativePath: String?
    private var transitionGeneration = UUID()

    private init() {}

    func apply(sessionState: AppSessionState) {
#if DEBUG
        if CommandLine.arguments.contains("-GLEAUMPreviewFamily") {
            startupStore.loadSpacePreview()
            onboardingProfile = NativeProfileSummary(
                id: "preview",
                email: "guardian@gleaum.com",
                name: "글리움 관리자",
                displayName: "글리움 관리자",
                realName: nil,
                nameDisplayMode: "nickname",
                avatar: nil,
                timezone: "Asia/Seoul",
                locale: "ko-KR",
                onboardingCompleted: true,
                notificationSettings: NativeNotificationSettings(
                    scheduleReminders: true,
                    routineReminders: true,
                    expenseReminders: true,
                    spaceUpdates: true
                )
            )
            selectedTab = .space
            presentedFamilyFlow = .manage(spaceId: "preview-family-space")
            screen = .authenticated
            return
        }

        if CommandLine.arguments.contains("-GLEAUMPreviewNotifications") {
            startupStore.loadNotificationPreview()
            selectedTab = .home
            isPresentingNotifications = true
            screen = .authenticated
            return
        }

        if CommandLine.arguments.contains("-GLEAUMPreviewMore")
            || CommandLine.arguments.contains("-GLEAUMPreviewCalendar")
            || CommandLine.arguments.contains("-GLEAUMPreviewAppearance") {
            startupStore.loadNotificationPreview()
            onboardingProfile = NativeProfileSummary(
                id: "preview",
                email: "preview@gleaum.com",
                name: "글리움 관리자",
                displayName: "글리움 관리자",
                realName: "유태수",
                nameDisplayMode: "nickname",
                avatar: nil,
                timezone: "Asia/Seoul",
                locale: "ko-KR",
                onboardingCompleted: true,
                notificationSettings: NativeNotificationSettings(
                    scheduleReminders: true,
                    routineReminders: true,
                    expenseReminders: true,
                    spaceUpdates: true
                )
            )
            selectedTab = .more
            screen = .authenticated
            return
        }

        if CommandLine.arguments.contains("-GLEAUMPreviewBudget") {
            startupStore.loadBudgetPreview()
            selectedTab = .budget
            screen = .authenticated
            return
        }

        if CommandLine.arguments.contains("-GLEAUMPreviewSpaces") {
            startupStore.loadSpacePreview()
            selectedTab = .space
            screen = .authenticated
            return
        }

        if CommandLine.arguments.contains("-GLEAUMPreviewSchedules") {
            startupStore.loadSchedulePreview()
            selectedTab = .schedules
            screen = .authenticated
            return
        }

        if CommandLine.arguments.contains("-GLEAUMPreviewOnboarding") {
            onboardingProfile = NativeProfileSummary(
                id: "preview",
                email: "preview@gleaum.com",
                name: "글리움 사용자",
                displayName: "글리움 사용자",
                realName: nil,
                nameDisplayMode: "nickname",
                avatar: nil,
                timezone: "Asia/Seoul",
                locale: "ko-KR",
                onboardingCompleted: false,
                notificationSettings: NativeNotificationSettings(
                    scheduleReminders: true,
                    routineReminders: true,
                    expenseReminders: true,
                    spaceUpdates: true
                )
            )
            screen = .onboarding
            return
        }
#endif

        transitionTask?.cancel()
        transitionGeneration = UUID()
        let generation = transitionGeneration

        switch sessionState {
        case .idle, .validating:
            screen = .launching

        case .signedOut:
            prefetchTask?.cancel()
            prefetchTask = nil
            routeTask?.cancel()
            routeTask = nil
            startupStore.clear()
            isPresentingNotifications = false
            presentedSchedule = nil
            presentedFamilyFlow = nil
            onboardingProfile = nil
            transitionTask = Task { [weak self] in
                try? await Task.sleep(nanoseconds: 550_000_000)
                guard !Task.isCancelled, self?.transitionGeneration == generation else { return }
                self?.screen = .signedOut
            }

        case .authenticated:
            selectedTab = .home
            screen = .launching
            let profileTask = Task {
                try? await NativeAPIClient.shared.fetchProfile()
            }
            prefetchTask = Task { [weak self] in
                guard let self else { return }
                await self.startupStore.prefetch()
            }
            transitionTask = Task { [weak self] in
                async let minimumBrandTime: Void = Task.sleep(nanoseconds: 900_000_000)
                let profile = await profileTask.value
                try? await minimumBrandTime
                guard !Task.isCancelled, self?.transitionGeneration == generation else { return }
                guard let self else { return }

                self.onboardingProfile = profile
                if let profile {
                    if profile.onboardingCompleted {
                        self.finishAuthenticatedTransition()
                    } else {
                        self.screen = .onboarding
                    }
                    return
                }

                if let completed = self.startupStore.homeSummary?.user.onboardingCompleted {
                    if completed {
                        self.finishAuthenticatedTransition()
                    } else {
                        self.screen = .onboarding
                    }
                } else if self.startupStore.hasCachedData {
                    self.finishAuthenticatedTransition()
                } else {
                    self.screen = .offline
                }
            }

        case .authenticatedOffline:
            if startupStore.hasCachedData {
                selectedTab = .home
                finishAuthenticatedTransition()
            } else {
                screen = .offline
            }
        }
    }

    func retrySessionValidation() {
        screen = .launching
        (UIApplication.shared.delegate as? AppDelegate)?.retrySessionValidation()
    }

    func signOut() {
        pendingNativePath = nil
        presentedFamilyFlow = nil
        SessionManager.shared.clearSession()
    }

    func showNativeHome() {
        selectedTab = .home
        isPresentingNotifications = false
        presentedFamilyFlow = nil
        screen = .authenticated
    }

    func showNotifications() {
        guard screen == .authenticated else { return }
        isPresentingNotifications = true
    }

    func openSchedule(id: String) {
        guard screen == .authenticated, !id.isEmpty else { return }
        isPresentingNotifications = false
        selectedTab = .schedules

        if let cached = startupStore.schedules.first(where: { $0.id == id }) {
            presentedSchedule = cached
            return
        }

        routeTask?.cancel()
        routeTask = Task { [weak self] in
            guard let self else { return }
            if let schedule = try? await NativeAPIClient.shared.fetchSchedule(id: id),
               !Task.isCancelled {
                self.presentedSchedule = schedule
            }
        }
    }

    @discardableResult
    func handleNativeRoute(path: String) -> Bool {
        guard screen == .authenticated || screen == .launching else { return false }
        let cleanPath = path.split(separator: "?", maxSplits: 1).first.map(String.init) ?? path

        if screen == .launching {
            guard supportsNativeRoute(cleanPath) else { return false }
            pendingNativePath = path
            return true
        }

        if cleanPath == "/" || cleanPath == "/home" {
            showNativeHome()
            return true
        }
        if cleanPath == "/notifications" {
            selectedTab = .home
            showNotifications()
            return true
        }
        if cleanPath == "/schedules" {
            isPresentingNotifications = false
            selectedTab = .schedules
            return true
        }
        if cleanPath.hasPrefix("/schedules/") {
            let id = cleanPath
                .replacingOccurrences(of: "/schedules/", with: "")
                .replacingOccurrences(of: "/edit", with: "")
            openSchedule(id: id)
            return true
        }
        if cleanPath == "/space" || cleanPath == "/family" {
            isPresentingNotifications = false
            selectedTab = .space
            return true
        }
        if cleanPath == "/space/children" {
            let spaceId = queryValue(named: "sid", in: path)
                ?? startupStore.spaceSummary?.activeSpace?.id
            guard let spaceId, !spaceId.isEmpty else { return false }
            isPresentingNotifications = false
            selectedTab = .space
            presentedFamilyFlow = .manage(spaceId: spaceId)
            return true
        }
        if cleanPath.hasPrefix("/invite/child/") {
            let token = cleanPath.replacingOccurrences(of: "/invite/child/", with: "")
            guard !token.isEmpty else { return false }
            isPresentingNotifications = false
            presentedFamilyFlow = .claim(token: token)
            return true
        }
        if cleanPath == "/family/guardian/verify",
           let token = queryValue(named: "token", in: path),
           !token.isEmpty {
            isPresentingNotifications = false
            presentedFamilyFlow = .consent(token: token)
            return true
        }
        if cleanPath == "/budget",
           startupStore.accountContext?.capabilities.canViewHouseholdBudget == true {
            isPresentingNotifications = false
            selectedTab = .budget
            return true
        }
        if cleanPath == "/mypage" || cleanPath == "/settings" {
            isPresentingNotifications = false
            selectedTab = .more
            return true
        }
        return false
    }

    @discardableResult
    func queueNativeRoute(path: String) -> Bool {
        let cleanPath = path.split(separator: "?", maxSplits: 1).first.map(String.init) ?? path
        guard supportsNativeRoute(cleanPath) else { return false }
        if screen == .authenticated || screen == .launching {
            return handleNativeRoute(path: path)
        }
        pendingNativePath = path
        return true
    }

    private func finishAuthenticatedTransition() {
        screen = .authenticated
        guard let path = pendingNativePath else { return }
        pendingNativePath = nil
        _ = handleNativeRoute(path: path)
    }

    private func supportsNativeRoute(_ path: String) -> Bool {
        path == "/"
            || path == "/home"
            || path == "/notifications"
            || path == "/schedules"
            || path.hasPrefix("/schedules/")
            || path == "/space"
            || path == "/family"
            || path == "/space/children"
            || path.hasPrefix("/invite/child/")
            || path == "/family/guardian/verify"
            || path == "/budget"
            || path == "/mypage"
            || path == "/settings"
    }

    func completeOnboarding(with profile: NativeProfileSummary) async {
        onboardingProfile = profile
        startupStore.clear()
        await startupStore.prefetch(force: true)
        selectedTab = .home
        screen = .authenticated
    }

    func applyProfile(_ profile: NativeProfileSummary) {
        onboardingProfile = profile
    }

    func openLegacyRoute(for tab: IOSMainTab) {
        guard let path = tab.legacyPath else {
            showNativeHome()
            return
        }
        NativeRouteCoordinator.shared.openWebPath(path)
    }

    private func queryValue(named name: String, in path: String) -> String? {
        guard let components = URLComponents(
            string: path.hasPrefix("http") ? path : "https://www.gleaum.com\(path)"
        ) else {
            return nil
        }
        return components.queryItems?.first(where: { $0.name == name })?.value
    }
}
