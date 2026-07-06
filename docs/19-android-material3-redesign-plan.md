# 19. Android Material Design 3 Redesign Plan

> 작성일: 2026-06-24
> 목적: Android 네이티브 화면의 시각 언어를 Google Material Design 3 기준으로 전면 재정의한다.

## 1. 현재 문제 정의

Android 네이티브 전환 화면은 기능 포팅 중심으로 빠르게 확장되면서 다음 문제가 발생했다.

- 다크모드에서 색상 역할이 섞여 텍스트 대비가 깨짐
- 카드/타일/칩/입력창이 Material 3도, Apple Glass도 아닌 혼합형으로 보임
- 작은 반복 요소에 그라데이션과 과한 radius가 중복 적용돼 저급한 장식처럼 보임
- 하단 네비게이션이 floating 형태처럼 보이지만 스크롤/모션 정의가 없어 의도가 불분명함
- 화면별 BottomNav/카드 스타일이 복붙으로 분산돼 일관성 유지가 어려움

## 2. 기준 디자인 방향

Android는 Apple Glass 방향을 버리고 Material Design 3를 기준으로 한다.

단, 글리움 브랜드 컬러는 유지한다.

- Primary: `#0084CC`
- Secondary/Tertiary: `#0CC9B5`, `#2EE895`
- Neutral/Dark: Navy 계열
- Purple 계열 금지

## 3. Material 3 적용 원칙

### 3.1 Color Roles

색상은 hex 직접 사용이 아니라 역할 중심으로 사용한다.

- `primary`, `onPrimary`
- `primaryContainer`, `onPrimaryContainer`
- `secondary`, `onSecondary`
- `background`, `onBackground`
- `surface`, `onSurface`
- `surfaceVariant`, `onSurfaceVariant`
- `outline`, `outlineVariant`
- `error`, `onError`

Android Native에서는 `NativeTheme`를 M3 역할 토큰의 단일 진입점으로 확장한다.

### 3.2 Surface Hierarchy

화면 깊이는 그라데이션이 아니라 surface 단계로 표현한다.

- Page background: `background`
- Main card: `surface`
- Secondary card/input: `surfaceVariant`
- Selected item: `primaryContainer`
- Border: `outlineVariant`
- Elevated emphasis: 낮은 elevation + tonal surface

### 3.3 Cards

반복 카드/타일은 3종만 허용한다.

- Filled card: 기본 정보 카드
- Elevated card: 핵심 요약 카드
- Outlined card: 설정/입력/리스트 카드

금지:

- 작은 반복 타일의 그라데이션
- 불명확한 코너 glow
- 과한 blur/glass 효과
- 색상 대비가 모호한 투명 surface

### 3.4 Navigation Bar

현재 단계에서는 floating nav가 아니라 docked navigation bar로 고정한다.

- 화면 하단 고정
- full-width 또는 max-width adaptive
- surface background
- top divider/outline
- active icon + label primary
- inactive icon + label onSurfaceVariant
- pill/floating shadow 최소화

Floating nav는 다음 조건을 만족할 때만 별도 Phase로 검토한다.

- 스크롤 방향에 따른 hide/show 또는 scale motion 정의
- safe-area 대응
- 하단 FAB/광고/입력창과 충돌 규칙 정의
- 전체 화면에서 동일 동작 구현

## 4. Android Native Theme 재구성

`NativeTheme`를 아래 구조로 확장한다.

```kotlin
object NativeTheme {
    fun scheme(context): NativeColorScheme
    fun color(role: NativeColorRole): Int
    fun typography(role: NativeTypeRole): TypefaceSpec
    fun shape(role: NativeShapeRole): Float
}
```

필수 추가:

- raw brand color와 semantic role 분리
- `rawColor()` / `alpha()`는 브랜드/다크 카드 내부 전용
- `onDarkText()` / `onDarkMuted()`는 dark hero 등 고정 어두운 배경 전용
- `surfaceContainerLow/High` 개념 추가

## 5. 컴포넌트 표준화 대상

### P0 — 즉시 표준화

- `NativeBottomNav`
- `NativeTopAppBar`
- `NativeCard`
- `NativeSectionHeader`
- `NativeButton`
- `NativeSegmentedControl`
- `NativeTextField`
- `NativeListItem`
- `NativeBadge/Chip`

