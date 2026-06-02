# 03. 현재 상태 및 다음 작업 (Current Status)

> 마지막 업데이트: 2026-06-01
> 이 문서는 다음 AI 에이전트가 작업을 이어받기 위한 핵심 인수인계 문서입니다.

---

## ✅ 완료된 작업

### 인프라 / 배포
- [x] `backoffice/` Next.js 서브프로젝트 생성
- [x] **Next.js 16.2.6 업그레이드** (CVE-2025-66478 보안 취약점 대응)
- [x] shadcn/ui 설치 (Nova 프리셋, Tailwind v4 호환)
- [x] Vercel 독립 프로젝트 — `gleaum-backoffice`
- [x] Production 배포: `https://gleaum-backoffice.vercel.app`
- [x] 커스텀 도메인: `admins.gleaum.com` (설정 완료)

### 구현된 페이지
- [x] `/` — 대시보드 (KPI 카드 4종, GA4 실시간 데이터)
- [x] `/users` — 회원 관리 (실데이터 연동, 가입일 auth.users.created_at 병합)
- [x] `/spaces` — 공간 관리 (실시간 검색 — SpacesClient.tsx)
- [x] `/campaigns` — CRM 캠페인 빌더 (5채널 탭, 실시간 미리보기)
- [x] `/releases` — Firebase App Distribution 릴리즈 관리
- [x] `/settings` — Remote Config 기능 플래그 편집기
- [x] `/ads` — 광고 매니저 (전면 개편 완료)
- [x] `/login` — 관리자 로그인 (아이디 저장 포함)

### 광고 매니저 (`/ads`) — 상세
- [x] 광고 슬롯 동적 로드 (DB `ad_slots` 테이블 기반, 하드코딩 제거)
- [x] 슬롯별 미리보기: 배너(320×60) / 바텀시트(375×200) / 팝업(375×300)
- [x] 플랫폼 타겟팅 (web/android/ios) + 폴백 광고 안내
  - 웹 선택 → Google AdSense 자동 폴백 표시
  - 앱 선택 → AdMob 자동 폴백 표시
- [x] 이미지 업로드 (브라우저 압축 WebP → Supabase Storage `ad-images`)
- [x] starts_at / ends_at: 네이티브 `<input type="datetime-local">` (shadcn 호환 이슈 수정)
- [x] 기간별 통계 필터 (오늘/7일/30일/전체), 상태 필터, 요약 카드
- [x] 광고 복제 기능

### 등록된 광고 슬롯 (Supabase `ad_slots` 테이블)
| 슬롯 ID | 설명 | 크기 | 노출 위치 |
|---------|------|------|----------|
| `home-feed-inline` | 홈피드 인라인 | 320×60 | 홈 인사카드 하단 |
| `schedule-list-top` | 일정 목록 상단 | 320×60 | 일정 목록 |
| `budget-list-top` | 가계부 목록 상단 | 320×60 | 가계부 지출 목록 |
| `save-prompt` | 저장 후 바텀시트 | 375×280 | 일정/지출 저장 완료 후 |
| `in-app-popup` | 인앱 팝업 | 375×300 | 추후 구현 예정 |

### Supabase DB (실행 완료)
- [x] `013_ad_system.sql` — ad_slots / ads / ad_events 테이블, RLS, get_active_ad 함수
- [x] `014_ad_platforms.sql` — ads.platforms 컬럼, get_active_ad p_platform 파라미터
- [x] `profiles.is_admin = true` — 관리자 계정 (`devianne.tsyoo@gmail.com`)
- [x] `ad-images` Storage 버킷 — 공개 읽기 + 관리자 업로드/삭제 정책
- [x] `schedules.expense_category` CHECK 제약 확장 (food/daily/fashion/transport/culture/medical/social 추가)

### 인증 시스템
- [x] `src/proxy.ts` — 비로그인 시 `/login` 리다이렉트
- [x] `src/components/SessionProvider.tsx` — 비활동 30분 자동 로그아웃
- [x] `src/components/Sidebar.tsx` — 세션 카운트다운 (120초 이하 경고)

---

## 🔴 미완료 — 다음 작업

### Phase 5: 차트 및 상세 페이지
- [ ] 대시보드 WAU 트렌드 차트 (Recharts)
- [ ] 대시보드 가계부 vs 캘린더 비율 차트
- [ ] 회원 상세 페이지 (`/users/[id]`)
- [ ] 공간 상세 페이지 (`/spaces/[id]`)

### Phase 6: CRM 실제 발송 API
- [ ] Firebase Admin SDK — 앱 푸시 발송
- [ ] Aligo API — SMS 발송
- [ ] SendGrid API — 이메일 발송
- [ ] 발송 이력 DB 저장

### Phase 7: 광고 매니저 고도화
- [x] 광고 CRUD DB 연동 완료
- [x] 슬롯별 미리보기 + 플랫폼 폴백 안내
- [ ] 인앱 팝업 (`in-app-popup`) 서비스 컴포넌트 구현 (시점 미정)
- [ ] 광고 성과 차트 (노출/클릭 트렌드)
- [ ] 광고별 상세 통계 페이지

---

## 📋 전체 Phase 계획

| Phase | 작업 | 상태 |
|-------|------|------|
| Phase 1 | 프로젝트 스캐폴딩 + 기본 UI | ✅ 완료 |
| Phase 2 | shadcn/ui 컴포넌트로 리팩토링 | ✅ 완료 |
| Phase 3 | Vercel 배포 + 환경변수 설정 | ✅ 완료 |
| Phase 4 | 관리자 인증 + 세션 타이머 + GA4 연동 + 실데이터 | ✅ 완료 |
| Phase 5 | Recharts 차트 + 상세 페이지 | 🔜 다음 작업 |
| Phase 6 | CRM 실제 발송 API | ❌ 미착수 |
| Phase 7 | 광고 매니저 고도화 | 🔄 진행 중 |

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
- 파일명: `src/proxy.ts`
- export 함수명: `proxy`

### GA4 관련 환경변수
| 변수명 | 용도 |
|--------|------|
| `GA4_PROPERTY_ID` | GA4 속성 ID (서버 사이드) |
| `GOOGLE_SERVICE_ACCOUNT` | 서비스 계정 JSON |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | 백오피스 자체 GA4 추적 |

### 광고 슬롯 관련 환경변수 (메인 앱)
| 변수명 | 값 |
|--------|-----|
| `NEXT_PUBLIC_ADSENSE_CLIENT` | `ca-app-pub-7426507548879721` |
| `NEXT_PUBLIC_ADSENSE_SLOT_HOME_FEED` | `2747378024` |

---

## ⚠️ 이전 세션 부작용
1. **Supabase Storage `avatars` 버킷** — 의도치 않게 생성됨. 불필요 시 삭제 가능.
2. **`devianne.tsyoo@gmail.com`으로 메인 앱 온보딩 완료** — `profiles` 테이블에 테스트 데이터 존재.
