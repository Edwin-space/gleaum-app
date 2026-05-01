# 11. 개선/추가 기능 종합 진단 (Improvement Audit)

> 작성일: 2026-04-30
> 진단 범위: `src/` 전체 + `docs/` + `DESIGN.md` + `gleaum_design_system.html`
> 진단 영역: 기능/UX 완성도 · 디자인/브랜드 일관성 · 코드 품질/아키텍처

| 기호 | 의미 | 의사결정 기준 |
|------|------|--------------|
| 🔴 **P0** | 서비스 오픈 전 반드시 해결 | 데이터 무결성 / 핵심 가치 제안 / 보안 |
| 🟡 **P1** | 베타 직후 즉시 처리 | 사용성·일관성 큰 영향 |
| 🟢 **P2** | 정식 1.0 전 정리 | 품질·확장성 |

---

## 1. 기능 / UX 완성도

### 1.1 🔴 P0 — 서비스 핵심 가치 미달성

#### F-1. **알림 발송 파이프라인 전체 부재**
- **현상**: `notifications` 테이블은 정의돼 있으나, **어디서도 INSERT 하지 않음**. `/notifications` 페이지는 항상 빈 상태로 렌더링됨.
- **영향**: 글리움의 핵심 가치인 *"자녀 일정 미완료 시 부모 재알림"*, *"정기지출 D-1 알림"* 모두 작동 안 함.
- **조치**:
  1. Supabase Edge Function 또는 Vercel Cron Job — 매분 실행, `schedules.start_time - reminder` 기준 알림 INSERT
  2. FCM 서버 키 발급 → `public/firebase-messaging-sw.js` 작성
  3. `src/lib/notifications.ts` 신규 — 알림 생성/예약 헬퍼

#### F-2. **자녀 일정 자동 상태 전이 없음**
- **현상**: 시간이 도래해도 `pending → in_progress` 자동 전환 없음. 종료 시각이 지나도 `missed` 자동 처리 없음.
- **영향**: 부모가 직접 일정마다 상태를 바꿔야 함 → 자녀 일정 대시보드의 "완료율" 통계가 의미 없어짐.
- **조치**: Edge Function (cron 5분 단위) — `now() >= start_time AND status='pending'` → `in_progress`, `now() >= end_time AND status IN ('pending','in_progress')` → `missed`.

#### F-3. **재알림 버튼 = 가짜 (`alert()` 호출)**
- **현상**:
  - `src/app/schedules/[id]/page.tsx:310` — `alert(\`📣 ${schedule?.title} 재알림을 발송했습니다.\`)`
  - `src/app/schedules/children/page.tsx:291` — `alert(\`${schedule.title} 재알림 발송!\`)`
- **영향**: 실제 알림 안 가는데 "발송됨" 메시지 → 사용자 신뢰 훼손.
- **조치**: 임시로라도 `notifications` 테이블에 row 추가 + (FCM 도입 후) 푸시 발송.

#### F-4. **PWA 매니페스트 누락 → 메타 선언과 실 파일 불일치**
- **현상**: `src/app/layout.tsx:7`은 `manifest: '/manifest.json'`을 선언하지만 `public/manifest.json` **파일이 없음** → 404. 아이콘(`apple-touch-icon`, 다양한 사이즈) 0개.
- **영향**: 홈 화면 추가 / 스플래시 / 오프라인 미작동 → 모바일 앱 경험 자체 미충족.
- **조치**: `public/manifest.json` 생성 + 192/512 아이콘 + `apple-touch-icon`. iOS Safari 메타 추가.

#### F-5. **자녀 계정 자체가 없음 → 서비스 가치 미달성**
- **현상**: 자녀 일정 완료 처리는 결국 **부모가** 하게 됨. 자녀 본인이 글리움에 로그인할 수단 없음.
- **영향**: docs/01-project-overview.md의 *"자녀가 완료 처리하면 부모가 실시간 확인"* 가치 미충족 → 단순 부모용 일정관리 앱으로 격하.
- **조치 옵션**:
  - (A) 자녀용 4자리 PIN 로그인 + 가족 그룹 코드 결합
  - (B) 자녀 Google 계정 초대 (만 14세 이상)
  - (C) 자녀 디바이스에 부모 계정 위임 모드 (제한된 권한 토큰)

