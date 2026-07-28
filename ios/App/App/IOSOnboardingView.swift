import SwiftUI

struct IOSOnboardingView: View {
    let onCompleted: (NativeProfileSummary) async -> Void

    @StateObject private var model: IOSOnboardingViewModel
    @FocusState private var focusedField: NameField?

    private enum NameField {
        case displayName
        case realName
    }

    init(
        profile: NativeProfileSummary?,
        onCompleted: @escaping (NativeProfileSummary) async -> Void
    ) {
        self.onCompleted = onCompleted
        _model = StateObject(wrappedValue: IOSOnboardingViewModel(profile: profile))
    }

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
        ZStack {
            Color(uiColor: GleaumUIColor.background)
                .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    onboardingHeader

                    Group {
                        switch model.step {
                        case .name:
                            nameStep
                        case .goal:
                            goalStep
                        case .layout:
                            layoutStep
                        case .notifications:
                            notificationStep
                        }
                    }
                    .frame(maxWidth: GleaumIOSMetric.readableContentWidth)
                    .frame(maxWidth: .infinity)
                }
                .padding(.horizontal, GleaumIOSMetric.pageHorizontalPadding)
                .padding(.top, 18)
                .padding(.bottom, 28)
            }
        }
        .safeAreaInset(edge: .bottom) {
            actionBar
        }
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("완료") {
                    focusedField = nil
                }
            }
        }
    }

    private var onboardingHeader: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Image("Splash")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 30, height: 30)
                    .accessibilityLabel("글리움")

                Spacer()

                Text("\(model.step.number) / \(IOSOnboardingStep.allCases.count)")
                    .font(.subheadline.monospacedDigit())
                    .foregroundStyle(Color(uiColor: GleaumUIColor.subtleText))
            }

            ProgressView(
                value: Double(model.step.number),
                total: Double(IOSOnboardingStep.allCases.count)
            )
            .tint(Color(uiColor: GleaumUIColor.brandTeal))

            VStack(alignment: .leading, spacing: 8) {
                Text(model.step.eyebrow)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Color(uiColor: GleaumUIColor.brandTeal))

                Text(model.step.title)
                    .font(.largeTitle.bold())
                    .foregroundStyle(Color(uiColor: GleaumUIColor.text))

                Text(model.step.description)
                    .font(.body)
                    .foregroundStyle(Color(uiColor: GleaumUIColor.mutedText))
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var nameStep: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 8) {
                Text("앱에서 사용할 이름")
                    .font(.headline)
                    .foregroundStyle(Color(uiColor: GleaumUIColor.text))

                TextField("닉네임 또는 이름", text: $model.displayName)
                    .textContentType(.nickname)
                    .submitLabel(.next)
                    .focused($focusedField, equals: .displayName)
                    .onSubmit {
                        focusedField = .realName
                    }
                    .onChange(of: model.displayName) { value in
                        if value.count > 24 {
                            model.displayName = String(value.prefix(24))
                        }
                    }
                    .onboardingFieldStyle()

                Text("\(model.displayName.count)/24")
                    .font(.caption)
                    .foregroundStyle(Color(uiColor: GleaumUIColor.subtleText))
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("실명")
                    .font(.headline)
                    .foregroundStyle(Color(uiColor: GleaumUIColor.text))

                TextField("선택 입력", text: $model.realName)
                    .textContentType(.name)
                    .submitLabel(.done)
                    .focused($focusedField, equals: .realName)
                    .onSubmit {
                        focusedField = nil
                    }
                    .onChange(of: model.realName) { value in
                        if value.count > 40 {
                            model.realName = String(value.prefix(40))
                        }
                    }
                    .onboardingFieldStyle()

                Text("실명은 직접 선택한 경우에만 다른 화면에서 사용합니다.")
                    .font(.caption)
                    .foregroundStyle(Color(uiColor: GleaumUIColor.subtleText))
            }

            VStack(alignment: .leading, spacing: 10) {
                Text("기본 표시 방식")
                    .font(.headline)
                    .foregroundStyle(Color(uiColor: GleaumUIColor.text))

                Picker("기본 표시 방식", selection: $model.nameDisplayMode) {
                    Text("닉네임").tag("nickname")
                    Text("실명").tag("real_name")
                }
                .pickerStyle(.segmented)

                if model.nameDisplayMode == "real_name" && model.realName.trimmed.isEmpty {
                    Label("실명 표시를 사용하려면 실명을 입력해 주세요.", systemImage: "info.circle")
                        .font(.caption)
                        .foregroundStyle(Color(uiColor: GleaumUIColor.mutedText))
                }
            }
        }
    }

    private var goalStep: some View {
        OnboardingSelectionGroup {
            ForEach(IOSOnboardingGoal.allCases) { goal in
                OnboardingSelectionRow(
                    icon: goal.icon,
                    title: goal.title,
                    description: goal.description,
                    isSelected: model.primaryGoal == goal
                ) {
                    model.selectGoal(goal)
                }

                if goal != IOSOnboardingGoal.allCases.last {
                    Divider()
                        .padding(.leading, 58)
                }
            }
        }
    }

    private var layoutStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            OnboardingSelectionGroup {
                ForEach(IOSHomeLayoutChoice.allCases) { layout in
                    OnboardingSelectionRow(
                        icon: layout.icon,
                        title: layout.title,
                        description: layout.description,
                        isSelected: model.homeLayout == layout
                    ) {
                        model.homeLayout = layout
                    }

                    if layout != IOSHomeLayoutChoice.allCases.last {
                        Divider()
                            .padding(.leading, 58)
                    }
                }
            }

            Label(
                "홈 구성은 전체 메뉴에서 언제든 변경할 수 있어요.",
                systemImage: "slider.horizontal.3"
            )
            .font(.footnote)
            .foregroundStyle(Color(uiColor: GleaumUIColor.mutedText))
        }
    }

    private var notificationStep: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(spacing: 0) {
                onboardingToggle(
                    title: "일정 알림",
                    description: "일정 시작 전에 알려드려요.",
                    systemImage: "calendar.badge.clock",
                    isOn: $model.scheduleReminders
                )
                Divider().padding(.leading, 58)
                onboardingToggle(
                    title: "루틴 알림",
                    description: "꾸준한 실행을 놓치지 않게 도와드려요.",
                    systemImage: "checkmark.circle",
                    isOn: $model.routineReminders
                )
                Divider().padding(.leading, 58)
                onboardingToggle(
                    title: "가계부 알림",
                    description: "정기 수입과 지출 예정일을 알려드려요.",
                    systemImage: "creditcard",
                    isOn: $model.expenseReminders
                )
                Divider().padding(.leading, 58)
                onboardingToggle(
                    title: "공간 소식",
                    description: "초대와 중요한 공간 변경을 알려드려요.",
                    systemImage: "person.2",
                    isOn: $model.spaceUpdates
                )
            }
            .background(Color(uiColor: GleaumUIColor.surface))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Color(uiColor: GleaumUIColor.border), lineWidth: 1)
            }

            Label(
                "알림 권한은 실제 알림이 필요할 때 iOS가 별도로 요청합니다.",
                systemImage: "bell.badge"
            )
            .font(.footnote)
            .foregroundStyle(Color(uiColor: GleaumUIColor.mutedText))

            if let message = model.errorMessage {
                Label(message, systemImage: "exclamationmark.circle.fill")
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .accessibilityElement(children: .combine)
            }
        }
    }

    private func onboardingToggle(
        title: String,
        description: String,
        systemImage: String,
        isOn: Binding<Bool>
    ) -> some View {
        Toggle(isOn: isOn) {
            HStack(spacing: 14) {
                Image(systemName: systemImage)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(Color(uiColor: GleaumUIColor.brandBlue))
                    .frame(width: 30, height: 30)

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Color(uiColor: GleaumUIColor.text))
                    Text(description)
                        .font(.caption)
                        .foregroundStyle(Color(uiColor: GleaumUIColor.mutedText))
                }
            }
        }
        .tint(Color(uiColor: GleaumUIColor.brandTeal))
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }

    private var actionBar: some View {
        HStack(spacing: 12) {
            if model.step != .name {
                Button {
                    model.goBack()
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.headline)
                        .frame(width: 48, height: 50)
                }
                .buttonStyle(.bordered)
                .tint(Color(uiColor: GleaumUIColor.mutedText))
                .accessibilityLabel("이전 단계")
                .disabled(model.isSubmitting)
            }

            Button {
                focusedField = nil
                if model.step == .notifications {
                    Task {
                        if let profile = await model.complete() {
                            await onCompleted(profile)
                        }
                    }
                } else {
                    model.goForward()
                }
            } label: {
                ZStack {
                    Text(model.step == .notifications ? "글리움 시작하기" : "계속")
                        .font(.headline)
                        .opacity(model.isSubmitting ? 0 : 1)

                    if model.isSubmitting {
                        ProgressView()
                            .tint(.white)
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
            }
            .buttonStyle(.borderedProminent)
            .buttonBorderShape(.roundedRectangle(radius: GleaumIOSMetric.controlCornerRadius))
            .tint(Color(uiColor: GleaumUIColor.brandBlue))
            .disabled(!model.canContinue || model.isSubmitting)
        }
        .padding(.horizontal, GleaumIOSMetric.pageHorizontalPadding)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial)
    }
}

