import SwiftUI
import UIKit

enum IOSFamilyRoute: Identifiable, Equatable {
    case manage(spaceId: String)
    case claim(token: String)
    case consent(token: String)

    var id: String {
        switch self {
        case .manage(let spaceId):
            return "manage-\(spaceId)"
        case .claim(let token):
            return "claim-\(token)"
        case .consent(let token):
            return "consent-\(token)"
        }
    }
}

struct IOSFamilyRouteContainer: View {
    let route: IOSFamilyRoute
    @ObservedObject var appModel: IOSAppModel
    @ObservedObject var store: StartupSnapshotStore

    var body: some View {
        switch route {
        case .manage(let spaceId):
            IOSFamilyChildNavigationView(
                store: store,
                spaceId: spaceId,
                spaceName: store.spaceSummary?.spaces.first(where: { $0.id == spaceId })?.name
                    ?? "가족 공간"
            )
        case .claim(let token):
            IOSChildClaimNavigationView(
                invitationToken: token,
                signedInEmail: appModel.onboardingProfile?.email
            )
        case .consent(let token):
            IOSGuardianConsentEntryNavigationView(challengeToken: token)
        }
    }
}

struct IOSFamilyInviteChooser: View {
    @ObservedObject var store: StartupSnapshotStore
    let space: NativeSpaceListItem

    @Environment(\.dismiss) private var dismiss
    @State private var destination: IOSFamilyInviteDestination?

    var body: some View {
        NavigationView {
            List {
                Section {
                    Button {
                        destination = .general
                    } label: {
                        IOSFamilyActionRow(
                            symbol: "person.badge.plus",
                            title: "일반 가족 구성원",
                            message: "배우자, 부모님 등 성인 가족에게 공간 코드나 링크를 보냅니다."
                        )
                    }
                    .buttonStyle(.plain)

                    Button {
                        destination = .child
                    } label: {
                        IOSFamilyActionRow(
                            symbol: "figure.and.child.holdinghands",
                            title: "자녀",
                            message: "보호자 확인과 동의 후 자녀 계정을 안전하게 연결합니다."
                        )
                    }
                    .buttonStyle(.plain)
                } header: {
                    Text("누구를 초대하나요?")
                } footer: {
                    Text("공간 권한과 가족 관계는 별도로 관리됩니다. 자녀는 보호자 최종 승인 전까지 공간 정보에 접근할 수 없습니다.")
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("가족 초대")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
            }
            .sheet(item: $destination) { destination in
                switch destination {
                case .general:
                    IOSSpaceInviteView(store: store, space: space)
                case .child:
                    IOSFamilyChildNavigationView(
                        store: store,
                        spaceId: space.id,
                        spaceName: space.name
                    )
                }
            }
        }
        .navigationViewStyle(.stack)
    }
}

private enum IOSFamilyInviteDestination: String, Identifiable {
    case general
    case child

    var id: String { rawValue }
}

private struct IOSFamilyActionRow: View {
    let symbol: String
    let title: String
    let message: String

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: symbol)
                .font(.title3)
                .foregroundStyle(Color(uiColor: GleaumUIColor.brandTeal))
                .frame(width: 38, height: 38)
                .background(Color(uiColor: GleaumUIColor.brandTeal).opacity(0.12))
                .clipShape(Circle())
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 8)
            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 7)
        .contentShape(Rectangle())
    }
}

struct IOSFamilyChildNavigationView: View {
    @ObservedObject var store: StartupSnapshotStore
    let spaceId: String
    let spaceName: String

    var body: some View {
        Group {
            if #available(iOS 16.0, *) {
                NavigationStack {
                    IOSFamilyChildManagementView(
                        store: store,
                        spaceId: spaceId,
                        spaceName: spaceName
                    )
                }
            } else {
                NavigationView {
                    IOSFamilyChildManagementView(
                        store: store,
                        spaceId: spaceId,
                        spaceName: spaceName
                    )
                }
                .navigationViewStyle(.stack)
            }
        }
    }
}

private struct IOSFamilyChildManagementView: View {
    @ObservedObject var store: StartupSnapshotStore
    let spaceId: String
    let spaceName: String

