# 07. 완료된 기능

## Day 1 — 프로젝트 기반 (완료)

- [x] Next.js 16 App Router + TypeScript + Tailwind CSS v4 프로젝트 생성
- [x] 디자인 토큰 시스템 (`src/styles/tokens.css`)
- [x] 공통 TypeScript 타입 정의 (`src/types/index.ts`)
- [x] Supabase 클라이언트 설정 (브라우저 + 서버)
- [x] GitHub 저장소 연결 (`Edwin-space/gleaum-app`)
- [x] Vercel 자동 배포 파이프라인 구성
- [x] Supabase-Vercel 연동 (환경변수 자동 주입)

---

## Day 2 — 전체 화면 UI (완료)

### 구현된 페이지
- [x] `/login` — 구글 로그인 페이지
- [x] `/home` — 홈 대시보드 (캘린더 + 일정 요약)
- [x] `/schedules` — 일정 전체 목록 (검색 + 필터)
- [x] `/schedules/new` — 새 일정 추가 폼
- [x] `/schedules/[id]` — 일정 상세 + 상태 변경 + 삭제
- [x] `/schedules/children` — 자녀 일정 대시보드
- [x] `/family` — 가족 구성원 관리
- [x] `/budget` — 가계부 (월별 정기지출)
- [x] `/mypage` — 마이페이지 + 설정
- [x] `/notifications` — 알림 목록
- [x] `/settings/calendar` — 캘린더 연동 설정 페이지

---

## Day 3 — 구글 로그인 + 배포 (완료)

- [x] Google OAuth 2.0 실제 연동
- [x] Supabase Auth Google Provider 설정
- [x] `/auth/callback` 서버 라우트 구현
- [x] 로그인 후 `/home` 리다이렉트
- [x] 미들웨어 인증 보호
- [x] Vercel 프로덕션 배포 (`https://gleaum-app.vercel.app`)
- [x] 실제 구글 계정으로 로그인 테스트 완료

---

## Day 4 — Supabase DB 실데이터 연동 (완료)

- [x] DB 스키마 생성 (`supabase/schema.sql`)
- [x] RLS 정책 설정 (가족 그룹 단위 보안)
- [x] 자동 트리거 (신규 사용자 프로필 자동 생성, updated_at 자동 갱신)
- [x] `src/lib/db.ts` — 모든 DB 쿼리 함수 구현
- [x] `useCurrentUser` 훅 — 실 로그인 사용자 프로필
- [x] `useFamily` 훅 — 가족 구성원 실 데이터
- [x] `useSchedules` 훅 — 일정 CRUD
- [x] 첫 로그인 시 프로필 + 가족 그룹 자동 생성
- [x] 모든 페이지에서 `sampleData` 제거 → 실 DB 연동
- [x] 일정 생성 시 실제 DB 저장
- [x] 일정 상태 변경 → 실 DB 업데이트
- [x] 일정 삭제 → 실 DB 삭제
- [x] 가족 초대 코드 생성 및 합류 기능

---

## Day 5 — 초대 링크 + 전 페이지 디자인 리뉴얼 (완료)

### 초대 링크 페이지 (`/invite/[code]`)
- [x] `src/app/invite/[code]/page.tsx` 신규 생성
- [x] `src/middleware.ts` — `/invite` 공개 경로 추가
- [x] `src/hooks/useAuth.ts` — `signInWithGoogle(next?)` 파라미터 추가
- [x] `src/app/login/page.tsx` — `?next=` 파라미터 읽어서 OAuth에 전달 + 초대 배너 표시
- [x] `src/lib/db.ts` — `joinFamilyByCode` 반환 타입 강화

### 나머지 7개 페이지 디자인 리뉴얼 (Green/Teal/Blue 통일)
- [x] `/notifications`, `/mypage`, `/family`, `/budget`, `/schedules/children`, `/schedules/[id]`, `/schedules/new`, `/schedules` 전체 리뉴얼

---

## Day 6 — FCM 푸시 알림 + Supabase Cron 리마인더 (완료)

- [x] Firebase Cloud Messaging 클라이언트 연동
- [x] 로그인 사용자 FCM 토큰 저장 (`profiles.fcm_token`)
- [x] FCM HTTP v1 서버 발송 구현 (`src/lib/fcm.ts`)
- [x] 수동 재알림 API (`/api/notifications/renotify`)
- [x] 일정 리마인더 크론 API (`/api/cron/reminders`)
- [x] Supabase `pg_cron` + `pg_net` 연동 완료

---

## 제품 모델 재정의 — 개인 중심 + Space 확장형 (완료)

