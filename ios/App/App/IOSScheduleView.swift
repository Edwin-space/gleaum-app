import SwiftUI

struct IOSScheduleNavigationView: View {
    @ObservedObject var store: StartupSnapshotStore
    @Environment(\.sizeCategory) private var sizeCategory

    @State private var searchText = ""
    @State private var selectedType = IOSScheduleTypeFilter.all
    @State private var selectedPeriod = IOSSchedulePeriod.upcoming
    @State private var isPresentingCreate = false

    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    scheduleList
                }
            } else {
                NavigationView {
                    scheduleList
                }
                .navigationViewStyle(.stack)
            }
        }
        .sheet(isPresented: $isPresentingCreate) {
            IOSScheduleEditorNavigationView(store: store, schedule: nil)
        }
    }

    private var scheduleList: some View {
        List {
            Section {
                if sizeCategory.isAccessibilityCategory {
                    Picker("일정 구분", selection: $selectedType) {
                        ForEach(IOSScheduleTypeFilter.allCases) { filter in
                            Text(filter.title).tag(filter)
                        }
                    }
                    .pickerStyle(.menu)
                } else {
                    Picker("일정 구분", selection: $selectedType) {
                        ForEach(IOSScheduleTypeFilter.allCases) { filter in
                            Text(filter.title).tag(filter)
                        }
                    }
                    .pickerStyle(.segmented)
                    .labelsHidden()
                    .accessibilityLabel("일정 구분")
                }
            }

            if let error = store.domainErrors[.schedules], store.schedules.isEmpty {
                Section {
                    IOSScheduleMessageView(
                        symbol: "exclamationmark.arrow.triangle.2.circlepath",
                        title: "일정을 불러오지 못했어요",
                        message: error,
                        actionTitle: "다시 시도"
                    ) {
                        Task { await refreshSchedules() }
                    }
                }
                .listRowBackground(Color.clear)
            } else if store.state == .loading, store.schedules.isEmpty {
                Section {
                    HStack(spacing: 12) {
                        ProgressView()
                        Text("일정을 불러오는 중이에요")
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 28)
                }
                .listRowBackground(Color.clear)
            } else if groupedSchedules.isEmpty {
                Section {
                    IOSScheduleMessageView(
                        symbol: emptySymbol,
                        title: emptyTitle,
                        message: emptyMessage,
                        actionTitle: "새 일정 추가"
                    ) {
                        isPresentingCreate = true
                    }
                }
                .listRowBackground(Color.clear)
            } else {
                ForEach(groupedSchedules) { group in
                    Section(header: Text(group.title)) {
                        ForEach(group.items) { schedule in
                            NavigationLink {
                                IOSScheduleDetailView(store: store, initialSchedule: schedule)
                            } label: {
                                IOSScheduleRow(schedule: schedule)
                            }
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("일정")
        .searchable(text: $searchText, prompt: "제목 또는 메모 검색")
        .toolbar {
            ToolbarItemGroup(placement: .navigationBarTrailing) {
                Menu {
                    Picker("조회 기간", selection: $selectedPeriod) {
                        ForEach(IOSSchedulePeriod.allCases) { period in
                            Label(period.title, systemImage: period.symbol).tag(period)
                        }
                    }
                } label: {
                    Label("조회 기간", systemImage: "line.3.horizontal.decrease.circle")
                }

                Button {
                    isPresentingCreate = true
                } label: {
                    Label("새 일정", systemImage: "plus")
                }
            }
        }
        .refreshable {
            await refreshSchedules()
        }
        .task {
            await store.prefetch()
        }
    }

    private var filteredSchedules: [NativeScheduleItem] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let monthInterval = calendar.dateInterval(of: .month, for: Date())
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

        return store.schedules.filter { schedule in
            guard let date = schedule.startDate else { return false }
            let typeMatches = selectedType == .all || schedule.type == selectedType.rawValue
            let periodMatches: Bool
            switch selectedPeriod {
            case .upcoming:
                periodMatches = date >= today
            case .thisMonth:
                periodMatches = monthInterval?.contains(date) == true
            case .all:
                periodMatches = true
            }
            let searchMatches = query.isEmpty
                || schedule.title.lowercased().contains(query)
                || (schedule.memo?.lowercased().contains(query) == true)
            return typeMatches && periodMatches && searchMatches
        }
        .sorted { $0.startTime < $1.startTime }
    }

    private var groupedSchedules: [IOSScheduleDayGroup] {
        let grouped = Dictionary(grouping: filteredSchedules) { schedule in
            Calendar.current.startOfDay(for: schedule.startDate ?? .distantPast)
        }
        return grouped.keys.sorted().map { day in
            IOSScheduleDayGroup(
                day: day,
                title: IOSScheduleFormat.dayTitle(day),
                items: grouped[day, default: []]
            )
        }
    }

    private var emptySymbol: String {
        searchText.isEmpty ? "calendar" : "magnifyingglass"
    }

    private var emptyTitle: String {
        searchText.isEmpty ? "표시할 일정이 없어요" : "검색 결과가 없어요"
    }

    private var emptyMessage: String {
        searchText.isEmpty
            ? "필요한 약속과 할 일을 일정에 기록해 보세요."
            : "다른 검색어 또는 일정 구분을 확인해 주세요."
    }

    private func refreshSchedules() async {
        await store.refresh(domains: [.schedules, .home])
    }
}

private struct IOSScheduleDayGroup: Identifiable {
    let day: Date
    let title: String
    let items: [NativeScheduleItem]

    var id: Date { day }
}

private struct IOSScheduleRow: View {
    let schedule: NativeScheduleItem
    @Environment(\.sizeCategory) private var sizeCategory

    var body: some View {
        Group {
            if sizeCategory.isAccessibilityCategory {
                accessibilityLayout
            } else {
                compactLayout
            }
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(IOSScheduleFormat.accessibilityLabel(schedule))
    }

    private var compactLayout: some View {
        HStack(spacing: 12) {
            typeIcon

            VStack(alignment: .leading, spacing: 4) {
                Text(schedule.title)
                    .font(.body)
                    .foregroundStyle(.primary)
                    .lineLimit(2)

                HStack(spacing: 6) {
                    Text(IOSScheduleFormat.timeRange(schedule))
                    Text("·")
                    Text(IOSScheduleFormat.typeTitle(schedule.type))
                }
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
            }

            Spacer(minLength: 8)
            statusText
        }
    }

    private var accessibilityLayout: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                typeIcon
                Text(schedule.title)
                    .font(.body)
                    .foregroundStyle(.primary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(IOSScheduleFormat.timeRange(schedule))
                Text(IOSScheduleFormat.typeTitle(schedule.type))
                if schedule.status != "pending" {
                    statusText
                }
            }
            .font(.caption)
            .foregroundStyle(.secondary)
            .padding(.leading, 46)
        }
    }

    private var typeIcon: some View {
        Image(systemName: IOSScheduleFormat.typeSymbol(schedule.type))
            .font(.body.weight(.semibold))
            .foregroundStyle(IOSScheduleFormat.typeColor(schedule.type))
            .frame(width: 34, height: 34)
            .background(IOSScheduleFormat.typeColor(schedule.type).opacity(0.12))
            .clipShape(Circle())
            .accessibilityHidden(true)
    }

    @ViewBuilder
    private var statusText: some View {
        if schedule.status != "pending" {
            Text(IOSScheduleFormat.statusTitle(schedule.status))
                .font(.caption2.weight(.semibold))
                .foregroundStyle(IOSScheduleFormat.statusColor(schedule.status))
                .fixedSize(horizontal: true, vertical: false)
        }
    }
}

struct IOSScheduleDetailView: View {
    @ObservedObject var store: StartupSnapshotStore
    let initialSchedule: NativeScheduleItem

    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

    @State private var schedule: NativeScheduleItem
    @State private var isLoading = false
    @State private var isSavingStatus = false
    @State private var isPresentingEdit = false
    @State private var isConfirmingDelete = false
    @State private var errorMessage: String?

    init(store: StartupSnapshotStore, initialSchedule: NativeScheduleItem) {
        self.store = store
        self.initialSchedule = initialSchedule
        _schedule = State(initialValue: initialSchedule)
    }

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Label(
                        IOSScheduleFormat.typeTitle(schedule.type),
                        systemImage: IOSScheduleFormat.typeSymbol(schedule.type)
                    )
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(IOSScheduleFormat.typeColor(schedule.type))

                    Text(schedule.title)
                        .font(.title2.bold())
                        .foregroundStyle(.primary)
                        .fixedSize(horizontal: false, vertical: true)

                    Text(IOSScheduleFormat.statusTitle(schedule.status))
                        .font(.subheadline)
                        .foregroundStyle(IOSScheduleFormat.statusColor(schedule.status))
                }
                .padding(.vertical, 8)
            }

            if let errorMessage {
                Section {
                    Label(errorMessage, systemImage: "exclamationmark.circle")
                        .font(.subheadline)
                        .foregroundStyle(.red)
                }
            }

            Section(header: Text("시간")) {
                IOSScheduleValueRow(
                    symbol: "calendar",
                    title: "날짜",
                    value: IOSScheduleFormat.fullDate(schedule)
                )
                IOSScheduleValueRow(
                    symbol: "clock",
                    title: "시간",
                    value: IOSScheduleFormat.timeRange(schedule)
                )
                IOSScheduleValueRow(
                    symbol: "bell",
                    title: "알림",
                    value: IOSScheduleFormat.reminderTitle(schedule.reminder)
                )
                IOSScheduleValueRow(
                    symbol: "repeat",
                    title: "반복",
                    value: IOSScheduleFormat.repeatTitle(schedule.repeat)
                )
            }

            if let memo = schedule.memo, !memo.isEmpty {
                Section(header: Text("메모")) {
                    Text(memo)
                        .font(.body)
                        .textSelection(.enabled)
                }
            }

            if let address = schedule.locationAddress, !address.isEmpty {
                Section(header: Text("장소")) {
                    Button {
                        guard let encoded = address.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
                              let url = URL(string: "http://maps.apple.com/?q=\(encoded)") else { return }
                        openURL(url)
                    } label: {
                        Label(address, systemImage: "map")
                    }
                }
            }

            if schedule.permissions?.canChangeStatus == true {
                Section(header: Text("상태")) {
                    Menu {
                        ForEach(IOSScheduleStatus.allCases) { status in
                            Button {
                                Task { await changeStatus(to: status.rawValue) }
                            } label: {
                                if status.rawValue == schedule.status {
                                    Label(status.title, systemImage: "checkmark")
                                } else {
                                    Text(status.title)
                                }
                            }
                        }
                    } label: {
                        HStack {
                            Label("상태 변경", systemImage: "checkmark.circle")
                            Spacer()
                            if isSavingStatus {
                                ProgressView()
                            } else {
                                Text(IOSScheduleFormat.statusTitle(schedule.status))
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .disabled(isSavingStatus)
                }
            }

            if schedule.permissions?.canDelete == true {
                Section {
                    Button("일정 삭제", role: .destructive) {
                        isConfirmingDelete = true
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("일정 상세")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("편집") {
                    isPresentingEdit = true
                }
                .disabled(schedule.permissions?.canEdit != true)
                .opacity(schedule.permissions?.canEdit == true ? 1 : 0)
                .accessibilityHidden(schedule.permissions?.canEdit != true)
            }
        }
        .overlay {
            if isLoading {
                ProgressView()
                    .padding(16)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
        }
        .task(id: initialSchedule.id) {
            await loadDetail()
        }
        .sheet(isPresented: $isPresentingEdit) {
            IOSScheduleEditorNavigationView(store: store, schedule: schedule) { updated in
                schedule = updated
            }
        }
        .confirmationDialog(
            "일정을 삭제할까요?",
            isPresented: $isConfirmingDelete,
            titleVisibility: .visible
        ) {
            Button("삭제", role: .destructive) {
                Task { await deleteSchedule() }
            }
            Button("취소", role: .cancel) {}
        } message: {
            Text("삭제한 일정은 복구할 수 없습니다.")
        }
    }

    private func loadDetail() async {
#if DEBUG
        if CommandLine.arguments.contains("-GLEAUMPreviewSchedules") {
            return
        }
#endif
        isLoading = true
        defer { isLoading = false }
        do {
            let detail = try await NativeAPIClient.shared.fetchSchedule(id: initialSchedule.id)
            schedule = detail
            store.upsertSchedule(detail)
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func changeStatus(to status: String) async {
        guard status != schedule.status else { return }
        isSavingStatus = true
        defer { isSavingStatus = false }
        do {
            let updated = try await NativeAPIClient.shared.updateSchedule(
                id: schedule.id,
                payload: IOSScheduleFormat.updateRequest(from: schedule, status: status)
            )
            schedule = updated
            store.upsertSchedule(updated)
            errorMessage = nil
            await store.refresh(domains: [.home])
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func deleteSchedule() async {
        isLoading = true
        do {
            try await NativeAPIClient.shared.deleteSchedule(id: schedule.id)
            store.removeSchedule(id: schedule.id)
            await store.refresh(domains: [.home, .schedules])
            dismiss()
        } catch {
            isLoading = false
            errorMessage = error.localizedDescription
        }
    }
}

private struct IOSScheduleValueRow: View {
    let symbol: String
    let title: String
    let value: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: symbol)
                .foregroundStyle(Color(uiColor: GleaumUIColor.brandBlue))
                .frame(width: 22)
                .accessibilityHidden(true)
            Text(title)
            Spacer()
            Text(value)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.trailing)
        }
        .accessibilityElement(children: .combine)
    }
}

struct IOSScheduleEditorNavigationView: View {
    @ObservedObject var store: StartupSnapshotStore
    let schedule: NativeScheduleItem?
    var onSaved: ((NativeScheduleItem) -> Void)?

    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    IOSScheduleEditorView(store: store, schedule: schedule, onSaved: onSaved)
                }
            } else {
                NavigationView {
                    IOSScheduleEditorView(store: store, schedule: schedule, onSaved: onSaved)
                }
                .navigationViewStyle(.stack)
            }
        }
    }
}

