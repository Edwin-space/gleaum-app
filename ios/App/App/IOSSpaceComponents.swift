import SwiftUI
import UIKit

struct IOSSpaceMemberRow: View {
    let member: NativeSpaceMemberItem
    let isFamily: Bool

    var body: some View {
        HStack(spacing: 12) {
            IOSSpaceAvatar(member: member)

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 5) {
                    Text(member.displayName)
                        .font(.body)
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                    if member.isMe {
                        Text("나")
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(Color(uiColor: GleaumUIColor.brandTeal))
                    }
                }

                Text(member.email)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            Spacer(minLength: 8)

            Text(
                isFamily
                    ? IOSSpaceFormat.familyRoleTitle(member.familyRole)
                    : IOSSpaceFormat.roleTitle(member.role)
            )
            .font(.caption)
            .foregroundStyle(.secondary)
            .multilineTextAlignment(.trailing)
        }
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
    }
}

struct IOSSpaceAvatar: View {
    let member: NativeSpaceMemberItem

    var body: some View {
        Group {
            if let raw = member.avatar, let url = URL(string: raw) {
                AsyncImage(url: url) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    initials
                }
            } else {
                initials
            }
        }
        .frame(width: 38, height: 38)
        .clipShape(Circle())
        .accessibilityHidden(true)
    }

    private var initials: some View {
        ZStack {
            Color(uiColor: .tertiarySystemFill)
            Text(String(member.displayName.prefix(1)))
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
        }
    }
}

struct IOSSpacePostRow: View {
    let post: NativeSpacePostItem

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                if post.pinned {
                    Image(systemName: "pin.fill")
                        .foregroundStyle(Color(uiColor: GleaumUIColor.brandTeal))
                        .accessibilityLabel("고정된 소식")
                }
                Text(post.authorName)
                    .font(.subheadline.weight(.semibold))
                Spacer()
                Text(IOSSpaceFormat.relativeDate(post.createdAt))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Text(post.content)
                .font(.body)
                .foregroundStyle(.primary)
                .fixedSize(horizontal: false, vertical: true)

            if post.commentCount > 0 {
                Label("\(post.commentCount)", systemImage: "bubble.left")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
    }
}

struct IOSSpaceScheduleRow: View {
    let schedule: NativeScheduleItem

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "calendar")
                .foregroundStyle(Color(uiColor: GleaumUIColor.brandBlue))
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 3) {
                Text(schedule.title)
                    .font(.body)
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                Text(IOSSpaceFormat.scheduleDate(schedule))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 3)
        .accessibilityElement(children: .combine)
    }
}

struct IOSSpaceEmptyState: View {
    let symbol: String
    let title: String
    let message: String
    let actionTitle: String?
    let action: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.system(size: 30))
                .foregroundStyle(.secondary)
            Text(title)
                .font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            if let actionTitle {
                Button(actionTitle, action: action)
                    .buttonStyle(.borderedProminent)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 30)
    }
}

struct IOSActivityView: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

enum IOSSpaceFormat {
    static let spaceRoles = [
        (value: "admin", title: "공간 지기"),
        (value: "editor", title: "공간 운영자"),
        (value: "viewer", title: "공간 멤버"),
    ]

    static let familyRoles = [
        (value: "father", title: "아빠"),
        (value: "mother", title: "엄마"),
        (value: "grandfather", title: "할아버지"),
        (value: "grandmother", title: "할머니"),
        (value: "spouse", title: "배우자"),
        (value: "son", title: "아들"),
        (value: "daughter", title: "딸"),
        (value: "sibling", title: "형제·자매"),
        (value: "guardian", title: "보호자"),
        (value: "family", title: "가족"),
        (value: "other", title: "기타"),
    ]

    static func symbol(for space: NativeSpaceListItem) -> String {
        switch space.spaceKind {
        case "personal": return "person.crop.circle"
        case "family": return "house"
        default: return "person.2"
        }
    }

    static func kindTitle(_ kind: String) -> String {
        switch kind {
        case "personal": return "개인 공간"
        case "family": return "가족 공간"
        default: return "공유 공간"
        }
    }

    static func roleTitle(_ role: String) -> String {
        spaceRoles.first(where: { $0.value == role })?.title ?? "공간 멤버"
    }

    static func familyRoleTitle(_ role: String?) -> String {
        guard let role else { return "가족" }
        return familyRoles.first(where: { $0.value == role })?.title ?? "가족"
    }

    static func relativeDate(_ raw: String) -> String {
        guard let date = ISO8601DateFormatter.gleaum.date(from: raw) else { return "" }
        let formatter = RelativeDateTimeFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }

    static func scheduleDate(_ schedule: NativeScheduleItem) -> String {
        guard let date = ISO8601DateFormatter.gleaum.date(from: schedule.startTime) else {
            return "날짜 확인 필요"
        }
        if schedule.allDay {
            return "\(DateFormatter.gleaumDay.string(from: date)) · 종일"
        }
        return "\(DateFormatter.gleaumDay.string(from: date)) · \(DateFormatter.gleaumTime.string(from: date))"
    }
}
