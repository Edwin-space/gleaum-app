# 09. 배포 환경

## Vercel 배포

- **플랫폼**: Vercel (Next.js 공식 호스팅)
- **프로젝트명**: `gleaum-app`
- **프로덕션 URL(정식 도메인)**: https://www.gleaum.com (구 `gleaum-app.vercel.app`도 동일 배포를 가리킴)
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
5. **Cron Job**: 아래 표의 6종 등록됨 (전부 `https://www.gleaum.com` 기준)

### Supabase Cron / pg_net (2026-06-15 기준)

Vercel Hobby 플랜에서는 Vercel Cron 사용이 제한되므로, **모든 정기 실행은 Supabase `pg_cron` + `pg_net`**에서 처리합니다. (`vercel.json`에는 cron 설정을 두지 않음)

| jobname | schedule (UTC → KST) | 대상 API |
|---------|----------------------|----------|
| `gleaum-recurring-expenses` | `10 15 * * *` → 매일 00:10 KST | `/api/cron/recurring-expenses` (정기지출 이월) |
| `gleaum-overdue-expenses` | `0 0 * * *` → 매일 09:00 KST | `/api/cron/overdue-expenses` (미결제 D+0/3/7) |
| `gleaum-weekly-digest` | `0 0 * * 1` → 월 09:00 KST | `/api/cron/weekly-digest` (주간 다이제스트) |
| `gleaum-reminders` | `*/5 * * * *` → 5분마다 | `/api/cron/reminders` (일정 리마인더) |
| `gleaum-automations` | `*/5 * * * *` → 5분마다 | `/api/cron/automations` (자동화 상태전환) |
| `cleanup-withdrawals-daily` | `0 18 * * *` → 매일 03:00 KST | `/api/cron/cleanup-withdrawals` (탈퇴 데이터 정리) |

각 잡의 요청 헤더는 `Authorization: Bearer <CRON_SECRET>`이며, **Vercel 환경변수 `CRON_SECRET`과 반드시 일치**해야 함. 현재 값은 `gleaum-cron-2026` (Vercel·로컬 `.env.local`·크론 6종 모두 동일).

```sql
-- 전체 등록 상태 + 타깃 도메인 확인
SELECT jobname, schedule, active,
       substring(command from 'url[^'']*''([^'']+)') AS target_url
FROM cron.job ORDER BY jobname;
```

> ⚠️ **등록 SQL 작성 주의**: `DO $$ ... format($$ ... $$) ... $$` 처럼 같은 `$$` 도크쿼트 태그를 중첩하면 "syntax error at or near SELECT"가 발생한다. 반드시 `cron.schedule(name, schedule, '명령문 평문')` 형태로 작성하고, 명령문 내부 작은따옴표는 `''`로 이스케이프한다. (`supabase/migrations/012`, `016` 참조)
>
> ⚠️ **도메인 일관성**: 모든 크론은 `https://www.gleaum.com`을 가리킨다. 과거엔 `gleaum-app.vercel.app`(automations·reminders), apex `gleaum.com`(cleanup)이 혼재했으나 2026-06-15에 www로 통일함. 구 도메인 제거 시 재확인 불필요.

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
```

> **2026-05-14 변경**: Calendar, Drive 스코프 제거. 기기 캘린더 방식으로 전환 결정.
> Google 앱 검수(민감한 스코프 심사) 불필요 상태. 정식 출시 전 OAuth 앱 게시만 완료하면 됨.

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

## Android 앱 빌드 및 배포

### 릴리즈 키스토어 정보

| 항목 | 값 |
|------|-----|
| 파일 경로 | `~/gleaum-release.keystore` |
| Alias | `gleaum` |
| 알고리즘 | RSA 2048 |
| 유효기간 | 10,000일 |
| DN | CN=Taesung Yoo, OU=Gleaum, O=Gleaum, L=Seoul, ST=Seoul, C=KR |

> ⚠️ 키스토어 파일과 비밀번호는 분실 시 복구 불가. 반드시 안전한 곳에 백업 보관.

### AAB 빌드 명령어

```bash
cd /Volumes/WD_BLACK/Ai\ Works/gleaum/android

export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

KEYSTORE_PASSWORD='비밀번호' KEY_PASSWORD='비밀번호' ./gradlew bundleRelease
```

> ⚠️ 비밀번호에 `$`, `(`, `)` 등 특수문자 포함 시 반드시 **작은따옴표(`'`)** 사용.

빌드 산출물:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Google Play Console 현재 상태 (2026-05-14)

| 항목 | 상태 |
|------|------|
| 개발자 등록 | ✅ 완료 |
| 패키지명 소유권 인증 | ✅ 완료 (`com.gleaum.app`) |
| 앱 무결성 설정 | ✅ 완료 (자동 보호 + Google Play 서명) |
| 내부 테스트 버전 | ✅ 업로드 완료 (versionCode: 1, versionName: 1.0) |
| 스토어 등록정보 | ❌ 미완료 |
| 데이터 안전 섹션 | ❌ 미완료 |
| 콘텐츠 등급 | ❌ 미완료 |
| 정식 출시 | ❌ 미완료 |

---

## 배포 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| OAuth 후 Vercel 로그인 화면 | Deployment Protection ON | Vercel Settings → Protection OFF |
| DB 데이터 없음 | schema.sql 미실행 | Supabase SQL Editor에서 schema.sql 실행 |
| 환경변수 오류 | .env.local 없음 | Supabase Dashboard에서 키 복사 후 .env.local 생성 |
| 빌드 실패 | TypeScript 오류 | `npm run build` 로컬 실행 후 오류 확인 |