### P1 — 화면별 재구성

- Home
- Schedule List
- Schedule Create/Edit
- Budget List/Summary
- Budget Entry Create/Edit
- Space
- My Menu/Settings
- Notification
- Onboarding

## 6. 화면별 개편 방향

### Home

- Hero card는 브랜드 강조 영역으로 유지하되 dark surface 위 white text 명확화
- 작은 summary tile은 surface container로 변경
- 광고 카드와 일반 카드 radius/elevation 통일
- BottomNav는 docked 구조로 변경

### Schedule

- 날짜/필터 chip은 M3 filter chip 형태
- 일정 카드는 outlined/elevated 중 하나로 통일
- 상태 badge는 색상 면적 최소화

### Budget

- 수입/지출/순흐름은 M3 summary card + stat row
- 입력 화면은 TextField/SegmentedButton 기준으로 재구성
- 선택 카테고리는 filter chip grid로 정리

### Space

- 공간 hero는 filled/elevated card로 단순화
- 초대 코드 카드, 멤버 카드, 설정 카드 구조 분리
- 개인 공간/공유 공간 상태는 badge/chip으로 표현

### My Menu / Settings

- ListItem + leading icon + trailing text/chevron 구조로 통일
- Dialog 입력은 M3 AlertDialog/TextField 스타일로 보정

## 7. 구현 순서

1. `NativeTheme` M3 role 확장
2. 공통 컴포넌트 8종 추가
3. BottomNav docked 구조 확정
4. Home 화면을 M3 기준 샘플 화면으로 재구성
5. Schedule/Budget/Space/Menu 순차 적용
6. 라이트/다크/태블릿 캡처 QA
7. 실기기 회귀 테스트 후 Google Play 내부 테스트 업데이트

## 8. 완료 기준

- 모든 텍스트 WCAG 기준 체감 대비 확보
- 작은 반복 요소에서 그라데이션 제거
- 화면별 카드 radius/elevation/stroke 일관화
- BottomNav 위치/크기/active 상태 전 화면 동일
- 라이트/다크에서 홈/일정/공간/가계부/전체 화면 캡처 승인
- Android `:app:assembleDebug` 통과

## 9. 2026-06-24 결정 — Compose Material 3 기반 전환

사용자 피드백에 따라 Android Native UI는 더 이상 수작업 View 기반의 Material 유사 UI를 유지하지 않는다.

### 결정

Android 전면 개편은 Google 공식 Material 3 컴포넌트를 기본 베이스로 삼는다.

- UI Framework: Jetpack Compose
- Design System: Material 3 Compose
- Layout Shell: `Scaffold`
- Navigation: `NavigationBar`, `NavigationRail`, `ModalNavigationDrawer`/`PermanentNavigationDrawer`
- Motion: Compose Animation APIs + M3 component state animation
- Adaptive: Window size class 기반 phone/tablet/foldable 대응

현재 프로젝트는 `AppCompat + programmatic View` 구조이며 Compose가 아직 활성화되어 있지 않다.
따라서 M3 개편은 단순 스타일 수정이 아니라 Android UI 레이어 전환 작업으로 본다.

## 10. 도입 대상 Material 3 컴포넌트

### Navigation / App Structure

- `Scaffold`
- `CenterAlignedTopAppBar` / `LargeTopAppBar`
- `NavigationBar`
- `NavigationBarItem`
- `NavigationRail`
- `ModalNavigationDrawer`
- `PermanentNavigationDrawer`
- `FloatingActionButton` / `ExtendedFloatingActionButton`
- `SnackbarHost`

적용 기준:

- Phone: bottom `NavigationBar`
- Tablet/Foldable: width class에 따라 `NavigationRail` 또는 drawer
- 기존 floating pill nav는 폐기. Floating nav는 별도 motion spec 없이는 사용하지 않음

### Surfaces / Cards

- `Card`
- `ElevatedCard`
- `OutlinedCard`
- `Surface`
- `ListItem`
- `HorizontalDivider`

적용 기준:

- 반복 리스트: `OutlinedCard` 또는 `ListItem`
- 핵심 요약: `ElevatedCard`
- 입력/설정 그룹: `Surface` + `ListItem`
- 작은 반복 타일 그라데이션 금지

