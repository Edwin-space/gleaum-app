import SwiftUI

struct IOSHomeNavigationView: View {
    @ObservedObject var model: IOSAppModel
    @ObservedObject var store: StartupSnapshotStore

    @State private var isPresentingSchedule = false

    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    content
                }
            } else {
                NavigationView {
                    content
                }
                .navigationViewStyle(.stack)
            }
        }
    }

    private var content: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 24) {
                if let summary = store.homeSummary {
                    greeting(summary)
                    scheduleOverview(summary)
                    todaySection(summary)
                    ledgerSection(summary)
                } else if store.state == .partialFailure {
                    unavailableState
                } else {
                    loadingState
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 18)
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationTitle("홈")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    isPresentingSchedule = true
                } label: {
                    Label("새 일정", systemImage: "plus")
                }
            }
        }
        .refreshable {
            await store.prefetch(force: true)
        }
        .task {
            await store.prefetch()
        }
        .sheet(isPresented: $isPresentingSchedule) {
            ScheduleCreateControllerContainer(isPresented: $isPresentingSchedule) {
                Task {
                    await store.prefetch(force: true)
                }
            }
        }
    }

    private func greeting(_ summary: NativeHomeSummary) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(greetingText)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color(uiColor: GleaumUIColor.brandTeal))
            Text("\(summary.user.displayName)님")
                .font(.largeTitle.bold())
                .foregroundStyle(.primary)
            Text(summary.spaces.activeSpaceName ?? "나의 공간")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func scheduleOverview(_ summary: NativeHomeSummary) -> some View {
        GroupBox {
            HStack(spacing: 0) {
                metric(value: summary.schedules.todayCount, label: "오늘")
                Divider().frame(height: 42)
                metric(value: summary.schedules.upcomingCount, label: "예정")
                Divider().frame(height: 42)
                metric(value: summary.spaces.memberCount, label: "공간 멤버")
            }
            .padding(.vertical, 4)
        } label: {
            Label("종합 일정", systemImage: "calendar.badge.clock")
                .font(.headline)
        }
    }

    private func metric(value: Int, label: String) -> some View {
        VStack(spacing: 4) {
            Text(value, format: .number)
                .font(.title2.bold())
                .foregroundStyle(.primary)
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func todaySection(_ summary: NativeHomeSummary) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader(
                title: "오늘 일정",
                detail: DateFormatter.gleaumDay.string(from: Date())
            )

            if summary.schedules.today.isEmpty {
                ContentUnavailableFallback(
                    symbol: "calendar",
                    title: "오늘 일정이 없어요",
                    description: "상단의 추가 버튼으로 새 일정을 등록할 수 있어요."
                )
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(summary.schedules.today.prefix(5).enumerated()), id: \.element.id) { index, item in
                        scheduleRow(item)
                        if index < min(summary.schedules.today.count, 5) - 1 {
                            Divider()
                        }
                    }
                }
                .padding(.horizontal, 16)
                .background(Color(uiColor: .secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
        }
    }

    private func scheduleRow(_ item: NativeScheduleItem) -> some View {
        HStack(spacing: 14) {
            Text(scheduleTime(item))
                .font(.caption.weight(.semibold))
                .foregroundStyle(Color(uiColor: GleaumUIColor.brandBlue))
                .frame(width: 54, alignment: .leading)
            VStack(alignment: .leading, spacing: 3) {
                Text(item.title)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                Text(item.type == "personal" ? "개인 일정" : "공유 일정")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding(.vertical, 13)
        .contentShape(Rectangle())
    }

    private func ledgerSection(_ summary: NativeHomeSummary) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Button {
                model.selectedTab = .budget
            } label: {
                HStack {
                    Text("가계부")
                        .font(.headline)
                        .foregroundStyle(.primary)
                    Spacer()
                    Text("자세히")
                        .font(.subheadline)
                    Image(systemName: "chevron.right")
                        .font(.caption.weight(.semibold))
                }
            }

            GroupBox {
                VStack(spacing: 12) {
                    ledgerRow("수입", amount: summary.ledger.incomeTotal, color: GleaumUIColor.brandGreen)
                    Divider()
                    ledgerRow("지출", amount: summary.ledger.expenseTotal, color: .systemOrange)
                    Divider()
                    ledgerRow("순액", amount: summary.ledger.net, color: GleaumUIColor.brandTeal)
                }
            }
        }
    }

    private func ledgerRow(_ title: String, amount: Int, color: UIColor) -> some View {
        HStack {
            Text(title)
                .foregroundStyle(.secondary)
            Spacer()
            Text(amount, format: .currency(code: "KRW").precision(.fractionLength(0)))
                .font(.body.weight(.semibold))
                .foregroundStyle(Color(uiColor: color))
        }
    }

    private func sectionHeader(title: String, detail: String) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.headline)
            Spacer()
            Text(detail)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    private var loadingState: some View {
        VStack(spacing: 14) {
            ProgressView()
            Text("오늘의 정보를 준비하고 있어요")
                .font(.callout)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 90)
    }

    private var unavailableState: some View {
        VStack(spacing: 16) {
            ContentUnavailableFallback(
                symbol: "exclamationmark.arrow.triangle.2.circlepath",
                title: "홈을 불러오지 못했어요",
                description: "연결을 확인하고 다시 시도해 주세요."
            )
            Button("다시 시도") {
                Task {
                    await store.prefetch(force: true)
                }
            }
            .buttonStyle(.borderedProminent)
        }
    }

    private var greetingText: String {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour < 12 { return "좋은 아침이에요" }
        if hour < 18 { return "좋은 오후예요" }
        return "좋은 저녁이에요"
    }

    private func scheduleTime(_ item: NativeScheduleItem) -> String {
        guard !item.allDay else { return "종일" }
        let date = ISO8601DateFormatter.gleaum.date(from: item.startTime) ?? Date()
        return DateFormatter.gleaumTime.string(from: date)
    }
}

private struct ContentUnavailableFallback: View {
    let symbol: String
    let title: String
    let description: String

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: symbol)
                .font(.system(size: 30))
                .foregroundStyle(.secondary)
            Text(title)
                .font(.headline)
            Text(description)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 34)
    }
}

private struct ScheduleCreateControllerContainer: UIViewControllerRepresentable {
    @Binding var isPresented: Bool
    let onCreated: () -> Void

    func makeUIViewController(context: Context) -> NativeScheduleCreateViewController {
        let controller = NativeScheduleCreateViewController()
        controller.onCreated = { _ in
            onCreated()
            isPresented = false
        }
        return controller
    }

    func updateUIViewController(
        _ uiViewController: NativeScheduleCreateViewController,
        context: Context
    ) {}
}
