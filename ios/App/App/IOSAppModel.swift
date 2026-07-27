import Foundation
import SwiftUI
import UIKit

enum IOSAppScreen: Equatable {
    case launching
    case signedOut
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

    let startupStore = StartupSnapshotStore.shared

    private var transitionTask: Task<Void, Never>?
    private var prefetchTask: Task<Void, Never>?
    private var transitionGeneration = UUID()

    private init() {}

    func apply(sessionState: AppSessionState) {
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
            transitionTask = Task { [weak self] in
                try? await Task.sleep(nanoseconds: 550_000_000)
                guard !Task.isCancelled, self?.transitionGeneration == generation else { return }
                self?.screen = .signedOut
            }

        case .authenticated:
            selectedTab = .home
            screen = .launching
            prefetchTask = Task { [weak self] in
                guard let self else { return }
                await self.startupStore.prefetch()
            }
            transitionTask = Task { [weak self] in
                try? await Task.sleep(nanoseconds: 900_000_000)
                guard !Task.isCancelled, self?.transitionGeneration == generation else { return }
                self?.screen = .authenticated
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

    func openLegacyRoute(for tab: IOSMainTab) {
        guard let path = tab.legacyPath else {
            showNativeHome()
            return
        }
        NativeRouteCoordinator.shared.openWebPath(path)
    }
}