- [x] 개인 중심 + Space 확장형 토털 라이프 관리 서비스로 비전 재정의
- [x] `docs/12-product-model.md` 작성 및 적용
- [x] `schedule.type`을 Space / Category / Visibility / Automation Policy 축으로 분리 설계

---

## 개인화 온보딩 1차 (완료)

- [x] `/onboarding` 단계형 플로우 구현
- [x] 시작 목적/관심사 기반 개인화 설정 저장
- [x] `profiles` 테이블 개인화 컬럼 확장 및 SQL 적용
- [x] 신규 사용자 기본 그룹 이름을 `"나의 공간"`으로 전환

---

## 프리미엄 UI/UX 리뉴얼 1차 (완료)

- [x] Glassmorphism 도입: `.glass-card` 전면 적용
- [x] Mesh Gradient 배경: 애니메이션 기반 메쉬 그라디언트
- [x] 하이엔드 타이포그래피: `Outfit` (영문) + `Pretendard` (국문)
- [x] 아이콘 시스템 정교화: SVG 라인 아이콘 통일

---

## Sprint 2 + 적응형(Adaptive) UI 구현 (완료)

- [x] `sonner` 라이브러리 기반 전역 토스트 시스템
- [x] 주간/일간/월간 캘린더 뷰 확장
- [x] `DesktopSidebar.tsx` 및 PC 전용 2컬럼/3컬럼 레이아웃 적용
- [x] 1024px 이상 환경에서 사이드바 자동 전환

---

## Day 9 — SEO 및 품질 안정화 (완료)

- [x] 네이버 서치어드바이저 인증 메타 태그 적용
- [x] Open Graph, Twitter Cards, robots, keywords 웹 표준 메타데이터 전체 적용
- [x] 일정 등록 페이지 오류 수정
- [x] 빌드 안정화: Ref 타입 오류 및 미사용 카테고리 타입 수정

---

## PC WEB 전 구간 프리미엄 인라인 스타일 리디자인 (완료 — 2026-05-08)

> **핵심 결정**: Tailwind CSS v4의 클래스 신뢰성 문제로 인해 **모든 PC/모바일 컴포넌트를 100% 인라인 스타일로 재작성**. `glass-card`, `animate-*`, `var()` CSS 변수 등 Tailwind 유틸리티 클래스 완전 제거.

### 신규 생성 파일 (PC 전용 컴포넌트)
- [x] `src/app/schedules/new/DesktopNewSchedule.tsx` — 2컬럼 프리미엄 일정 등록 폼
- [x] `src/app/schedules/[id]/edit/DesktopEditSchedule.tsx` — 일정 수정 PC 전용 컴포넌트
- [x] `src/app/schedules/[id]/DesktopScheduleDetail.tsx` — 일정 상세 2컬럼 PC 레이아웃

### 수정된 PC 페이지
- [x] `src/app/schedules/[id]/edit/page.tsx` — `useIsDesktop()` 분기 추가, DesktopEditSchedule 연결
- [x] 모든 Desktop* 컴포넌트에서 내부 padding 제거 (pc-content-area와 충돌 방지)

### 디자인 패턴 (PC)
- 다크 히어로 헤더: `linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)` + glow blob
- 2컬럼 그리드: 좌측 메인 콘텐츠 `1fr` + 우측 액션 패널 `360px`
- 카드 스타일: `background:'white', borderRadius:'20px', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.04)'`
- 타입별 컬러 시스템: shared(teal), personal(cyan), child(green), expense(amber)

---

## 모바일 웹 전 구간 프리미엄 인라인 스타일 리디자인 (완료 — 2026-05-08)

> 아래 모든 파일에서 Tailwind 유틸리티 클래스, `glass-card`, `animate-*`, `var()` CSS 변수 완전 제거 → 100% 인라인 스타일로 대체.