private struct OnboardingSelectionGroup<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        VStack(spacing: 0) {
            content
        }
        .background(Color(uiColor: GleaumUIColor.surface))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color(uiColor: GleaumUIColor.border), lineWidth: 1)
        }
    }
}

private struct OnboardingSelectionRow: View {
    let icon: String
    let title: String
    let description: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(
                        isSelected
                            ? Color(uiColor: GleaumUIColor.brandBlue)
                            : Color(uiColor: GleaumUIColor.mutedText)
                    )
                    .frame(width: 30, height: 30)
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Color(uiColor: GleaumUIColor.text))
                    Text(description)
                        .font(.caption)
                        .foregroundStyle(Color(uiColor: GleaumUIColor.mutedText))
                }

                Spacer(minLength: 12)

                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(
                        isSelected
                            ? Color(uiColor: GleaumUIColor.brandTeal)
                            : Color(uiColor: GleaumUIColor.subtleText)
                    )
                    .accessibilityHidden(true)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityValue(isSelected ? "선택됨" : "선택 안 됨")
    }
}

private enum IOSOnboardingStep: Int, CaseIterable {
    case name
    case goal
    case layout
    case notifications

    var number: Int { rawValue + 1 }

    var eyebrow: String {
        switch self {
        case .name: return "이름"
        case .goal: return "사용 목적"
        case .layout: return "홈 구성"
        case .notifications: return "알림"
        }
    }

