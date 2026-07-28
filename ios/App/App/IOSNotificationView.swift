import SwiftUI

struct IOSNotificationNavigationView: View {
    @ObservedObject var model: IOSAppModel
    @ObservedObject var store: StartupSnapshotStore

    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    IOSNotificationListView(model: model, store: store)
                }
            } else {
                NavigationView {
                    IOSNotificationListView(model: model, store: store)
                }
                .navigationViewStyle(.stack)
            }
        }
    }
}

private struct IOSNotificationListView: View {
    @ObservedObject var model: IOSAppModel
    @ObservedObject var store: StartupSnapshotStore

    @Environment(\.dismiss) private var dismiss
    @Environment(\.sizeCategory) private var sizeCategory

    @State private var filter = IOSNotificationFilter.all
    @State private var isPresentingSettings = false
    @State private var isMarkingAllRead = false
    @State private var errorMessage: String?

    var body: some View {
        List {
            statusSection
            filterSection

            if let error = store.domainErrors[.notifications],
               store.notificationSummary == nil {
                Section {
                    IOSNotificationEmptyState(
                        symbol: "exclamationmark.arrow.triangle.2.circlepath",
                        title: "알림을 불러오지 못했어요",
                        message: error,
                        actionTitle: "다시 시도"
                    ) {
                        Task { await refresh() }
                    }
                }
                .listRowBackground(Color.clear)
            } else if store.state == .loading,
                      store.notificationSummary == nil {
                Section {
                    HStack(spacing: 12) {
                        ProgressView()
                        Text("알림을 불러오는 중이에요")
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 28)
                }
                .listRowBackground(Color.clear)
            } else if visibleNotifications.isEmpty {
                Section {
                    IOSNotificationEmptyState(
                        symbol: filter == .unread ? "checkmark.circle" : "bell",
                        title: filter == .unread ? "모든 알림을 확인했어요" : "아직 도착한 알림이 없어요",
                        message: filter == .unread
                            ? "새로운 알림이 도착하면 이곳에서 바로 확인할 수 있어요."
                            : "일정과 공간 활동이 생기면 이곳에 알려드릴게요.",
                        actionTitle: nil,
                        action: nil
                    )
                }
                .listRowBackground(Color.clear)
            } else {
                notificationSections
            }
        }
        .listStyle(.insetGrouped)
        .dynamicTypeSize(.small ... .accessibility2)
        .navigationTitle("알림")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("닫기") { dismiss() }
            }
            ToolbarItemGroup(placement: .navigationBarTrailing) {
                Button {
                    isPresentingSettings = true
                } label: {
                    Label("알림 설정", systemImage: "gearshape")
                }

                Menu {
                    Button {
                        Task { await markAllRead() }
                    } label: {
                        Label("모두 읽음으로 표시", systemImage: "checkmark.circle")
                    }
                    .disabled((store.notificationSummary?.unreadCount ?? 0) == 0 || isMarkingAllRead)
                } label: {
                    Label("알림 작업", systemImage: "ellipsis.circle")
                }
            }
        }
        .refreshable {
            await refresh()
        }
        .task {
            await store.prefetch()
        }
        .sheet(isPresented: $isPresentingSettings) {
            IOSNotificationSettingsNavigationView(store: store)
        }
        .alert("알림을 처리하지 못했어요", isPresented: errorBinding) {
            Button("확인", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "잠시 후 다시 시도해 주세요.")
        }
    }

    private var statusSection: some View {
        Section {
            HStack(spacing: 12) {
                Image(systemName: unreadCount > 0 ? "bell.badge.fill" : "checkmark.circle.fill")
                    .foregroundStyle(
                        unreadCount > 0
                            ? Color(uiColor: GleaumUIColor.brandTeal)
                            : Color.green
                    )
                    .frame(width: 28)
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 3) {
                    Text(unreadCount > 0 ? "읽지 않은 알림 \(unreadCount)개" : "모든 알림을 확인했어요")
                        .font(.headline)
                    Text("최근 50개의 서비스 알림을 보여드려요.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.vertical, 4)
            .accessibilityElement(children: .combine)
        }
    }

    private var filterSection: some View {
        Section {
            if sizeCategory.isAccessibilityCategory {
                Picker("알림 필터", selection: $filter) {
                    ForEach(IOSNotificationFilter.allCases) { option in
                        Text(option.title).tag(option)
                    }
                }
                .pickerStyle(.menu)
            } else {
                Picker("알림 필터", selection: $filter) {
                    ForEach(IOSNotificationFilter.allCases) { option in
                        Text(option.title).tag(option)
                    }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .accessibilityLabel("알림 필터")
            }
        }
    }

    @ViewBuilder
    private var notificationSections: some View {
        let unread = visibleNotifications.filter { !$0.read }
        let read = visibleNotifications.filter(\.read)

        if !unread.isEmpty {
            Section("새 알림") {
                ForEach(unread) { item in
                    notificationRow(item)
                }
            }
        }

        if !read.isEmpty {
            Section("이전 알림") {
                ForEach(read) { item in
                    notificationRow(item)
                }
            }
        }
    }

    @ViewBuilder
    private func notificationRow(_ item: NativeNotificationItem) -> some View {
        if let scheduleID = item.scheduleId {
            NavigationLink {
                IOSNotificationScheduleDestination(store: store, scheduleID: scheduleID)
            } label: {
                IOSNotificationRow(item: item)
            }
            .simultaneousGesture(TapGesture().onEnded {
                Task { await markRead(item) }
            })
            .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                if !item.read {
                    Button {
                        Task { await markRead(item) }
                    } label: {
                        Label("읽음", systemImage: "checkmark")
                    }
                    .tint(Color(uiColor: GleaumUIColor.brandBlue))
                }
            }
        } else {
            Button {
                Task {
                    await markRead(item)
                    if item.type == "invite" {
                        dismiss()
                        model.selectedTab = .space
                    }
                }
            } label: {
                IOSNotificationRow(item: item)
            }
            .buttonStyle(.plain)
            .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                if !item.read {
                    Button {
                        Task { await markRead(item) }
                    } label: {
                        Label("읽음", systemImage: "checkmark")
                    }
                    .tint(Color(uiColor: GleaumUIColor.brandBlue))
                }
            }
        }
    }

    private var unreadCount: Int {
        store.notificationSummary?.unreadCount ?? 0
    }

    private var visibleNotifications: [NativeNotificationItem] {
        let items = store.notificationSummary?.notifications ?? []
        return filter == .unread ? items.filter { !$0.read } : items
    }

    private var errorBinding: Binding<Bool> {
        Binding(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )
    }

    private func refresh() async {
        await store.refresh(domains: [.notifications])
    }

    private func markRead(_ item: NativeNotificationItem) async {
        guard !item.read else { return }
        store.markNotificationReadLocally(id: item.id)
        do {
            try await NativeAPIClient.shared.markNotificationRead(id: item.id)
        } catch {
            errorMessage = error.localizedDescription
            await refresh()
        }
    }

    private func markAllRead() async {
        guard unreadCount > 0, !isMarkingAllRead else { return }
        isMarkingAllRead = true
        store.markAllNotificationsReadLocally()
        defer { isMarkingAllRead = false }
        do {
            try await NativeAPIClient.shared.markAllNotificationsRead()
        } catch {
            errorMessage = error.localizedDescription
            await refresh()
        }
    }
}

