# 17. Android Native Port Guide

> 최종 업데이트: 2026-06-23
>
> 목적: Android 앱을 단순 WebView 앱처럼 보이지 않게 단계적으로 네이티브화하되, 기존 Mobile Web UI를 임의 변경하지 않기 위한 기준 문서.

---

## 1. 핵심 정의

Android Native Port는 **UI 개선 작업이 아니다.**

Android Native Port는 현재 운영 중인 Mobile Web UI를 정답지로 삼아 Android Native View로 이식하는 작업이다.

### 목표

- 사용자는 WebView 일부를 쓰는 앱인지, Android Native 앱인지 구분하지 못해야 한다.
- 화면의 정보 구조, 문구, 컴포넌트 순서, 색상, 여백, 카드 형태, 버튼 형태는 Mobile Web과 동일해야 한다.
- Android 특유의 네이티브 기능은 자연스럽게 붙이되, UI를 새로 디자인하지 않는다.
- 전환하지 않은 화면은 기존 WebView fallback을 유지한다.

### 비목표

- Android Material Design으로 재해석하지 않는다.
- iOS 네이티브 화면 스타일을 Android에 복사하지 않는다.
- 하단 네비게이션, 홈 카드, 버튼, 아이콘을 임의로 새로 만들지 않는다.
- 화면 순서를 바꾸지 않는다.
- 네이티브화 과정에서 사용자가 기존 앱과 다른 제품으로 느끼게 만들지 않는다.

---

## 2. 플랫폼 전략

| 플랫폼 | 전략 |
|---|---|
| PC Web | 운영 기준 UI/기능 유지 |
| Mobile Web | Android Native Port의 시각/흐름 기준 원본 |
| Android App | Mobile Web UI를 정답지로 한 단계적 Native Port |
| iOS App | 별도 네이티브 UX로 진행 가능 |
| macOS | iOS 계열 네이티브 UX를 확장 |

Android는 Web과 함께 움직인다. iOS/macOS는 별도 네이티브 제품군으로 발전할 수 있다.

---

## 3. Native Port 원칙

### 반드시 지킬 것

- Port 대상 화면의 Mobile Web 파일을 먼저 읽는다.
- Android 구현 전 현재 Mobile Web의 화면 순서를 문서/체크리스트로 적는다.
- Android Native 구현은 그 순서를 그대로 따른다.
- 색상은 `DESIGN.md`와 `src/styles/tokens.css`의 브랜드/테마 토큰에 맞춘다.
- 컴포넌트 수치가 필요한 경우 Mobile Web inline style 값을 우선한다.
- Web과 Android가 같은 API/DB 정책을 사용하게 한다.
- Android 네이티브 기능은 기존 Web UI의 버튼/설정 흐름 안에 연결한다.

### 금지

- Native Port 중 UX 개선을 겸하지 않는다.
- “Android답게”라는 이유로 UI를 바꾸지 않는다.
- iOS에서 만든 Native Shell/BottomNav 스타일을 Android에 재사용하지 않는다.
- 검증 전 `MainActivity` 위에 별도 Native layer를 즉시 활성화하지 않는다.
- WebView 홈과 Native 홈을 동시에 경쟁시키는 구조를 만들지 않는다.

---

## 4. 구현 방식

### 권장 단계

1. **Web UI Snapshot 작성**
   - 대상 화면의 섹션 순서
   - 주요 컴포넌트
   - 버튼/탭/모달 동작
   - API/DB 데이터 원천

2. **Android Native 화면 비활성 구현**
   - Feature flag 또는 별도 Activity/Fragment로 준비
   - 운영 사용자의 기본 진입 흐름에는 연결하지 않음

3. **비교 검증**
   - Mobile Web 화면과 Android Native 화면을 나란히 비교
   - 차이가 있으면 Android를 Web에 맞춤

4. **부분 활성화**
   - 내부 테스트 빌드에서만 활성
   - 로그인/복귀/뒤로가기/딥링크/푸시 탭 이동 회귀 테스트

5. **기존 WebView fallback 유지**
   - Native 화면 실패 시 WebView 경로로 열 수 있어야 함

---

## 5. 화면 전환 우선순위

| 우선순위 | 화면/기능 | 이유 |
|---|---|---|
| P0 | 로그인/세션/딥링크/푸시/생체인증/캘린더 브리지 | 앱 기반 기능. UI 변경 없이 네이티브 안정성 확보 가능 |
| P1 | 홈 | 앱 첫인상. 단, Mobile Web UI와 동일한 Native Port 필요 |
| P1 | 일정 등록/수정 | 사용자 핵심 행동. Android 입력/날짜/알림 권한과 연결 필요 |
| P1 | 가계부 등록/목록 | 돈 흐름 입력 안정성이 중요 |
| P2 | 공간/초대/멤버 관리 | 데이터 경계와 역할 권한 검증 필요 |
| P2 | 마이페이지/설정 | 네이티브 기능 설정 연결 |

