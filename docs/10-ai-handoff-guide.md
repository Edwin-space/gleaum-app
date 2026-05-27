# 10. AI 인수인계 가이드 (AI Handoff Guide)

> 이 문서는 어떤 AI(Claude, Gemini, GPT 등)라도 이 프로젝트를 이어받아 즉시 작업할 수 있도록 작성된 **최우선 참고 문서**입니다.
> **최종 업데이트**: 2026-05-27

---

## 🚨 절대 규칙 (작업 전 반드시 읽기)

1. **백엔드/DB 구조 절대 변경 금지** — `supabase/schema.sql`, `src/lib/db.ts`, `src/types/index.ts`의 핵심 구조는 건드리지 말 것.
2. **단일 DB 진입점 유지** — 모든 Supabase 쿼리는 반드시 `src/lib/db.ts`에만 추가.
3. **⚠️ 인라인 스타일 전용** — Tailwind CSS v4 신뢰성 문제로 **모든 컴포넌트는 100% 인라인 스타일**만 사용. `glass-card`, `animate-*`, `var()`, `bg-brand-gradient` 등 Tailwind 유틸리티 클래스 절대 사용 금지.  
   _예외_: `src/app/onboarding/page.tsx`는 기존 Tailwind 클래스 혼용 중 — 수정 시 인라인으로 전환.
4. **디자인 토큰 (인라인 스타일로 직접 사용)**:
   - Brand Blue: `#0084CC`
   - Teal: `#0CC9B5`
   - Green: `#2EE895`
   - Dark Navy: `#1A1B2E` / `#2D2E4A`
   - Background: `#FAFAFD`
   - ⚠️ **Purple(`#5A32FA`)은 완전 폐기**
5. **RLS 보안** — 새 테이블 생성 시 반드시 RLS 활성화 + `my_space_ids()` 기반 정책 추가.
6. **TypeScript 엄격 모드** — 타입 오류 없이 `npm run build` 통과해야 함.
7. **배포** — `npx vercel --prod` 로 직접 배포. 또는 `git push origin main` → Vercel 자동 배포.
8. **AI 간 작업 동기화** — 작업 완료 후 반드시 `docs/10-ai-handoff-guide.md` 업데이트 후 커밋.
9. **제품 방향 유지** — 글리움은 **개인 중심 + Space 확장형 토털 라이프 관리 서비스**. 개인 단독 사용이 기본, 공간은 선택적 확장.
10. **hooks 임포트 경로** — `useIsDesktop()`은 `@/hooks/useMediaQuery`에서 import (NOT `@/hooks/useIsDesktop`).
11. **NAS 자동 동기화** — `git push` 후 `.git/hooks/post-push` 훅이 자동으로 NAS 동기화. 훅이 없는 경우: `bash scripts/install-hooks.sh` 실행.
12. **`/family` 경로 폐기** — `/family`는 `/space`로 영구 리다이렉트. 새 코드에서 `/family` 참조 금지.
13. **Space 용어 통일** — 코드/문서에서 "가족(family)" → "공간(space)" 용어 사용. DB 테이블명(`family_groups`)은 하위 호환으로 유지.
14. **개인 공간 / 공유 공간 구분** — 모든 사용자는 `family_group_id`를 가짐 (개인 공간 자동 생성). `hasSharedSpace`로 공유 공간 여부 판단. 자세한 내용은 아래 "공간 아키텍처" 섹션 참고.

---

## 현재 앱 상태 (2026-05-27 기준)

### 서비스 현황
- **프로덕션 URL**: `https://www.gleaum.com`
- **GitHub**: `Edwin-space/gleaum-app` (main 브랜치)
- **최신 배포**: GitHub `main` 자동 배포 기준. 작업 전 Vercel 상태 확인 권장
- **Google Play**: 내부 테스트 버전 업로드 완료 (`com.gleaum.app`, versionCode: 1)

