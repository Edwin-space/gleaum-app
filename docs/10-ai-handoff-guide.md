# 10. AI 인수인계 가이드 (AI Handoff Guide)

> 이 문서는 어떤 AI(Claude, Gemini, GPT 등)라도 이 프로젝트를 이어받아 즉시 작업할 수 있도록 작성된 **최우선 참고 문서**입니다.
> **최종 업데이트**: 2026-05-08

---

## 🚨 절대 규칙 (작업 전 반드시 읽기)

1. **백엔드/DB 구조 절대 변경 금지** — `supabase/schema.sql`, `src/lib/db.ts`, `src/types/index.ts`의 핵심 구조는 건드리지 말 것.
2. **단일 DB 진입점 유지** — 모든 Supabase 쿼리는 반드시 `src/lib/db.ts`에만 추가.
3. **⚠️ 인라인 스타일 전용** — Tailwind CSS v4 신뢰성 문제로 **모든 컴포넌트는 100% 인라인 스타일**만 사용. `glass-card`, `animate-*`, `var()`, `bg-brand-gradient` 등 Tailwind 유틸리티 클래스 절대 사용 금지.
4. **디자인 토큰 (인라인 스타일로 직접 사용)**:
   - Brand Blue: `#0084CC`
   - Teal: `#0CC9B5`
   - Green: `#2EE895`
   - Dark Navy: `#1A1B2E` / `#2D2E4A`
   - Background: `#FAFAFD`
   - ⚠️ **Purple(`#5A32FA`)은 완전 폐기**
5. **RLS 보안** — 새 테이블 생성 시 반드시 RLS 활성화 + `my_family_group_id()` 기반 정책 추가.
6. **TypeScript 엄격 모드** — 타입 오류 없이 `npm run build` 통과해야 함.
7. **배포** — `main` 브랜치 push → Vercel 자동 배포. 또는 `npx vercel --prod`.
8. **AI 간 작업 동기화** — 작업 완료 후 반드시 `docs/` 폴더 관련 문서 업데이트.
9. **제품 모델 방향 유지** — 글리움은 **개인 중심 + Space 확장형 토털 라이프 관리 서비스**. 신규 기능은 개인 단독 사용을 기본값으로.
10. **hooks 임포트 경로** — `useIsDesktop()`은 `@/hooks/useMediaQuery`에서 import (NOT `@/hooks/useIsDesktop`).
11. **NAS 자동 동기화** — `git push` 후 `.git/hooks/post-push` 훅이 자동으로 NAS 동기화. 훅이 없는 경우: `bash scripts/install-hooks.sh` 실행. 동기화 대상: `/Users/edwin/Sync-NAS/#1. Personal/Project/Gleaum/`

---

## 현재 앱 상태 (2026-05-08 기준)

### 서비스 현황
- **프로덕션 URL**: `https://www.gleaum.com`
- **GitHub**: `Edwin-space/gleaum-app` (main 브랜치)
- **최신 커밋**: `f304a95`
- **Vercel Speed Insights**: `/home` 최적화 완료 (이전 poor → 개선 중)

### 디자인 히스토리 요약
- 초기 Purple(`#5A32FA`) 구현 → Blue/Teal/Green으로 전면 복구
- Tailwind CSS v4 신뢰성 문제 발견 → 2026-05-08 **전 컴포넌트 100% 인라인 스타일로 전환**
- PC WEB 전 구간 + 모바일 전 구간 프리미엄 리디자인 완료

### 현재 코드 아키텍처
```
page.tsx (thin router)
  ├── useIsDesktop() 분기
  ├── if (isDesktop) return <DesktopXxx />
  └── return <MobileXxx />
```

### ✅ 완전 작동 기능