### 1.2 🔴 P0 — 데이터 무결성

#### F-6. **`updateSchedule` 함수 — 7개 필드 매핑 누락**
- **현상** (`src/lib/db.ts:478~488`):
  ```ts
  if (updates.title !== undefined)   dbUpdates.title = ...
  if (updates.startTime !== undefined) ...
  // 누락: referenceUrl, expenseCategory, paymentMethod,
  //       repeatEndDate, locationLat/Lng, allDay, participantIds
  ```
- **영향**: 사용자가 정기지출의 카테고리·결제수단·금액(✓는 매핑됨)을 수정하려 해도 **카테고리/결제수단은 DB에 안 들어감**. 향후 일정 수정 페이지가 생기면 즉시 버그.
- **조치**: `dbUpdates` 매핑을 모든 필드에 대해 완성. participants는 `schedule_participants` DELETE/INSERT로 별도 처리.

#### F-7. **트랜잭션 부재 — 좀비 Google Calendar 이벤트**
- **현상**: `createSchedule`은 (1) Google Calendar 이벤트 생성 → (2) Supabase INSERT. 1번 성공 후 2번 실패하면 **Google에만 이벤트가 남고 글리움엔 없음** → 관리 불가.
- **조치**: Supabase RPC로 단일 트랜잭션 처리 + Google 이벤트는 INSERT 성공 후 백그라운드 큐로 비동기 동기화. 실패 시 retry 큐.

#### F-8. **프로필 자동 생성 로직 3중 중복**
- **현상**:
  1. SQL 트리거 `handle_new_user()` (`supabase/schema.sql:91~110`)
  2. `auth/callback/route.ts:23~32` — 안전망 INSERT
  3. `lib/db.ts:267~298` `ensureUserSetup()` — 클라이언트 측 INSERT
- **영향**: 한쪽 변경 시 다른 두 곳과 디폴트 값 (`avatar='👤'`, `role='parent'`) 동기화 안 되면 사용자별로 데이터 불일치 가능.
- **조치**: SQL 트리거 단일화 → 클라이언트는 **읽기만**, 없으면 에러 → "관리자 문의" UI.

#### F-9. **Google `provider_token` 만료 처리 없음**
- **현상**: OAuth `provider_token`은 1시간 만료. `useAuth.getGoogleToken()`은 그냥 `session?.provider_token`을 리턴. 만료 후 캘린더 연동은 무음 실패만 콘솔에 찍힘.
- **영향**: 1시간 이상 사용한 사용자가 일정을 만들면 Google 동기화 누락이 일상이 됨.
- **조치**: `provider_refresh_token`을 서버 측에 안전하게 저장 (Supabase secret 또는 Vault) + Edge Function에서 갱신 → 토큰 만료 시 재요청.

#### F-10. **Google Calendar — 구글 → 글리움 단방향 미구현**
- **현상**: `googleCalendar.ts`에 `fetchGoogleEvents`는 있으나 **호출하는 코드 없음**. 사용자가 Google에서 만든 일정은 글리움에 안 들어옴.
- **조치**: `/settings/calendar`의 "지금 동기화" 버튼이 실제로 `fetchGoogleEvents` → 차이 분석 → INSERT 하도록.

### 1.3 🟡 P1 — UX 흐름 단절

#### F-11. **일정 수정 페이지가 없음**
- **현상**: `src/app/schedules/[id]/page.tsx:121` 의 "수정" 버튼은 `<button>` 만 있고 `onClick` 없음. DB 함수 `updateSchedule`은 구현됐는데 UI 미연결.
- **조치**: `/schedules/[id]/edit/page.tsx` 신규 — `/schedules/new`의 폼을 재사용 가능하게 추출 (`<ScheduleForm mode="create" | "edit" />`).