---

## 6. 홈 화면 Native Port 기준

Mobile Web 기준 파일:

- `src/app/home/MobileHome.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/components/InlineFeedAd.tsx`
- `src/components/ui/Card.tsx`
- `src/components/calendar/CalendarView.tsx`

### 섹션 순서

현재 Mobile Web 홈의 순서를 기준으로 한다.

1. 상단 헤더
2. 인사 + 오늘 요약 카드
3. 오늘/투데이 달력 진입
4. 캘린더 펼침 영역
5. 선택일 일정
6. 광고
7. 다가오는 일정
8. 이번 달 개인 가계부
9. 하단 네비게이션

사용자가 별도로 요청한 홈 구성 순서가 있을 경우 문서와 Mobile Web을 먼저 맞춘 뒤 Android Native Port를 진행한다.

### 금지된 홈 작업

- 하단 네비게이션을 새 스타일로 만들기
- 홈 카드 문구를 바꾸기
- 광고 위치를 임의 변경하기
- 일정이 없을 때 빈 상태 UI를 새로 만들기
- Web에는 없는 빠른 액션을 추가하기

---

## 7. Android 네이티브 기능 브리지 기준

UI Port와 별개로 아래 기능은 WebView UI 위에서 우선 안정화한다.

| 기능 | 기준 |
|---|---|
| FCM | `FCMProvider` → `useFCM` → `@capacitor-firebase/messaging` 단일 경로 |
| Web Push | Web/PWA 전용. Native App에서는 `usePushSubscription()` 스킵 |
| 생체인증 | `NativeBiometricPlugin` + Web 설정 UI 연결 |
| 기기 캘린더 | `NativeCalendarPlugin` + `/settings/calendar` 연결 |
| 세션 | `NativeSessionPlugin` + Supabase localStorage 주입 |
| OAuth | Native LoginActivity → RouterActivity/MainActivity 세션 저장 |

---

## 8. 검증 체크리스트

Native Port 화면을 활성화하기 전 반드시 확인한다.

- [ ] Mobile Web 기준 화면을 캡처하거나 섹션 순서를 문서화했다.
- [ ] Android Native 화면이 동일한 섹션 순서를 따른다.
- [ ] 하단 네비게이션 형태/라벨/순서가 Web과 동일하다.
- [ ] 뒤로가기 버튼이 WebView fallback과 충돌하지 않는다.
- [ ] 로그인 후 `/login`으로 되돌아가지 않는다.
- [ ] 앱 재실행 시 세션이 유지된다.
- [ ] 딥링크/초대링크가 기존 웹 경로와 동일한 데이터를 연다.
- [ ] 푸시 알림 탭 시 올바른 경로로 이동한다.
- [ ] 실패 시 WebView fallback으로 복구 가능하다.
- [ ] `npm run build`와 Android `:app:assembleDebug`가 통과한다.

---

## 9. 최근 판단

2026-06-23에 Native Home Preview 1차 시각 점검을 진행했다.

확인/보정 사항:

- Android `:app:assembleDebug` 통과
- 연결된 실기기 `HA1R8ST7`에는 운영 설치본(`versionName=1.0.20`)이 있어 debug Preview 확인 대상으로 사용하지 않음
- `Pixel_9` 에뮬레이터에 debug APK 설치 후 `NativeHomePortActivity` 실행 확인
- 로그인 세션이 없는 에뮬레이터에서는 세션 없음 안내가 표시됨
- 상단 상태바와 로고가 겹치는 safe-area 문제를 `statusBarHeight()` 기반 상단 padding으로 보정
- 하단 네비게이션을 text-only 구조에서 icon + label + active top indicator 구조로 보정
- release/운영 빌드에서 Preview Activity가 열리는 경우 검은 화면으로 종료하지 않고 debug build 전용 안내를 표시하도록 보정

남은 확인:

- 실제 로그인 세션이 있는 debug 환경에서 데이터 바인딩 화면 확인
- Mobile Web 홈 실제 캡처와 Native Preview 세부 UI 비교
- 하단 네비 아이콘을 임시 문자 기반에서 전용 vector drawable 또는 custom View stroke 아이콘으로 고도화할지 판단

2026-06-23 추가 보정:

- `NativeBottomNavIconView` custom Canvas icon으로 하단 네비 임시 문자 아이콘 제거
- 하단 네비 아이콘은 Lucide 계열의 outline/stroke 감도에 맞춰 `Paint.Style.STROKE`, round cap/join으로 직접 렌더링
- 날짜 토글/빈 일정 카드의 임시 `▣` 아이콘도 동일한 custom calendar icon으로 교체
- `Pixel_9` 에뮬레이터에서 로그인 세션이 있는 Preview 데이터 바인딩 화면 확인
- Android `:app:assembleDebug` 통과