    @Environment(\.dismiss) private var dismiss
    @StateObject private var model: IOSFamilyChildViewModel
    @State private var showsRegistration = false
    @State private var guardianFlow: IOSGuardianFlowItem?
    @State private var shareItem: IOSChildShareItem?
    @State private var confirmation: IOSChildConfirmation?

    init(store: StartupSnapshotStore, spaceId: String, spaceName: String) {
        self.store = store
        self.spaceId = spaceId
        self.spaceName = spaceName
        _model = StateObject(
            wrappedValue: IOSFamilyChildViewModel(
                spaceId: spaceId,
                usesPreviewData: CommandLine.arguments.contains("-GLEAUMPreviewFamily")
            )
        )
    }

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 10) {
                    Label("보호자가 연결을 끝까지 확인합니다", systemImage: "lock.shield")
                        .font(.headline)
                    Text("자녀 정보를 등록한 뒤 보호자 이메일 확인과 필수 동의를 완료해야 초대 링크를 만들 수 있습니다.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    HStack(spacing: 8) {
                        IOSFamilyStep(symbol: "person.crop.circle.badge.plus", title: "등록")
                        IOSFamilyStep(symbol: "envelope.badge", title: "확인")
                        IOSFamilyStep(symbol: "link", title: "초대")
                        IOSFamilyStep(symbol: "checkmark.shield", title: "승인")
                    }
                }
                .padding(.vertical, 5)
            }

            if model.dependents.isEmpty, !model.isLoading {
                Section {
                    VStack(spacing: 10) {
                        Image(systemName: "person.2")
                            .font(.system(size: 30))
                            .foregroundStyle(.secondary)
                        Text("등록된 자녀가 없어요")
                            .font(.headline)
                        Text("자녀 기본 정보를 먼저 등록해 주세요.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 28)
                }
            } else {
                Section("자녀 계정") {
                    ForEach(model.dependents) { dependent in
                        IOSFamilyDependentRow(
                            dependent: dependent,
                            isBusy: model.isBusy,
                            onPrimaryAction: {
                                handlePrimaryAction(dependent)
                            },
                            onReject: dependent.status == "approval_pending"
                                ? { confirmation = IOSChildConfirmation(kind: .reject, dependent: dependent) }
                                : nil
                        )
                    }
                }
            }

            Section {
                Label(
                    "위치 수집과 공유는 현재 자녀 연결 절차에 포함되지 않습니다.",
                    systemImage: "location.slash"
                )
                .font(.footnote)
                .foregroundStyle(.secondary)
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("자녀 계정")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("닫기") { dismiss() }
            }
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showsRegistration = true
                } label: {
                    Label("자녀 등록", systemImage: "plus")
                }
                .disabled(model.isBusy)
            }
        }
        .refreshable {
            await model.load(force: true)
        }
        .task {
            await model.load()
        }
        .overlay {
            if model.isLoading, model.dependents.isEmpty {
                ProgressView("자녀 정보를 불러오는 중이에요")
            }
        }
        .alert("작업을 완료하지 못했어요", isPresented: model.errorBinding) {
            Button("확인", role: .cancel) {}
        } message: {
            Text(model.errorMessage ?? "잠시 후 다시 시도해 주세요.")
        }
        .sheet(isPresented: $showsRegistration) {
            IOSChildRegistrationNavigationView(spaceId: spaceId) {
                await model.load(force: true)
            }
        }
        .sheet(item: $guardianFlow) { item in
            IOSGuardianVerificationNavigationView(
                dependent: item.dependent,
                initialChallenge: item.challenge
            ) {
                await model.load(force: true)
            }
        }
        .sheet(item: $shareItem) { item in
            IOSActivityView(items: [item.shareText])
        }
        .confirmationDialog(
            confirmation?.title ?? "",
            isPresented: confirmationBinding,
            titleVisibility: .visible
        ) {
            if let confirmation {
                Button(confirmation.actionTitle, role: confirmation.kind == .reject ? .destructive : nil) {
                    Task {
                        await model.resolve(
                            dependent: confirmation.dependent,
                            approve: confirmation.kind == .approve
                        )
                        await refreshSpacesAfterApprovalIfNeeded(confirmation)
                    }
                }
            }
            Button("취소", role: .cancel) {}
        } message: {
            Text(confirmation?.message ?? "")
        }
    }

    private func handlePrimaryAction(_ dependent: NativeFamilyDependent) {
        switch dependent.status {
        case "consent_pending":
            Task {
                if let challenge = await model.startGuardianVerification(for: dependent) {
                    guardianFlow = IOSGuardianFlowItem(
                        dependent: dependent,
                        challenge: challenge
                    )
                }
            }
        case "ready", "invited":
            Task {
                if let invitation = await model.createInvitation(for: dependent) {
                    shareItem = IOSChildShareItem(
                        dependentName: dependent.displayName,
                        invitation: invitation
                    )
                }
            }
        case "approval_pending":
            confirmation = IOSChildConfirmation(kind: .approve, dependent: dependent)
        default:
            break
        }
    }

    private func refreshSpacesAfterApprovalIfNeeded(_ confirmation: IOSChildConfirmation) async {
        guard confirmation.kind == .approve, model.errorMessage == nil else { return }
        await store.refresh(domains: [.spaces, .home, .schedules])
    }

    private var confirmationBinding: Binding<Bool> {
        Binding(
            get: { confirmation != nil },
            set: { if !$0 { confirmation = nil } }
        )
    }
}

