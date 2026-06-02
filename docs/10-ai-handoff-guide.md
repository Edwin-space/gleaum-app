# 10. AI 인수인계 가이드 (AI Handoff Guide)

> 이 문서는 어떤 AI(Claude, Gemini, GPT 등)라도 이 프로젝트를 이어받아 즉시 작업할 수 있도록 작성된 **최우선 참고 문서**입니다.
> **최종 업데이트**: 2026-06-02

---

## 🚨 절대 규칙 (작업 전 반드시 읽기)

1. **백엔드/DB 구조 절대 변경 금지** — `supabase/schema.sql`, `src/lib/db.ts`, `src/types/index.ts`의 핵심 구조는 건드리지 말 것.
2. **단일 DB 진입점 유지** — 모든 Supabase 쿼리는 반드시 `src/lib/db.ts`에만 추가.
3. **⚠️ 인라인 스타일 전용** — Tailwind CSS v4 신뢰성 문제로 **모든 컴포넌트는 100% 인라인 스타일**만 사용. `glass-card`, `animate-*`, `var()`, `bg-brand-gradient` 등 Tailwind 유틸리티 클래스 절대 사용 금지.  
   _예외_: `src/app/onboarding/page.tsx`는 기존 Tailwind 클래스 혼용 중 — 수정 시 인라인으로 전환.
4. **디자인 토큰 (인라인 스타일로 직접 사용)**:
   - Brand Blue: `#0084CC`
   - Teal: `#0CC9B5`
   - Green: `#2EE895`
   - Dark Navy: `#1A1B2E` / `#2D2E4A`
   - Background: `#FAFAFD`
   - ⚠️ **Purple(`#5A32FA`)은 완전 폐기**
5. **RLS 보안** — 새 테이블 생성 시 반드시 RLS 활성화 + `my_space_ids()` 기반 정책 추가.
6. **TypeScript 엄격 모드** — 타입 오류 없이 `npm run build` 통과해야 함.
7. **배포** — `npx vercel --prod` 로 직접 배포. 또는 `git push origin main` → Vercel 자동 배포.
8. **AI 간 작업 동기화** — 작업 완료 후 반드시 `docs/10-ai-handoff-guide.md` 업데이트 후 커밋.
9. **제품 방향 유지** — 글리움은 **개인 중심 + Space 확장형 토털 라이프 관리 서비스**. 개인 단독 사용이 기본, 공간은 선택적 확장.
10. **hooks 임포트 경로** — `useIsDesktop()`은 `@/hooks/useMediaQuery`에서 import (NOT `@/hooks/useIsDesktop`).
11. **NAS 자동 동기화** — `git push` 후 `.git/hooks/post-push` 훅이 자동으로 NAS 동기화. 훅이 없는 경우: `bash scripts/install-hooks.sh` 실행.
12. **`/family` 경로 폐기** — `/family`는 `/space`로 영구 리다이렉트. 새 코드에서 `/family` 참조 금지.
13. **Space 용어 통일** — 코드/문서에서 "가족(family)" → "공간(space)" 용어 사용. DB 테이블명(`family_groups`)은 하위 호환으로 유지.
14. **개인 공간 / 공유 공간 구분** — 모든 사용자는 `preferences.personalSpaceId`로 개인 공간을 식별. 공유 공간은 `sharedSpaceId`/현재 `family_group_id`로 분리 판단. 자세한 내용은 아래 "공간 아키텍처" 섹션 참고.
15. **공간 데이터 경계 절대 보장** — 개인 일정/지출은 반드시 개인 공간에만 저장하고, 공유 공간 화면은 `visibility='private'` 데이터를 절대 표시하지 않음.

---

## 현재 앱 상태 (2026-05-28 기준)

### 서비스 현황
- **프로덕션 URL**: `https://www.gleaum.com`
- **GitHub**: `Edwin-space/gleaum-app` (main 브랜치)
- **최신 배포**: GitHub `main` 자동 배포 기준. 작업 전 Vercel 상태 확인 권장
- **Google Play**: 내부 테스트 버전 업로드 완료 (`com.gleaum.app`, versionCode: 1)