#### F-12. **마이페이지 토글 / 버튼 다수 미동작**
- `mypage/page.tsx:135` 프로필 "수정" 버튼 — `onClick` 없음
- `mypage/page.tsx:147~152` 알림 토글 5종 — `toggled={true}` 하드코딩, 클릭 효과 0
- `mypage/page.tsx:152` "방해금지 시간 — 오후 10시~오전 8시" 하드코딩
- `mypage/page.tsx:166,167` "개인정보 처리방침", "이용약관" — `href`/`onClick` 없음 → **마켓 게시 시 필수**
- `mypage/page.tsx:184` "회원탈퇴" — `<p>` 태그라 클릭 불가
- **조치**:
  - `profiles` 테이블에 `notification_settings jsonb` 컬럼 추가 → 토글 상태 영속화
  - 정책 페이지 `/legal/privacy`, `/legal/terms` 신규
  - 회원탈퇴 — 가족 그룹 위임/삭제 절차 UI 포함

#### F-13. **CalendarView 주간/일간 뷰 작동 안 함**
- **현상**: `src/app/home/page.tsx:17,55` `view` 상태와 토글 UI가 있지만 `<CalendarView>` 컴포넌트는 항상 월간 그리드만 그림.
- **조치**: `CalendarView`에 `view` prop 추가 → 주간(7일 상세 시간축), 일간(24시간 타임라인) 렌더링 분기.

#### F-14. **사진/파일 첨부 — 가짜**
- **현상** (`schedules/new/page.tsx:394`): 버튼 클릭 시 `setAttachments(prev => [...prev, { id, name: '사진_X.jpg', source: 'local' }])`. **실제 업로드/저장 없음.** DB 스키마에도 `schedule_attachments` 테이블 없음.
- **조치**:
  - `schedule_attachments` 테이블 추가
  - Supabase Storage 버킷 `schedule-files` (private) 생성
  - Google Drive 첨부는 Picker API + Drive URL 저장

#### F-15. **장소 입력 — 지도 미연동**
- **현상**: `schedules/new`, `schedules/[id]`에 `🗺️` placeholder만 표시. lat/lng 컬럼은 있는데 좌표 저장 없음.
- **조치**: 카카오/네이버 로컬 검색 API → 주소 자동완성 + 좌표 저장 → 상세 페이지에 정적 지도 이미지(또는 카카오 맵 SDK).

#### F-16. **검색 — title 만, memo·location 안 됨**
- `src/app/schedules/page.tsx:34` `s.title.includes(search)` 만.
- **조치**: 멀티필드 검색 (`title || memo || location.address`) + 한글 자모 분리 검색 옵션.

#### F-17. **OAuth 에러 메시지 사용자에게 노출 안 됨**
- `auth/callback/route.ts:64` `?error=auth_callback_failed` 쿼리 파라미터를 보내지만, `login/page.tsx`에서 이를 읽어 표시하는 코드 없음.
- **조치**: `useSearchParams().get('error')` 분기 → 토스트/배너.

#### F-18. **알림 재로드 트리거 없음 / 새로고침만 가능**
- 일정 생성 시 알림 카운트 안 늘고, 다른 멤버가 일정 만들면 실시간 반영 안 됨 (Supabase Realtime 미사용).
- **조치**: `supabase.channel('notifications').on('postgres_changes', ...)` 구독.

#### F-19. **자녀 일정 — 참여자 미선택 시 부모만 등록됨**
- `schedules/new/page.tsx:76` `participantIds = participants.length > 0 ? participants : (user ? [user.id] : []);`
- 부모가 자녀 일정을 만들 때 참여자(자녀)를 누락하면 자녀 일정인데 자녀가 참여자 아님.
- **조치**: type='child' 일 때 참여자 1명 이상 자녀 필수 검증.

#### F-20. **정기지출 — 매월 결제일 표현이 모호**
- 현재는 `start_time` (예: 2026-04-25 09:00) 으로 저장 → 매월 25일임을 추정해야 함. 결제일 변경 시 모든 row 수정 필요.
- **조치**: `expense_day_of_month int` 컬럼 추가 + UI에서 "매월 N일" 명시적 선택.

### 1.4 🟢 P2 — 정책 / 보안 / 운영

