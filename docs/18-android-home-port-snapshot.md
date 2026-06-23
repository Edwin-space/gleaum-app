# 18. Android Home Native Port Snapshot

> 최종 업데이트: 2026-06-23
>
> 목적: Android 홈 화면을 네이티브로 이식할 때 현재 Mobile Web 홈 UI를 정답지로 고정한다. 이 문서의 기준 없이 Android 홈 화면을 구현하거나 활성화하지 않는다.

---

## 1. 원본 기준 파일

Android Native Home Port의 원본은 아래 파일이다.

- `src/app/home/MobileHome.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/components/InlineFeedAd.tsx`
- `src/components/ui/Card.tsx` (`ScheduleCard`)
- `src/components/calendar/CalendarView.tsx`

Android 구현은 위 파일의 화면 구조, 문구, 수치, 색상, 인터랙션을 우선한다.

---

## 2. 화면 전체 컨테이너

| 항목 | Mobile Web 기준 |
|---|---|
| Root min height | `100dvh` |
| Background | `var(--theme-bg)` |
| Horizontal padding | `20px` |
| Top content padding | `16px` |
| Section gap | `14px` |
| Bottom padding | `calc(env(safe-area-inset-bottom) + 80px)` |

Android에서는 `dp`로 변환하되 시각 결과가 Mobile Web과 같아야 한다.

---

## 3. 섹션 순서

현재 Mobile Web 홈의 실제 순서는 아래와 같다.

1. Sticky Header
2. Greeting Summary Card
3. Today / Calendar Toggle Row
4. Expandable Calendar Panel
5. Selected Date Schedule Section
6. Inline Feed Ad
7. Monthly Personal Budget Summary Card
8. Upcoming Schedules Section
9. Bottom Navigation

주의: 사용자가 별도 제품 방향으로 홈 순서를 바꾸려면 먼저 Mobile Web을 변경하고, 그 다음 Android Native Port를 맞춘다. Android만 단독으로 순서를 바꾸지 않는다.

---

## 4. Sticky Header Snapshot

원본: `MobileHome.tsx` Header

| 항목 | 기준 |
|---|---|
| Position | sticky top `0` |
| Z-index | `40` |
| Padding | `safe-area-top + 6px`, left/right `20px`, bottom `10px` |
| Background | `var(--theme-nav-bg)` |
| Blur | `blur(20px)` |
| Border bottom | `1px solid var(--theme-border)` |
| Left | `GleaumLogoImg size=32` + `GleaumBI width=88` |
| Right | notifications circular button `40px` |

Android 포트 시 로고와 BI 비율을 임의 변경하지 않는다.

---

## 5. Greeting Summary Card Snapshot

원본: `MobileHome.tsx` 인사 + 오늘 요약 카드

| 항목 | 기준 |
|---|---|
| Radius | `28px` |
| Padding | `28px 24px` |
| Background | `linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)` |
| Shadow | `0 16px 48px rgba(26,27,46,0.25)` |
| Decorations | top-right blue radial glow, bottom-left teal radial glow |

### Text

| 요소 | 기준 |
|---|---|
| Greeting | `13px`, weight `600`, color `rgba(12,201,181,0.90)` |
| Name | `26px`, weight `800`, white, letter spacing `-0.5px` |
| Layout copy | `12px`, weight `500`, color `rgba(255,255,255,0.50)`, line-height `1.5` |

### Metrics

3-column grid, gap `10px`.

| Metric | Value color | Label |
|---|---|---|
| Total today | white | 오늘 전체 |
| Completed | `#2EE895` | 완료 |
| Pending | `#0CC9B5` | 남은 일정 |

Metric card:

- padding `12px 8px`
- radius `16px`
- background `rgba(255,255,255,0.08)` or themed rgba
- value `24px`, weight `800`
- label `11px`, weight `600`

---

## 6. Today / Calendar Toggle Row Snapshot

| 항목 | 기준 |
|---|---|
| Height | content-driven, padding `14px 20px` |
| Radius | `20px` |
| Background | `var(--theme-surface)` |
| Border | `1px solid rgba(0,0,0,0.04)` |
| Shadow | `0 2px 16px rgba(0,0,0,0.06)` |
| Icon | calendar SVG, stroke `#0084CC`, size `18` |
| Date text | `15px`, weight `700`, `var(--theme-text)` |
| TODAY badge | `10px`, weight `700`, gradient teal → blue, radius pill |
| Chevron | stroke `var(--theme-text-subtle)`, rotates on expand |

Interaction:

- Tap toggles `calendarOpen`.
- Analytics event: `calendar_toggle` with `open` / `close`.

---

## 7. Calendar Panel Snapshot