### 최근 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-02 | Android 기기 캘린더 연동 1차 구현. `NativeCalendarPlugin` 추가, READ/WRITE_CALENDAR 권한 연결, 설정 화면에서 권한 요청/캘린더 선택/앞으로 30일 일정 수동 내보내기 지원 |
| 2026-06-02 | iOS 스플래시 후 웹 로그인 flash 보정. JS `hideSplash()`가 300ms에 스플래시를 강제 종료하던 문제를 3000ms로 맞추고, 네이티브 LoginViewController는 0.45초에 미리 올리도록 조정 |
| 2026-06-02 | iOS 스플래시/로그인 전환 UX 보정. Capacitor SplashScreen 3초 적용, iOS LoginViewController 표시를 2.75초 지연시켜 스플래시 종료 직전 cross-dissolve로 부드럽게 전환 |
| 2026-06-02 | iOS 네이티브 로그인 OAuth UX 보정. `LoginViewController` Google 아이콘 asset 추가, SFSafariViewController fullscreen 적용, OAuth 성공 후 Safari/Login 스택 자동 dismiss, JS OAuth Browser.close await 제거 |
| 2026-06-02 | P0 데이터 경계 보강. `getScheduleById()` 단일 조회에 private 생성자 필터를 추가하고, `supabase/migrations/015_harden_private_schedule_rls.sql`로 schedules/schedule_participants RLS를 강화 |
| 2026-06-02 | PC Web / Mobile Web / Android App / iOS 예정 앱의 기능 싱크 기준표 추가. `docs/15-feature-parity-matrix.md`를 신규 작성하고, 공통 기능/플랫폼 전용 기능/불일치 점검 대상을 정리 |
| 2026-06-02 | 공유 테마 모드 시스템 추가. `light/dark/system` 3모드와 `ThemeProvider`, `ThemeModeSelector`, theme 토큰 기반 shell UI 반영 |
| 2026-06-01 | 네이티브 생체인증 앱 잠금 추가. Android 지문/생체인증 및 iOS Face ID/Touch ID 플러그인, 온보딩/마이페이지 설정/앱 잠금 게이트 반영 |
| 2026-06-01 | Android Google OAuth 네이티브 콜백 세션 저장 보정. 로그인 후 모바일 웹 로그인 화면으로 되돌아가는 문제를 막기 위해 implicit callback 토큰 저장 처리 추가 |
| 2026-05-28 | 공간 초대문/링크 생성 안정화. 복사/공유 전 `/api/invite/info`로 코드 유효성을 확인하고, DB에 없는 오래된 코드면 자동 재발급 후 최신 코드로 초대문 생성 |
| 2026-05-28 | 백오피스 Firebase App Distribution 연동 보정. REST API 경로를 projectNumber 기준으로 수정하고, 테스터는 `projects.testers.list` + 그룹 필터로 조회. `/releases` 페이지에 사용 안내/진단 UI 추가 |
| 2026-05-28 | Android Studio Sync 오류 수정. Firebase App Distribution Gradle DSL 제거, 배포는 `scripts/distribute-android.sh` Firebase CLI 방식으로 유지. `:app:tasks`, `:app:assembleDebug` 통과 확인 |
| 2026-05-28 | Android Firebase Performance Gradle 플러그인 제거. AGP 9.x에서 Transform API 제거로 빌드 호환 불가하여 SDK dependency는 유지하되 Gradle perf-plugin 적용은 제거 |
| 2026-05-28 | 백오피스 릴리즈 관리 + Remote Config 편집기 추가. Firebase App Distribution 릴리즈 조회/테스터 관리, Remote Config 플래그 토글 기능 반영 |
| 2026-05-28 | Firebase 통합 기반 추가. Crashlytics, Remote Config, App Check, App Distribution 스크립트/설정 추가. Performance SDK는 의존성 유지, Gradle 플러그인은 제거됨 |
| 2026-05-28 | 고정지출 연체 알림 + 주간 소비 다이제스트 + D-day UI 추가. `/api/cron/overdue-expenses`, `/api/cron/weekly-digest`, `012_cron_overdue_and_digest.sql` 추가 |
| 2026-05-28 | 가계부/공간 지출 개념 분리. `/budget`은 개인 가계부 전용으로 고정하고, 공간 지출은 공간 내부에서 관리하며 `내 가계부` 버튼으로 개인 가계부에 반영 |
| 2026-05-28 | 공간 초대/역할/아바타 안정화. 코드 복사는 순수 초대 코드만 복사, 신규 참여 기본 역할은 viewer, 역할 표시명은 공간 지기/공간 운영자/공간 멤버로 변경, Google avatar URL 레이아웃 깨짐 방지 |
| 2026-05-28 | 공간 데이터 경계 보정. 개인 가계부/개인 일정은 `personalSpaceId`에만 저장하고, 공유 공간/홈/일정 화면에서는 `visibility='private'` 데이터를 제외. `getSpaceWithMembers()`/`getMySpaces()`의 Supabase 조인 의존 제거 |
| 2026-05-27 | 가계부 일회성 지출이 `pending`/결제 예정 일정처럼 보이던 문제 수정. 일회성 지출은 `completed + reminder_only`로 저장하고 홈/일정 타임라인에서는 제외 |
| 2026-05-27 | `/space/new` Desktop 2컬럼 생성 화면 추가. PC에서 공간 설명과 생성 폼, 생성 후 초대 액션을 분리 표시 |
| 2026-05-27 | `/space/settings` Desktop 2컬럼 레이아웃 추가. PC에서 공간 이름/목적/일정 유형/초대/멤버/위험 구역을 한 화면에서 관리 |
| 2026-05-27 | Android 네이티브 앱 로그인에서 초대 링크용 인앱 브라우저 차단 안내가 뜨던 문제 수정. `getBlockedBrowserInfo()`는 Capacitor 네이티브 앱에서 `null` 반환 |
| 2026-05-27 | `1a5db08` — iOS 무료 Apple Developer 계정 빌드를 위해 Associated Domains entitlement 제거. Universal Links는 유료 계정 전환 후 재활성화 |
| 2026-05-27 | `8377d36` — 가계부 지출 등록 시 즉시 FCM 알림이 발송되던 크리티컬 버그 수정 |
| 2026-05-27 | `e5212f6` — 초대 랜딩 페이지, 딥링크/Universal Links 웹 기반, 페이지 타이틀 추가 |
| 2026-05-27 | `ff1cfbb` / `67297e1` — 초대/로그인 플로우, iOS 인앱 브라우저 대응, AdSense `ads.txt` 접근 문제 수정 |
| 2026-05-27 | `68a2c29` / `105f52b` — 공간 정책 개편, 초대 공유 3종, 다운로드 페이지, PC 파리티 보강 |
| 2026-05-26 | `a498f14`~`d6f5db5` — 신규 유저 온보딩 직접 진입, 네이티브 성능 최적화, iOS WKWebView 개선, Android Kotlin stdlib 충돌 해결 |
| 2026-05-14 | Firebase SDK 네이티브 연동 (iOS AppDelegate + Package.swift) |
| 2026-05-14 | Google Calendar/Drive 연동 완전 제거 → 기기 캘린더 전환 준비 |
| 2026-05-14 | Google OAuth 스코프 축소 (email+profile만 요청) |
| 2026-05-14 | 법적 문서 페이지 신규 생성 (`/legal/terms`, `/legal/privacy`) |
| 2026-05-14 | 릴리즈 키스토어 생성 + Google Play 패키지명 소유권 인증 완료 |
| 2026-05-14 | Android 미사용 권한 제거 (CAMERA, BIOMETRIC 등) |
| 2026-05-14 | signed AAB 빌드 → Google Play 내부 테스트 버전 업로드 완료 |
| 2026-05-12 | `04fe0ca` — 개인 공간 자동 생성, `hasSharedSpace` 도입 |
| 2026-05-12 | `46e8985` — DesktopBudget UX 3종 개선 |
| 2026-05-11 | `c6fb8f2` — Phase 1 Space 전환 + Phase 2 기능 개선 4종 |

### 주요 인프라 현황

| 구분 | 상태 |
|------|------|
| Vercel 웹 배포 | ✅ 운영 중 (`https://www.gleaum.com`) |
| 백오피스 배포 | ✅ 운영 중 (별도 Vercel 프로젝트) |
| GA4 데이터 수집 | ✅ 정상 (서비스 계정 뷰어 권한 부여 완료) |
| Firebase FCM | ✅ 웹/네이티브 분기 처리 완료 |
| Firebase Crashlytics | ✅ 네이티브 사용자 ID 연동 기반 추가 |
| Firebase Remote Config | ✅ 웹/네이티브 유틸 + 백오피스 편집기 추가 |
| Firebase App Check | ✅ 초기화 유틸 추가 |
| Firebase App Distribution | ✅ Android 배포 스크립트 + 백오피스 릴리즈 관리 추가 |
| Google Play | ✅ 내부 테스트 버전 등록 완료 |
| App Store (iOS) | ❌ 미등록 (APNs 설정 후 진행 필요) |
| 2026-05-11 | `5446976` | space_members 테이블 + 역할 기반 RLS |

### 코드 아키텍처 패턴

```
page.tsx (thin router — 상태 + 핸들러)
  ├── useIsDesktop() 분기
  ├── if (isDesktop) return <DesktopXxx />
  └── return <MobileXxx />
```

모든 `page.tsx`는 상태와 핸들러만 보유하고, 실제 UI는 `Desktop*.tsx` / `Mobile*.tsx`로 완전 분리.

---

## ✅ 현재 작동 중인 기능 전체 목록

| 기능 | 경로/파일 | 상태 |
|------|----------|------|
| Google OAuth 로그인 | `/login` → `/auth/callback` | ✅ |
| 온보딩 플로우 (6단계) | `/onboarding` | ✅ |
| 온보딩 "혼자 시작" → 개인 공간 자동 생성 | `onboarding/page.tsx` | ✅ |
| 홈 대시보드 | `/home` (PC/모바일) | ✅ |
| 일정 CRUD | `/schedules`, `/schedules/new`, `/schedules/[id]` | ✅ |
| 일정 수정 | `/schedules/[id]/edit` | ✅ |
| 자녀 일정 | `/schedules/children` | ✅ |
| 공간 관리 (멤버/권한/초대/이름변경) | `/space` (PC/모바일) | ✅ |
| `/family` 하위호환 리다이렉트 | `/family/page.tsx` | ✅ |
| 초대 링크/코드 | `/invite/[code]` | ✅ |
| **가계부 — 개인/공간 탭 분리** | `/budget` | ✅ |
| **가계부 — 개인 지출 공간 불필요** | `budget/page.tsx` | ✅ 신규 |
| **가계부 — 금액 콤마 포맷 + 만원 힌트** | `MobileBudget`, `DesktopBudget` | ✅ 신규 |
| **가계부 — 일회성 지출 즉시 반영 처리** | `db.ts`, `budget/*`, `home/page.tsx`, `schedules/page.tsx` | ✅ 신규 |
| 마이페이지 | `/mypage` | ✅ |
| 알림 목록 | `/notifications` | ✅ |
| FCM 푸시 알림 | `FCMProvider`, `useFCM` | ✅ |
| 일정 리마인더 크론 | `/api/cron/reminders` | ✅ |
| 자동화 정책 엔진 | `/api/cron/automations` | ✅ |
| PC 랜딩페이지 | `DesktopLanding.tsx` | ✅ |
| GA4 분석 | `analytics.ts` | ✅ |
| PWA | `manifest.json`, `sw.js` | ✅ |
| SEO 최적화 | `layout.tsx` 메타데이터 | ✅ |
| visibility 보안 (private 일정 본인만) | `db.ts` | ✅ |
| 역할 기반 권한 UI (Admin/Editor/Viewer) | `space/*.tsx` | ✅ |