2026-06-23 CI/네비 재보정:

- 상단 Header를 텍스트 `gleaum`에서 공식 `logo.png` + `gleaum_bi.svg` 기반 Android 리소스 조합으로 교체
- Android용 자산 추가: `drawable-nodpi/gleaum_logo_native.png`, `drawable-nodpi/gleaum_bi_native.png`
- BottomNav stroke icon 크기/두께/라벨 weight 조정
- Pretendard 폰트 파일은 현재 레포에 없어 Native Preview 라벨은 `sans-serif-medium`으로 우선 정돈
- Android `:app:assembleDebug` 통과 및 `Pixel_9` 에뮬레이터 캡처 확인

2026-06-23 BottomNav/시스템바 추가 보정:

- Native Home Header 알림 버튼을 텍스트에서 웹과 동일한 bell outline icon으로 교체
- BottomNav 높이를 76dp에서 56dp로 낮춰 웹 BottomNav의 48px 슬림 구조에 가깝게 보정
- BottomNav icon size를 20dp 기준으로 맞추고 stroke를 2.2dp로 조정
- `마이` 라벨/사람 아이콘을 웹 기준 `전체`/menu icon으로 교체
- `공간` 아이콘을 임시 다이아몬드에서 group/people 계열 outline으로 보정
- Light status/navigation bar flag를 적용해 밝은 배경에서 Android 시스템 아이콘 대비가 깨지지 않도록 수정
- Android `:app:assembleDebug` 통과 및 `Pixel_9` 에뮬레이터 캡처 확인: `/tmp/gleaum-native-home-nav-polish-2.png`

2026-06-23 Header/Hero/Card Chrome 보정:

- Header를 ScrollView 내부에서 분리해 fixed/sticky chrome처럼 상단에 고정
- Scroll content top padding을 fixed header 높이에 맞춰 조정해 스크롤 시 헤더가 사라지지 않도록 수정
- Hero summary card에 Web MobileHome의 radial glow 느낌을 Native custom `NativeGlowView`로 추가
- Hero/card/toggle/empty/ad/budget surface에 elevation을 부여해 Web의 shadow/card depth와 더 가깝게 보정
- Android `:app:assembleDebug` 통과 및 `Pixel_9` 에뮬레이터 로딩 후 캡처 확인: `/tmp/gleaum-native-home-chrome-polish-loaded.png`

2026-06-23 Budget card 보정:

- Native Home Budget Summary를 한 줄 요약에서 Web MobileHome과 유사한 card density로 확장
- `수입 / 지출 / 순흐름` 3분할 stat box 추가
- 개인 공간 기준 문구와 `가계부 보기 →` CTA를 하단에 배치
- API 변경 없이 기존 `ledger.incomeTotal`, `ledger.expenseTotal`, `ledger.net` 응답만 사용
- Android `:app:assembleDebug` 통과 및 `Pixel_9` 에뮬레이터 스크롤 캡처 확인: `/tmp/gleaum-native-home-budget-card-scrolled.png`

2026-06-23 Home 5-step follow-up:

- Calendar 영역을 `월간 / 주간 / 일간` segmented control 구조로 확장
- Today toggle에서 캘린더 접기/펼치기 상태를 Native state로 관리
- 월간 grid, 주간 strip, 일간 preview를 동일 API의 `calendar.days/week`와 `schedules.range`로 렌더링
- 일정 카드에 타입 배지, 상태 배지, 타입별 컬러 block, chevron affordance 추가
- 다가오는 일정 리스트를 Web MobileHome과 유사한 date tile + title + date row 구조로 보정
- 로딩 상태를 단순 문구 카드에서 skeleton-like summary card로 변경
- 레포 내 `Pretendard/Outfit` font asset 부재 확인. 실제 폰트 번들 도입 대신 `brandRegular/brandMedium/brandBold()` helper로 typography 사용점을 통일
- Android `:app:assembleDebug` 통과 및 `Pixel_9` 에뮬레이터 캡처 확인: `/tmp/gleaum-native-home-five-step-top.png`, `/tmp/gleaum-native-home-five-step-day-2.png`

2026-06-22에 `NativeHomePortActivity` 비활성 skeleton을 Mobile Web 홈 순서 기준으로 보강하고, debug preview 내부에서 `/api/native/home-summary` 데이터 연결까지 진행했다.

반영 범위:

