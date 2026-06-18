import Foundation

struct NativeHomeSummary: Codable {
    let serverTime: String
    let user: NativeHomeUser
    let spaces: NativeHomeSpaces
    let schedules: NativeHomeSchedules
    let ledger: NativeHomeLedger
}

struct NativeHomeUser: Codable {
    let id: String
    let displayName: String
    let email: String
    let avatar: String?
    let onboardingCompleted: Bool
    let timezone: String
}

struct NativeHomeSpaces: Codable {
    let activeSpaceId: String?
    let activeSpaceName: String?
    let personalSpaceId: String?
    let sharedSpaceId: String?
    let hasSharedSpace: Bool
    let activeRole: String?
    let memberCount: Int
}

struct NativeHomeSchedules: Codable {
    let today: [NativeScheduleItem]
    let upcoming: [NativeScheduleItem]
    let todayCount: Int
    let upcomingCount: Int
}

struct NativeScheduleItem: Codable, Identifiable {
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
    let spaceId: String
    let createdBy: String
    let participantIds: [String]
}

struct NativeHomeLedger: Codable {
    let month: String
    let incomeTotal: Int
    let expenseTotal: Int
    let net: Int
    let recentEntries: [NativeLedgerItem]
}

struct NativeLedgerItem: Codable, Identifiable {
    let id: String
    let kind: String
    let title: String
    let amount: Int
    let category: String
    let occurredAt: String
    let status: String
    let recurFreq: String
}

struct NativeCreateScheduleRequest: Codable {
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

struct NativeCreateScheduleResponse: Codable {
    let schedule: NativeScheduleItem
}