---

## ❌ 미구현 / 다음 작업 후보

| 기능 | 우선순위 | 비고 |
|------|---------|------|
| 이미지 첨부 실제 업로드 | 🟡 | UI만 있음, Supabase Storage 연동 필요 |
| 기기 캘린더 연동 | 🟡 | Google Calendar/Drive 연동은 제거됨. 네이티브 기기 캘린더 방식으로 재설계 필요 |
| 통계/분석 페이지 | 🟢 | 신규 개발 필요 |
| 네이티브 앱 출시 마무리 | 🔴 | Android 내부 테스트 업로드 완료. iOS는 APNs/유료 Apple Developer/Associated Domains 재활성화 필요 |
| Space 타입 확장 | 🟢 | `family_groups.type` 컬럼 추가 → 개인/연인/가족/모임 구분 |
| 일정 단건 외부 공유 | 🟢 | `/share/[scheduleId]` 공개 읽기 전용 뷰 |

---

## 🔴 다음 우선 작업 후보: 공간 경계 회귀 테스트

공간 데이터 경계는 2026-05-28에 코드 보정 완료. 다음에는 Supabase 실제 데이터 기준으로 회귀 테스트를 자동화하는 것이 좋음.

### 테스트해야 할 핵심 케이스
- 초대받은 사용자가 개인 지출을 등록해도 공유 공간 가계부/타임라인에 보이지 않음
- 공유 공간 지출은 공유 공간에만 보이고 개인 가계부에는 섞이지 않음
- 공유 공간 설정/멤버 화면은 `space_members` 기준으로 모든 멤버를 표시
- 개인 일정/지출은 `personalSpaceId`에 저장, 공유 일정/지출은 `sharedSpaceId`에 저장

## 최신 Claude 작업 확인 (2026-05-28)

Claude가 진행한 뒤 문서 반영이 누락되어 있던 핵심 변경입니다.

### 지출/알림
- `/api/cron/overdue-expenses`: 고정지출 미결제 D+0/3/7 FCM + in-app 알림
- `/api/cron/weekly-digest`: 매주 월요일 09:00 KST 지난 7일 개인 지출 다이제스트
- `supabase/migrations/012_cron_overdue_and_digest.sql`: Supabase pg_cron 등록 SQL. 실행 전 `app_url`, `cron_secret` 수정 필수
- 가계부 PC/모바일 D-day UI: D-N, 내일 결제, 오늘 결제일, N일 경과 표시
- 모바일 홈 가계부 카드: 미결제 고정지출 건수 배지 표시

### Firebase/Android
- `FirebaseServicesProvider`: App Check, Remote Config, Crashlytics 사용자 ID 초기화
- `src/lib/remote-config.ts`: feature flag 기본값 및 웹/네이티브 Remote Config fetch
- `src/lib/crashlytics.ts`, `src/lib/app-check.ts`, `src/lib/firebase-performance.ts` 추가
- `scripts/distribute-android.sh`: release APK 빌드 후 Firebase App Distribution 배포
- `firebase.json`: Firebase 프로젝트/App Distribution 설정
- AGP 9.x 호환 문제로 Firebase Performance Gradle plugin은 제거됨. Firebase App Distribution Gradle plugin/DSL도 Android Studio Sync 안정성을 위해 제거됨. `@capacitor-firebase/performance` 의존성은 유지하고, App Distribution 배포는 `scripts/distribute-android.sh`의 Firebase CLI 방식 사용

### 백오피스
- `/backoffice/releases`: Firebase App Distribution 릴리즈 관리. REST API는 `projects/{projectNumber}` 기준이며, 테스터는 전체 테스터 목록에서 `internal-testers` 그룹 포함 여부로 필터링
- `/backoffice/settings`: Remote Config 편집기
- 중복 사용자 앱 `/admin` 대시보드는 제거되고 백오피스 프로젝트로 통합

### 지출 카테고리 가이드
- `docs/Guide/expenses.md`: 고정지출/변동지출 1~3차 카테고리 설계 초안

## 🔴 기능 싱크 기준 (2026-06-02 추가)

상세 기준표는 `docs/15-feature-parity-matrix.md`를 먼저 확인한다.

- PC Web / Mobile Web / Android App / iOS 예정 앱은 같은 제품이어야 한다. UI 형태는 달라도 기능 상태, 진입 경로, 권한 정책, 데이터 경계는 동일한 의미를 가져야 한다.
- 네이티브 전용 기능은 웹에서 억지로 동작시키지 않는다. 대신 숨기거나 `앱 전용`, `준비 중`, `지원 예정`으로 명확히 안내한다.
- P0 회귀 대상은 로그인 세션 복귀, 초대 링크/코드, 개인/공간 데이터 경계, 공간 멤버/역할, 가계부/공간 지출 분리다.
- 설정 항목은 테마, 생체인증, 알림, 캘린더, 홈 화면 구성의 노출 정책을 웹/앱 기준으로 통일해야 한다.
- 기능 싱크 작업 후에는 이 문서와 `docs/15-feature-parity-matrix.md`를 같이 업데이트한다.

## 핵심 파일 맵

```
src/
├── lib/
│   ├── db.ts              ← 모든 Supabase 쿼리 (단일 진입점)
│   ├── analytics.ts       ← GA4 이벤트 트래킹
│   ├── fcm.ts             ← FCM 서버 발송
│   └── native.ts          ← Capacitor 네이티브 유틸
├── types/
│   └── index.ts           ← 모든 TypeScript 타입 정의
│                            OnboardingPreferences.personalSpaceId 포함
├── hooks/
│   ├── useCurrentUser.ts  ← 현재 사용자 (spaceId, personalSpaceId, sharedSpaceId, hasSharedSpace, refresh)
│   ├── useSpace.ts        ← 공간 데이터 (space, members, myRole, refresh)
│   ├── useSchedules.ts    ← 일정 목록 + CRUD
│   └── useMediaQuery.ts   ← useIsDesktop() — 반드시 이 파일에서 import
├── app/
│   ├── space/
│   │   ├── page.tsx
│   │   ├── DesktopSpace.tsx  ← 멤버 카드, 역할 배지, ✏️ 이름변경, ✕ 멤버제거
│   │   └── MobileSpace.tsx
│   ├── budget/
│   │   ├── page.tsx          ← BudgetTab 타입, hasSharedSpace 사용
│   │   ├── DesktopBudget.tsx ← 개인 탭 우선, 금액 콤마, visibility 없음
│   │   └── MobileBudget.tsx  ← 동일 UX
│   ├── schedules/new/
│   │   ├── page.tsx
│   │   ├── DesktopNewSchedule.tsx
│   │   └── MobileNewSchedule.tsx
│   └── family/
│       └── page.tsx          ← redirect('/space')
└── components/
    ├── ui/Card.tsx           ← 🔒 나만 배지 (visibility === 'private')
    └── layout/
        └── DesktopSidebar.tsx
```

