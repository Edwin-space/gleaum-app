import EventKit
import Foundation
import UIKit

private let gleaumCalendarMarker = "gleaum:schedule:"

enum IOSCalendarPermissionState: Equatable {
    case prompt
    case fullAccess
    case writeOnly
    case denied
    case restricted
    case unknown

    var title: String {
        switch self {
        case .prompt: return "연결 필요"
        case .fullAccess: return "전체 접근 허용됨"
        case .writeOnly: return "추가 전용 접근"
        case .denied: return "접근 거부됨"
        case .restricted: return "기기에서 제한됨"
        case .unknown: return "상태 확인 중"
        }
    }

    var canSynchronize: Bool { self == .fullAccess }
}

struct IOSDeviceCalendarDescriptor: Identifiable, Hashable {
    let id: String
    let name: String
    let accountName: String
    let colorValue: Int
    let canWrite: Bool
}

struct IOSDeviceCalendarEvent: Identifiable, Hashable {
    let eventIdentifier: String
    let occurrenceStart: Date
    let calendarId: String
    let title: String
    let startDate: Date
    let endDate: Date
    let allDay: Bool
    let location: String
    let notes: String

    var id: String {
        "\(eventIdentifier):\(Int(occurrenceStart.timeIntervalSince1970))"
    }
}

struct IOSCalendarImportCandidate: Identifiable, Hashable {
    let event: IOSDeviceCalendarEvent
    let isDuplicate: Bool

    var id: String { event.id }
}

struct IOSCalendarSyncResult: Equatable {
    let created: Int
    let updated: Int
    let deleted: Int

    var summary: String {
        "\(created)개 추가 · \(updated)개 업데이트 · \(deleted)개 정리"
    }
}

struct IOSCalendarImportResult: Equatable {
    let imported: Int
    let skippedDuplicates: Int
    let failed: Int

    var summary: String {
        var parts = ["\(imported)개 가져옴", "중복 \(skippedDuplicates)개 제외"]
        if failed > 0 { parts.append("\(failed)개 실패") }
        return parts.joined(separator: " · ")
    }
}

@MainActor
final class IOSDeviceCalendarStore: ObservableObject {
    static let shared = IOSDeviceCalendarStore()

    @Published private(set) var permission: IOSCalendarPermissionState = .unknown
    @Published private(set) var calendars: [IOSDeviceCalendarDescriptor] = []
    @Published var selectedCalendarId: String? {
        didSet {
            if let selectedCalendarId {
                UserDefaults.standard.set(selectedCalendarId, forKey: Self.selectedCalendarKey)
            } else {
                UserDefaults.standard.removeObject(forKey: Self.selectedCalendarKey)
            }
        }
    }
    @Published private(set) var isLoading = false
    @Published private(set) var isSynchronizing = false
    @Published private(set) var lastSyncResult: IOSCalendarSyncResult?
    @Published private(set) var errorMessage: String?

    private static let selectedCalendarKey = "gleaum:calendar-sync-calendar-id"
    private static let enabledKey = "gleaum:calendar-sync-enabled"
    private let eventStore = EKEventStore()

    private init() {
        selectedCalendarId = UserDefaults.standard.string(forKey: Self.selectedCalendarKey)
    }

    var selectedCalendar: IOSDeviceCalendarDescriptor? {
        calendars.first { $0.id == selectedCalendarId }
    }

    var isEnabled: Bool {
        UserDefaults.standard.bool(forKey: Self.enabledKey)
    }

    func load() {
#if DEBUG
        if CommandLine.arguments.contains("-GLEAUMPreviewCalendar") {
            loadPreview()
            return
        }
#endif
        permission = Self.currentPermission()
        guard permission.canSynchronize else {
            calendars = []
            return
        }
        reloadCalendars()
    }

