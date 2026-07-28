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
    let occurredAt: String
    let status: String
    let recurFreq: String
}

struct NativeSchedulesResponse: Codable, Sendable {
    let schedules: [NativeScheduleItem]
}

struct NativeScheduleResponse: Codable, Sendable {
    let schedule: NativeScheduleItem
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

struct NativeNotificationSettings: Codable, Sendable {
    let scheduleReminders: Bool
    let routineReminders: Bool
    let expenseReminders: Bool
    let spaceUpdates: Bool
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