### 최근 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-27 | `/space/new` Desktop 2컬럼 생성 화면 추가. PC에서 공간 설명과 생성 폼, 생성 후 초대 액션을 분리 표시 |
| 2026-05-27 | `/space/settings` Desktop 2컬럼 레이아웃 추가. PC에서 공간 이름/목적/일정 유형/초대/멤버/위험 구역을 한 화면에서 관리 |
| 2026-05-27 | Android 네이티브 앱 로그인에서 초대 링크용 인앱 브라우저 차단 안내가 뜨던 문제 수정. `getBlockedBrowserInfo()`는 Capacitor 네이티브 앱에서 `null` 반환 |
| 2026-05-27 | `1a5db08` — iOS 무료 Apple Developer 계정 빌드를 위해 Associated Domains entitlement 제거. Universal Links는 유료 계정 전환 후 재활성화 |
| 2026-05-27 | `8377d36` — 가계부 지출 등록 시 즉시 FCM 알림이 발송되던 크리티컬 버그 수정 |
| 2026-05-27 | `e5212f6` — 초대 랜딩 페이지, 딥링크/Universal Links 웹 기반, 페이지 타이틀 추가 |
| 2026-05-27 | `ff1cfbb` / `67297e1` — 초대/로그인 플로우, iOS 인앱 브라우저 대응, AdSense `ads.txt` 접근 문제 수정 |
| 2026-05-27 | `68a2c29` / `105f52b` — 공간 정책 개편, 초대 공유 3종, 다운로드 페이지, PC 파리티 보강 |
| 2026-05-26 | `a498f14`~`d6f5db5` — 신규 유저 온보딩 직접 진입, 네이티브 성능 최적화, iOS WKWebView 개선, Android Kotlin stdlib 충돌 해결 |
| 2026-05-14 | Firebase SDK 네이티브 연동 (iOS AppDelegate + Package.swift) |
| 2026-05-14 | Google Calendar/Drive 연동 완전 제거 → 기기 캘린더 전환 준비 |
| 2026-05-14 | Google OAuth 스코프 축소 (email+profile만 요청) |
| 2026-05-14 | 법적 문서 페이지 신규 생성 (`/legal/terms`, `/legal/privacy`) |
| 2026-05-14 | 릴리즈 키스토어 생성 + Google Play 패키지명 소유권 인증 완료 |
| 2026-05-14 | Android 미사용 권한 제거 (CAMERA, BIOMETRIC 등) |
| 2026-05-14 | signed AAB 빌드 → Google Play 내부 테스트 버전 업로드 완료 |
| 2026-05-12 | `04fe0ca` — 개인 공간 자동 생성, `hasSharedSpace` 도입 |
| 2026-05-12 | `46e8985` — DesktopBudget UX 3종 개선 |
| 2026-05-11 | `c6fb8f2` — Phase 1 Space 전환 + Phase 2 기능 개선 4종 |

### 주요 인프라 현황

| 구분 | 상태 |
|------|------|
| Vercel 웹 배포 | ✅ 운영 중 (`https://www.gleaum.com`) |
| 백오피스 배포 | ✅ 운영 중 (별도 Vercel 프로젝트) |
| GA4 데이터 수집 | ✅ 정상 (서비스 계정 뷰어 권한 부여 완료) |
| Firebase FCM | ✅ 웹/네이티브 분기 처리 완료 |
| Google Play | ✅ 내부 테스트 버전 등록 완료 |
| App Store (iOS) | ❌ 미등록 (APNs 설정 후 진행 필요) |
| 2026-05-11 | `5446976` | space_members 테이블 + 역할 기반 RLS |

### 코드 아키텍처 패턴

```
page.tsx (thin router — 상태 + 핸들러)
  ├── useIsDesktop() 분기
  ├── if (isDesktop) return <DesktopXxx />
  └── return <MobileXxx />
```

모든 `page.tsx`는 상태와 핸들러만 보유하고, 실제 UI는 `Desktop*.tsx` / `Mobile*.tsx`로 완전 분리.

---

## ✅ 현재 작동 중인 기능 전체 목록

