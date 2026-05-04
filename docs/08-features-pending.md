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

### 🔴 자동화 정책 기반 상태 전이
- 제품 방향이 개인 중심 + Space 확장형 서비스로 보정됨에 따라 `child` 전용 자동화 구현은 금지
- `docs/12-product-model.md` 기준으로 `automation_policy` 기반 상태 전이 구현 필요
- `completion_required`: 개인 루틴, 가족 케어, 자녀 일정, 심부름 등 완료 확인 일정 처리
- `payment_due`: 개인/연인/가족 정기지출의 결제 예정/미납 알림 처리
- 재알림 수동 발송 API는 구현됐으나, 자동 미완료/미납 판정과 대상자 규칙은 다음 단계

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

### 🔴 개인 중심 + Space 확장형 모델 마이그레이션
- [ ] 운영 Supabase DB에 `supabase/onboarding-personalization.sql` 적용 확인
- [ ] `family_groups.type` 추가로 기존 가족 그룹을 Space로 확장
- [ ] `schedules.category`, `schedules.visibility`, `schedules.automation_policy` 추가
- [ ] 기존 `schedule.type` 값을 신규 축으로 매핑
- [ ] 중기적으로 `spaces`, `space_members`, `schedule_assignees`, `schedule_observers`, `notification_rules` 설계
- [ ] 첫 로그인 시 `"X씨 가족"` 대신 개인 Space 또는 선택형 온보딩으로 전환 검토

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

### 🟢 일정 수정 기능
- `/schedules/[id]/edit` 페이지 미구현
- 현재는 삭제만 가능

### 🟢 통계 및 분석 페이지
- 월간 자녀 일정 완료율
- 카테고리별 지출 트렌드 차트

---

## 기술 부채

| 항목 | 내용 | 파일 |
|------|------|------|
| `middleware.ts` 경고 | "middleware" 파일명 deprecated → "proxy"로 변경 권장 | `src/middleware.ts` |
| 일정 수정 페이지 없음 | `/schedules/[id]`의 "수정" 버튼 미연결 | `src/app/schedules/[id]/page.tsx` |
| 자동화 정책 기반 상태 전이 미구현 | `child` 하드코딩 대신 `automation_policy` 기반 처리 필요 | cron/API |
| 이미지 첨부 미구현 | UI는 있으나 실제 업로드 로직 없음 | `src/app/schedules/new/page.tsx` |
