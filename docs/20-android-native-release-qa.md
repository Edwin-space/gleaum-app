# 20. Android Native Release QA Checklist

> 작성일: 2026-07-08
>
> 최종 점검: 2026-07-16
> 목적: Android 네이티브 Material 3 전환 이후 Google Play 업데이트 전 필수 검증 항목을 정리한다.

## 1. 현재 사전 점검 결과

### 빌드
- Debug 빌드·단위 테스트·lint: 통과
  - 2026-07-16 명령: `JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' android/gradlew -p android :app:assembleDebug :app:testDebugUnitTest :app:lintDebug`
  - lint 오류 0건, 경고 170건. 보고서: `android/app/build/reports/lint-results-debug.html`
- Release R8·manifest·서명 전 bundle 패키징: 통과
  - 2026-07-16 명령: `JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' android/gradlew -p android :app:packageReleaseBundle`
  - intermediary AAB 약 96MB, `mapping.txt` 약 84MB. 광범위 package keep 규칙을 제거해 기존 약 262MB/217MB에서 축소했다.
- 최종 서명 AAB: 차단
  - `:app:bundleRelease`는 `:app:signReleaseBundle` 전 단계까지 통과했다.
  - release keystore는 존재하지만 빌드 환경에 store/key password가 없어 서명 단계만 실패한다. 비밀번호를 출력하거나 저장소에 기록하지 않는다.

### Play Console 권한 이슈 재점검
- 릴리즈 매니페스트에서 아래 권한 검출 없음.
  - `READ_MEDIA_IMAGES`
  - `READ_MEDIA_VIDEO`
  - `READ_EXTERNAL_STORAGE`
  - `WRITE_EXTERNAL_STORAGE`
- `android:allowBackup="false"` 적용 확인.
- 내부 Material 3 preview Activity는 `exported="false"` 적용 확인.

### 기기 연결 상태
- ADB 서버는 승인 후 정상 기동됨.
- 연결 기기 `R3CW803L3WH`(`SM_F731N`)에 2026-07-16 최신 debug APK `1.1.5 (26)` 설치 및 런처 실행 확인.
- 스플래시에서 세션 없음 분기 후 `LoginActivity` 진입, UIAutomator 계층과 1080×2640 캡처 확인, 치명적 AndroidRuntime 로그 없음.
- 로그인 화면은 시스템 라이트 설정에서도 브랜드 고정 다크 UI로 렌더링되며 로고·문구·Google/이메일 버튼의 잘림이나 겹침이 없다.
- 인증 계정 세션이 없어 로그인 이후 CRUD·공간·알림·생체인증·캘린더 권한 실사용 회귀는 차단 상태다.

### 즉시 반영한 보안·출시 안정성 보완

- 토큰이 저장되는 앱의 Android 백업을 차단했다.
- 내부 preview Activity의 외부 실행을 차단했다.
- 캘린더 생성·수정·삭제는 네이티브 플러그인에서도 `gleaum:schedule:` 표식과 대상 캘린더 일치를 검사한다.
- SDK 전체를 보존하던 ProGuard 규칙을 제거하고 각 SDK consumer rule에 맡겨 R8 축소가 실제 동작하게 했다.

## 2. Native Compose 적용 범위

아래 feature gate가 활성화되어 있다.

- `ENABLE_COMPOSE_HOME = true`
- `ENABLE_COMPOSE_SCHEDULES = true`
- `ENABLE_COMPOSE_SCHEDULE_DETAIL = true`
- `ENABLE_COMPOSE_SCHEDULE_FORM = true`
- `ENABLE_COMPOSE_BUDGET = true`
- `ENABLE_COMPOSE_BUDGET_FORM = true`
- `ENABLE_COMPOSE_SPACE = true`
- `ENABLE_COMPOSE_MENU = true`
- `ENABLE_COMPOSE_NOTIFICATIONS = true`
- `ENABLE_COMPOSE_ONBOARDING = true`

### 2026-07-14 공통 UI 기반

- 공통 내비게이션은 Material 3 `NavigationSuiteScaffold`를 사용한다.
- compact 화면은 NavigationBar, medium/expanded 화면은 NavigationRail 계열로 자동 전환한다.
- 화면 상태는 `GleaumStateCard`, 안내는 `GleaumFeedbackBanner`, 상태/분류는 `GleaumStatusBadge`/`GleaumLabelBadge`를 사용한다.
- 화면별 정량 평가 기준은 `docs/22-android-material3-ui-audit.md`를 따른다.

## 3. 실기기 필수 QA

> 아래 항목은 체크리스트다. 코드 구현 완료와 실기기 확인 완료를 혼동하지 않는다. 현재는 연결 단말 잠금 해제 후 전체 재검증이 필요하다.

