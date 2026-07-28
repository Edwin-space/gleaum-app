import SwiftUI
import UIKit

struct IOSSpaceCreateView: View {
    @ObservedObject var store: StartupSnapshotStore
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("예: 우리 가족, 프로젝트 팀", text: $name)
                        .textInputAutocapitalization(.words)
                        .submitLabel(.done)
                } header: {
                    Text("공간 이름")
                } footer: {
                    Text("개인 공간 외에 공유 공간은 최대 2개까지 만들거나 참여할 수 있어요.")
                }
            }
            .navigationTitle("새 공간")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("취소") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("만들기") { create() }
                        .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSaving)
                }
            }
            .overlay {
                if isSaving {
                    ProgressView()
                }
            }
            .alert("공간을 만들지 못했어요", isPresented: errorBinding) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
        }
        .navigationViewStyle(.stack)
    }

    private func create() {
        isSaving = true
        Task {
            do {
                let summary = try await NativeAPIClient.shared.createSpace(name: name)
                store.applySpaceSummary(summary)
                await store.refresh(domains: [.home, .schedules])
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
                isSaving = false
            }
        }
    }

    private var errorBinding: Binding<Bool> {
        Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })
    }
}

struct IOSSpaceJoinView: View {
    @ObservedObject var store: StartupSnapshotStore
    @Environment(\.dismiss) private var dismiss

    @State private var code = ""
    @State private var isJoining = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("GLEAUM-XXXXXXXX", text: $code)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        .submitLabel(.join)
                        .onSubmit(join)
                } header: {
                    Text("초대 코드")
                } footer: {
                    Text("공간 지기에게 받은 초대 코드를 입력해 주세요.")
                }
            }
            .navigationTitle("공간 참여")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("취소") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("참여") { join() }
                        .disabled(normalizedCode.isEmpty || isJoining)
                }
            }
            .overlay {
                if isJoining {
                    ProgressView()
                }
            }
            .alert("공간에 참여하지 못했어요", isPresented: errorBinding) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
        }
        .navigationViewStyle(.stack)
    }

    private var normalizedCode: String {
        code.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
    }

    private func join() {
        guard !normalizedCode.isEmpty, !isJoining else { return }
        isJoining = true
        Task {
            do {
                let summary = try await NativeAPIClient.shared.joinSpace(code: normalizedCode)
                store.applySpaceSummary(summary)
                await store.refresh(domains: [.home, .schedules])
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
                isJoining = false
            }
        }
    }

    private var errorBinding: Binding<Bool> {
        Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })
    }
}

struct IOSSpacePostComposer: View {
    @ObservedObject var store: StartupSnapshotStore
    let space: NativeSpaceListItem
    @Environment(\.dismiss) private var dismiss

    @State private var content = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            Form {
                Section {
                    ZStack(alignment: .topLeading) {
                        if content.isEmpty {
                            Text("공간 멤버에게 공유할 내용을 입력하세요.")
                                .foregroundStyle(.tertiary)
                                .padding(.horizontal, 5)
                                .padding(.vertical, 8)
                        }
                        TextEditor(text: $content)
                            .frame(minHeight: 160)
                    }
                } footer: {
                    Text("\(content.count)/2,000")
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
            }
            .navigationTitle("새 소식")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("취소") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("게시") { post() }
                        .disabled(trimmedContent.isEmpty || content.count > 2_000 || isSaving)
                }
            }
            .overlay {
                if isSaving { ProgressView() }
            }
            .alert("소식을 게시하지 못했어요", isPresented: errorBinding) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
        }
        .navigationViewStyle(.stack)
    }

    private var trimmedContent: String {
        content.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func post() {
        isSaving = true
        Task {
            do {
                let summary = try await NativeAPIClient.shared.createSpacePost(
                    spaceId: space.id,
                    content: trimmedContent
                )
                store.applySpaceSummary(summary)
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
                isSaving = false
            }
        }
    }

    private var errorBinding: Binding<Bool> {
        Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })
    }
}

struct IOSSpaceInviteView: View {
    @ObservedObject var store: StartupSnapshotStore
    let space: NativeSpaceListItem
    @Environment(\.dismiss) private var dismiss

    @State private var currentCode: String
    @State private var isRegenerating = false
    @State private var activityItems: [Any] = []
    @State private var errorMessage: String?

    init(store: StartupSnapshotStore, space: NativeSpaceListItem) {
        self.store = store
        self.space = space
        _currentCode = State(initialValue: space.inviteCode ?? "")
    }