private struct IOSFamilyStep: View {
    let symbol: String
    let title: String

    var body: some View {
        VStack(spacing: 5) {
            Image(systemName: symbol)
                .foregroundStyle(Color(uiColor: GleaumUIColor.brandTeal))
            Text(title)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
    }
}

private struct IOSFamilyDependentRow: View {
    let dependent: NativeFamilyDependent
    let isBusy: Bool
    let onPrimaryAction: () -> Void
    let onReject: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 11) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "person.crop.circle")
                    .font(.title3)
                    .foregroundStyle(Color(uiColor: GleaumUIColor.brandBlue))
                    .frame(width: 38, height: 38)
                    .background(Color(uiColor: GleaumUIColor.brandBlue).opacity(0.11))
                    .clipShape(Circle())
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 3) {
                    Text(dependent.displayName)
                        .font(.headline)
                    Text(accountDescription)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }

                Spacer(minLength: 8)
                Text(IOSFamilyChildFormat.statusTitle(dependent.status))
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(statusColor)
                    .multilineTextAlignment(.trailing)
            }

            Text(IOSFamilyChildFormat.statusMessage(dependent.status))
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            if let primaryTitle = IOSFamilyChildFormat.primaryActionTitle(dependent.status) {
                if let onReject {
                    HStack(spacing: 10) {
                        Button("거절", role: .destructive, action: onReject)
                            .buttonStyle(.bordered)
                            .disabled(isBusy)
                        Button(primaryTitle, action: onPrimaryAction)
                            .buttonStyle(.borderedProminent)
                            .tint(Color(uiColor: GleaumUIColor.brandTeal))
                            .disabled(isBusy)
                    }
                } else {
                    Button(primaryTitle, action: onPrimaryAction)
                        .buttonStyle(.borderedProminent)
                        .tint(Color(uiColor: GleaumUIColor.brandTeal))
                        .disabled(isBusy)
                }
            } else if dependent.status == "linked" {
                Label("가족 공간 연결 완료", systemImage: "checkmark.circle.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.green)
            }
        }
        .padding(.vertical, 5)
        .accessibilityElement(children: .contain)
    }

    private var accountDescription: String {
        dependent.candidateEmail
            ?? dependent.expectedEmail
            ?? "\(IOSFamilyChildFormat.birthDate(dependent.birthDate)) · 초대 수락 후 계정 확인"
    }

    private var statusColor: Color {
        switch dependent.status {
        case "linked": return .green
        case "approval_pending": return .orange
        case "suspended": return .red
        default: return Color(uiColor: GleaumUIColor.brandBlue)
        }
    }
}

@MainActor
private final class IOSFamilyChildViewModel: ObservableObject {
    @Published private(set) var dependents: [NativeFamilyDependent] = []
    @Published private(set) var isLoading = false
    @Published private(set) var isBusy = false
    @Published var errorMessage: String?