private struct IOSScheduleEditorView: View {
    @ObservedObject var store: StartupSnapshotStore
    let schedule: NativeScheduleItem?
    var onSaved: ((NativeScheduleItem) -> Void)?

    @Environment(\.dismiss) private var dismiss

    @State private var title: String
    @State private var type: String
    @State private var startDate: Date
    @State private var endDate: Date
    @State private var allDay: Bool
    @State private var reminder: Int
    @State private var repeatValue: String
    @State private var memo: String
    @State private var isSaving = false
    @State private var errorMessage: String?
    @FocusState private var titleFocused: Bool

    init(
        store: StartupSnapshotStore,
        schedule: NativeScheduleItem?,
        onSaved: ((NativeScheduleItem) -> Void)? = nil
    ) {
        self.store = store
        self.schedule = schedule
        self.onSaved = onSaved

        let defaultStart = IOSScheduleFormat.nextHalfHour()
        let parsedStart = schedule?.startDate ?? defaultStart
        let parsedEnd = schedule?.endDate ?? Calendar.current.date(byAdding: .hour, value: 1, to: parsedStart)!

        _title = State(initialValue: schedule?.title ?? "")
        _type = State(initialValue: schedule?.type ?? "personal")
        _startDate = State(initialValue: parsedStart)
        _endDate = State(initialValue: parsedEnd)
        _allDay = State(initialValue: schedule?.allDay ?? false)
        _reminder = State(initialValue: schedule?.reminder ?? 15)
        _repeatValue = State(initialValue: schedule?.repeat ?? "none")
        _memo = State(initialValue: schedule?.memo ?? "")
    }