| 기능 | 경로/파일 | 상태 |
|------|----------|------|
| Google OAuth 로그인 | `/login` → `/auth/callback` | ✅ |
| 온보딩 플로우 (6단계) | `/onboarding` | ✅ |
| 온보딩 "혼자 시작" → 개인 공간 자동 생성 | `onboarding/page.tsx` | ✅ |
| 홈 대시보드 | `/home` (PC/모바일) | ✅ |
| 일정 CRUD | `/schedules`, `/schedules/new`, `/schedules/[id]` | ✅ |
| 일정 수정 | `/schedules/[id]/edit` | ✅ |
| 자녀 일정 | `/schedules/children` | ✅ |
| 공간 관리 (멤버/권한/초대/이름변경) | `/space` (PC/모바일) | ✅ |
| `/family` 하위호환 리다이렉트 | `/family/page.tsx` | ✅ |
| 초대 링크/코드 | `/invite/[code]` | ✅ |
| **가계부 — 개인/공간 탭 분리** | `/budget` | ✅ |
| **가계부 — 개인 지출 공간 불필요** | `budget/page.tsx` | ✅ 신규 |
| **가계부 — 금액 콤마 포맷 + 만원 힌트** | `MobileBudget`, `DesktopBudget` | ✅ 신규 |
| 마이페이지 | `/mypage` | ✅ |
| 알림 목록 | `/notifications` | ✅ |
| FCM 푸시 알림 | `FCMProvider`, `useFCM` | ✅ |
| 일정 리마인더 크론 | `/api/cron/reminders` | ✅ |
| 자동화 정책 엔진 | `/api/cron/automations` | ✅ |
| PC 랜딩페이지 | `DesktopLanding.tsx` | ✅ |
| GA4 분석 | `analytics.ts` | ✅ |
| PWA | `manifest.json`, `sw.js` | ✅ |
| SEO 최적화 | `layout.tsx` 메타데이터 | ✅ |
| visibility 보안 (private 일정 본인만) | `db.ts` | ✅ |
| 역할 기반 권한 UI (Admin/Editor/Viewer) | `space/*.tsx` | ✅ |

---

## ❌ 미구현 / 다음 작업 후보

| 기능 | 우선순위 | 비고 |
|------|---------|------|
| **일정 추가 개인/공간 탭 구분** | 🔴 | `/schedules/new` — 가계부처럼 탭으로 개인/공간 선택. 아래 상세 설명 참고 |
| **공유 공간 이전 시 개인 일정 유지** | 🔴 | 개인 공간 → 공유 공간 전환 시 개인 공간 일정이 사라짐. 다중 공간 쿼리 필요 |
| 이미지 첨부 실제 업로드 | 🟡 | UI만 있음, Supabase Storage 연동 필요 |
| 기기 캘린더 연동 | 🟡 | Google Calendar/Drive 연동은 제거됨. 네이티브 기기 캘린더 방식으로 재설계 필요 |
| 통계/분석 페이지 | 🟢 | 신규 개발 필요 |
| 네이티브 앱 출시 마무리 | 🔴 | Android 내부 테스트 업로드 완료. iOS는 APNs/유료 Apple Developer/Associated Domains 재활성화 필요 |
| Space 타입 확장 | 🟢 | `family_groups.type` 컬럼 추가 → 개인/연인/가족/모임 구분 |
| 일정 단건 외부 공유 | 🟢 | `/share/[scheduleId]` 공개 읽기 전용 뷰 |

---

## 🔴 다음 우선 작업: 일정 추가 개인/공간 구분

현재 `/schedules/new` 는 공간 일정을 기본으로 동작. 가계부처럼 "개인 일정 / 공간 일정" 탭을 추가해야 함.

### 설계 방향
- 탭: **👤 개인 일정** (기본) / **🏠 공간 일정** (공유 공간 있을 때만 활성)
- 개인 일정: `visibility = 'private'`, 내 개인 공간에 저장
- 공간 일정: `visibility = 'space'`, 공유 공간에 저장 (멤버 전체 공유)
- 탭 로직은 `budget/page.tsx`의 패턴 그대로 재사용 가능

### 관련 파일
- `src/app/schedules/new/page.tsx` — 탭 상태 추가
- `src/app/schedules/new/MobileNewSchedule.tsx` — 탭 UI
- `src/app/schedules/new/DesktopNewSchedule.tsx` — 탭 UI

---

## 핵심 파일 맵

