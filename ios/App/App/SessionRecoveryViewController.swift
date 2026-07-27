import UIKit

final class SessionRecoveryViewController: UIViewController {
    var onRetry: (() -> Void)?
    var onSignOut: (() -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = GleaumUIColor.background

        let symbol = UIImageView(image: UIImage(systemName: "wifi.exclamationmark"))
        symbol.translatesAutoresizingMaskIntoConstraints = false
        symbol.tintColor = GleaumUIColor.brandBlue
        symbol.preferredSymbolConfiguration = UIImage.SymbolConfiguration(
            pointSize: 42,
            weight: .medium
        )

        let title = UILabel()
        title.translatesAutoresizingMaskIntoConstraints = false
        title.text = "로그인 상태를 확인하고 있어요"
        title.textColor = GleaumUIColor.text
        title.font = .preferredFont(forTextStyle: .title2)
        title.adjustsFontForContentSizeCategory = true
        title.textAlignment = .center
        title.numberOfLines = 0

        let body = UILabel()
        body.translatesAutoresizingMaskIntoConstraints = false
        body.text = "저장된 로그인 정보는 안전하게 유지했습니다.\n네트워크 연결을 확인한 뒤 다시 시도해 주세요."
        body.textColor = GleaumUIColor.mutedText
        body.font = .preferredFont(forTextStyle: .body)
        body.adjustsFontForContentSizeCategory = true
        body.textAlignment = .center
        body.numberOfLines = 0

        var retryConfiguration = UIButton.Configuration.filled()
        retryConfiguration.title = "다시 시도"
        retryConfiguration.baseBackgroundColor = GleaumUIColor.brandBlue
        retryConfiguration.cornerStyle = .capsule
        let retryButton = UIButton(configuration: retryConfiguration)
        retryButton.translatesAutoresizingMaskIntoConstraints = false
        retryButton.addAction(UIAction { [weak self] _ in
            self?.onRetry?()
        }, for: .touchUpInside)

        var signOutConfiguration = UIButton.Configuration.plain()
        signOutConfiguration.title = "다른 계정으로 로그인"
        signOutConfiguration.baseForegroundColor = GleaumUIColor.mutedText
        let signOutButton = UIButton(configuration: signOutConfiguration)
        signOutButton.translatesAutoresizingMaskIntoConstraints = false
        signOutButton.addAction(UIAction { [weak self] _ in
            self?.onSignOut?()
        }, for: .touchUpInside)

        let stack = UIStackView(arrangedSubviews: [
            symbol,
            title,
            body,
            retryButton,
            signOutButton,
        ])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.alignment = .fill
        stack.spacing = 16
        stack.setCustomSpacing(24, after: body)

        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            stack.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 28),
            stack.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -28),
            retryButton.heightAnchor.constraint(greaterThanOrEqualToConstant: 52),
            signOutButton.heightAnchor.constraint(greaterThanOrEqualToConstant: 44),
        ])
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .default }
}
