# 17. Android Native Port Guide

> 최종 업데이트: 2026-06-18
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
