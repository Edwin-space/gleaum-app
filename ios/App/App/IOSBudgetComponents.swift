import SwiftUI

enum IOSBudgetKind: String, CaseIterable, Identifiable {
    case income
    case expense

    var id: String { rawValue }

    var title: String {
        switch self {
        case .income: return "수입"
        case .expense: return "지출"
        }
    }

    var symbol: String {
        switch self {
        case .income: return "arrow.down.circle.fill"
        case .expense: return "arrow.up.circle.fill"
        }
    }

    var color: Color {
        switch self {
        case .income: return .green
        case .expense: return .orange
        }
    }
}

enum IOSBudgetKindFilter: String, CaseIterable, Identifiable {
    case all
    case income
    case expense

    var id: String { rawValue }

    var title: String {
        switch self {
        case .all: return "전체"
        case .income: return "수입"
        case .expense: return "지출"
        }
    }
}

enum IOSBudgetRecurrence: String, CaseIterable, Identifiable {
    case none
    case weekly
    case monthly
    case yearly

    var id: String { rawValue }

    var title: String {
        switch self {
        case .none: return "한 번"
        case .weekly: return "매주"
        case .monthly: return "매월"
        case .yearly: return "매년"
        }
    }
}

enum IOSBudgetStatus: String, CaseIterable, Identifiable {
    case pending
    case completed
    case skipped

    var id: String { rawValue }
    var title: String { IOSBudgetFormat.statusTitle(rawValue) }
}

struct IOSBudgetCategory: Identifiable, Hashable {
    let id: String
    let title: String
    let symbol: String
}

enum IOSBudgetCatalog {
    static let expenseCategories = [
        IOSBudgetCategory(id: "food", title: "식비", symbol: "fork.knife"),
        IOSBudgetCategory(id: "daily", title: "생활/마트", symbol: "cart"),
        IOSBudgetCategory(id: "fashion", title: "패션/잡화", symbol: "tshirt"),
        IOSBudgetCategory(id: "transport", title: "교통/차량", symbol: "car"),
        IOSBudgetCategory(id: "culture", title: "문화/여가", symbol: "film"),
        IOSBudgetCategory(id: "medical", title: "의료/건강", symbol: "cross.case"),
        IOSBudgetCategory(id: "social", title: "경조사/선물", symbol: "gift"),
        IOSBudgetCategory(id: "housing", title: "주거", symbol: "house"),
        IOSBudgetCategory(id: "insurance", title: "보험", symbol: "shield"),
        IOSBudgetCategory(id: "subscription", title: "구독", symbol: "repeat.circle"),
        IOSBudgetCategory(id: "education", title: "교육", symbol: "book"),
        IOSBudgetCategory(id: "other", title: "기타", symbol: "ellipsis.circle"),
    ]

    static let incomeCategories = [
        IOSBudgetCategory(id: "salary", title: "급여", symbol: "briefcase"),
        IOSBudgetCategory(id: "business", title: "사업/부업", symbol: "building.2"),
        IOSBudgetCategory(id: "investment", title: "금융/투자", symbol: "chart.line.uptrend.xyaxis"),
        IOSBudgetCategory(id: "rental", title: "임대", symbol: "house"),
        IOSBudgetCategory(id: "bonus", title: "상여/보너스", symbol: "star"),
        IOSBudgetCategory(id: "refund", title: "환급", symbol: "arrow.uturn.backward.circle"),
        IOSBudgetCategory(id: "pension", title: "연금/지원금", symbol: "banknote"),
        IOSBudgetCategory(id: "gift", title: "용돈/선물", symbol: "gift"),
        IOSBudgetCategory(id: "other_income", title: "기타", symbol: "ellipsis.circle"),
    ]

    static let methods = [
        IOSBudgetCategory(id: "card", title: "카드", symbol: "creditcard"),
        IOSBudgetCategory(id: "auto", title: "자동이체", symbol: "arrow.triangle.2.circlepath"),
        IOSBudgetCategory(id: "cash", title: "현금", symbol: "banknote"),
        IOSBudgetCategory(id: "other", title: "기타", symbol: "ellipsis.circle"),
    ]

    static func categories(for kind: IOSBudgetKind) -> [IOSBudgetCategory] {
        kind == .income ? incomeCategories : expenseCategories
    }

    static func category(id: String, kind: String) -> IOSBudgetCategory {
        let source = kind == IOSBudgetKind.income.rawValue ? incomeCategories : expenseCategories
        return source.first(where: { $0.id == id })
            ?? IOSBudgetCategory(id: id, title: id, symbol: "tag")
    }

    static func methodTitle(_ id: String?) -> String {
        guard let id else { return "미지정" }
        return methods.first(where: { $0.id == id })?.title ?? id
    }
}

enum IOSBudgetFormat {
    static func currency(_ amount: Int, signed: Bool = false) -> String {
        let number = NSNumber(value: abs(amount))
        let formatted = currencyFormatter.string(from: number) ?? "\(abs(amount))원"
        guard signed else { return formatted }
        if amount > 0 { return "+\(formatted)" }
        if amount < 0 { return "−\(formatted)" }
        return formatted
    }