### Inputs / Selection

- `OutlinedTextField`
- `TextField`
- `SegmentedButton`
- `FilterChip`
- `AssistChip`
- `SuggestionChip`
- `Switch`
- `Checkbox`
- `RadioButton`
- `DatePicker`
- `DatePickerDialog`
- `TimePicker`
- `AlertDialog`
- `ModalBottomSheet`
- `DropdownMenu`

적용 기준:

- 일정/가계부 등록 폼은 `OutlinedTextField` + `DatePickerDialog` + `TimePicker`로 재구성
- 유형/카테고리 선택은 `FilterChip` 또는 `SegmentedButton`
- 상세 옵션은 `ModalBottomSheet`

### Feedback / State

- `LinearProgressIndicator`
- `CircularProgressIndicator`
- `Badge`
- `BadgedBox`
- `PullToRefreshBox` 또는 공식 pull refresh API
- `Snackbar`

적용 기준:

- 로딩 skeleton 수작업 대신 M3 progress/state component 사용
- 알림 count, pending count는 `Badge`/`BadgedBox`

## 11. 도입 대상 Motion / Interaction

M3에서 제공하는 컴포넌트 상태 전환과 Compose animation을 서비스 맥락에 맞게 도입한다.

### 즉시 도입 가능한 Motion

- `AnimatedVisibility`: 하위 메뉴 펼침/접힘
- `animateContentSize`: 카드 확장/축소
- `Crossfade`: 탭/필터/상태 전환
- `AnimatedContent`: step/onboarding/page state 전환
- `animateColorAsState`: 선택 상태 색상 전환
- `animateDpAsState`: FAB, 카드 elevation/size 전환
- `updateTransition`: 복합 상태 전환
- `LazyColumn` item animation: 리스트 삽입/삭제/정렬 변화

### 사용자 요청 반영: 상위 메뉴 → 하위 메뉴 펼침 액션

적용 대상:

- 전체 메뉴의 설정 그룹
- 공간 관리 섹션
- 가계부 카테고리/반복 설정
- 일정 상세의 추가 옵션
- 홈의 캘린더 패널

구현 기준:

- 상위 메뉴 row click
- `AnimatedVisibility`로 하위 항목 reveal
- `animateContentSize`로 container height 변경
- chevron icon rotation `animateFloatAsState`
- background/elevation 변화는 과하지 않게 120~220ms 범위

### 신중하게 도입할 Motion

- Shared element transition: 일정 카드 → 상세 화면
- Bottom sheet drag interaction
- Navigation transition
- Floating FAB morph

도입 조건:

- Android 14 이하에서도 안정 동작
- 화면 전환 속도 저하 없음
- 접근성 reduce motion 대응 가능

## 12. Compose 전환 아키텍처

### Phase 0 — Build 준비

- Gradle Compose 활성화
- Compose BOM 추가
- `androidx.activity:activity-compose`
- `androidx.compose.material3:material3`
- `androidx.navigation:navigation-compose`
- `androidx.lifecycle:lifecycle-runtime-compose`
- adaptive UI용 window size class / material3-adaptive 검토

### Phase 1 — Design System Foundation

신규 패키지:

```text
android/app/src/main/java/com/gleaum/app/ui/theme/
android/app/src/main/java/com/gleaum/app/ui/components/
android/app/src/main/java/com/gleaum/app/ui/motion/
android/app/src/main/java/com/gleaum/app/ui/screens/
```

구성:

- `GleaumTheme`
- `GleaumColorScheme`
- `GleaumTypography`
- `GleaumShapes`
- `GleaumMotionSpec`
- `GleaumScaffold`
- `GleaumTopAppBar`
- `GleaumNavigationBar`
- `GleaumCard`
- `GleaumTextField`
- `GleaumSection`

### Phase 2 — Shell 전환

- `NativeHomePortActivity`를 `ComponentActivity + setContent`로 전환
- `GleaumScaffold` 도입
- 하단 NavigationBar / tablet NavigationRail 분기
- 기존 Kotlin API 모델은 유지

### Phase 3 — 핵심 화면 전환

우선순위:

