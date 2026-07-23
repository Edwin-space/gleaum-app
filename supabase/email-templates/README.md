# Supabase Auth 이메일 템플릿

## 보호자 이메일 OTP

Supabase Dashboard에서 다음 위치에 적용한다.

```text
Authentication → Email Templates → Magic Link
```

- Subject: `[글리움] 보호자 확인 코드`
- Body: `guardian-verification-otp.html` 전체
- 필수 변수: `{{ .Token }}`
- 사용 금지: `{{ .ConfirmationURL }}` — 현재 앱은 링크가 아니라 6자리 OTP 입력 방식이다.

이 설정은 SQL migration 대상이 아니므로 운영 프로젝트 Dashboard에서 별도로 반영해야 한다.
