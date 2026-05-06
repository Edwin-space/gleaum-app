# 08. 미완료 / 예정 기능

## 우선순위 기준

| 기호 | 의미 |
|------|------|
| 🔴 | 필수 (서비스 핵심 기능) |
| 🟡 | 중요 (사용성 크게 향상) |
| 🟢 | 선택 (있으면 좋음) |

---

## Day 5 — Google 연동 심화

### ✅ 초대 링크 페이지 (`/invite/[code]`) — 완료
`src/app/invite/[code]/page.tsx` 구현 완료.
비로그인 → `/login?next=` 파라미터로 OAuth 후 자동 복귀 → `joinFamilyByCode()` 자동 처리.

### ✅ Google Calendar 양방향 동기화 — 코드 완료 (수동 설정 대기)

**코드 작업 완료** (`src/lib/googleCalendar.ts` 구현됨):
- `createGoogleEvent` / `updateGoogleEvent` / `deleteGoogleEvent` 구현 완료
- `src/lib/db.ts`: 일정 CUD 시점에 Google Calendar와 동기화 로직 연결
- `src/types/index.ts`: `googleEventId` 필드 추가 완료

**🔧 사용자가 직접 수행해야 하는 작업 (미완료)**:
1. Google Cloud Console → Calendar API 활성화
2. Supabase SQL Editor → `schedules.google_event_id` 컬럼 존재 확인. 없으면 `ALTER TABLE schedules ADD COLUMN google_event_id text;` 실행

### 🟡 Google Drive 사진 첨부
**사전 조건**: Google Cloud Console에서 Drive API 활성화 필요

**구현 계획**:
- Google Picker API 사용 (파일 선택 UI)
- 선택한 파일 → Supabase Storage 또는 Drive URL 저장
- `schedule_attachments` 테이블 추가 필요

---

## Day 6 — 푸시 알림

### ✅ Firebase Cloud Messaging (FCM) 설정 — 완료
- Firebase 프로젝트 생성 및 FCM v1 발송 구조 구현 완료
- `public/firebase-messaging-sw.js` 서비스워커 생성 완료
- `src/lib/firebase.ts`, `src/hooks/useFCM.ts`, `src/components/FCMProvider.tsx` 구현 완료
- 로그인 사용자의 FCM 토큰을 `profiles.fcm_token`에 저장

### ✅ 일정 리마인더 알림 시스템 — 완료
- `src/app/api/cron/reminders/route.ts` 구현 완료
- Supabase `pg_cron` + `pg_net`으로 5분마다 `/api/cron/reminders` 호출하도록 등록 완료
- Vercel Hobby 플랜 제한 때문에 `vercel.json`의 Vercel Cron 설정은 제거됨
- 설정된 `reminder` 분 전에 FCM 발송 + `notifications` 테이블 기록
- Supabase에서 `pg_net` 호출 결과 확인 및 실행 완료

### ✅ 자동화 정책 기반 상태 전이 — 완료
- `src/app/api/cron/automations/route.ts` 구현 및 Supabase pg_cron 등록 완료
- `time_window`, `completion_required`, `payment_due` 정책 처리 + FCM 알림
- `src/lib/db.ts`에 inference 헬퍼 추가, `createSchedule`에서 type→policy 자동 매핑

---

## Day 7 — 나머지 화면 디자인 리뉴얼

### ✅ 전 페이지 프리미엄 UI 리뉴얼 — 완료

모든 페이지에 Glassmorphism + Blue/Teal/Green 브랜드 컬러 통일 적용됨:

| 페이지 | 완료 내용 |
|--------|----------|
| `/schedules/new` | 이모지 유형 칩, 블루 포커스 테두리, 브랜드 그라디언트 저장 버튼 |
| `/schedules/[id]` | 유형별 그라디언트 히어로 헤더, 24px 둥근 카드, 블루 버튼 |
| `/schedules/children` | SVG 원형 완료율 프로그레스, 블루 탭/스텝퍼 |
| `/family` | 브랜드 그라디언트 히어로 카드, glass-card |
| `/budget` | 브랜드 그라디언트 요약 카드, 카테고리 아이콘 칩+진행률 바 |
| `/mypage` | 브랜드 그라디언트 프로필 히어로, SVG 아이콘 설정 행 |
| `/notifications` | SVG 타입별 원형 아이콘, 미읽음 컬러 테두리 |
| `/login` | 메쉬 그라디언트 배경, glass-card, 다크 버튼 + Google G 로고 |

---

## Day 8 — 품질 및 완성도

### 🔴 개인 중심 + Space 확장형 모델 마이그레이션 (일부 완료)
- [x] `schedules.category`, `schedules.visibility`, `schedules.automation_policy` DB 컬럼 추가 완료
- [x] 기존 `schedule.type` → 신규 축으로 자동 매핑 (`inferCategory`, `inferVisibility`, `inferAutomationPolicy`)
- [x] 첫 로그인 시 `"나의 공간"` 자동 생성으로 전환 완료
- [ ] `family_groups.type` 추가로 기존 가족 그룹을 Space로 확장
- [ ] 중기적으로 `spaces`, `space_members`, `schedule_assignees`, `schedule_observers`, `notification_rules` 설계

### ✅ 일정 상태 변경 UX 완성 (2026-05-06 완료)
- `shared`, `personal` 타입 일정에도 상태 변경 버튼 추가
- `pending` → 시작하기 → `in_progress` → 완료 확인 → `completed` / `missed`
- 대기 상태로 되돌리기 버튼 추가 (진행중 → 대기)
- 완료 확인 모달을 모든 타입 공통 적용