1. Home
2. Schedule List
3. Schedule Create/Edit
4. Budget Summary/List
5. Budget Entry Create/Edit
6. Space
7. My Menu/Settings
8. Notification
9. Onboarding

### Phase 4 — Motion Layer

- Expandable section pattern 도입
- Calendar panel expand/collapse
- Settings group expand/collapse
- FAB extended/collapsed
- Scroll에 따른 top app bar behavior
- List item add/remove animation

### Phase 5 — QA / Release

- Light/Dark 전체 화면 캡처
- Phone/Tablet/Foldable layout check
- 생체인증/캘린더/푸시/딥링크 회귀 테스트
- Google Play internal test 배포

## 13. 중요한 제약

- 웹 UI를 그대로 베끼는 Native Port에서 한 단계 전환한다.
- Android는 Material 3 제품으로 재정의한다.
- iOS/macOS는 별도 Apple native language를 유지할 수 있다.
- 기능/데이터 정책은 Web/Android/iOS 동일해야 한다.
- DB/API는 변경하지 않고 UI layer부터 교체한다.

## 14. 완료 판단 기준

- Android 화면에서 수작업 gradient/radius/elevation 혼합 제거
- M3 컴포넌트가 80% 이상 UI 기반이 됨
- 모든 메뉴/하위 메뉴가 M3 motion spec 기반으로 동작
- 상위 메뉴 펼침/접힘 interaction이 공통 패턴으로 제공됨
- Phone bottom nav, tablet rail/drawer가 자연스럽게 분기됨
- 다크모드에서 모든 텍스트와 컨트롤 대비 정상

## 2026-06-24 진행 기록 — Compose Home 1차 연결

### 완료
- Android Jetpack Compose 기반 홈 화면 1차 구현 추가.
  - 파일: `android/app/src/main/java/com/gleaum/app/ui/screens/home/ComposeHomeScreen.kt`
  - 공식 Material 3 컴포넌트 사용: `ElevatedCard`, `OutlinedCard`, `ListItem`, `AssistChip`, `FilterChip`, `Badge`, `Surface`, `Button`, `TextButton`.
  - 홈 구성 순서: Hero summary → Today/Calendar toggle → Calendar panel → Selected date schedules → Ad placeholder → Budget summary → Upcoming schedules.
  - 일정 없음 상태에서 `새 일정 추가` 버튼 제공.
  - 가계부 수입/지출/순흐름 요약 노출.
- `NativeHomePortActivity`에 Compose Home 분기 추가.
  - `NativePortFlags.ENABLE_COMPOSE_HOME = true`일 때 Compose 렌더링 사용.
  - 하단 내비게이션은 `GleaumScaffold`의 Material 3 `NavigationBar`를 사용.
  - FAB는 새 일정 등록으로 연결.
  - 홈/일정/공간/가계부/전체 메뉴 이동은 기존 Native Activity 라우팅을 유지.
- 빌드 검증 완료.
  - 명령: `JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :app:assembleDebug`
  - 결과: `BUILD SUCCESSFUL`
- 실기기 설치 완료.
  - 기기: `HA1R8ST7`
  - 명령: `JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :app:installDebug`
  - 결과: `BUILD SUCCESSFUL`

### 검증 메모
- 실기기에서 `NativeHomePortActivity` 직접 실행 시 현재 테스트 단말의 네이티브 세션이 비어 있어 로그인 화면으로 정상 리다이렉트됨.
- 따라서 Compose Home의 실제 데이터 렌더링 검증은 로그인 세션이 있는 단말 또는 로그인 후 다시 확인해야 함.
- 빌드 레벨에서는 Compose Home 파일과 Activity 연결이 정상 컴파일됨.

### 다음 권장 작업
1. 로그인 세션이 있는 Android 단말에서 Compose Home 실제 데이터 렌더링 확인.
2. 홈 화면 타이포그래피/간격/카드 hierarchy를 Material 3 기준으로 2차 보정.
3. 같은 `GleaumScaffold` 기반으로 일정 목록, 가계부, 공간, 전체 메뉴 화면을 순차 전환.
4. 이후 태블릿/폴더블 대응은 `NavigationSuiteScaffold` 또는 `NavigationRail`로 확장.