---

## 공간(Space) 아키텍처 상세

### 핵심 개념: 두 레이어 분리

```
기술 레이어: 모든 데이터는 항상 어떤 공간에 속한다 (family_group_id 항상 존재)
UX 레이어:  사용자는 "개인 일정/지출"과 "공간 일정/지출"만 본다
```

### 공간 종류

| 종류 | 생성 시점 | `preferences.personalSpaceId` | 특징 |
|------|---------|-------------------------------|------|
| **개인 공간** | 온보딩 "혼자 시작" 또는 `ensureUserSetup()` 자동 | 해당 spaceId와 동일 | 사용자에게 노출 안 함 |
| **공유 공간** | 온보딩 "새 공간 만들기" 또는 초대 코드 참여 | 다른 값 (또는 null) | 멤버 초대, 공유 일정 |

### `hasSharedSpace` 판별 로직

```typescript
// src/hooks/useCurrentUser.ts
const personalSpaceId = profile?.preferences?.personalSpaceId ?? null;
const hasSharedSpace = !!spaceId && spaceId !== personalSpaceId;
```

- 혼자 사용하는 사용자: `spaceId === personalSpaceId` → `hasSharedSpace = false`
- 공간 만들거나 참여한 사용자: `spaceId !== personalSpaceId` → `hasSharedSpace = true`

### 공간 데이터 경계 규칙 (2026-05-28 보정)

- 개인 일정/지출 저장 대상: `personalSpaceId`
- 공유 일정/지출 저장 대상: `sharedSpaceId` 또는 명시적으로 선택한 공유 공간 ID
- `profiles.family_group_id`는 현재 활성/공유 공간 포인터로 취급. 공유 공간 참여 후 개인 데이터 저장 대상에 사용하면 안 됨
- `visibility='private'` 데이터는 공유 공간 화면, 공유 공간 타임라인, 공유 공간 가계부에서 제외
- Google OAuth 프로필 이미지 URL은 텍스트로 렌더링하지 말고 `UserAvatar` 컴포넌트로 이미지/이모지를 분기 처리
- `getSpaceWithMembers()`/`getSpaceMembers()`/`getMySpaces()`는 Supabase nested join에 의존하지 말고 멤버십과 프로필/공간을 분리 조회
- 기존 잘못 저장된 private 데이터 보정 SQL: `supabase/migrations/010_move_private_records_to_personal_space.sql`

### `useCurrentUser` 반환값

```typescript
const {
  user,           // User 객체
  profile,        // ProfileRow (raw DB data)
  familyGroupId,  // string | null — 현재 소속 공간 ID (하위 호환)
  spaceId,        // string | null — familyGroupId 와 동일 (신규 코드용)
  personalSpaceId,// string | null — 개인 일정/지출 저장 대상
  sharedSpaceId,  // string | null — 공유 일정/지출 저장 대상
  hasSharedSpace, // boolean — 공유 공간 여부 (가계부/일정 탭 활성화 판단)
  loading,
  refresh,
} = useCurrentUser();
```

### DB 구조

```sql
-- family_groups (= 공간. 내부 테이블명 유지)
id          uuid PRIMARY KEY
name        text
invite_code text
created_by  uuid → auth.users
created_at  timestamptz

-- space_members (역할 기반 멤버십)
id          uuid PRIMARY KEY
space_id    uuid → family_groups.id
user_id     uuid → auth.users
role        text CHECK IN ('admin', 'editor', 'viewer')
joined_at   timestamptz

-- profiles (사용자 프로필)
family_group_id  uuid → family_groups.id   -- 현재 소속 공간
preferences      jsonb                      -- personalSpaceId 포함
```

### 역할별 권한 매트릭스

| 기능 | admin / 공간 지기 | editor / 공간 운영자 | viewer / 공간 멤버 |
|------|:-----:|:------:|:------:|
| 일정/지출 조회 | ✅ | ✅ | ✅ |
| 일정/지출 생성 | ✅ | ✅ | ❌ |
| 공간 이름 변경 | ✅ | ❌ | ❌ |
| 멤버 제거 | ✅ | ❌ | ❌ |

초대 링크/코드로 처음 참여한 사용자의 기본 역할은 `viewer`(공간 멤버)입니다. 공간 지기가 필요할 때만 `editor` 또는 `admin`으로 승격합니다.

### 마이그레이션 보정 (Phase 1 이전 생성자 처리)

Phase 1 이전에 공간을 만든 사용자는 `space_members`에 없을 수 있음. 두 곳에서 자동 backfill:

```typescript
// db.ts — getMyRoleInSpace() 및 getSpaceWithMembers() 에 폴백 적용
if (group?.created_by === user.id) {
  await supabase.from('space_members').upsert(
    { space_id: spaceId, user_id: user.id, role: 'admin' },
    { onConflict: 'space_id,user_id', ignoreDuplicates: true }
  );
  return 'admin';
}
```

---

## 가계부 (Budget) 시스템 상세

### 제품 기준

`/budget`은 개인 가계부 전용입니다. 공간 지출을 가계부 안에서 탭으로 함께 보여주지 않습니다.

```text
개인 가계부 = 내가 실제 소비했거나 내 기록으로 남길 돈의 흐름
공간 지출   = 공간 안에서 함께 관리하는 공동비/모임비/가족비/데이트비
반영        = 공간 지출 중 내가 낸 금액 또는 내 부담분을 개인 가계부로 복사
```

### 저장 규칙

- 개인 가계부 항목: `family_group_id = personalSpaceId`, `visibility = 'private'`
- 공간 지출 항목: `family_group_id = sharedSpaceId`, `visibility = 'space'`
- 공간 지출을 개인 가계부로 반영하면 새 private expense를 만들고 원본 연결 컬럼을 채움
- 원본 연결 컬럼: `source_space_expense_id`, `source_space_id`, `expense_reflection_type`, `expense_reflected_at`
- 같은 사용자가 같은 공간 지출을 중복 반영하지 않도록 DB unique index 사용

### 일회성 지출 vs 정기 지출 상태 규칙

가계부는 현재 `schedules` 테이블의 `type='expense'`를 사용하지만, 일회성 지출은 일정/결제 예정이 아니라 이미 발생한 돈의 흐름이다.

```typescript
repeat === 'none'
  ? { status: 'completed', automationPolicy: 'reminder_only' }
  : { status: 'pending',   automationPolicy: 'payment_due' };
```

- 일회성 지출: 등록 즉시 `completed`, 가계부에서 `지출반영`으로 표시, 홈/일정 타임라인에는 노출하지 않음.
- 정기 지출: `pending`으로 시작, 가계부에서만 `결제예정/결제완료` 토글 가능, 일정 타임라인의 `정기지출` 필터에 노출 가능.
- 기존 데이터 보정 SQL: `supabase/migrations/009_fix_one_time_expense_status.sql`
- 공간 지출 반영 컬럼 SQL: `supabase/migrations/011_add_expense_reflection_columns.sql`