private struct IOSNotificationScheduleDestination: View {
    @ObservedObject var store: StartupSnapshotStore
    let scheduleID: String

    @State private var schedule: NativeScheduleItem?
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if let schedule {
                IOSScheduleDetailView(store: store, initialSchedule: schedule)
            } else if let errorMessage {
                IOSNotificationEmptyState(
                    symbol: "calendar.badge.exclamationmark",
                    title: "일정을 열지 못했어요",
                    message: errorMessage,
                    actionTitle: "다시 시도"
                ) {
                    Task { await load() }
                }
                .padding(24)
            } else {
                ProgressView("일정을 불러오는 중이에요")
            }
        }
        .task(id: scheduleID) {
            await load()
        }
    }

    private func load() async {
        if let cached = store.schedules.first(where: { $0.id == scheduleID }) {
            schedule = cached
            errorMessage = nil
            return
        }

        do {
            schedule = try await NativeAPIClient.shared.fetchSchedule(id: scheduleID)
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct IOSNotificationRow: View {
    let item: NativeNotificationItem
    @Environment(\.sizeCategory) private var sizeCategory

    var body: some View {
        Group {
            if sizeCategory.isAccessibilityCategory {
                accessibilityLayout
            } else {
                compactLayout
            }
        }
        .padding(.vertical, 5)
        .contentShape(Rectangle())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(IOSNotificationFormat.accessibilityLabel(item))
        .accessibilityHint(item.scheduleId != nil ? "두 번 탭하여 관련 일정을 엽니다." : "")
    }

    private var compactLayout: some View {
        HStack(alignment: .top, spacing: 12) {
            icon
            VStack(alignment: .leading, spacing: 5) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(item.title.isEmpty ? "알림" : item.title)
                        .font(.body.weight(item.read ? .regular : .semibold))
                        .foregroundStyle(.primary)
                        .lineLimit(2)
                    Spacer(minLength: 4)
                    Text(IOSNotificationFormat.relativeDate(item.createdAt))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                Text(item.body)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(3)
            }
            if !item.read {
                Circle()
                    .fill(Color(uiColor: GleaumUIColor.brandTeal))
                    .frame(width: 8, height: 8)
                    .padding(.top, 7)
                    .accessibilityHidden(true)
            }
        }
    }

    private var accessibilityLayout: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                icon
                Text(item.title.isEmpty ? "알림" : item.title)
                    .font(.body.weight(item.read ? .regular : .semibold))
                    .foregroundStyle(.primary)
                Spacer(minLength: 0)
                if !item.read {
                    Circle()
                        .fill(Color(uiColor: GleaumUIColor.brandTeal))
                        .frame(width: 10, height: 10)
                        .accessibilityHidden(true)
                }
            }
            Text(item.body)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text(IOSNotificationFormat.relativeDate(item.createdAt))
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    private var icon: some View {
        let style = IOSNotificationFormat.style(for: item.type)
        return Image(systemName: style.symbol)
            .font(.body.weight(.semibold))
            .foregroundStyle(style.color)
            .frame(width: 36, height: 36)
            .background(style.color.opacity(0.12))
            .clipShape(Circle())
            .accessibilityHidden(true)
    }
}

