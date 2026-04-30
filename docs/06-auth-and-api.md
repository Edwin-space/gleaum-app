# 06. 인증 및 외부 API

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

## 미들웨어 인증 (`src/middleware.ts`)

비로그인 사용자가 보호된 경로 접근 시 `/login`으로 리다이렉트.

```typescript
// 보호된 경로: /home, /schedules, /family, /budget, /mypage 등
// 공개 경로: /login, /auth/callback, /invite/[code]
```