- `NativePortFlags.ENABLE_NATIVE_HOME=false` 유지. 운영/기본 진입 흐름 영향 없음
- 섹션 순서: Header → Greeting Summary → Today Toggle → Today Schedule → Ad Placeholder → Budget Summary → Upcoming → BottomNav
- `SessionManager`의 Supabase access token으로 `https://www.gleaum.com/api/native/home-summary` 호출
- 로딩/세션 없음/오류 상태를 Preview 내부 카드로 표시
- 오늘 일정/완료/남은 일정/다가오는 일정/가계부 요약은 API 응답 기반으로 바인딩
- `/api/native/home-summary` schedules 응답은 `todayCount`, `completedCount`, `pendingCount`, `upcomingCount`를 제공
- `/api/native/home-summary` calendar 응답은 `selectedDate`, `month`, `week`, `days`를 제공
- Native Preview는 `calendar.week`으로 주간 날짜 스트립을 렌더링하고, `schedules.range`에서 선택일 일정을 필터링
- Preview 내부 액션은 아직 네이티브 화면으로 처리하지 않고 WebView fallback으로 이동:
  - 알림 → `/notifications`
  - `+ 새 일정` → `/schedules/new`
  - 일정 카드 → `/schedules/[id]`
  - 가계부 카드 → `/budget`
  - 하단 네비 → `/home`, `/schedules`, `/space`, `/budget`, `/mypage`
- MainActivity 기본 진입 연결은 아직 하지 않음
- Android `:app:assembleDebug` 통과

다음 단계:

- Mobile Web 홈 실제 캡처와 Native Preview 시각 비교
- 월간/주간/일간 캘린더 패널 전체 이식 필요 여부 확인
- 내부 테스트 플래그 활성화 전 WebView fallback/뒤로가기/푸시 라우팅 검증

### Debug Preview 실행 방법

2026-06-22에 Native Home Preview 진입 경로를 debug build 전용으로 추가했다.

- 등록 위치: `android/app/src/debug/AndroidManifest.xml`
- Activity: `com.gleaum.app.NativeHomePortActivity`
- Gate: `BuildConfig.DEBUG && NativePortFlags.ENABLE_NATIVE_HOME_PREVIEW`
- 운영 홈 대체 플래그 `NativePortFlags.ENABLE_NATIVE_HOME`은 계속 `false`

Android Studio에서 debug variant로 설치한 뒤 아래 명령으로 Preview만 직접 실행할 수 있다.

```bash
adb shell am start -n com.gleaum.app/.NativeHomePortActivity
```

로그인 세션이 없는 상태에서 실행하면 Preview 내부에 세션 없음 안내가 표시된다. 실제 데이터를 확인하려면 먼저 앱에서 로그인 후 위 명령으로 Preview를 열어야 한다.

주의:

- 이 Preview는 WebView 홈을 대체하지 않는다.
- release build에는 debug manifest가 병합되지 않는다.
- Preview 확인 후에도 운영 활성화는 `ENABLE_NATIVE_HOME=true`로 바로 바꾸지 말고, Mobile Web 캡처 비교와 회귀 테스트를 먼저 완료해야 한다.

2026-06-18에 `MainActivity` 위에 별도 Native Home layer를 즉시 표시하는 방식이 시도되었으나 보류했다.

보류 이유:

- WebView 홈 복귀 루프 위험
- Mobile Web 대비 디자인 이질감
- 하단 네비게이션 재해석 문제
- 검증 전 운영 진입 흐름에 직접 연결한 구조적 위험

향후 Android Native Port는 **비활성 구현 → 비교 검증 → 내부 테스트 활성화 → 운영 활성화** 순서로 진행한다.
## 2026-06-23 Native 전체 메뉴 Shell

- Android `NativeMyMenuActivity`를 추가해 하단 네비 `전체` 탭의 WebView 의존을 줄이는 Native Shell을 구성했다.
- 프로필 요약, 앱 설정, 계정 & 보안, 서비스 섹션을 Native View로 렌더링한다.
- 캘린더 권한 요청, 생체인증 보안 설정 진입, 로그아웃은 네이티브에서 직접 처리한다.
- 아직 Native Port가 끝나지 않은 상세 화면은 WebView fallback으로 연결한다.
- 홈 `NativeHomePortActivity`의 `/mypage` 이동은 `NativeMyMenuActivity`로 우선 라우팅한다.
- 광고/태블릿/다크모드는 후순위로 유지한다.
- Android `:app:assembleDebug` 통과 및 Pixel_9 emulator에서 홈 → 전체 진입 확인: `/tmp/gleaum-native-menu-shell-retest.png`



2026-06-23 Native 일정 등록 1차:

