import Foundation
import Capacitor
import EventKit

/**
 * NativeCalendarPlugin — iOS 기기 캘린더 연동 브리지.
 *
 * Android NativeCalendarPlugin과 동일한 JS 인터페이스를 제공한다.
 * - 권한 확인/요청
 * - 캘린더 목록 조회
 * - 글리움 일정을 기기 캘린더에 생성
 * - 지정 기간의 기기 캘린더 이벤트 조회
 */
@objc(NativeCalendarPlugin)
public class NativeCalendarPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "NativeCalendarPlugin"
    public let jsName = "NativeCalendar"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "checkPermissions",  returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listCalendars",     returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "createEvent",       returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listEvents",        returnType: CAPPluginReturnPromise),
    ]

    private let eventStore = EKEventStore()

    @objc public override func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(permissionResult())
    }

    @objc public override func requestPermissions(_ call: CAPPluginCall) {
        if calendarPermissionState() == "granted" {
            call.resolve(permissionResult())
            return
        }

        if #available(iOS 17.0, *) {
            eventStore.requestFullAccessToEvents { [weak self] _, _ in
                DispatchQueue.main.async {
                    call.resolve(self?.permissionResult() ?? ["calendar": "unknown"])
                }
            }
        } else {
            eventStore.requestAccess(to: .event) { [weak self] _, _ in
                DispatchQueue.main.async {
                    call.resolve(self?.permissionResult() ?? ["calendar": "unknown"])
                }
            }
        }
    }

    @objc func listCalendars(_ call: CAPPluginCall) {
        guard calendarPermissionState() == "granted" else {
            call.reject("calendar_permission_required")
            return
        }

        let calendars = eventStore.calendars(for: .event)
            .sorted { $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending }
            .map { calendar -> JSObject in
                var object = JSObject()
                object["id"] = calendar.calendarIdentifier
                object["name"] = calendar.title
                object["accountName"] = calendar.source.title
                object["ownerAccount"] = calendar.source.title
                object["color"] = colorInt(calendar.cgColor)
                object["visible"] = true
                object["canWrite"] = calendar.allowsContentModifications
                return object
            }

        call.resolve(["calendars": calendars])
    }

    @objc func createEvent(_ call: CAPPluginCall) {
        guard calendarPermissionState() == "granted" else {
            call.reject("calendar_permission_required")
            return
        }

        guard let calendarId = call.getString("calendarId"),
              let calendar = eventStore.calendar(withIdentifier: calendarId) else {
            call.reject("calendar_id_required")
            return
        }

        guard calendar.allowsContentModifications else {
            call.reject("calendar_read_only")
            return
        }

        guard let title = call.getString("title")?.trimmingCharacters(in: .whitespacesAndNewlines),
              !title.isEmpty else {
            call.reject("title_required")
            return
        }

        guard let startTime = millisValue(call, "startTime") else {
            call.reject("start_time_required")
            return
        }

        let endTime = millisValue(call, "endTime") ?? (startTime + 60 * 60 * 1000)
        let event = EKEvent(eventStore: eventStore)
        event.calendar = calendar
        event.title = title
        event.startDate = Date(timeIntervalSince1970: TimeInterval(startTime) / 1000.0)
        event.endDate = Date(timeIntervalSince1970: TimeInterval(endTime) / 1000.0)
        event.isAllDay = call.getBool("allDay") ?? false
        event.location = call.getString("location")
        event.notes = call.getString("description")
        if let timezone = call.getString("timezone") {
            event.timeZone = TimeZone(identifier: timezone)
        }

        do {
            try eventStore.save(event, span: .thisEvent, commit: true)
            call.resolve(["eventId": event.eventIdentifier ?? event.calendarItemIdentifier])
        } catch {
            call.reject("event_create_failed", error.localizedDescription)
        }
    }

    @objc func listEvents(_ call: CAPPluginCall) {
        guard calendarPermissionState() == "granted" else {
            call.reject("calendar_permission_required")
            return
        }

        guard let startMillis = millisValue(call, "startMillis"),
              let endMillis = millisValue(call, "endMillis") else {
            call.reject("range_required")
            return
        }

        let startDate = Date(timeIntervalSince1970: TimeInterval(startMillis) / 1000.0)
        let endDate = Date(timeIntervalSince1970: TimeInterval(endMillis) / 1000.0)
        let predicate = eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: nil)
        let events = eventStore.events(matching: predicate)
            .sorted { $0.startDate < $1.startDate }
            .map { event -> JSObject in
                var object = JSObject()
                object["eventId"] = event.eventIdentifier ?? event.calendarItemIdentifier
                object["calendarId"] = event.calendar.calendarIdentifier
                object["title"] = event.title ?? "제목 없음"
                object["startTime"] = String(Int64(event.startDate.timeIntervalSince1970 * 1000))
                object["endTime"] = String(Int64(event.endDate.timeIntervalSince1970 * 1000))
                object["allDay"] = event.isAllDay
                object["location"] = event.location ?? ""
                object["description"] = event.notes ?? ""
                return object
            }

        call.resolve(["events": events])
    }

    private func permissionResult() -> JSObject {
        return ["calendar": calendarPermissionState()]
    }

    private func calendarPermissionState() -> String {
        let status = EKEventStore.authorizationStatus(for: .event)
        if #available(iOS 17.0, *) {
            switch status {
            case .fullAccess:
                return "granted"
            case .writeOnly:
                return "granted"
            case .notDetermined:
                return "prompt"
            case .denied, .restricted:
                return "denied"
            @unknown default:
                return "unknown"
            }
        }

        switch status {
        case .authorized:
            return "granted"
        case .fullAccess, .writeOnly:
            return "granted"
        case .notDetermined:
            return "prompt"
        case .denied, .restricted:
            return "denied"
        @unknown default:
            return "unknown"
        }
    }

    private func millisValue(_ call: CAPPluginCall, _ key: String) -> Int64? {
        if let number = call.getDouble(key) {
            return Int64(number)
        }
        if let string = call.getString(key) {
            return Int64(string)
        }
        return nil
    }

    private func colorInt(_ cgColor: CGColor?) -> Int {
        guard let components = cgColor?.components, components.count >= 3 else {
            return 0x0084CC
        }

        let red = Int((components[0] * 255.0).rounded())
        let green = Int((components[1] * 255.0).rounded())
        let blue = Int((components[2] * 255.0).rounded())
        return (red << 16) + (green << 8) + blue
    }
}
