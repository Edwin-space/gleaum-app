# 03. 현재 상태 및 다음 작업 (Current Status)

> 마지막 업데이트: 2026-05-29
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
  - 가입일: `auth.users.created_at` (profiles에 created_at 없음 → admin API로 병합)
- [x] `/spaces` — 공간 관리 (Supabase `family_groups` 테이블 실데이터 연동)
  - 실시간 검색 (공간명/초대코드/ID) — `SpacesClient.tsx` 클라이언트 컴포넌트 분리
- [x] `/campaigns` — CRM 캠페인 빌더 (5채널 탭, 실시간 메시지 미리보기)
- [x] `/releases` — 릴리즈 관리 (Firebase App Distribution 빌드 목록 + 내부 테스터 추가/제거)
- [x] `/settings` — Remote Config 기능 플래그 편집기 (스위치 토글, 즉시 Firebase 반영)
- [x] `/ads` — 광고 매니저 (shadcn/ui 기반, DB 완전 연동, **Supabase SQL 실행 완료**)
  - 광고 CRUD (등록/수정/삭제/복제/활성 토글)
  - 이미지 업로드 (브라우저 압축 WebP → Supabase Storage `ad-images`)
  - 실시간 미리보기, 플랫폼 타겟팅 (web/android/ios)
  - 기간별 통계 필터 (오늘/7일/30일/전체), 상태 필터, 요약 카드
  - 하우스 광고 없음 → 프론트에서 AdSense 자동 폴백 (백오피스 UI 제어 없음 — 미구현)
- [x] `/login` — 관리자 로그인 페이지 (shadcn/ui, 아이디 저장 기능 포함)

### 인증 시스템
- [x] `src/proxy.ts` — Next.js 16 라우트 보호 미들웨어
- [x] `src/components/SessionProvider.tsx` — 비활동 30분 자동 로그아웃
- [x] `src/components/Sidebar.tsx` — 세션 카운트다운 UI (120초 이하 경고)
- [x] 관리자 계정: `devianne.tsyoo@gmail.com` (`is_admin = true` 설정 완료)

### Supabase DB (2026-05-29 기준 실행 완료)
- [x] `013_ad_system.sql` — ad_slots / ads / ad_events 테이블, RLS, get_active_ad 함수
- [x] `014_ad_platforms.sql` — ads.platforms 컬럼, get_active_ad p_platform 파라미터
- [x] `profiles.is_admin` 컬럼 — 관리자 권한 컬럼 (013에 포함)
- [x] `ad-images` Storage 버킷 — 공개 읽기 + 관리자 업로드/삭제 정책

### 메인 앱 버그 수정 (2026-05-29)
- [x] 초대 코드 "유효하지 않음" 버그 — `purpose`가 `family_groups.settings` JSONB에 있음을 반영
- [x] Universal Link / 딥링크 — iOS App Link, Android App Link, 커스텀 스킴 통합 핸들러 구현
- [x] `assetlinks.json` SHA256 fingerprint 오류 수정
- [x] AASA (apple-app-site-association) App Router 라우트 신규 생성
- [x] `AdSlot.tsx` — 500 에러 시 AdSense 폴백 처리 수정

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
- [x] 광고 CRUD DB 연동 완료
- [x] platforms 컬럼 + get_active_ad RPC 보정
- [x] Supabase SQL 전체 실행 완료
- [ ] AdSense 폴백 ON/OFF 토글 (백오피스 설정 UI)
- [ ] 교차 광고 모드 (하우스 광고 있어도 N%는 AdSense 노출)
- [ ] 광고 성과 차트 (노출/클릭 트렌드)
- [ ] 광고별 상세 통계 페이지

---

## ⚠️ 이전 세션에서 발생한 부작용 (확인 필요)

1. **Supabase Storage `avatars` 버킷** — 의도치 않게 생성됨. 불필요 시 삭제 가능.
2. **`devianne.tsyoo@gmail.com`으로 메인 앱 온보딩 완료** — `profiles` 테이블에 테스트 데이터 존재.

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
| Phase 7 | 광고 매니저 고도화 | 🔄 진행 중 (기본 완료, 고도화 미착수) |

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

### 광고 시스템 관련 환경변수 (메인 앱 `.env.local`)
| 변수명 | 값 | 용도 |
|--------|-----|------|
| `NEXT_PUBLIC_ADSENSE_CLIENT` | `ca-pub-7426507548879721` | AdSense 퍼블리셔 ID |
| `NEXT_PUBLIC_ADSENSE_SLOT_HOME_FEED` | `2747378024` | 홈피드 인라인 AdSense 슬롯 ID |

---

## 📁 광고 시스템 파일 구조 (메인 앱)

```
src/
  components/
    AdSlot.tsx          — 웹 광고 슬롯 (하우스 광고 → AdSense 폴백)
    InlineFeedAd.tsx    — 홈피드 광고 (웹: AdSlot / 네이티브: AdMob)
  app/
    api/ads/
      route.ts          — GET /api/ads?slot=&platform=  (공개 API)
      events/route.ts   — POST /api/ads/events          (노출/클릭 기록)
    api/admin/ads/
      route.ts          — GET/POST /api/admin/ads       (관리자 전용)
      [id]/route.ts     — PATCH/DELETE /api/admin/ads/[id]
    admin/ads/
      page.tsx          — 메인 앱 내 광고 관리 페이지 (레거시, 백오피스로 대체 예정)
  types/
    ads.ts              — Ad, AdWithStats, ActiveAd 타입 정의
```

```
backoffice/src/
  app/ads/
    page.tsx            — 백오피스 광고 매니저 (현재 사용)
```

```
supabase/migrations/
  013_ad_system.sql     — ✅ 실행 완료
  014_ad_platforms.sql  — ✅ 실행 완료
```