- `NativeScheduleCreateActivity`를 추가해 Android 홈의 `+ 새 일정` 버튼이 WebView `/schedules/new` 대신 네이티브 일정 등록 화면으로 진입한다.
- Native 전체 메뉴의 빠른 액션에도 `일정 추가`를 연결해 홈/전체 메뉴 양쪽에서 동일한 네이티브 등록 흐름을 사용한다.
- 저장 API는 기존 서버 계약인 `POST /api/native/schedules`를 사용한다. DB 쿼리/권한 판단은 `src/lib/db.ts`의 `createNativeSchedule()` 경로를 재사용한다.
- 1차 범위는 `개인 / 공유 / 자녀` 일정 등록이다. 가계부 지출/수입 등록은 일정 등록 화면에 섞지 않고 이후 Native Budget Port에서 별도 처리한다.
- 공유 일정은 서버에서 기존 `space_editor_required` 권한 검사를 그대로 받으므로 네이티브 화면이 임의로 공간 권한을 우회하지 않는다.
- Android `:app:assembleDebug` 통과 및 `Pixel_9` 에뮬레이터에서 홈 `+ 새 일정` -> 네이티브 등록 화면 진입 확인: `/tmp/gleaum-native-schedule-create.png`


2026-06-23 Native 일정 P0 흐름 연결:

- `GET /api/native/schedules`, `GET/PATCH/DELETE /api/native/schedules/[id]`를 추가해 네이티브 일정 목록/상세/수정/삭제가 bearer token 인증으로 동작한다.
- Android `NativeScheduleListActivity`를 추가해 하단 `일정` 탭을 WebView `/schedules` 대신 네이티브 목록으로 연결했다.
- Android `NativeScheduleDetailActivity`를 추가해 홈/목록의 일정 카드 터치 시 네이티브 상세 화면으로 진입한다.
- `NativeScheduleCreateActivity`는 `schedule_id`가 전달되면 수정 모드로 재사용하며 `PATCH /api/native/schedules/[id]`를 호출한다.
- 상태 변경(완료/예정 복귀)과 삭제는 상세 화면에서 네이티브 API로 처리한다.
- 운영 URL 기반 네이티브 앱은 신규 API 배포 전까지 목록 호출이 실패할 수 있다. GitHub/Vercel 배포 후 실제 저장/목록/상세 회귀 테스트가 필요하다.
- 검증: `npm run build`, Android `:app:assembleDebug`, Pixel_9 emulator 일정 탭 진입 캡처 `/tmp/gleaum-native-schedule-list-p0.png`


2026-06-23 Native 가계부 메인 1차:

- `GET /api/native/budget/summary`를 추가해 Android 네이티브 가계부 메인이 개인 가계부 원장(`ledger_entries`, `scope='personal'`)만 조회한다.
- Android `NativeBudgetActivity`와 `NativeBudgetApi`를 추가해 순액, 수입/지출 합계, 고정/변동 지출, 정기/일회 수입, 최근 항목을 네이티브로 표시한다.
- Home/일정/전체 메뉴의 `/budget` 이동을 WebView fallback 대신 `NativeBudgetActivity`로 연결했다.
- `NativeTabIconView`를 추가해 일정 목록/가계부 하단 네비가 문자 아이콘이 아닌 stroke 기반 네이티브 아이콘을 사용한다.
- 이번 단계는 조회 메인만 포함한다. 수입/지출 등록·수정·삭제는 다음 Native Budget Port 단계에서 처리한다.
- 검증: `npm run build`, Android `:app:assembleDebug`, Pixel_9 emulator 가계부 탭 진입 캡처 `/tmp/gleaum-native-budget-main.png`


2026-06-23 Native 가계부 등록 1차:

- `POST /api/native/budget/entries`를 추가해 Android 네이티브에서 수입/지출을 개인 가계부 원장에 직접 등록한다.
- 서버는 `scope='personal'`, `owner_id=userId`, `space_id=personalSpaceId`를 강제해 공간 지출과 개인 가계부가 섞이지 않도록 했다.
- Android `NativeBudgetEntryCreateActivity`를 추가해 지출/수입, 일회/정기, 제목, 금액, 날짜, 카테고리, 결제수단, 메모를 입력할 수 있게 했다.
- 일회 항목은 `completed`, 정기 항목은 `pending`으로 저장한다.
- Native Budget 메인의 `+` 버튼은 WebView `/budget` fallback 대신 네이티브 등록 화면으로 진입한다.
- 검증: `npm run build`, Android `:app:assembleDebug`, Pixel_9 emulator 가계부 `+` → 등록 화면 캡처 `/tmp/gleaum-native-budget-entry-create.png`


## 2026-06-23 Native 가계부 관리 1차

