import SwiftUI

struct IOSBudgetNavigationView: View {
    @ObservedObject var store: StartupSnapshotStore

    @State private var selectedMonth = Calendar.current.dateInterval(of: .month, for: Date())?.start ?? Date()
    @State private var summary: NativeBudgetSummary?
    @State private var selectedKind = IOSBudgetKindFilter.all
    @State private var searchText = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var editorKind: IOSBudgetKind?

    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    budgetList
                }
            } else {
                NavigationView {
                    budgetList
                }
                .navigationViewStyle(.stack)
            }
        }
        .sheet(item: $editorKind) { kind in
            IOSBudgetEditorNavigationView(store: store, kind: kind, entry: nil) {
                Task { await reloadAfterMutation() }
            }
        }
    }

    private var budgetList: some View {
        List {
            monthSection

            if let errorMessage, summary == nil {
                Section {
                    IOSBudgetMessageView(
                        symbol: "exclamationmark.arrow.triangle.2.circlepath",
                        title: "가계부를 불러오지 못했어요",
                        message: errorMessage,
                        actionTitle: "다시 시도"
                    ) {
                        Task { await loadSelectedMonth(force: true) }
                    }
                }
                .listRowBackground(Color.clear)
            } else if isLoading, summary == nil {
                Section {
                    HStack(spacing: 12) {
                        ProgressView()
                        Text("가계부를 불러오는 중이에요")
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 28)
                }
                .listRowBackground(Color.clear)
            } else if let summary {
                cashFlowSection(summary)
                categorySection(summary)
                recurringSection(summary)
                recentSection(summary)
            } else {
                Section {
                    IOSBudgetMessageView(
                        symbol: "creditcard",
                        title: "가계부를 시작해 보세요",
                        message: "수입과 지출을 기록하면 이번 달 돈의 흐름을 한눈에 볼 수 있어요.",
                        actionTitle: "지출 추가"
                    ) {
                        editorKind = .expense
                    }
                }
                .listRowBackground(Color.clear)
            }
        }
        .listStyle(.insetGrouped)
        // Preserve Dynamic Type without allowing the largest sizes to collapse
        // the monthly summary into unreadable single-character columns.
        .dynamicTypeSize(.small ... .accessibility2)
        .gleaumTabBarScrollTracking(for: .budget)
        .navigationTitle("가계부")
        .navigationBarTitleDisplayMode(.large)
        .searchable(text: $searchText, prompt: "항목 또는 카테고리 검색")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button {
                        editorKind = .expense
                    } label: {
                        Label("지출 추가", systemImage: "minus.circle")
                    }
                    Button {
                        editorKind = .income
                    } label: {
                        Label("수입 추가", systemImage: "plus.circle")
                    }
                } label: {
                    Label("내역 추가", systemImage: "plus")
                }
            }
        }
        .refreshable {
            await loadSelectedMonth(force: true)
        }
        .task {
            await loadSelectedMonth()
        }
        .onChange(of: selectedMonth) { _ in
            summary = nil
            errorMessage = nil
            Task { await loadSelectedMonth(force: true) }
        }
    }

    private var monthSection: some View {
        Section {
            HStack {
                Button {
                    moveMonth(by: -1)
                } label: {
                    Label("이전 달", systemImage: "chevron.left")
                        .labelStyle(.iconOnly)
                        .frame(width: 44, height: 44)
                }

                Spacer()
                Text(IOSBudgetFormat.monthTitle(selectedMonth))
                    .font(.headline)
                    .accessibilityAddTraits(.isHeader)
                Spacer()

                Button {
                    moveMonth(by: 1)
                } label: {
                    Label("다음 달", systemImage: "chevron.right")
                        .labelStyle(.iconOnly)
                        .frame(width: 44, height: 44)
                }
                .disabled(!canMoveForward)
            }
            .buttonStyle(.plain)
        }
    }

    @ViewBuilder
    private func cashFlowSection(_ summary: NativeBudgetSummary) -> some View {
        Section(header: Text("이번 달 흐름")) {
            VStack(alignment: .leading, spacing: 10) {
                Text("남은 금액")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(IOSBudgetFormat.currency(summary.net, signed: true))
                    .font(.title.bold())
                    .foregroundStyle(summary.net >= 0 ? Color.primary : Color.red)
                    .lineLimit(1)
                    .minimumScaleFactor(0.55)
                if summary.incomeTotal > 0 {
                    Text("저축 가능 비율 \(Int(summary.savingsRate))%")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.vertical, 8)
            .accessibilityElement(children: .combine)

            IOSBudgetValueRow(
                symbol: "arrow.down.circle",
                title: "수입",
                value: IOSBudgetFormat.currency(summary.incomeTotal)
            )
            IOSBudgetValueRow(
                symbol: "arrow.up.circle",
                title: "지출",
                value: IOSBudgetFormat.currency(summary.expenseTotal)
            )
            IOSBudgetValueRow(
                symbol: "calendar.badge.clock",
                title: "예정",
                value: "\(summary.pendingIncomeCount + summary.pendingExpenseCount)건"
            )
        }
    }

    @ViewBuilder
    private func categorySection(_ summary: NativeBudgetSummary) -> some View {
        let categories = filteredCategories(summary)
        if !categories.isEmpty {
            Section(header: Text("카테고리")) {
                Picker("카테고리 구분", selection: $selectedKind) {
                    ForEach(IOSBudgetKindFilter.allCases) { kind in
                        Text(kind.title).tag(kind)
                    }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .accessibilityLabel("카테고리 구분")

                ForEach(categories.prefix(6)) { total in
                    let category = IOSBudgetCatalog.category(id: total.category, kind: total.kind)
                    let denominator = total.kind == "income" ? summary.incomeTotal : summary.expenseTotal
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 10) {
                            Label(category.title, systemImage: category.symbol)
                                .foregroundStyle(.primary)
                            Spacer()
                            Text(IOSBudgetFormat.currency(total.amount))
                                .foregroundStyle(.secondary)
                        }
                        ProgressView(
                            value: denominator > 0 ? Double(total.amount) / Double(denominator) : 0
                        )
                        .tint(IOSBudgetFormat.kindColor(total.kind))
                    }
                    .padding(.vertical, 2)
                    .accessibilityElement(children: .combine)
                }
            }
        }
    }

    @ViewBuilder
    private func recurringSection(_ summary: NativeBudgetSummary) -> some View {
        let entries = filtered(summary.recurringEntries)
        if !entries.isEmpty {
            Section(header: Text("정기 항목"), footer: Text("정기 항목은 설정한 주기에 맞춰 예정 내역으로 생성됩니다.")) {
                ForEach(entries) { entry in
                    NavigationLink {
                        IOSBudgetDetailView(store: store, initialEntry: entry) {
                            Task { await reloadAfterMutation() }
                        }
                    } label: {
                        IOSBudgetEntryRow(entry: entry)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func recentSection(_ summary: NativeBudgetSummary) -> some View {
        let entries = filtered(summary.recentEntries)
        Section(header: Text("최근 내역")) {
            if entries.isEmpty {
                IOSBudgetMessageView(
                    symbol: searchText.isEmpty ? "tray" : "magnifyingglass",
                    title: searchText.isEmpty ? "아직 내역이 없어요" : "검색 결과가 없어요",
                    message: searchText.isEmpty
                        ? "이 달의 첫 수입 또는 지출을 기록해 보세요."
                        : "다른 검색어 또는 구분을 확인해 주세요.",
                    actionTitle: searchText.isEmpty ? "지출 추가" : nil,
                    action: searchText.isEmpty ? { editorKind = .expense } : nil
                )
            } else {
                ForEach(entries) { entry in
                    NavigationLink {
                        IOSBudgetDetailView(store: store, initialEntry: entry) {
                            Task { await reloadAfterMutation() }
                        }
                    } label: {
                        IOSBudgetEntryRow(entry: entry)
                    }
                }
            }
        }
    }

    private var canMoveForward: Bool {
        selectedMonth < (Calendar.current.dateInterval(of: .month, for: Date())?.start ?? Date())
    }

    private func moveMonth(by value: Int) {
        guard let month = Calendar.current.date(byAdding: .month, value: value, to: selectedMonth) else { return }
        selectedMonth = month
    }

    private func filtered(_ entries: [NativeLedgerItem]) -> [NativeLedgerItem] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return entries.filter { entry in
            let kindMatches = selectedKind == .all || entry.kind == selectedKind.rawValue
            let category = IOSBudgetFormat.categoryTitle(entry).lowercased()
            let searchMatches = query.isEmpty
                || entry.title.lowercased().contains(query)
                || category.contains(query)
                || (entry.memo?.lowercased().contains(query) == true)
            return kindMatches && searchMatches
        }
    }

    private func filteredCategories(_ summary: NativeBudgetSummary) -> [NativeBudgetCategoryTotal] {
        summary.categoryTotals
            .filter { selectedKind == .all || $0.kind == selectedKind.rawValue }
            .sorted { $0.amount > $1.amount }
    }

    private func loadSelectedMonth(force: Bool = false) async {
        let key = IOSBudgetFormat.monthKey(selectedMonth)
        let currentKey = IOSBudgetFormat.monthKey(Date())

        if !force, key == currentKey, let cached = store.budgetSummary {
            summary = cached
            errorMessage = store.domainErrors[.budget]
            return
        }

#if DEBUG
        if CommandLine.arguments.contains("-GLEAUMPreviewBudget") {
            summary = store.budgetSummary
            return
        }
#endif

        isLoading = true
        defer { isLoading = false }
        do {
            let loaded = try await NativeAPIClient.shared.fetchBudgetSummary(month: key)
            summary = loaded
            errorMessage = nil
            if key == currentKey {
                store.applyBudgetSummary(loaded)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func reloadAfterMutation() async {
        await loadSelectedMonth(force: true)
        await store.refresh(domains: [.home])
    }
}
