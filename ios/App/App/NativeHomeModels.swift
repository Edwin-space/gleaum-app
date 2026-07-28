import Foundation

struct NativeHomeSummary: Codable, Sendable {
    let serverTime: String
    let user: NativeHomeUser
    let spaces: NativeHomeSpaces
    let schedules: NativeHomeSchedules
    let ledger: NativeHomeLedger
}

struct NativeHomeUser: Codable, Sendable {
    let id: String
    let displayName: String
    let email: String
    let avatar: String?
    let onboardingCompleted: Bool
    let timezone: String
}

struct NativeHomeSpaces: Codable, Sendable {
    let activeSpaceId: String?
    let activeSpaceName: String?
    let personalSpaceId: String?
    let sharedSpaceId: String?
    let hasSharedSpace: Bool
    let activeRole: String?
    let memberCount: Int
}

struct NativeHomeSchedules: Codable, Sendable {
    let today: [NativeScheduleItem]
    let upcoming: [NativeScheduleItem]
    let range: [NativeScheduleItem]?
    let todayCount: Int
    let completedCount: Int?
    let pendingCount: Int?
    let upcomingCount: Int
}

struct NativeSchedulePermissions: Codable, Sendable {
    let canEdit: Bool
    let canDelete: Bool
    let canChangeStatus: Bool
    let canRenotify: Bool
}

struct NativeScheduleItem: Codable, Identifiable, Sendable {
    let id: String
    let title: String
    let type: String
    let category: String?
    let visibility: String?
    let automationPolicy: String?
    let startTime: String
    let endTime: String?
    let allDay: Bool
    let status: String
    let `repeat`: String
    let reminder: Int
    let memo: String?
    let locationAddress: String?
    let locationLat: Double?
    let locationLng: Double?
    let referenceUrl: String?
    let spaceId: String
    let createdBy: String
    let participantIds: [String]
    let permissions: NativeSchedulePermissions?
}

struct NativeHomeLedger: Codable, Sendable {
    let month: String
    let incomeTotal: Int
    let expenseTotal: Int
    let net: Int
    let recentEntries: [NativeLedgerItem]
}

struct NativeLedgerItem: Codable, Identifiable, Sendable {
    let id: String
    let kind: String
    let title: String
    let amount: Int
    let category: String
    let method: String?
    let occurredAt: String
    let status: String
    let recurFreq: String
    let memo: String?
}

struct NativeBudgetCategoryTotal: Codable, Identifiable, Sendable {
    let category: String
    let kind: String
    let amount: Int

    var id: String { "\(kind)-\(category)" }
}

struct NativeBudgetSummary: Codable, Sendable {
    let serverTime: String
    let month: String
    let personalSpaceId: String?
    let incomeTotal: Int
    let expenseTotal: Int
    let net: Int
    let savingsRate: Double
    let fixedExpenseTotal: Int
    let variableExpenseTotal: Int
    let recurringIncomeTotal: Int
    let onceIncomeTotal: Int
    let pendingExpenseCount: Int
    let pendingIncomeCount: Int
    let completedExpenseCount: Int
    let completedIncomeCount: Int
    let recentEntries: [NativeLedgerItem]
    let recurringEntries: [NativeLedgerItem]
    let categoryTotals: [NativeBudgetCategoryTotal]
}

struct NativeLedgerResponse: Codable, Sendable {
    let entry: NativeLedgerItem
}

struct NativeCreateLedgerRequest: Codable, Sendable {
    let kind: String
    let title: String
    let amount: Int
    let category: String
    let method: String?
    let occurredAt: String
    let recurFreq: String?
    let memo: String?
}

struct NativeUpdateLedgerRequest: Codable, Sendable {
    let kind: String?
    let title: String?
    let amount: Int?
    let category: String?
    let method: String?
    let occurredAt: String?
    let recurFreq: String?
    let memo: String?
    let status: String?
}

struct NativeSchedulesResponse: Codable, Sendable {
    let schedules: [NativeScheduleItem]
}

struct NativeScheduleResponse: Codable, Sendable {
    let schedule: NativeScheduleItem
}