    var body: some View {
        Form {
            if let errorMessage {
                Section {
                    Label(errorMessage, systemImage: "exclamationmark.circle")
                        .font(.subheadline)
                        .foregroundStyle(.red)
                }
            }

            Section {
                TextField("제목", text: $title)
                    .focused($titleFocused)
                    .submitLabel(.done)

                if schedule == nil {
                    Picker("구분", selection: $type) {
                        Text("개인").tag("personal")
                        Text("공유").tag("shared")
                        Text("자녀").tag("child")
                    }
                    .pickerStyle(.segmented)
                    .accessibilityLabel("일정 구분")
                } else {
                    IOSScheduleValueRow(
                        symbol: IOSScheduleFormat.typeSymbol(type),
                        title: "구분",
                        value: IOSScheduleFormat.typeTitle(type)
                    )
                }
            } header: {
                Text("일정")
            } footer: {
                if schedule == nil {
                    Text(type == "personal"
                         ? "개인 일정은 나만 볼 수 있는 개인 공간에 저장됩니다."
                         : "공유·자녀 일정은 현재 연결된 공간에 저장되며 공간 운영 권한이 필요합니다.")
                }
            }

            Section(header: Text("날짜와 시간")) {
                Toggle("하루 종일", isOn: $allDay)

                DatePicker(
                    "시작",
                    selection: $startDate,
                    displayedComponents: allDay ? [.date] : [.date, .hourAndMinute]
                )

                DatePicker(
                    "종료",
                    selection: $endDate,
                    in: startDate...,
                    displayedComponents: allDay ? [.date] : [.date, .hourAndMinute]
                )
            }

            Section(header: Text("알림과 반복")) {
                Picker("알림", selection: $reminder) {
                    Text("없음").tag(0)
                    Text("10분 전").tag(10)
                    Text("15분 전").tag(15)
                    Text("30분 전").tag(30)
                    Text("1시간 전").tag(60)
                    Text("1일 전").tag(1_440)
                }

                Picker("반복", selection: $repeatValue) {
                    ForEach(IOSScheduleRepeat.allCases) { option in
                        Text(option.title).tag(option.rawValue)
                    }
                }
            }

            Section(header: Text("메모")) {
                TextEditor(text: $memo)
                    .frame(minHeight: 96)
                    .accessibilityLabel("일정 메모")
            }
        }
        .navigationTitle(schedule == nil ? "새 일정" : "일정 편집")
        .navigationBarTitleDisplayMode(.inline)
        .interactiveDismissDisabled(isSaving)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("취소") { dismiss() }
                    .disabled(isSaving)
            }
            ToolbarItem(placement: .confirmationAction) {
                Button(schedule == nil ? "추가" : "저장") {
                    Task { await save() }
                }
                .disabled(!canSave || isSaving)
            }
        }
        .overlay {
            if isSaving {
                ProgressView()
                    .padding(16)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
        }
        .onAppear {
            if schedule == nil {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                    titleFocused = true
                }
            }
        }
        .onChange(of: startDate) { newValue in
            if endDate <= newValue {
                endDate = Calendar.current.date(byAdding: .hour, value: 1, to: newValue) ?? newValue
            }
        }
    }

    private var canSave: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && endDate > startDate
    }

    private func save() async {
        guard canSave else { return }
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let normalized = IOSScheduleFormat.normalizedDates(
            start: startDate,
            end: endDate,
            allDay: allDay
        )
        let cleanTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanMemo = memo.trimmingCharacters(in: .whitespacesAndNewlines)

        do {
            let saved: NativeScheduleItem
            if let schedule {
                saved = try await NativeAPIClient.shared.updateSchedule(
                    id: schedule.id,
                    payload: NativeUpdateScheduleRequest(
                        title: cleanTitle,
                        startTime: ISO8601DateFormatter.gleaum.string(from: normalized.start),
                        endTime: ISO8601DateFormatter.gleaum.string(from: normalized.end),
                        allDay: allDay,
                        reminder: reminder,
                        repeat: repeatValue,
                        memo: cleanMemo,
                        status: nil
                    )
                )
            } else {
                saved = try await NativeAPIClient.shared.createSchedule(
                    NativeCreateScheduleRequest(
                        title: cleanTitle,
                        type: type,
                        spaceId: nil,
                        startTime: ISO8601DateFormatter.gleaum.string(from: normalized.start),
                        endTime: ISO8601DateFormatter.gleaum.string(from: normalized.end),
                        allDay: allDay,
                        reminder: reminder,
                        repeat: repeatValue,
                        memo: cleanMemo.isEmpty ? nil : cleanMemo,
                        visibility: type == "personal" ? "private" : "space"
                    )
                )
            }

            store.upsertSchedule(saved)
            onSaved?(saved)
            await store.refresh(domains: [.home, .schedules])
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct IOSScheduleMessageView: View {
    let symbol: String
    let title: String
    let message: String
    let actionTitle: String
    let action: () -> Void

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
            Button(actionTitle, action: action)
                .buttonStyle(.bordered)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 28)
        .accessibilityElement(children: .contain)
    }
}