### 3.1 시작/로그인
- [x] 스플래시 후 로그인 화면 진입 (2026-07-16, `SM_F731N`).
- [x] 브랜드 고정 다크 로그인 화면의 로고·텍스트·버튼 시각 확인 (2026-07-16).
- Google 로그인 성공 후 네이티브 홈 진입.
- 이메일 로그인/회원가입 약관 동의 플로우 정상.
- 로그아웃 후 네이티브 로그인 화면 복귀.

### 3.2 홈
- 홈 Hero/오늘 일정/광고 placeholder/가계부 요약 렌더링.
- 하단 네비게이션 위치/아이콘/라벨 일관성.
- 오늘 일정 없음 상태와 일정 있음 상태 모두 확인.
- 새 일정 추가 진입.

### 3.3 일정
- 일정 목록 진입.
- 필터/날짜 선택.
- 일정 상세 진입.
- 일정 생성/수정/삭제.
- 완료/예정 상태 변경.

### 3.4 가계부
- 가계부 요약 렌더링.
- 수입/지출/순액/저축률, 반복 예정, 카테고리별 지출 요약이 개인 가계부 기준으로 보이는지 확인.
- 수입/지출 등록.
- 일회성/정기 항목 등록.
- 예정/완료 토글.
- 수정/삭제.

### 3.5 공간
- 개인 공간 표시.
- 공유 공간 표시.
- 초대 코드 복사 결과가 URL이 아니라 코드 자체인지 확인.
- 새 공간 만들기.
- 초대 코드 참여.
- 멤버 역할/내보내기/초대 코드 재생성.

### 3.6 전체/설정
- 화면 모드: 자동/라이트/다크 저장.
- 홈 레이아웃 저장.
- 캘린더 설정: 권한 요청/캘린더 선택/동기화 끄기.
- 알림 설정 저장.
- 생체인증 보안: 켜기/끄기/재잠금 기준 변경.
- 프로필 관리 저장.
- 비밀번호 설정 검증/저장.
- 계정 탈퇴/복구 상태 조회.
- 약관/개인정보 WebView 진입 및 닫기.

### 3.7 알림
- 알림 목록 진입.
- 새로고침.
- 모두 읽음.
- 개별 알림 읽음 처리.
- 일정 알림 클릭 시 일정 상세 이동.

### 3.8 온보딩
- 신규 또는 온보딩 미완료 계정으로 진입.
- 닉네임/실명/표시 방식.
- 사용 목표 선택.
- 홈 레이아웃 선택.
- 공간 나중에 설정/생성/초대코드 참여.
- 알림/생체인증 설정.
- 완료 후 네이티브 홈 진입.

## 4. 라이트/다크 QA

각 화면에서 다음을 확인한다.

- 검정 텍스트가 다크모드에서 보이지 않는 문제 없음.
- 카드/리스트/입력창 배경과 텍스트 대비 정상.
- 하단 네비게이션 active/inactive 상태 정상.
- Dialog, TextField, Switch, RadioButton 색상 대비 정상.

대상 화면:

- 홈
- 일정 목록/상세/폼
- 가계부 목록/폼
- 공간
- 전체 메뉴
- 설정 하위 다이얼로그
- 알림
- 온보딩
- 로그인/회원가입

### 시스템 바 동기화

- 자동/라이트/다크 모드 전환 후 상태바와 내비게이션 바가 본문 테마와 같은 명도로 전환되는지 확인한다.
- 설정 저장 직후에는 Activity를 재생성해 Compose 색상 스킴과 Android 시스템 바가 같은 모드를 사용한다.
- 외부 Activity/다이얼로그에서 돌아온 화면도 `onResume`에서 테마를 다시 적용해야 한다.

## 5. 태블릿/폴더블 QA

- 화면 좌우 여백 과다/부족 여부.
- Dialog 폭/입력 필드 폭이 과하게 늘어나지 않는지.
- 하단 네비게이션이 태블릿에서 어색하지 않은지.
- LegalWebView 약관 문서가 모바일 폭으로 고정되어 보이지 않는지.
- 온보딩 단계별 입력창/선택 카드가 한 화면에서 과도하게 늘어나지 않는지.

### 2026-07-16 Preview 실기기 결과

