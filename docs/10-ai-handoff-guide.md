# 10. AI 인수인계 가이드 (AI Handoff Guide)

> 이 문서는 어떤 AI(Claude, Gemini, GPT 등)라도 이 프로젝트를 이어받아 즉시 작업할 수 있도록 작성된 **최우선 참고 문서**입니다.

---

## 🚨 절대 규칙 (작업 전 반드시 읽기)

1. **백엔드/DB 구조 절대 변경 금지** — `supabase/schema.sql`, `src/lib/db.ts`, `src/types/index.ts`의 핵심 구조는 건드리지 말 것.
2. **단일 DB 진입점 유지** — 모든 Supabase 쿼리는 반드시 `src/lib/db.ts`에만 추가.
3. **디자인 시스템 준수** — 색상, 그림자, 반지름은 반드시 `DESIGN.md` + `src/styles/tokens.css`의 토큰(`var(--brand-blue)`, `var(--brand-gradient)` 등)을 사용. ⚠️ **Purple(`#5A32FA`)은 완전 폐기** → Brand Blue(`#0084CC`) / Teal(`#0CC9B5`) / Green(`#2EE895`) 사용.
4. **RLS 보안** — 새 테이블 생성 시 반드시 RLS 활성화 + `my_family_group_id()` 기반 정책 추가.
5. **TypeScript 엄격 모드** — 타입 오류 없이 `npm run build` 통과해야 함.
6. **배포 자동화** — `main` 브랜치에 push하면 Vercel이 자동 배포. 작업 후 반드시 commit + push.
7. **AI 간 작업 동기화 (문서 업데이트 필수)** — 서로 다른 AI가 협업하므로, 본인의 작업이 에러 없이 완료되면 **반드시 `docs/` 폴더 내 관련 문서(완료된 기능 등)를 업데이트**하여 다른 AI가 최신 상태를 알 수 있게 할 것.
8. **디자인 일관성 절대 유지** — 작업된 디자인 결과물(특히 `DESIGN_PREVIEW.html` 및 `tokens.css` 기준)의 시각적 형태와 UX를 모든 페이지와 컴포넌트에서 완벽하게 일관성을 유지할 것.
9. **제품 모델 방향 유지** — 글리움은 가족 전용 앱이 아니라 **개인 중심 + Space 확장형 토털 라이프 관리 서비스**입니다. 신규 기능은 개인 단독 사용을 기본값으로 두고, 필요할 때 Space / Category / Automation Policy 기준으로 확장 설계할 것.

---

## 현재 앱 상태 (2026-05-04 기준)

> **디자인 히스토리 요약**: Claude(세션1)가 Vibrant Purple(`#5A32FA`)로 구현 → Antigravity AI가 오리지널 브랜드 컬러(Blue/Teal/Green)로 복구 + Glassmorphism + 메쉬 그라디언트 + 프리미엄 폰트(`Outfit`+`Pretendard`) 추가 적용. **현재 코드는 Blue/Teal/Green 기반이며 보라색(`#5A32FA`)은 사용 금지.**
> **제품 방향 요약**: 초기 가족 관리 서비스에서 개인 중심 + Space 확장형 토털 서비스로 보정했습니다. 개인 구간이 기본이며, 친구/연인/가족 Space는 선택적 관계 확장 레이어입니다. `family_groups`는 단기적으로 유지하지만 신규 설계에서는 legacy shared Space로 해석합니다.

### ✅ 작동하는 기능

