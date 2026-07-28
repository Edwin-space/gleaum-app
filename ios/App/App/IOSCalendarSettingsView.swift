import SwiftUI

struct IOSCalendarSettingsView: View {
    @ObservedObject var snapshotStore: StartupSnapshotStore
    @StateObject private var calendarStore = IOSDeviceCalendarStore.shared
    @Environment(\.scenePhase) private var scenePhase
    @State private var showsSyncConfirmation = false

    var body: some View {
        List {
            introductionSection
            permissionSection

            if calendarStore.permission.canSynchronize {
                calendarSelectionSection
                exportSection
                importSection
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("기기 캘린더")
        .navigationBarTitleDisplayMode(.inline)
        .dynamicTypeSize(.small ... .accessibility2)
        .task {
            calendarStore.load()
        }
        .onChange(of: scenePhase) { phase in
            if phase == .active {
                calendarStore.load()
            }
        }
        .alert("캘린더 동기화", isPresented: $showsSyncConfirmation) {
            Button("동기화") {
                Task {
                    await snapshotStore.refresh(domains: [.schedules])
                    await calendarStore.synchronize(schedules: snapshotStore.schedules)
                }
            }
            Button("취소", role: .cancel) {}
        } message: {
            Text("선택한 캘린더의 앞으로 30일을 글리움 일정과 맞춥니다. 글리움이 만든 일정만 업데이트하거나 정리합니다.")
        }
        .alert("캘린더 작업을 완료하지 못했어요", isPresented: errorBinding) {
            if calendarStore.permission == .denied || calendarStore.permission == .writeOnly {
                Button("설정 열기") {
                    calendarStore.openSystemSettings()
                }
            }
            Button("확인", role: .cancel) {
                calendarStore.clearMessage()
            }
        } message: {
            Text(calendarStore.errorMessage ?? "잠시 후 다시 시도해 주세요.")
        }
    }

    private var introductionSection: some View {
        Section {
            Label {
                VStack(alignment: .leading, spacing: 5) {
                    Text("iPhone 캘린더와 연결")
                        .font(.headline)
                    Text("선택한 캘린더와 글리움 일정을 사용자가 요청할 때만 주고받습니다.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            } icon: {
                Image(systemName: "calendar.badge.checkmark")
                    .font(.title2)
                    .foregroundStyle(Color(uiColor: GleaumUIColor.brandTeal))
            }
            .padding(.vertical, 6)
        } footer: {
            Text("기기 일정은 이 화면에서 확인하고, 사용자가 선택한 일정만 글리움 개인 일정으로 저장합니다.")
        }
    }

    private var permissionSection: some View {
        Section {
            HStack {
                Label("캘린더 접근", systemImage: permissionSymbol)
                Spacer()
                Text(calendarStore.permission.title)
                    .font(.subheadline)
                    .foregroundStyle(permissionTint)
            }

            switch calendarStore.permission {
            case .prompt, .unknown, .writeOnly:
                Button {
                    Task { await calendarStore.requestFullAccess() }
                } label: {
                    Label(
                        calendarStore.permission == .writeOnly ? "전체 접근으로 변경" : "캘린더 연결",
                        systemImage: "checkmark.shield"
                    )
                }
                .disabled(calendarStore.isLoading)

            case .denied:
                Button {
                    calendarStore.openSystemSettings()
                } label: {
                    Label("iPhone 설정에서 권한 변경", systemImage: "gear")
                }

            case .restricted:
                Text("스크린 타임 또는 기기 관리 정책에서 캘린더 접근이 제한되어 있습니다.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)

            case .fullAccess:
                EmptyView()
            }

            if calendarStore.isLoading {
                HStack {
                    ProgressView()
                    Text("캘린더 정보를 확인하는 중이에요")
                        .foregroundStyle(.secondary)
                }
            }
        } header: {
            Text("접근 권한")
        } footer: {
            Text("가져오기와 중복 확인을 위해 iOS의 ‘전체 접근’ 권한이 필요합니다.")
        }
    }

    private var calendarSelectionSection: some View {
        Section {
            if writableCalendars.isEmpty {
                Label("일정을 저장할 수 있는 캘린더가 없습니다.", systemImage: "exclamationmark.triangle")
                    .foregroundStyle(.orange)
            } else {
                Picker("기기 캘린더", selection: selectedCalendarBinding) {
                    ForEach(writableCalendars) { calendar in
                        Label {
                            Text(calendar.name)
                        } icon: {
                            Image(systemName: "circle.fill")
                                .foregroundStyle(calendarColor(calendar.colorValue))
                        }
                        .tag(Optional(calendar.id))
                    }
                }

                if let selected = calendarStore.selectedCalendar {
                    IOSCalendarValueRow(title: "계정", value: selected.accountName)
                }
            }
        } header: {
            Text("사용할 캘린더")
        } footer: {
            Text("읽기 전용 캘린더는 선택할 수 없습니다.")
        }
    }

    private var exportSection: some View {
        Section {
            IOSCalendarValueRow(title: "동기화 대상", value: "앞으로 30일")
            IOSCalendarValueRow(title: "예상 일정", value: "\(exportableScheduleCount)개")

            Button {
                showsSyncConfirmation = true
            } label: {
                if calendarStore.isSynchronizing {
                    HStack {
                        ProgressView()
                        Text("동기화하는 중이에요")
                    }
                } else {
                    Label("글리움 일정 동기화", systemImage: "arrow.up.circle")
                }
            }
            .disabled(
                calendarStore.isSynchronizing
                    || calendarStore.selectedCalendarId == nil
                    || writableCalendars.isEmpty
            )

            if let result = calendarStore.lastSyncResult {
                Label(result.summary, systemImage: "checkmark.circle.fill")
                    .font(.subheadline)
                    .foregroundStyle(.green)
            }
        } header: {
            Text("글리움 → iPhone")
        } footer: {
            Text("지출 일정은 제외합니다. 기기에서 직접 만든 일정은 수정하거나 삭제하지 않습니다.")
        }
    }

    private var importSection: some View {
        Section {
            NavigationLink {
                IOSCalendarImportView(
                    snapshotStore: snapshotStore,
                    calendarStore: calendarStore
                )
            } label: {
                IOSCalendarSettingsRow(
                    title: "기기 일정 가져오기",
                    subtitle: "선택한 캘린더의 앞으로 30일",
                    symbol: "arrow.down.circle",
                    tint: Color(uiColor: GleaumUIColor.brandBlue)
                )
            }
            .disabled(calendarStore.selectedCalendarId == nil)
        } header: {
            Text("iPhone → 글리움")
        } footer: {
            Text("개인 일정으로만 저장합니다. 같은 제목과 시작 시각의 일정, 글리움이 내보낸 일정은 자동으로 제외합니다.")
        }
    }

    private var writableCalendars: [IOSDeviceCalendarDescriptor] {
        calendarStore.calendars.filter(\.canWrite)
    }

    private var selectedCalendarBinding: Binding<String?> {
        Binding(
            get: { calendarStore.selectedCalendarId },
            set: { calendarStore.selectedCalendarId = $0 }
        )
    }

    private var exportableScheduleCount: Int {
        let now = Date()
        let start = Calendar.current.date(byAdding: .day, value: -1, to: now) ?? now
        let end = Calendar.current.date(byAdding: .day, value: 30, to: now) ?? now
        return snapshotStore.schedules.filter { schedule in
            guard schedule.type != "expense",
                  let date = IOSCalendarFormat.scheduleDate(schedule.startTime) else {
                return false
            }
            return date >= start && date <= end
        }.count
    }

    private var permissionSymbol: String {
        switch calendarStore.permission {
        case .fullAccess: return "checkmark.circle.fill"
        case .prompt, .unknown: return "questionmark.circle"
        case .writeOnly: return "arrow.up.circle"
        case .denied, .restricted: return "xmark.circle.fill"
        }
    }

    private var permissionTint: Color {
        switch calendarStore.permission {
        case .fullAccess: return .green
        case .prompt, .unknown, .writeOnly: return .orange
        case .denied, .restricted: return .red
        }
    }

    private var errorBinding: Binding<Bool> {
        Binding(
            get: { calendarStore.errorMessage != nil },
            set: { if !$0 { calendarStore.clearMessage() } }
        )
    }

    private func calendarColor(_ value: Int) -> Color {
        Color(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255
        )
    }
}

private struct IOSCalendarImportView: View {
    @ObservedObject var snapshotStore: StartupSnapshotStore
    @ObservedObject var calendarStore: IOSDeviceCalendarStore

    @State private var candidates: [IOSCalendarImportCandidate] = []
    @State private var selectedIds: Set<String> = []
    @State private var isLoaded = false
    @State private var result: IOSCalendarImportResult?
    @State private var showsResult = false

    var body: some View {
        List {
            Section {
                Label {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("개인 일정으로 안전하게 가져와요")
                            .font(.headline)
                        Text("동일한 제목과 시작 시각의 일정은 선택할 수 없도록 표시합니다.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                } icon: {
                    Image(systemName: "calendar.badge.plus")
                        .foregroundStyle(Color(uiColor: GleaumUIColor.brandTeal))
                }
                .padding(.vertical, 4)
            }

            if calendarStore.isLoading && !isLoaded {
                Section {
                    HStack {
                        Spacer()
                        ProgressView("기기 일정을 확인하는 중이에요")
                        Spacer()
                    }
                    .padding(.vertical, 28)
                }
            } else if candidates.isEmpty {
                Section {
                    VStack(spacing: 12) {
                        Image(systemName: "calendar.badge.checkmark")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                        Text("가져올 새 일정이 없어요")
                            .font(.headline)
                        Text("선택한 캘린더의 어제부터 30일 뒤까지 확인했습니다.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                        Button("다시 확인") {
                            Task { await loadCandidates() }
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 28)
                }
            } else {
                Section {
                    ForEach(candidates) { candidate in
                        Button {
                            toggle(candidate)
                        } label: {
                            IOSCalendarImportRow(
                                candidate: candidate,
                                isSelected: selectedIds.contains(candidate.id)
                            )
                        }
                        .buttonStyle(.plain)
                        .disabled(candidate.isDuplicate)
                        .accessibilityValue(
                            candidate.isDuplicate
                                ? "중복 일정"
                                : selectedIds.contains(candidate.id) ? "선택됨" : "선택 안 됨"
                        )
                    }
                } header: {
                    Text("확인된 일정 \(candidates.count)개 · 가져오기 가능 \(availableCount)개")
                } footer: {
                    Text("글리움에서 내보낸 일정은 목록에 다시 표시하지 않습니다.")
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("기기 일정 가져오기")
        .navigationBarTitleDisplayMode(.inline)
        .dynamicTypeSize(.small ... .accessibility2)
        .refreshable {
            await loadCandidates()
        }
        .safeAreaInset(edge: .bottom) {
            if !candidates.isEmpty {
                VStack(spacing: 0) {
                    Divider()
                    Button {
                        Task { await importSelection() }
                    } label: {
                        if calendarStore.isSynchronizing {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                        } else {
                            Text("선택한 \(selectedIds.count)개 가져오기")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color(uiColor: GleaumUIColor.brandBlue))
                    .controlSize(.large)
                    .disabled(selectedIds.isEmpty || calendarStore.isSynchronizing)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                }
                .background(.bar)
            }
        }
        .task {
            await loadCandidates()
        }
        .alert("가져오기 완료", isPresented: $showsResult) {
            Button("확인", role: .cancel) {}
        } message: {
            Text(result?.summary ?? "기기 일정을 확인했습니다.")
        }
    }

    private var availableCount: Int {
        candidates.filter { !$0.isDuplicate }.count
    }

    private func loadCandidates() async {
        await snapshotStore.refresh(domains: [.schedules])
        let loaded = await calendarStore.importCandidates(schedules: snapshotStore.schedules)
        candidates = loaded
        selectedIds = Set(loaded.filter { !$0.isDuplicate }.map(\.id))
        isLoaded = true
    }

    private func toggle(_ candidate: IOSCalendarImportCandidate) {
        guard !candidate.isDuplicate else { return }
        if selectedIds.contains(candidate.id) {
            selectedIds.remove(candidate.id)
        } else {
            selectedIds.insert(candidate.id)
        }
    }

    private func importSelection() async {
        let selected = candidates.filter { selectedIds.contains($0.id) }
        result = await calendarStore.importSelected(selected, snapshotStore: snapshotStore)
        showsResult = true
        await loadCandidates()
    }
}

private struct IOSCalendarValueRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack {
            Text(title)
            Spacer(minLength: 12)
            Text(value)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.trailing)
        }
    }
}

private struct IOSCalendarSettingsRow: View {
    let title: String
    let subtitle: String
    let symbol: String
    let tint: Color

    var body: some View {
        Label {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .foregroundStyle(.primary)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        } icon: {
            Image(systemName: symbol)
                .foregroundStyle(tint)
        }
    }
}

private struct IOSCalendarImportRow: View {
    let candidate: IOSCalendarImportCandidate
    let isSelected: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: candidate.isDuplicate ? "minus.circle" : isSelected ? "checkmark.circle.fill" : "circle")
                .font(.title3)
                .foregroundStyle(candidate.isDuplicate ? Color.secondary : Color(uiColor: GleaumUIColor.brandTeal))
                .frame(width: 24)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 4) {
                Text(candidate.event.title)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(candidate.isDuplicate ? .secondary : .primary)
                    .multilineTextAlignment(.leading)

                Text(IOSCalendarFormat.eventDate(candidate.event))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                if !candidate.event.location.isEmpty {
                    Label(candidate.event.location, systemImage: "mappin.and.ellipse")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }

                if candidate.isDuplicate {
                    Text("이미 같은 개인 일정이 있어 제외됨")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.orange)
                }
            }

            Spacer(minLength: 0)
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }
}

enum IOSCalendarFormat {
    static func scheduleDate(_ value: String) -> Date? {
        ISO8601DateFormatter.gleaum.date(from: value)
            ?? withoutFractionalSeconds.date(from: value)
    }

    static func eventDate(_ event: IOSDeviceCalendarEvent) -> String {
        if event.allDay {
            return event.startDate.formatted(
                Date.FormatStyle(date: .long, time: .omitted).locale(Locale(identifier: "ko_KR"))
            ) + " · 종일"
        }
        let start = event.startDate.formatted(
            Date.FormatStyle(date: .long, time: .shortened).locale(Locale(identifier: "ko_KR"))
        )
        let end = event.endDate.formatted(
            Date.FormatStyle(date: .omitted, time: .shortened).locale(Locale(identifier: "ko_KR"))
        )
        return "\(start) – \(end)"
    }

    private static let withoutFractionalSeconds: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()
}