    func requestFullAccess() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        let granted: Bool
        if #available(iOS 17.0, *) {
            granted = await withCheckedContinuation { continuation in
                eventStore.requestFullAccessToEvents { allowed, _ in
                    continuation.resume(returning: allowed)
                }
            }
        } else {
            granted = await withCheckedContinuation { continuation in
                eventStore.requestAccess(to: .event) { allowed, _ in
                    continuation.resume(returning: allowed)
                }
            }
        }

        permission = Self.currentPermission()
        if granted, permission.canSynchronize {
            UserDefaults.standard.set(true, forKey: Self.enabledKey)
            reloadCalendars()
        } else if permission == .denied {
            errorMessage = "설정 앱에서 캘린더 전체 접근을 허용해 주세요."
        } else if permission == .writeOnly {
            errorMessage = "가져오기와 중복 확인을 위해 전체 접근이 필요합니다."
        } else {
            errorMessage = "캘린더 접근을 허용하지 못했습니다."
        }
    }

    func openSystemSettings() {
        guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
        UIApplication.shared.open(url)
    }

    func synchronize(schedules: [NativeScheduleItem]) async {
        guard permission.canSynchronize else {
            errorMessage = "기기 캘린더 전체 접근을 먼저 허용해 주세요."
            return
        }
        guard let calendar = selectedEventCalendar(), calendar.allowsContentModifications else {
            errorMessage = "일정을 저장할 수 있는 캘린더를 선택해 주세요."
            return
        }

        isSynchronizing = true
        errorMessage = nil
        lastSyncResult = nil
        defer { isSynchronizing = false }

        let now = Date()
        let rangeStart = Calendar.current.date(byAdding: .day, value: -1, to: now) ?? now
        let rangeEnd = Calendar.current.date(byAdding: .day, value: 30, to: now) ?? now
        let exportable = schedules
            .filter { $0.type != "expense" }
            .filter { schedule in
                guard let start = Self.scheduleDate(schedule.startTime) else { return false }
                return start >= rangeStart && start <= rangeEnd
            }
            .sorted { $0.startTime < $1.startTime }

        let existing = deviceEvents(
            calendar: calendar,
            start: rangeStart,
            end: rangeEnd,
            includesGleaumEvents: true
        )
        var eventByScheduleId: [String: EKEvent] = [:]
        for event in existing {
            guard let scheduleId = Self.markerScheduleId(in: event.notes) else { continue }
            eventByScheduleId[scheduleId] = event
        }

        var created = 0
        var updated = 0
        var deleted = 0
        let activeIds = Set(exportable.map(\.id))

        do {
            for schedule in exportable {
                let event = eventByScheduleId[schedule.id] ?? EKEvent(eventStore: eventStore)
                let isNew = event.eventIdentifier == nil
                apply(schedule: schedule, to: event, calendar: calendar)
                try eventStore.save(event, span: .thisEvent, commit: false)
                if isNew { created += 1 } else { updated += 1 }
            }

            for (scheduleId, event) in eventByScheduleId where !activeIds.contains(scheduleId) {
                try eventStore.remove(event, span: .thisEvent, commit: false)
                deleted += 1
            }

            try eventStore.commit()
            let result = IOSCalendarSyncResult(created: created, updated: updated, deleted: deleted)
            lastSyncResult = result
            UserDefaults.standard.set(true, forKey: Self.enabledKey)
        } catch {
            eventStore.reset()
            errorMessage = "기기 캘린더 동기화에 실패했습니다. 잠시 후 다시 시도해 주세요."
        }
    }

    func importCandidates(schedules: [NativeScheduleItem]) async -> [IOSCalendarImportCandidate] {
#if DEBUG
        if CommandLine.arguments.contains("-GLEAUMPreviewCalendar") {
            return previewImportCandidates(schedules: schedules)
        }
#endif
        guard permission.canSynchronize else {
            errorMessage = "기기 캘린더 전체 접근을 먼저 허용해 주세요."
            return []
        }
        guard let calendar = selectedEventCalendar() else {
            errorMessage = "가져올 기기 캘린더를 선택해 주세요."
            return []
        }

        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        let now = Date()
        let rangeStart = Calendar.current.date(byAdding: .day, value: -1, to: now) ?? now
        let rangeEnd = Calendar.current.date(byAdding: .day, value: 30, to: now) ?? now
        let personalSchedules = schedules.filter {
            $0.type == "personal" && ($0.visibility == nil || $0.visibility == "private")
        }

        return deviceEvents(
            calendar: calendar,
            start: rangeStart,
            end: rangeEnd,
            includesGleaumEvents: false
        )
        .compactMap(Self.deviceEvent(from:))
        .map { event in
            IOSCalendarImportCandidate(
                event: event,
                isDuplicate: Self.isDuplicate(event: event, schedules: personalSchedules)
            )
        }
    }

    func importSelected(
        _ candidates: [IOSCalendarImportCandidate],
        snapshotStore: StartupSnapshotStore
    ) async -> IOSCalendarImportResult {
        let selected = candidates.filter { !$0.isDuplicate }
        guard !selected.isEmpty else {
            return IOSCalendarImportResult(imported: 0, skippedDuplicates: candidates.count, failed: 0)
        }

        isSynchronizing = true
        errorMessage = nil
        defer { isSynchronizing = false }

        var imported = 0
        var skipped = candidates.filter(\.isDuplicate).count
        var failed = 0

        for candidate in selected {
            let currentPersonalSchedules = snapshotStore.schedules.filter {
                $0.type == "personal" && ($0.visibility == nil || $0.visibility == "private")
            }
            if Self.isDuplicate(event: candidate.event, schedules: currentPersonalSchedules) {
                skipped += 1
                continue
            }

            let event = candidate.event
            do {
                let created = try await NativeAPIClient.shared.createSchedule(
                    NativeCreateScheduleRequest(
                        title: event.title,
                        type: "personal",
                        spaceId: nil,
                        startTime: ISO8601DateFormatter.gleaum.string(from: event.startDate),
                        endTime: ISO8601DateFormatter.gleaum.string(from: event.endDate),
                        allDay: event.allDay,
                        reminder: 0,
                        repeat: "none",
                        memo: Self.importMemo(for: event),
                        visibility: "private"
                    )
                )
                snapshotStore.upsertSchedule(created)
                imported += 1
            } catch {
                failed += 1
            }
        }

        if imported > 0 {
            await snapshotStore.refresh(domains: [.home, .schedules])
        }
        if failed > 0 {
            errorMessage = "일부 일정은 가져오지 못했습니다. 결과를 확인해 주세요."
        }
        return IOSCalendarImportResult(imported: imported, skippedDuplicates: skipped, failed: failed)
    }

    func clearMessage() {
        errorMessage = nil
    }