| 기능 | 경로/파일 | 상태 |
|------|----------|------|
| Google OAuth 로그인 | `/login` → `/auth/callback` | ✅ 완전 작동 |
| 첫 로그인 시 프로필 자동 생성 | `auth/callback/route.ts` | ✅ 완전 작동 |
| 가족 그룹 자동 생성 | `auth/callback/route.ts` | ✅ 완전 작동 |
| 초대 링크 페이지 | `/invite/[code]` | ✅ 완전 구현 |
| 홈 대시보드 | `/home` | ✅ 실 DB 연동 |
| 일정 목록/검색/필터 | `/schedules` | ✅ 실 DB 연동 |
| 일정 생성 | `/schedules/new` | ✅ DB 저장 |
| 일정 상세/상태변경/삭제 | `/schedules/[id]` | ✅ 실 DB 연동 |
| 자녀 일정 대시보드 | `/schedules/children` | ✅ 실 DB 연동 |
| 가족 관리 + 초대코드 | `/family` | ✅ 실 DB 연동 |
| 가계부 (정기지출) | `/budget` | ✅ 실 DB 연동 |
| 마이페이지 + 로그아웃 | `/mypage` | ✅ 실 DB 연동 |
| 알림 목록 | `/notifications` | ✅ 실 DB 연동 |
| FCM 푸시 알림 토큰 등록 | `useFCM`, `FCMProvider` | ✅ 구현 완료 |
| 일정 리마인더 자동 발송 | Supabase `pg_cron` + `pg_net` → `/api/cron/reminders` | ✅ 등록/실행 확인 완료 |
| 개인화 온보딩 | `/onboarding`, `completeOnboarding()` | ✅ 1차 구현 완료 |
| 홈 개인화 카드 | `/home` | ✅ 온보딩 preferences 기반 1차 반영 |
| Glassmorphism + Blue/Teal/Green 디자인 | **전 페이지 (DESIGN.md 기준)** | ✅ 프리미엄 리뉴얼 완료 |
| Vercel 프로덕션 배포 | gleaum-app.vercel.app | ✅ 자동 배포 중 |

### ❌ 미구현 기능 (우선순위 순)

| 기능 | 우선순위 | 비고 |
|------|---------|------|
| Google Calendar 양방향 동기화 | 🟡 중요 (Day 5) | Calendar API 활성화 필요 |
| Google Drive 사진 첨부 | 🟡 중요 (Day 5) | Drive API 활성화 필요 |
| 운영 DB 온보딩 SQL 적용 확인 | 🔴 필수 | `supabase/onboarding-personalization.sql` |
| 자동화 정책 기반 상태 전이 | 🔴 필수 (Day 6 후속) | `completion_required`, `payment_due` 등 정책 기반 처리 필요 |
| 일정 수정 페이지 `/schedules/[id]/edit` | 🟢 선택 | UI만 없음, DB 함수는 있음 |
| Google OAuth 앱 게시 (프로덕션) | 🟢 선택 | 테스트 사용자 외 로그인 불가 |

---

## 다음 작업 순서 (추천)

> [!IMPORTANT]
> **🚨 사용자 필수 수행 대기 작업 (Google Calendar)**
> 다음 작업을 요청받을 시, 반드시 사용자가 아래 수동 작업을 완료했는지 먼저 확인(학습)하세요. 이 수동 작업들이 완료되지 않았다면 다음 단계의 정상적인 진행이 불가능합니다.
> 1. **[구글 캘린더 연동용]**: Google Cloud Console에서 `Google Calendar API` 활성화
> 2. **[구글 캘린더 연동용]**: 운영 DB에 `schedules.google_event_id` 컬럼이 있는지 확인. 없으면 `ALTER TABLE schedules ADD COLUMN google_event_id text;` 실행
> 3. **[온보딩/개인화]**: 운영 DB에 `supabase/onboarding-personalization.sql` 실행 필요. 미적용 시 `/onboarding` 저장이 실패함.

> ✅ 1단계(초대 링크)와 2단계(전 페이지 디자인 리뉴얼)는 완료됨.
> ✅ 3단계(Google Calendar 연동) 코드 작업 완료됨. (수동 설정만 남음)
> ✅ 4단계(FCM 푸시 알림 + Supabase Cron 리마인더)는 완료됨. Supabase `pg_net` 실행 결과까지 확인 완료.
> ✅ 5단계 전 제품 모델 재정의 완료. 자동 상태 전이는 `child` 전용이 아니라 `automation_policy` 기반으로 구현해야 함.
> ✅ 개인화 온보딩 1차 구현 완료. 로그인 후 온보딩 미완료 사용자는 `/onboarding`으로 이동.

