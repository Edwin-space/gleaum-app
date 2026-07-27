import Foundation
import OSLog

enum AppSessionState: Equatable {
    case idle
    case validating
    case signedOut
    case authenticated
    case authenticatedOffline
}

@MainActor
protocol AppSessionRouting: AnyObject {
    func showSignedOutState()
    func showAuthenticatedState()
    func showAuthenticatedOfflineState()
}

/// 앱 시작 시 세션 판정과 화면 전환의 단일 소유자입니다.
@MainActor
final class AppSessionStateCoordinator {
    private let logger = Logger(subsystem: "com.gleaum.app", category: "session-state")
    private weak var router: AppSessionRouting?
    private var validationTask: Task<Void, Never>?
    private(set) var state: AppSessionState = .idle

    init(router: AppSessionRouting) {
        self.router = router
    }

    func start() {
        guard state == .idle else {
            return
        }
        validateStoredSession()
    }

    func retry() {
        validateStoredSession()
    }

    func resume() {
        switch state {
        case .idle:
            validateStoredSession()
        case .signedOut where SessionManager.shared.hasStoredSession():
            validateStoredSession()
        case .authenticated, .authenticatedOffline:
            if !SessionManager.shared.hasStoredSession() {
                transition(to: .signedOut)
            }
        case .validating, .signedOut:
            break
        }
    }

    func sessionSaved() {
        validationTask?.cancel()
        validationTask = nil
        transition(to: .authenticated)
    }

    func sessionCleared() {
        validationTask?.cancel()
        validationTask = nil
        transition(to: .signedOut)
    }

    private func validateStoredSession() {
        state = .validating
        logger.info("Session state: validating")
        validationTask?.cancel()
        validationTask = Task { [weak self] in
            let validation = await SessionManager.shared.validateForLaunch()
            guard !Task.isCancelled, let self else {
                return
            }

            switch validation {
            case .valid, .refreshed:
                self.transition(to: .authenticated)
            case .temporaryFailure:
                if SessionManager.shared.hasStoredSession() {
                    self.transition(to: .authenticatedOffline)
                } else {
                    self.transition(to: .signedOut)
                }
            case .invalid:
                self.transition(to: .signedOut)
            }
            self.validationTask = nil
        }
    }

    private func transition(to nextState: AppSessionState) {
        guard state != nextState else {
            return
        }
        state = nextState
        logger.info("Session state transitioned to \(String(describing: nextState), privacy: .public)")

        switch nextState {
        case .signedOut:
            router?.showSignedOutState()
        case .authenticated:
            router?.showAuthenticatedState()
        case .authenticatedOffline:
            router?.showAuthenticatedOfflineState()
        case .idle, .validating:
            break
        }
    }
}
