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
    @Published private(set) var spaceSummary: NativeSpaceSummary?
    @Published private(set) var schedules: [NativeScheduleItem] = []
    @Published private(set) var budgetSummary: NativeBudgetSummary?
    @Published private(set) var notificationSummary: NativeNotificationSummary?
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

    /// 사용자 새로고침이나 mutation 이후 필요한 도메인만 다시 확인합니다.
    func refresh(domains: Set<StartupDomain>) async {
        guard !domains.isEmpty else { return }
        if let activeTask {
            await activeTask.value
        }

        let task = Task { [weak self] in
            guard let self else { return }
            await self.performTargetedRefresh(domains: domains)
        }
        activeTask = task
        await task.value
        activeTask = nil
    }

    func upsertSchedule(_ schedule: NativeScheduleItem) {
        if let index = schedules.firstIndex(where: { $0.id == schedule.id }) {
            schedules[index] = schedule
        } else {
            schedules.append(schedule)
        }
        schedules.sort { $0.startTime < $1.startTime }
    }

    func removeSchedule(id: String) {
        schedules.removeAll { $0.id == id }
    }

    func applySpaceSummary(_ summary: NativeSpaceSummary) {
        spaceSummary = summary
        domainErrors[.spaces] = nil
        if let data = try? JSONEncoder().encode(summary) {
            rawSnapshots[.spaces] = data
        }
        lastUpdatedAt = Date()
        state = domainErrors.isEmpty ? .ready : .partialFailure
    }

    func applyBudgetSummary(_ summary: NativeBudgetSummary) {
        budgetSummary = summary
        domainErrors[.budget] = nil
        if let data = try? JSONEncoder().encode(summary) {
            rawSnapshots[.budget] = data
        }
        lastUpdatedAt = Date()
        state = domainErrors.isEmpty ? .ready : .partialFailure
    }

    func applyNotificationSummary(_ summary: NativeNotificationSummary) {
        notificationSummary = summary
        domainErrors[.notifications] = nil
        if let data = try? JSONEncoder().encode(summary) {
            rawSnapshots[.notifications] = data
        }
        lastUpdatedAt = Date()
        state = domainErrors.isEmpty ? .ready : .partialFailure
    }

    func markNotificationReadLocally(id: String) {
        guard let summary = notificationSummary else { return }
        let items = summary.notifications.map { item in
            guard item.id == id, !item.read else { return item }
            return NativeNotificationItem(
                id: item.id,
                userId: item.userId,
                scheduleId: item.scheduleId,
                title: item.title,
                body: item.body,
                type: item.type,
                read: true,
                createdAt: item.createdAt
            )
        }
        applyNotificationSummary(
            NativeNotificationSummary(
                notifications: items,
                unreadCount: items.filter { !$0.read }.count
            )
        )
    }

    func markAllNotificationsReadLocally() {
        guard let summary = notificationSummary else { return }
        let items = summary.notifications.map { item in
            NativeNotificationItem(
                id: item.id,
                userId: item.userId,
                scheduleId: item.scheduleId,
                title: item.title,
                body: item.body,
                type: item.type,
                read: true,
                createdAt: item.createdAt
            )
        }
        applyNotificationSummary(
            NativeNotificationSummary(notifications: items, unreadCount: 0)
        )
    }