| 파일 | 주요 변경 내용 |
|------|--------------|
| `src/app/home/MobileHome.tsx` | 다크 인사 히어로 카드, 접이식 캘린더, 퀵 액션, useMemo 최적화 |
| `src/app/schedules/MobileSchedules.tsx` | 검색/필터 칩, 일정 카드 인라인 스타일 전체 교체 |
| `src/app/schedules/new/MobileNewSchedule.tsx` | 프리미엄 타입 타일(soft bg + 컬러 border), 3컬럼 날짜/시간 그리드 |
| `src/app/schedules/[id]/MobileScheduleDetail.tsx` | 풀블리드 히어로, 바텀시트 모달, child stepper, 참여자 카드 |
| `src/app/schedules/children/MobileChildren.tsx` | SVG 원형 진행률, 탭, 완료 바텀시트 모달 |
| `src/app/budget/MobileBudget.tsx` | 다크 그린 그라디언트 히어로, -24px 겹침 요약 카드 |
| `src/app/family/MobileFamily.tsx` | 바텀시트 모달 스타일 (borderRadius: '32px 32px 0 0') |
| `src/app/notifications/MobileNotifications.tsx` | 타입별 컬러 좌측 보더, 미읽음/읽음 투명도 구분 |
| `src/app/mypage/MobileMyPage.tsx` | GleaumAppIcon→GleaumBI 교체, 인라인 토글 컴포넌트 |
| `src/components/PWAInstallBanner.tsx` | 다크 그라디언트 프리뷰 헤더, 번호 원형 스텝, 그라디언트 설치 버튼 |
| `src/components/layout/BottomNav.tsx` | glass-card → 명시적 frosted glass 인라인 스타일, FAB 중앙 플로팅 |

### 모바일 Safe Area 패턴
```
paddingTop: 'calc(env(safe-area-inset-top) + 48px)'
paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)'
```

---

## 사이드바 모바일 노출 버그 수정 (완료 — 2026-05-08)

- [x] `src/components/layout/DesktopSidebar.tsx` — `useIsDesktop()` 추가, 모바일에서 `return null`
- [x] `src/components/layout/BottomNav.tsx` — `useIsDesktop()` 추가, 데스크탑에서 `return null`
  - 기존 `className="lg:hidden"` Tailwind 클래스가 Tailwind v4에서 동작 안 하던 문제 해결

---

## 모바일 로그인 화면 리디자인 (완료 — 2026-05-08)

- [x] `src/app/login/page.tsx` — `var(--font-display)` 제거
- [x] 플로팅 앱 아이콘 카드 (72px, 그라디언트 bg, glow shadow)
- [x] 점 배경 텍스처 (radial-gradient 패턴)
- [x] safe-area-inset 패딩 적용 (노치/홈바 안전 영역)
- [x] 이메일/비밀번호 인풋 — 왼쪽 아이콘 삽입
- [x] 에러 메시지 → 아이콘 포함 박스 UI로 개선
- [x] 로그인 버튼 — 그라디언트 (`#0084CC → #0CC9B5`)
- [x] Suspense fallback도 다크 배경으로 통일

---

## 모바일 /home 성능 최적화 (완료 — 2026-05-08)

> Vercel Speed Insights에서 `/home` poor 판정 → 7가지 최적화 적용

| 최적화 항목 | 수정 파일 | 효과 |
|------------|---------|------|
| 중복 BottomNav 제거 | `MobileHome.tsx` | DOM 절감, GPU 컴포지팅 레이어 1개 제거 |
| `useMediaQuery` 초기값 즉시 평가 | `src/hooks/useMediaQuery.ts` | hydration 후 재렌더 방지 |
| 폰트 `preconnect` 추가 | `src/app/layout.tsx` | DNS/TLS 핸드셰이크 선제 해소 |
| Pretendard full static → Variable Dynamic Subset | `src/app/layout.tsx` | 폰트 CSS ~70% 경량화 |
| `PWAInstallBanner` → `LazyPWABanner` dynamic import | `src/components/LazyPWABanner.tsx` | 초기 렌더에서 1.5초 setTimeout 재렌더 제거 |
| schedule 필터 `useMemo` 래핑 | `MobileHome.tsx` | 무관한 state 변경 시 재연산 방지 |
| mesh-blob 애니메이션 모바일 비활성화 | `src/app/globals.css` | 모바일 GPU 부하 감소 |
| `@keyframes spin` globals.css 이동 | `src/app/globals.css` | loading 토글마다 style DOM 추가/삭제 방지 |

---

## Google Analytics 4 (GA4) 세팅 (완료 — 2026-05-08)

- [x] Measurement ID: `G-BK5RQTGVNT` (기존 Firebase 프로젝트 연결)
- [x] `src/lib/analytics.ts` — 타입 안전 이벤트 트래킹 유틸리티
  - `GleaumEventParams` 타입으로 이벤트별 파라미터 강제
  - `KEY_EVENTS` 배열로 GA4 콘솔에서 Key Event 지정할 이벤트 목록 관리
- [x] `src/components/GoogleAnalytics.tsx` — `next/script afterInteractive` 전략으로 렌더 블로킹 없이 로드
  - SPA 라우트 전환 시 `page_view` 자동 전송 (`usePathname` + `useSearchParams`)
- [x] Vercel 환경변수 `NEXT_PUBLIC_GA_ID` 등록

