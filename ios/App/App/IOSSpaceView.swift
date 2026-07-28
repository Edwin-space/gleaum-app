import SwiftUI
import UIKit

struct IOSSpaceNavigationView: View {
    @ObservedObject var store: StartupSnapshotStore

    @State private var presentedSheet: IOSSpaceSheet?
    @State private var isSwitchingSpace = false
    @State private var errorMessage: String?

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
        .sheet(item: $presentedSheet) { sheet in
            sheetView(sheet)
        }
        .alert("작업을 완료하지 못했어요", isPresented: errorBinding) {
            Button("확인", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "잠시 후 다시 시도해 주세요.")
        }
    }

    private var content: some View {
        List {
            if let summary = store.spaceSummary, let activeSpace = summary.activeSpace {
                activeSpaceSection(summary, activeSpace: activeSpace)
                upcomingScheduleSection(summary)
                if !activeSpace.isPersonal {
                    postSection(summary, activeSpace: activeSpace)
                }
            } else if let error = store.domainErrors[.spaces] {
                Section {
                    IOSSpaceEmptyState(
                        symbol: "person.2.slash",
                        title: "공간을 불러오지 못했어요",
                        message: error,
                        actionTitle: "다시 시도"
                    ) {
                        Task { await store.refresh(domains: [.spaces]) }
                    }
                }
                .listRowBackground(Color.clear)
            } else if store.state == .loading {
                Section {
                    HStack(spacing: 12) {
                        ProgressView()
                        Text("공간 정보를 불러오는 중이에요")
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 28)
                }
                .listRowBackground(Color.clear)
            } else {
                Section {
                    IOSSpaceEmptyState(
                        symbol: "person.2",
                        title: "사용할 공간이 없어요",
                        message: "새 공유 공간을 만들거나 초대 코드로 참여해 보세요.",
                        actionTitle: canManageSpaces ? "공간 만들기" : nil
                    ) {
                        presentedSheet = .create
                    }
                }
                .listRowBackground(Color.clear)
            }
        }
        .listStyle(.insetGrouped)
        .gleaumTabBarScrollTracking(for: .space)
        .navigationTitle("공간")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    if canManageSpaces {
                        Button {
                            presentedSheet = .create
                        } label: {
                            Label("새 공간 만들기", systemImage: "plus")
                        }
                    }
                    if canInviteMembers {
                        Button {
                            presentedSheet = .join
                        } label: {
                            Label("초대 코드로 참여", systemImage: "rectangle.and.pencil.and.ellipsis")
                        }
                    }
                } label: {
                    Label("공간 추가", systemImage: "plus")
                }
                .disabled(!canManageSpaces && !canInviteMembers)
            }
        }
        .refreshable {
            await store.refresh(domains: [.spaces, .home])
        }
        .task {
            await store.prefetch()
        }
    }

    private func activeSpaceSection(
        _ summary: NativeSpaceSummary,
        activeSpace: NativeSpaceListItem
    ) -> some View {
        Section {
            HStack(spacing: 10) {
                Menu {
                    ForEach(summary.spaces) { space in
                        Button {
                            guard !space.isActive else { return }
                            activate(space)
                        } label: {
                            if space.isActive {
                                Label(space.name, systemImage: "checkmark")
                            } else {
                                Text(space.name)
                            }
                        }
                    }
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: IOSSpaceFormat.symbol(for: activeSpace))
                            .font(.body.weight(.semibold))
                            .foregroundStyle(Color(uiColor: GleaumUIColor.brandTeal))
                            .frame(width: 34, height: 34)
                            .background(Color(uiColor: GleaumUIColor.brandTeal).opacity(0.13))
                            .clipShape(Circle())

                        VStack(alignment: .leading, spacing: 2) {
                            Text(activeSpace.name)
                                .font(.body.weight(.semibold))
                                .foregroundStyle(.primary)
                            Text(spaceContext(activeSpace))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }

                        if isSwitchingSpace {
                            ProgressView()
                        } else if summary.spaces.count > 1 {
                            Image(systemName: "chevron.up.chevron.down")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .disabled(isSwitchingSpace || summary.spaces.count < 2)
                .accessibilityLabel("현재 공간 \(activeSpace.name)")
                .accessibilityHint(summary.spaces.count > 1 ? "두 번 탭하여 공간을 전환합니다." : "")

                Spacer(minLength: 6)

                if !activeSpace.isPersonal {
                    spaceActions(summary, activeSpace: activeSpace)
                }
            }
            .padding(.vertical, 2)
        }
        .listRowBackground(Color(uiColor: GleaumUIColor.surface))
    }

    private func upcomingScheduleSection(_ summary: NativeSpaceSummary) -> some View {
        Section("다가오는 일정") {
            if summary.upcomingSchedules.isEmpty {
                Label("등록된 일정이 없어요", systemImage: "calendar")
                    .foregroundStyle(.secondary)
            } else {
                ForEach(summary.upcomingSchedules.prefix(4)) { schedule in
                    NavigationLink {
                        IOSScheduleDetailView(store: store, initialSchedule: schedule)
                    } label: {
                        IOSSpaceScheduleRow(schedule: schedule)
                    }
                }
            }
        }
        .listRowBackground(Color(uiColor: GleaumUIColor.surface))
    }

    private func postSection(
        _ summary: NativeSpaceSummary,
        activeSpace: NativeSpaceListItem
    ) -> some View {
        Section {
            if summary.recentPosts.isEmpty {
                Label("아직 공유된 소식이 없어요", systemImage: "text.bubble")
                    .foregroundStyle(.secondary)
            } else {
                ForEach(summary.recentPosts.prefix(6)) { post in
                    IOSSpacePostRow(post: post)
                }
            }

            Button {
                presentedSheet = .post(space: activeSpace)
            } label: {
                Label("새 소식 작성", systemImage: "square.and.pencil")
            }
        } header: {
            Text("공간 소식")
        }
        .listRowBackground(Color(uiColor: GleaumUIColor.surface))
    }

    @ViewBuilder
    private func sheetView(_ sheet: IOSSpaceSheet) -> some View {
        switch sheet {
        case .create:
            IOSSpaceCreateView(store: store)
        case .join:
            IOSSpaceJoinView(store: store)
        case .post(let space):
            IOSSpacePostComposer(store: store, space: space)
        case .invite(let space):
            IOSSpaceInviteView(store: store, space: space)
        case .familyInvite(let space):
            IOSFamilyInviteChooser(store: store, space: space)
        case .members(let space, let members):
            IOSSpaceMembersView(store: store, space: space, members: members)
        case .member(let space, let member):
            IOSSpaceMemberEditor(store: store, space: space, member: member)
        case .settings(let space):
            IOSSpaceSettingsView(store: store, space: space)
        }
    }

    private var canManageSpaces: Bool {
        store.accountContext?.capabilities.canManageSpaces ?? false
    }

    private var canInviteMembers: Bool {
        store.accountContext?.capabilities.canInviteMembers ?? false
    }

    private func canAdminister(_ space: NativeSpaceListItem) -> Bool {
        canManageSpaces && space.role == "admin"
    }

    private func spaceContext(_ space: NativeSpaceListItem) -> String {
        if space.isPersonal {
            return IOSSpaceFormat.kindTitle(space.spaceKind)
        }
        return "\(IOSSpaceFormat.kindTitle(space.spaceKind)) · \(space.memberCount)명 · \(IOSSpaceFormat.roleTitle(space.role))"
    }

    private func spaceActions(
        _ summary: NativeSpaceSummary,
        activeSpace: NativeSpaceListItem
    ) -> some View {
        Menu {
            Button {
                presentedSheet = .members(space: activeSpace, members: summary.members)
            } label: {
                Label("멤버 \(activeSpace.memberCount)명", systemImage: "person.2")
            }

            if canInviteMembers {
                Button {
                    presentedSheet = activeSpace.spaceKind == "family"
                        ? .familyInvite(space: activeSpace)
                        : .invite(space: activeSpace)
                } label: {
                    Label(
                        activeSpace.spaceKind == "family" ? "가족 초대" : "멤버 초대",
                        systemImage: "person.badge.plus"
                    )
                }
            }

            if canAdminister(activeSpace) {
                Button {
                    presentedSheet = .settings(space: activeSpace)
                } label: {
                    Label("공간 설정", systemImage: "gearshape")
                }
            }
        } label: {
            Image(systemName: "ellipsis.circle")
                .font(.title3)
                .frame(width: 34, height: 34)
                .contentShape(Rectangle())
        }
        .accessibilityLabel("공간 메뉴")
    }

    private func activate(_ space: NativeSpaceListItem) {
        isSwitchingSpace = true
        Task {
            do {
                let summary = try await NativeAPIClient.shared.activateSpace(id: space.id)
                store.applySpaceSummary(summary)
                await store.refresh(domains: [.home, .schedules])
            } catch {
                errorMessage = error.localizedDescription
            }
            isSwitchingSpace = false
        }
    }

    private var errorBinding: Binding<Bool> {
        Binding(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )
    }
}

private enum IOSSpaceSheet: Identifiable {
    case create
    case join
    case post(space: NativeSpaceListItem)
    case invite(space: NativeSpaceListItem)
    case familyInvite(space: NativeSpaceListItem)
    case members(space: NativeSpaceListItem, members: [NativeSpaceMemberItem])
    case member(space: NativeSpaceListItem, member: NativeSpaceMemberItem)
    case settings(space: NativeSpaceListItem)

    var id: String {
        switch self {
        case .create: return "create"
        case .join: return "join"
        case .post(let space): return "post-\(space.id)"
        case .invite(let space): return "invite-\(space.id)"
        case .familyInvite(let space): return "family-invite-\(space.id)"
        case .members(let space, _): return "members-\(space.id)"
        case .member(let space, let member): return "member-\(space.id)-\(member.userId)"
        case .settings(let space): return "settings-\(space.id)"
        }
    }
}