### ✅ 파일 첨부 실제 구현 (2026-05-06 완료)
- `src/app/schedules/new/page.tsx`: `<input type="file">` 연결, 이미지 미리보기 구현
- `src/lib/db.ts`: `uploadScheduleAttachment()` 함수 추가 (Supabase Storage `schedule-attachments` 버킷)
- 업로드 실패 시에도 일정 저장은 계속 진행 (첨부는 선택 사항)

> ⚠️ **Supabase에서 사전 설정 필요**: Storage 버킷 `schedule-attachments` 생성 + public 접근 정책 설정 필요

### ✅ PWA manifest 완성 (2026-05-06 완료)
- `shortcuts` 추가: 일정 추가, 오늘 일정, 가계부 바로가기
- `display_override`: `["standalone", "minimal-ui", "browser"]`
- `scope`, `dir`, `prefer_related_applications` 명시
- 아이콘 `purpose` 분리: `any` / `maskable` 각각 등록

### 🟡 PWA 완성
- [ ] `public/manifest.json` 아이콘 세트 추가
- [ ] 스플래시 스크린 설정
- [ ] 오프라인 대응 (Service Worker)

### 🟢 Google OAuth 앱 게시 (프로덕션)
- Google Cloud Console → OAuth 동의화면 → **앱 게시**
- 현재는 테스트 사용자만 로그인 가능
- 게시 후 누구나 로그인 가능

### 🟢 자녀 계정 연동
- 현재 자녀는 이메일 없이 프로필에만 존재
- 자녀가 직접 로그인할 수 있는 계정 연동 플로우 필요

### 🟢 통계 및 분석 페이지
- 월간 자녀 일정 완료율
- 카테고리별 지출 트렌드 차트

### 🟡 마이페이지 PC UI 최적화
- 마이페이지 설정 및 프로필 수정 영역 PC 대시보드 구조화

### 🔴 PWA 스플래시 스크린 완전 신규 구현
- `_document.tsx` 또는 인라인 `<script>` 방식으로 초기 흰 화면 완전 차단
- 스플래시 `#0F1A2E` → 로그인 화면 `#FAFAFD` 자연스러운 색상 전환

---

## 🔴 서브 페이지 PC/모바일 뷰 분리 계획

> 아키텍처: `page.tsx` (thin router, `useIsDesktop()` 분기) → `MobileX.tsx` / `DesktopX.tsx`
> 참고: `/login`과 `/home`은 이미 완료됨.

### Phase 1 — 핵심 CRUD 페이지 (최우선)

| 페이지 | PC 레이아웃 방향 |
|--------|-----------------|
| `/schedules` | 좌측 필터 패널 + 우측 3컬럼 카드 그리드, 상단 검색바 풀 와이드 |
| `/budget` | 좌측 월별 요약 + 우측 카테고리별 상세 2컬럼, 히어로 카드 와이드 |
| `/schedules/new` | 중앙 정렬 폼 카드 (max-width 640px), 좌우 여백 활용 |
| `/schedules/[id]` | 좌측 상세 정보 카드 + 우측 참여자/액션 패널 2컬럼 |

### Phase 2 — 보조 페이지

| 페이지 | PC 레이아웃 방향 |
|--------|-----------------|
| `/family` | 좌측 멤버 리스트 + 우측 초대/설정 패널 |
| `/mypage` | 좌측 프로필 카드 + 우측 설정 항목 리스트 |
| `/notifications` | 중앙 정렬 알림 리스트 (max-width 720px) |
| `/schedules/children` | 좌측 자녀 선택 + 우측 일정/진행률 대시보드 |

### Phase 3 — 기타 페이지

| 페이지 | PC 레이아웃 방향 |
|--------|-----------------|
| `/schedules/[id]/edit` | `/schedules/new`와 동일 패턴 (중앙 폼 카드) |
| `/onboarding` | 중앙 정렬 스텝 카드 + 좌우 일러스트/브랜딩 |
| `/invite/[code]` | 중앙 정렬 초대 카드 (max-width 480px) |
| `/settings/calendar` | 중앙 설정 패널 (max-width 640px) |

### 구현 시 주의사항
- PC 레이아웃은 **인라인 스타일** 권장 (Tailwind CSS 우선순위 충돌 방지)
- `landing-fullscreen` 클래스 → `globals.css`의 `:has()` 규칙으로 패딩 제거 (풀페이지 필요 시)
- 모바일 컴포넌트는 기존 코드 그대로 추출 (리디자인 필요 시 별도 진행)
- `glass-card`, `brand-gradient` 등 디자인 토큰 일관 사용

---

## 기술 부채

| 항목 | 내용 | 파일 |
|------|------|------|
| `middleware.ts` 경고 | "middleware" 파일명 deprecated → "proxy"로 변경 권장 | `src/middleware.ts` |
| ~~자동화 정책 기반 상태 전이 미구현~~ | ✅ 완료 (`automation_policy` 기반 처리) | `src/app/api/cron/automations/route.ts` |
| 이미지 첨부 미구현 | UI는 있으나 실제 업로드 로직 없음 | `src/app/schedules/new/page.tsx` |
| 디자인 토큰 위반 | 28+ 하드코딩 컬러, 50+ 인라인 버튼 스타일 → 토큰/클래스 통일 필요 | 전역 |
| 서브 페이지 뷰 미분리 | `/login`, `/home` 외 나머지 페이지 PC/모바일 분리 필요 | Phase 1/2/3 계획 참조 |