#### F-21. **초대 코드 무차별 대입 방지 없음**
- 4자리 영숫자(`Math.random().toString(36).substring(2, 6)`) → 36⁴ ≈ 168만. 가족 1만 그룹 시 충돌·추측 가능.
- **조치**: 8자리 + rate limit (`upstash/ratelimit` Edge) + 7일 만료.

#### F-22. **회원탈퇴 / GDPR / 개인정보 30일 보관 정책 미정의**
- 마켓/스토어 게시 필수 항목.

#### F-23. **`sampleData.ts` 잔존**
- `src/lib/sampleData.ts` 195라인이 import 되지 않지만 코드베이스에 남아 있음. 신규 AI 협업 시 혼동 + 빌드 사이즈 +.
- **조치**: 삭제하거나 `__tests__/fixtures/`로 이동.

#### F-24. **README.md — Next 기본 보일러플레이트 그대로**
- `docs/README.md`는 잘 작성됐으나 루트 `README.md`는 0% 커스터마이즈.

#### F-25. **로딩/에러/404 페이지 부재**
- Next 16의 `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx` 미정의 → 사용자가 맞이하는 fallback이 브라우저 기본.

---

## 2. 디자인 / 브랜드 일관성

> 기준: `DESIGN.md` (SSOT) + `src/styles/tokens.css` + `gleaum_design_system.html`

### 2.1 🔴 P0 — 컬러 일관성 위반

#### D-1. **자녀 컬러 — `#2EE895` (Brand Green) 가 아닌 `#10B981` / `#059669` 다수**
- DESIGN.md 2.3: 자녀 = `#2EE895`
- 실제 사용 (Brand 위반):
  - `schedules/[id]/page.tsx:22` `gradient: linear-gradient(135deg, #34D399 0%, #059669 100%)`
  - `schedules/[id]/page.tsx:169` `step.key === 'completed' ? '#10B981'`
  - `schedules/[id]/page.tsx:301`, `:351` 완료 버튼 그라디언트 `#34D399 → #059669`
  - `schedules/children/page.tsx:227,253,282,329` 동일 패턴
  - `schedules/new/page.tsx:25` `activeColor: '#059669'`
  - `family/page.tsx:158`, `notifications/page.tsx:14`, `mypage/page.tsx:16` — 다양
- **조치**: 단일 토큰 `var(--brand-green)` (`#2EE895`)으로 일괄 치환. 그라디언트는 `linear-gradient(135deg, #2EE895 0%, #0CC9B5 100%)` 등 SSOT 그라디언트 사용.

#### D-2. **개인일정 컬러 — `#0CC9B5` 가 아닌 `#0891B2` / `#22D3EE` Cyan 사용**
- DESIGN.md 2.3: 개인 = `#0CC9B5` (Brand Teal)
- 위반: `schedules/[id]/page.tsx:21` `#22D3EE → #0891B2`, `schedules/new/page.tsx:24,403` `#0891B2`, `notifications/page.tsx:15` `#0891B2`
- **조치**: `var(--brand-teal)` 으로 통일.

#### D-3. **3단계 그라디언트가 2단계로 축소된 곳 다수**
- DESIGN.md 2.2: `linear-gradient(135deg, #2EE895 0%, #0CC9B5 50%, #0084CC 100%)`
- 위반(2단계 사용):
  - `schedules/[id]/page.tsx:20` shared `#0CC9B5 → #0084CC`
  - `schedules/new/page.tsx:134, 451` 저장 버튼 `#0CC9B5 → #0084CC`
  - `schedules/children/page.tsx:63` 히어로 `#0CC9B5 → #0084CC`
  - `schedules/[id]/page.tsx:301,351` 완료 `#34D399 → #059669`
- **조치**: Hero/FAB 등 모든 그라디언트는 `var(--brand-gradient)` 사용.