```
src/
├── lib/
│   ├── db.ts              ← 모든 Supabase 쿼리 (단일 진입점)
│   ├── analytics.ts       ← GA4 이벤트 트래킹
│   ├── fcm.ts             ← FCM 서버 발송
│   └── native.ts          ← Capacitor 네이티브 유틸
├── types/
│   └── index.ts           ← 모든 TypeScript 타입 정의
│                            OnboardingPreferences.personalSpaceId 포함
├── hooks/
│   ├── useCurrentUser.ts  ← 현재 사용자 (spaceId, hasSharedSpace, refresh)
│   ├── useSpace.ts        ← 공간 데이터 (space, members, myRole, refresh)
│   ├── useSchedules.ts    ← 일정 목록 + CRUD
│   └── useMediaQuery.ts   ← useIsDesktop() — 반드시 이 파일에서 import
├── app/
│   ├── space/
│   │   ├── page.tsx
│   │   ├── DesktopSpace.tsx  ← 멤버 카드, 역할 배지, ✏️ 이름변경, ✕ 멤버제거
│   │   └── MobileSpace.tsx
│   ├── budget/
│   │   ├── page.tsx          ← BudgetTab 타입, hasSharedSpace 사용
│   │   ├── DesktopBudget.tsx ← 개인 탭 우선, 금액 콤마, visibility 없음
│   │   └── MobileBudget.tsx  ← 동일 UX
│   ├── schedules/new/
│   │   ├── page.tsx
│   │   ├── DesktopNewSchedule.tsx
│   │   └── MobileNewSchedule.tsx
│   └── family/
│       └── page.tsx          ← redirect('/space')
└── components/
    ├── ui/Card.tsx           ← 🔒 나만 배지 (visibility === 'private')
    └── layout/
        └── DesktopSidebar.tsx
```

---

## 공간(Space) 아키텍처 상세

### 핵심 개념: 두 레이어 분리

```
기술 레이어: 모든 데이터는 항상 어떤 공간에 속한다 (family_group_id 항상 존재)
UX 레이어:  사용자는 "개인 일정/지출"과 "공간 일정/지출"만 본다
```

### 공간 종류

| 종류 | 생성 시점 | `preferences.personalSpaceId` | 특징 |
|------|---------|-------------------------------|------|
| **개인 공간** | 온보딩 "혼자 시작" 또는 `ensureUserSetup()` 자동 | 해당 spaceId와 동일 | 사용자에게 노출 안 함 |
| **공유 공간** | 온보딩 "새 공간 만들기" 또는 초대 코드 참여 | 다른 값 (또는 null) | 멤버 초대, 공유 일정 |

### `hasSharedSpace` 판별 로직

```typescript
// src/hooks/useCurrentUser.ts
const personalSpaceId = profile?.preferences?.personalSpaceId ?? null;
const hasSharedSpace = !!spaceId && spaceId !== personalSpaceId;
```

- 혼자 사용하는 사용자: `spaceId === personalSpaceId` → `hasSharedSpace = false`
- 공간 만들거나 참여한 사용자: `spaceId !== personalSpaceId` → `hasSharedSpace = true`

### `useCurrentUser` 반환값

```typescript
const {
  user,           // User 객체
  profile,        // ProfileRow (raw DB data)
  familyGroupId,  // string | null — 현재 소속 공간 ID (하위 호환)
  spaceId,        // string | null — familyGroupId 와 동일 (신규 코드용)
  hasSharedSpace, // boolean — 공유 공간 여부 (가계부/일정 탭 활성화 판단)
  loading,
  refresh,
} = useCurrentUser();
```

### DB 구조

```sql
-- family_groups (= 공간. 내부 테이블명 유지)
id          uuid PRIMARY KEY
name        text
invite_code text
created_by  uuid → auth.users
created_at  timestamptz

-- space_members (역할 기반 멤버십)
id          uuid PRIMARY KEY
space_id    uuid → family_groups.id
user_id     uuid → auth.users
role        text CHECK IN ('admin', 'editor', 'viewer')
joined_at   timestamptz

-- profiles (사용자 프로필)
family_group_id  uuid → family_groups.id   -- 현재 소속 공간
preferences      jsonb                      -- personalSpaceId 포함
```

