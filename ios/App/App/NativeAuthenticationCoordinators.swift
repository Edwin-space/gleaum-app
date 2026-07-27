import AuthenticationServices
import CryptoKit
import Foundation
import Security
import UIKit

struct NativeAppleCredential {
    let idToken: String
    let rawNonce: String
    let displayName: String?
}

enum NativeAuthenticationCoordinatorError: LocalizedError, Equatable {
    case cancelled
    case missingCredential
    case requestFailed

    var errorDescription: String? {
        switch self {
        case .cancelled:
            return nil
        case .missingCredential:
            return "계정 인증 정보를 확인할 수 없습니다. 다시 시도해 주세요."
        case .requestFailed:
            return "계정 인증을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요."
        }
    }
}

@MainActor
final class NativeAppleSignInCoordinator: NSObject {
    private weak var presentationWindow: UIWindow?
    private var completion: ((Result<NativeAppleCredential, Error>) -> Void)?
    private var rawNonce: String?

    func start(
        presentationWindow: UIWindow,
        completion: @escaping (Result<NativeAppleCredential, Error>) -> Void
    ) {
        let rawNonce = Self.randomNonce()
        self.rawNonce = rawNonce
        self.presentationWindow = presentationWindow
        self.completion = completion

        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = Self.sha256(rawNonce)

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        controller.performRequests()
    }

    private func finish(_ result: Result<NativeAppleCredential, Error>) {
        completion?(result)
        completion = nil
        rawNonce = nil
    }

    private static func randomNonce(length: Int = 32) -> String {
        let characters = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remaining = length

        while remaining > 0 {
            var bytes = [UInt8](repeating: 0, count: 16)
            guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else {
                return UUID().uuidString.replacingOccurrences(of: "-", with: "")
            }
            for byte in bytes where remaining > 0 {
                if Int(byte) < characters.count {
                    result.append(characters[Int(byte)])
                    remaining -= 1
                }
            }
        }
        return result
    }

    private static func sha256(_ input: String) -> String {
        SHA256.hash(data: Data(input.utf8))
            .map { String(format: "%02x", $0) }
            .joined()
    }
}

extension NativeAppleSignInCoordinator:
    ASAuthorizationControllerDelegate,
    ASAuthorizationControllerPresentationContextProviding {

    nonisolated func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        MainActor.assumeIsolated {
            presentationWindow ?? ASPresentationAnchor()
        }
    }

    nonisolated func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        Task { @MainActor in
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let tokenData = credential.identityToken,
                  let idToken = String(data: tokenData, encoding: .utf8),
                  let rawNonce else {
                finish(.failure(NativeAuthenticationCoordinatorError.missingCredential))
                return
            }

            let formatter = PersonNameComponentsFormatter()
            let displayName = credential.fullName.map(formatter.string(from:))?
                .trimmingCharacters(in: .whitespacesAndNewlines)

            finish(.success(NativeAppleCredential(
                idToken: idToken,
                rawNonce: rawNonce,
                displayName: displayName?.isEmpty == false ? displayName : nil
            )))
        }
    }

    nonisolated func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        Task { @MainActor in
            if let authorizationError = error as? ASAuthorizationError,
               authorizationError.code == .canceled {
                finish(.failure(NativeAuthenticationCoordinatorError.cancelled))
            } else {
                finish(.failure(NativeAuthenticationCoordinatorError.requestFailed))
            }
        }
    }
}

@MainActor
final class NativeGoogleOAuthCoordinator: NSObject, ASWebAuthenticationPresentationContextProviding {
    private weak var presentationWindow: UIWindow?
    private var authenticationSession: ASWebAuthenticationSession?

    func start(
        presentationWindow: UIWindow,
        completion: @escaping (Result<String, Error>) -> Void
    ) {
        self.presentationWindow = presentationWindow

        guard var components = URLComponents(
            url: GleaumSupabaseConfiguration.app.baseURL
                .appendingPathComponent("auth/v1/authorize"),
            resolvingAgainstBaseURL: false
        ) else {
            completion(.failure(NativeAuthError.invalidConfiguration))
            return
        }

        let forwardedParameters = #"{"prompt":"select_account"}"#
        components.queryItems = [
            URLQueryItem(name: "provider", value: "google"),
            URLQueryItem(name: "redirect_to", value: "gleaum://auth/callback"),
            URLQueryItem(name: "flow_type", value: "implicit"),
            URLQueryItem(name: "prompt", value: "select_account"),
            URLQueryItem(name: "query_params", value: forwardedParameters),
        ]
        guard let url = components.url else {
            completion(.failure(NativeAuthError.invalidConfiguration))
            return
        }

        let session = ASWebAuthenticationSession(
            url: url,
            callbackURLScheme: "gleaum"
        ) { [weak self] callbackURL, error in
            DispatchQueue.main.async {
                self?.authenticationSession = nil
                if let authError = error as? ASWebAuthenticationSessionError,
                   authError.code == .canceledLogin {
                    completion(.failure(NativeAuthenticationCoordinatorError.cancelled))
                    return
                }
                guard error == nil,
                      let callbackURL,
                      let sessionJSON = NativeAuthClient.sessionJSON(fromOAuthCallback: callbackURL) else {
                    completion(.failure(NativeAuthenticationCoordinatorError.requestFailed))
                    return
                }
                completion(.success(sessionJSON))
            }
        }
        session.presentationContextProvider = self
        session.prefersEphemeralWebBrowserSession = true
        authenticationSession = session

        if !session.start() {
            authenticationSession = nil
            completion(.failure(NativeAuthenticationCoordinatorError.requestFailed))
        }
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        presentationWindow ?? ASPresentationAnchor()
    }
}