### 트래킹 이벤트 목록

| 이벤트 | 발생 위치 | Key Event |
|--------|---------|-----------|
| `login` | `src/app/login/page.tsx` | ✅ |
| `onboarding_complete` | `src/app/onboarding/page.tsx` | ✅ |
| `schedule_create` | `src/app/schedules/new/page.tsx` | ✅ |
| `schedule_view` | `src/app/schedules/[id]/page.tsx` | |
| `schedule_complete` | `src/app/schedules/[id]/page.tsx` | ✅ |
| `pwa_banner_show` | `src/components/PWAInstallBanner.tsx` | |
| `pwa_install_accept` | `src/components/PWAInstallBanner.tsx` | |
| `pwa_installed` | `src/components/PWAInstallBanner.tsx` | ✅ |
| `pwa_install_dismiss` | `src/components/PWAInstallBanner.tsx` | |
| `calendar_toggle` | `src/app/home/MobileHome.tsx` | |

### GA4 콘솔 후속 작업 (사용자 직접 수행)
1. [관리] → [이벤트] → Key Events에서 위 ✅ 이벤트 지정
2. [탐색] → 새 보고서 → **유입경로 탐색**: `page_view(/login)` → `login` → `onboarding_complete` → `schedule_create` 퍼널 설정

---

## PWA 완성 (완료)

- [x] `public/manifest.json` — `standalone` 디스플레이 모드
- [x] `src/app/icon.tsx` — 고화질 다이아몬드 로고 아이콘 동적 생성
- [x] `public/sw.js` + `PwaRegistry.tsx` — 오프라인 지원/설치 가능
- [x] iOS 스플래시 스크린 20종 (`apple-touch-startup-image`) 적용
- [x] Android/iOS PWA 홈 화면 추가 배너 (`PWAInstallBanner.tsx`)

---

---

## Capacitor 네이티브 앱 기반 구축 (완료 — 2026-05-08)

> `docs/14-native-app-plan.md` 계획서에 따른 1단계 작업 완료

### 설치된 Capacitor 패키지 (v8.3.2)
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`
- `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/keyboard`
- `@capacitor/haptics`, `@capacitor/browser`, `@capacitor/local-notifications`
- `@capacitor/app`, `@capacitor/preferences` (보안 스토리지)

### 신규/수정 파일
| 파일 | 내용 |
|------|------|
| `capacitor.config.ts` | 프로덕션 URL 방식(server.url) 설정, 플러그인 설정 |
| `ios/` | iOS Xcode 프로젝트 (npx cap add ios) |
| `android/` | Android Gradle 프로젝트 (npx cap add android) |
| `ios/App/App/Info.plist` | URL 스킴(gleaum://), WKAppBoundDomains, ATT, 권한 요청 메시지 전체 설정 |
| `android/app/src/main/AndroidManifest.xml` | Deep Link, App Links, 권한, Edge-to-Edge 설정 |
| `android/app/src/main/res/xml/network_security_config.xml` | HTTPS 강제, 개발 환경 로컬 IP HTTP 허용 |
| `src/lib/native.ts` | 네이티브 유틸리티 레이어 (isNativeApp, secureStorage, haptic, hideSplash, setStatusBar, openBrowser, onAppResume, onAndroidBackButton) |
| `src/components/NativeAppProvider.tsx` | 앱 마운트 시 스플래시 숨기기 + 상태바 설정 + 뒤로가기 처리 |
| `src/app/layout.tsx` | NativeAppProvider 추가 |
| `.gitignore` | iOS Pods, Android Gradle 빌드 아티팩트 제외 |

### 배포 전략: 서버 URL 방식
- `output: 'export'` 불사용 (API Routes, /auth/callback 유지 필요)
- Capacitor `server.url = 'https://www.gleaum.com'` 설정
- Vercel 배포 후 `npx cap sync` → Xcode/Android Studio에서 제출
- 개발 시: `CAP_DEV_SERVER_URL=http://192.168.x.x:3000 npx cap run ios`

### npm 스크립트 추가
```bash
npm run cap:sync         # 양쪽 동기화
npm run cap:sync:ios     # iOS 동기화
npm run cap:sync:android # Android 동기화
npm run cap:open:ios     # Xcode 열기
npm run cap:open:android # Android Studio 열기
```

### 다음 단계 (Xcode 설치 후 진행)
- [ ] Xcode 설치 (Mac App Store — 약 15GB, 1시간 소요)
- [ ] `npm run cap:open:ios` → 번들 ID `com.gleaum.app` 확인
- [ ] Apple Developer 계정 연결 → 프로비저닝 프로파일 생성
- [ ] Simulator 실행 테스트
- [ ] CocoaPods 설치: `sudo gem install cocoapods && npx cap update ios`