### 역할별 권한 매트릭스

| 기능 | admin | editor | viewer |
|------|:-----:|:------:|:------:|
| 일정/지출 조회 | ✅ | ✅ | ✅ |
| 일정/지출 생성 | ✅ | ✅ | ❌ |
| 공간 이름 변경 | ✅ | ❌ | ❌ |
| 멤버 제거 | ✅ | ❌ | ❌ |

### 마이그레이션 보정 (Phase 1 이전 생성자 처리)

Phase 1 이전에 공간을 만든 사용자는 `space_members`에 없을 수 있음. 두 곳에서 자동 backfill:

```typescript
// db.ts — getMyRoleInSpace() 및 getSpaceWithMembers() 에 폴백 적용
if (group?.created_by === user.id) {
  await supabase.from('space_members').upsert(
    { space_id: spaceId, user_id: user.id, role: 'admin' },
    { onConflict: 'space_id,user_id', ignoreDuplicates: true }
  );
  return 'admin';
}
```

---

## 가계부 (Budget) 시스템 상세

### 탭 구조

```typescript
// budget/page.tsx
const tabs = [
  { key: 'personal', label: '👤 개인 지출' },         // 기본 탭
  { key: 'space',    label: '🏠 공간 지출', disabled: !hasSpace }, // hasSharedSpace
];
```

### visibility 자동 결정

```typescript
// 모달에 visibility 토글 없음 — 탭이 자동 결정
const visibility = tab === 'personal' ? 'private' : 'space';
```

### 금액 입력 포맷

```typescript
function formatInputAmount(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('ko-KR'); // 1,000,000
}
// type="text" inputMode="numeric" 사용 (type="number" ❌)
// 10,000원 이상 시 "X만원" 힌트 표시
```

### `AddExpenseInput` 타입 (visibility 없음)

```typescript
export interface AddExpenseInput {
  title:         string;
  amount:        number;
  date:          Date;
  category:      ExpenseCategory;
  paymentMethod: PaymentMethod;
  repeat:        RepeatType;
  // visibility는 탭에서 자동 결정 — 이 타입에 없음
}
```

---

## Space 관리 UI (DesktopSpace / MobileSpace)

### 기능 목록
- 공간 이름 표시 + ✏️ 이름 변경 (admin 전용)
- 멤버 카드: 이름, 역할 배지, ✕ 제거 버튼 (admin만, 자기 자신 제외)
- 초대 코드 표시 + 복사
- 멤버 초대 링크 공유

### 역할 배지 색상

```typescript
// Admin: #0084CC (Blue)
// Editor: #0CC9B5 (Teal)
// Viewer: #8E8E93 (Gray)
```

---

## Visibility 보안

```typescript
// src/lib/db.ts — getSchedules()
.or(`visibility.neq.private,visibility.is.null,created_by.eq.${userId}`)
```

| visibility | 의미 | 조회 가능 |
|------------|------|-----------|
| `'space'` | 공간 전체 공유 | 공간 멤버 전체 |
| `'private'` | 본인만 (🔒 나만 배지) | 작성자 본인 |
| `'selected'` | 지정 참여자만 | 미구현 UI |

---

## 인라인 스타일 표준 패턴

### 카드 컴포넌트
```tsx
<div style={{
  background: 'white',
  borderRadius: '20px',
  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
  border: '1px solid rgba(0,0,0,0.04)',
  padding: '20px',
}}>
```

### 다크 히어로 헤더
```tsx
<div style={{
  background: 'linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)',
  position: 'relative', overflow: 'hidden',
}}>
  {/* glow blob */}
  <div style={{
    position: 'absolute', top: '-30px', right: '-30px',
    width: '140px', height: '140px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,132,204,0.35) 0%, transparent 70%)',
    pointerEvents: 'none',
  }} />
```

### 그라디언트 버튼
```tsx
<button style={{
  background: 'linear-gradient(135deg, #0CC9B5 0%, #0084CC 100%)',
  color: 'white', borderRadius: '18px', border: 'none',
  boxShadow: '0 8px 24px rgba(0,132,204,0.3)',
}}>
```