    var body: some View {
        NavigationView {
            List {
                Section {
                    Text(currentCode.isEmpty ? "초대 코드 없음" : currentCode)
                        .font(.title3.monospaced().weight(.semibold))
                        .textSelection(.enabled)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.vertical, 14)
                        .accessibilityLabel("초대 코드 \(currentCode)")

                    Button {
                        UIPasteboard.general.string = currentCode
                    } label: {
                        Label("코드만 복사", systemImage: "doc.on.doc")
                    }
                    .disabled(currentCode.isEmpty)

                    Button {
                        activityItems = [inviteMessage]
                    } label: {
                        Label("초대장 공유", systemImage: "square.and.arrow.up")
                    }
                    .disabled(currentCode.isEmpty)
                } header: {
                    Text("초대 코드")
                } footer: {
                    Text("코드 복사는 코드만 저장합니다. 초대장 공유는 링크와 안내 문구를 함께 보냅니다.")
                }

                Section {
                    Button(role: .destructive) {
                        regenerate()
                    } label: {
                        Label("새 초대 코드 발급", systemImage: "arrow.clockwise")
                    }
                    .disabled(isRegenerating)
                } footer: {
                    Text("새 코드를 발급하면 기존 코드는 더 이상 사용할 수 없습니다.")
                }
            }
            .navigationTitle("멤버 초대")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("완료") { dismiss() }
                }
            }
            .overlay {
                if isRegenerating { ProgressView() }
            }
            .sheet(isPresented: activityBinding) {
                IOSActivityView(items: activityItems)
            }
            .alert("초대 코드를 변경하지 못했어요", isPresented: errorBinding) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
        }
        .navigationViewStyle(.stack)
    }

    private var inviteMessage: String {
        """
        \(space.name)에 초대합니다.

        초대 코드: \(currentCode)
        초대 링크: https://www.gleaum.com/invite/\(currentCode)
        """
    }

    private func regenerate() {
        isRegenerating = true
        Task {
            do {
                let summary = try await NativeAPIClient.shared.regenerateInviteCode(spaceId: space.id)
                store.applySpaceSummary(summary)
                currentCode = summary.activeSpace?.inviteCode ?? ""
            } catch {
                errorMessage = error.localizedDescription
            }
            isRegenerating = false
        }
    }

    private var activityBinding: Binding<Bool> {
        Binding(
            get: { !activityItems.isEmpty },
            set: { if !$0 { activityItems = [] } }
        )
    }

    private var errorBinding: Binding<Bool> {
        Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })
    }
}

struct IOSSpaceMemberEditor: View {
    @ObservedObject var store: StartupSnapshotStore
    let space: NativeSpaceListItem
    let member: NativeSpaceMemberItem
    @Environment(\.dismiss) private var dismiss

    @State private var selectedRole: String
    @State private var selectedFamilyRole: String
    @State private var isSaving = false
    @State private var showingRemoveConfirmation = false
    @State private var errorMessage: String?

    init(store: StartupSnapshotStore, space: NativeSpaceListItem, member: NativeSpaceMemberItem) {
        self.store = store
        self.space = space
        self.member = member
        _selectedRole = State(initialValue: member.role)
        _selectedFamilyRole = State(initialValue: member.familyRole ?? "family")
    }

    var body: some View {
        NavigationView {
            Form {
                Section {
                    IOSSpaceMemberRow(member: member, isFamily: space.spaceKind == "family")
                }

                Section("공간 권한") {
                    Picker("역할", selection: $selectedRole) {
                        ForEach(IOSSpaceFormat.spaceRoles, id: \.value) { item in
                            Text(item.title).tag(item.value)
                        }
                    }
                    .disabled(member.isMe)
                }

                if space.spaceKind == "family" {
                    Section("가족 관계") {
                        Picker("관계", selection: $selectedFamilyRole) {
                            ForEach(IOSSpaceFormat.familyRoles, id: \.value) { item in
                                Text(item.title).tag(item.value)
                            }
                        }
                    }
                }

                if !member.isMe {
                    Section {
                        Button("공간에서 내보내기", role: .destructive) {
                            showingRemoveConfirmation = true
                        }
                    }
                }
            }
            .navigationTitle("멤버 관리")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("취소") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("저장") { save() }
                        .disabled(isSaving || !hasChanges)
                }
            }
            .overlay {
                if isSaving { ProgressView() }
            }
            .confirmationDialog(
                "이 멤버를 공간에서 내보낼까요?",
                isPresented: $showingRemoveConfirmation,
                titleVisibility: .visible
            ) {
                Button("내보내기", role: .destructive) { remove() }
                Button("취소", role: .cancel) {}
            } message: {
                Text("해당 멤버는 이 공간의 소식과 일정을 더 이상 볼 수 없습니다.")
            }
            .alert("멤버 정보를 변경하지 못했어요", isPresented: errorBinding) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
        }
        .navigationViewStyle(.stack)
    }

    private var hasChanges: Bool {
        selectedRole != member.role
            || (space.spaceKind == "family" && selectedFamilyRole != (member.familyRole ?? "family"))
    }

    private func save() {
        isSaving = true
        Task {
            do {
                var summary: NativeSpaceSummary?
                if selectedRole != member.role {
                    summary = try await NativeAPIClient.shared.updateSpaceMemberRole(
                        spaceId: space.id,
                        userId: member.userId,
                        role: selectedRole
                    )
                }
                if space.spaceKind == "family",
                   selectedFamilyRole != (member.familyRole ?? "family") {
                    summary = try await NativeAPIClient.shared.updateSpaceMemberFamilyRole(
                        spaceId: space.id,
                        userId: member.userId,
                        familyRole: selectedFamilyRole
                    )
                }
                if let summary {
                    store.applySpaceSummary(summary)
                }
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
                isSaving = false
            }
        }
    }

    private func remove() {
        isSaving = true
        Task {
            do {
                let summary = try await NativeAPIClient.shared.removeSpaceMember(
                    spaceId: space.id,
                    userId: member.userId
                )
                store.applySpaceSummary(summary)
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
                isSaving = false
            }
        }
    }

    private var errorBinding: Binding<Bool> {
        Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })
    }
}