| 항목 | 기준 |
|---|---|
| Radius | `24px` |
| Padding | `16px` |
| Background | `var(--theme-surface)` |
| Overflow | hidden |
| Shadow | `0 2px 16px rgba(0,0,0,0.06)` |
| Border | `1px solid rgba(0,0,0,0.04)` |

### View tabs

- Container background `var(--theme-surface-muted)`
- Radius `12px`
- Padding `3px`
- Buttons: 월간 / 주간 / 일간
- Active button: white background, `#1A1B2E`, weight `800`, shadow `0 1px 4px rgba(0,0,0,0.10)`
- Inactive: transparent, `#8E8E93`, weight `600`

Android first pass may implement the collapsed row first, then month/week/day panel later. If incomplete, keep the panel disabled rather than changing UI.

---

## 8. Selected Date Schedule Section Snapshot

Header:

- Title: `{formatDateShort(selectedDate)} 일정`, `18px`, weight `800`, color `var(--theme-text)`
- Count: `{todaySchedules.length}개`, `13px`, weight `700`, color `#0084CC`
- Add button: `+ 새 일정`, height `32px`, padding `0 12px`, pill, gradient teal → blue, white text, `12px`, weight `800`

Loading:

- centered spinner
- `24px`
- border `2.5px solid #0CC9B5`, top transparent

Empty state:

| 항목 | 기준 |
|---|---|
| Card radius | `24px` |
| Padding | `48px 20px` |
| Background | `var(--theme-surface)` |
| Border | `1px solid rgba(0,0,0,0.04)` |
| Shadow | `0 2px 16px rgba(0,0,0,0.06)` |
| Icon circle | `56px`, background `rgba(0,132,204,0.06)` |
| Main text | `등록된 일정이 없어요` |
| Sub text | `오른쪽 위 새 일정 버튼으로 바로 추가할 수 있어요` |

Schedule card:

Use `ScheduleCard` in `src/components/ui/Card.tsx` as source.

- Container radius `20px`
- Surface background
- Border `1px solid rgba(0,0,0,0.06)`
- Shadow `0 2px 12px rgba(0,0,0,0.06)`
- Left time column width `68px`
- Type badge and status badge unchanged

---

## 9. Inline Feed Ad Snapshot

원본: `InlineFeedAd.tsx`

- Web: `AdSlot(slotId="home-feed-inline")`
- Native App: `NativeAdPlugin` via `NativeInlineAd`
- Loading placeholder: height `60px`, radius `12px`, background `rgba(0,0,0,0.03)`

Android Native Home Port first pass should reserve the same ad position. If NativeAd rendering is not ready, hide only the ad content area without moving other sections unpredictably.

---

## 10. Budget Summary Card Snapshot

원본: `budgetSummaryCard` in `MobileHome.tsx`

| 항목 | 기준 |
|---|---|
| Link target | `/budget` |
| Radius | `24px` |
| Padding | `20px` |
| Background | `var(--theme-surface)` |
| Border | `1px solid var(--theme-border)` |
| Shadow | `0 2px 16px rgba(0,0,0,0.06)` |

Text:

- Eyebrow: `MONEY FLOW`, `11px`, weight `800`, color `#0CC9B5`, uppercase, letter spacing `0.08em`
- Title: `이번 달 개인 가계부`, `18px`, weight `900`
- Description: `지출 기록과 고정 지출 예정 흐름을 확인하세요.`, `12px`, weight `600`

Stats grid:

- Columns: `1.2fr 1fr 1fr`
- Gap: `8px`
- Total card: gradient rgba teal/blue background
- Fixed/Variable cards: `var(--theme-surface-muted)`

Footer:

- `고정 지출 예정 N건`
- `가계부 보기 →`

---

## 11. Upcoming Schedules Snapshot

Only shown when `upcoming.length > 0`.

Header:

- Title: `다가오는 일정`, `16px`, weight `800`
- Right link: `전체보기`, `/schedules`, `13px`, weight `700`, subtle text

Item:

- Radius `16px`
- Padding `14px 16px`
- Background `var(--theme-surface)`
- Shadow `0 2px 10px rgba(0,0,0,0.05)`
- Left date tile: `40px`, radius `12px`, background `rgba(0,132,204,0.06)`
- Month text `10px`, date text `16px`

---

## 12. Bottom Navigation Snapshot

원본: `BottomNav.tsx`

| 항목 | 기준 |
|---|---|
| Position | fixed bottom `0` |
| Width | full |
| Z-index | `9999` |
| Background | `var(--theme-surface)` |
| Border top | `1px solid var(--theme-border)` |
| Safe area | `paddingBottom: env(safe-area-inset-bottom)` |
| Shadow | `0 -1px 8px rgba(0,0,0,0.05)` |
| Height | `48px` content area |

Items:

1. 홈 `/home`
2. 일정 `/schedules`
3. 공간 `/space`
4. 가계부 `/budget`
5. 전체 `/mypage`