private enum IOSScheduleTypeFilter: String, CaseIterable, Identifiable {
    case all
    case shared
    case personal
    case child

    var id: String { rawValue }

    var title: String {
        switch self {
        case .all: return "전체"
        case .shared: return "공유"
        case .personal: return "개인"
        case .child: return "자녀"
        }
    }
}

private enum IOSSchedulePeriod: String, CaseIterable, Identifiable {
    case upcoming
    case thisMonth
    case all

    var id: String { rawValue }

    var title: String {
        switch self {
        case .upcoming: return "다가오는 일정"
        case .thisMonth: return "이번 달"
        case .all: return "전체 기간"
        }
    }

    var symbol: String {
        switch self {
        case .upcoming: return "calendar.badge.clock"
        case .thisMonth: return "calendar"
        case .all: return "calendar.day.timeline.left"
        }
    }
}

private enum IOSScheduleStatus: String, CaseIterable, Identifiable {
    case pending
    case inProgress = "in_progress"
    case completed
    case missed

    var id: String { rawValue }

    var title: String { IOSScheduleFormat.statusTitle(rawValue) }
}

private enum IOSScheduleRepeat: String, CaseIterable, Identifiable {
    case none
    case daily
    case weekly
    case monthly
    case yearly

    var id: String { rawValue }