struct IOSSpaceSettingsView: View {
    @ObservedObject var store: StartupSnapshotStore
    let space: NativeSpaceListItem
    @Environment(\.dismiss) private var dismiss

    @State private var name: String
    @State private var isSaving = false
    @State private var confirmation: IOSSpaceSettingsConfirmation?
    @State private var errorMessage: String?

    init(store: StartupSnapshotStore, space: NativeSpaceListItem) {
        self.store = store
        self.space = space
        _name = State(initialValue: space.name)
    }

    var body: some View {
        NavigationView {
            Form {
                Section("공간 정보") {
                    TextField("공간 이름", text: $name)
                }

                if space.spaceKind == "general" {
                    Section {
                        Button {
                            confirmation = .family
                        } label: {
                            Label("가족 공간으로 전환", systemImage: "house")
                        }
                    } footer: {
                        Text("가족 관계 역할과 가족 전용 기능을 사용할 수 있습니다. 전환 후 일반 공간으로 되돌릴 수 없습니다.")
                    }
                }

                Section {
                    Button("공간 삭제", role: .destructive) {
                        confirmation = .delete
                    }
                } footer: {
                    Text("다른 멤버나 연결된 가족 구성원이 있으면 삭제할 수 없습니다.")
                }
            }
            .navigationTitle("공간 설정")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("취소") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("저장") { saveName() }
                        .disabled(
                            isSaving
                                || name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                                || name == space.name
                        )
                }
            }
            .overlay {
                if isSaving { ProgressView() }
            }
            .confirmationDialog(
                confirmationTitle,
                isPresented: confirmationBinding,
                titleVisibility: .visible
            ) {
                if confirmation == .family {
                    Button("가족 공간으로 전환") { convertToFamily() }
                } else if confirmation == .delete {
                    Button("공간 삭제", role: .destructive) { deleteSpace() }
                }
                Button("취소", role: .cancel) {}
            } message: {
                Text(confirmationMessage)
            }
            .alert("공간 설정을 변경하지 못했어요", isPresented: errorBinding) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
        }
        .navigationViewStyle(.stack)
    }

    private var confirmationTitle: String {
        confirmation == .family ? "가족 공간으로 전환할까요?" : "공간을 삭제할까요?"
    }

    private var confirmationMessage: String {
        confirmation == .family
            ? "공간 ID와 기존 일정·소식은 유지되며 가족 관계 설정이 추가됩니다."
            : "삭제한 공간과 연결 정보는 되돌릴 수 없습니다."
    }

    private func saveName() {
        isSaving = true
        Task {
            do {
                let summary = try await NativeAPIClient.shared.updateSpaceName(id: space.id, name: name)
                store.applySpaceSummary(summary)
                await store.refresh(domains: [.home])
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
                isSaving = false
            }
        }
    }

    private func convertToFamily() {
        isSaving = true
        Task {
            do {
                let summary = try await NativeAPIClient.shared.convertSpaceToFamily(id: space.id)
                store.applySpaceSummary(summary)
                await store.refresh(domains: [.home])
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
                isSaving = false
            }
        }
    }

    private func deleteSpace() {
        isSaving = true
        Task {
            do {
                let summary = try await NativeAPIClient.shared.deleteSpace(id: space.id)
                store.applySpaceSummary(summary)
                await store.refresh(domains: [.home, .schedules])
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
                isSaving = false
            }
        }
    }

    private var confirmationBinding: Binding<Bool> {
        Binding(get: { confirmation != nil }, set: { if !$0 { confirmation = nil } })
    }

    private var errorBinding: Binding<Bool> {
        Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })
    }
}

enum IOSSpaceSettingsConfirmation {
    case family
    case delete
}