struct NativeSpaceListItem: Codable, Identifiable, Sendable, Equatable {
    let id: String
    let name: String
    let role: String
    let familyRole: String?
    let memberCount: Int
    let inviteCode: String?
    let spaceKind: String
    let purpose: String?
    let isPersonal: Bool
    let isActive: Bool
}

struct NativeSpaceMemberItem: Codable, Identifiable, Sendable, Equatable {
    let id: String
    let userId: String
    let displayName: String
    let email: String
    let avatar: String?
    let role: String
    let familyRole: String?
    let isMe: Bool
}

struct NativeSpacePostItem: Codable, Identifiable, Sendable, Equatable {
    let id: String
    let type: String
    let content: String
    let pinned: Bool
    let authorId: String
    let authorName: String
    let commentCount: Int
    let createdAt: String
}

struct NativeSpaceSummary: Codable, Sendable {
    let serverTime: String
    let personalSpaceId: String?
    let activeSpaceId: String?
    let activeSpace: NativeSpaceListItem?
    let spaces: [NativeSpaceListItem]
    let members: [NativeSpaceMemberItem]
    let recentPosts: [NativeSpacePostItem]
    let upcomingSchedules: [NativeScheduleItem]
}

struct NativeSpaceNameRequest: Codable, Sendable {
    let name: String
}

struct NativeSpaceJoinRequest: Codable, Sendable {
    let code: String
}

struct NativeSpacePostRequest: Codable, Sendable {
    let content: String
}

struct NativeSpaceMemberUpdateRequest: Codable, Sendable {
    let role: String?
    let familyRole: String?
}

struct NativeCreateScheduleRequest: Codable, Sendable {
    let title: String
    let type: String
    let spaceId: String?
    let startTime: String
    let endTime: String?
    let allDay: Bool
    let reminder: Int
    let `repeat`: String
    let memo: String?
    let visibility: String?
}

struct NativeUpdateScheduleRequest: Codable, Sendable {
    let title: String
    let startTime: String
    let endTime: String?
    let allDay: Bool
    let reminder: Int
    let `repeat`: String
    let memo: String?
    let status: String?
}

struct NativeAccountContext: Codable, Sendable {
    let accountMode: String
    let capabilities: NativeAccountCapabilities
}

struct NativeAccountCapabilities: Codable, Sendable {
    let canManageSpaces: Bool
    let canInviteMembers: Bool
    let canViewHouseholdBudget: Bool
    let canCompleteRoutine: Bool
    let canUseCheckIn: Bool
    let canRequestLocationPermission: Bool
    let canShowAds: Bool
}

struct NativeNotificationSettings: Codable, Sendable, Equatable {
    let scheduleReminders: Bool
    let routineReminders: Bool
    let expenseReminders: Bool
    let spaceUpdates: Bool
}

struct NativeNotificationItem: Codable, Identifiable, Sendable, Equatable {
    let id: String
    let userId: String
    let scheduleId: String?
    let title: String
    let body: String
    let type: String
    let read: Bool
    let createdAt: String
}

struct NativeNotificationSummary: Codable, Sendable, Equatable {
    let notifications: [NativeNotificationItem]
    let unreadCount: Int
}

struct NativeNotificationSettingsUpdateRequest: Codable, Sendable {
    let notificationSettings: NativeNotificationSettings
}

struct NativePushTokenRequest: Codable, Sendable {
    let token: String
    let platform: String
}

struct NativeProfileSummary: Codable, Sendable {
    let id: String
    let email: String
    let name: String
    let displayName: String
    let realName: String?
    let nameDisplayMode: String
    let avatar: String?
    let timezone: String
    let locale: String
    let onboardingCompleted: Bool
    let notificationSettings: NativeNotificationSettings
}

struct NativeProfileResponse: Codable, Sendable {
    let profile: NativeProfileSummary
}

struct NativeCompleteOnboardingRequest: Codable, Sendable {
    let displayName: String
    let realName: String?
    let nameDisplayMode: String
    let primaryGoal: String
    let homeLayout: String
    let enabledModules: [String]
    let defaultReminderMinutes: Int
    let spaceIntent: [String]
    let notificationSettings: NativeNotificationSettings
    let timezone: String
    let locale: String
}