#if DEBUG
    func loadSchedulePreview() {
        let calendar = Calendar.current
        let now = Date()
        let todayMorning = calendar.date(bySettingHour: 9, minute: 30, second: 0, of: now) ?? now
        let todayAfternoon = calendar.date(bySettingHour: 15, minute: 0, second: 0, of: now) ?? now
        let tomorrow = calendar.date(byAdding: .day, value: 1, to: todayMorning) ?? now
        let nextWeek = calendar.date(byAdding: .day, value: 6, to: todayMorning) ?? now
        let editable = NativeSchedulePermissions(
            canEdit: true,
            canDelete: true,
            canChangeStatus: true,
            canRenotify: true
        )

        schedules = [
            NativeScheduleItem(
                id: "preview-personal",
                title: "주간 계획 정리",
                type: "personal",
                category: "routine",
                visibility: "private",
                automationPolicy: "reminder_only",
                startTime: ISO8601DateFormatter.gleaum.string(from: todayMorning),
                endTime: ISO8601DateFormatter.gleaum.string(from: calendar.date(byAdding: .hour, value: 1, to: todayMorning) ?? todayMorning),
                allDay: false,
                status: "in_progress",
                repeat: "weekly",
                reminder: 15,
                memo: "이번 주 중요한 일정을 먼저 확인해요.",
                locationAddress: nil,
                locationLat: nil,
                locationLng: nil,
                referenceUrl: nil,
                spaceId: "preview-personal-space",
                createdBy: "preview",
                participantIds: ["preview"],
                permissions: editable
            ),
            NativeScheduleItem(
                id: "preview-shared",
                title: "가족 저녁 식사",
                type: "shared",
                category: "event",
                visibility: "space",
                automationPolicy: "reminder_only",
                startTime: ISO8601DateFormatter.gleaum.string(from: todayAfternoon),
                endTime: ISO8601DateFormatter.gleaum.string(from: calendar.date(byAdding: .hour, value: 2, to: todayAfternoon) ?? todayAfternoon),
                allDay: false,
                status: "pending",
                repeat: "none",
                reminder: 30,
                memo: nil,
                locationAddress: "서울특별시 중구 세종대로 110",
                locationLat: nil,
                locationLng: nil,
                referenceUrl: nil,
                spaceId: "preview-shared-space",
                createdBy: "preview",
                participantIds: ["preview"],
                permissions: editable
            ),
            NativeScheduleItem(
                id: "preview-child",
                title: "학원 준비물 확인",
                type: "child",
                category: "routine",
                visibility: "space",
                automationPolicy: "auto_progress",
                startTime: ISO8601DateFormatter.gleaum.string(from: tomorrow),
                endTime: ISO8601DateFormatter.gleaum.string(from: calendar.date(byAdding: .minute, value: 30, to: tomorrow) ?? tomorrow),
                allDay: false,
                status: "pending",
                repeat: "weekly",
                reminder: 60,
                memo: "교재와 필기도구를 챙겨요.",
                locationAddress: nil,
                locationLat: nil,
                locationLng: nil,
                referenceUrl: nil,
                spaceId: "preview-shared-space",
                createdBy: "preview",
                participantIds: ["preview-child-user"],
                permissions: editable
            ),
            NativeScheduleItem(
                id: "preview-all-day",
                title: "가족 기념일",
                type: "shared",
                category: "event",
                visibility: "space",
                automationPolicy: "reminder_only",
                startTime: ISO8601DateFormatter.gleaum.string(from: nextWeek),
                endTime: nil,
                allDay: true,
                status: "pending",
                repeat: "yearly",
                reminder: 1_440,
                memo: nil,
                locationAddress: nil,
                locationLat: nil,
                locationLng: nil,
                referenceUrl: nil,
                spaceId: "preview-shared-space",
                createdBy: "preview",
                participantIds: ["preview"],
                permissions: editable
            ),
        ]
        state = .ready
        domainErrors = [:]
        lastUpdatedAt = now
    }

    func loadSpacePreview() {
        loadSchedulePreview()
        let personal = NativeSpaceListItem(
            id: "preview-personal-space",
            name: "나의 공간",
            role: "admin",
            familyRole: nil,
            memberCount: 1,
            inviteCode: nil,
            spaceKind: "personal",
            purpose: nil,
            isPersonal: true,
            isActive: false
        )
        let family = NativeSpaceListItem(
            id: "preview-family-space",
            name: "우리 가족",
            role: "admin",
            familyRole: "father",
            memberCount: 4,
            inviteCode: "GLEAUM-7R2K9M",
            spaceKind: "family",
            purpose: "family",
            isPersonal: false,
            isActive: true
        )
        let previewSchedules = schedules.filter { $0.id != "preview-personal" }
        spaceSummary = NativeSpaceSummary(
            serverTime: ISO8601DateFormatter.gleaum.string(from: Date()),
            personalSpaceId: personal.id,
            activeSpaceId: family.id,
            activeSpace: family,
            spaces: [personal, family],
            members: [
                NativeSpaceMemberItem(
                    id: "member-me",
                    userId: "preview",
                    displayName: "글리움 관리자",
                    email: "preview@gleaum.com",
                    avatar: nil,
                    role: "admin",
                    familyRole: "father",
                    isMe: true
                ),
                NativeSpaceMemberItem(
                    id: "member-2",
                    userId: "preview-member",
                    displayName: "해나",
                    email: "member@gleaum.com",
                    avatar: nil,
                    role: "editor",
                    familyRole: "mother",
                    isMe: false
                ),
                NativeSpaceMemberItem(
                    id: "member-3",
                    userId: "preview-child",
                    displayName: "도윤",
                    email: "child@gleaum.com",
                    avatar: nil,
                    role: "viewer",
                    familyRole: "son",
                    isMe: false
                ),
            ],
            recentPosts: [
                NativeSpacePostItem(
                    id: "post-pinned",
                    type: "general",
                    content: "이번 주말 가족 일정은 토요일 오전에 함께 확인해요.",
                    pinned: true,
                    authorId: "preview",
                    authorName: "글리움 관리자",
                    commentCount: 2,
                    createdAt: ISO8601DateFormatter.gleaum.string(from: Date())
                ),
                NativeSpacePostItem(
                    id: "post-recent",
                    type: "general",
                    content: "저녁 장보기 목록을 업데이트했어요.",
                    pinned: false,
                    authorId: "preview-member",
                    authorName: "해나",
                    commentCount: 0,
                    createdAt: ISO8601DateFormatter.gleaum.string(
                        from: Calendar.current.date(byAdding: .hour, value: -3, to: Date()) ?? Date()
                    )
                ),
            ],
            upcomingSchedules: previewSchedules
        )
        accountContext = NativeAccountContext(
            accountMode: "standard",
            capabilities: NativeAccountCapabilities(
                canManageSpaces: true,
                canInviteMembers: true,
                canViewHouseholdBudget: true,
                canCompleteRoutine: true,
                canUseCheckIn: true,
                canRequestLocationPermission: true,
                canShowAds: true
            )
        )
        state = .ready
        domainErrors = [:]
        lastUpdatedAt = Date()
    }

    func loadBudgetPreview() {
        let calendar = Calendar.current
        let now = Date()
        let month = IOSBudgetFormat.monthKey(now)
        let salaryDate = calendar.date(bySetting: .day, value: 25, of: now) ?? now
        let housingDate = calendar.date(bySetting: .day, value: 10, of: now) ?? now
        let groceryDate = calendar.date(byAdding: .day, value: -1, to: now) ?? now
        let transitDate = calendar.date(byAdding: .day, value: -3, to: now) ?? now

        let salary = NativeLedgerItem(
            id: "preview-income",
            kind: "income",
            title: "7월 급여",
            amount: 3_800_000,
            category: "salary",
            method: nil,
            occurredAt: ISO8601DateFormatter.gleaum.string(from: salaryDate),
            status: "completed",
            recurFreq: "monthly",
            memo: "매월 급여"
        )
        let housing = NativeLedgerItem(
            id: "preview-housing",
            kind: "expense",
            title: "월세",
            amount: 850_000,
            category: "housing",
            method: "auto",
            occurredAt: ISO8601DateFormatter.gleaum.string(from: housingDate),
            status: "pending",
            recurFreq: "monthly",
            memo: nil
        )
        let grocery = NativeLedgerItem(
            id: "preview-grocery",
            kind: "expense",
            title: "주말 장보기",
            amount: 128_400,
            category: "daily",
            method: "card",
            occurredAt: ISO8601DateFormatter.gleaum.string(from: groceryDate),
            status: "completed",
            recurFreq: "none",
            memo: nil
        )
        let transit = NativeLedgerItem(
            id: "preview-transit",
            kind: "expense",
            title: "교통카드 충전",
            amount: 50_000,
            category: "transport",
            method: "card",
            occurredAt: ISO8601DateFormatter.gleaum.string(from: transitDate),
            status: "completed",
            recurFreq: "none",
            memo: nil
        )

        budgetSummary = NativeBudgetSummary(
            serverTime: ISO8601DateFormatter.gleaum.string(from: now),
            month: month,
            personalSpaceId: "preview-personal-space",
            incomeTotal: 3_800_000,
            expenseTotal: 1_028_400,
            net: 2_771_600,
            savingsRate: 73,
            fixedExpenseTotal: 850_000,
            variableExpenseTotal: 178_400,
            recurringIncomeTotal: 3_800_000,
            onceIncomeTotal: 0,
            pendingExpenseCount: 1,
            pendingIncomeCount: 0,
            completedExpenseCount: 2,
            completedIncomeCount: 1,
            recentEntries: [grocery, transit, salary, housing],
            recurringEntries: [housing, salary],
            categoryTotals: [
                NativeBudgetCategoryTotal(category: "salary", kind: "income", amount: 3_800_000),
                NativeBudgetCategoryTotal(category: "housing", kind: "expense", amount: 850_000),
                NativeBudgetCategoryTotal(category: "daily", kind: "expense", amount: 128_400),
                NativeBudgetCategoryTotal(category: "transport", kind: "expense", amount: 50_000),
            ]
        )
        accountContext = NativeAccountContext(
            accountMode: "standard",
            capabilities: NativeAccountCapabilities(
                canManageSpaces: true,
                canInviteMembers: true,
                canViewHouseholdBudget: true,
                canCompleteRoutine: true,
                canUseCheckIn: true,
                canRequestLocationPermission: true,
                canShowAds: true
            )
        )
        state = .ready
        domainErrors = [:]
        lastUpdatedAt = now
    }

    func loadNotificationPreview() {
        let now = Date()
        let calendar = Calendar.current
        let items = [
            NativeNotificationItem(
                id: "preview-reminder",
                userId: "preview",
                scheduleId: "preview-personal",
                title: "일정이 곧 시작돼요",
                body: "주간 계획 정리가 15분 뒤에 시작됩니다.",
                type: "reminder",
                read: false,
                createdAt: ISO8601DateFormatter.gleaum.string(
                    from: calendar.date(byAdding: .minute, value: -12, to: now) ?? now
                )
            ),
            NativeNotificationItem(
                id: "preview-invite",
                userId: "preview",
                scheduleId: nil,
                title: "새로운 공간 초대",
                body: "해나님이 여행 준비 공간으로 초대했어요.",
                type: "invite",
                read: false,
                createdAt: ISO8601DateFormatter.gleaum.string(
                    from: calendar.date(byAdding: .hour, value: -2, to: now) ?? now
                )
            ),
            NativeNotificationItem(
                id: "preview-completion",
                userId: "preview",
                scheduleId: "preview-shared",
                title: "일정이 완료되었어요",
                body: "가족 저녁 식사 일정이 완료 처리되었습니다.",
                type: "completion",
                read: true,
                createdAt: ISO8601DateFormatter.gleaum.string(
                    from: calendar.date(byAdding: .day, value: -1, to: now) ?? now
                )
            ),
        ]
        notificationSummary = NativeNotificationSummary(
            notifications: items,
            unreadCount: items.filter { !$0.read }.count
        )
        loadSchedulePreview()
        state = .ready
        domainErrors = [:]
        lastUpdatedAt = now
    }