### `AddExpenseInput` 타입

```typescript
export interface AddExpenseInput {
  title: string;
  amount: number;
  date: Date;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  repeat: RepeatType;
}
```

---

## Space 관리 UI (DesktopSpace / MobileSpace)

### 기능 목록
- 공간 이름 표시 + ✏️ 이름 변경 (admin 전용)
- 멤버 카드: 이름, 역할 배지, ✕ 제거 버튼 (admin만, 자기 자신 제외)
- 초대 코드 표시 + 복사
- 멤버 초대 링크 공유

### 역할 배지 색상

```typescript
// Admin: #0084CC (Blue)
// Editor: #0CC9B5 (Teal)
// Viewer: #8E8E93 (Gray)
```

---

## Visibility 보안

```typescript
// src/lib/db.ts — getSchedules()
.or(`visibility.neq.private,visibility.is.null,created_by.eq.${userId}`)
```

| visibility | 의미 | 조회 가능 |
|------------|------|-----------|
| `'space'` | 공간 전체 공유 | 공간 멤버 전체 |
| `'private'` | 본인만 (🔒 나만 배지) | 작성자 본인 |
| `'selected'` | 지정 참여자만 | 미구현 UI |

---

## 인라인 스타일 표준 패턴

### 카드 컴포넌트
```tsx
<div style={{
  background: 'white',
  borderRadius: '20px',
  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
  border: '1px solid rgba(0,0,0,0.04)',
  padding: '20px',
}}>
```

### 다크 히어로 헤더
```tsx
<div style={{
  background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
  position: 'relative', overflow: 'hidden',
}}>
  {/* glow blob */}
  <div style={{
    position: 'absolute', top: '-30px', right: '-30px',
    width: '140px', height: '140px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,132,204,0.35) 0%, transparent 70%)',
    pointerEvents: 'none',
  }} />
```

### 그라디언트 버튼
```tsx
<button style={{
  background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
  color: 'white', borderRadius: '18px', border: 'none',
  boxShadow: '0 8px 24px rgba(0,132,204,0.3)',
}}>
```

### 비활성화 탭 (공간 없을 때)
```tsx
<button
  onClick={() => !disabled && setTab(key)}
  style={{
    border: disabled ? '1.5px dashed rgba(...,0.3)' : 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    color: disabled ? 'rgba(...,0.35)' : activeColor,
  }}
>
  {label}{disabled ? ' (공간 필요)' : ''}
</button>
```

### 역할 배지 (Admin/Editor/Viewer)
```tsx
<span style={{
  padding: '6px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 800,
  background: role === 'admin' ? 'rgba(0,132,204,0.1)' : role === 'viewer' ? 'rgba(142,142,147,0.1)' : 'rgba(12,201,181,0.1)',
  color: role === 'admin' ? '#0084CC' : role === 'viewer' ? '#8E8E93' : '#0CC9B5',
}}>
  {role === 'admin' ? 'Admin' : role === 'viewer' ? 'Viewer' : 'Editor'}
</span>
```

### 모바일 Safe Area
```tsx
paddingTop: 'calc(env(safe-area-inset-top) + 48px)'
paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)'
```

### 모바일 input overflow 방지 (iOS Safari)
```tsx
{/* ❌ 금지 */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>

{/* ✅ 권장 */}
<div style={{ display: 'flex', gap: '8px' }}>
  <input style={{ flex: 1, minWidth: 0 }} />
</div>
```

### GA4 이벤트 트래킹
```tsx
import { trackEvent } from '@/lib/analytics';

trackEvent('schedule_create', {
  schedule_type: type,
  has_participants: participants.length > 0,
  has_reminder: reminder > 0,
  has_repeat: repeat !== 'none',
});
```

---

## 전체 작업 이력 (Phase별)

### Phase 1 — Space 아키텍처 전환 (2026-05-11)

| Step | 내용 | 커밋 |
|------|------|------|
| 1 | `space_members` 테이블 + 역할 기반 RLS | `5446976` |
| 2 | SpaceRole/SpaceMember 타입 교체 | `c999212` |
| 3 | 온보딩 Space 선택 단계 추가, 인증 콜백 자동 생성 제거 | `c6fb8f2` |
| 4 | Cron/알림 API → `space_members` 기반 교체 | `c6fb8f2` |
| 5 | `/family` → `/space` 전면 마이그레이션 | `c6fb8f2` |

### Phase 2 — 기능 개선 4종 (2026-05-11)

| # | 내용 | 파일 |
|---|------|------|
| 1 | 모바일 입력 오버플로우 수정 | `MobileNewSchedule.tsx` |
| 2 | visibility 보안 수정 + 🔒 배지 | `db.ts`, `Card.tsx` |
| 3 | 가계부 탭 분리 + 지출 추가 기능 | `budget/page.tsx`, `*Budget.tsx` |
| 4 | 공간 권한 UI (Admin/Editor/Viewer) | `DesktopSpace.tsx`, `MobileSpace.tsx` |

### Phase 3 — 가계부 UX + 공간 아키텍처 개선 (2026-05-11~12)

| # | 내용 | 커밋 |
|---|------|------|
| 1 | Space Admin 미표시 버그 수정 (backfill) | `d0711c9` |
| 2 | 가계부 3종 UX 개선 (탭순서, 콤마포맷, visibility 제거) Mobile | `d0711c9` |
| 3 | 가계부 3종 UX 개선 동일 적용 Desktop | `46e8985` |
| 4 | **개인 공간 자동 생성 아키텍처** | `04fe0ca` |

#### Phase 3-4 핵심 변경사항 (`04fe0ca`)
- `createPersonalSpace(displayName)` — 개인 공간 생성 + `preferences.personalSpaceId` 저장
- `ensureUserSetup()` — 온보딩 완료 후 공간 없으면 자동 생성 (기존 사용자 보정)
- 온보딩 "혼자 시작" → `createPersonalSpace()` 호출 (이전: 아무것도 안 함)
- `useCurrentUser` — `hasSharedSpace` 추가
- `budget/page.tsx` — `hasSpace = hasSharedSpace` 로 교체, 에러 메시지 정리

---

## 환경변수 목록

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=

# App URL
NEXT_PUBLIC_APP_URL=

# Firebase / FCM
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
FIREBASE_SERVICE_ACCOUNT_BASE64=

# GA4
NEXT_PUBLIC_GA_ID=G-BK5RQTGVNT

# Cron
CRON_SECRET=
```

---

## 작업 시작 체크리스트

```bash
# 1. 최신 코드 확인
git log --oneline -5

# 2. 타입 확인 및 로컬 빌드 테스트
npm run build
# 필요 시 네이티브 동기화
npm run cap:sync

