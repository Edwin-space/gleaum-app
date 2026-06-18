import UIKit
import UserNotifications

final class NativeHomeViewController: UIViewController {
    private let scrollView = UIScrollView()
    private let stack = UIStackView()
    private let bottomNavContainer = UIVisualEffectView(effect: UIBlurEffect(style: .systemUltraThinMaterialDark))
    private let bottomNav = UIStackView()
    private let refreshControl = UIRefreshControl()
    private var summary: NativeHomeSummary?

    private let bg = UIColor(red: 0.059, green: 0.090, blue: 0.165, alpha: 1)
    private let surface = UIColor(red: 0.082, green: 0.118, blue: 0.200, alpha: 1)
    private let surface2 = UIColor(red: 0.102, green: 0.145, blue: 0.235, alpha: 1)
    private let text = UIColor.white
    private let muted = UIColor(red: 0.800, green: 0.835, blue: 0.882, alpha: 1)
    private let subtle = UIColor(red: 0.580, green: 0.640, blue: 0.720, alpha: 1)
    private let blue = UIColor(red: 0.000, green: 0.518, blue: 0.800, alpha: 1)
    private let teal = UIColor(red: 0.047, green: 0.788, blue: 0.710, alpha: 1)
    private let green = UIColor(red: 0.180, green: 0.910, blue: 0.584, alpha: 1)

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = bg
        setupScroll()
        renderLoading()
        loadSummary()
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    private func setupScroll() {
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.alwaysBounceVertical = true
        scrollView.refreshControl = refreshControl
        refreshControl.tintColor = teal
        refreshControl.addTarget(self, action: #selector(refreshPulled), for: .valueChanged)

        stack.axis = .vertical
        stack.spacing = 18
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.layoutMargins = UIEdgeInsets(top: 18, left: 20, bottom: 36, right: 20)
        stack.isLayoutMarginsRelativeArrangement = true

        setupBottomNav()

        view.addSubview(scrollView)
        view.addSubview(bottomNavContainer)
        scrollView.addSubview(stack)

        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: view.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: bottomNavContainer.topAnchor),

            bottomNavContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            bottomNavContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            bottomNavContainer.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -8),
            bottomNavContainer.heightAnchor.constraint(equalToConstant: 66),

            bottomNav.topAnchor.constraint(equalTo: bottomNavContainer.contentView.topAnchor, constant: 6),
            bottomNav.leadingAnchor.constraint(equalTo: bottomNavContainer.contentView.leadingAnchor, constant: 6),
            bottomNav.trailingAnchor.constraint(equalTo: bottomNavContainer.contentView.trailingAnchor, constant: -6),
            bottomNav.bottomAnchor.constraint(equalTo: bottomNavContainer.contentView.bottomAnchor, constant: -6),