#### D-4. **상태 / 뱃지 컬러 — 토큰을 무시한 하드코딩**
- 위반 다수: `pending: rgba(156,163,175,0.12)` (`schedules/children:191`) ↔ 토큰 `--color-status-pending: #AEAEA8`
- `mypage` `member.role === 'parent'` 배지 색이 `rgba(0,132,204,0.10)`인데 자녀는 `rgba(16,185,129,0.10)` (자녀 전용 컬러를 토큰 없이 직접) 등.
- **조치**: 모든 뱃지는 `<StatusBadge>` `<TypeBadge>` 컴포넌트 사용 강제 (lint 룰 추가 가능).

#### D-5. **폐기된 Purple `#8B5CF6` 잔존 — `getCategoryColor`**
- `src/lib/utils.ts:85` `insurance: '#8B5CF6'` — Purple 계열. AGENTS.md "Purple은 폐기" 규칙 위반.
- **조치**: 보험 카테고리 컬러를 `#0084CC` 또는 별도 토큰(`--cat-insurance: #6366F1` 등) 도입.

#### D-6. **`docs/03-design-system.md` 자체가 폐기 정보 그대로**
- Purple `#5A32FA` 토큰을 SSOT처럼 명시. AGENTS.md/DESIGN.md와 정면 충돌.
- **조치**: 본 문서를 *"Deprecated — DESIGN.md 참조"* 로 수정하거나 삭제.

### 2.2 🟡 P1 — 컴포넌트 일관성

#### D-7. **카드 radius — 24px 표준이 흔들림**
- DESIGN.md 4.2: `radius-card: 24px`
- 혼재 사용: `rounded-[20px]` (notifications, family 멤버, ScheduleCard 일부 사용처), `rounded-[28px]` (히어로 카드 다수), `rounded-[16px]` (입력 필드 — 이건 `radius-input` 16px로 OK).
- **조치**:
  - 표준 카드 = `rounded-[24px]`
  - 히어로 카드(브랜드 그라디언트) = `rounded-[28px]` 토큰화 (`--radius-hero: 28px`) 새로 추가하든가, 24px로 통일.

#### D-8. **`<Button>` `<Card>` 컴포넌트 거의 사용 안 됨**
- `src/components/ui/Button.tsx`, `Card.tsx` 정의되어 있으나 실제 페이지는 `<button style={{ background: '...' }}>` 직접 작성.
- **결과**: 디자인 시스템 변경 시 모든 페이지 수정 필요. 컴포넌트 라이브러리가 무용지물.
- **조치**:
  - `Button` variant 추가 (`primary | secondary | tertiary | ghost | gradient | danger`) + size + icon prop
  - 모든 페이지의 `<button style>` → `<Button>` 마이그레이션
  - `<EmptyState>`, `<LoadingSpinner>`, `<HeroCard>`, `<SettingRow>` 등 추가 추출

#### D-9. **이모지를 아이콘으로 직접 사용**
- DESIGN.md 8: Lucide outline 2.5px 명시
- 위반: `schedules/new` 칩 `👨‍👩‍👧‍👦 👤 🧒 💰` (line 23~26), `schedules/[id]:136` 히어로 이모지, `mypage` 알림설정 행 SVG는 OK이나 `🔁 📍 📝` 등 메모 헤더에 이모지 혼용. 정기지출 카테고리 `📚 🏠 💡 🛡️ 📱 💳` 도 동일.
- **결과**: OS·플랫폼별 렌더링 불일치 (Apple vs Google emoji). 브랜드 톤 흐려짐.
- **조치**: Lucide 또는 자체 SVG 아이콘 세트로 통일. `EXPENSE_CATEGORY_ICONS`도 SVG 컴포넌트로 변경.

#### D-10. **Input focus 컬러 — Teal 이 아닌 Blue**
- DESIGN.md 5.5: focus = `2px solid #0CC9B5` (Teal)
- 실제: `schedules/new/page.tsx`의 모든 input은 `borderColor: '#0084CC'` (Blue) — 12회 반복
- **조치**: focus 시 Teal, 채워진 상태(완료 표시) 시 Blue 등 의도가 있다면 명시. 현재는 단순 위반.

