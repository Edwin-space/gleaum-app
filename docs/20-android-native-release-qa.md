# 20. Android Native Release QA Checklist

> 작성일: 2026-07-08
> 목적: Android 네이티브 Material 3 전환 이후 Google Play 업데이트 전 필수 검증 항목을 정리한다.

## 1. 현재 사전 점검 결과

### 빌드
- Debug 빌드: 통과
  - 명령: `JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' android/gradlew -p android :app:assembleDebug --quiet`
- Release manifest 처리: 통과
  - 명령: `JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' android/gradlew -p android :app:processReleaseManifest :app:processReleaseManifestForPackage`

### Play Console 권한 이슈 재점검
- 릴리즈 매니페스트에서 아래 권한 검출 없음.
  - `READ_MEDIA_IMAGES`
  - `READ_MEDIA_VIDEO`
  - `READ_EXTERNAL_STORAGE`
  - `WRITE_EXTERNAL_STORAGE`

### 기기 연결 상태
- ADB 서버는 승인 후 정상 기동됨.
- 현재 연결된 Android 기기 없음.
- 실기기 설치/화면 QA는 기기 연결 후 진행 필요.

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

## 3. 실기기 필수 QA

### 3.1 시작/로그인
- 스플래시 후 로그인 화면 진입.
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

## 5. 태블릿/폴더블 QA

- 화면 좌우 여백 과다/부족 여부.
- Dialog 폭/입력 필드 폭이 과하게 늘어나지 않는지.
- 하단 네비게이션이 태블릿에서 어색하지 않은지.
- LegalWebView 약관 문서가 모바일 폭으로 고정되어 보이지 않는지.
- 온보딩 단계별 입력창/선택 카드가 한 화면에서 과도하게 늘어나지 않는지.

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