# 3. 배포
npx vercel --prod
# 또는 git push (Vercel 자동 배포)
git add [파일들] && git commit -m "feat: ..." && git push origin main
```

---

## 커밋 히스토리 (최신순)

| 커밋 | 날짜 | 내용 |
|------|------|------|
| `1a5db08` | 2026-05-27 | fix(ios): Associated Domains entitlement 제거 — 무료 Apple Developer 빌드 복구 |
| `8377d36` | 2026-05-27 | fix: 가계부 지출 등록 시 즉시 FCM 발송 버그 수정 |
| `e5212f6` | 2026-05-27 | feat: 초대 랜딩 페이지 + 딥링크/Universal Links 웹 기반 + 페이지 타이틀 |
| `ff1cfbb` | 2026-05-27 | feat: 초대/로그인 플로우 버그 수정 + iOS 인앱 브라우저 대응 + AdSense ads.txt |
| `105f52b` | 2026-05-27 | feat(desktop): PC 파리티 — 공간 정책 + 초대 공유 3종 + 앱 설정 섹션 |
| `68a2c29` | 2026-05-27 | feat: 공간 정책 개편, 초대 공유 3종, 다운로드 페이지, UX 버그 수정 |
| `d6f5db5` | 2026-05-26 | fix(android): Kotlin stdlib 버전 충돌 해결 |
| `ee29c39` | 2026-05-26 | feat(ios): WKWebView 성능 최적화, 세로 고정, 알림 권한 타이밍 개선 |
| `a498f14` | 2026-05-26 | fix: 신규 유저 온보딩 직접 진입 + 온보딩 UI 교체 |
| `04fe0ca` | 2026-05-12 | feat: 개인 공간 자동 생성 + hasSharedSpace 도입 |
| `46e8985` | 2026-05-12 | refactor(budget): DesktopBudget UX 3종 개선 |
| `d0711c9` | 2026-05-11 | fix: Space Admin 미표시 버그 + 가계부 지출 추가 |
| `c6fb8f2` | 2026-05-11 | feat: Phase 1 Space 전환 + Phase 2 기능 개선 4종 |
| `c999212` | 2026-05-11 | feat(types): SpaceRole/SpaceMember 타입 교체 |
| `5446976` | 2026-05-11 | feat(db): space_members 테이블 + RLS |
| `2de32c3` | 2026-05-08 | fix(ios): Mac Catalyst → Designed for iPad 전환 |
| `2354961` | 2026-05-08 | feat(ios): iPad + macOS 지원 확장 |
| `0be69da` | 2026-05-08 | feat(android): 앱 기반 구축 |
| `b68ab5e` | 2026-05-08 | feat: Capacitor 네이티브 앱 기반 구축 |
| `f304a95` | 2026-05-08 | feat: 전체 UI 리디자인 + GA4 |

---

## 네이티브 앱 현황

> 상세 계획: `docs/14-native-app-plan.md`

| 플랫폼 | 상태 | 비고 |
|--------|------|------|
| iOS | Capacitor 기반 및 WKWebView 최적화 완료 | 무료 Apple Developer 계정에서는 Associated Domains 불가. 유료 계정 전환 후 Push Notifications/Associated Domains 재활성화 필요 |
| Android | Google Play 내부 테스트 업로드 완료 | 정식 출시 전 R8 매핑, 네이티브 디버그 기호, 데이터 안전/스토어 등록정보 필요 |
| macOS | "Designed for iPad" 방식 | Mac Catalyst 대신 |

- **기술**: Capacitor.js (`server.url = 'https://www.gleaum.com'` — 웹 래핑 방식)
- **DB**: 웹과 동일한 Supabase 공유, 별도 백엔드 불필요

---

## Codex 작업 인수인계 — 2026-05-28 오후

### 1. 백오피스 Firebase App Distribution 연동 보정

**문제**
- Firebase Console에는 `internal-testers` 그룹과 테스터가 존재했지만, 백오피스 `/releases` 페이지에는 데이터가 비어 보였음.

**원인**
- App Distribution REST API 경로는 `projects/{projectNumber}` 기준인데 기존 코드는 `projects/gleaum-firebase`처럼 Firebase project id를 사용함.
- 그룹 상세 조회 응답에 테스터 배열이 포함된다고 가정했지만 실제로는 `projects/{projectNumber}/testers`를 별도 조회한 뒤 `tester.groups`로 필터링해야 함.
- 실패 응답을 빈 배열로 삼켜서 운영 화면에서는 단순 “데이터 없음”처럼 보였음.

**수정 파일**
- `backoffice/src/lib/firebase-admin.ts`
- `backoffice/src/app/api/releases/route.ts`
- `backoffice/src/app/releases/page.tsx`
- `backoffice/docs/03-current-status.md`
- `backoffice/docs/04-trouble-log.md`
- `docs/07-features-completed.md`
- `docs/10-ai-handoff-guide.md`

**검증**
- 실제 Firebase API 확인 결과: `internal-testers` 그룹 1개, 테스터 1명 확인, 릴리즈는 현재 API 기준 0개.
- `backoffice`에서 `npm run build` 통과.
- `npm run lint`는 기존 백오피스 lint 설정이 `.next` 산출물까지 검사하는 문제와 기존 lint 이슈 때문에 실패. 이번 수정의 빌드 검증은 통과.

**커밋**
- `7362e0c fix(backoffice): repair app distribution sync`

### 2. Android Studio Gradle Sync 오류 수정

**문제**
- Android Studio에서 `firebaseAppDistribution()` 메서드를 찾지 못해 Gradle sync/debug가 실패.

**원인**
- `android/app/build.gradle`에 Firebase App Distribution Gradle DSL이 남아 있었지만 Gradle plugin은 제거/미적용 상태였음.

**수정**
- App Distribution Gradle DSL 제거.
- 배포는 `scripts/distribute-android.sh`의 Firebase CLI 방식으로 유지.

**검증**
- `cd android && JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :app:tasks --quiet` 통과.
- `cd android && JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :app:assembleDebug --quiet` 통과.

**커밋**
- `7a37e08 fix(android): remove app distribution gradle DSL`

### 3. 공간 초대 코드/초대문 유효성 보강

**문제**
- 공유된 초대문에 포함된 `GLEAUM-QL7NG86K` 링크가 `/invite/GLEAUM-QL7NG86K`에서 “유효하지 않은 초대 코드”로 표시됨.

**확인 결과**
- 프로덕션 API 직접 확인: `https://www.gleaum.com/api/invite/info?code=GLEAUM-QL7NG86K`가 404 반환.
- 즉 해당 코드는 현재 운영 DB 기준 존재하지 않는 코드였음.

**수정 방향**
- 초대 코드/초대 링크/전체 초대문을 복사 또는 공유하기 전에 `/api/invite/info`로 실제 서버 유효성을 확인.
- 유효하지 않은 오래된 코드면 공간 지기 권한에서 자동 재발급 후, 재발급된 코드가 서버에서 확인될 때만 공유.
- 공간 설정 페이지의 “코드 복사”도 동일한 검증 로직 적용.

**수정 파일**
- `src/app/space/DesktopSpace.tsx`
- `src/app/space/MobileSpace.tsx`
- `src/app/space/settings/page.tsx`
- `docs/07-features-completed.md`
- `docs/10-ai-handoff-guide.md`
- `docs/README.md`

**검증**
- `npm run build` 통과.

**커밋**
- `6d36c17 fix(space): validate invite codes before sharing`

### 4. 현재 작업트리 주의사항

아래 Android 관련 파일 4개가 아직 미커밋 변경으로 남아 있음. Codex가 만든 변경은 아니며, Android Studio/Capacitor sync 또는 Firebase 네이티브 연동 과정에서 생긴 변경으로 보임.

- `android/app/build.gradle`
  - `versionCode 8 → 9`
  - `versionName 1.0.8 → 1.0.9`
- `android/app/capacitor.build.gradle`
  - `@capacitor-firebase/app-check`, `crashlytics`, `performance`, `remote-config` Android dependency 추가
- `android/capacitor.settings.gradle`
  - 위 Capacitor Firebase plugin project include 추가
- `android/release-notes.txt`
  - 기존 문구가 `릴리즈 노트` 한 줄로 변경됨. 임시 입력값일 가능성이 높음.