| 기능 | 경로/파일 | 상태 |
|------|----------|------|
| Google OAuth 로그인 | `/login` → `/auth/callback` | ✅ |
| 온보딩 플로우 | `/onboarding` | ✅ |
| 홈 대시보드 | `/home` (PC/모바일 분리) | ✅ |
| 일정 CRUD | `/schedules`, `/schedules/new`, `/schedules/[id]` | ✅ |
| 일정 수정 | `/schedules/[id]/edit` | ✅ |
| 자녀 일정 | `/schedules/children` | ✅ |
| 가족 관리 + 초대 | `/family`, `/invite/[code]` | ✅ |
| 가계부 | `/budget` | ✅ |
| 마이페이지 | `/mypage` | ✅ |
| 알림 목록 | `/notifications` | ✅ |
| FCM 푸시 알림 | `FCMProvider`, `useFCM` | ✅ |
| 일정 리마인더 크론 | Supabase `pg_cron` → `/api/cron/reminders` | ✅ |
| 자동화 정책 엔진 | `/api/cron/automations` | ✅ |
| PC 랜딩페이지 | `DesktopLanding.tsx` | ✅ |
| GA4 분석 | `GoogleAnalytics.tsx`, `src/lib/analytics.ts` | ✅ |
| PWA (설치 가능) | `manifest.json`, `sw.js`, `PWAInstallBanner` | ✅ |
| 네이버/SEO 최적화 | `layout.tsx` 메타데이터 | ✅ |

### ❌ 미구현 기능

| 기능 | 우선순위 | 비고 |
|------|---------|------|
| 이미지 첨부 실제 업로드 | 🟡 | UI만 있음, Storage 연동 필요 |
| Google Calendar 동기화 | 🟡 | 코드 완성, API 활성화 대기 |
| 통계/분석 페이지 | 🟢 | 신규 개발 필요 |
| 네이티브 앱 (macOS → iOS → Android) | 🔴 | Capacitor 계획 수립 완료, 작업 대기 |

---

## 프로젝트 파일 구조 핵심 3개

```
1. src/lib/db.ts          ← 모든 DB 쿼리 (여기서 시작)
2. src/types/index.ts     ← 모든 TypeScript 타입
3. src/lib/analytics.ts   ← GA4 이벤트 트래킹 유틸리티
```

---

## 인라인 스타일 표준 패턴 (필수 숙지)

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
  position: 'relative',
  overflow: 'hidden',
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
  color: 'white',
  borderRadius: '18px',
  border: 'none',
  boxShadow: '0 8px 24px rgba(0,132,204,0.3)',
}}>
```

### 모바일 Safe Area
```tsx
paddingTop: 'calc(env(safe-area-inset-top) + 48px)'
paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)'
```

### useIsDesktop() 사용법
```tsx
import { useIsDesktop } from '@/hooks/useMediaQuery';  // ← 이 경로만 사용

const isDesktop = useIsDesktop();
if (isDesktop) return <DesktopComponent />;
return <MobileComponent />;
```

### GA4 이벤트 트래킹
```tsx
import { trackEvent } from '@/lib/analytics';

trackEvent('schedule_create', {
  schedule_type: type,
  has_participants: participants.length > 0,
  has_reminder: reminder > 0,
  has_repeat: repeat !== 'none',
  has_expense: type === 'expense',
});
```

---

## 네이티브 앱 확장 방향

> 상세 계획: `docs/14-native-app-plan.md`

- **기술**: Capacitor.js (현재 Next.js 코드베이스 85~90% 재사용)
- **DB**: 웹과 동일한 Supabase 프로젝트 공유 (별도 백엔드 불필요)
- **순서**: macOS 먼저 → iOS/iPad → Android
- **배포**: Mac App Store / App Store / Google Play

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

## 작업 전 확인 체크리스트

```bash
# 1. 최신 코드 확인
git log --oneline -5

# 2. 로컬 빌드 테스트 (배포 전 필수)
npm run build

# 3. 배포
git add [파일들] && git commit -m "feat: ..." && git push origin main
# 또는
npx vercel --prod
```

---

## 주요 커밋 히스토리

| 커밋 | 내용 |
|------|------|
| `f304a95` | 전체 UI 리디자인 + 성능 최적화 + GA4 이벤트 트래킹 (2026-05-08) |
| `86867a9` | PC/데스크탑 레이아웃 프리미엄 리디자인 |
| `a3c7acb` | PWA 완전체 — 스플래시/파비콘/OG 이미지 전체 적용 |
| `6770360` | 공식 BI/로고 이미지 전 구간 적용 |
| `8f35e4b` | Phase 2 PC/모바일 뷰 분리 + cron POST 메서드 지원 |
| `605d634` | Firebase 프로젝트 이관 |
