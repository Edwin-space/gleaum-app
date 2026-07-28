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
    @Published private(set) var onboardingProfile: NativeProfileSummary?

    let startupStore = StartupSnapshotStore.shared

    private var transitionTask: Task<Void, Never>?
    private var prefetchTask: Task<Void, Never>?
    private var transitionGeneration = UUID()

    private init() {}

    func apply(sessionState: AppSessionState) {
#if DEBUG
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
            startupStore.clear()
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
                    self.screen = profile.onboardingCompleted ? .authenticated : .onboarding
                    return
                }

                if let completed = self.startupStore.homeSummary?.user.onboardingCompleted {
                    self.screen = completed ? .authenticated : .onboarding
                } else if self.startupStore.hasCachedData {
                    self.screen = .authenticated
                } else {
                    self.screen = .offline
                }
            }

        case .authenticatedOffline:
            if startupStore.hasCachedData {
                selectedTab = .home
                screen = .authenticated
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
        SessionManager.shared.clearSession()
    }

    func showNativeHome() {
        selectedTab = .home
        screen = .authenticated
    }

    func completeOnboarding(with profile: NativeProfileSummary) async {
        onboardingProfile = profile
        startupStore.clear()
        await startupStore.prefetch(force: true)
        selectedTab = .home
        screen = .authenticated
    }

    func openLegacyRoute(for tab: IOSMainTab) {
        guard let path = tab.legacyPath else {
            showNativeHome()
            return
        }
        NativeRouteCoordinator.shared.openWebPath(path)
    }
}