#endif

    func clear() {
        activeTask?.cancel()
        activeTask = nil
        state = .idle
        homeSummary = nil
        accountContext = nil
        spaceSummary = nil
        schedules = []
        budgetSummary = nil
        notificationSummary = nil
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
            addFetch(.account, to: &group)
            addFetch(.home, to: &group)
            addFetch(.spaces, to: &group)
            addFetch(.schedules, to: &group)
            addFetch(.notifications, to: &group)

            var budgetScheduled = false
            for await result in group {
                apply(result)

                if result.domain == .account, !budgetScheduled {
                    budgetScheduled = true
                    if accountContext?.capabilities.canViewHouseholdBudget == true {
                        addFetch(.budget, to: &group)
                    }
                }
            }
        }

        finishRefresh()
    }

    private func performTargetedRefresh(domains: Set<StartupDomain>) async {
        let shouldShowLoading = !hasCachedData
        if shouldShowLoading {
            state = .loading
        }
        domains.forEach { domainErrors[$0] = nil }

        await withTaskGroup(of: StartupFetchResult.self) { group in
            for domain in domains {
                if domain == .budget,
                   accountContext?.capabilities.canViewHouseholdBudget != true {
                    continue
                }
                addFetch(domain, to: &group)
            }
            for await result in group {
                apply(result)
            }
        }

        finishRefresh()
    }

    private func finishRefresh() {
        lastUpdatedAt = Date()
        state = domainErrors.isEmpty ? .ready : .partialFailure
        logger.info(
            "Startup snapshot completed with \(self.rawSnapshots.count, privacy: .public) domains and \(self.domainErrors.count, privacy: .public) failures"
        )
    }

    private func addFetch(
        _ domain: StartupDomain,
        to group: inout TaskGroup<StartupFetchResult>
    ) {
        guard let path = path(for: domain) else { return }
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

    private func path(for domain: StartupDomain) -> String? {
        switch domain {
        case .account: return "/api/session/context"
        case .home: return "/api/native/home-summary"
        case .spaces: return "/api/native/spaces/summary"
        case .schedules: return "/api/native/schedules"
        case .budget: return "/api/native/budget/summary"
        case .notifications: return "/api/native/notifications"
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
                case .schedules:
                    schedules = try JSONDecoder().decode(NativeSchedulesResponse.self, from: data)
                        .schedules
                        .sorted { $0.startTime < $1.startTime }
                case .spaces:
                    spaceSummary = try JSONDecoder().decode(NativeSpaceSummary.self, from: data)
                case .budget:
                    budgetSummary = try JSONDecoder().decode(NativeBudgetSummary.self, from: data)
                case .notifications:
                    notificationSummary = try JSONDecoder().decode(
                        NativeNotificationSummary.self,
                        from: data
                    )
                }
            } catch {
                domainErrors[result.domain] = "응답 형식을 확인하지 못했습니다."
            }
            return
        }

        domainErrors[result.domain] = result.errorDescription ?? "데이터를 불러오지 못했습니다."
    }
}