---

## 인프라 및 배포 (현재 상태)

- **프로덕션 URL**: `https://www.gleaum.com`
- **GitHub**: `Edwin-space/gleaum-app` (`main` 브랜치 push → Vercel 자동 배포)
- **Vercel CLI 직접 배포도 가능**: `npx vercel --prod`
- **최신 커밋**: `b68ab5e` (2026-05-08)

---

## Phase 1 — 공간(Space) 아키텍처 전환 (완료 — 2026-05-11)

> `/family` 경로·개념을 전면 `/space`로 마이그레이션. DB 테이블명(`family_groups`, `space_members`)은 유지하되 UI·라우팅·훅만 변경.

### 변경된 핵심 파일

| 파일 | 변경 내용 |
|------|---------|
| `src/app/auth/callback/route.ts` | 자동 Space 생성 로직 제거 — 온보딩에서 사용자가 직접 선택 |
| `src/app/onboarding/page.tsx` | 6단계 플로우로 확장; 4번째 단계 '공간 설정'(만들기/합류/건너뛰기) 추가 |
| `src/app/family/page.tsx` | `redirect('/space')` 영구 리다이렉트 (하위 호환) |
| `src/app/space/page.tsx` | 신규 — `useIsDesktop()` 분기 라우터 |
| `src/app/space/DesktopSpace.tsx` | 신규 — 공간 관리 PC UI |
| `src/app/space/MobileSpace.tsx` | 신규 — 공간 관리 모바일 UI |
| `src/app/invite/[code]/page.tsx` | `/family` → `/space` 리다이렉트 2곳 수정 |
| `src/app/mypage/DesktopMyPage.tsx` | href `/family` → `/space` |
| `src/app/mypage/MobileMyPage.tsx` | href `/family` → `/space` |
| `src/app/home/DesktopHome.tsx` | `space_first` 문구 업데이트 |
| `src/components/layout/DesktopSidebar.tsx` | 사이드바 레이블 `가족` → `공간`, href `/family` → `/space` |
| `src/app/api/cron/reminders/route.ts` | FCM 토큰 조회를 `profiles.family_group_id` → `space_members` JOIN 방식으로 변경 |
| `src/app/api/cron/automations/route.ts` | 동일 패턴 적용 |
| `src/app/api/notifications/renotify/route.ts` | 동일 패턴 적용 |
| `src/lib/analytics.ts` | `onboarding_complete` 이벤트 타입에 `space_setup?: string` 추가 |

### 온보딩 Space 설정 단계 (Step 4)
- **만들기**: 공간 이름 입력 → `createSpace()` 호출
- **합류하기**: 초대 코드 입력 → `joinSpaceByCode()` 호출
- **건너뛰기**: 바로 통과 (나중에 /space에서 생성 가능)

---

## Phase 2 — 4개 기능 개선 동시 적용 (완료 — 2026-05-11)

### #1 모바일 입력 오버플로우 버그 수정

**원인**: `MobileNewSchedule.tsx`의 날짜/시간 영역이 `gridTemplateColumns: '1fr 1fr 1fr'` 3컬럼 그리드여서 iOS Safari에서 입력 필드가 잘림.

**수정**: `src/app/schedules/new/MobileNewSchedule.tsx`
- 날짜 input: 독립 행으로 분리, `marginBottom: '10px'`
- 시간 row: `display: flex` + 각 input에 `flex: 1, minWidth: 0` 적용

### #2 일정 visibility 보안 수정 + UI 배지

**문제**: `getSchedules()`가 `visibility === 'private'`인 타인의 일정도 노출하는 보안 결함.

**수정**: `src/lib/db.ts`
```typescript
.or(`visibility.neq.private,visibility.is.null,created_by.eq.${userId}`)
```

**UI**: `src/components/ui/Card.tsx` — `visibility === 'private'`일 때 `🔒 나만` 배지 표시

### #3 가계부 탭 분리 (공간 지출 / 내 지출)

**수정 파일들**:

| 파일 | 변경 내용 |
|------|---------|
| `src/app/budget/page.tsx` | `BudgetTab = 'space' \| 'personal'` 타입 export; `tab` state 추가; expenses 필터링 로직 분기 |
| `src/app/budget/MobileBudget.tsx` | 탭 switcher UI 추가 (🏠 공간 지출 / 👤 내 지출) |
| `src/app/budget/DesktopBudget.tsx` | 탭 switcher UI 추가; 누락된 `isCurrentMonth` prop 추가 |