#### D-11. **타이포그래피 — `text-[숫자]` Tailwind arbitrary value 남용**
- DESIGN.md 3.2: Hero 26px, Card 18~20px, Body 16px 등 명확 spec
- 실제: `text-[14px]`, `text-[15px]`, `text-[17px]`, `text-[20px]`, `text-[24px]`, `text-[28px]`, `text-[36px]`, `text-[40px]` 등 거의 토큰화 안 됨
- **조치**: `tokens.css`에 정의된 `--text-*` 변수 + Tailwind 유틸 클래스 (`text-display`, `text-tagline`, `text-body-lg`)로 치환.

#### D-12. **AppHeader / Header — sticky/blur 구현 일관성**
- `home/page.tsx`는 자체 헤더(`sticky top-0 z-40 ... pt-12 pb-4`)를 직접 작성 → AppHeader 미사용
- `schedules/new/page.tsx:106`도 자체 헤더 직접 작성
- `mypage`, `family`, `budget`, `notifications`, `settings/calendar`는 `<AppHeader>` 사용
- **조치**: `<AppHeader variant="hero">` 추가 (홈처럼 로고+아바타) → 모든 페이지 통일.

#### D-13. **레퍼런스 파일 4개 공존 → SSOT 흐려짐**
- 루트에 공존: `gleaum_design_system.html`, `design-system-ui.html`, `DESIGN_PREVIEW.html`, `DESIGN.md`, `DESIGN_HANDOFF_TO_CLAUDE.md` (deprecated)
- **조치**:
  1. `DESIGN.md` (텍스트 SSOT) + `design-system-ui.html` (시각 레퍼런스) 만 유지
  2. `gleaum_design_system.html`, `DESIGN_PREVIEW.html`, `DESIGN_HANDOFF_TO_CLAUDE.md` → `docs/archive/`로 이동
  3. 루트 README.md에 명확한 안내 1줄

### 2.3 🟢 P2 — 미세 일관성

#### D-14. **`button:active scale(0.97)` ↔ DESIGN.md 0.96**
- `src/app/globals.css:107` 전역 `scale(0.97)`. DESIGN.md 5.1는 `scale(0.96)`.
- 영향 미미하나 SSOT 위반.

#### D-15. **그림자 `box-shadow: 0 -10px 40px rgba(0,0,0,0.10)`**
- DESIGN.md 11: *"검은색 그림자 절대 사용 금지"* 그러나 `--shadow-modal`은 검은색.
- **조치**: 모달 그림자도 `rgba(26,27,46,0.15)` 등 Navy 기반으로.

---

## 3. 코드 품질 / 아키텍처

### 3.1 🔴 P0 — 데이터 무결성 / 단일 진입점

#### C-1. **`useSchedules` 훅 우회 → 캐시 동기화 깨짐**
- `src/app/schedules/[id]/page.tsx:6` 에서 `getScheduleById`, `updateScheduleStatus`, `deleteSchedule` 를 **직접** 호출.
- 다른 페이지는 `useSchedules` 훅을 통해 캐시(state)에 반영. `[id]` 페이지가 직접 호출하면 다른 페이지의 `schedules` 배열은 stale.
- **예**: `/schedules` → 카드 클릭 → 상세에서 상태 변경 → 뒤로가기 → 일정 목록은 여전히 옛날 상태(refresh 전까지).
- **조치**:
  - 옵션 A: `[id]` 페이지에 useSchedules + 메모이즈된 selector
  - 옵션 B: SWR/React Query 도입 → mutate 시 자동 무효화
  - **권장 B**: `@tanstack/react-query` 도입 → 캐시·실패 재시도·낙관적 업데이트 일괄 해결

#### C-2. **`rowToUser` 중복 정의**
- `src/lib/db.ts:112` `rowToUser` 정의
- `src/hooks/useFamily.ts:43` 동일한 함수 재정의
- **조치**: useFamily.ts 의 로컬 정의 삭제, db.ts의 export 사용.