    var title: String {
        switch self {
        case .name: return "어떻게 불러드릴까요?"
        case .goal: return "무엇을 중심으로 관리할까요?"
        case .layout: return "어떤 홈이 편한가요?"
        case .notifications: return "중요한 순간을 알려드릴게요"
        }
    }

    var description: String {
        switch self {
        case .name:
            return "기본은 닉네임이며, 원하면 실명을 선택해서 사용할 수 있어요."
        case .goal:
            return "지금 가장 필요한 기능을 선택하면 홈 구성을 먼저 맞춰드려요."
        case .layout:
            return "선택한 순서에 따라 홈에서 먼저 보이는 정보가 달라져요."
        case .notifications:
            return "필요한 항목만 선택하고 언제든 설정에서 바꿀 수 있어요."
        }
    }
}

private enum IOSOnboardingGoal: String, CaseIterable, Identifiable {
    case personalSchedule = "personal_schedule"
    case routine
    case expense
    case group

    var id: String { rawValue }

    var title: String {
        switch self {
        case .personalSchedule: return "개인 일정"
        case .routine: return "루틴 관리"
        case .expense: return "자금 관리"
        case .group: return "소중한 사람과 함께"
        }
    }

    var description: String {
        switch self {
        case .personalSchedule: return "오늘과 앞으로의 일정을 먼저 확인해요."
        case .routine: return "반복되는 습관과 실행을 꾸준히 관리해요."
        case .expense: return "수입과 지출 흐름을 중심으로 확인해요."
        case .group: return "연인·가족·친구와 공유할 정보를 먼저 봐요."
        }
    }

    var icon: String {
        switch self {
        case .personalSchedule: return "calendar"
        case .routine: return "checkmark.circle"
        case .expense: return "wonsign.circle"
        case .group: return "person.2"
        }
    }

    var suggestedLayout: IOSHomeLayoutChoice {
        switch self {
        case .personalSchedule: return .calendar
        case .routine: return .routine
        case .expense: return .expense
        case .group: return .space
        }
    }

    var enabledModules: [String] {
        switch self {
        case .personalSchedule:
            return ["calendar"]
        case .routine:
            return ["calendar", "routine"]
        case .expense:
            return ["calendar", "expense"]
        case .group:
            return ["calendar", "spaces", "expense"]
        }
    }
}