#if DEBUG
    private func loadPreview() {
        permission = .fullAccess
        calendars = [
            IOSDeviceCalendarDescriptor(
                id: "preview-icloud",
                name: "개인",
                accountName: "iCloud",
                colorValue: 0x0084CC,
                canWrite: true
            ),
            IOSDeviceCalendarDescriptor(
                id: "preview-family",
                name: "가족",
                accountName: "iCloud",
                colorValue: 0x0CC9B5,
                canWrite: true
            ),
        ]
        selectedCalendarId = selectedCalendarId ?? calendars.first?.id
    }

    private func previewImportCandidates(
        schedules: [NativeScheduleItem]
    ) -> [IOSCalendarImportCandidate] {
        let calendar = Calendar.current
        let firstStart = calendar.date(byAdding: .day, value: 1, to: Date()) ?? Date()
        let secondStart = calendar.date(byAdding: .day, value: 2, to: Date()) ?? Date()
        let thirdStart = calendar.date(byAdding: .day, value: 4, to: Date()) ?? Date()
        let events = [
            IOSDeviceCalendarEvent(
                eventIdentifier: "preview-event-1",
                occurrenceStart: firstStart,
                calendarId: "preview-icloud",
                title: "치과 정기 검진",
                startDate: firstStart,
                endDate: calendar.date(byAdding: .hour, value: 1, to: firstStart) ?? firstStart,
                allDay: false,
                location: "서울 메디컬센터",
                notes: "검진 예약"
            ),
            IOSDeviceCalendarEvent(
                eventIdentifier: "preview-event-2",
                occurrenceStart: secondStart,
                calendarId: "preview-icloud",
                title: "친구 생일",
                startDate: secondStart,
                endDate: calendar.date(byAdding: .day, value: 1, to: secondStart) ?? secondStart,
                allDay: true,
                location: "",
                notes: ""
            ),
            IOSDeviceCalendarEvent(
                eventIdentifier: "preview-event-3",
                occurrenceStart: thirdStart,
                calendarId: "preview-icloud",
                title: schedules.first?.title ?? "주간 계획 정리",
                startDate: thirdStart,
                endDate: calendar.date(byAdding: .hour, value: 1, to: thirdStart) ?? thirdStart,
                allDay: false,
                location: "",
                notes: ""
            ),
        ]
        return events.enumerated().map { index, event in
            IOSCalendarImportCandidate(event: event, isDuplicate: index == 2)
        }
    }