#### C-3. **`ensureUserSetup` 매 토큰 갱신마다 실행**
- `src/hooks/useCurrentUser.ts:37` `auth.onAuthStateChange(() => load())`
- Supabase는 `INITIAL_SESSION` / `SIGNED_IN` / `TOKEN_REFRESHED` / `USER_UPDATED` 등 모든 이벤트에 콜백 호출 → token refresh마다 (1시간 주기) 프로필+가족 그룹 INSERT 시도 → 실제로는 if 분기로 막혀 있지만 불필요한 RPC.
- **조치**: 이벤트 종류별 분기 — `SIGNED_IN`(최초)에만 setup 호출, 그 외엔 `setProfile` 만 갱신.

### 3.2 🟡 P1 — 안정성 / 패턴

#### C-4. **에러 처리 일관성 0**
- `db.ts` 전반: `console.error + return null/false` (사일런트 실패)
- 페이지 전반: `alert(...)` 직접 호출 (8회) — 모바일 UX에 부적합
- **조치**: 토스트 시스템 1종 (`sonner` 또는 자체) 도입 → `toast.error('일정 생성 실패. 다시 시도해주세요.')`. db.ts는 throw 또는 Result 타입 반환.

#### C-5. **로딩 / 빈 상태 컴포넌트 패턴 8회 중복**
- `<div className="flex justify-center py-... animate-spin ...">` — 7~8 페이지 동일 코드
- `<div className="flex flex-col items-center"><span className="text-4xl">📭</span>...` — 7곳 반복
- **조치**:
  - `<LoadingSpinner size="sm|md|lg" />`
  - `<EmptyState icon={...} title="..." description="..." action={...} />`

#### C-6. **타임존 — Date 파싱이 로컬 타임존 의존**
- `schedules/new/page.tsx:74` `new Date(\`${date}T${startTime || '00:00'}:00\`)` → 사용자 OS 타임존 기준으로 파싱. Supabase는 UTC 저장 → 다른 타임존 사용자가 보면 시간 어긋남.
- **조치**: 가족 그룹별 timezone 설정 (`family_groups.timezone` 컬럼) + `date-fns-tz` 또는 Temporal API.

#### C-7. **`updateSchedule` 의 dbUpdates 캐스팅 위험**
- `db.ts:494` `rowToSchedule({ ...existing, ...dbUpdates } as ScheduleRow)` — partial update를 ScheduleRow로 강제 캐스팅. existing이 stale이거나 dbUpdates 형식이 어긋나면 런타임 에러.
- **조치**: 변환 함수 분리 — `mergeRowWithUpdates(existing, partialUpdates)`.

#### C-8. **Server Component / SSR 0% 활용**
- 모든 페이지가 `'use client'`. 초기 데이터 fetch가 클라이언트 → 사용자가 항상 spinner 봄.
- 일정 목록·홈 대시보드는 SSR 가능 → SEO·성능·UX 모두 향상.
- **조치**: `app/(authed)/home/page.tsx` 를 server component로, 데이터는 `lib/supabase/server.ts` 의 createClient 사용 → `<HomeClient initialSchedules={...} />` 로 hydration.

#### C-9. **Tailwind v4 — `@theme` 토큰 활용도 낮음**
- `globals.css:5~14` 에 정의된 토큰 거의 안 씀 → `text-brand`, `shadow-card` 정도만. 모든 컬러를 `style={{ background: '#...' }}` 인라인.
- **조치**: 페이지에 인라인 style 금지 룰 (eslint plugin 또는 codemod). `bg-brand`, `text-ink`, `shadow-card` 등 유틸 클래스로 100% 치환.

#### C-10. **`middleware.ts` Next 16 — `proxy`로 변경 권장**
- AGENTS.md `node_modules/next/dist/docs/` 가이드 + docs/08-features-pending.md에 명시. 현재 deprecated 경고 발생.
- **조치**: `src/proxy.ts` 로 파일명 변경 + matcher config.

#### C-11. **`createSchedule` 시 `getUser` + `getSession` 2회 호출**
- 둘 다 같은 세션을 보지만 Supabase JS는 양쪽에서 토큰 검증 호출 가능. 1회로 합쳐 latency 줄이기.

### 3.3 🟢 P2 — 확장성 / 운영

