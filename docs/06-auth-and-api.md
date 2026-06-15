# 06. 인증 및 외부 API

## 로그인 방식 현황 (2026-06-15)

`/login` 화면은 **소셜 우선 + 이메일 보조** 구조입니다.

| 방식 | 상태 | 비고 |
|------|------|------|
| 구글 로그인 (OAuth) | ✅ 사용 | 웹/네이티브 모두. `signInWithGoogle()` |
| 이메일/비밀번호 회원가입·로그인 | ✅ 사용 | `signUpWithEmail()` / `signInWithEmail()`. 회원가입 시 이름·메일·비밀번호(6자+) + 약관 동의 체크박스 |
| 애플 로그인 | ⏳ 준비 중 | 버튼만 노출, 클릭 시 "연동 준비 중" 토스트. 실연동은 유료 Apple Developer + Services ID/Key 필요 |
| 카카오 로그인 | ⏳ 준비 중 | 버튼만 노출, 클릭 시 "연동 준비 중" 토스트. 실연동은 카카오 비즈 인증(이메일 동의항목) 필요 |

### 이메일 회원가입 약관 동의 (법적 준수)
정보통신망법·개인정보보호법 준수를 위해 회원가입 폼에 개별 체크박스 제공:
- `[필수]` 만 14세 이상입니다
- `[필수]` 이용약관 동의 (`/legal/terms`)
- `[필수]` 개인정보 수집·이용 동의 (`/legal/privacy`)
- "전체 동의" 토글 제공. 미동의 시 제출 차단.

### 이메일 인증 메일
`signUpWithEmail()`은 `emailRedirectTo`(웹: `/auth/callback`, 네이티브: `gleaum://auth/callback`)를 설정. 실제 발송은 **Supabase 대시보드 설정에 의존**:
- Authentication → Providers → Email → **"Confirm email" 토글 ON**
- Authentication → Emails → Templates → **"Confirm signup"** (한글 템플릿 적용 완료)
- 운영 트래픽 증가 시 커스텀 SMTP(Resend/SendGrid) + 자체 도메인 발신 권장

---

## Google OAuth 2.0

### 설정 현황

| 항목 | 상태 | 위치 |
|------|------|------|
| Google Cloud 프로젝트 | ✅ 생성 완료 | console.cloud.google.com |
| OAuth 2.0 클라이언트 ID | ✅ 생성 완료 | — |
| Supabase Google Provider 연동 | ✅ 완료 | Supabase > Auth > Providers |
| 테스트 사용자 등록 | ✅ 1명 (운영자) | OAuth 동의화면 > 테스트 사용자 |
| 앱 게시 (프로덕션) | ❌ 미완료 | 실 서비스 오픈 전 필요 |

### OAuth 스코프 (로그인 시 요청)
```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/drive.readonly
```

### 필수 리다이렉트 URI (Google Cloud Console 등록됨)
```
https://tyvjdsescukaeorcuaga.supabase.co/auth/v1/callback
```

### 로그인 구현 (`src/hooks/useAuth.ts`)
```typescript
const signInWithGoogle = async () => {
  const supabase = createClient()
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: '...calendar...drive...',
      queryParams: { access_type: 'offline', prompt: 'consent' }
    }
  })
}
```

### Google 토큰 사용
```typescript
const { getGoogleToken } = useAuth()
const token = getGoogleToken()  // session.provider_token
// → Google Calendar API, Drive API 호출 시 Bearer 토큰으로 사용
```

---

## Supabase Auth 흐름

```
1. 사용자가 "구글 로그인" 버튼 클릭
2. signInWithGoogle() → Supabase OAuth 시작
3. 구글 로그인 화면으로 리다이렉트
4. 구글 인증 완료 → Supabase callback URL로 리다이렉트
   (https://tyvjdsescukaeorcuaga.supabase.co/auth/v1/callback)
5. Supabase가 세션 생성 → 앱의 /auth/callback으로 리다이렉트
6. /auth/callback/route.ts 실행:
   - 코드 → 세션 교환
   - 프로필 / 가족 그룹 초기화
   - /home 리다이렉트
```

---

## Vercel Deployment Protection 주의사항

> ⚠️ **중요**: Vercel의 "Deployment Protection"이 ON이면 OAuth 콜백이 막힘!

**해결 방법**:
- Vercel Dashboard → gleaum-app → Settings → **Deployment Protection**
- `Vercel Authentication` → **Disabled** 또는 **Standard Protection** 으로 변경

---

## Google Calendar API (Day 5 예정)

### 활성화 필요
- Google Cloud Console → API 및 서비스 → **Google Calendar API** 활성화
- Google Cloud Console → API 및 서비스 → **Google Drive API** 활성화

### 구현 계획
```typescript
// 구글 캘린더 이벤트 생성
const token = getGoogleToken()
await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ summary: schedule.title, start: {...}, end: {...} })
})
```

---

## 미들웨어 인증 (`src/proxy.ts`)

> 파일명은 `middleware.ts`가 아니라 **`src/proxy.ts`** (Next.js 미들웨어 `proxy` export). 비로그인 사용자가 보호된 경로 접근 시 `/login`으로 리다이렉트.

```typescript
// 공개 경로: /, /login, /auth/callback, /invite, /api, /legal, /download 등
// 그 외 경로는 세션 없으면 /login?next=... 로 리다이렉트
```

### ⚠️ matcher의 정적 자산 제외 (필수)
matcher 제외 목록에는 정적 자산 확장자(`js/mjs/json/css/woff/woff2/webmanifest` 및 이미지/txt/xml)가 반드시 포함되어야 한다. 누락 시 `public/`의 `sw.js`·`firebase-messaging-sw.js`·`manifest.json`이 미들웨어를 통과하며 `NextResponse.next()` 처리로 **Content-Type이 `text/plain`으로 변질** → 전역 `nosniff`와 겹쳐 서비스워커 등록이 실패하고 **웹 푸시(FCM)가 전체 미작동**한다. (2026-06-15 수정)