## 2026-06-24 진행 기록 — Home Card Variant 정리

### Material 3 카드 variant 적용 기준
- `ElevatedCard`: 화면에서 가장 중요한 대표/강조 영역에만 사용한다. 현재 홈에서는 Hero summary에 유지.
- `Card`(Filled): 화면 내 기본 그룹 컨테이너에 사용한다. 상태 안내, 오늘/캘린더 토글, 캘린더 패널, 빈 일정 상태, 가계부 요약에 적용.
- `OutlinedCard`: 동일한 구조가 반복되는 목록 아이템 또는 경계가 명확해야 하는 개별 항목에 사용한다. 현재 일정 카드, 다가오는 일정 행, 단순 빈 리스트 안내에 유지.

### 보정 이유
- 기존 1차 Compose Home은 `ElevatedCard`가 다소 많아 시각적 위계가 과해질 수 있었다.
- `Filled`를 기본 그룹 컨테이너로 늘려 Material 3의 surface hierarchy에 맞췄다.
- 반복 일정 아이템은 `Outlined`로 유지해 리스트 스캔성과 항목 경계를 확보했다.

### 검증
- 명령: `JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' android/gradlew -p android :app:assembleDebug`
- 결과: `BUILD SUCCESSFUL`

## 2026-06-24 진행 기록 — Compose Schedule List 1차 전환

### 전제
- Android 네이티브 화면은 앞으로 Material 3를 기본 디자인/컴포넌트 기준으로 삼는다.
- 커스텀 View로 Material 3를 흉내내는 방식은 점진적으로 제거하고, Compose Material 3 공식 컴포넌트 중심으로 전환한다.

### 완료
- 일정 목록 화면 Compose Material 3 1차 구현 추가.
  - 파일: `android/app/src/main/java/com/gleaum/app/ui/screens/schedules/ComposeScheduleListScreen.kt`
  - 사용 컴포넌트: `ElevatedCard`, `Card`, `OutlinedCard`, `FilterChip`, `AssistChip`, `ListItem`, `Badge`, `Button`, `Surface`.
  - 카드 variant 기준:
    - `ElevatedCard`: 오늘 일정 요약 Hero 영역.
    - `Card`(Filled): 필터 그룹, 로딩/에러/빈 상태 컨테이너.
    - `OutlinedCard`: 반복되는 일정 리스트 아이템.
- `NativeScheduleListActivity`에 Compose 분기 추가.
  - `NativePortFlags.ENABLE_COMPOSE_SCHEDULES = true`일 때 Compose 일정 목록을 렌더링.
  - 기존 `NativeScheduleApi.list()` 및 `NativeAppSchedule` 모델은 그대로 재사용.
  - 기존 일정 생성/상세/하단 네비게이션 라우팅 유지.
- 빌드/설치 검증 완료.
  - 빌드 명령: `JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' android/gradlew -p android :app:assembleDebug`
  - 설치 명령: `JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' android/gradlew -p android :app:installDebug`
  - 결과: `BUILD SUCCESSFUL`

### 검증 메모
- `NativeScheduleListActivity`는 manifest에서 exported가 아니므로 adb 직접 Activity 실행은 Android 보안 정책상 차단된다.
- 실제 화면 검증은 로그인된 앱 내부에서 하단 네비게이션 `일정` 진입으로 확인해야 한다.

### 다음 권장 작업
1. 로그인된 실기기에서 `홈 → 일정` 진입 후 Compose 일정 목록 렌더링 확인.
2. 일정 상세 화면을 Material 3 Compose로 전환.
3. 일정 생성/수정 폼을 Material 3 `TextField`, `DatePicker`, `TimePicker`, `SegmentedButton`, `Switch`, `Dialog/BottomSheet` 기반으로 재구성.

## 2026-07-01 진행 기록 — Schedule Detail/Form 1차 전환

### 완료
- 일정 상세 화면을 Compose Material 3 기반으로 연결했다.
  - 파일: `android/app/src/main/java/com/gleaum/app/ui/screens/schedules/ComposeScheduleDetailScreen.kt`
  - Activity 연결: `NativeScheduleDetailActivity`
  - 사용 컴포넌트: `Scaffold`, `TopAppBar`, `Card`, `ListItem`, `AssistChip`, `Button`, `FilledTonalButton`, `OutlinedButton`, `AlertDialog`, `Surface`.
  - 기존 기능 유지: 상세 조회, 완료/예정 상태 변경, 수정 이동, 삭제 확인/삭제.