#### C-12. **테스트 코드 0%**
- 단위 테스트(vitest), E2E(Playwright) 모두 부재.
- **권장 최소 라인업**: vitest로 `lib/utils.ts`, `lib/db.ts` 변환 함수 / Playwright로 OAuth → 일정 생성 1 happy path.

#### C-13. **에러 바운더리 / 404 / 로딩 페이지 부재**
- `app/error.tsx`, `app/not-found.tsx`, 페이지별 `loading.tsx` 정의되지 않음.

#### C-14. **`/`(루트) → `/login` 무조건 리다이렉트**
- 로그인 사용자도 `/` 접근 시 `/login` → middleware가 다시 `/home`. 한 번 더 라운드트립. **`/`에서 직접 `/home` 또는 `/login` 분기.**

#### C-15. **`provider_token` 로컬스토리지 저장 — 보안 검토**
- Supabase JS는 기본적으로 localStorage 저장. 캘린더/드라이브 풀 권한 토큰이 XSS에 노출 가능.
- **조치**: HttpOnly cookie 기반 SSR 세션 활용 + Edge Function이 토큰 사용 → 클라이언트는 토큰 미보유.

#### C-16. **vercel.json — preview 환경 검토 안 됨**
- ICN1 region 명시는 좋음. 확인 필요.

#### C-17. **Service Worker (PWA 오프라인) 없음**
- F-4 PWA 매니페스트와 함께 처리.

---

## 4. 권장 우선순위 로드맵

### Sprint 1 (1주, 서비스 무결성)
- F-4 (manifest.json), F-6 (updateSchedule 매핑), F-8 (프로필 자동생성 통합), F-9 (provider_token 갱신), F-11 (일정 수정 페이지)
- D-1 ~ D-5 컬러 위반 일괄 치환 (자동 codemod)
- C-1 (React Query 도입) → 단일 진입점 회복

### Sprint 2 (2주, 핵심 가치 회복)
- F-1 (알림 파이프라인), F-2 (자동 상태 전이), F-3 (재알림 실작동)
- F-5 (자녀 계정 — PIN 로그인 형태부터)
- D-7 (radius 통일), D-8 (Button/Card 마이그레이션), D-9 (이모지 → SVG)

### Sprint 3 (1주, UX 마감)
- F-12 (마이페이지 토글 영속), F-13 (CalendarView 주/일 뷰), F-14 (사진 첨부 실구현)
- F-15 (지도 연동), F-17 (OAuth 에러 표시)
- C-4 (토스트), C-5 (LoadingSpinner/EmptyState), C-8 (SSR 도입)

### Sprint 4 (1주, 운영 준비)
- F-21 (초대코드 보안), F-22 (개인정보/탈퇴), F-25 (404/error 페이지)
- C-12 (최소 테스트), C-13~C-17

---

## 5. 즉시 적용 가능한 자동화 후보

1. **컬러 codemod** — `#10B981`, `#059669`, `#34D399` → `var(--brand-green)` 일괄 치환 (28회 발견)
2. **`#0891B2`, `#22D3EE` → `var(--brand-teal)`** — 8회
3. **`alert()` → `toast.error()`** — 8회
4. **`text-[14px]` 등 → `text-caption` 등 토큰 클래스** — 60+ 회
5. **`<button style={...}>` → `<Button variant=...>`** — 50+ 회 (점진적 마이그레이션)

---

## 6. 진단 메모

- **강점**: 디자인 토큰 정의는 매우 탄탄, RLS 정책 견고, db.ts 단일 진입점 의도 좋음, Glassmorphism 톤은 일관되게 모던함.
- **개선 핵심**: *"브랜드 시스템과 코드 사이의 거리"* — DESIGN.md가 정의해둔 표준이 페이지 레이어에서 인라인 스타일로 다시 풀어쓰여, 단 한 번의 컬러 변경에 30~50파일 수정이 필요함. **컴포넌트화·토큰 사용 강제 + lint 룰**이 모든 P1 디자인 이슈를 한 번에 해결할 수 있는 레버.
- **런칭 전 가장 위험한 것**: 알림이 작동하지 않는다는 것 (F-1~F-3) — 이것 없이는 글리움이 그냥 캘린더 앱이 됨.