**다음 AI에게 권장**
- Android 변경 4개는 사용자가 의도한 릴리즈 준비 변경인지 먼저 확인할 것.
- `android/release-notes.txt`는 임시 문구라면 정리 필요.
- 초대 링크 문제는 새 배포 반영 후 새 초대문을 다시 복사/발송해야 기존에 발송된 죽은 코드 문제를 피할 수 있음.
- Firebase App Distribution 릴리즈가 백오피스에 0개로 보이는 것은 현재 Firebase API 기준 릴리즈가 0개였기 때문. 새 APK를 `scripts/distribute-android.sh`로 배포한 뒤 `/releases`에서 다시 확인할 것.

---

## 2026-06-02 Codex 인수인계 — Android Google 로그인 네이티브 세션 보정

### 문제

Google Play 배포본에서 Google 로그인을 완료한 뒤 앱 내부가 인증 상태로 전환되지 않고 모바일 웹 로그인 화면으로 돌아가는 증상이 발생했다.

### 원인

Android 네이티브 로그인은 Supabase implicit OAuth(`gleaum://auth/callback#access_token=...`)를 사용한다. 기존 구조는 OAuth 콜백을 WebView의 `appUrlOpen` 이벤트로 넘겨 React 쪽에서 처리하는 흐름이었는데, 앱 cold start/라우터 전환 시점에는 WebView 리스너가 아직 붙기 전이라 콜백 이벤트를 놓칠 수 있었다. 또한 React의 implicit 토큰 처리 분기는 Supabase 세션만 설정하고 네이티브 `SessionManager`에는 저장하지 않아, 다음 네이티브 라우팅에서 로그인 상태를 확인하지 못할 수 있었다.

### 수정

- `android/app/src/main/java/com/gleaum/app/RouterActivity.kt`
  - `gleaum://auth/callback` 진입 시 URL fragment의 `access_token`, `refresh_token`, `expires_in`을 직접 파싱해 `SessionManager`에 먼저 저장.
  - WebView 이벤트가 유실되어도 네이티브 세션이 남도록 보강.
- `android/app/src/main/java/com/gleaum/app/MainActivity.kt`
  - OAuth 딥링크를 받을 때 동일하게 implicit 세션을 저장하는 방어 로직 추가.
  - RouterActivity를 거치지 않는 재진입 케이스까지 보호.
- `src/components/NativeAppProvider.tsx`
  - PKCE/implicit OAuth 성공 시 공통 `saveNativeSession()`으로 네이티브 세션 저장.
  - implicit 토큰 분기도 `NativeSession.saveSession()`을 호출하도록 수정.

### 검증

- `npm run build` 통과.
- `cd android && JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :app:assembleDebug --quiet` 통과.

### 다음 배포 주의

- Google Play에 이미 올라간 빌드에는 이 수정이 포함되어 있지 않으므로 새 Android 빌드를 생성해 배포해야 한다.
- 배포 전 `android/app/build.gradle`의 `versionCode`/`versionName`이 Play Console 기준으로 증가되어 있는지 확인할 것.
- 실제 단말에서 Google 로그인 후 `/login`으로 돌아가지 않고 `/home` 또는 온보딩 미완료 시 `/onboarding`으로 이동하는지 확인할 것.

---

## 2026-06-02 Codex 인수인계 — 네이티브 생체인증 앱 잠금 추가

### 목적

글리움 앱에서 개인 일정, 공간 데이터, 가계부 정보가 노출되지 않도록 Android 지문/기기 잠금, iOS Face ID/Touch ID 기반 앱 잠금 기능을 추가했다. 설정은 계정 단위가 아니라 기기별 로컬 설정으로 저장한다.

### 구현 범위

- 신규 사용자: 온보딩 마지막 단계에 `앱 잠금 설정` 단계 추가
- 기존 사용자: 네이티브 앱 첫 진입 시 1회 생체인증 잠금 제안 모달 표시
- 마이페이지: `계정 & 보안` 영역에서 생체인증 앱 잠금 토글 제공
- 앱 실행/백그라운드 복귀: 잠금이 켜져 있으면 생체인증 또는 기기 잠금 인증 요구
- 웹 브라우저: 기능 비활성. 네이티브 앱에서만 동작

### 수정 파일

- `android/app/src/main/java/com/gleaum/app/NativeBiometricPlugin.kt` — Android framework `BiometricPrompt` 기반 인증 브리지
- `android/app/src/main/java/com/gleaum/app/MainActivity.kt` — `NativeBiometricPlugin` 등록
- `android/app/src/main/AndroidManifest.xml` — `USE_BIOMETRIC`, `USE_FINGERPRINT`, optional fingerprint feature 선언
- `ios/App/App/NativeBiometricPlugin.swift` — iOS `LocalAuthentication` 기반 Face ID/Touch ID 브리지
- `ios/App/Gleaum.xcodeproj/project.pbxproj` — iOS 신규 Swift 파일 타겟 포함
- `src/lib/native-biometric.ts` — JS 측 Capacitor 브리지 + 기기별 로컬 설정 래퍼
- `src/components/NativeBiometricGate.tsx` — 앱 잠금 오버레이, 기존 사용자 1회 제안, 앱 복귀 인증 처리
- `src/app/layout.tsx` — 전역 `NativeBiometricGate` 삽입
- `src/app/onboarding/page.tsx` — 온보딩 마지막 보안 설정 단계 추가
- `src/app/mypage/page.tsx`, `src/app/mypage/MobileMyPage.tsx`, `src/app/mypage/DesktopMyPage.tsx` — 마이페이지 생체인증 토글 추가

### 검증

- `npm run build` 통과
- `cd android && JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :app:assembleDebug --quiet` 통과
- `xcodebuild -project ios/App/Gleaum.xcodeproj -scheme Gleaum -configuration Debug -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build` 통과

### 주의사항

- 실제 생체인증 UX는 빌드 통과만으로 완전히 검증되지 않는다. Android 실기기 지문 등록 상태, iPhone Face ID/Touch ID 등록 상태에서 최종 확인해야 한다.
- 이 기능은 앱 잠금 UX이며, 현재 세션 저장소 자체를 Android Keystore / iOS Keychain으로 암호화 이전한 것은 아니다. 다음 보안 고도화 단계는 네이티브 세션 저장소 강화다.

---

## 2026-06-02 Codex 인수인계 — PC/Mobile Web/Native WebView 테마 동기화 기반

### 목적

PC 웹, 모바일 웹, 네이티브 앱 WebView가 서로 다른 배경/쉘 감각을 갖고 있던 문제를 줄이기 위해 공통 테마 시스템을 추가했다. 기본 라이트 모드는 전체 배경을 흰색 기준으로 정리하고, 사용자가 `자동/라이트/다크` 중 선택할 수 있게 했다.

### 구현 범위

- `자동`: OS/브라우저 `prefers-color-scheme`에 따라 라이트/다크 자동 적용
- `라이트`: 전체 앱 배경을 흰색 중심으로 고정
- `다크`: 전역 배경, 텍스트, 서피스, 네비게이션 쉘을 다크 토큰으로 전환
- 설정 저장은 `localStorage`의 `gleaum:theme-mode` 사용
- 초기 렌더 깜빡임을 줄이기 위해 `layout.tsx` head에 테마 초기화 스크립트 삽입

### 수정 파일