struct IOSNotificationSettingsNavigationView: View {
    @ObservedObject var store: StartupSnapshotStore

    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    IOSNotificationSettingsView(store: store)
                }
            } else {
                NavigationView {
                    IOSNotificationSettingsView(store: store)
                }
                .navigationViewStyle(.stack)
            }
        }
    }
}

private struct IOSNotificationSettingsView: View {
    @ObservedObject var store: StartupSnapshotStore
    @ObservedObject private var permissionManager = IOSNotificationPermissionManager.shared

    @Environment(\.dismiss) private var dismiss

    @State private var settings = NativeNotificationSettings(
        scheduleReminders: true,
        routineReminders: true,
        expenseReminders: true,
        spaceUpdates: true
    )
    @State private var initialSettings: NativeNotificationSettings?
    @State private var isLoading = true
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        Form {
            systemPermissionSection

            Section {
                Toggle("일정 리마인더", isOn: settingBinding(\.scheduleReminders))
                Toggle("루틴 알림", isOn: settingBinding(\.routineReminders))
                if store.accountContext?.capabilities.canViewHouseholdBudget == true {
                    Toggle("가계부 결제 알림", isOn: settingBinding(\.expenseReminders))
                }
                Toggle("공간 활동 알림", isOn: settingBinding(\.spaceUpdates))
            } header: {
                Text("받을 알림")
            } footer: {
                Text("서비스 설정과 iPhone의 알림 허용이 모두 켜져 있어야 푸시 알림을 받을 수 있습니다.")
            }

            if let errorMessage {
                Section {
                    Label(errorMessage, systemImage: "exclamationmark.circle")
                        .foregroundStyle(.red)
                }
            }
        }
        .dynamicTypeSize(.small ... .accessibility2)
        .navigationTitle("알림 설정")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("취소") { dismiss() }
                    .disabled(isSaving)
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("저장") {
                    Task { await save() }
                }
                .disabled(isLoading || isSaving || settings == initialSettings)
            }
        }
        .overlay {
            if isLoading || isSaving {
                ProgressView()
                    .padding(16)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            }
        }
        .task {
            await load()
        }
    }

    private var systemPermissionSection: some View {
        Section {
            HStack(spacing: 12) {
                Image(systemName: permissionManager.authorizationState.symbol)
                    .foregroundStyle(
                        permissionManager.authorizationState.canReceiveNotifications
                            ? Color.green
                            : Color.secondary
                    )
                    .frame(width: 24)
                Text("iPhone 알림")
                Spacer()
                Text(permissionManager.authorizationState.title)
                    .foregroundStyle(.secondary)
            }

            if permissionManager.authorizationState == .notDetermined {
                Button("iPhone 알림 허용") {
                    Task { await permissionManager.requestAuthorization() }
                }
            } else if permissionManager.authorizationState == .denied {
                Button("iPhone 설정 열기") {
                    permissionManager.openSystemSettings()
                }
            }
        } header: {
            Text("시스템 권한")
        } footer: {
            if let permissionError = permissionManager.errorMessage {
                Text(permissionError)
            }
        }
    }

    private func settingBinding(_ keyPath: KeyPath<NativeNotificationSettings, Bool>) -> Binding<Bool> {
        Binding(
            get: { settings[keyPath: keyPath] },
            set: { value in
                settings = NativeNotificationSettings(
                    scheduleReminders: keyPath == \.scheduleReminders ? value : settings.scheduleReminders,
                    routineReminders: keyPath == \.routineReminders ? value : settings.routineReminders,
                    expenseReminders: keyPath == \.expenseReminders ? value : settings.expenseReminders,
                    spaceUpdates: keyPath == \.spaceUpdates ? value : settings.spaceUpdates
                )
            }
        )
    }

    private func load() async {
#if DEBUG
        if CommandLine.arguments.contains("-GLEAUMPreviewNotifications") {
            initialSettings = settings
            isLoading = false
            await permissionManager.refreshAuthorizationState()
            return
        }
#endif
        isLoading = true
        defer { isLoading = false }
        do {
            let profile = try await NativeAPIClient.shared.fetchProfile()
            settings = profile.notificationSettings
            initialSettings = profile.notificationSettings
            await permissionManager.refreshAuthorizationState()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func save() async {
        guard settings != initialSettings else { return }
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }
        do {
            let profile = try await NativeAPIClient.shared.updateNotificationSettings(settings)
            settings = profile.notificationSettings
            initialSettings = profile.notificationSettings
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private enum IOSNotificationFilter: String, CaseIterable, Identifiable {
    case all
    case unread

    var id: String { rawValue }
    var title: String { self == .all ? "전체" : "읽지 않음" }
}

private struct IOSNotificationStyle {
    let symbol: String
    let color: Color
}

private enum IOSNotificationFormat {
    static func style(for type: String) -> IOSNotificationStyle {
        switch type {
        case "reminder":
            return IOSNotificationStyle(symbol: "alarm", color: .orange)
        case "completion":
            return IOSNotificationStyle(symbol: "checkmark.circle", color: .green)
        case "invite":
            return IOSNotificationStyle(
                symbol: "person.crop.circle.badge.plus",
                color: Color(uiColor: GleaumUIColor.brandTeal)
            )
        case "re_notify":
            return IOSNotificationStyle(
                symbol: "bell.badge",
                color: Color(uiColor: GleaumUIColor.brandBlue)
            )
        default:
            return IOSNotificationStyle(symbol: "bell", color: .secondary)
        }
    }

    static func relativeDate(_ raw: String) -> String {
        guard let date = ISO8601DateFormatter.gleaum.date(from: raw)
                ?? ISO8601DateFormatter.gleaumNotificationWithoutFractionalSeconds.date(from: raw) else {
            return "최근"
        }
        return relativeFormatter.localizedString(for: date, relativeTo: Date())
    }

    static func accessibilityLabel(_ item: NativeNotificationItem) -> String {
        let state = item.read ? "읽은 알림" : "읽지 않은 알림"
        return "\(state), \(item.title), \(item.body), \(relativeDate(item.createdAt))"
    }

    private static let relativeFormatter: RelativeDateTimeFormatter = {
        let formatter = RelativeDateTimeFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.unitsStyle = .full
        return formatter
    }()
}

private extension ISO8601DateFormatter {
    static let gleaumNotificationWithoutFractionalSeconds: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()
}

private struct IOSNotificationEmptyState: View {
    let symbol: String
    let title: String
    let message: String
    let actionTitle: String?
    let action: (() -> Void)?

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.system(size: 34))
                .foregroundStyle(.secondary)
                .accessibilityHidden(true)
            Text(title)
                .font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .buttonStyle(.bordered)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 28)
        .accessibilityElement(children: .contain)
    }
}