- 일정 생성/수정 폼을 Compose Material 3 기반으로 연결했다.
  - 파일: `android/app/src/main/java/com/gleaum/app/ui/screens/schedules/ComposeScheduleFormScreen.kt`
  - Activity 연결: `NativeScheduleCreateActivity`
  - 사용 컴포넌트: `Scaffold`, `TopAppBar`, `Card`, `OutlinedTextField`, `FilterChip`, `ListItem`, `Button`, `TextButton`.
  - 기존 기능 유지: 새 일정 등록, 기존 일정 수정, 일정 유형 선택, 날짜/시작/종료 시간 선택, 메모 입력.
- Compose 입력값 버그를 사전에 보정했다.
  - `TextField` 입력값은 Compose 내부 state와 Activity draft state를 함께 갱신한다.
  - 날짜/시간 picker로 Activity가 재렌더링되어도 입력 중인 제목/메모가 유지되도록 draft 값을 보존한다.
- Feature gate 추가/사용.
  - `NativePortFlags.ENABLE_COMPOSE_SCHEDULE_DETAIL = true`
  - `NativePortFlags.ENABLE_COMPOSE_SCHEDULE_FORM = true`

### 검증
- 명령: `JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' android/gradlew -p android :app:assembleDebug`
- 결과: `BUILD SUCCESSFUL`

### 남은 확인
- 로그인된 실기기에서 다음 플로우를 직접 확인해야 한다.
  - `홈 → 일정 → 일정 상세`
  - `일정 상세 → 수정 → 저장`
  - `일정 목록/홈 FAB → 새 일정 등록`
  - `상세 → 완료 처리/예정 되돌리기/삭제`

### 다음 권장 작업
1. 가계부 화면을 Compose Material 3로 전환.
2. 공간 화면을 Compose Material 3로 전환.
3. 전체 메뉴/설정 화면을 Compose Material 3로 전환.

## 2026-07-06 진행 기록 — Compose Budget List/Form 1차 전환

### 완료
- 가계부 목록/요약 화면을 Compose Material 3 기반으로 연결했다.
  - 파일: `android/app/src/main/java/com/gleaum/app/ui/screens/budget/ComposeBudgetScreen.kt`
  - Activity 연결: `NativeBudgetActivity`
  - 사용 컴포넌트: `ElevatedCard`, `Card`, `OutlinedCard`, `ListItem`, `AssistChip`, `Badge`, `Button`, `AlertDialog`, `Surface`.
  - 카드 variant 기준:
    - `ElevatedCard`: 이번 달 순흐름 Hero 영역.
    - `Card`/Filled: 수입/지출/순액 요약, 현금흐름, 로딩/에러/빈 상태.
    - `OutlinedCard`: 반복 예정/최근 항목 리스트 아이템.
  - 기존 기능 유지: 월 요약 조회, 반복 예정 표시, 최근 항목 표시, 항목 수정 이동, 예정/완료 토글, 삭제 확인/삭제.
- 가계부 입력/수정 폼을 Compose Material 3 기반으로 연결했다.
  - 파일: `android/app/src/main/java/com/gleaum/app/ui/screens/budget/ComposeBudgetEntryFormScreen.kt`
  - Activity 연결: `NativeBudgetEntryCreateActivity`
  - 사용 컴포넌트: `Scaffold`, `TopAppBar`, `Card`, `OutlinedTextField`, `FilterChip`, `Button`, `TextButton`.
  - 기존 기능 유지: 수입/지출 선택, 일회/정기 선택, 반복 주기 선택, 카테고리 선택, 결제수단 선택, 날짜 선택, 메모 입력, 생성/수정 저장.
- Compose 입력값 보존 구조를 추가했다.
  - 제목/금액/메모는 Activity draft state와 Compose 내부 state를 함께 갱신한다.
  - 날짜 picker 또는 칩 선택으로 재렌더링되어도 입력 중인 값이 유지되도록 했다.
