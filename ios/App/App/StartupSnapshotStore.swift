import Foundation
import OSLog

enum StartupDomain: String, CaseIterable, Hashable, Sendable {
    case account
    case home
    case spaces
    case schedules
    case budget
    case notifications
}

enum StartupLoadState: Equatable {
    case idle
    case loading
    case ready
    case partialFailure
}

private struct StartupFetchResult: Sendable {
    let domain: StartupDomain
    let data: Data?
    let errorDescription: String?
}

/// 콜드 스타트와 탭 전환이 공유하는 iOS 프로세스 snapshot입니다.
@MainActor
final class StartupSnapshotStore: ObservableObject {
    static let shared = StartupSnapshotStore()

    @Published private(set) var state: StartupLoadState = .idle
    @Published private(set) var homeSummary: NativeHomeSummary?
    @Published private(set) var accountContext: NativeAccountContext?
    @Published private(set) var domainErrors: [StartupDomain: String] = [:]
    @Published private(set) var lastUpdatedAt: Date?

    private let logger = Logger(subsystem: "com.gleaum.app", category: "startup-snapshot")
    private let cacheLifetime: TimeInterval = 300
    private var rawSnapshots: [StartupDomain: Data] = [:]
    private var activeTask: Task<Void, Never>?

    private init() {}

    var hasCachedData: Bool {
        homeSummary != nil || !rawSnapshots.isEmpty
    }

    func prefetch(force: Bool = false) async {
        if !force, isFresh {
            return
        }

        if let activeTask {
            await activeTask.value
            return
        }

        let task = Task { [weak self] in
            guard let self else { return }
            await self.performPrefetch()
        }
        activeTask = task
        await task.value
        activeTask = nil
    }

    func clear() {
        activeTask?.cancel()
        activeTask = nil
        state = .idle
        homeSummary = nil
        accountContext = nil
        domainErrors = [:]
        lastUpdatedAt = nil
        rawSnapshots = [:]
    }

    private var isFresh: Bool {
        guard let lastUpdatedAt else { return false }
        return Date().timeIntervalSince(lastUpdatedAt) < cacheLifetime && hasCachedData
    }

    private func performPrefetch() async {
        state = .loading
        domainErrors = [:]

        await withTaskGroup(of: StartupFetchResult.self) { group in
            addFetch(.account, path: "/api/session/context", to: &group)
            addFetch(.home, path: "/api/native/home-summary", to: &group)
            addFetch(.spaces, path: "/api/native/spaces/summary", to: &group)
            addFetch(.schedules, path: "/api/native/schedules", to: &group)
            addFetch(.notifications, path: "/api/native/notifications", to: &group)

            var budgetScheduled = false
            for await result in group {
                apply(result)

                if result.domain == .account, !budgetScheduled {
                    budgetScheduled = true
                    if accountContext?.capabilities.canViewHouseholdBudget == true {
                        addFetch(.budget, path: "/api/native/budget/summary", to: &group)
                    }
                }
            }
        }

        lastUpdatedAt = Date()
        state = domainErrors.isEmpty ? .ready : .partialFailure
        logger.info(
            "Startup snapshot completed with \(self.rawSnapshots.count, privacy: .public) domains and \(self.domainErrors.count, privacy: .public) failures"
        )
    }

    private func addFetch(
        _ domain: StartupDomain,
        path: String,
        to group: inout TaskGroup<StartupFetchResult>
    ) {
        group.addTask {
            do {
                let data = try await NativeAPIClient.shared.fetchSnapshot(path: path)
                return StartupFetchResult(domain: domain, data: data, errorDescription: nil)
            } catch {
                return StartupFetchResult(
                    domain: domain,
                    data: nil,
                    errorDescription: error.localizedDescription
                )
            }
        }
    }

    private func apply(_ result: StartupFetchResult) {
        if let data = result.data {
            rawSnapshots[result.domain] = data
            domainErrors[result.domain] = nil

            do {
                switch result.domain {
                case .account:
                    accountContext = try JSONDecoder().decode(NativeAccountContext.self, from: data)
                case .home:
                    homeSummary = try JSONDecoder().decode(NativeHomeSummary.self, from: data)
                case .spaces, .schedules, .budget, .notifications:
                    break
                }
            } catch {
                domainErrors[result.domain] = "응답 형식을 확인하지 못했습니다."
            }
            return
        }

        domainErrors[result.domain] = result.errorDescription ?? "데이터를 불러오지 못했습니다."
    }
}
