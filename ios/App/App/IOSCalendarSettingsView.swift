import SwiftUI

struct IOSCalendarSettingsView: View {
    @ObservedObject var snapshotStore: StartupSnapshotStore
    @StateObject private var calendarStore = IOSDeviceCalendarStore.shared
    @Environment(\.scenePhase) private var scenePhase
    @State private var showsSyncConfirmation = false

    var body: some View {
        List {
            connectionSection

            if calendarStore.permission.canSynchronize {
                synchronizationSection
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
        .alert("iPhone 캘린더에 반영할까요?", isPresented: $showsSyncConfirmation) {
            Button("반영") {
                Task {
                    await snapshotStore.refresh(domains: [.schedules])
                    await calendarStore.synchronize(schedules: snapshotStore.schedules)
                }
            }
            Button("취소", role: .cancel) {}
        } message: {
            Text("‘\(selectedCalendarName)’ 캘린더의 앞으로 30일을 글리움 일정과 맞춥니다. 글리움이 만든 일정만 업데이트하거나 정리합니다.")
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

    private var connectionSection: some View {
        Section {
            HStack(spacing: 12) {
                Image(systemName: permissionSymbol)
                    .font(.title3)
                    .foregroundStyle(permissionTint)
                    .frame(width: 28)
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 3) {
                    Text("iPhone 캘린더")
                        .font(.body.weight(.semibold))
                    Text(calendarStore.permission.title)
                        .font(.subheadline)
                        .foregroundStyle(permissionTint)
                }

                Spacer(minLength: 8)
            }
            .padding(.vertical, 2)

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
                HStack(spacing: 10) {
                    ProgressView()
                    Text("캘린더 정보를 확인하는 중이에요")
                        .foregroundStyle(.secondary)
                }
            }
        } header: {
            Text("연결 상태")
        } footer: {
            if calendarStore.permission.canSynchronize {
                Text("동기화는 자동으로 실행되지 않으며, 아래에서 사용자가 직접 시작합니다.")
            } else {
                Text("일정 가져오기와 중복 확인을 위해 iOS의 ‘전체 접근’ 권한이 필요합니다.")
            }
        }
    }

    private var synchronizationSection: some View {
        Section {
            if writableCalendars.isEmpty {
                Label("일정을 저장할 수 있는 캘린더가 없습니다.", systemImage: "exclamationmark.triangle")
                    .foregroundStyle(.orange)
            } else {
                Picker("대상 캘린더", selection: selectedCalendarBinding) {
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

                Button {
                    showsSyncConfirmation = true
                } label: {
                    if calendarStore.isSynchronizing {
                        IOSCalendarSyncActionRow(
                            title: "iPhone 캘린더에 반영 중",
                            subtitle: "글리움 일정을 안전하게 맞추고 있어요",
                            symbol: "arrow.triangle.2.circlepath",
                            tint: Color(uiColor: GleaumUIColor.brandTeal),
                            showsProgress: true
                        )
                    } else {
                        IOSCalendarSyncActionRow(
                            title: "글리움 일정을 iPhone에 반영",
                            subtitle: "앞으로 30일 · \(exportableScheduleCount)개 일정",
                            symbol: "arrow.up.circle.fill",
                            tint: Color(uiColor: GleaumUIColor.brandTeal)
                        )
                    }
                }
                .buttonStyle(.plain)
                .disabled(calendarStore.isSynchronizing || calendarStore.selectedCalendarId == nil)

                NavigationLink {
                    IOSCalendarImportView(
                        snapshotStore: snapshotStore,
                        calendarStore: calendarStore
                    )
                } label: {
                    IOSCalendarSyncActionRow(
                        title: "iPhone 일정을 글리움에 추가",
                        subtitle: "일정을 선택해 개인 일정으로 저장",
                        symbol: "arrow.down.circle.fill",
                        tint: Color(uiColor: GleaumUIColor.brandBlue)
                    )
                }
                .disabled(calendarStore.selectedCalendarId == nil || calendarStore.isSynchronizing)

                if let result = calendarStore.lastSyncResult {
                    Label(result.summary, systemImage: "checkmark.circle.fill")
                        .font(.subheadline)
                        .foregroundStyle(.green)
                }
            }
        } header: {
            Text("일정 동기화")
        } footer: {
            Text("앞으로 30일만 처리합니다. iPhone 일정은 선택한 항목만 개인 일정에 추가하며, 지출 일정은 내보내지 않습니다.")
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

    private var selectedCalendarName: String {
        calendarStore.selectedCalendar?.name ?? "선택한 캘린더"
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
        .gleaumFloatingTabBarHidden()
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

private struct IOSCalendarSyncActionRow: View {
    let title: String
    let subtitle: String
    let symbol: String
    let tint: Color
    var showsProgress = false

    var body: some View {
        HStack(spacing: 12) {
            Group {
                if showsProgress {
                    ProgressView()
                } else {
                    Image(systemName: symbol)
                        .font(.title3)
                        .foregroundStyle(tint)
                }
            }
            .frame(width: 28, height: 28)
            .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(.primary)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .multilineTextAlignment(.leading)

            Spacer(minLength: 8)
        }
        .padding(.vertical, 3)
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