- `SM_F731N` compact 1080×2640, 글꼴 1.3배, 다크 테마에서 앱바·카드·FAB·NavigationBar의 잘림·겹침·대비 문제 없음.
- 2560×1600 / 320dpi expanded 규격에서 NavigationRail 전환 확인.
- expanded QA 중 공통 콘텐츠 최대 폭이 무효화되는 Modifier 순서 문제를 발견해 수정했고, 840dp 중앙 정렬을 UI 계층 좌표와 캡처로 재확인했다.
- UIAutomator에서 로고·알림·추가·홈/일정/공간/가계부/전체·펼치기 설명과 44dp 이상 터치 영역을 확인했다.
- 단말의 화면 크기·밀도·글꼴·라이트 모드는 모두 원래 값으로 복원했다.
- 실제 TalkBack 음성 탐색과 인증 이후 화면의 폰 가로/expanded 검증은 수동 QA가 남아 있다.

## 6. 릴리즈 전 차단 기준

아래 항목 중 하나라도 발생하면 Google Play 업데이트 전에 수정한다.

- 로그인 후 WebView 로그인 화면으로 되돌아감.
- 하단 네비게이션이 화면별로 다르게 보임.
- 다크모드에서 텍스트가 안 보임.
- 개인 공간/공유 공간 데이터가 섞여 보임.
- 가계부 일회성 지출이 예정/정기처럼 보임.
- 캘린더/생체인증 권한 요청이 막힘.
- 앱 크래시 또는 무한 로딩.
- Play Console 권한 경고 재발.

## 7. Android Kakao AdFit QA

### 2026-07-13 SDK 탑재 상태

- Android 네이티브 앱에 Kakao AdFit SDK 의존성을 추가했다.
- Kakao AdFit Maven repository를 Android Gradle 공통 repository에 추가했다.
- 앱 실행 후 네이티브 홈 진입 시 하단 전환형 팝업 광고 지면을 연결했다.
  - 광고 단위명: 앱 실행 하단
  - 광고 단위 코드: `DAN-Brd0FQAE3ByDWwJu`
  - 위치: 스플래시 종료 후 Android 네이티브 홈 데이터 로드 완료 시.
  - 구현: `AdFitPopupAdLoader` + `AdFitPopupAdDialogFragment`의 SDK 제공 팝업 UI.
- 광고 코드나 HTML/스크립트 문자열은 어떤 화면에도 텍스트로 표시되면 안 된다.
- 홈 중간 인라인 광고 및 홈 하단 고정 배너는 사용하지 않는다.

검증 기준:

- Android Studio Gradle Sync 정상.
- `:app:assembleDebug` 통과.
- 기존 AdMob 의존성과 충돌 없음.
- SDK가 렌더링한 광고 외곽을 앱이 임의 라운딩/클리핑/오버레이하지 않는다.
- 광고 로드 실패 또는 차단 시 홈 레이아웃이 깨지지 않아야 한다.

## 8. 기기 캘린더 2차 QA

- 설정에서 권한 요청과 쓰기 가능한 대상 캘린더 선택을 확인한다.
- `앞으로 30일 일정 동기화` 실행 시 글리움이 만든 일정만 생성/수정/삭제된다.
- 같은 일정을 재동기화해 중복 생성되지 않는지 확인한다.
- 글리움 외부에서 만든 캘린더 일정은 절대 수정·삭제하지 않는지 확인한다.
- 이 기능은 사용자가 설정 화면에서 직접 실행하는 단방향 동기화다. 백그라운드 자동 동기화나 외부 일정 가져오기는 후속 범위다.

## 9. 기기 캘린더 3차 QA

- 전체 메뉴 → 캘린더 설정에서 `일정 변경 시 자동 반영`을 켤 수 있다.
- 자동 반영은 사용자가 연동을 켜고 대상 캘린더를 선택한 경우에만 실행된다.
- 네이티브 일정 등록·수정·삭제 후 선택된 기기 캘린더의 글리움 표식 일정이 즉시 생성·수정·삭제되는지 확인한다.
- `수동 동기화`로 되돌리면 일정 변경 시 기기 캘린더가 바뀌지 않아야 한다.
- 지출 일정과 글리움 표식이 없는 외부 일정은 자동 반영 대상이 아니다.
- 외부 일정 가져오기는 데이터 경계를 위해 개인 공간 전용 흐름으로 구현한다.

## 10. 기기 캘린더 가져오기 QA

- 전체 메뉴 → 캘린더 설정 → `기기 일정 가져오기`로 진입한다.
- 선택한 기기 캘린더의 앞으로 30일 일정만 후보로 보이는지 확인한다.
- 가져오기 후보는 사용자가 체크한 항목만 개인 일정으로 생성되는지 확인한다.
- 가져온 일정은 개인 공간의 `private` 일정이며 공유 공간 일정 목록에는 나타나지 않아야 한다.
- 글리움에서 내보낸 표식 일정과 제목·시작 시각이 이미 같은 개인 일정은 중복 후보로 제외되는지 확인한다.
- 외부 기기 일정은 가져오기 작업만으로 수정·삭제되지 않아야 한다.