#endif

    private func reloadCalendars() {
        calendars = eventStore.calendars(for: .event)
            .map {
                IOSDeviceCalendarDescriptor(
                    id: $0.calendarIdentifier,
                    name: $0.title,
                    accountName: $0.source.title,
                    colorValue: Self.colorValue($0.cgColor),
                    canWrite: $0.allowsContentModifications
                )
            }
            .sorted {
                if $0.accountName == $1.accountName {
                    return $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending
                }
                return $0.accountName.localizedCaseInsensitiveCompare($1.accountName) == .orderedAscending
            }

        let writable = calendars.filter(\.canWrite)
        if let selectedCalendarId,
           writable.contains(where: { $0.id == selectedCalendarId }) {
            return
        }
        selectedCalendarId = writable.first?.id
    }

    private func selectedEventCalendar() -> EKCalendar? {
        guard let selectedCalendarId else { return nil }
        return eventStore.calendar(withIdentifier: selectedCalendarId)
    }

    private func deviceEvents(
        calendar: EKCalendar,
        start: Date,
        end: Date,
        includesGleaumEvents: Bool
    ) -> [EKEvent] {
        let predicate = eventStore.predicateForEvents(withStart: start, end: end, calendars: [calendar])
        return eventStore.events(matching: predicate)
            .filter { event in
                let isGleaum = event.notes?.contains(gleaumCalendarMarker) == true
                return includesGleaumEvents ? isGleaum : !isGleaum
            }
            .sorted { $0.startDate < $1.startDate }
    }

    private func apply(schedule: NativeScheduleItem, to event: EKEvent, calendar: EKCalendar) {
        let start = Self.scheduleDate(schedule.startTime) ?? Date()
        let fallbackEnd = Calendar.current.date(byAdding: .hour, value: 1, to: start) ?? start
        let end = schedule.endTime.flatMap(Self.scheduleDate) ?? fallbackEnd

        event.calendar = calendar
        event.title = schedule.title
        event.isAllDay = schedule.allDay
        event.startDate = schedule.allDay ? Calendar.current.startOfDay(for: start) : start
        if schedule.allDay {
            let startDay = Calendar.current.startOfDay(for: start)
            let parsedEndDay = Calendar.current.startOfDay(for: end)
            event.endDate = parsedEndDay > startDay
                ? parsedEndDay
                : Calendar.current.date(byAdding: .day, value: 1, to: startDay) ?? fallbackEnd
        } else {
            event.endDate = end > start ? end : fallbackEnd
        }
        event.timeZone = .current
        event.location = schedule.locationAddress
        event.notes = Self.exportNotes(for: schedule)
    }

    private static func exportNotes(for schedule: NativeScheduleItem) -> String {
        [
            schedule.memo?.trimmingCharacters(in: .whitespacesAndNewlines),
            "글리움에서 내보낸 일정입니다.",
            "\(gleaumCalendarMarker)\(schedule.id)",
        ]
        .compactMap { value in
            guard let value, !value.isEmpty else { return nil }
            return value
        }
        .joined(separator: "\n\n")
    }

    private static func importMemo(for event: IOSDeviceCalendarEvent) -> String {
        var lines: [String] = []
        let notes = event.notes.trimmingCharacters(in: .whitespacesAndNewlines)
        let location = event.location.trimmingCharacters(in: .whitespacesAndNewlines)
        if !notes.isEmpty { lines.append(notes) }
        if !location.isEmpty { lines.append("장소: \(location)") }
        lines.append("iPhone 캘린더에서 가져온 일정")
        return lines.joined(separator: "\n")
    }

    private static func deviceEvent(from event: EKEvent) -> IOSDeviceCalendarEvent? {
        let title = event.title?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !title.isEmpty,
              let startDate = event.startDate,
              let endDate = event.endDate else {
            return nil
        }
        return IOSDeviceCalendarEvent(
            eventIdentifier: event.eventIdentifier ?? event.calendarItemIdentifier,
            occurrenceStart: startDate,
            calendarId: event.calendar.calendarIdentifier,
            title: title,
            startDate: startDate,
            endDate: endDate,
            allDay: event.isAllDay,
            location: event.location ?? "",
            notes: event.notes ?? ""
        )
    }

    private static func isDuplicate(
        event: IOSDeviceCalendarEvent,
        schedules: [NativeScheduleItem]
    ) -> Bool {
        let normalizedTitle = event.title.folding(
            options: [.caseInsensitive, .diacriticInsensitive, .widthInsensitive],
            locale: Locale(identifier: "ko_KR")
        )
        return schedules.contains { schedule in
            guard let start = scheduleDate(schedule.startTime) else { return false }
            let scheduleTitle = schedule.title.folding(
                options: [.caseInsensitive, .diacriticInsensitive, .widthInsensitive],
                locale: Locale(identifier: "ko_KR")
            )
            return scheduleTitle == normalizedTitle
                && abs(start.timeIntervalSince(event.startDate)) < 60
        }
    }

    private static func markerScheduleId(in notes: String?) -> String? {
        guard let notes,
              let range = notes.range(of: gleaumCalendarMarker) else {
            return nil
        }
        return notes[range.upperBound...]
            .split(whereSeparator: { $0.isWhitespace })
            .first
            .map(String.init)
    }

    private static func scheduleDate(_ value: String) -> Date? {
        ISO8601DateFormatter.gleaum.date(from: value)
            ?? ISO8601DateFormatter.gleaumWithoutFractionalSeconds.date(from: value)
    }

    private static func colorValue(_ color: CGColor?) -> Int {
        guard let color,
              let converted = UIColor(cgColor: color).cgColor.converted(
                to: CGColorSpaceCreateDeviceRGB(),
                intent: .defaultIntent,
                options: nil
              ),
              let components = converted.components,
              components.count >= 3 else {
            return 0x0084CC
        }
        let red = Int((components[0] * 255).rounded())
        let green = Int((components[1] * 255).rounded())
        let blue = Int((components[2] * 255).rounded())
        return (red << 16) | (green << 8) | blue
    }

    private static func currentPermission() -> IOSCalendarPermissionState {
        let status = EKEventStore.authorizationStatus(for: .event)
        if #available(iOS 17.0, *) {
            switch status {
            case .fullAccess: return .fullAccess
            case .writeOnly: return .writeOnly
            case .notDetermined: return .prompt
            case .denied: return .denied
            case .restricted: return .restricted
            @unknown default: return .unknown
            }
        }

        switch status {
        case .authorized: return .fullAccess
        case .notDetermined: return .prompt
        case .denied: return .denied
        case .restricted: return .restricted
        case .fullAccess: return .fullAccess
        case .writeOnly: return .writeOnly
        @unknown default: return .unknown
        }
    }
}

private extension ISO8601DateFormatter {
    static let gleaumWithoutFractionalSeconds: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()
}