- `GET/PATCH/DELETE /api/native/budget/entries/[id]`를 추가해 Android 네이티브 가계부 항목 상세 조회, 수정, 삭제를 지원한다.
- 서버는 수정/삭제 대상 조회 시 `owner_id = userId`와 `scope = 'personal'`을 강제해 개인 가계부 항목만 처리한다. 공간 지출은 이 경로에서 수정/삭제되지 않는다.
- Android `NativeBudgetActivity`의 최근 항목 카드를 터치하면 `NativeBudgetEntryCreateActivity(entry_id)` 수정 모드로 진입한다.
- 정기 수입/지출 항목은 카드 내부 상태 텍스트에서 `pending/completed`를 토글할 수 있다.
- 항목 삭제는 네이티브 확인 다이얼로그를 거친 뒤 API 삭제를 호출한다.
- 수정 모드는 제목, 금액, 구분, 카테고리, 날짜, 결제수단, 메모를 기존 값으로 채운다.
- 검증: `npm run build`, Android `:app:assembleDebug` 통과. Pixel_9 emulator 가계부 등록/수정 화면 진입 캡처: `/tmp/gleaum-native-budget-entry-edit-flow.png`.
- 주의: 운영 URL 기반 앱은 신규 API가 배포되기 전까지 실제 항목 상세/수정/삭제 호출이 실패할 수 있다. GitHub/Vercel 배포 후 실제 로그인 계정으로 생성-수정-상태변경-삭제 회귀 테스트가 필요하다.


## 2026-06-23 Today Release Native Routing

- 오늘 업데이트 범위에서는 `NativeHomePortActivity`를 운영 진입점으로 사용하지 않는다. 홈 전체 네이티브 전환은 Remote Config 도입 이후 단계로 보류한다.
- `MainActivity`에 `GleaumNativeRoute` JavaScript bridge를 추가해 WebView 홈 내부에서 `/schedules`, `/schedules/new`, `/schedules/{id}`, `/schedules/{id}/edit`, `/budget`, `/mypage`로 이동할 때 Android 네이티브 Activity로 전환한다.
- `start_path`가 네이티브 대상 경로인 경우에도 WebView 로드 대신 네이티브 Activity를 직접 연다. App Link/RouterActivity 경유 진입과 네이티브 화면의 WebView fallback 복귀에 사용된다.
- 네이티브 일정/가계부/전체 메뉴의 하단 `홈` 액션은 release manifest에 없는 `NativeHomePortActivity` 대신 `MainActivity(start_path=/home)`로 복귀한다.
- 일정 저장 후 이동은 preview 홈이 아니라 `NativeScheduleListActivity`로 돌아가도록 변경했다.
- 검증: Android `:app:assembleDebug` 통과. Emulator에서 `RouterActivity --es start_path /budget` 진입 시 `NativeBudgetActivity`가 top resumed activity로 확인됨. 캡처: `/tmp/gleaum-native-budget-router.png`.
- 남은 검증: 실제 단말에서 WebView 홈 하단 탭/버튼 터치가 JavaScript bridge로 네이티브 화면을 여는지 확인한다. Remote Config 기반 kill switch는 다음 작업으로 분리한다.


## 2026-06-23 Native 공간 1차

- `GET /api/native/spaces/summary`를 추가해 Android 네이티브 공간 화면에 필요한 활성 공간, 공간 목록, 멤버 목록을 bearer token 기반으로 제공한다.
- 서버는 `profiles.preferences.personalSpaceId`를 기준으로 개인 공간과 공유 공간을 구분하고, 개인 공간에는 초대 코드를 내려주지 않는다.
- Android `NativeSpaceActivity`를 추가해 `/space`를 WebView fallback 대신 네이티브 공간 화면으로 표시한다.
- 1차 화면은 활성 공간 hero, 초대 코드 복사, 내 공간 목록, 공간 멤버, 공간 관리 진입을 포함한다.
- 공간 생성/공간 설정/멤버 역할 변경은 아직 WebView fallback(`/space/new`, `/space/settings`)을 유지한다.
- `MainActivity` native route bridge와 기존 네이티브 하단 네비의 `공간` 탭을 `NativeSpaceActivity`로 연결했다.
- 검증: `npm run build`, Android `:app:assembleDebug` 통과.
- 주의: emulator 재설치 후 세션이 없어 `/space` 직접 진입은 `LoginActivity`로 라우팅됐다. 실제 로그인 단말에서 홈 하단 `공간` 탭 → NativeSpaceActivity 진입, 초대 코드 복사, 멤버 목록 표시를 확인해야 한다.


## 2026-06-23 Native 공간 설정 1차

- Native Space에서 공간 이름 변경, 초대 코드 재생성, 멤버 역할 변경, 멤버 내보내기를 1차 네이티브로 연결했다.
- 신규 API:
  - `PATCH /api/native/spaces/[id]` — 공간 이름 변경
  - `POST /api/native/spaces/[id]/invite-code` — 초대 코드 재생성
  - `PATCH /api/native/spaces/[id]/members/[userId]` — 멤버 역할 변경
  - `DELETE /api/native/spaces/[id]/members/[userId]` — 멤버 내보내기