- `src/lib/theme.ts` — 테마 모드 타입, 저장 키, 적용/해결 유틸
- `src/components/ThemeProvider.tsx` — 전역 테마 컨텍스트 및 시스템 모드 감지
- `src/components/ui/ThemeModeSelector.tsx` — `자동/라이트/다크` 선택 UI
- `src/app/layout.tsx` — `ThemeProvider` 적용 및 초기화 스크립트 추가
- `src/styles/tokens.css` — `--theme-*` 라이트/다크 토큰 추가
- `src/app/globals.css` — 전역 body/app shell/mesh/glass-card 배경을 테마 토큰 기반으로 변경
- `src/components/layout/BottomNav.tsx`, `src/components/layout/DesktopSidebar.tsx` — 공통 네비게이션 쉘을 테마 토큰 기반으로 전환
- `src/app/mypage/DesktopMyPage.tsx`, `src/app/mypage/MobileMyPage.tsx` — 마이페이지 앱 설정에 화면 모드 선택 추가

### 검증

- `npm run build` 통과

### 남은 작업

- 이번 작업은 전역 테마 기반과 핵심 쉘 동기화다. 아직 각 페이지 내부에 남아 있는 인라인 하드코딩 색상은 화면별로 점진적으로 `var(--theme-*)` 토큰으로 전환해야 한다.
- 특히 홈/일정/가계부/공간 상세 화면의 카드 배경과 텍스트 색상은 후속 정리가 필요하다.

---

## 2026-06-02 Codex 인수인계 — 네이티브 보안 설정 고도화

### 목적

기존 생체인증 앱 잠금은 온보딩과 마이페이지 토글 중심이라, 온보딩을 이미 마친 기존 사용자에게 명확한 보안 설정 구간이 부족했다. 또한 앱 전체/민감 구간별 잠금 범위와 재인증 주기를 설정할 수 없었다. 이를 보완하기 위해 독립 보안 설정 페이지를 추가했다.

### 구현 범위

- `/settings/security` 신규 추가
- Desktop/Mobile 분리 규칙 준수: `DesktopSecuritySettings.tsx`, `MobileSecuritySettings.tsx`, `page.tsx`
- 공통 UI/로직: `SecuritySettingsContent.tsx`
- 마이페이지 계정/보안 영역에서 생체인증 토글을 직접 숨기거나 노출하는 방식 대신, 항상 `보안 설정` 메뉴로 진입하도록 변경
- 네이티브 앱이 아닌 웹에서는 “앱 전용 기능” 안내를 표시
- 생체인증 미지원/미등록 기기에서는 휴대폰 설정에서 지문, Face ID 또는 기기 잠금을 먼저 등록해야 한다는 안내 표시

### 수정 파일

- `src/lib/native-biometric.ts`
  - 잠금 범위 저장 키 추가: `gleaum:biometric-lock-scopes`
  - 재인증 주기 저장 키 추가: `gleaum:biometric-relock-interval`
  - `getBiometricLockScopes()`, `setBiometricLockScopes()` 추가
  - `getBiometricRelockInterval()`, `setBiometricRelockInterval()` 추가
  - `shouldRequireBiometricUnlock()` 추가
- `src/components/NativeBiometricGate.tsx`
  - `usePathname()` 기반 현재 경로 감지
  - 보호 범위 설정에 따라 앱 전체 또는 특정 민감 경로에서만 잠금 요구
  - 재인증 주기에 따라 최근 인증 시간이 유효하면 즉시 재인증하지 않도록 보정
- `src/app/settings/security/page.tsx`
- `src/app/settings/security/DesktopSecuritySettings.tsx`
- `src/app/settings/security/MobileSecuritySettings.tsx`
- `src/app/settings/security/SecuritySettingsContent.tsx`
- `src/app/mypage/MobileMyPage.tsx`
  - 기존 사용자도 항상 `보안 설정` 메뉴를 볼 수 있도록 변경
- `src/app/mypage/DesktopMyPage.tsx`
  - PC 마이페이지 계정/보안 영역에 `보안 설정` 메뉴 추가

### 보호 범위 매핑

- `app`: 제외 경로를 제외한 앱 전체
- `budget`: `/budget`
- `spaceSettings`: `/space/settings`
- `accountSettings`: `/mypage`, `/settings/security`

### 검증

- `npm run build` 통과

### 남은 작업

- Android/iOS 실기기에서 각 보호 범위 진입 시 인증 UX 확인 필요
- 보호 범위 후보는 현재 핵심 민감 화면 위주다. 추후 `/schedules/[id]/edit`, 공간 상세 내 민감 액션 등으로 확대 여부를 검토할 수 있다.
- 현재 설정은 기기별 로컬 저장소 기준이다. 계정 단위 보안 정책이 필요해지면 DB 프로필 설정과 병합 정책을 별도로 설계해야 한다.

---

## 2026-06-02 Codex 인수인계 — Android 네이티브 로그인 후 웹 로그인 재노출 방지

### 문제

Google Play 배포/Android 단말에서 네이티브 Google 로그인 처리가 끝난 뒤 다시 모바일 웹 로그인 화면(`/login`)이 뜨는 증상이 재발했다. 원인은 네이티브 세션 저장 자체보다 WebView 초기 라우팅과 서버 proxy의 인증 판정 타이밍 레이스로 판단했다.

### 원인 정리

- Android `SessionManager`에는 Supabase 세션이 저장될 수 있다.
- `MainActivity`는 WebView localStorage에 세션을 주입하지만, 서버 `proxy.ts`는 최초 보호 경로 요청을 쿠키 기준으로 판단한다.
- 루트(`/`)의 `RootPageRouter`가 네이티브 앱에서도 즉시 `/home`으로 이동시키면, 브라우저 클라이언트가 세션/cookie를 완전히 적용하기 전에 서버 proxy가 `/home` 요청을 받고 `/login`으로 리다이렉트할 수 있다.
- 기존 `NativeAppProvider.applyNativeSession()`은 Supabase 클라이언트에 이미 세션이 있다고 판단하면 조기 return 했기 때문에, `/login`에 머무는 상황을 다시 `/home`으로 복구하지 못할 수 있었다.

### 수정

- `src/components/NativeAppProvider.tsx`
  - `resolvePostLoginPath()` 추가: 온보딩 완료 여부에 따라 `/home` 또는 `/onboarding` 결정.
  - 네이티브 `NativeSessionPlugin.getSession()` 값이 있으면 기존 Supabase 클라이언트 세션 여부와 관계없이 `supabase.auth.setSession()`을 다시 호출.
  - WebView localStorage와 Supabase 브라우저 클라이언트 세션/cookie 적용 타이밍을 맞춤.
  - WebView 세션만 살아 있고 현재 경로가 `/` 또는 `/login`이면 후속 경로로 복구.
- `src/components/landing/RootPageRouter.tsx`
  - 네이티브 앱에서는 루트 페이지가 직접 `/home`으로 이동하지 않도록 변경.
  - 네이티브 로그인 후 이동 책임을 `NativeAppProvider`로 일원화.

### 검증

- `npm run build` 통과.
- `cd android && JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :app:assembleDebug --quiet` 통과.

### 실기기 확인 필요

- Google 로그인 후 모바일 웹 `/login`이 다시 노출되지 않는지 확인.
- 로그인 완료 후 기존 사용자 `/home`, 온보딩 미완료 사용자 `/onboarding` 이동 확인.
- 이미 배포된 Play 빌드에는 포함되지 않으므로 Android 새 빌드/AAB 생성 후 재배포 필요.