### 비활성화 탭 (공간 없을 때)
```tsx
<button
  onClick={() => !disabled && setTab(key)}
  style={{
    border: disabled ? '1.5px dashed rgba(...,0.3)' : 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    color: disabled ? 'rgba(...,0.35)' : activeColor,
  }}
>
  {label}{disabled ? ' (공간 필요)' : ''}
</button>
```

### 역할 배지 (Admin/Editor/Viewer)
```tsx
<span style={{
  padding: '6px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 800,
  background: role === 'admin' ? 'rgba(0,132,204,0.1)' : role === 'viewer' ? 'rgba(142,142,147,0.1)' : 'rgba(12,201,181,0.1)',
  color: role === 'admin' ? '#0084CC' : role === 'viewer' ? '#8E8E93' : '#0CC9B5',
}}>
  {role === 'admin' ? 'Admin' : role === 'viewer' ? 'Viewer' : 'Editor'}
</span>
```

### 모바일 Safe Area
```tsx
paddingTop: 'calc(env(safe-area-inset-top) + 48px)'
paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)'
```

### 모바일 input overflow 방지 (iOS Safari)
```tsx
{/* ❌ 금지 */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>

{/* ✅ 권장 */}
<div style={{ display: 'flex', gap: '8px' }}>
  <input style={{ flex: 1, minWidth: 0 }} />
</div>
```

### GA4 이벤트 트래킹
```tsx
import { trackEvent } from '@/lib/analytics';

trackEvent('schedule_create', {
  schedule_type: type,
  has_participants: participants.length > 0,
  has_reminder: reminder > 0,
  has_repeat: repeat !== 'none',
});
```

---

## 전체 작업 이력 (Phase별)

### Phase 1 — Space 아키텍처 전환 (2026-05-11)

| Step | 내용 | 커밋 |
|------|------|------|
| 1 | `space_members` 테이블 + 역할 기반 RLS | `5446976` |
| 2 | SpaceRole/SpaceMember 타입 교체 | `c999212` |
| 3 | 온보딩 Space 선택 단계 추가, 인증 콜백 자동 생성 제거 | `c6fb8f2` |
| 4 | Cron/알림 API → `space_members` 기반 교체 | `c6fb8f2` |
| 5 | `/family` → `/space` 전면 마이그레이션 | `c6fb8f2` |

### Phase 2 — 기능 개선 4종 (2026-05-11)

| # | 내용 | 파일 |
|---|------|------|
| 1 | 모바일 입력 오버플로우 수정 | `MobileNewSchedule.tsx` |
| 2 | visibility 보안 수정 + 🔒 배지 | `db.ts`, `Card.tsx` |
| 3 | 가계부 탭 분리 + 지출 추가 기능 | `budget/page.tsx`, `*Budget.tsx` |
| 4 | 공간 권한 UI (Admin/Editor/Viewer) | `DesktopSpace.tsx`, `MobileSpace.tsx` |

### Phase 3 — 가계부 UX + 공간 아키텍처 개선 (2026-05-11~12)

| # | 내용 | 커밋 |
|---|------|------|
| 1 | Space Admin 미표시 버그 수정 (backfill) | `d0711c9` |
| 2 | 가계부 3종 UX 개선 (탭순서, 콤마포맷, visibility 제거) Mobile | `d0711c9` |
| 3 | 가계부 3종 UX 개선 동일 적용 Desktop | `46e8985` |
| 4 | **개인 공간 자동 생성 아키텍처** | `04fe0ca` |

#### Phase 3-4 핵심 변경사항 (`04fe0ca`)
- `createPersonalSpace(displayName)` — 개인 공간 생성 + `preferences.personalSpaceId` 저장
- `ensureUserSetup()` — 온보딩 완료 후 공간 없으면 자동 생성 (기존 사용자 보정)
- 온보딩 "혼자 시작" → `createPersonalSpace()` 호출 (이전: 아무것도 안 함)
- `useCurrentUser` — `hasSharedSpace` 추가
- `budget/page.tsx` — `hasSpace = hasSharedSpace` 로 교체, 에러 메시지 정리

---

## 환경변수 목록

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=

# App URL
NEXT_PUBLIC_APP_URL=