- 모든 변경 API는 bearer token 사용자 기준으로 `space_members.role = admin` 또는 공간 생성자 권한을 확인한다.
- 개인 공간은 초대 코드 재생성, 멤버 역할 변경, 멤버 내보내기를 막는다.
- Android `NativeSpaceActivity`의 공간 관리 섹션이 WebView fallback 대신 네이티브 다이얼로그/액션을 사용한다.
- 멤버 row는 공간 지기이며 공유 공간일 때만 역할 변경/내보내기 액션을 제공한다.
- 검증: `npm run build`, Android `:app:assembleDebug` 통과.
- 남은 검증: 실제 로그인 단말에서 공간 지기 계정으로 이름 변경, 초대 코드 재생성, 역할 변경, 멤버 내보내기 회귀 테스트가 필요하다.


## 2026-06-23 Native 공간 생성/참여 1차

- `POST /api/native/spaces`를 추가해 Android 네이티브 공간 화면에서 공유 공간을 직접 생성한다.
- 서버는 공유 공간 무료 한도 2개를 `space_members` 기준으로 재확인하고, 개인 공간은 한도 계산에서 제외한다.
- 신규 공간 생성 시 `family_groups`와 생성자 `space_members(role='admin')`를 함께 만들고, 사용자의 활성 공간을 새 공간으로 전환한다.
- `POST /api/native/spaces/join`을 추가해 초대 코드로 공유 공간에 참여할 수 있게 했다.
- 초대 코드 조회는 서버 라우트 내부의 service-role 클라이언트로만 수행하고, 실제 응답/멤버 등록은 bearer token 사용자 기준 권한 경계를 유지한다.
- 초대 코드 참여자의 기본 역할은 `viewer`이며, 공간 지기가 별도로 변경하기 전까지 조회 권한만 가진다.
- Android `NativeSpaceActivity`의 상단 `+`와 공간 관리 메뉴에 `새 공간 만들기`, `공간 참여하기` 네이티브 다이얼로그를 연결했다.
- `/space/new` 경로도 WebView 신규 공간 화면 대신 `NativeSpaceActivity`로 라우팅한다.
- 검증: `npm run build`, Android `:app:assembleDebug` 통과.
- 남은 검증: 배포 후 실제 로그인 단말에서 공간 생성, 초대 코드 참여, 공유 공간 2개 한도, 참여자 기본 역할 `viewer`를 회귀 테스트한다.


## 2026-06-23 Native 전체 메뉴 설정 보강

- Android `NativeMyMenuActivity`의 캘린더 설정을 WebView fallback 없이 네이티브 다이얼로그로 확장했다.
- 캘린더 권한이 없으면 Android 권한 요청을 실행하고, 권한이 있으면 쓰기 가능한 기기 캘린더 목록을 조회해 선택할 수 있다.
- 선택한 캘린더 ID와 동기화 사용 여부는 Capacitor Preferences 기본 저장소(`CapacitorStorage`)에 저장해 WebView 설정 유틸과 같은 키를 공유한다.
- Android `NativeMyMenuActivity`의 생체인증 보안을 네이티브 설정 다이얼로그로 확장했다.
- 앱 잠금 켜기/끄기, 재잠금 간격(`always`, `5m`, `15m`, `30m`) 변경을 WebView 설정과 동일한 Capacitor Preferences 키에 저장한다.
- 기기 잠금/지문이 준비되지 않은 경우 Android 보안 설정으로 연결한다.
- 검증: Android `:app:assembleDebug` 통과.
- 남은 검증: 실제 Android 단말에서 전체 메뉴 → 캘린더 선택, 앱 잠금 켜기/끄기, 앱 재실행 후 WebView `NativeBiometricGate`가 같은 설정을 인식하는지 확인한다.


## 2026-06-23 Native 전환 4단계 1차

- Android 홈 운영 연결을 시작했다. `NativePortFlags.ENABLE_NATIVE_HOME=true`로 전환하고, 세션 보유 사용자는 `RouterActivity`에서 `NativeHomePortActivity`로 진입한다.
- WebView 내부 `/home` 라우팅도 `MainActivity` native route bridge에서 `NativeHomePortActivity`로 승격한다.
- `NativeHomePortActivity`의 하단 홈 탭은 WebView 재진입이 아니라 네이티브 홈 데이터를 다시 로드한다.
- 전체 메뉴 하위 설정 중 화면 모드, 홈 레이아웃, 알림 설정을 WebView fallback 대신 네이티브 다이얼로그로 1차 전환했다.
- 공간 고급 설정은 WebView fallback 대신 현재 네이티브에서 가능한 공간 이름 변경, 초대 코드 재생성, 참여, 생성 액션과 상태 안내를 제공한다.
- 가계부는 기존 `ledger_entries.recur_freq`를 활용해 정기 수입/지출을 `반복 예정` 섹션으로 별도 노출한다. 이번 단계에서는 새 Supabase 테이블을 만들지 않는다.
- Debug manifest의 Native Home preview 등록은 main manifest의 운영 등록과 충돌하지 않도록 `tools:replace`로 정리했다.
- 검증: Android `:app:assembleDebug` 통과.
- 남은 검증: 실제 로그인 단말에서 앱 시작 → Native Home 진입, 홈 하단 탭 이동, WebView 기능에서 `/home` 복귀 시 Native Home 승격, 전체 메뉴 설정 저장, 반복 예정 표시를 확인한다.


