# 10. AI 인수인계 가이드 (AI Handoff Guide)

> 이 문서는 어떤 AI(Claude, Gemini, GPT 등)라도 이 프로젝트를 이어받아 즉시 작업할 수 있도록 작성된 **최우선 참고 문서**입니다.

---

## 🚨 절대 규칙 (작업 전 반드시 읽기)

1. **백엔드/DB 구조 절대 변경 금지** — `supabase/schema.sql`, `src/lib/db.ts`, `src/types/index.ts`의 핵심 구조는 건드리지 말 것.
2. **단일 DB 진입점 유지** — 모든 Supabase 쿼리는 반드시 `src/lib/db.ts`에만 추가.
3. **디자인 시스템 준수** — 색상, 그림자, 반지름은 반드시 `src/styles/tokens.css`의 토큰 또는 `#5A32FA` 브랜드 컬러를 사용.
4. **RLS 보안** — 새 테이블 생성 시 반드시 RLS 활성화 + `my_family_group_id()` 기반 정책 추가.
5. **TypeScript 엄격 모드** — 타입 오류 없이 `npm run build` 통과해야 함.
6. **배포 자동화** — `main` 브랜치에 push하면 Vercel이 자동 배포. 작업 후 반드시 commit + push.

---

## 현재 앱 상태 (2025년 기준)

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
| Vibrant Purple 디자인 | **전 페이지** | ✅ 100% 통일 완료 |
| Vercel 프로덕션 배포 | gleaum-app.vercel.app | ✅ 자동 배포 중 |

### ❌ 미구현 기능 (우선순위 순)

| 기능 | 우선순위 | 비고 |
|------|---------|------|
| FCM 푸시 알림 | 🔴 필수 (Day 6) | Firebase 프로젝트 생성 필요 |
| Google Calendar 양방향 동기화 | 🟡 중요 (Day 5) | Calendar API 활성화 필요 |
| Google Drive 사진 첨부 | 🟡 중요 (Day 5) | Drive API 활성화 필요 |
| 일정 수정 페이지 `/schedules/[id]/edit` | 🟢 선택 | UI만 없음, DB 함수는 있음 |
| Google OAuth 앱 게시 (프로덕션) | 🟢 선택 | 테스트 사용자 외 로그인 불가 |

---

## 다음 작업 순서 (추천)

> ✅ 1단계(초대 링크)와 2단계(전 페이지 디자인 리뉴얼)는 완료됨.

### 1단계 ✅: 초대 링크 페이지 — 완료
`src/app/invite/[code]/page.tsx` 구현 완료.
- 비로그인: `/login?next=/invite/[code]` → OAuth → 콜백 → 다시 초대 페이지 → 자동 합류
- `joinFamilyByCode()` 반환 타입: `{ success, alreadyMember?, familyName? }`

### 2단계 ✅: 전 페이지 디자인 리뉴얼 — 완료
7개 페이지 전부 Vibrant Purple 통일 완료.

---

### 3단계: Google Calendar 연동 (🟡 중요, Day 5)

**사전 작업 (수동)**:
1. Google Cloud Console → API 및 서비스 → **Google Calendar API** 활성화
2. Google Cloud Console → API 및 서비스 → **Google Drive API** 활성화

**코드 작업**:

`src/lib/googleCalendar.ts` 신규 생성:
```typescript
// 글리움 → 구글 캘린더
export async function createGoogleEvent(token: string, schedule: Schedule) {
  return fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: schedule.title,
      start: { dateTime: schedule.startTime.toISOString() },
      end: { dateTime: (schedule.endTime ?? schedule.startTime).toISOString() },
      location: schedule.location?.address,
      description: schedule.memo
    })
  }).then(r => r.json())
}

export async function updateGoogleEvent(token: string, eventId: string, schedule: Schedule) { ... }
export async function deleteGoogleEvent(token: string, eventId: string) { ... }
export async function fetchGoogleEvents(token: string, timeMin: string, timeMax: string) { ... }
```

DB 마이그레이션 (Supabase SQL Editor):
```sql
ALTER TABLE schedules ADD COLUMN google_event_id text;
```

---

### 4단계: FCM 푸시 알림 (🔴 필수, Day 6)

**사전 작업 (수동)**:
1. Firebase Console → 새 프로젝트 생성
2. Cloud Messaging 탭 → 서버 키 복사
3. Vercel 환경변수에 `NEXT_PUBLIC_FIREBASE_*` 추가

**코드 작업**:
- `public/firebase-messaging-sw.js` — 서비스워커 생성
- `src/lib/firebase.ts` — Firebase 초기화
- Supabase Edge Function 또는 Vercel Cron — 알림 예약 발송
- `notifications` 테이블 활용 (이미 스키마에 있음)

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
    <div className="animate-spin w-8 h-8 border-2 border-[#5A32FA] border-t-transparent rounded-full"/>
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
6. `DESIGN_HANDOFF_TO_CLAUDE.md` — 디자인 작업 시 필독
7. 이 파일 (`10-ai-handoff-guide.md`) — 작업 시작

---

## 배포 URL 및 주요 링크

| 항목 | URL |
|------|-----|
| 프로덕션 앱 | https://gleaum-app.vercel.app |
| Supabase 대시보드 | https://supabase.com/dashboard/project/tyvjdsescukaeorcuaga |
| Vercel 대시보드 | https://vercel.com/dashboard |
| GitHub 저장소 | https://github.com/Edwin-space/gleaum-app |
| Google Cloud Console | https://console.cloud.google.com |
