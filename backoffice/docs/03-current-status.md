# 03. 현재 상태 및 다음 작업 (Current Status)

> 마지막 업데이트: 2026-05-28
> 이 문서는 다음 AI 에이전트가 작업을 이어받기 위한 핵심 인수인계 문서입니다.

---

## ✅ 완료된 작업

### 인프라 / 배포
- [x] `backoffice/` Next.js 서브프로젝트 생성
- [x] **Next.js 16.2.6 업그레이드** (15.1.6 → 16.2.6 — CVE-2025-66478 보안 취약점 대응)
- [x] shadcn/ui 설치 (Nova 프리셋, Tailwind v4 호환)
- [x] Vercel 독립 프로젝트 생성 — 프로젝트명: `gleaum-backoffice`
- [x] Vercel 환경변수 설정 완료
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://tyvjdsescukaeorcuaga.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (설정 완료)
  - `SUPABASE_SERVICE_ROLE_KEY` (설정 완료)
  - `GA4_PROPERTY_ID` = `536593148`
  - `GOOGLE_SERVICE_ACCOUNT` = 서비스 계정 JSON (설정 완료)
  - `NEXT_PUBLIC_GA4_MEASUREMENT_ID` = `G-BK5RQTGVNT` (설정 완료)
- [x] Production 배포 성공 (Status: Ready)
- [x] 배포 URL: `https://gleaum-backoffice.vercel.app`
- [x] `serverExternalPackages` 설정 — gRPC 기반 GA4 라이브러리 번들링 충돌 해결

### 구현된 페이지
- [x] `/` — 대시보드 (KPI 카드 4종, GA4 실시간 데이터, 차트 플레이스홀더)
- [x] `/users` — 회원 관리 (Supabase `profiles` 테이블 실데이터 연동)
- [x] `/spaces` — 공간 관리 (Supabase `family_groups` 테이블 실데이터 연동)
- [x] `/campaigns` — CRM 캠페인 빌더 (5채널 탭, 실시간 메시지 미리보기)
- [x] `/releases` — 릴리즈 관리 (Firebase App Distribution 빌드 목록 + 내부 테스터 추가/제거, projectNumber 기반 REST API 연동 보정 완료)
- [x] `/settings` — Remote Config 기능 플래그 편집기 추가 (스위치 토글, 즉시 Firebase 반영)
- [x] `/ads` — 광고 매니저 전면 개편 (2026-05-29, shadcn/ui 기반 DB 연동 완료)
  - Supabase `ads` 테이블 + `ad_events` CRUD 실연동
  - 이미지 업로드 (브라우저 압축 WebP → Supabase Storage `ad-images`)
  - 실시간 미리보기, 광고 복제, 플랫폼 타겟팅 (web/android/ios)
  - 기간별 통계 필터 (오늘/7일/30일/전체), 상태 필터, 요약 카드
- [x] `/settings` — 시스템 설정 (API 키 관리 폼, 비밀번호 변경, GA4 연동 상태 표시)
- [x] `/login` — 관리자 로그인 페이지 (Supabase Auth 기반)

### 인증 시스템 (Phase 4)
- [x] `src/app/login/page.tsx` — 이메일/비밀번호 로그인 폼 (shadcn/ui)
- [x] `src/proxy.ts` — Next.js 16 라우트 보호 미들웨어 (구 middleware.ts)
  - 비로그인 시 전체 경로 `/login` 리다이렉트
  - `/login` 접근 시 이미 로그인된 경우 `/` 리다이렉트
- [x] `src/components/ConditionalSidebar.tsx` — 로그인 페이지에서 사이드바 숨김
- [x] 관리자 계정: `devianne.tsyoo@gmail.com` (Supabase Auth에 등록됨)

### 세션 관리
- [x] `src/components/SessionProvider.tsx` — 비활동 기반 세션 타이머
  - IDLE_LIMIT: **30분** (비활동 시 자동 로그아웃, 2026-05-29 변경)
  - 활동 감지 이벤트: mousemove / mousedown / keydown / scroll / touchstart / click
  - sessionStorage `gleaum_admin_last_active` 키로 마지막 활동 시각 저장
  - 10초 디바운스로 과도한 저장 방지
- [x] `src/components/Sidebar.tsx` — 세션 카운트다운 UI
  - 좌측 하단 "비활동 로그아웃까지 MM:SS" 표시
  - 120초 이하: 노란색 경고, 60초 이하: 빨간색 위험
  - 로그아웃 버튼 (LogOut 아이콘)