**필터 로직**:
- 공간 지출: `visibility !== 'private'` (공간 전체 공유 지출)
- 내 지출: `createdBy === userId && visibility === 'private'` (나만 보는 지출)

### #3-1 가계부 일회성 지출 상태/타임라인 보정 (2026-05-27)

**문제**: 가계부에서 `일회성`으로 등록한 소비가 `status='pending'`으로 저장되어 `결제 예정`처럼 표시되고, 일정 타임라인에도 정기지출처럼 노출될 수 있었음.

**수정 파일들**:

| 파일 | 변경 내용 |
|------|---------|
| `src/lib/db.ts` | `type='expense' AND repeat='none'` 기본값을 `status='completed'`, `automation_policy='reminder_only'`로 중앙 보정 |
| `src/app/budget/page.tsx` | 일회성 지출을 반영 완료 금액/건수로 집계, 정기 지출만 예정 건수에 포함 |
| `src/app/budget/MobileBudget.tsx` | 일회성 배지/`지출반영` 의미로 표시, 일회성 지출의 결제 예정 토글 비활성화 |
| `src/app/budget/DesktopBudget.tsx` | 동일 규칙을 데스크탑 지출 목록/요약 카드에 적용 |
| `src/app/home/page.tsx` | 일회성 지출을 홈 일정/캘린더 데이터에서 제외 |
| `src/app/schedules/page.tsx` | 일회성 지출을 일정 목록/오늘 일정에서 제외 |
| `supabase/migrations/009_fix_one_time_expense_status.sql` | 기존 운영 데이터 중 일회성 지출이 pending/payment_due로 남은 건을 completed/reminder_only로 보정 |

**운영 규칙**:
- 일회성 지출: 이미 소비한 돈의 흐름 → 등록 즉시 `completed`, 자동화/크론 결제 대상 아님.
- 정기 지출: 앞으로 결제/납부할 항목 → `pending`, `payment_due`, 가계부에서 `결제예정/결제완료` 전환 가능.

### #4 공간 권한 시스템 UI 적용

**`useSpace` 훅 확장** (`src/hooks/useSpace.ts`):
- `myRole: SpaceRole | null` 상태 추가
- `Promise.all([getSpaceWithMembers, getMyRoleInSpace])` 병렬 로드

**일정 생성/수정 viewer 차단**:
- `src/app/schedules/new/page.tsx` — `myRole === 'viewer'` 시 토스트 에러 + 조기 반환
- `src/app/schedules/[id]/edit/page.tsx` — 동일 적용

**일정 visibility 토글 (expense 타입)**:
- `src/app/schedules/new/page.tsx` — `expenseVisibility` state (`'space'` 기본값)
- `src/app/schedules/new/MobileNewSchedule.tsx` — 🏠 공간 공유 / 🔒 내 지출 토글 UI
- `src/app/schedules/new/DesktopNewSchedule.tsx` — 동일 UI 추가

**공간 관리 Admin UI**:

| 파일 | 변경 내용 |
|------|---------|
| `src/app/space/MobileSpace.tsx` | ✏️ 이름 수정 버튼(admin), 멤버 역할 배지 Admin/Editor/Viewer, ✕ 제거 버튼(admin, 자신 제외), 이름 수정 모달 |
| `src/app/space/DesktopSpace.tsx` | 동일 기능 PC 버전 — ✏️ 버튼, 역할 배지, ✕ 제거 버튼, 중앙 정렬 다이얼로그 모달 |

**역할 배지 색상**:
- Admin: `#0084CC` (Blue)
- Editor: `#0CC9B5` (Teal)
- Viewer: `#8E8E93` (Gray)

### typeConfig 아이콘 업데이트
- `shared` 타입: 아이콘 `👨‍👩‍👧‍👦` → `🏠`, 설명 `가족 전체` → `공간 공유`

---

## 2026-05-27 — PC 핵심 화면 안정화 (진행 중)

### Space 설정 PC 레이아웃
- [x] `/space/settings`에 Desktop 전용 2컬럼 레이아웃 추가
- [x] PC에서 공간 이름, 목적, 일정 유형, 초대 코드, 멤버, 위험 구역을 한 화면에서 관리 가능
- [x] Desktop 이름 저장은 설정 화면에 머무르도록 분리하고 모바일 기존 흐름은 유지

### Space 생성 PC 레이아웃
- [x] `/space/new`에 Desktop 전용 2컬럼 생성 화면 추가
- [x] PC에서 좌측 공간 설명/기능 요약, 우측 이름·목적 입력 및 생성 폼 제공
- [x] 공간 생성 완료 후 초대 링크 복사/카카오톡 공유/공유 시트/공간 이동 액션을 PC 카드형으로 제공
- [x] Kakao SDK window 타입을 명시해 `no-explicit-any` 린트 오류 제거