    let spaceId: String
    private let usesPreviewData: Bool
    private var didLoad = false

    init(spaceId: String, usesPreviewData: Bool) {
        self.spaceId = spaceId
        self.usesPreviewData = usesPreviewData
    }

    func load(force: Bool = false) async {
        guard force || !didLoad else { return }
        didLoad = true
        errorMessage = nil

        if usesPreviewData {
            dependents = Self.previewDependents
            return
        }

        isLoading = true
        defer { isLoading = false }
        do {
            dependents = try await NativeAPIClient.shared.fetchFamilyDependents(spaceId: spaceId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func startGuardianVerification(
        for dependent: NativeFamilyDependent
    ) async -> NativeGuardianChallenge? {
        guard !isBusy else { return nil }
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }
        do {
            return try await NativeAPIClient.shared.startGuardianVerification(for: dependent)
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }

    func createInvitation(for dependent: NativeFamilyDependent) async -> NativeChildInvitation? {
        guard !isBusy else { return nil }
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }
        do {
            let invitation = try await NativeAPIClient.shared.createChildInvitation(
                dependentId: dependent.id
            )
            await load(force: true)
            return invitation
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }

    func resolve(dependent: NativeFamilyDependent, approve: Bool) async {
        guard !isBusy else { return }
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }
        do {
            if approve {
                try await NativeAPIClient.shared.approveChildLink(dependentId: dependent.id)
            } else {
                try await NativeAPIClient.shared.rejectChildLink(dependentId: dependent.id)
            }
            await load(force: true)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    var errorBinding: Binding<Bool> {
        Binding(
            get: { self.errorMessage != nil },
            set: { if !$0 { self.errorMessage = nil } }
        )
    }

    private static let previewDependents = [
        NativeFamilyDependent(
            id: "preview-consent",
            spaceId: "preview-family-space",
            displayName: "서윤",
            birthDate: "2017-04-12",
            expectedEmail: nil,
            candidateEmail: nil,
            candidateProvider: nil,
            status: "consent_pending"
        ),
        NativeFamilyDependent(
            id: "preview-ready",
            spaceId: "preview-family-space",
            displayName: "도윤",
            birthDate: "2013-09-03",
            expectedEmail: "child@gleaum.com",
            candidateEmail: nil,
            candidateProvider: nil,
            status: "ready"
        ),
        NativeFamilyDependent(
            id: "preview-approval",
            spaceId: "preview-family-space",
            displayName: "하린",
            birthDate: "2011-11-24",
            expectedEmail: nil,
            candidateEmail: "harin@example.com",
            candidateProvider: "google",
            status: "approval_pending"
        ),
    ]
}

private struct IOSGuardianFlowItem: Identifiable {
    let dependent: NativeFamilyDependent
    let challenge: NativeGuardianChallenge

    var id: String { challenge.challengeToken }
}

private struct IOSChildShareItem: Identifiable {
    let id = UUID()
    let dependentName: String
    let invitation: NativeChildInvitation

    var shareText: String {
        """
        글리움 가족 공간에 초대합니다.

        \(dependentName) 님이 사용할 계정으로 아래 링크를 열어 연결을 요청해 주세요.
        \(invitation.inviteUrl)

        이 링크는 72시간 동안 한 번만 사용할 수 있으며 보호자 최종 승인 전에는 공간 정보가 공개되지 않습니다.
        """
    }
}

private struct IOSChildConfirmation: Identifiable {
    enum Kind {
        case approve
        case reject
    }

    let id = UUID()
    let kind: Kind
    let dependent: NativeFamilyDependent

    var title: String {
        kind == .approve ? "자녀 계정 연결 승인" : "연결 요청 거절"
    }

    var actionTitle: String {
        kind == .approve ? "최종 승인" : "거절"
    }

    var message: String {
        if kind == .approve {
            return "\(dependent.candidateEmail ?? dependent.displayName) 계정을 확인하고 가족 공간 연결을 승인할까요?"
        }
        return "이 계정의 연결 요청을 거절할까요? 이후 새 초대 링크를 다시 보낼 수 있습니다."
    }
}