### GA4 연동
- [x] `src/lib/ga4.ts` — GA4 Data API 서버 사이드 클라이언트
  - `BetaAnalyticsDataClient` (`@google-analytics/data` v5)
  - `fetchGA4Summary()`: 활성/신규 사용자, 세션, 페이지뷰 (7일), 실시간 접속자, 상위 5 페이지
- [x] `src/app/page.tsx` — 대시보드에 GA4 섹션 통합
  - 4개 GA4 메트릭 카드 + 상위 페이지 테이블
  - 실시간 접속자 카드: 초록 pulse 애니메이션
  - 미연동 시 환경변수 설정 안내 배너
- [x] `src/components/GoogleAnalytics.tsx` — 백오피스 자체 GA4 페이지뷰 추적
- [x] GA4 서비스 계정 접근 권한 부여 완료
  - 서비스 계정: `gleaum-backoffice@gleaum-firebase.iam.gserviceaccount.com`
  - GA4 속성 ID: `536593148`
  - 역할: `predefinedRoles/viewer`

### 실데이터 연동
- [x] `export const dynamic = "force-dynamic"` 전 페이지 적용 (정적 렌더링 방지)
- [x] 대시보드 KPI: `profiles`, `family_groups`, `schedules` 테이블 실시간 집계
- [x] 회원 관리: 컬럼명 오류 수정 (`full_name` → `name`, `onboarding_completed` → `onboarding_completed_at`)

### 기타
- [x] `src/app/settings/page.tsx` — 비밀번호 변경 기능
  - 현재 비밀번호 재인증 후 변경
  - 8자 이상, 확인 일치 검증
  - 새 비밀번호 눈 아이콘 토글

---

## 🔴 미완료 — 다음 작업 (Phase 5 이후)

### Phase 5: 차트 및 상세 페이지
- [ ] 대시보드 WAU 트렌드 차트 (Recharts 연동)
- [ ] 대시보드 가계부 vs 캘린더 생성 비율 차트
- [ ] 회원 상세 페이지 (`/users/[id]`)
- [ ] 공간 상세 페이지 (`/spaces/[id]`)

### Phase 6: CRM 실제 발송 API
- [ ] Firebase Admin SDK — 앱 푸시 발송
- [ ] Aligo API — SMS 발송
- [ ] SendGrid API — 이메일 발송
- [ ] 발송 이력 DB 저장

### Phase 7: 광고 매니저 고도화
- [x] 광고 CRUD DB 연동 완료 (2026-05-29)
- [ ] 광고 성과 차트 (노출/클릭 트렌드)
- [ ] 광고별 상세 통계 페이지

---

## ⚠️ 이전 세션에서 발생한 부작용 (확인 필요)

브라우저 에이전트 오작동으로 발생한 사항:
1. **Supabase Storage `avatars` 버킷** — 의도치 않게 생성됨. 불필요 시 삭제 가능.
2. **`devianne.tsyoo@gmail.com`으로 메인 앱 온보딩 완료** — `profiles` 테이블에 테스트 데이터 존재.
3. **Supabase SQL 에디터에 여러 스니펫 생성** — 확인 후 정리 필요.

---

## 📋 전체 백오피스 Phase 계획

| Phase | 작업 | 상태 |
|-------|------|------|
| Phase 1 | 프로젝트 스캐폴딩 + 기본 UI | ✅ 완료 |
| Phase 2 | shadcn/ui 컴포넌트로 리팩토링 | ✅ 완료 |
| Phase 3 | Vercel 배포 + 환경변수 설정 | ✅ 완료 |
| Phase 4 | 관리자 인증 + 세션 타이머 + GA4 연동 + 실데이터 | ✅ 완료 |
| Phase 5 | Recharts 차트 + 상세 페이지 | 🔜 다음 작업 |
| Phase 6 | CRM 실제 발송 API | ❌ 미착수 |
| Phase 7 | 광고 매니저 DB 저장 | ❌ 미착수 |

---

## 🔧 주요 설정 파일

### next.config.ts
```typescript
const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ["@google-analytics/data", "@grpc/grpc-js", "google-auth-library"],
};
```

### proxy.ts (Next.js 16 미들웨어)
- 파일명: `src/proxy.ts` (Next.js 16에서 middleware.ts 대신 사용)
- export 함수명: `proxy` (middleware → proxy로 변경됨)
- matcher: `_next/static`, `_next/image`, `favicon.ico`, 이미지 확장자 제외

### GA4 관련 환경변수
| 변수명 | 용도 |
|--------|------|
| `GA4_PROPERTY_ID` | GA4 속성 ID (서버 사이드 Data API 조회) |
| `GOOGLE_SERVICE_ACCOUNT` | 서비스 계정 JSON 전체 (서버 사이드 전용) |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | 백오피스 자체 GA4 추적 (클라이언트 사이드) |