Active:

- Top indicator: width `28px`, height `2.5px`, color `var(--color-primary)`
- Icon stroke active `var(--color-primary)`
- Inactive icon/text `var(--theme-text-subtle)`
- Label `10px`, active weight `700`, inactive `500`

Android Native Port must use this structure. Do not create floating pill navigation or iOS-style tab bar.

---

## 13. Data Contract

Recommended source: `/api/native/home-summary`.

Required fields for first Android Native Home pass:

- `user.displayName`
- `user.timezone`
- `spaces.activeSpaceName`
- `spaces.memberCount`
- `schedules.today`
- `schedules.upcoming`
- `schedules.range`
- `schedules.todayCount`
- `schedules.completedCount`
- `schedules.pendingCount`
- `schedules.upcomingCount`
- `calendar.selectedDate`
- `calendar.month`
- `calendar.week`
- `calendar.days`
- `ledger.incomeTotal`
- `ledger.expenseTotal`
- `ledger.net`

Status count contract:

- `completedCount`: 오늘 일정 중 `status === 'completed'`
- `pendingCount`: 오늘 일정 중 `status !== 'completed'`

Calendar contract:

- `schedules.range`: Native Preview가 선택일 일정 목록을 로컬 필터링할 수 있는 현재 월/주/향후 일정 범위
- `calendar.week`: 현재 주 7일 날짜 스트립용 메타데이터
- `calendar.days`: 현재 월 날짜별 카운트/타입 점 메타데이터

Remaining gap: Android Native Preview currently renders a compact weekly date strip, not the full Web month/week/day calendar panel. Full activation 전에 월간/주간/일간 전환 UI를 네이티브로 어디까지 이식할지 별도 결정한다.

---

## 14. Android Implementation Checklist

- [x] Create disabled native home screen skeleton.
- [x] Parse `/api/native/home-summary` into Android data model.
- [x] Render header only in disabled/internal mode.
- [x] Render summary card to match section 5.
- [x] Render today/calendar toggle row.
- [x] Render selected date schedule section.
- [x] Render ad placeholder in exact original position.
- [x] Render budget card.
- [x] Render upcoming schedules.
- [x] Render BottomNav matching section 12.
- [ ] Compare with Mobile Web screenshot before enabling flag.
- [ ] Keep WebView fallback for all non-ported flows.

---

## 15. Activation Rule

`NativePortFlags.ENABLE_NATIVE_HOME` must remain `false` until:

- visual comparison is complete,
- login/session regression is complete,
- back navigation is verified,
- notification tap routing is verified,
- user explicitly approves internal test activation.

## 16. Current Native Skeleton Status

2026-06-23 1차 시각 점검:

- `Pixel_9` 에뮬레이터 debug build에서 Preview Activity 실행 확인
- 세션 없는 환경에서는 세션 없음 상태 카드와 skeleton UI가 표시됨
- 상단 safe-area 보정 완료: 상태바와 `gleaum` 로고가 겹치지 않음
- BottomNav 1차 보정 완료: text-only에서 active indicator + icon + label 구조로 변경
- BottomNav/날짜 토글/빈 상태 임시 문자 아이콘 제거 완료
- `NativeBottomNavIconView` custom Canvas stroke icon으로 home/calendar/space/budget/my 렌더링
- 로그인 세션이 있는 에뮬레이터에서 `displayName`, `activeSpaceName`, calendar week, 선택일 일정 empty state가 표시되는 데이터 바인딩 화면 확인
- 상단 Header는 공식 앱 아이콘 + BI 워드마크 리소스로 교체 완료
- BottomNav 라벨 weight/아이콘 stroke를 재조정해 text-only/문자 아이콘 기반의 조잡함 제거
- Native typography 완전 일치는 Pretendard font asset 도입 후 별도 진행 필요

2026-06-22 기준 `android/app/src/main/java/com/gleaum/app/NativeHomePortActivity.kt`는 비활성 상태에서 Mobile Web 홈 섹션 순서의 Preview를 렌더링한다.

- `NativePortFlags.ENABLE_NATIVE_HOME=false` 유지
- 운영 진입 흐름에 연결하지 않음
- debug preview에서 `SessionManager` access token으로 `/api/native/home-summary` 호출
- 로딩/세션 없음/오류 상태 표시
- `user.displayName`, `spaces.activeSpaceName`, `schedules.today/upcoming`, `ledger` 요약을 UI에 바인딩
- `/api/native/home-summary`에서 `schedules.completedCount`/`pendingCount`를 제공하고, Native Preview 요약 카드가 해당 서버 값을 우선 사용
- `/api/native/home-summary`에서 `schedules.range`, `calendar.week`, `calendar.days`를 제공하고, Native Preview가 주간 날짜 스트립과 선택일 일정 필터링에 사용
- Preview 액션은 WebView fallback으로 연결: 알림, 새 일정, 일정 상세, 가계부 카드, 하단 네비
- Android `:app:assembleDebug` 통과
- 다음 작업은 Mobile Web 캡처와 Native Preview를 비교하고, 월간/주간/일간 캘린더 패널을 전체 이식할지 결정하는 것
## 2026-06-23 BottomNav/Chrome 추가 보정

