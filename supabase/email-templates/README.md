# Supabase Auth 이메일 템플릿

## Magic Link / OTP 공용 템플릿

Supabase Dashboard에서 다음 위치에 적용한다.

```text
Authentication → Emails → Templates → Magic link or OTP
```

- Subject: `[글리움] 이메일 확인 코드`
- Body: `magic-link-or-otp.html` 전체
- 필수 변수: `{{ .Token }}`
- 보호자 분기 식별 URL:
  `https://www.gleaum.com/auth/email-purpose/guardian-verification`
- 보호자 요청은 위 URL을 `signInWithOtp.options.emailRedirectTo`로 전달한다.
- 템플릿은 `{{ .RedirectTo }}` 조건문으로 보호자 안내와 일반 안내를 구분한다.
- 사용 금지: `{{ .ConfirmationURL }}` — 현재 앱은 링크가 아니라 운영 Auth가 발급하는 8자리 OTP 입력 방식이다.

이 설정은 SQL migration 대상이 아니므로 운영 프로젝트 Dashboard에서 별도로 반영해야 한다.

## 영향 범위

- 일반 이메일/비밀번호 회원가입은 별도 `Confirm sign up` 템플릿을 사용하므로 영향을 받지 않는다.
- 일반 이메일/비밀번호 로그인은 메일을 발송하지 않는다.
- 향후 일반 이메일 OTP 로그인을 추가하면 이 템플릿의 기본(`else`) 안내가 사용된다.
- Supabase Dashboard에는 사용자 정의 Auth 템플릿 종류를 추가할 수 없으므로
  고정 `Magic link or OTP` 슬롯 안에서 목적을 분기한다.
