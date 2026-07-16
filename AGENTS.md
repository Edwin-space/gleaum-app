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
1. **다크 모드 대응 없는 고정 색상 하드코딩 금지** — 테마에 따라 달라져야 하는 배경/텍스트/테두리는 `var(--theme-*)` 토큰(`DESIGN.md` 2.6절, `src/styles/tokens.css`)을 사용하세요. Tailwind 유틸리티와 인라인 스타일이 혼재되어 있으니(예: `bg-[var(--theme-surface)]`), 기존 파일의 스타일 방식을 따르되 고정 Hex(`text-[#8E8E93]`, `bg-white`, `bg-gray-100` 등)는 새로 추가하지 마세요.
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
- 작업 시작 시 `git log --oneline -5`와 `git status -sb`로 실제 최신 커밋/미커밋 변경을 먼저 확인하세요. 아래 커밋 해시는 작성 시점 스냅샷이며 곧 낡은 정보가 되니 항상 직접 확인하세요.
- 이어서 **`docs/24-project-work-tracker.md`를 반드시 확인**하세요. 이 문서가 현재 우선순위·진행·차단·완료일·검증 근거의 단일 기준입니다.
- 작업을 시작하면 해당 ID를 `🟠 진행 중`과 시작일로 갱신하고, 종료 시 완료일·검증 근거 또는 차단 사유와 다음 행동을 기록하세요. 완료 항목을 삭제하거나 근거 없이 체크하지 마세요.
- 2026-07-16 확인 기준 최신 커밋: `8fc41c6` — feat(admin): consolidate backoffice operations. 이후 변경은 미커밋 작업 트리에 포함됨

## 2026-06-01 주요 변경 사항 (메인 앱)

### Android 네이티브 로그인 시스템 구현
- `android/.../SplashActivity.kt` — 커스텀 스플래시 화면 (검정 배경, 브랜딩)
- `android/.../RouterActivity.kt` — 세션 체크 후 Login/Main 분기 (런처)
- `android/.../LoginActivity.kt` — 네이티브 로그인 UI + Google OAuth (브라우저 방식)
- `android/.../SessionManager.kt` — SharedPreferences 세션 저장/조회
- `android/.../NativeSessionPlugin.kt` — Capacitor 브리지 (saveSession/getSession/logout)
- `android/.../NativeAdPlugin.kt` — AdMob 네이티브 광고 Capacitor 브리지
- `src/lib/native-session.ts` — JS 측 NativeSession 인터페이스
- `src/lib/native-ad.ts` — JS 측 NativeAd 인터페이스

### iOS 네이티브 로그인 시스템 구현
- `ios/App/App/SessionManager.swift` — UserDefaults 세션 저장/조회
- `ios/App/App/NativeSessionPlugin.swift` — Capacitor 브리지 (iOS)
- `ios/App/App/LoginViewController.swift` — 네이티브 로그인 UI + SFSafariViewController OAuth
- `ios/App/App/AppDelegate.swift` — 세션 체크 + OAuth 콜백 직접 파싱 + 로그아웃 처리
- `ios/App/App/Base.lproj/LaunchScreen.storyboard` — 브랜딩 스플래시 업데이트

### 광고 시스템
- `src/components/AdSlot.tsx` — 웹/앱 플랫폼 자동 분리 (웹→AdSense, 앱→null)
- `src/components/SaveAdSheet.tsx` — 저장 후 바텀시트 광고 (웹→AdSense, 앱→AdMob)
- `src/components/InlineFeedAd.tsx` — 홈피드 AdMob 네이티브 광고
- `src/lib/admob.ts` — 테스트 기기 해시 추가, 광고 단위 수정
- `src/lib/native-ad.ts` — AdMob 네이티브 광고 JS 인터페이스
- `public/app-ads.txt` — AdMob 인벤토리 승인

### NativeAppProvider 핵심 수정
- OAuth fragment(`#`) 파라미터 파싱 수정 (implicit flow)
- closeBrowser() 에러 무시 (iOS SFSafariViewController 자동 닫힘)
- SIGNED_OUT 시 gleaum://logout 딥링크 폴백 (iOS 로그아웃)
- 로그아웃 시 웹 /login 대신 네이티브 화면으로 전환

### 기타 수정
- `src/hooks/useAuth.ts` — 네이티브 앱에서 /login 리다이렉트 제거
- `src/components/landing/RootPageRouter.tsx` — 앱은 /home으로, 웹은 /login으로
- `src/app/mypage/page.tsx` — 회원탈퇴 후 네이티브 logout 처리
- `next.config.ts` — Supabase Storage 이미지 도메인 허용
- `supabase/migrations/014_ad_platforms.sql` (**실행 완료**)

### Android 빌드 설정
- `android/app/src/main/res/values/strings.xml` — Supabase anon key, Google Web Client ID 설정
- `android/app/google-services.json` — 디버그/릴리즈 SHA-1 등록 완료
- AdMob 테스트 기기: 갤럭시 (`aef92330-b493-41e8-85b1-a50a76dbb7bd`), iOS 등록 완료

## 2026-05-29 주요 변경 사항 (메인 앱)
- `src/app/api/invite/info/route.ts` — `purpose` 필드가 `family_groups.settings` JSONB에 저장됨 버그 수정
- `src/components/NativeAppProvider.tsx` — Universal Link + 커스텀 스킴 통합 핸들러
- `supabase/migrations/013_ad_system.sql` — 광고 시스템 (**Supabase에서 실행 완료**)
- `supabase/migrations/014_ad_platforms.sql` — platforms 컬럼 (**Supabase에서 실행 완료**)

## 상세 문서 위치
- `docs/` (레포 내부) — `docs/24-project-work-tracker.md`에서 현재 작업을 확인한 뒤 `docs/10-ai-handoff-guide.md`와 연결된 상세 문서를 읽으세요.
- ⚠️ `/Users/edwin/Sync-NAS/.../Gleaum/docs/`는 과거 백업 사본으로 레포 내부 `docs/`보다 오래되어 있을 수 있으니 참조하지 마세요. 항상 레포 내부 `docs/`를 기준으로 삼으세요.
<!-- END:architecture-rules -->