- Header 알림 버튼을 텍스트 CTA에서 bell outline icon button으로 교체했다.
- BottomNav는 Mobile Web의 `48px` 슬림 네비 구조에 맞춰 Android preview 높이를 `56dp`로 낮췄다.
- BottomNav 아이콘은 `20dp`, stroke `2.2dp` 기준으로 조정했고 라벨은 `홈/일정/공간/가계부/전체`로 Web과 일치시켰다.
- Android 시스템 status/navigation bar를 light icon mode로 지정해 밝은 배경에서 상태바 아이콘 대비가 깨지지 않도록 했다.
- 검증 캡처: `/tmp/gleaum-native-home-nav-polish-2.png`

## 2026-06-23 Header/Hero/Card Chrome 보정

- Native Home Header를 ScrollView 밖 fixed chrome으로 분리해 Web MobileHome의 sticky header 동작에 맞췄다.
- Header 하단 hairline/elevation을 적용해 스크롤 컨텐츠와 분리감을 만들었다.
- Hero summary card에 native radial glow view를 추가해 Web의 blue/teal glow 장식을 재현했다.
- 주요 카드 surface에 Android elevation을 적용해 flat하게 보이던 Native preview 질감을 보정했다.
- 검증 캡처: `/tmp/gleaum-native-home-chrome-polish-loaded.png`

## 2026-06-23 Budget Card 보정

- Native Home의 `이번 달 개인 가계부` 카드를 Web MobileHome 카드 구조에 맞춰 확장했다.
- 한 줄 요약 대신 `수입 / 지출 / 순흐름` 3개 stat box를 노출한다.
- 하단에 `개인 공간 기준`과 `가계부 보기 →` CTA를 배치해 공간/개인 가계부 경계를 명확히 했다.
- 검증 캡처: `/tmp/gleaum-native-home-budget-card-scrolled.png`

## 2026-06-23 Home 5-step follow-up

- Calendar 영역은 `월간 / 주간 / 일간` segmented control을 가진 Native panel로 확장했다.
- Today toggle은 캘린더 접기/펼치기 상태를 직접 관리한다.
- 선택일 일정 카드는 타입 배지, 상태 배지, 타입별 컬러 block, chevron affordance를 포함한다.
- 다가오는 일정은 `전체보기` CTA와 date tile 구조로 Web MobileHome에 맞췄다.
- 로딩 상태는 단순 문구 대신 skeleton-like summary card로 변경했다.
- `Pretendard/Outfit` 실제 font asset은 현재 레포에 없어 번들 추가는 보류했다. 대신 Native typography helper를 도입해 추후 `res/font` 교체 지점을 단일화했다.
- 검증: Android `:app:assembleDebug`, Pixel_9 emulator screenshots `/tmp/gleaum-native-home-five-step-top.png`, `/tmp/gleaum-native-home-five-step-day-2.png`

## 2026-06-23 Native 전체 메뉴 Shell 연결

- Home BottomNav의 `전체` 탭을 WebView `/mypage` fallback 대신 Android `NativeMyMenuActivity`로 연결했다.
- Native 전체 메뉴는 기기 기능 설정과 로그아웃을 우선 네이티브 처리하고, 상세 설정은 단계적으로 WebView fallback을 유지한다.
- 검증 캡처: `/tmp/gleaum-native-menu-shell-retest.png`



## 2026-06-23 Native 일정 등록 1차

- Home Selected Date Schedule Section의 `+ 새 일정` 버튼을 Android `NativeScheduleCreateActivity`로 연결했다.
- `NativeScheduleCreateActivity`는 Mobile Web의 일정 생성 흐름을 기준으로 `개인 / 공유 / 자녀` 타입, 제목, 날짜, 시작/종료 시간, 메모를 입력한다.
- 저장은 `POST /api/native/schedules`를 호출하며, 서버의 personal/shared space 결정 및 shared editor 권한 검사를 그대로 따른다.
- 지출/수입 등록은 일정 등록에 섞지 않는다. 돈 흐름은 Native Budget Port에서 별도 화면/모델로 처리한다.
- Native 전체 메뉴 빠른 액션의 `일정 추가`도 동일 Activity를 사용한다.
- 검증: Android `:app:assembleDebug`, Pixel_9 emulator screenshot `/tmp/gleaum-native-schedule-create.png`
