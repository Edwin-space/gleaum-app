import UIKit

final class NativeScheduleCreateViewController: UIViewController {
    var onCreated: ((NativeScheduleItem) -> Void)?

    private let titleField = UITextField()
    private let memoField = UITextField()
    private let typeControl = UISegmentedControl(items: ["개인", "공유"])
    private let allDaySwitch = UISwitch()
    private let startPicker = UIDatePicker()
    private let endPicker = UIDatePicker()
    private let reminderControl = UISegmentedControl(items: ["없음", "10분", "30분", "1시간"])
    private let saveButton = UIButton(type: .system)
    private let errorLabel = UILabel()

    private let bg = UIColor(red: 0.059, green: 0.090, blue: 0.165, alpha: 1)
    private let surface = UIColor(red: 0.082, green: 0.118, blue: 0.200, alpha: 1)
    private let text = UIColor.white
    private let muted = UIColor(red: 0.800, green: 0.835, blue: 0.882, alpha: 1)
    private let blue = UIColor(red: 0.000, green: 0.518, blue: 0.800, alpha: 1)

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = bg
        setupUI()
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    private func setupUI() {
        let nav = UIView()
        nav.translatesAutoresizingMaskIntoConstraints = false

        let close = UIButton(type: .system)
        close.setTitle("닫기", for: .normal)
        close.setTitleColor(muted, for: .normal)
        close.titleLabel?.font = .systemFont(ofSize: 15, weight: .semibold)
        close.addTarget(self, action: #selector(closeTapped), for: .touchUpInside)
        close.translatesAutoresizingMaskIntoConstraints = false

        let title = UILabel()
        title.text = "새 일정"
        title.textColor = text
        title.font = .systemFont(ofSize: 22, weight: .bold)
        title.translatesAutoresizingMaskIntoConstraints = false

        nav.addSubview(close)
        nav.addSubview(title)

        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 16
        stack.translatesAutoresizingMaskIntoConstraints = false

        configureTextField(titleField, placeholder: "일정 제목")
        configureTextField(memoField, placeholder: "메모 선택")

        typeControl.selectedSegmentIndex = 0
        reminderControl.selectedSegmentIndex = 1
        [typeControl, reminderControl].forEach {
            $0.selectedSegmentTintColor = blue
            $0.setTitleTextAttributes([.foregroundColor: UIColor.white, .font: UIFont.systemFont(ofSize: 13, weight: .bold)], for: .selected)
            $0.setTitleTextAttributes([.foregroundColor: muted, .font: UIFont.systemFont(ofSize: 13, weight: .semibold)], for: .normal)
        }

        startPicker.datePickerMode = .dateAndTime
        startPicker.preferredDatePickerStyle = .compact
        startPicker.tintColor = blue
        startPicker.minuteInterval = 5
        startPicker.date = Date().addingTimeInterval(60 * 30)

        endPicker.datePickerMode = .dateAndTime
        endPicker.preferredDatePickerStyle = .compact
        endPicker.tintColor = blue
        endPicker.minuteInterval = 5
        endPicker.date = Date().addingTimeInterval(60 * 90)

        allDaySwitch.onTintColor = blue

        stack.addArrangedSubview(formCard([
            labeled("제목", titleField),
            labeled("구분", typeControl),
            switchRow("하루 종일", allDaySwitch),
            labeled("시작", startPicker),
            labeled("종료", endPicker),
            labeled("알림", reminderControl),
            labeled("메모", memoField),
        ]))

        errorLabel.textColor = UIColor(red: 0.961, green: 0.384, blue: 0.384, alpha: 1)
        errorLabel.font = .systemFont(ofSize: 13, weight: .semibold)
        errorLabel.numberOfLines = 0
        errorLabel.isHidden = true
        stack.addArrangedSubview(errorLabel)

        saveButton.setTitle("일정 등록", for: .normal)
        saveButton.setTitleColor(.white, for: .normal)
        saveButton.titleLabel?.font = .systemFont(ofSize: 17, weight: .bold)
        saveButton.backgroundColor = blue
        saveButton.layer.cornerRadius = 22
        saveButton.heightAnchor.constraint(equalToConstant: 52).isActive = true
        saveButton.addTarget(self, action: #selector(saveTapped), for: .touchUpInside)
        stack.addArrangedSubview(saveButton)

        view.addSubview(nav)
        view.addSubview(stack)

        NSLayoutConstraint.activate([
            nav.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            nav.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            nav.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            nav.heightAnchor.constraint(equalToConstant: 56),

            close.leadingAnchor.constraint(equalTo: nav.leadingAnchor),
            close.centerYAnchor.constraint(equalTo: nav.centerYAnchor),
            title.centerXAnchor.constraint(equalTo: nav.centerXAnchor),
            title.centerYAnchor.constraint(equalTo: nav.centerYAnchor),

            stack.topAnchor.constraint(equalTo: nav.bottomAnchor, constant: 12),
            stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
        ])
    }

    private func configureTextField(_ field: UITextField, placeholder: String) {
        field.placeholder = placeholder
        field.textColor = text
        field.tintColor = blue
        field.font = .systemFont(ofSize: 16, weight: .semibold)
        field.attributedPlaceholder = NSAttributedString(
            string: placeholder,
            attributes: [.foregroundColor: UIColor(white: 1, alpha: 0.36)]
        )
        field.borderStyle = .none
    }

    private func formCard(_ rows: [UIView]) -> UIView {
        let card = UIStackView(arrangedSubviews: rows)
        card.axis = .vertical
        card.spacing = 0
        card.layoutMargins = UIEdgeInsets(top: 18, left: 18, bottom: 18, right: 18)
        card.isLayoutMarginsRelativeArrangement = true
        card.backgroundColor = surface
        card.layer.cornerRadius = 24
        return card
    }

    private func labeled(_ label: String, _ view: UIView) -> UIView {
        let container = UIStackView()
        container.axis = .vertical
        container.spacing = 8
        container.layoutMargins = UIEdgeInsets(top: 10, left: 0, bottom: 10, right: 0)
        container.isLayoutMarginsRelativeArrangement = true

        let labelView = UILabel()
        labelView.text = label
        labelView.textColor = muted
        labelView.font = .systemFont(ofSize: 12, weight: .bold)
        container.addArrangedSubview(labelView)
        container.addArrangedSubview(view)
        return container
    }

    private func switchRow(_ label: String, _ control: UISwitch) -> UIView {
        let row = UIStackView()
        row.axis = .horizontal
        row.alignment = .center
        row.layoutMargins = UIEdgeInsets(top: 10, left: 0, bottom: 10, right: 0)
        row.isLayoutMarginsRelativeArrangement = true

        let labelView = UILabel()
        labelView.text = label
        labelView.textColor = text
        labelView.font = .systemFont(ofSize: 15, weight: .bold)
        row.addArrangedSubview(labelView)
        row.addArrangedSubview(UIView())
        row.addArrangedSubview(control)
        return row
    }

    @objc private func closeTapped() {
        dismiss(animated: true)
    }

    @objc private func saveTapped() {
        let cleanTitle = titleField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !cleanTitle.isEmpty else {
            showError("일정 제목을 입력해 주세요.")
            return
        }
        if endPicker.date <= startPicker.date {
            showError("종료 시간은 시작 시간보다 뒤여야 합니다.")
            return
        }

        let reminderValues = [0, 10, 30, 60]
        let payload = NativeCreateScheduleRequest(
            title: cleanTitle,
            type: typeControl.selectedSegmentIndex == 0 ? "personal" : "shared",
            spaceId: nil,
            startTime: ISO8601DateFormatter.gleaum.string(from: startPicker.date),
            endTime: ISO8601DateFormatter.gleaum.string(from: endPicker.date),
            allDay: allDaySwitch.isOn,
            reminder: reminderValues[max(0, reminderControl.selectedSegmentIndex)],
            repeat: "none",
            memo: memoField.text?.trimmingCharacters(in: .whitespacesAndNewlines),
            visibility: typeControl.selectedSegmentIndex == 0 ? "private" : "shared"
        )

        saveButton.isEnabled = false
        saveButton.alpha = 0.55
        errorLabel.isHidden = true

        Task { [weak self] in
            do {
                let item = try await NativeAPIClient.shared.createSchedule(payload)
                await MainActor.run {
                    self?.onCreated?(item)
                    self?.dismiss(animated: true)
                }
            } catch {
                await MainActor.run {
                    self?.saveButton.isEnabled = true
                    self?.saveButton.alpha = 1
                    self?.showError(error.localizedDescription)
                }
            }
        }
    }

    private func showError(_ message: String) {
        errorLabel.text = message
        errorLabel.isHidden = false
    }
}

extension ISO8601DateFormatter {
    static let gleaum: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()
}