---

## 2026-05-26~27 — 초대/공간 정책/네이티브 안정화 (완료)

### 신규 유저 및 온보딩
- [x] 신규 유저가 온보딩으로 직접 진입하도록 플로우 개선
- [x] 온보딩 UI 교체 및 네이티브 앱 감각에 맞춘 초기 경험 개선
- [x] 네이티브 앱 수준 성능 최적화 적용

### 초대/공간 정책
- [x] 초대 링크 로그인 후 공간 합류 경로 유실 버그 수정
- [x] 초대 링크 복사 문제 수정 및 `invite_code` null 자동 생성 처리
- [x] 초대 랜딩 페이지 추가 및 초대 정보 조회 API 추가
- [x] 공간 정책 개편, 초대 공유 3종, 다운로드 페이지 추가
- [x] PC 화면 파리티 보강 — 공간 정책, 초대 공유, 앱 설정 섹션

### 광고/SEO/공개 접근
- [x] `ads.txt` 추가 및 Google AdSense 크롤러 접근 허용
- [x] 페이지 타이틀/OG 이미지 경로 개선
- [x] `/download` 페이지 추가

### 네이티브 앱 안정화
- [x] iOS WKWebView 성능 최적화, 세로 고정, 알림 권한 타이밍 개선
- [x] Android Kotlin stdlib 버전 충돌 해결
- [x] iOS 무료 Apple Developer 계정 빌드를 위해 Associated Domains entitlement 임시 제거
- [x] Universal Links 웹 기반 파일(`apple-app-site-association`)은 준비됨. iOS capability는 유료 Apple Developer 계정 전환 후 재활성화 필요

### 버그 수정
- [x] 가계부 지출 등록 시 즉시 FCM 알림이 발송되던 크리티컬 버그 수정
- [x] 초대/로그인 플로우 및 iOS 인앱 브라우저 대응 개선
- [x] Android 네이티브 앱 로그인 화면이 초대 링크용 인앱 브라우저 차단 안내로 막히던 문제 수정

---

## Google Play 스토어 출시 준비 (완료 — 2026-05-14)

### Firebase SDK 네이티브 연동
- [x] `@capacitor-firebase/messaging` 플러그인 설치 및 연동
- [x] iOS `AppDelegate.swift` — `FirebaseApp.configure()` + `Messaging.messaging().delegate` + APNs 토큰 매핑
- [x] `ios/App/CapApp-SPM/Package.swift` — `CapacitorFirebaseMessaging` 의존성 수동 추가
- [x] `src/lib/firebase.ts` — 네이티브(Capacitor) / 웹(JS SDK) FCM 토큰 분기 처리
- [x] `google-services.json` (Android), `GoogleService-Info.plist` (iOS) — Firebase 구성 파일 배치 완료

### Google OAuth 스코프 축소 (구글 검수 회피)
- [x] `src/hooks/useAuth.ts` — Calendar, Drive 스코프 제거 → `email`, `profile`만 요청
- [x] Google Cloud Console OAuth 스코프 단순화로 Google 앱 검수 불필요 상태 달성

### 구글 캘린더 연동 제거 (기기 캘린더 전환 준비)
- [x] `src/lib/googleCalendar.ts` — 파일 전체 삭제
- [x] `src/lib/db.ts` — Google Calendar API 호출 3곳 제거 (`createSchedule`, `updateSchedule`, `deleteSchedule`)
- [x] `src/app/settings/calendar/page.tsx` — "Google 캘린더 동기화" → "기기 캘린더 연동 준비 중" 안내 페이지로 교체
- [x] `src/app/mypage/MobileMyPage.tsx` — "구글 캘린더" → "기기 캘린더 연동 (준비 중)"
- [x] `src/app/mypage/DesktopMyPage.tsx` — 동일 변경
- [x] `src/types/index.ts` — `source: 'local' | 'google_drive'` → `source: 'local'`

### 법적 문서 페이지 (이용약관 + 개인정보처리방침)
- [x] `src/app/legal/terms/page.tsx` — 이용약관 12개 조항 (운영자: 유태성, helper@gleaum.com)
- [x] `src/app/legal/privacy/page.tsx` — 개인정보처리방침 11개 조항 (테이블형 수탁업체 목록 포함)
- [x] `src/proxy.ts` — `/legal` 공개 경로 추가 (비로그인 접근 허용)
- [x] `src/app/login/page.tsx` — 로그인 화면 하단에 이용약관·개인정보처리방침 링크 연결
- [x] `src/app/mypage/MobileMyPage.tsx` — 마이페이지 푸터에 법적 문서 링크 추가