            stack.topAnchor.constraint(equalTo: scrollView.contentLayoutGuide.topAnchor),
            stack.leadingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: scrollView.contentLayoutGuide.bottomAnchor),
            stack.widthAnchor.constraint(equalTo: scrollView.frameLayoutGuide.widthAnchor),
        ])
    }

    private func setupBottomNav() {
        bottomNavContainer.translatesAutoresizingMaskIntoConstraints = false
        bottomNavContainer.clipsToBounds = false
        bottomNavContainer.layer.cornerRadius = 30
        bottomNavContainer.layer.masksToBounds = true
        bottomNavContainer.layer.borderWidth = 1
        bottomNavContainer.layer.borderColor = UIColor(white: 1, alpha: 0.10).cgColor
        bottomNavContainer.layer.shadowColor = UIColor.black.cgColor
        bottomNavContainer.layer.shadowOpacity = 0.22
        bottomNavContainer.layer.shadowOffset = CGSize(width: 0, height: 10)
        bottomNavContainer.layer.shadowRadius = 24

        bottomNav.translatesAutoresizingMaskIntoConstraints = false
        bottomNav.axis = .horizontal
        bottomNav.alignment = .center
        bottomNav.distribution = .fillEqually
        bottomNav.spacing = 3
        bottomNavContainer.contentView.addSubview(bottomNav)

        bottomNav.addArrangedSubview(navButton(symbol: "house.fill", title: "홈", active: true) { [weak self] in
            self?.loadSummary()
        })
        bottomNav.addArrangedSubview(navButton(symbol: "calendar", title: "일정", active: false) {
            NativeRouteCoordinator.shared.openWebPath("/schedules")
        })
        bottomNav.addArrangedSubview(navButton(symbol: "person.2", title: "공간", active: false) {
            NativeRouteCoordinator.shared.openWebPath("/space")
        })
        bottomNav.addArrangedSubview(navButton(symbol: "creditcard", title: "가계부", active: false) {
            NativeRouteCoordinator.shared.openWebPath("/budget")
        })
        bottomNav.addArrangedSubview(navButton(symbol: "line.3.horizontal", title: "전체", active: false) {
            NativeRouteCoordinator.shared.openWebPath("/mypage")
        })
    }

    private func navButton(symbol: String, title: String, active: Bool, handler: @escaping () -> Void) -> UIButton {
        var config = UIButton.Configuration.plain()
        config.image = UIImage(systemName: symbol)
        config.imagePlacement = .top
        config.imagePadding = 4
        config.title = title
        config.baseForegroundColor = active ? teal : muted
        config.contentInsets = NSDirectionalEdgeInsets(top: 6, leading: 2, bottom: 5, trailing: 2)
        config.preferredSymbolConfigurationForImage = UIImage.SymbolConfiguration(
            pointSize: active ? 16 : 15,
            weight: active ? .semibold : .regular
        )
        config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
            var outgoing = incoming
            outgoing.font = .systemFont(ofSize: 10.5, weight: active ? .bold : .semibold)
            return outgoing
        }

        let button = UIButton(configuration: config)
        button.layer.cornerRadius = 22
        button.backgroundColor = active ? UIColor(red: 0.000, green: 0.518, blue: 0.800, alpha: 0.22) : .clear
        button.accessibilityLabel = title
        button.accessibilityTraits = active ? [.button, .selected] : [.button]
        button.addAction(UIAction { _ in handler() }, for: .touchUpInside)
        return button
    }

    @objc private func refreshPulled() {
        loadSummary()
    }

    private func loadSummary() {
        Task { [weak self] in
            do {
                let summary = try await NativeAPIClient.shared.fetchHomeSummary()
                await MainActor.run {
                    self?.summary = summary
                    self?.refreshControl.endRefreshing()
                    self?.render(summary)
                }
            } catch {
                await MainActor.run {
                    self?.refreshControl.endRefreshing()
                    if let apiError = error as? NativeAPIError,
                       apiError.shouldFallbackToWebHome {
                        NativeRouteCoordinator.shared.openWebPath("/home")
                        return
                    }
                    self?.renderError(error.localizedDescription)
                }
            }
        }
    }

    private func clear() {
        stack.arrangedSubviews.forEach { view in
            stack.removeArrangedSubview(view)
            view.removeFromSuperview()
        }
    }

    private func renderLoading() {
        clear()
        stack.addArrangedSubview(header(name: "글리움", subtitle: "오늘의 일상을 준비하고 있어요"))
        stack.addArrangedSubview(messageCard(title: "불러오는 중", body: "홈 정보를 가져오고 있습니다."))
    }

    private func renderError(_ message: String) {
        clear()
        stack.addArrangedSubview(header(name: "글리움", subtitle: "연결을 다시 확인해 주세요"))
        stack.addArrangedSubview(messageCard(title: "홈을 불러오지 못했어요", body: message))
        stack.addArrangedSubview(actionButton(title: "다시 시도", color: blue) { [weak self] in self?.loadSummary() })
        stack.addArrangedSubview(actionButton(title: "웹 홈으로 이동", color: teal) {
            NativeRouteCoordinator.shared.openWebPath("/home")
        })
        stack.addArrangedSubview(actionButton(title: "로그아웃", color: UIColor(red: 0.890, green: 0.196, blue: 0.196, alpha: 1)) { [weak self] in self?.logout() })
    }

    private func render(_ summary: NativeHomeSummary) {
        clear()
        stack.addArrangedSubview(header(name: summary.user.displayName, subtitle: summary.spaces.activeSpaceName ?? "나의 공간"))
        stack.addArrangedSubview(totalScheduleCard(summary))
        stack.addArrangedSubview(todayCalendarCard(summary))
        stack.addArrangedSubview(todaySchedulesCard(summary))
        stack.addArrangedSubview(adPlaceholder())
        stack.addArrangedSubview(ledgerCard(summary))
        stack.addArrangedSubview(nativeActions())
    }

    private func header(name: String, subtitle: String) -> UIView {
        let row = UIStackView()
        row.axis = .horizontal
        row.alignment = .center
        row.spacing = 12

        let labels = UIStackView()
        labels.axis = .vertical
        labels.spacing = 6

        let eyebrow = UILabel()
        eyebrow.text = greeting()
        eyebrow.textColor = teal
        eyebrow.font = .systemFont(ofSize: 13, weight: .bold)

        let title = UILabel()
        title.text = "\(name)님"
        title.textColor = text
        title.font = .systemFont(ofSize: 28, weight: .black)
        title.numberOfLines = 1

        let sub = UILabel()
        sub.text = subtitle
        sub.textColor = muted
        sub.font = .systemFont(ofSize: 13, weight: .medium)

        labels.addArrangedSubview(eyebrow)
        labels.addArrangedSubview(title)
        labels.addArrangedSubview(sub)

        let plus = circleButton(title: "+", color: blue)
        plus.addTarget(self, action: #selector(newScheduleTapped), for: .touchUpInside)

        row.addArrangedSubview(labels)
        row.addArrangedSubview(UIView())
        row.addArrangedSubview(plus)
        return row
    }

    private func totalScheduleCard(_ summary: NativeHomeSummary) -> UIView {
        let card = gradientCard()
        let title = cardTitle("종합 일정")
        let sub = cardBody("오늘 \(summary.schedules.todayCount)개 · 앞으로 2주 \(summary.schedules.upcomingCount)개")
        let stats = UIStackView()
        stats.axis = .horizontal
        stats.spacing = 10
        stats.distribution = .fillEqually
        stats.addArrangedSubview(statBox(value: "\(summary.schedules.todayCount)", label: "오늘", color: teal))
        stats.addArrangedSubview(statBox(value: "\(summary.schedules.upcomingCount)", label: "예정", color: blue))
        stats.addArrangedSubview(statBox(value: "\(summary.spaces.memberCount)", label: "멤버", color: green))
        card.addArrangedSubview(title)
        card.addArrangedSubview(sub)
        card.addArrangedSubview(stats)
        return card
    }

    private func todayCalendarCard(_ summary: NativeHomeSummary) -> UIView {
        let card = baseCard()
        let date = DateFormatter.gleaumDay.string(from: Date())
        card.addArrangedSubview(sectionHeader(title: "오늘", action: date, path: "/schedules"))
        let week = UIStackView()
        week.axis = .horizontal
        week.spacing = 8
        week.distribution = .fillEqually
        let calendar = Calendar.current
        for offset in 0..<7 {
            let date = calendar.date(byAdding: .day, value: offset, to: Date()) ?? Date()
            let item = UILabel()
            item.text = DateFormatter.gleaumShortDay.string(from: date)
            item.textColor = offset == 0 ? UIColor.white : muted
            item.textAlignment = .center
            item.font = .systemFont(ofSize: 13, weight: .bold)
            item.backgroundColor = offset == 0 ? blue : surface2
            item.layer.cornerRadius = 18
            item.clipsToBounds = true
            item.heightAnchor.constraint(equalToConstant: 48).isActive = true
            week.addArrangedSubview(item)
        }
        card.addArrangedSubview(week)
        return card
    }

    private func todaySchedulesCard(_ summary: NativeHomeSummary) -> UIView {
        let card = baseCard()
        card.addArrangedSubview(sectionHeader(title: "오늘 일정", action: "+ 새 일정", selector: #selector(newScheduleTapped)))
        if summary.schedules.today.isEmpty {
            card.addArrangedSubview(emptyState("등록된 일정이 없어요", action: "새 일정을 추가해보세요"))
        } else {
            summary.schedules.today.prefix(4).forEach { card.addArrangedSubview(scheduleRow($0)) }
        }
        return card
    }

    private func ledgerCard(_ summary: NativeHomeSummary) -> UIView {
        let card = baseCard()
        card.addArrangedSubview(sectionHeader(title: "가계부", action: "자세히", path: "/budget"))
        let stats = UIStackView()
        stats.axis = .horizontal
        stats.spacing = 10
        stats.distribution = .fillEqually
        stats.addArrangedSubview(statBox(value: won(summary.ledger.incomeTotal), label: "수입", color: green))
        stats.addArrangedSubview(statBox(value: won(summary.ledger.expenseTotal), label: "지출", color: UIColor(red: 0.961, green: 0.620, blue: 0.043, alpha: 1)))
        stats.addArrangedSubview(statBox(value: won(summary.ledger.net), label: "순액", color: teal))
        card.addArrangedSubview(stats)
        if let first = summary.ledger.recentEntries.first {
            card.addArrangedSubview(cardBody("최근: \(first.title) · \(won(first.amount))"))
        } else {
            card.addArrangedSubview(cardBody("이번 달 가계부 기록이 아직 없어요."))
        }
        return card
    }

    private func adPlaceholder() -> UIView {
        let view = UILabel()
        view.text = "Making everyday life shine together"
        view.textColor = UIColor.white
        view.font = .systemFont(ofSize: 15, weight: .bold)
        view.textAlignment = .center
        view.backgroundColor = UIColor(red: 0.000, green: 0.518, blue: 0.800, alpha: 0.30)
        view.layer.cornerRadius = 18
        view.clipsToBounds = true
        view.heightAnchor.constraint(equalToConstant: 58).isActive = true
        return view
    }

    private func nativeActions() -> UIView {
        let card = baseCard()
        card.addArrangedSubview(sectionHeader(title: "앱 설정", action: "웹 설정", path: "/mypage"))
        let row = UIStackView()
        row.axis = .horizontal
        row.spacing = 10
        row.distribution = .fillEqually
        row.addArrangedSubview(smallAction("보안", path: "/settings/security"))
        row.addArrangedSubview(smallAction("알림", handler: { [weak self] in self?.requestNotificationPermission() }))
        row.addArrangedSubview(smallAction("공간", path: "/space"))
        card.addArrangedSubview(row)
        return card
    }

    private func baseCard() -> UIStackView {
        let card = UIStackView()
        card.axis = .vertical
        card.spacing = 14
        card.layoutMargins = UIEdgeInsets(top: 18, left: 18, bottom: 18, right: 18)
        card.isLayoutMarginsRelativeArrangement = true
        card.backgroundColor = surface
        card.layer.cornerRadius = 24
        return card
    }

    private func gradientCard() -> UIStackView {
        let card = baseCard()
        card.backgroundColor = UIColor(red: 0.105, green: 0.137, blue: 0.260, alpha: 1)
        return card
    }

    private func sectionHeader(title: String, action: String, path: String) -> UIView {
        return sectionHeader(title: title, action: action) { NativeRouteCoordinator.shared.openWebPath(path) }
    }

    private func sectionHeader(title: String, action: String, selector: Selector) -> UIView {
        return sectionHeader(title: title, action: action) { [weak self] in self?.perform(selector) }
    }

    private func sectionHeader(title: String, action: String, handler: @escaping () -> Void) -> UIView {
        let row = UIStackView()
        row.axis = .horizontal
        row.alignment = .center
        let label = cardTitle(title)
        let button = UIButton(type: .system)
        button.setTitle(action, for: .normal)
        button.setTitleColor(teal, for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 13, weight: .bold)
        button.addAction(UIAction { _ in handler() }, for: .touchUpInside)
        row.addArrangedSubview(label)
        row.addArrangedSubview(UIView())
        row.addArrangedSubview(button)
        return row
    }

    private func statBox(value: String, label: String, color: UIColor) -> UIView {
        let box = UIStackView()
        box.axis = .vertical
        box.alignment = .center
        box.spacing = 4
        box.layoutMargins = UIEdgeInsets(top: 14, left: 8, bottom: 14, right: 8)
        box.isLayoutMarginsRelativeArrangement = true
        box.backgroundColor = surface2
        box.layer.cornerRadius = 18

        let valueLabel = UILabel()
        valueLabel.text = value
        valueLabel.textColor = color
        valueLabel.font = .systemFont(ofSize: value.count > 8 ? 14 : 22, weight: .black)
        valueLabel.adjustsFontSizeToFitWidth = true

        let caption = UILabel()
        caption.text = label
        caption.textColor = muted
        caption.font = .systemFont(ofSize: 11, weight: .semibold)
        box.addArrangedSubview(valueLabel)
        box.addArrangedSubview(caption)
        return box
    }

    private func scheduleRow(_ item: NativeScheduleItem) -> UIView {
        let row = UIStackView()
        row.axis = .horizontal
        row.alignment = .center
        row.spacing = 12
        row.layoutMargins = UIEdgeInsets(top: 12, left: 0, bottom: 12, right: 0)
        row.isLayoutMarginsRelativeArrangement = true

        let time = UILabel()
        time.text = item.allDay ? "종일" : DateFormatter.gleaumTime.string(from: ISO8601DateFormatter.gleaum.date(from: item.startTime) ?? Date())
        time.textColor = teal
        time.font = .systemFont(ofSize: 13, weight: .black)
        time.widthAnchor.constraint(equalToConstant: 56).isActive = true

        let labels = UIStackView()
        labels.axis = .vertical
        labels.spacing = 4
        let title = UILabel()
        title.text = item.title
        title.textColor = text
        title.font = .systemFont(ofSize: 16, weight: .bold)
        let sub = UILabel()
        sub.text = item.type == "personal" ? "개인일정" : "공유일정"
        sub.textColor = subtle
        sub.font = .systemFont(ofSize: 12, weight: .semibold)
        labels.addArrangedSubview(title)
        labels.addArrangedSubview(sub)

        row.addArrangedSubview(time)
        row.addArrangedSubview(labels)
        return row
    }

    private func emptyState(_ title: String, action: String) -> UIView {
        let label = UILabel()
        label.text = "\(title)\n\(action)"
        label.textColor = muted
        label.textAlignment = .center
        label.font = .systemFont(ofSize: 15, weight: .semibold)
        label.numberOfLines = 0
        label.backgroundColor = surface2
        label.layer.cornerRadius = 18
        label.clipsToBounds = true
        label.heightAnchor.constraint(equalToConstant: 120).isActive = true
        return label
    }

    private func smallAction(_ title: String, path: String) -> UIView {
        return smallAction(title) { NativeRouteCoordinator.shared.openWebPath(path) }
    }

    private func smallAction(_ title: String, handler: @escaping () -> Void) -> UIButton {
        let button = UIButton(type: .system)
        button.setTitle(title, for: .normal)
        button.setTitleColor(text, for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 14, weight: .bold)
        button.backgroundColor = surface2
        button.layer.cornerRadius = 18
        button.heightAnchor.constraint(equalToConstant: 58).isActive = true
        button.addAction(UIAction { _ in handler() }, for: .touchUpInside)
        return button
    }

    private func actionButton(title: String, color: UIColor, handler: @escaping () -> Void) -> UIButton {
        let button = UIButton(type: .system)
        button.setTitle(title, for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 16, weight: .bold)
        button.backgroundColor = color
        button.layer.cornerRadius = 22
        button.heightAnchor.constraint(equalToConstant: 48).isActive = true
        button.addAction(UIAction { _ in handler() }, for: .touchUpInside)
        return button
    }

    private func cardTitle(_ value: String) -> UILabel {
        let label = UILabel()
        label.text = value
        label.textColor = text
        label.font = .systemFont(ofSize: 18, weight: .black)
        return label
    }

    private func cardBody(_ value: String) -> UILabel {
        let label = UILabel()
        label.text = value
        label.textColor = muted
        label.font = .systemFont(ofSize: 14, weight: .semibold)
        label.numberOfLines = 0
        return label
    }

    private func messageCard(title: String, body: String) -> UIView {
        let card = baseCard()
        card.addArrangedSubview(cardTitle(title))
        card.addArrangedSubview(cardBody(body))
        return card
    }

    private func circleButton(title: String, color: UIColor) -> UIButton {
        let button = UIButton(type: .system)
        button.setTitle(title, for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 28, weight: .black)
        button.backgroundColor = color
        button.layer.cornerRadius = 26
        button.widthAnchor.constraint(equalToConstant: 52).isActive = true
        button.heightAnchor.constraint(equalToConstant: 52).isActive = true
        return button
    }

    @objc private func newScheduleTapped() {
        let create = NativeScheduleCreateViewController()
        create.modalPresentationStyle = .pageSheet
        create.onCreated = { [weak self] _ in self?.loadSummary() }
        present(create, animated: true)
    }

    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            DispatchQueue.main.async {
                if granted { UIApplication.shared.registerForRemoteNotifications() }
                let alert = UIAlertController(
                    title: granted ? "알림이 켜졌어요" : "알림 권한이 필요해요",
                    message: granted ? "일정 리마인더와 중요한 알림을 받을 수 있습니다." : "iPhone 설정에서 글리움 알림을 허용해 주세요.",
                    preferredStyle: .alert
                )
                alert.addAction(UIAlertAction(title: "확인", style: .default))
                self.present(alert, animated: true)
            }
        }
    }

    private func logout() {
        SessionManager.shared.clearSession()
        dismiss(animated: false) {
            UIApplication.shared.open(URL(string: "gleaum://logout")!)
        }
    }

    private func greeting() -> String {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour < 12 { return "좋은 아침이에요" }
        if hour < 18 { return "좋은 오후예요" }
        return "좋은 저녁이에요"
    }

    private func won(_ amount: Int) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return "\(formatter.string(from: NSNumber(value: amount)) ?? "0")원"
    }
}

extension DateFormatter {
    static let gleaumDay: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.dateFormat = "M월 d일 EEEE"
        return formatter
    }()

    static let gleaumShortDay: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.dateFormat = "E\nd"
        return formatter
    }()

    static let gleaumTime: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.dateFormat = "a h:mm"
        return formatter
    }()
}