    static func monthKey(_ date: Date) -> String {
        monthKeyFormatter.string(from: date)
    }

    static func monthTitle(_ date: Date) -> String {
        monthTitleFormatter.string(from: date)
    }

    static func dateTitle(_ entry: NativeLedgerItem) -> String {
        guard let date = entry.budgetDate else { return "날짜 정보 없음" }
        return dateFormatter.string(from: date)
    }

    static func categoryTitle(_ entry: NativeLedgerItem) -> String {
        IOSBudgetCatalog.category(id: entry.category, kind: entry.kind).title
    }

    static func categorySymbol(_ entry: NativeLedgerItem) -> String {
        IOSBudgetCatalog.category(id: entry.category, kind: entry.kind).symbol
    }

    static func kindTitle(_ kind: String) -> String {
        kind == IOSBudgetKind.income.rawValue ? "수입" : "지출"
    }

    static func kindColor(_ kind: String) -> Color {
        kind == IOSBudgetKind.income.rawValue ? .green : .orange
    }

    static func recurrenceTitle(_ value: String) -> String {
        IOSBudgetRecurrence(rawValue: value)?.title ?? "한 번"
    }

    static func statusTitle(_ value: String) -> String {
        switch value {
        case "completed": return "완료"
        case "skipped": return "건너뜀"
        default: return "예정"
        }
    }

    static func statusColor(_ value: String) -> Color {
        switch value {
        case "completed": return .green
        case "skipped": return .secondary
        default: return .orange
        }
    }

    static func accessibilityLabel(_ entry: NativeLedgerItem) -> String {
        let sign = entry.kind == "income" ? "수입" : "지출"
        return "\(entry.title), \(sign) \(currency(entry.amount)), \(categoryTitle(entry)), \(dateTitle(entry)), \(statusTitle(entry.status))"
    }

    private static let currencyFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "KRW"
        formatter.currencySymbol = "₩"
        formatter.maximumFractionDigits = 0
        return formatter
    }()

    private static let monthKeyFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.dateFormat = "yyyy-MM"
        return formatter
    }()

    private static let monthTitleFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.dateFormat = "yyyy년 M월"
        return formatter
    }()

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.dateFormat = "M월 d일 EEEE"
        return formatter
    }()
}

struct IOSBudgetEntryRow: View {
    let entry: NativeLedgerItem
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
        .accessibilityLabel(IOSBudgetFormat.accessibilityLabel(entry))
    }

    private var compactLayout: some View {
        HStack(spacing: 12) {
            categoryIcon
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.title)
                    .font(.body)
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                Text("\(IOSBudgetFormat.categoryTitle(entry)) · \(IOSBudgetFormat.dateTitle(entry))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Spacer(minLength: 8)
            VStack(alignment: .trailing, spacing: 4) {
                Text(IOSBudgetFormat.currency(entry.kind == "income" ? entry.amount : -entry.amount, signed: true))
                    .font(.body.weight(.semibold))
                    .foregroundStyle(IOSBudgetFormat.kindColor(entry.kind))
                Text(IOSBudgetFormat.statusTitle(entry.status))
                    .font(.caption2)
                    .foregroundStyle(IOSBudgetFormat.statusColor(entry.status))
            }
        }
    }

    private var accessibilityLayout: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                categoryIcon
                Text(entry.title)
                    .font(.body)
                    .fixedSize(horizontal: false, vertical: true)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(IOSBudgetFormat.currency(entry.kind == "income" ? entry.amount : -entry.amount, signed: true))
                    .font(.body.weight(.semibold))
                    .foregroundStyle(IOSBudgetFormat.kindColor(entry.kind))
                Text(IOSBudgetFormat.categoryTitle(entry))
                Text(IOSBudgetFormat.dateTitle(entry))
                Text(IOSBudgetFormat.statusTitle(entry.status))
            }
            .font(.caption)
            .foregroundStyle(.secondary)
            .padding(.leading, 46)
        }
    }

    private var categoryIcon: some View {
        let color = IOSBudgetFormat.kindColor(entry.kind)
        return Image(systemName: IOSBudgetFormat.categorySymbol(entry))
            .font(.body.weight(.semibold))
            .foregroundStyle(color)
            .frame(width: 34, height: 34)
            .background(color.opacity(0.12))
            .clipShape(Circle())
            .accessibilityHidden(true)
    }
}

struct IOSBudgetValueRow: View {
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

struct IOSBudgetMessageView: View {
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

extension NativeLedgerItem {
    var budgetDate: Date? {
        ISO8601DateFormatter.gleaum.date(from: occurredAt)
            ?? ISO8601DateFormatter.gleaumBudgetWithoutFractionalSeconds.date(from: occurredAt)
    }
}

private extension ISO8601DateFormatter {
    static let gleaumBudgetWithoutFractionalSeconds: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()
}