### Google Play Console 등록 및 패키지명 인증
- [x] Google Play 개발자 등록 및 인증 완료
- [x] 릴리즈 키스토어 생성: `~/gleaum-release.keystore` (alias: gleaum, RSA 2048, 유효: 10,000일)
- [x] 패키지명 소유권 증명 완료 (`com.gleaum.app` — debug.keystore SHA-256 활용)
- [x] `adi-registration.properties` 파일로 APK 서명 후 Play Console 검증 통과
- [x] `android/app/build.gradle` — `signingConfigs.release` 설정 추가
- [x] `android/app/build.gradle` — `proguard-android.txt` → `proguard-android-optimize.txt` 수정 (Gradle 9.4 호환)
- [x] `android/app/src/main/AndroidManifest.xml` — 미사용 권한 제거 (`CAMERA`, `READ_MEDIA_IMAGES`, `READ/WRITE_EXTERNAL_STORAGE`, `USE_BIOMETRIC`, `USE_FINGERPRINT`)
- [x] 서명된 AAB 빌드 성공 (`app-release.aab`) — Google Play 내부 테스트 버전 업로드 완료
- [x] 앱 무결성 설정 완료 (자동 보호 + Google Play 서명 버전)

---

## 백오피스(Admin Backoffice) Phase 1~4 완료 (완료 — 2026-05-13)

> 기존 사용자 앱과 완전히 분리된 독립 관리자 인터페이스.
> 상세 문서는 `backoffice/docs/` 폴더를 참조하세요.

### 기술 스택
- Next.js 16.2.6 (App Router) + Tailwind CSS v4 + shadcn/ui
- Vercel 독립 프로젝트 배포 (Root Directory: `backoffice`)
- 기존 Supabase 프로젝트 공유 사용
- GA4 Data API (`@google-analytics/data` v5, gRPC 기반)

### 구현 완료 화면

| 라우트 | 기능 |
|--------|------|
| `/login` | 관리자 로그인 — Supabase Auth 이메일/비밀번호 |
| `/` | 대시보드 — KPI 카드(회원/공간/일정), GA4 실시간 접속자·7일 통계·상위 페이지 |
| `/users` | 회원 관리 — `profiles` 실데이터, 온보딩 상태·공간 보유 배지 |
| `/spaces` | 공간 관리 — `family_groups` 실데이터, 초대코드 표시 |
| `/campaigns` | CRM 캠페인 빌더 — 5채널 탭 + `{{변수}}` 에디터 + 스마트폰 미리보기 |
| `/ads` | 광고 매니저 — 전략 스위치 + 앱 목업 시뮬레이터 |
| `/settings` | 시스템 설정 — 비밀번호 변경, GA4 연동 상태, API 키 관리 |

### Phase 4 완료 내용 (2026-05-13)

**인증 시스템**
- `src/proxy.ts` — Next.js 16 라우트 보호 미들웨어 (미인증 시 전체 → `/login` 리다이렉트)
- `src/app/login/page.tsx` — 로그인 폼
- `src/components/ConditionalSidebar.tsx` — 로그인 페이지 사이드바 숨김

**비활동 세션 타이머 (10분)**
- `src/components/SessionProvider.tsx` — 마지막 활동 시각 sessionStorage 저장, 10분 비활동 시 자동 로그아웃
- `src/components/Sidebar.tsx` — 카운트다운 UI (120s 이하 노랑, 60s 이하 빨강), 로그아웃 버튼

**GA4 Data API 연동**
- `src/lib/ga4.ts` — `BetaAnalyticsDataClient`로 7일 통계 + 실시간 접속자 + 상위 페이지 조회
- `next.config.ts` — `serverExternalPackages` 설정으로 gRPC 번들링 충돌 해결
- GA4 서비스 계정(`gleaum-backoffice@gleaum-firebase.iam.gserviceaccount.com`) 뷰어 권한 부여 완료

**실데이터 연동**
- 전 페이지 `force-dynamic` 적용으로 정적 렌더링 문제 해결
- 회원 관리 컬럼명 오류 수정 (`full_name` → `name`, `onboarding_completed` → `onboarding_completed_at`)

### 미완료 (Phase 5 이후)
- Recharts 차트 (WAU 트렌드, 가계부 vs 캘린더 비율)
- 회원/공간 상세 페이지
- CRM 실제 발송 API
- 광고 설정 DB 저장