## 2026-06-23 Native 프로필 관리 1차

- `GET/PATCH /api/native/profile`을 추가해 Android 네이티브 전체 메뉴에서 프로필 기본 정보를 WebView 없이 조회/수정한다.
- 서버 쿼리/업데이트는 `src/lib/db.ts`의 `getNativeProfileSummary()`, `updateNativeProfile()`에 모아 DB 접근 규칙을 유지했다.
- Android `NativeProfileApi`를 추가해 bearer token 기반으로 네이티브 프로필 API를 호출한다.
- `NativeMyMenuActivity`의 `프로필 관리`는 WebView `/mypage` fallback 대신 네이티브 다이얼로그로 닉네임, 실명, 표시 방식(닉네임/실명)을 수정한다.
- `비밀번호 설정`은 아직 재인증이 필요한 보안 흐름이므로 WebView fallback 대신 네이티브 안내 다이얼로그로 전환했다. 실제 비밀번호 변경은 다음 보안 단계에서 구현한다.
- 검증: `npm run build`, Android `:app:assembleDebug` 통과.
- 남은 검증: 실제 로그인 단말에서 전체 메뉴 → 프로필 관리 → 저장 후 프로필 카드/홈 표시명이 갱신되는지 확인한다.


## 2026-06-23 Native 비밀번호 설정 1차

- `PATCH /api/native/security/password`를 추가해 Android 네이티브 전체 메뉴에서 이메일 로그인 비밀번호를 직접 변경한다.
- 인증은 기존 `createNativeRouteAuth()`를 사용해 bearer token 또는 cookie 세션을 모두 지원한다.
- 서버는 Supabase Auth `updateUser({ password })`로 비밀번호를 변경하며, DB 스키마 변경은 없다.
- Android `NativeProfileApi.updatePassword()`를 추가하고, `NativeMyMenuActivity`의 `비밀번호 설정`을 안내 다이얼로그에서 실제 입력/확인/저장 다이얼로그로 전환했다.
- 클라이언트와 서버 양쪽에서 최소 6자, 최대 72자 검증을 수행한다.
- 검증: `npm run build`, Android `:app:assembleDebug` 통과.
- 남은 검증: 운영 배포 후 실제 이메일 로그인 계정에서 비밀번호 변경 → 로그아웃 → 새 비밀번호 로그인 회귀 테스트가 필요하다.


## 2026-06-23 Native 알림/계정 보안 배치

- `GET/PATCH /api/native/notifications`와 `PATCH /api/native/notifications/[id]`를 추가해 Android 네이티브 알림 목록, 전체 읽음, 개별 읽음 처리를 지원한다.
- 알림 DB 접근은 `src/lib/db.ts`의 `getNativeNotifications()`, `markNativeNotificationRead()`, `markAllNativeNotificationsRead()`로 모아 컴포넌트/API route 직접 쿼리 확산을 막았다.
- Android `NativeNotificationActivity`와 `NativeNotificationApi`를 추가해 홈 알림 버튼, WebView `/notifications` 이동, 네이티브 홈 내부 알림 진입을 모두 네이티브 화면으로 승격한다.
- 기존 `/api/account/status`, `/api/account/withdraw`, `/api/account/restore`는 cookie 세션뿐 아니라 Native bearer token도 받도록 `createNativeRouteAuth()` 기반으로 보강했다.
- Android `NativeAccountApi`와 전체 메뉴 `계정 탈퇴/복구` 다이얼로그를 추가해 탈퇴 신청 상태 확인, 복구, 탈퇴 신청을 WebView 없이 처리한다.
- `AndroidManifest.xml`에 `NativeNotificationActivity`를 등록했다.
- 검증: `npm run build`, Android `:app:assembleDebug` 통과.
- 남은 검증: 실제 로그인 단말에서 알림 목록/개별 알림 터치/전체 읽음, 탈퇴 신청 상태 확인, 복구 가능 계정 복구, 탈퇴 신청 후 네이티브 로그아웃을 회귀 테스트한다.
