<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:design-system-rules -->
# Design System (필수 참조)

UI 작업 전 반드시 아래 두 파일을 읽으세요:
1. **`DESIGN.md`** — 텍스트 명세서. 모든 토큰, 컬러, 컴포넌트 규격, 상태(State) 값이 정의되어 있습니다. **코드 작성 시 이 문서의 수치를 그대로 사용하세요.**
2. **`design-system-ui.html`** — 시각적 레퍼런스. 브라우저에서 열면 모든 컴포넌트가 실제로 렌더링됩니다. 형태나 비율이 애매할 때 이 파일을 확인하세요.

> ⚠️ Purple(`#5A32FA`)은 폐기되었습니다. 브랜드 컬러는 Green/Teal/Blue입니다.
<!-- END:design-system-rules -->

<!-- BEGIN:architecture-rules -->
# 프로젝트 핵심 규칙 (작업 전 반드시 읽기)

## 절대 금지
1. **Tailwind 유틸리티 클래스 사용 금지** — 전 컴포넌트 100% 인라인 스타일 전용 (2026-05-08 전환 완료)
2. **백엔드/DB 구조 임의 변경 금지** — `supabase/schema.sql`, `src/lib/db.ts`, `src/types/index.ts`
3. **DB 쿼리를 컴포넌트에 직접 작성 금지** — 모든 Supabase 쿼리는 `src/lib/db.ts`에만 추가
4. **새 테이블 생성 시 RLS 누락 금지** — 반드시 RLS 활성화 + 정책 추가

## 필수 패턴
- **Desktop/Mobile 분리**: 새 페이지는 반드시 `DesktopXxx.tsx` + `MobileXxx.tsx` + `page.tsx`(분기) 구조
- **useIsDesktop() 임포트 경로**: `@/hooks/useMediaQuery` (NOT `@/hooks/useIsDesktop`)
- **공간 정책**: 개인 공간 1개(초대 불가) + 공유 공간 최대 2개(무료). `preferences.personalSpaceId`로 식별
- **네이티브 유틸리티**: `src/lib/native.ts`의 함수 사용 (직접 Capacitor import 금지)

## 브랜드 컬러 (인라인 스타일 직접 사용)
- Brand Blue: `#0084CC`
- Teal: `#0CC9B5`
- Green: `#2EE895`
- Dark Navy: `#1A1B2E` / `#2D2E4A`
- Background: `#FAFAFD`

## 최신 상태 확인
- 작업 시작 시 `git log --oneline -5`와 `git status -sb`로 실제 최신 커밋/미커밋 변경을 먼저 확인하세요.
- 2026-05-29 기준 최신 커밋: `34dbb4b` — Supabase SQL 실행 가이드 문서화

## 2026-05-29 주요 변경 사항 (메인 앱)
- `src/app/api/invite/info/route.ts` — `purpose` 필드가 `family_groups.settings` JSONB에 저장됨 (직접 컬럼 아님) 버그 수정
- `src/components/NativeAppProvider.tsx` — Universal Link(`https://gleaum.com/*`) + 커스텀 스킴(`gleaum://`) 통합 핸들러 추가
- `src/app/.well-known/apple-app-site-association/route.ts` — iOS Universal Link AASA 파일 App Router 라우트로 신규 생성
- `src/app/.well-known/assetlinks.json/route.ts` — Android App Link SHA256 fingerprint 오류 수정
- `src/components/AdSlot.tsx` — 4xx/5xx 에러 시 AdSense 폴백 처리 수정
- `supabase/migrations/013_ad_system.sql` — 광고 시스템 테이블/RLS/함수 (**Supabase에서 실행 완료**)
- `supabase/migrations/014_ad_platforms.sql` — platforms 컬럼 + get_active_ad RPC 보정 (**Supabase에서 실행 완료**)

## 상세 문서 위치
- `/Users/edwin/Sync-NAS/#1. Personal/Project/Gleaum/docs/`
- 특히 `10-ai-handoff-guide.md`를 먼저 읽으세요.
<!-- END:architecture-rules -->