private enum IOSHomeLayoutChoice: String, CaseIterable, Identifiable {
    case balanced
    case calendar = "calendar_first"
    case routine = "routine_first"
    case expense = "expense_first"
    case space = "space_first"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .balanced: return "균형 있게"
        case .calendar: return "일정 먼저"
        case .routine: return "루틴 먼저"
        case .expense: return "자금 흐름 먼저"
        case .space: return "공간 소식 먼저"
        }
    }

    var description: String {
        switch self {
        case .balanced: return "일정·공간·가계부를 고르게 보여줘요."
        case .calendar: return "오늘 일정과 캘린더를 가장 먼저 보여줘요."
        case .routine: return "오늘 해야 할 루틴을 앞에 배치해요."
        case .expense: return "이번 달 수입과 지출을 먼저 보여줘요."
        case .space: return "함께하는 공간의 소식을 먼저 보여줘요."
        }
    }

    var icon: String {
        switch self {
        case .balanced: return "square.grid.2x2"
        case .calendar: return "calendar"
        case .routine: return "checklist"
        case .expense: return "chart.line.uptrend.xyaxis"
        case .space: return "person.2"
        }
    }
}

@MainActor
private final class IOSOnboardingViewModel: ObservableObject {
    @Published var step: IOSOnboardingStep = .name
    @Published var displayName: String
    @Published var realName: String
    @Published var nameDisplayMode: String
    @Published var primaryGoal: IOSOnboardingGoal = .personalSchedule
    @Published var homeLayout: IOSHomeLayoutChoice = .calendar
    @Published var scheduleReminders = true
    @Published var routineReminders = true
    @Published var expenseReminders = true
    @Published var spaceUpdates = true
    @Published private(set) var isSubmitting = false
    @Published private(set) var errorMessage: String?

    init(profile: NativeProfileSummary?) {
        let suggestedName = profile?.displayName.trimmed
        displayName = suggestedName?.isEmpty == false
            ? suggestedName!
            : profile?.email.split(separator: "@").first.map(String.init) ?? ""
        realName = profile?.realName ?? ""
        nameDisplayMode = profile?.nameDisplayMode == "real_name" ? "real_name" : "nickname"

        if let settings = profile?.notificationSettings {
            scheduleReminders = settings.scheduleReminders
            routineReminders = settings.routineReminders
            expenseReminders = settings.expenseReminders
            spaceUpdates = settings.spaceUpdates
        }
    }

    var canContinue: Bool {
        switch step {
        case .name:
            let nameIsValid = !displayName.trimmed.isEmpty && displayName.count <= 24
            let realNameIsValid = nameDisplayMode != "real_name" || !realName.trimmed.isEmpty
            return nameIsValid && realNameIsValid
        case .goal, .layout, .notifications:
            return true
        }
    }

    func selectGoal(_ goal: IOSOnboardingGoal) {
        primaryGoal = goal
        homeLayout = goal.suggestedLayout
    }

    func goForward() {
        guard canContinue,
              let next = IOSOnboardingStep(rawValue: step.rawValue + 1) else {
            return
        }
        errorMessage = nil
        step = next
    }

    func goBack() {
        guard let previous = IOSOnboardingStep(rawValue: step.rawValue - 1) else {
            return
        }
        errorMessage = nil
        step = previous
    }

    func complete() async -> NativeProfileSummary? {
        guard canContinue, !isSubmitting else { return nil }
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }

        let request = NativeCompleteOnboardingRequest(
            displayName: displayName.trimmed,
            realName: realName.trimmed.isEmpty ? nil : realName.trimmed,
            nameDisplayMode: nameDisplayMode,
            primaryGoal: primaryGoal.rawValue,
            homeLayout: homeLayout.rawValue,
            enabledModules: primaryGoal.enabledModules,
            defaultReminderMinutes: 30,
            spaceIntent: ["solo"],
            notificationSettings: NativeNotificationSettings(
                scheduleReminders: scheduleReminders,
                routineReminders: routineReminders,
                expenseReminders: expenseReminders,
                spaceUpdates: spaceUpdates
            ),
            timezone: TimeZone.current.identifier,
            locale: Locale.current.identifier.replacingOccurrences(of: "_", with: "-")
        )

        do {
            return try await NativeAPIClient.shared.completeOnboarding(request)
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }
}

private extension View {
    func onboardingFieldStyle() -> some View {
        self
            .font(.body)
            .foregroundStyle(Color(uiColor: GleaumUIColor.text))
            .padding(.horizontal, 16)
            .frame(height: GleaumIOSMetric.textFieldHeight)
            .background(Color(uiColor: GleaumUIColor.surface))
            .clipShape(
                RoundedRectangle(
                    cornerRadius: GleaumIOSMetric.controlCornerRadius,
                    style: .continuous
                )
            )
            .overlay {
                RoundedRectangle(
                    cornerRadius: GleaumIOSMetric.controlCornerRadius,
                    style: .continuous
                )
                .stroke(Color(uiColor: GleaumUIColor.border), lineWidth: 1)
            }
    }
}

private extension String {
    var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