### 1단계 ✅: 초대 링크 페이지 — 완료
`src/app/invite/[code]/page.tsx` 구현 완료.
- 비로그인: `/login?next=/invite/[code]` → OAuth → 콜백 → 다시 초대 페이지 → 자동 합류
- `joinFamilyByCode()` 반환 타입: `{ success, alreadyMember?, familyName? }`

### 2단계 ✅: 전 페이지 디자인 리뉴얼 — 완료
7개 페이지 Glassmorphism(`.glass-card`) + 메쉬 그라디언트 배경(`.mesh-bg`) + Blue/Teal/Green 브랜드 컬러로 프리미엄 UI 완전 리뉴얼 완료.
- 폰트: `Outfit` (영문/숫자) + `Pretendard` (국문)
- 로그인 페이지: 메쉬 배경 + 다크(네이비) 버튼 + 화이트 Google G 로고
- 모든 카드: `.glass-card` 유리 질감 (흰색 반투명 + backdrop-blur)
- `DESIGN.md` — 디자인 시스템 마스터 명세서
- `design-system-ui.html` — 시각적 UI 컴포넌트 가이드
- `AGENTS.md` — AI 자동 참조 가이드

---

### 3단계 ✅: Google Calendar 연동 (완료)

**사전 작업 (수동)**:
1. Google Cloud Console → API 및 서비스 → **Google Calendar API** 활성화 (사용자 수행 대기)
2. Supabase SQL Editor → `schedules.google_event_id` 컬럼 존재 확인. 없으면 `ALTER TABLE schedules ADD COLUMN google_event_id text;`

**코드 작업 (완료)**:
- `src/lib/googleCalendar.ts`: `createGoogleEvent`, `updateGoogleEvent`, `deleteGoogleEvent` 통신 레이어 구현 완료
- `src/lib/db.ts`: 일정 CUD 시점에 구글 API와 동기화되는 로직 구현 완료
- `src/types/index.ts`: `Schedule` 및 `ScheduleRow` 타입에 `googleEventId` 확장 완료

---

### 4단계 ✅: FCM 푸시 알림 + Supabase Cron 리마인더 — 완료

- `public/firebase-messaging-sw.js` — 백그라운드 푸시 수신 서비스워커 구현
- `src/lib/firebase.ts` — 브라우저 FCM 토큰 발급 및 포그라운드 메시지 처리
- `src/hooks/useFCM.ts` + `src/components/FCMProvider.tsx` — 로그인 사용자 FCM 토큰 자동 저장
- `src/lib/fcm.ts` — Firebase 서비스 계정 기반 FCM HTTP v1 발송 헬퍼 구현
- `src/app/api/cron/reminders/route.ts` — 리마인더 대상 일정 조회 → 가족 구성원 FCM 발송 → `notifications` 기록
- Supabase SQL Editor에서 `pg_net`, `pg_cron` 활성화 및 `gleaum-reminders` 잡 등록 완료
- Vercel Hobby 플랜 제한으로 `vercel.json`의 Cron 설정은 제거됨

### 5단계: 자동화 정책 기반 상태 전이 (🔴 필수, Day 6 후속)

**필요 작업**:
- `docs/12-product-model.md` 기준으로 개인 기본 구간 + Space / Category / Automation Policy 모델 유지
- `schedule.type === 'child'` 하드코딩 금지
- `completion_required`: 시작 시 `pending` → `in_progress`, 종료 후 미완료면 `missed`
- `payment_due`: 결제일 도래/초과 상태 및 알림 처리
- `missed` 또는 `overdue` 전환 시 assignee/observer/Space 멤버 규칙에 따라 FCM 재알림
- 기존 Supabase cron 구조에 `/api/cron/automations` 또는 통합 cron 로직 추가

---

## 프로젝트 파일 구조 요약

```
핵심 파일 3개만 알면 됨:

1. src/lib/db.ts          ← 모든 DB 쿼리 (여기서 시작)
2. src/types/index.ts     ← 모든 TypeScript 타입
3. src/styles/tokens.css  ← 모든 디자인 토큰
```

자세한 구조 → `docs/04-file-structure.md`

---

## 작업 전 확인 체크리스트