# Firebase / FCM
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
FIREBASE_SERVICE_ACCOUNT_BASE64=

# GA4
NEXT_PUBLIC_GA_ID=G-BK5RQTGVNT

# Cron
CRON_SECRET=
```

---

## 작업 시작 체크리스트

```bash
# 1. 최신 코드 확인
git log --oneline -5

# 2. 타입 확인 및 로컬 빌드 테스트
npm run build
# 필요 시 네이티브 동기화
npm run cap:sync

# 3. 배포
npx vercel --prod
# 또는 git push (Vercel 자동 배포)
git add [파일들] && git commit -m "feat: ..." && git push origin main
```

---

## 커밋 히스토리 (최신순)

| 커밋 | 날짜 | 내용 |
|------|------|------|
| `1a5db08` | 2026-05-27 | fix(ios): Associated Domains entitlement 제거 — 무료 Apple Developer 빌드 복구 |
| `8377d36` | 2026-05-27 | fix: 가계부 지출 등록 시 즉시 FCM 발송 버그 수정 |
| `e5212f6` | 2026-05-27 | feat: 초대 랜딩 페이지 + 딥링크/Universal Links 웹 기반 + 페이지 타이틀 |
| `ff1cfbb` | 2026-05-27 | feat: 초대/로그인 플로우 버그 수정 + iOS 인앱 브라우저 대응 + AdSense ads.txt |
| `105f52b` | 2026-05-27 | feat(desktop): PC 파리티 — 공간 정책 + 초대 공유 3종 + 앱 설정 섹션 |
| `68a2c29` | 2026-05-27 | feat: 공간 정책 개편, 초대 공유 3종, 다운로드 페이지, UX 버그 수정 |
| `d6f5db5` | 2026-05-26 | fix(android): Kotlin stdlib 버전 충돌 해결 |
| `ee29c39` | 2026-05-26 | feat(ios): WKWebView 성능 최적화, 세로 고정, 알림 권한 타이밍 개선 |
| `a498f14` | 2026-05-26 | fix: 신규 유저 온보딩 직접 진입 + 온보딩 UI 교체 |
| `04fe0ca` | 2026-05-12 | feat: 개인 공간 자동 생성 + hasSharedSpace 도입 |
| `46e8985` | 2026-05-12 | refactor(budget): DesktopBudget UX 3종 개선 |
| `d0711c9` | 2026-05-11 | fix: Space Admin 미표시 버그 + 가계부 지출 추가 |
| `c6fb8f2` | 2026-05-11 | feat: Phase 1 Space 전환 + Phase 2 기능 개선 4종 |
| `c999212` | 2026-05-11 | feat(types): SpaceRole/SpaceMember 타입 교체 |
| `5446976` | 2026-05-11 | feat(db): space_members 테이블 + RLS |
| `2de32c3` | 2026-05-08 | fix(ios): Mac Catalyst → Designed for iPad 전환 |
| `2354961` | 2026-05-08 | feat(ios): iPad + macOS 지원 확장 |
| `0be69da` | 2026-05-08 | feat(android): 앱 기반 구축 |
| `b68ab5e` | 2026-05-08 | feat: Capacitor 네이티브 앱 기반 구축 |
| `f304a95` | 2026-05-08 | feat: 전체 UI 리디자인 + GA4 |

---

## 네이티브 앱 현황

> 상세 계획: `docs/14-native-app-plan.md`

| 플랫폼 | 상태 | 비고 |
|--------|------|------|
| iOS | Capacitor 기반 및 WKWebView 최적화 완료 | 무료 Apple Developer 계정에서는 Associated Domains 불가. 유료 계정 전환 후 Push Notifications/Associated Domains 재활성화 필요 |
| Android | Google Play 내부 테스트 업로드 완료 | 정식 출시 전 R8 매핑, 네이티브 디버그 기호, 데이터 안전/스토어 등록정보 필요 |
| macOS | "Designed for iPad" 방식 | Mac Catalyst 대신 |

- **기술**: Capacitor.js (`server.url = 'https://www.gleaum.com'` — 웹 래핑 방식)
- **DB**: 웹과 동일한 Supabase 공유, 별도 백엔드 불필요
