import SwiftUI

/// SF Symbols는 codepoint가 아니라 이름으로 관리합니다.
enum GleaumSymbol: String {
    case home = "house"
    case homeSelected = "house.fill"
    case schedule = "calendar"
    case space = "person.2"
    case spaceSelected = "person.2.fill"
    case budget = "creditcard"
    case budgetSelected = "creditcard.fill"
    case menu = "line.3.horizontal"
    case notification = "bell"
    case notificationSelected = "bell.fill"
    case add = "plus"
    case refresh = "arrow.clockwise"
    case warning = "exclamationmark.triangle"
    case empty = "tray"

    var image: Image {
        Image(systemName: rawValue)
    }
}

enum GleaumPhoneSection: String, CaseIterable, Identifiable {
    case home
    case schedule
    case space
    case budget
    case menu

    var id: Self { self }

    var title: LocalizedStringKey {
        switch self {
        case .home:
            return "홈"
        case .schedule:
            return "일정"
        case .space:
            return "공간"
        case .budget:
            return "가계부"
        case .menu:
            return "전체"
        }
    }

    var symbol: GleaumSymbol {
        switch self {
        case .home:
            return .home
        case .schedule:
            return .schedule
        case .space:
            return .space
        case .budget:
            return .budget
        case .menu:
            return .menu
        }
    }

    var selectedSymbol: GleaumSymbol {
        switch self {
        case .home:
            return .homeSelected
        case .schedule:
            return .schedule
        case .space:
            return .spaceSelected
        case .budget:
            return .budgetSelected
        case .menu:
            return .menu
        }
    }
}
