import SwiftUI

struct IOSBudgetEditorNavigationView: View {
    @ObservedObject var store: StartupSnapshotStore
    let kind: IOSBudgetKind
    let entry: NativeLedgerItem?
    var onSaved: (() -> Void)?

    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    IOSBudgetEditorView(store: store, initialKind: kind, entry: entry, onSaved: onSaved)
                }
            } else {
                NavigationView {
                    IOSBudgetEditorView(store: store, initialKind: kind, entry: entry, onSaved: onSaved)
                }
                .navigationViewStyle(.stack)
            }
        }
    }
}

private struct IOSBudgetEditorView: View {
    @ObservedObject var store: StartupSnapshotStore
    let entry: NativeLedgerItem?
    var onSaved: (() -> Void)?

    @Environment(\.dismiss) private var dismiss
    @Environment(\.sizeCategory) private var sizeCategory

    @State private var kind: IOSBudgetKind
    @State private var title: String
    @State private var amountText: String
    @State private var category: String
    @State private var method: String
    @State private var occurredAt: Date
    @State private var recurrence: IOSBudgetRecurrence
    @State private var memo: String
    @State private var isSaving = false
    @State private var errorMessage: String?
    @FocusState private var titleFocused: Bool

    init(
        store: StartupSnapshotStore,
        initialKind: IOSBudgetKind,
        entry: NativeLedgerItem?,
        onSaved: (() -> Void)? = nil
    ) {
        self.store = store
        self.entry = entry
        self.onSaved = onSaved

        let resolvedKind = entry.flatMap { IOSBudgetKind(rawValue: $0.kind) } ?? initialKind
        let categories = IOSBudgetCatalog.categories(for: resolvedKind)
        _kind = State(initialValue: resolvedKind)
        _title = State(initialValue: entry?.title ?? "")
        _amountText = State(initialValue: entry.map { String($0.amount) } ?? "")
        _category = State(initialValue: entry?.category ?? categories.first?.id ?? "other")
        _method = State(initialValue: entry?.method ?? "card")
        _occurredAt = State(initialValue: entry?.budgetDate ?? Date())
        _recurrence = State(initialValue: IOSBudgetRecurrence(rawValue: entry?.recurFreq ?? "none") ?? .none)
        _memo = State(initialValue: entry?.memo ?? "")
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
                Picker("거래 구분", selection: $kind) {
                    ForEach(IOSBudgetKind.allCases) { option in
                        Text(option.title).tag(option)
                    }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .accessibilityLabel("거래 구분")

                TextField(kind == .income ? "수입 항목" : "지출 항목", text: $title)
                    .focused($titleFocused)
                    .submitLabel(.next)

                HStack {
                    TextField("금액", text: $amountText)
                        .keyboardType(.numberPad)
                        .accessibilityLabel("금액")
                    Text("원")
                        .foregroundStyle(.secondary)
                }
            } header: {
                Text("내역")
            }

            Section(header: Text("분류")) {
                Picker("카테고리", selection: $category) {
                    ForEach(IOSBudgetCatalog.categories(for: kind)) { option in
                        Label(option.title, systemImage: option.symbol).tag(option.id)
                    }
                }

                if kind == .expense {
                    Picker("결제 방법", selection: $method) {
                        ForEach(IOSBudgetCatalog.methods) { option in
                            Label(option.title, systemImage: option.symbol).tag(option.id)
                        }
                    }
                }
            }

            Section {
                DatePicker("거래 날짜", selection: $occurredAt, displayedComponents: [.date])

                if sizeCategory.isAccessibilityCategory {
                    Picker("반복", selection: $recurrence) {
                        ForEach(IOSBudgetRecurrence.allCases) { option in
                            Text(option.title).tag(option)
                        }
                    }
                } else {
                    Picker("반복", selection: $recurrence) {
                        ForEach(IOSBudgetRecurrence.allCases) { option in
                            Text(option.title).tag(option)
                        }
                    }
                    .pickerStyle(.segmented)
                    .labelsHidden()
                    .accessibilityLabel("반복 주기")
                }
            } header: {
                Text("날짜와 반복")
            } footer: {
                Text(recurrence == .none
                     ? "한 번 기록한 내역은 즉시 완료로 반영됩니다."
                     : "정기 항목은 설정한 주기에 맞춰 예정 내역으로 생성됩니다.")
            }

            Section(header: Text("메모")) {
                TextEditor(text: $memo)
                    .frame(minHeight: 96)
                    .accessibilityLabel("가계부 메모")
            }

            Section {
                Label(
                    "이 내역은 나만 볼 수 있는 개인 가계부에 저장됩니다.",
                    systemImage: "lock"
                )
                .font(.footnote)
                .foregroundStyle(.secondary)
            }
        }
        .dynamicTypeSize(.small ... .accessibility2)
        .navigationTitle(entry == nil ? "\(kind.title) 추가" : "내역 편집")
        .navigationBarTitleDisplayMode(.inline)
        .interactiveDismissDisabled(isSaving)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("취소") { dismiss() }
                    .disabled(isSaving)
            }
            ToolbarItem(placement: .confirmationAction) {
                Button(entry == nil ? "추가" : "저장") {
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
            if entry == nil {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                    titleFocused = true
                }
            }
        }
        .onChange(of: amountText) { value in
            let digits = value.filter(\.isNumber)
            if digits != value {
                amountText = digits
            }
        }
        .onChange(of: kind) { newKind in
            let validCategories = IOSBudgetCatalog.categories(for: newKind)
            if !validCategories.contains(where: { $0.id == category }) {
                category = validCategories.first?.id ?? "other"
            }
        }
    }

    private var amount: Int {
        Int(amountText) ?? 0
    }

    private var canSave: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && amount > 0
    }

    private func save() async {
        guard canSave else { return }
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let cleanTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanMemo = memo.trimmingCharacters(in: .whitespacesAndNewlines)
        let occurredAtText = ISO8601DateFormatter.gleaum.string(from: occurredAt)

        do {
            if let entry {
                _ = try await NativeAPIClient.shared.updateLedgerEntry(
                    id: entry.id,
                    payload: NativeUpdateLedgerRequest(
                        kind: kind.rawValue,
                        title: cleanTitle,
                        amount: amount,
                        category: category,
                        method: kind == .expense ? method : nil,
                        occurredAt: occurredAtText,
                        recurFreq: recurrence.rawValue,
                        memo: cleanMemo,
                        status: nil
                    )
                )
            } else {
                _ = try await NativeAPIClient.shared.createLedgerEntry(
                    NativeCreateLedgerRequest(
                        kind: kind.rawValue,
                        title: cleanTitle,
                        amount: amount,
                        category: category,
                        method: kind == .expense ? method : nil,
                        occurredAt: occurredAtText,
                        recurFreq: recurrence.rawValue,
                        memo: cleanMemo.isEmpty ? nil : cleanMemo
                    )
                )
            }

            onSaved?()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct IOSBudgetDetailView: View {
    @ObservedObject var store: StartupSnapshotStore
    let initialEntry: NativeLedgerItem
    var onChanged: (() -> Void)?

    @Environment(\.dismiss) private var dismiss

    @State private var entry: NativeLedgerItem
    @State private var isLoading = false
    @State private var isSavingStatus = false
    @State private var isPresentingEdit = false
    @State private var isConfirmingDelete = false
    @State private var errorMessage: String?

    init(
        store: StartupSnapshotStore,
        initialEntry: NativeLedgerItem,
        onChanged: (() -> Void)? = nil
    ) {
        self.store = store
        self.initialEntry = initialEntry
        self.onChanged = onChanged
        _entry = State(initialValue: initialEntry)
    }

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Label(
                        IOSBudgetFormat.kindTitle(entry.kind),
                        systemImage: entry.kind == "income"
                            ? IOSBudgetKind.income.symbol
                            : IOSBudgetKind.expense.symbol
                    )
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(IOSBudgetFormat.kindColor(entry.kind))

                    Text(entry.title)
                        .font(.title2.bold())
                        .fixedSize(horizontal: false, vertical: true)

                    Text(IOSBudgetFormat.currency(entry.kind == "income" ? entry.amount : -entry.amount, signed: true))
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(IOSBudgetFormat.kindColor(entry.kind))
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

            Section(header: Text("정보")) {
                IOSBudgetValueRow(
                    symbol: "calendar",
                    title: "거래 날짜",
                    value: IOSBudgetFormat.dateTitle(entry)
                )
                IOSBudgetValueRow(
                    symbol: IOSBudgetFormat.categorySymbol(entry),
                    title: "카테고리",
                    value: IOSBudgetFormat.categoryTitle(entry)
                )
                if entry.kind == "expense" {
                    IOSBudgetValueRow(
                        symbol: "creditcard",
                        title: "결제 방법",
                        value: IOSBudgetCatalog.methodTitle(entry.method)
                    )
                }
                IOSBudgetValueRow(
                    symbol: "repeat",
                    title: "반복",
                    value: IOSBudgetFormat.recurrenceTitle(entry.recurFreq)
                )
            }

            if let memo = entry.memo, !memo.isEmpty {
                Section(header: Text("메모")) {
                    Text(memo)
                        .textSelection(.enabled)
                }
            }

            Section(header: Text("상태")) {
                Menu {
                    ForEach(IOSBudgetStatus.allCases) { status in
                        Button {
                            Task { await changeStatus(to: status.rawValue) }
                        } label: {
                            if status.rawValue == entry.status {
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
                            Text(IOSBudgetFormat.statusTitle(entry.status))
                                .foregroundStyle(IOSBudgetFormat.statusColor(entry.status))
                        }
                    }
                }
                .disabled(isSavingStatus)
            }

            Section {
                Button("내역 삭제", role: .destructive) {
                    isConfirmingDelete = true
                }
                .frame(maxWidth: .infinity, alignment: .center)
            }
        }
        .listStyle(.insetGrouped)
        .dynamicTypeSize(.small ... .accessibility2)
        .navigationTitle("가계부 상세")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("편집") {
                    isPresentingEdit = true
                }
            }
        }
        .overlay {
            if isLoading {
                ProgressView()
                    .padding(16)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
        }
        .task(id: initialEntry.id) {
            await loadDetail()
        }
        .sheet(isPresented: $isPresentingEdit) {
            IOSBudgetEditorNavigationView(
                store: store,
                kind: IOSBudgetKind(rawValue: entry.kind) ?? .expense,
                entry: entry
            ) {
                Task {
                    await loadDetail()
                    onChanged?()
                }
            }
        }
        .confirmationDialog(
            "내역을 삭제할까요?",
            isPresented: $isConfirmingDelete,
            titleVisibility: .visible
        ) {
            Button("삭제", role: .destructive) {
                Task { await deleteEntry() }
            }
            Button("취소", role: .cancel) {}
        } message: {
            Text(entry.recurFreq == "none"
                 ? "삭제한 내역은 복구할 수 없습니다."
                 : "이 정기 내역을 삭제하면 현재 항목만 제거됩니다.")
        }
    }

    private func loadDetail() async {
#if DEBUG
        if CommandLine.arguments.contains("-GLEAUMPreviewBudget") {
            return
        }
#endif
        isLoading = true
        defer { isLoading = false }
        do {
            entry = try await NativeAPIClient.shared.fetchLedgerEntry(id: initialEntry.id)
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func changeStatus(to status: String) async {
        guard status != entry.status else { return }
        isSavingStatus = true
        defer { isSavingStatus = false }
        do {
            entry = try await NativeAPIClient.shared.updateLedgerEntry(
                id: entry.id,
                payload: NativeUpdateLedgerRequest(
                    kind: nil,
                    title: nil,
                    amount: nil,
                    category: nil,
                    method: nil,
                    occurredAt: nil,
                    recurFreq: nil,
                    memo: nil,
                    status: status
                )
            )
            errorMessage = nil
            onChanged?()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func deleteEntry() async {
        isLoading = true
        do {
            try await NativeAPIClient.shared.deleteLedgerEntry(id: entry.id)
            onChanged?()
            dismiss()
        } catch {
            isLoading = false
            errorMessage = error.localizedDescription
        }
    }
}
