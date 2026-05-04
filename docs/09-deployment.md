# 09. 배포 환경

## Vercel 배포

- **플랫폼**: Vercel (Next.js 공식 호스팅)
- **프로젝트명**: `gleaum-app`
- **프로덕션 URL**: https://gleaum-app.vercel.app
- **GitHub 저장소**: `Edwin-space/gleaum-app`
- **브랜치**: `main` → 자동 배포 트리거

### 배포 리전

```json
// vercel.json
{
  "regions": ["icn1"]  // 서울 리전 (한국 사용자 최적화)
}
```

### CI/CD 파이프라인

```
GitHub main 브랜치 push
  → Vercel 빌드 자동 시작 (next build)
  → 빌드 성공 → https://gleaum-app.vercel.app 자동 배포
  → 빌드 실패 → Vercel 대시보드에서 로그 확인
```

---

## ⚠️ 중요: Deployment Protection 설정

> **Google OAuth 로그인이 Vercel 로그인 페이지로 막히는 문제 발생 시**

**원인**: Vercel의 "Deployment Protection"이 OAuth 콜백 URL을 차단함.

**해결 방법**:
1. Vercel Dashboard → gleaum-app 프로젝트
2. Settings → Deployment Protection
3. `Vercel Authentication` → **Disabled** 로 변경

이 설정이 활성화되어 있으면 `/auth/callback` 라우트가 Vercel 인증 화면에 막혀 OAuth가 실패함.

---

## 환경변수

### Vercel 환경변수 (자동 주입됨 — Supabase-Vercel Integration)

| 변수명 | 설명 | 자동주입 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서버 관리 키 | ✅ |
| `CRON_SECRET` | Supabase pg_net → Vercel API 호출 인증 | 수동 |

> **Supabase-Vercel Integration**: Vercel Dashboard → Integrations → Supabase 연결 시 환경변수 자동 주입됨. 수동으로 설정할 필요 없음.

### 로컬 개발 환경변수 (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tyvjdsescukaeorcuaga.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Supabase Dashboard > Project Settings > API
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # Supabase Dashboard > Project Settings > API (service_role)
```

> ⚠️ `.env.local`은 `.gitignore`에 포함되어 있어 GitHub에 커밋되지 않음.

### FCM 환경변수

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
FIREBASE_SERVICE_ACCOUNT_BASE64=
CRON_SECRET=
```

> `FIREBASE_SERVICE_ACCOUNT_BASE64`는 Firebase 서비스 계정 JSON을 base64로 인코딩한 값입니다.
> `CRON_SECRET`은 Supabase cron SQL의 `Authorization: Bearer ...` 값과 일치해야 합니다.

---

## Supabase 프로젝트

| 항목 | 값 |
|------|-----|
| 프로젝트 ID | `tyvjdsescukaeorcuaga` |
| 리전 | ap-northeast-1 (도쿄) |
| URL | https://tyvjdsescukaeorcuaga.supabase.co |
| Auth Callback URL | https://tyvjdsescukaeorcuaga.supabase.co/auth/v1/callback |

### Supabase 설정 확인 사항

1. **Auth → Providers → Google**: 활성화 + `Client ID` / `Client Secret` 입력됨
2. **Auth → URL Configuration**:
   - Site URL: `https://gleaum-app.vercel.app`
   - Redirect URLs: `https://gleaum-app.vercel.app/auth/callback`
3. **Database → RLS**: 모든 테이블 RLS 활성화됨
4. **Database → Extensions**: `pg_net`, `pg_cron` 활성화됨
5. **Cron Job**: `gleaum-reminders`가 5분마다 `/api/cron/reminders` 호출

### Supabase Cron / pg_net

Vercel Hobby 플랜에서는 Vercel Cron 사용이 제한되므로, 리마인더 자동 실행은 Supabase에서 처리합니다.

```sql
SELECT jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'gleaum-reminders';
```

대상 API:

```text
GET https://gleaum-app.vercel.app/api/cron/reminders
Authorization: Bearer <CRON_SECRET>
```

---

## Google Cloud Console

| 항목 | 상태 |
|------|------|
| 프로젝트 | 생성됨 |
| OAuth 2.0 클라이언트 ID | 생성됨 |
| 승인된 리다이렉트 URI | `https://tyvjdsescukaeorcuaga.supabase.co/auth/v1/callback` |
| 테스트 사용자 | 운영자 1명 등록 |
| 앱 게시 | ❌ 미완료 (실 서비스 오픈 전 필요) |

### OAuth 스코프 (현재 요청)

```
openid
email
profile
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/drive.readonly
```

> **Day 5 작업 전**: Google Cloud Console에서 Calendar API, Drive API 활성화 필요

---

## 로컬 개발 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드 테스트
npm run build
npm run start
```

### 로컬에서 OAuth 테스트 방법

로컬(`localhost:3000`)에서 Google OAuth를 테스트하려면:
1. Google Cloud Console → OAuth 클라이언트 → 승인된 리다이렉트 URI에 추가:
   - `http://localhost:3000/auth/callback`
2. Supabase Auth → URL Configuration → Redirect URLs에 추가:
   - `http://localhost:3000/auth/callback`

---

## 빌드 설정

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // 현재 특별한 설정 없음
  // images.domains 추가가 필요할 경우 여기에 추가
}
```

---

## 주요 NPM 스크립트

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

---

## 배포 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| OAuth 후 Vercel 로그인 화면 | Deployment Protection ON | Vercel Settings → Protection OFF |
| DB 데이터 없음 | schema.sql 미실행 | Supabase SQL Editor에서 schema.sql 실행 |
| 환경변수 오류 | .env.local 없음 | Supabase Dashboard에서 키 복사 후 .env.local 생성 |
| 빌드 실패 | TypeScript 오류 | `npm run build` 로컬 실행 후 오류 확인 |