```bash
# 1. 현재 코드 상태 확인
git log --oneline -5

# 2. 환경변수 확인
cat .env.local

# 3. 로컬 빌드 테스트
npm run build

# 4. 개발 서버 실행
npm run dev
```

---

## 새 기능 추가 패턴 (표준)

### DB 쿼리 추가
```typescript
// src/lib/db.ts에 추가
export async function newDbFunction(param: string): Promise<ResultType> {
  const supabase = createClient()  // 브라우저용: @/lib/supabase/client
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('column', param)
  
  if (error) throw error
  return data.map(rowToResultType)
}
```

### 새 훅 추가
```typescript
// src/hooks/useNewFeature.ts
'use client'
import { useState, useEffect } from 'react'
import { newDbFunction } from '@/lib/db'

export function useNewFeature(param: string | null) {
  const [data, setData] = useState<ResultType[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!param) { setLoading(false); return }  // null 안전 처리!
    newDbFunction(param).then(setData).finally(() => setLoading(false))
  }, [param])
  
  return { data, loading }
}
```

### 새 페이지 추가
```typescript
// src/app/new-page/page.tsx
'use client'
import AppHeader from '@/components/layout/AppHeader'
import BottomNav from '@/components/layout/BottomNav'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export default function NewPage() {
  const { user, familyGroupId, loading } = useCurrentUser()
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full"
      style={{ borderColor: 'rgba(0,132,204,0.3)', borderTopColor: 'var(--brand-blue)' }}/>
  </div>
  
  return (
    <>
      <AppHeader title="페이지 제목" showBack />
      <main className="pt-16 pb-32 px-4">
        {/* 컨텐츠 */}
      </main>
      <BottomNav />
    </>
  )
}
```

---

## Git 작업 흐름

```bash
# 기능 구현 후
git add src/app/new-feature/
git add src/lib/db.ts  # DB 함수 추가 시
git commit -m "feat: [기능명] 구현"
git push origin main
# → Vercel 자동 배포 시작 (약 1-2분)
```

---

## 자주 발생하는 문제와 해결

### 문제: OAuth 로그인이 Vercel 로그인 화면으로 이동
→ **해결**: Vercel Dashboard → Settings → Deployment Protection → Disabled

### 문제: DB 데이터가 없음 (빈 화면)
→ **해결**: Supabase SQL Editor에서 `supabase/schema.sql` 전체 실행

### 문제: `my_family_group_id()` 함수 오류
→ **해결**: schema.sql의 helper 함수가 먼저 생성됐는지 확인 (순서 중요)

### 문제: Tailwind 커스텀 클래스가 적용 안 됨
→ **해결**: `src/app/globals.css`의 `@theme {}` 블록에 토큰 추가 필요 (Tailwind v4)

### 문제: `getGoogleToken()` 이 null 반환
→ **해결**: Google OAuth 시 `access_type: 'offline', prompt: 'consent'` 파라미터 확인. 재로그인 필요할 수 있음.

---

## 도움이 되는 문서 읽기 순서

처음 이 프로젝트를 접하는 AI라면 이 순서로 읽기:

1. `docs/README.md` — 프로젝트 전체 개요 (5분)
2. `docs/01-project-overview.md` — 서비스 이해
3. `docs/04-file-structure.md` — 파일 구조 파악
4. `docs/05-database-schema.md` — DB 구조 이해
5. `docs/08-features-pending.md` — 다음 할 일 확인
6. `docs/12-product-model.md` — 개인 중심 + Space 확장형 제품 모델 확인
7. `DESIGN.md` — 디자인 작업 시 필독
8. 이 파일 (`10-ai-handoff-guide.md`) — 작업 시작

---

## 배포 URL 및 주요 링크

| 항목 | URL |
|------|-----|
| 프로덕션 앱 | https://gleaum-app.vercel.app |
| Supabase 대시보드 | https://supabase.com/dashboard/project/tyvjdsescukaeorcuaga |
| Vercel 대시보드 | https://vercel.com/dashboard |
| GitHub 저장소 | https://github.com/Edwin-space/gleaum-app |
| Google Cloud Console | https://console.cloud.google.com |