    var title: String { IOSScheduleFormat.repeatTitle(rawValue) }
}

private enum IOSScheduleFormat {
    static func dayTitle(_ date: Date) -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return "오늘" }
        if calendar.isDateInTomorrow(date) { return "내일" }
        return DateFormatter.gleaumDay.string(from: date)
    }

    static func fullDate(_ schedule: NativeScheduleItem) -> String {
        guard let date = schedule.startDate else { return "날짜 정보 없음" }
        return DateFormatter.gleaumDay.string(from: date)
    }

    static func timeRange(_ schedule: NativeScheduleItem) -> String {
        if schedule.allDay { return "하루 종일" }
        guard let start = schedule.startDate else { return "시간 정보 없음" }
        let startText = DateFormatter.gleaumTime.string(from: start)
        guard let end = schedule.endDate else { return startText }
        return "\(startText)–\(DateFormatter.gleaumTime.string(from: end))"
    }

    static func typeTitle(_ type: String) -> String {
        switch type {
        case "shared": return "공유 일정"
        case "child": return "자녀 일정"
        default: return "개인 일정"
        }
    }

    static func typeSymbol(_ type: String) -> String {
        switch type {
        case "shared": return "person.2.fill"
        case "child": return "person.crop.circle"
        default: return "person.fill"
        }
    }

    static func typeColor(_ type: String) -> Color {
        switch type {
        case "shared": return Color(uiColor: GleaumUIColor.brandBlue)
        case "child": return Color(uiColor: GleaumUIColor.brandGreen)
        default: return Color(uiColor: GleaumUIColor.brandTeal)
        }
    }

    static func statusTitle(_ status: String) -> String {
        switch status {
        case "in_progress": return "진행 중"
        case "completed": return "완료"
        case "missed": return "미완료"
        default: return "예정"
        }
    }

    static func statusColor(_ status: String) -> Color {
        switch status {
        case "in_progress": return Color(uiColor: GleaumUIColor.brandBlue)
        case "completed": return Color(uiColor: GleaumUIColor.brandGreen)
        case "missed": return .red
        default: return .secondary
        }
    }

    static func repeatTitle(_ value: String) -> String {
        switch value {
        case "daily": return "매일"
        case "weekly": return "매주"
        case "monthly": return "매월"
        case "yearly": return "매년"
        default: return "반복 안 함"
        }
    }

    static func reminderTitle(_ minutes: Int) -> String {
        switch minutes {
        case 0: return "없음"
        case 60: return "1시간 전"
        case 1_440: return "1일 전"
        default: return "\(minutes)분 전"
        }
    }

    static func accessibilityLabel(_ schedule: NativeScheduleItem) -> String {
        "\(schedule.title), \(typeTitle(schedule.type)), \(fullDate(schedule)), \(timeRange(schedule)), \(statusTitle(schedule.status))"
    }

    static func nextHalfHour() -> Date {
        let calendar = Calendar.current
        let now = Date()
        let minute = calendar.component(.minute, from: now)
        let minutesToAdd = minute < 30 ? 30 - minute : 60 - minute
        let rounded = calendar.date(byAdding: .minute, value: minutesToAdd, to: now) ?? now
        return calendar.date(bySetting: .second, value: 0, of: rounded) ?? rounded
    }

    static func normalizedDates(start: Date, end: Date, allDay: Bool) -> (start: Date, end: Date) {
        guard allDay else { return (start, end) }
        let normalizedStart = Calendar.current.startOfDay(for: start)
        let normalizedEnd = Calendar.current.date(byAdding: .day, value: 1, to: Calendar.current.startOfDay(for: end))
            ?? end
        return (normalizedStart, normalizedEnd)
    }

    static func updateRequest(from schedule: NativeScheduleItem, status: String) -> NativeUpdateScheduleRequest {
        NativeUpdateScheduleRequest(
            title: schedule.title,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            allDay: schedule.allDay,
            reminder: schedule.reminder,
            repeat: schedule.repeat,
            memo: schedule.memo,
            status: status
        )
    }
}

private extension NativeScheduleItem {
    var startDate: Date? {
        ISO8601DateFormatter.gleaum.date(from: startTime)
            ?? ISO8601DateFormatter.gleaumWithoutFractionalSeconds.date(from: startTime)
    }

    var endDate: Date? {
        guard let endTime else { return nil }
        return ISO8601DateFormatter.gleaum.date(from: endTime)
            ?? ISO8601DateFormatter.gleaumWithoutFractionalSeconds.date(from: endTime)
    }
}

private extension ISO8601DateFormatter {
    static let gleaumWithoutFractionalSeconds: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()
}
