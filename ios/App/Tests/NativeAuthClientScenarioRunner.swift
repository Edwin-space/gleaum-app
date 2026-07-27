import Foundation

private struct StubAuthTransport: NativeAuthTransport {
    let handler: @Sendable (URLRequest) throws -> (Data, URLResponse)

    func send(_ request: URLRequest) async throws -> (Data, URLResponse) {
        try handler(request)
    }
}

private enum StubError: Error {
    case offline
}

@main
private enum NativeAuthClientScenarioRunner {
    static func main() async {
        let baseURL = URL(string: "https://example.supabase.co")!
        let configuration = GleaumSupabaseConfiguration(
            baseURL: baseURL,
            anonKey: "public-anon-key"
        )
        let now = Date(timeIntervalSince1970: 2_000_000_000)
        var passed = 0

        await scenario("password login normalizes session") {
            let client = NativeAuthClient(
                configuration: configuration,
                transport: responseTransport(
                    status: 200,
                    json: sessionPayload(expiresIn: 1_800)
                ),
                now: { now }
            )
            let response = try await client.signIn(
                email: "user@example.com",
                password: "secret12"
            )
            guard let session = response.sessionJSON,
                  SessionPayload.accessToken(from: session) == "access-token",
                  SessionPayload.isUsable(session, now: now) else {
                return false
            }
            return true
        }
        passed += 1

        await scenario("signup without session requires confirmation") {
            let client = NativeAuthClient(
                configuration: configuration,
                transport: responseTransport(status: 200, json: ["user": ["id": "user-id"]]),
                now: { now }
            )
            let response = try await client.signUp(
                email: "new@example.com",
                password: "secret12",
                displayName: "새 사용자"
            )
            return response.requiresEmailConfirmation
        }
        passed += 1

        await scenario("all successful 2xx codes are accepted") {
            let client = NativeAuthClient(
                configuration: configuration,
                transport: responseTransport(
                    status: 201,
                    json: sessionPayload(expiresIn: 3_600)
                ),
                now: { now }
            )
            let response = try await client.signIn(
                provider: .apple,
                idToken: "apple-token",
                rawNonce: "raw-nonce"
            )
            return response.sessionJSON != nil
        }
        passed += 1

        await scenario("auth errors keep user-safe mapping") {
            let client = NativeAuthClient(
                configuration: configuration,
                transport: responseTransport(
                    status: 400,
                    json: ["message": "Invalid login credentials"]
                )
            )
            do {
                _ = try await client.signIn(email: "user@example.com", password: "wrong")
                return false
            } catch let error as NativeAuthError {
                return error.errorDescription == "이메일 또는 비밀번호가 올바르지 않아요."
            }
        }
        passed += 1

        await scenario("network failures remain distinguishable") {
            let client = NativeAuthClient(
                configuration: configuration,
                transport: StubAuthTransport { _ in throw StubError.offline }
            )
            do {
                _ = try await client.signIn(email: "user@example.com", password: "secret12")
                return false
            } catch let error as NativeAuthError {
                return error == .networkUnavailable
            }
        }
        passed += 1

        await scenario("OAuth fragment parser preserves encoded token data") {
            let url = URL(
                string: "gleaum://auth/callback#access_token=header.payload.signature&refresh_token=abc%3D%3D&expires_in=3600"
            )!
            guard let session = NativeAuthClient.sessionJSON(fromOAuthCallback: url, now: now) else {
                return false
            }
            return SessionPayload.refreshToken(from: session) == "abc=="
        }
        passed += 1

        print("NativeAuthClient scenarios: \(passed)/6 passed")
    }

    private static func scenario(
        _ name: String,
        operation: () async throws -> Bool
    ) async {
        do {
            guard try await operation() else {
                fatalError("FAIL: \(name)")
            }
            print("PASS: \(name)")
        } catch {
            fatalError("FAIL: \(name) — \(error)")
        }
    }

    private static func responseTransport(
        status: Int,
        json: [String: Any]
    ) -> StubAuthTransport {
        StubAuthTransport { request in
            guard request.value(forHTTPHeaderField: "apikey") == "public-anon-key",
                  request.value(forHTTPHeaderField: "Authorization") == "Bearer public-anon-key",
                  request.value(forHTTPHeaderField: "Content-Type") == "application/json",
                  request.httpMethod == "POST" else {
                fatalError("invalid request contract")
            }
            let data = try JSONSerialization.data(withJSONObject: json)
            let response = HTTPURLResponse(
                url: request.url!,
                statusCode: status,
                httpVersion: nil,
                headerFields: ["Content-Type": "application/json"]
            )!
            return (data, response)
        }
    }

    private static func sessionPayload(expiresIn: Int) -> [String: Any] {
        [
            "access_token": "access-token",
            "refresh_token": "refresh-token",
            "expires_in": expiresIn,
            "token_type": "bearer",
        ]
    }
}
