# 22. Android Material 3 UI 품질 감사

> 기준일: 2026-07-14
> 목표: Android 네이티브 화면 평균 A 등급. Material 3를 기본으로 하며 글리움 Blue/Teal/Green 디자인 토큰만 사용한다.

## 1. 평가 기준

| 항목 | 배점 | A 등급 기준 |
|---|---:|---|
| 색상·타이포·Shape 토큰 | 20 | 임의 색상/반경 없음, light/dark ColorScheme 역할 사용 |
| 정보 계층·카드 역할 | 20 | Elevated/ Filled/ Outlined 역할이 명확하고 대표 정보가 1순위 |
| 내비게이션·앱바 | 15 | 화면별 위치·아이콘·라벨 일치, 태블릿은 navigation rail 전환 |
| 라이트·다크 대비 | 15 | 텍스트·아이콘·시스템 바 대비 정상, 의미색의 양 테마 대응 |
| 상태·접근성 | 15 | loading/empty/error 구분, 상태를 클릭 칩으로 오인하지 않음 |
| 태블릿·폴더블 | 15 | 폭 제한, 공식 adaptive navigation, 폼/상세 화면 과도한 확장 없음 |

- `A`: 90~100
- `B`: 80~89
- `C`: 70~79
- `D`: 69 이하
- 코드 감사 점수와 실기기 시각 QA 점수 중 낮은 값을 최종 점수로 사용한다.

## 2. 확정된 Material 3 규칙

- `ElevatedCard`: 화면당 1개의 대표 요약/Hero에만 사용한다.
- `Card`(Filled): 설정 그룹, 입력 그룹, 보조 요약처럼 한 덩어리인 정보에 사용한다.
- `OutlinedCard`: 클릭 가능한 목록, 세부 항목, 빈 상태의 보조 행동에 사용한다.
- 상태 표시는 `GleaumStatusBadge`, 분류 라벨은 `GleaumLabelBadge`를 사용한다. 동작 없는 `AssistChip(onClick = {})`은 금지한다.
- 안내는 `GleaumFeedbackBanner`, 전체 상태는 `GleaumStateCard`를 사용한다. 일반 안내를 `errorContainer`로 표시하지 않는다.
- Hero와 카드에 임의 그라데이션을 사용하지 않는다. Material surface/container 역할로 계층을 만든다.
- 네이티브 공통 메뉴는 `NavigationSuiteScaffold`를 사용한다. compact 폭은 NavigationBar, medium/expanded 폭은 NavigationRail 계열로 자동 전환한다.
- Compose 화면의 색상은 `MaterialTheme.colorScheme`, 레거시 View 화면은 `NativeTheme`을 사용한다.

## 3. 2026-07-14 코드 감사 결과

| 화면 | 임시 코드 점수 | 등급 | 반영 내용 | 실기기 최종 QA |
|---|---:|:---:|---|---|
| 홈 | 92 | A | 로딩/오류 시 본문 중복 노출 제거, Hero 그라데이션 제거, 상태/배지 통일 | 대기 |
| 일정 목록 | 92 | A | 통계 칩을 비클릭 라벨로 교체, 상태 배지/공통 상태 카드 적용 | 대기 |
| 일정 상세 | 91 | A | Hero 그라데이션 제거, 상태/분류 배지 분리, 태블릿 폭 제한 | 대기 |
| 일정 등록/수정 | 90 | A | 성공/오류 안내 의미색 분리, 태블릿 폭 제한 | 대기 |
| 가계부 | 92 | A | 수입/지출 의미색과 상태 배지 통일, 공통 상태 카드 적용 | 대기 |
| 가계부 등록/수정 | 90 | A | 오류 배너 통일, 정기/일회 입력 계층 유지, 태블릿 폭 제한 | 대기 |
| 공간 | 93 | A | 소식 기본 진입, 일정/멤버 탭, 운영 기능 후순위, 비활성 멤버 행 클릭 의미 제거 | 대기 |
| 전체 메뉴 | 91 | A | 일반 메시지 오류색 오용 제거, 설정 그룹 계층 유지 | 대기 |
| 알림 | 92 | A | 선택 대상 없는 별도 하단 nav 제거, 공통 상태 카드·단일 앱바 적용 | 대기 |
| 온보딩 | 90 | A | 단계 분리 유지, 적응형 폭 제한 적용 | 대기 |
| 로그인/가입 | 86 | B | 하드코딩 문자열 리소스화, API 33 back 처리, 태블릿 판별 보정 | 2026-07-16 로그인 화면 부분 통과: `SM_F731N` 1080×2640, 잘림·겹침·크래시 없음. 인증 이후 가입 흐름은 대기 |

- 코드 감사 평균: `90.8 / 100`, A.
- 최종 등급은 연결 단말 화면을 켠 상태에서 아래 검증을 완료한 뒤 확정한다.
- 로그인은 브랜드 전용 XML 화면을 유지하므로 현재 유일한 B 등급이다. 다음 UI 라운드에서 Compose Material 3 전환 여부를 결정한다.

## 4. 이번 공통 기반 변경

- `GleaumTheme.kt`: light/dark 전체 ColorScheme, 명시적 Typography, Shapes 정의.
- `GleaumSemanticColors.kt`: 지출 등 제품 의미색의 양 테마 container 정의.
- `GleaumScaffold.kt`: 브랜드 앱바와 Material 3 Adaptive Navigation Suite 적용.
- `GleaumAdaptiveContent.kt`: Window container 폭 기준 720/840dp 제한.
- `GleaumFeedback.kt`: info/success/warning/error 안내 배너.
- `GleaumStatusBadge.kt`: 비클릭 상태/라벨 배지.
- `GleaumStateCard.kt`: loading/empty/error 공통 상태 카드.

## 5. 실기기 최종 체크

- 각 화면을 라이트/다크/자동 모드에서 각각 확인한다.
- 홈, 일정, 공간, 가계부, 전체 메뉴의 navigation indicator·아이콘·라벨 위치가 동일한지 확인한다.
- 상태바와 시스템 navigation bar 명도가 본문 테마와 같은지 확인한다.
- 폰 세로, 폰 가로, 태블릿/폴더블 expanded에서 nav bar/rail 전환과 콘텐츠 폭을 확인한다.
- 큰 글꼴 1.3배에서 제목, 금액, 버튼이 잘리거나 겹치지 않는지 확인한다.
- TalkBack에서 아이콘 버튼의 설명과 비클릭 배지가 올바르게 읽히는지 확인한다.