- Feature gate 추가/사용.
  - `NativePortFlags.ENABLE_COMPOSE_BUDGET = true`
  - `NativePortFlags.ENABLE_COMPOSE_BUDGET_FORM = true`

### 검증
- 최초 빌드 실패 원인: `TopAppBar` Material 3 experimental API opt-in 누락.
- 조치: `ComposeBudgetEntryFormScreen`에 `@OptIn(ExperimentalMaterial3Api::class)` 적용.
- 최종 명령: `JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' android/gradlew -p android :app:assembleDebug`
- 결과: `BUILD SUCCESSFUL`

### 남은 확인
- 로그인된 실기기에서 다음 플로우를 직접 확인해야 한다.
  - `홈/하단 네비게이션 → 가계부`
  - `가계부 → 지출 추가 → 저장`
  - `가계부 → 수입 추가 → 저장`
  - `가계부 → 정기 지출/정기 수입 추가 → 예정/완료 토글`
  - `기존 항목 수정/삭제`

### 다음 권장 작업
1. 공간 화면을 Compose Material 3로 전환.
2. 전체 메뉴/설정 화면을 Compose Material 3로 전환.
3. 알림/온보딩 보조 화면을 Compose Material 3 기준으로 정리.
4. 라이트/다크/태블릿 회귀 QA 후 Google Play 프로덕션 후보 빌드 생성.

## 2026-07-06 진행 기록 — Compose Space 1차 전환

### 완료
- 공간 메인 화면을 Compose Material 3 기반으로 연결했다.
  - 파일: `android/app/src/main/java/com/gleaum/app/ui/screens/space/ComposeSpaceScreen.kt`
  - Activity 연결: `NativeSpaceActivity`
  - 사용 컴포넌트: `ElevatedCard`, `Card`, `OutlinedCard`, `ListItem`, `AssistChip`, `Badge`, `Button`, `IconButton`, `Surface`, `HorizontalDivider`.
  - 카드 variant 기준:
    - `ElevatedCard`: 활성 공간 Hero 영역.
    - `Card`/Filled: 공간 관리 그룹, 빈 상태/로딩/에러 상태.
    - `OutlinedCard`: 내 공간 리스트, 공간 멤버 리스트, 초대 코드 카드.
- 기존 공간 기능 로직은 유지했다.
  - 공간 요약 조회: `NativeSpaceApi.summary()`
  - 새 공간 만들기: 기존 `showCreateSpaceDialog()` / `NativeSpaceApi.create()`
  - 초대 코드로 참여: 기존 `showJoinSpaceDialog()` / `NativeSpaceApi.join()`
  - 공간 이름 변경: 기존 `showRenameDialog()` / `NativeSpaceApi.updateName()`
  - 초대 코드 재생성: 기존 `confirmRegenerateInviteCode()` / `NativeSpaceApi.regenerateInviteCode()`
  - 멤버 역할 변경/내보내기: 기존 `showMemberActions()` / `NativeSpaceApi.updateMemberRole()` / `removeMember()`
- 초대 코드는 기존과 동일하게 코드 자체만 클립보드에 복사한다.
- Feature gate 추가/사용.
  - `NativePortFlags.ENABLE_COMPOSE_SPACE = true`

### 검증
- 명령: `JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' android/gradlew -p android :app:assembleDebug`
- 결과: `BUILD SUCCESSFUL`

### 남은 확인
- 로그인된 실기기에서 다음 플로우를 직접 확인해야 한다.
  - `하단 네비게이션 → 공간`
  - 초대 코드 복사 결과가 URL이 아니라 코드 자체인지 확인
  - 새 공간 만들기/초대 코드 참여
  - 공간 지기 계정에서 이름 변경/초대 코드 재생성/멤버 역할 변경/내보내기
  - 개인 공간에서는 초대/멤버 관리 제한 메시지가 정상 노출되는지 확인

### 다음 권장 작업
1. 전체 메뉴/설정 화면을 Compose Material 3로 전환.
2. 알림 화면을 Compose Material 3로 전환.
3. 온보딩/보안/프로필 보조 화면의 잔여 View UI를 Material 3 기준으로 정리.
4. 라이트/다크/태블릿 회귀 QA 후 Google Play 프로덕션 후보 빌드 생성.
