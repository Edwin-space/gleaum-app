# 10. AI 인수인계 가이드 (AI Handoff Guide)

> 이 문서는 어떤 AI(Claude, Gemini, GPT 등)라도 이 프로젝트를 이어받아 즉시 작업할 수 있도록 작성된 **최우선 참고 문서**입니다.
> **최종 업데이트**: 2026-07-23
>
> 현재 작업과 다음 우선순위는 `docs/24-project-work-tracker.md`가 단일 기준이다. 이 문서는 아키텍처와 인수인계 맥락을 설명하고, 작업 상태는 트래커에서 관리한다.

---

## 🚨 절대 규칙 (작업 전 반드시 읽기)

1. **백엔드/DB 구조 절대 변경 금지** — `supabase/schema.sql`, `src/lib/db.ts`, `src/types/index.ts`의 핵심 구조는 건드리지 말 것.
2. **단일 DB 진입점 유지** — 모든 Supabase 쿼리는 반드시 `src/lib/db.ts`에만 추가.
3. **디자인 시스템 필수 참조** — UI 작업 전 루트 `DESIGN.md`와 `design-system-ui.html`을 읽는다. 웹의 테마 대응 배경/텍스트/테두리는 `src/styles/tokens.css`의 `var(--theme-*)`를 사용하고 새 고정 `bg-white`, `text-black`, 임의 Hex를 추가하지 않는다. 기존 파일의 Tailwind/인라인 스타일 방식은 유지하되 토큰 규칙을 우선한다.
4. **브랜드 컬러**:
   - Brand Blue: `#0084CC`
   - Teal: `#0CC9B5`
   - Green: `#2EE895`
   - Dark Navy: `#1A1B2E` / `#2D2E4A`
   - Background: `#FAFAFD`
   - ⚠️ **Purple(`#5A32FA`)은 완전 폐기**
5. **RLS 보안** — 새 테이블 생성 시 반드시 RLS 활성화 + `my_space_ids()` 기반 정책 추가.
6. **TypeScript 엄격 모드** — 타입 오류 없이 `npm run build` 통과해야 함.
7. **배포** — `npx vercel --prod` 로 직접 배포. 또는 `git push origin main` → Vercel 자동 배포.
8. **AI 간 작업 동기화** — 작업 시작·진행·완료·차단 시 `docs/24-project-work-tracker.md`의 동일 ID와 작업 일지를 갱신한다. 아키텍처·운영 방식이 바뀐 경우에만 이 문서와 상세 문서도 함께 갱신한다.
9. **제품 방향 유지** — 글리움은 **개인 중심 + Space 확장형 토털 라이프 관리 서비스**. 개인 단독 사용이 기본, 공간은 선택적 확장.
10. **hooks 임포트 경로** — `useIsDesktop()`은 `@/hooks/useMediaQuery`에서 import (NOT `@/hooks/useIsDesktop`).
11. **NAS 자동 동기화** — `git push` 후 `.git/hooks/post-push` 훅이 자동으로 NAS 동기화. 훅이 없는 경우: `bash scripts/install-hooks.sh` 실행.
12. **`/family` 경로 폐기** — `/family`는 `/space`로 영구 리다이렉트. 새 코드에서 `/family` 참조 금지.
13. **Space 용어 통일** — 코드/문서에서 "가족(family)" → "공간(space)" 용어 사용. DB 테이블명(`family_groups`)은 하위 호환으로 유지.
14. **개인 공간 / 공유 공간 구분** — 모든 사용자는 `preferences.personalSpaceId`로 개인 공간을 식별. 공유 공간은 `sharedSpaceId`/현재 `family_group_id`로 분리 판단. 자세한 내용은 아래 "공간 아키텍처" 섹션 참고.
15. **공간 데이터 경계 절대 보장** — 개인 일정/지출은 반드시 개인 공간에만 저장하고, 공유 공간 화면은 `visibility='private'` 데이터를 절대 표시하지 않음.
16. **Android Native Port는 Web 정보 구조 + Material 3 구현** — Mobile Web의 기능·문구·정보 순서·데이터 계약을 유지하되, Android 컴포넌트는 공식 Compose Material 3와 `GleaumTheme` 공통 컴포넌트로 구현한다. 임의 그라데이션, iOS 스타일 복제, 화면별 별도 하단 네비게이션 금지. `docs/17-android-native-port.md`, `docs/19-android-material3-redesign-plan.md`, `docs/22-android-material3-ui-audit.md`를 먼저 읽는다.

---

## 현재 앱 상태 (2026-07-23 기준)

### 서비스 현황
- **프로덕션 URL**: `https://www.gleaum.com`
- **GitHub**: `Edwin-space/gleaum-app`; 최신 작업 브랜치는 `codex/platform-parity-sync-20260723`
- **최신 배포**: 2026-07-23 Vercel Production `dpl_G4kCYuzC2Cjz79LAtbVUzXiKELJN`. 자녀 선택 이메일·72시간 일회성 토큰 claim·보호자 승인/거절·공유/QR와 Android 초대 로그인 경로 보존까지 반영. 공개 랜딩 200, 신규 API 미인증 401, runtime error 0 확인.
- **Google Play**: 프로덕션 배포 승인·운영 이력 있음. 로컬 Android 빌드 버전은 `versionCode 26`, `versionName 1.1.5`
- **Git 기준점**: `codex/platform-parity-sync-20260723`, 원격 기능 기준 `d8b7a51`.
- **현재 작업 경로**: `/Volumes/WD_BLACK/Ai Works/gleaum`. 소스·문서·공개 스토어 애셋은 Git에 보존됐고, `.env.local`, release keystore·비밀번호, 빌드 캐시는 Git 외부 자산이다.
- **외부 작업 인수인계**: `docs/23-external-work-checkpoint.md`가 복사 방법과 외부 의존성의 단일 체크포인트다. 맥미니의 `stash@{0}`는 동기화 전 오래된 로컬 작업 백업이므로 최신 브랜치에 자동 적용하지 않는다.

### 최근 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-23 | iOS 재개 1단계 `IOS-007`을 진행했다. Xcode가 누락된 개발 구성요소를 설치하고 stale CoreSimulator 1051.54를 1051.55로 교체해 iOS 26.4/26.5 런타임을 복구했으며 iPhone 17 Pro iOS 26.5 시뮬레이터에서 Debug 빌드·설치·콜드 스타트를 확인했다. `App.entitlements`를 실제 타겟에 연결하고 Push Notifications·Associated Domains·Sign in with Apple capability를 구성했으며, Debug/Release APNs 환경을 분리했다. `PrivacyInfo.xcprivacy`가 기존에는 Resources에 없어 앱 번들에 포함되지 않던 결함을 수정하고 실제 수집 범위를 보강했다. 미사용 카메라·사진·마이크·현재 위치·ATT·background fetch 선언을 제거하고 캘린더·Face ID·remote notification만 유지했다. `AppDelegate`는 `UNUserNotificationCenterDelegate` 조건부 캐스팅이 항상 실패하던 문제를 정식 프로토콜 채택으로 수정했다. plist lint, simulator Debug, iphoneOS Release 무서명 build와 번들 manifest 검증은 통과했다. 현재 Xcode 계정은 Personal Development Team이라 Apple 로그인·Push·Associated Domains 프로비저닝을 만들 수 없으므로 유료 Apple Developer Program Team 연결 후 실제 iPhone 서명 빌드가 필요하다. |
| 2026-07-23 | Android 자녀 연결을 Compose Material 3로 전환했다. `NativeChildAccountActivity`/API/화면에서 보호자 목록·등록·8자리 OTP·필수 동의·초대 공유·후보 승인/거절·자녀 claim을 처리하며, 자녀 API 8개는 Cookie·Bearer 인증을 공통 지원한다. Android Google 로그인은 Credential Manager 계정 선택 → Google ID token → Supabase ID token grant → 기존 `SessionManager` 저장 방식으로 교체했다. debug 서명 SHA-1은 `9D:9E:3B:4F:AB:1C:B3:46:C7:9F:D0:70:F4:A1:07:49:17:7B:64:E2`이므로 Firebase 등록과 최신 `google-services.json` 반영 뒤 실기기 검증해야 한다. 공개 `/`은 실제 Android 정보 구조를 익명화한 PC·태블릿·모바일 반응형 서비스 소개로 재구성했다. iOS 현황과 재개 순서는 `docs/27-ios-resumption-readiness.md`에 기록했다. |
| 2026-07-23 | 자녀 계정 연결에서 Google 이메일 필수 입력을 제거하고 이름·생년월일·보호자 관계 중심 등록으로 변경했다. 이메일은 선택적인 계정 제한값이며 입력한 경우에만 해당 검증 이메일이 초대를 사용할 수 있다. 72시간 일회성 토큰은 OS 공유·문자·QR로 전달하고, Google/이메일 로그인 계정의 claim은 `candidate_email/provider/claimed_at`만 저장한다. 보호자 본인 claim은 차단되며 최종 승인 전 `space_members`·`account_age_profiles`를 생성하지 않는다. 보호자는 후보 계정을 확인해 승인 또는 거절·재초대할 수 있다. Android는 `NativePendingRouteStore`로 OAuth/이메일 로그인 전후 `/invite/child/[token]`을 보존한다. 운영 migration `20260723053050_child_invite_token_binding.sql`, commit `b124305`, Production `dpl_G4kCYuzC2Cjz79LAtbVUzXiKELJN`, TypeScript, 자녀 테스트 3/3, 데이터 경계 9/9, capability 4/4, Next/Android build, 공개 랜딩 200·신규 API 401·runtime error 0까지 확인했다. 보호자·자녀 실계정 회귀만 남는다. |
| 2026-07-23 | 보호자 이메일 확인 프로토콜을 실제 Supabase 발송 방식과 일치시켰다. 기존 코드는 Magic Link를 기대했지만 운영 템플릿이 `{{ .Token }}` OTP를 보내고 있어 사용자가 받은 코드를 입력할 곳이 없었다. 자녀 관리 화면에 OTP 입력·재발송 UI와 `/api/spaces/children/guardian-verification/verify-otp`를 추가했고, OTP 성공 시에만 DB 도전의 `verified_at`을 기록하도록 보강했다. 필수 동의 RPC는 이 증적이 없으면 거부하며 증빙 방법은 `email_otp`, 정책 버전은 `2026-07-23-email-otp-v2`다. migration `20260723035907_guardian_email_otp_verification.sql` 운영 적용과 Production `dpl_Gc7Dmx7ahfUVTw7qvnEY7GYEzLfr` 배포 완료. 이어 Supabase의 고정 Magic Link/OTP 슬롯이 보호자 전용으로 잠기지 않도록 보호자 요청에 전용 `emailRedirectTo`를 추가하고 `{{ .RedirectTo }}` 조건 분기형 `supabase/email-templates/magic-link-or-otp.html`로 변경했다. 운영 제목은 `[글리움] 이메일 확인 코드`이며 일반 이메일/비밀번호 가입의 Confirm sign up 템플릿과는 분리된다. 최종 코드는 Production `dpl_3M2He5p9F3UfBs5H4tW3u7kRXZwy`에 배포했고 운영 API의 인증 경계 `401`을 확인했다. 실메일이 8자리임을 확인해 UI·API·템플릿을 8자리로 통일했으며 해당 수정의 배포와 OTP 완료 회귀가 남았다. |
| 2026-07-23 | Android 가족 공간에서 `초대 → 자녀` 진입 시 WebView가 즉시 네이티브 홈으로 복귀하던 오류를 수정했다. `NativeAppProvider.applyNativeSession()`이 모든 경로에서 후속 로그인 경로를 강제하던 것이 원인이며, 네이티브 세션은 항상 동기화하되 `/`·`/login`에서만 `/home` 또는 `/onboarding`으로 이동하도록 제한했다. Production `dpl_8haU9476UgHXLDmZ3Pnd8maqwXJN` 배포 후 `SM_F731N`에서 `MainActivity` 유지와 WebView URL `/space/children?sid=...` 고정을 확인했다. 자녀 화면 진입 시 앱 잠금이 활성 상태라면 지문/PIN 인증은 정상적으로 선행된다. |
| 2026-07-23 | Vercel 설치 로그의 신규 의존성 보안 경고를 확인해 Next·eslint-config-next를 `16.2.10 → 16.2.11`로 갱신하고 exact version으로 고정했다. Next 자체 high 권고 4건은 제거됐다. 다만 Next 16.2.11이 `sharp ^0.34.5`를 요구하는 동안 신규 libvips high 권고가 `npm audit --omit=dev`에 Next 경유 포함 2건으로 남는다. 검증되지 않은 sharp 0.35.0 강제 override는 이미지 최적화 회귀 위험 때문에 적용하지 않으며 공식 Next 호환 패치가 나오면 `SEC-009`에서 즉시 갱신한다. |
| 2026-07-23 | Android 가족 공간의 멤버 관계와 공간 권한을 분리했다. `space_members.family_role`은 아빠/엄마/조부모/배우자/자녀/형제·자매/보호자/가족/기타 표시값이며 접근 제어는 계속 `role=admin/editor/viewer`만 사용한다. 가족 공간의 멤버 초대는 공간 설정에서 제거하고 멤버 탭의 전용 시트에서 `일반 가족 구성원` 또는 `자녀`를 먼저 선택하도록 변경했다. 일반 가족은 코드/링크, 자녀는 기존 보호자 확인·동의·일회성 초대 화면으로 연결한다. migration `20260723024521`, `20260723025504`를 운영 Supabase에 적용하고 최종 Production `dpl_2j1WLB6oEb2zVbupH7J98XLaqUHy` 배포, `SM_F731N` debug 실기기에서 관계 표시·변경 메뉴·초대 유형·설정 분리를 확인했다. 현재 운영 멤버 데이터는 임의 변경하지 않았으며 관계 미지정 멤버는 `가족 구성원`으로 안전 표시한다. Web/iOS 동등 UX는 플랫폼 후속 큐다. |
| 2026-07-23 | Android Kakao AdFit 실기기 미노출을 복구했다. 가족 계정 도입 전 생성된 모든 일반 사용자가 `account_mode=unknown`이라 `canShowAds=false`가 되던 정책을 제한 계정 4종만 차단하도록 변경하고 migration `20260723021003_allow_ads_for_legacy_standard_accounts.sql`을 운영 Supabase에 적용했다. Vercel Production `dpl_7aJ2HWP9rZNoT1CTEGWcvc4rZcCM` 배포 후 실기기 account context가 `unknown + canShowAds=true`로 갱신됨을 확인했다. 이어 시작 선조회 스레드에서 Google App Open Ad를 호출해 앱이 종료되며 AdFit 요청 전에 중단되던 문제를 메인 UI 스레드 강제로 수정했다. `SM_F731N`에서 AdFit 요청·로드 로그와 SDK 팝업의 `오늘 그만 보기`·`닫기`·광고 CTA 렌더링, 크래시 0건을 확인했다. |
| 2026-07-23 | 로그인 실기기 `SM_F731N`에서 Android 콜드 스타트와 홈/일정/공간/가계부/전체 메뉴 왕복을 확인했다. 전체 메뉴의 `기기 일정 가져오기`가 WebView 인증 리다이렉트와 네이티브 라우터 때문에 홈으로 돌아가던 결함을 재현한 뒤, `NativeCalendarImportActivity`와 `NativeDeviceCalendarRepository`로 완전 네이티브화했다. 선택 캘린더의 어제~30일 뒤 이벤트를 조회하고 글리움 표식 및 제목·시작 시각 중복을 제외하며, 선택 항목만 private 개인 일정으로 저장한다. 캘린더 설정 목록의 긴 계정명·스크롤·접근성 역할과 폴더블 하단 시스템 인셋도 보정했다. 후보 3개 미리보기와 Activity 유지, 크래시 0건을 실기기에서 확인했으며 운영 데이터 변경을 피하려고 실제 가져오기 버튼은 누르지 않았다. Android unit/assemble 및 debug APK 설치 통과. 가족 공간 전환 RPC는 운영 DB 존재·authenticated 실행 권한을 확인했으나 일반 공유 공간의 실제 승격은 비가역 작업이라 사용자 명시 테스트 전까지 `FAM-008`에 유지한다. |
| 2026-07-23 | Android 우선 실행으로 전환. 가족 공간 전환 실패는 앱이 호출하는 운영 `/api/native/spaces/[id]/family`가 미배포되어 `404`를 반환한 것이 직접 원인이었다. 최신 공통 API를 Vercel Production `dpl_9H8AaLttD7fsXuZUzzMdMycQNcHY`에 배포해 무인증 요청이 정상 `401` 계약으로 바뀐 것을 확인했다. Android는 스플래시 2초 동안 account context·홈·공간·일정·가계부·알림을 병렬 선조회하고 프로세스 캐시를 화면 간 재사용하도록 변경했다. 일정·가계부·알림의 무조건 `onResume` 재호출을 제거하고 홈·공간·일정·가계부·알림에 Material 3 pull-to-refresh를 연결했으며, 쓰기 작업 후 관련 캐시만 무효화한다. `npm run build`, Android unit/lint/assemble 통과. 로그인 실기기 가족 전환과 선조회 체감 검증은 남아 있다. Web은 라우트 이동 fetch 감사, iOS는 동일 시작 선조회 정책을 각 플랫폼 단계에서 후속 반영한다. |
| 2026-07-23 | 맥북 최신 브랜치 `codex/platform-parity-sync-20260723`을 맥미니 작업공간에 동기화하고 체크리스트를 재대조했다. 플랫폼 파리티·공간 수명주기·알림 설정·Web 세션 폴백 기능은 `42b53b0`, Google Play 한국어 등록정보와 익명화 폰 스크린샷 6장은 `564b923`에 보존됐다. 맥미니 lockfile 의존성을 복원한 뒤 데이터 경계 9/9, capability 4/4, 알림 설정 2/2, root production build 54/54, backoffice build, Android debug compile/unit/lint/assemble 738 tasks를 통과했다. 운영 완료가 아닌 항목은 `FAM-008`, `OPS-004`, `PAR-001`, `AND-001`에 배포·실기기 검증으로 유지한다. |
| 2026-07-14 | Android Material 3 UI 품질 기반 마감. light/dark ColorScheme·Typography·Shapes를 명시하고 공통 adaptive navigation, 상태 카드, 안내 배너, 비클릭 배지, 의미색 토큰을 적용했다. 홈·일정·가계부·공간·전체·알림·온보딩 Compose gate가 활성 상태이며 `assembleDebug`, `lintDebug` 오류 0건을 확인했다. 코드 감사 평균은 90.8/A, XML 로그인은 86/B다. 마지막 연결 단말은 잠금 상태라 최종 시각 QA는 미완료. 상세는 `docs/22-android-material3-ui-audit.md`. |
| 2026-07-14 | 외장 저장장치 이동 체크포인트 추가. 현재 HEAD `8fc41c6` 이후의 다수 변경·신규 파일은 미커밋 상태라 Git clone만으로 복원되지 않는다. `.git`, `.env.local`, untracked 파일과 저장소 외부 `~/gleaum-release.keystore`를 구분해 옮겨야 하며, 복사·복구 절차는 `docs/23-external-work-checkpoint.md`를 따른다. |
| 2026-07-13 | 가족 자녀 초기 운영 흐름 구현. SMS 비용을 쓰지 않고 보호자 로그인 이메일의 Supabase Auth 확인 링크로 계정 이메일을 재확인한 뒤 `service_registration`, `personal_data_processing`, `family_data_sharing`을 각각 동의받는다. 보호자는 OS 공유 시트로 자녀에게 초대를 직접 전달하며 자녀 claim은 `approval_pending`만 만들고 공간 멤버를 생성하지 않는다. 보호자 최종 승인 후에만 viewer 권한과 연령별 account mode를 적용한다. migration `022_guardian_email_consent_flow.sql` 운영 적용, 신규 테이블·함수·RLS 확인 완료. 위치·마케팅은 비활성. 활성 자녀 1,000명/월 연결 500건/분쟁 1건/위치·결제 도입 시 SMS OTP 또는 PASS/NICE/KCB로 반드시 전환한다. 약관·개인정보처리방침 개정 시행일은 2026-07-20이며 사전 고지 후 운영해야 한다. |
| 2026-07-13 | 가족 공간 자녀 계정 백엔드 뼈대 추가. migration `020_family_child_foundation.sql`에 `family_groups.space_type`, 가입 전 자녀 프로필, 보호자 관계/검증, 항목별 동의, 일회성 초대, 계정 연령 상태와 RLS를 정의했다. 자녀 연결은 검증된 Google 이메일 + 일회성 초대 + 보호자 검증/동의를 DB 함수 한 트랜잭션으로 확인한다. 만 14세/19세 계정 모드 전환과 공통 `/api/session/context` capability 계약을 추가했다. `021`에서 신규 외래키 인덱스와 RLS initplan을 보강했다. 운영 Supabase 적용 및 Advisor 검증 완료, 운영 UI는 보호자 본인확인 사업자 연동 전까지 비노출한다. 상세 기준은 `docs/21-family-child-account-foundation.md`. `npm run build` 통과. |
| 2026-07-13 | Android 기능 마감 보강. 기기 캘린더 설정 화면에 외부 일정 가져오기를 추가했다. 사용자가 선택한 기기 캘린더의 앞으로 30일 일정만 미리보기·선택 후 **개인 공간의 private 개인 일정**으로 생성하며, 글리움 표식(`gleaum:schedule:`) 이벤트와 제목·시작 시각이 같은 개인 일정은 재가져오기에서 제외한다. 공유 공간 일정에는 절대 쓰지 않는다. Native 전체 메뉴의 캘린더 설정에서 해당 가져오기 화면으로 진입할 수 있다. 가계부는 이미 `ledger_entries` 기반으로 수입/지출/반복 예정/월별 자동 발생을 지원하며, Android Compose 가계부에 서버 카테고리 집계 기반 지출 분석을 연결했다. 이미지·파일 첨부 및 가족/자녀(보호자 초대, 동의, 위치, 루틴)는 명시적으로 이번 범위에서 제외했다. |
| 2026-07-13 | Android 운영 안정화 보강. Kakao AdFit은 홈 내부 배너가 아닌 SDK 제공 하단 전환형 팝업(`AdFitPopupAdLoader`)으로 수정했고, 광고 코드/스크립트가 UI에 텍스트로 노출되는 것을 차단. `light/dark/system` 모드가 Compose·WebView·Android 상태/내비게이션 바에 함께 반영되도록 브리지를 보강했으며, 설정 저장 후 Activity 재생성 및 주요 Native Activity `onResume` 재적용으로 라이트 모드 복귀 문제를 보정. Compose 공통 셸 및 폼/상세/온보딩 화면은 600dp 이상에서 760dp, 840dp 이상에서 960dp 최대 폭을 적용해 태블릿·폴더블에서 폰 UI가 과도하게 늘어나지 않게 함. Android 기기 캘린더는 글리움 표식 일정만 생성·수정·삭제하는 수동 30일 동기화와, 사용자가 전체 메뉴에서 명시적으로 켤 수 있는 네이티브 일정 자동 반영을 지원한다. Android Debug·Next.js production build 통과, 실기기 `R3CW803L3WH` 최신 debug APK 설치/실행 확인. |
| 2026-06-19 | PC 웹 루트 랜딩 리다이렉트 보정. `RootPageRouter`에서 `useIsDesktop()` hydration 초기값 `false` 때문에 PC에서도 `/login`으로 먼저 이동할 수 있던 문제를 수정. 리다이렉트 effect 내부에서 `window.matchMedia('(min-width: 1024px)')`로 실제 브라우저 뷰포트를 재확인해 PC는 랜딩 페이지를 유지하고, 모바일 웹/네이티브 앱 로그인 이동 정책은 유지. `npm run build` 통과 |
| 2026-06-18 | Android 이메일 로그인/회원가입 네이티브 전환. 기존 `LoginActivity`의 `이메일로 계속하기`는 `MainActivity start_path=/login?view=email`로 WebView 웹 로그인 폼을 호출했으나, 태블릿/앱 일관성 문제로 네이티브 폼으로 변경. `LoginActivity`에서 Supabase Auth REST API(`/auth/v1/token?grant_type=password`, `/auth/v1/signup`)를 직접 호출하고, 성공 시 `SessionManager`에 세션 저장 → 기존 `MainActivity` localStorage 주입 구조 사용. 회원가입은 이름/닉네임 + 필수 동의 체크 포함. 이후 동의 UX를 보강해 `[필수] 전체 동의`, 개별 동의 동기화, 이용약관/개인정보처리방침 보기 링크 추가. `보기`는 외부 브라우저 이탈 방지를 위해 `LegalWebViewActivity` 인앱 브라우저로 열고 하단 `닫기` 버튼으로 회원가입 화면 복귀. 태블릿에서는 웹 nav/footer/배경 블롭을 숨기고 본문 폭/패딩/텍스트 크기를 문서 뷰에 맞게 재조정. Android `:app:assembleDebug`, `npm run build` 통과 |
| 2026-06-18 | Android 홈 Native Port 착수 전 스냅샷 문서 추가: `docs/18-android-home-port-snapshot.md`. `MobileHome.tsx`, `BottomNav.tsx`, `InlineFeedAd.tsx`, `ScheduleCard`, `CalendarView` 기준으로 섹션 순서/수치/문구/금지 사항을 고정. Android에는 비활성 골격 `NativeHomePortActivity`, `NativeHomePortModels` 추가. `NativePortFlags.ENABLE_NATIVE_HOME=false`라 운영 진입 흐름 영향 없음 |
| 2026-06-18 | Android Native Port 기준 문서 추가: `docs/17-android-native-port.md`. Android는 웹 UI 안정화가 아니라 Mobile Web UI를 정답지로 한 단계적 Native Port를 목표로 한다. 단, 화면 재디자인 금지, iOS 스타일 복제 금지, 비활성 구현 → 비교 검증 → 내부 테스트 활성화 → 운영 활성화 순서 준수 |
| 2026-06-18 | Android/WebView 푸시 등록 경로 정리. 네이티브 앱은 전역 `FCMProvider` → `useFCM` → `@capacitor-firebase/messaging` 경로만 사용하도록 하고, `MobileSpace`의 `useNativePush()` 중복 호출 및 `src/hooks/useNativePush.ts` 구 경로 제거. `usePushSubscription()`은 네이티브 앱에서 스킵해 Web Push(service worker + PushManager)가 Android WebView에서 중복 실행되지 않도록 보정. 네이티브 FCM foreground listener cleanup은 개별 listener handle 제거로 변경. `npm run build`, Android `:app:assembleDebug` 통과 |
| 2026-06-18 | Android 네이티브 홈 레이어 1차 시도 후 보류. `MainActivity` 위에 별도 네이티브 홈 UI를 얹는 방식은 WebView 홈 복귀 무한루프와 모바일 웹 대비 디자인 이질감이 확인되어 제거. Android는 기존 모바일 웹 UI를 유지하고, 네이티브화는 로그인/세션/생체인증/캘린더/푸시 등 브리지와 권한 안정화 중심으로 진행해야 함. Android `:app:assembleDebug` 통과 |
| 2026-06-15 | 애플·카카오 로그인 UI 제외(심사·연동 부담으로 보류) + 표현을 "이메일"로 통일("이메일로 로그인/회원가입"). **네이티브 앱 이메일 로그인 파리티 추가**: `LoginActivity`에 "이메일로 계속하기" 버튼 → `MainActivity`를 `start_path=/login?view=email`로 실행 → WebView가 웹 이메일 폼 표시. `/login`은 `?view=email`/`?mode=signup` 딥링크 지원. `NativeAppProvider`가 `onAuthStateChange(SIGNED_IN/TOKEN_REFRESHED)`에서 `saveNativeSession()` 호출 → WebView 이메일 로그인 세션을 네이티브에 저장(콜드 재실행 유지). android assembleDebug 통과 / 런타임은 기기 테스트 권장 |
| 2026-06-15 | 이메일/비밀번호 회원가입·로그인 추가 + 로그인 화면 소셜 우선 재구성. 구글 우선 배치, 그 아래 이메일 로그인/회원가입 진입 버튼. 이메일 회원가입에 `[필수]` 만 14세 이상 / 이용약관 / 개인정보 수집·이용 동의 체크박스(전체 동의 토글) 추가 — 정보통신망법·개인정보보호법 준수. `useAuth`에 `signUpWithEmail`/`signInWithEmail` 추가 (`src/hooks/useAuth.ts`, `src/app/login/page.tsx`) |
| 2026-06-15 | 가계부 정기지출(매월/매주/매년) 이월 구현. 기존엔 다음 주기 인스턴스가 어디서도 생성되지 않던 치명적 결함 → `materializeRecurringExpenses()`(가계부 진입 시 lazy, `src/lib/db.ts`) + 서버 크론 `/api/cron/recurring-expenses`(`016`, 매일 00:10 KST) 이중 보강. 부수: 고정지출 수정 시 end_time이 설정돼 크론 missed 전환 설계와 충돌하던 버그, 변동지출 "반영 N건" 집계 오류, 날짜 입력 UTC 자정 파싱(타임존) 수정 |
| 2026-06-15 | 웹 푸시(FCM)가 운영에서 전체 미작동하던 문제 수정. `src/proxy.ts` 미들웨어 matcher가 `.js/.json`을 제외하지 않아 `firebase-messaging-sw.js`·`sw.js`·`manifest.json`이 미들웨어를 통과 → `NextResponse.next()` 처리로 Content-Type이 `text/plain`이 되고 전역 `nosniff`와 겹쳐 서비스워커 등록이 "ServiceWorker script evaluation failed"로 실패. matcher 제외 확장자에 `js/mjs/json/css/woff/woff2/webmanifest` 추가. 운영 콘솔에서 `[FCM] 토큰 발급 성공` 검증 |
| 2026-06-15 | Pretendard 폰트가 전 서비스에서 미적용되던 문제 수정. `layout.tsx`의 문자열 `onLoad="this.media='all'"` 핸들러를 React가 무시해 폰트 CSS가 `media="print"`로 영구 고착 → 일반 stylesheet 로드로 변경. CSP에 `www.gstatic.com`(FCM SW의 importScripts)·`cdn.jsdelivr.net`(Pretendard CSS/woff2)을 허용하고 `worker-src 'self'` 추가 (`next.config.ts`) |
| 2026-06-15 | 데스크탑에서 레이아웃이 통째로 다시 그려지던 밀림현상(React #418 hydration) 수정. `useMediaQuery`가 SSR=false / 데스크탑 클라이언트=true를 반환해 서버는 Mobile, 클라이언트는 Desktop 레이아웃을 기대 → 전체 트리 hydration 불일치. `useSyncExternalStore`(getServerSnapshot=false)로 서버/첫 렌더 일치. 시간대 인사말은 `useTimeGreeting` 훅으로 분리, `new Date()` 기반 날짜 표시는 `suppressHydrationWarning` 적용 (`src/hooks/useMediaQuery.ts`, `src/hooks/useTimeGreeting.ts`, 홈 2종) |
| 2026-06-15 | Supabase 크론 6종을 `www.gleaum.com` 도메인으로 통일(automations·reminders가 구 `gleaum-app.vercel.app`, cleanup이 apex `gleaum.com` 사용하던 것 정리). `012`/`016` 등록 SQL의 `$$` 도크쿼팅 중첩 버그(DO 블록 안 `format($$...$$)`가 "syntax error" 유발)를 평문 `cron.schedule(name, schedule, '명령문')` 형태로 재작성. `CRON_SECRET`은 Vercel·로컬·크론 6종에서 동일하게 관리하며 실제 값은 문서에 기록하지 않음 |
| 2026-06-02 | Android 기기 캘린더 연동 1차 구현. `NativeCalendarPlugin` 추가, READ/WRITE_CALENDAR 권한 연결, 설정 화면에서 권한 요청/캘린더 선택/앞으로 30일 일정 수동 내보내기 지원 |
| 2026-06-02 | iOS 스플래시 후 웹 로그인 flash 보정. JS `hideSplash()`가 300ms에 스플래시를 강제 종료하던 문제를 3000ms로 맞추고, 네이티브 LoginViewController는 0.45초에 미리 올리도록 조정 |
| 2026-06-02 | iOS 스플래시/로그인 전환 UX 보정. Capacitor SplashScreen 3초 적용, iOS LoginViewController 표시를 2.75초 지연시켜 스플래시 종료 직전 cross-dissolve로 부드럽게 전환 |
| 2026-06-02 | iOS 네이티브 로그인 OAuth UX 보정. `LoginViewController` Google 아이콘 asset 추가, SFSafariViewController fullscreen 적용, OAuth 성공 후 Safari/Login 스택 자동 dismiss, JS OAuth Browser.close await 제거 |
| 2026-06-02 | P0 데이터 경계 보강. `getScheduleById()` 단일 조회에 private 생성자 필터를 추가하고, `supabase/migrations/015_harden_private_schedule_rls.sql`로 schedules/schedule_participants RLS를 강화 |
| 2026-06-02 | PC Web / Mobile Web / Android App / iOS 예정 앱의 기능 싱크 기준표 추가. `docs/15-feature-parity-matrix.md`를 신규 작성하고, 공통 기능/플랫폼 전용 기능/불일치 점검 대상을 정리 |
| 2026-06-02 | 공유 테마 모드 시스템 추가. `light/dark/system` 3모드와 `ThemeProvider`, `ThemeModeSelector`, theme 토큰 기반 shell UI 반영 |
| 2026-06-01 | 네이티브 생체인증 앱 잠금 추가. Android 지문/생체인증 및 iOS Face ID/Touch ID 플러그인, 온보딩/마이페이지 설정/앱 잠금 게이트 반영 |
| 2026-06-01 | Android Google OAuth 네이티브 콜백 세션 저장 보정. 로그인 후 모바일 웹 로그인 화면으로 되돌아가는 문제를 막기 위해 implicit callback 토큰 저장 처리 추가 |
| 2026-05-28 | 공간 초대문/링크 생성 안정화. 복사/공유 전 `/api/invite/info`로 코드 유효성을 확인하고, DB에 없는 오래된 코드면 자동 재발급 후 최신 코드로 초대문 생성 |
| 2026-05-28 | 백오피스 Firebase App Distribution 연동 보정. REST API 경로를 projectNumber 기준으로 수정하고, 테스터는 `projects.testers.list` + 그룹 필터로 조회. `/releases` 페이지에 사용 안내/진단 UI 추가 |
| 2026-05-28 | Android Studio Sync 오류 수정. Firebase App Distribution Gradle DSL 제거, 배포는 `scripts/distribute-android.sh` Firebase CLI 방식으로 유지. `:app:tasks`, `:app:assembleDebug` 통과 확인 |
| 2026-05-28 | Android Firebase Performance Gradle 플러그인 제거. AGP 9.x에서 Transform API 제거로 빌드 호환 불가하여 SDK dependency는 유지하되 Gradle perf-plugin 적용은 제거 |
| 2026-05-28 | 백오피스 릴리즈 관리 + Remote Config 편집기 추가. Firebase App Distribution 릴리즈 조회/테스터 관리, Remote Config 플래그 토글 기능 반영 |
| 2026-05-28 | Firebase 통합 기반 추가. Crashlytics, Remote Config, App Check, App Distribution 스크립트/설정 추가. Performance SDK는 의존성 유지, Gradle 플러그인은 제거됨 |
| 2026-05-28 | 고정지출 연체 알림 + 주간 소비 다이제스트 + D-day UI 추가. `/api/cron/overdue-expenses`, `/api/cron/weekly-digest`, `012_cron_overdue_and_digest.sql` 추가 |
| 2026-05-28 | 가계부/공간 지출 개념 분리. `/budget`은 개인 가계부 전용으로 고정하고, 공간 지출은 공간 내부에서 관리하며 `내 가계부` 버튼으로 개인 가계부에 반영 |
| 2026-05-28 | 공간 초대/역할/아바타 안정화. 코드 복사는 순수 초대 코드만 복사, 신규 참여 기본 역할은 viewer, 역할 표시명은 공간 지기/공간 운영자/공간 멤버로 변경, Google avatar URL 레이아웃 깨짐 방지 |
| 2026-05-28 | 공간 데이터 경계 보정. 개인 가계부/개인 일정은 `personalSpaceId`에만 저장하고, 공유 공간/홈/일정 화면에서는 `visibility='private'` 데이터를 제외. `getSpaceWithMembers()`/`getMySpaces()`의 Supabase 조인 의존 제거 |
| 2026-05-27 | 가계부 일회성 지출이 `pending`/결제 예정 일정처럼 보이던 문제 수정. 일회성 지출은 `completed + reminder_only`로 저장하고 홈/일정 타임라인에서는 제외 |
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
| Firebase Crashlytics | ✅ 네이티브 사용자 ID 연동 기반 추가 |
| Firebase Remote Config | ✅ 웹/네이티브 유틸 + 백오피스 편집기 추가 |
| Firebase App Check | ✅ 초기화 유틸 추가 |
| Firebase App Distribution | ✅ Android 배포 스크립트 + 백오피스 릴리즈 관리 추가 |
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
| **가계부 — 일회성 지출 즉시 반영 처리** | `db.ts`, `budget/*`, `home/page.tsx`, `schedules/page.tsx` | ✅ 신규 |
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
| 이미지 첨부 실제 업로드 | 🟡 | UI만 있음, Supabase Storage 연동 필요 |
| 기기 캘린더 연동 | 🟡 | Google Calendar/Drive 연동은 제거됨. 네이티브 기기 캘린더 방식으로 재설계 필요 |
| 통계/분석 페이지 | 🟢 | 신규 개발 필요 |
| 네이티브 앱 출시 마무리 | 🔴 | Android 내부 테스트 업로드 완료. iOS는 APNs/유료 Apple Developer/Associated Domains 재활성화 필요 |
| Space 타입 확장 | 🟢 | `family_groups.type` 컬럼 추가 → 개인/연인/가족/모임 구분 |
| 일정 단건 외부 공유 | 🟢 | `/share/[scheduleId]` 공개 읽기 전용 뷰 |

---

## 🔴 다음 우선 작업 후보: 공간 경계 회귀 테스트

공간 데이터 경계는 2026-05-28에 코드 보정 완료. 다음에는 Supabase 실제 데이터 기준으로 회귀 테스트를 자동화하는 것이 좋음.

### 테스트해야 할 핵심 케이스
- 초대받은 사용자가 개인 지출을 등록해도 공유 공간 가계부/타임라인에 보이지 않음
- 공유 공간 지출은 공유 공간에만 보이고 개인 가계부에는 섞이지 않음
- 공유 공간 설정/멤버 화면은 `space_members` 기준으로 모든 멤버를 표시
- 개인 일정/지출은 `personalSpaceId`에 저장, 공유 일정/지출은 `sharedSpaceId`에 저장

## 최신 Claude 작업 확인 (2026-05-28)

Claude가 진행한 뒤 문서 반영이 누락되어 있던 핵심 변경입니다.

### 지출/알림
- `/api/cron/recurring-expenses`: 정기지출(매월/매주/매년) 이번 달 인스턴스 이월 생성 (매일 00:10 KST). 클라이언트 `materializeRecurringExpenses()`(가계부 진입 시)와 동일 로직의 서버 보강
- `/api/cron/overdue-expenses`: 고정지출 미결제 D+0/3/7 FCM + in-app 알림
- `/api/cron/weekly-digest`: 매주 월요일 09:00 KST 지난 7일 개인 지출 다이제스트
- `supabase/migrations/012_cron_overdue_and_digest.sql`, `016_cron_recurring_expenses.sql`: Supabase pg_cron 등록 SQL. **DO/format 없이 평문 `cron.schedule(name, schedule, '명령문')` 형태**(`$$` 중첩 금지). 실행 전 `<CRON_SECRET>` 치환 필수
- 가계부 PC/모바일 D-day UI: D-N, 내일 결제, 오늘 결제일, N일 경과 표시
- 모바일 홈 가계부 카드: 미결제 고정지출 건수 배지 표시
- ⚠️ 등록된 Supabase 크론 6종은 모두 `https://www.gleaum.com` 도메인 기준. `CRON_SECRET`은 Vercel 환경변수와 크론 요청에서 동일해야 하며 실제 값은 비밀 저장소에서만 관리. 상세는 `docs/09-deployment.md` 참조

### Firebase/Android
- `FirebaseServicesProvider`: App Check, Remote Config, Crashlytics 사용자 ID 초기화
- `src/lib/remote-config.ts`: feature flag 기본값 및 웹/네이티브 Remote Config fetch
- `src/lib/crashlytics.ts`, `src/lib/app-check.ts`, `src/lib/firebase-performance.ts` 추가
- `scripts/distribute-android.sh`: release APK 빌드 후 Firebase App Distribution 배포
- `firebase.json`: Firebase 프로젝트/App Distribution 설정
- AGP 9.x 호환 문제로 Firebase Performance Gradle plugin은 제거됨. Firebase App Distribution Gradle plugin/DSL도 Android Studio Sync 안정성을 위해 제거됨. `@capacitor-firebase/performance` 의존성은 유지하고, App Distribution 배포는 `scripts/distribute-android.sh`의 Firebase CLI 방식 사용

### 백오피스
- `/backoffice/releases`: Firebase App Distribution 릴리즈 관리. REST API는 `projects/{projectNumber}` 기준이며, 테스터는 전체 테스터 목록에서 `internal-testers` 그룹 포함 여부로 필터링
- `/backoffice/settings`: Remote Config 편집기
- 중복 사용자 앱 `/admin` 대시보드는 제거되고 백오피스 프로젝트로 통합

### 지출 카테고리 가이드
- `docs/Guide/expenses.md`: 고정지출/변동지출 1~3차 카테고리 설계 초안

## 🔴 기능 싱크 기준 (2026-06-02 추가)

상세 기준표는 `docs/15-feature-parity-matrix.md`를 먼저 확인한다.

- PC Web / Mobile Web / Android App / iOS 예정 앱은 같은 제품이어야 한다. UI 형태는 달라도 기능 상태, 진입 경로, 권한 정책, 데이터 경계는 동일한 의미를 가져야 한다.
- 네이티브 전용 기능은 웹에서 억지로 동작시키지 않는다. 대신 숨기거나 `앱 전용`, `준비 중`, `지원 예정`으로 명확히 안내한다.
- P0 회귀 대상은 로그인 세션 복귀, 초대 링크/코드, 개인/공간 데이터 경계, 공간 멤버/역할, 가계부/공간 지출 분리다.
- 설정 항목은 테마, 생체인증, 알림, 캘린더, 홈 화면 구성의 노출 정책을 웹/앱 기준으로 통일해야 한다.
- 기능 싱크 작업 후에는 이 문서와 `docs/15-feature-parity-matrix.md`를 같이 업데이트한다.

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
│   ├── useCurrentUser.ts  ← 현재 사용자 (spaceId, personalSpaceId, sharedSpaceId, hasSharedSpace, refresh)
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

### 공간 데이터 경계 규칙 (2026-05-28 보정)

- 개인 일정/지출 저장 대상: `personalSpaceId`
- 공유 일정/지출 저장 대상: `sharedSpaceId` 또는 명시적으로 선택한 공유 공간 ID
- `profiles.family_group_id`는 현재 활성/공유 공간 포인터로 취급. 공유 공간 참여 후 개인 데이터 저장 대상에 사용하면 안 됨
- `visibility='private'` 데이터는 공유 공간 화면, 공유 공간 타임라인, 공유 공간 가계부에서 제외
- Google OAuth 프로필 이미지 URL은 텍스트로 렌더링하지 말고 `UserAvatar` 컴포넌트로 이미지/이모지를 분기 처리
- `getSpaceWithMembers()`/`getSpaceMembers()`/`getMySpaces()`는 Supabase nested join에 의존하지 말고 멤버십과 프로필/공간을 분리 조회
- 기존 잘못 저장된 private 데이터 보정 SQL: `supabase/migrations/010_move_private_records_to_personal_space.sql`

### `useCurrentUser` 반환값

```typescript
const {
  user,           // User 객체
  profile,        // ProfileRow (raw DB data)
  familyGroupId,  // string | null — 현재 소속 공간 ID (하위 호환)
  spaceId,        // string | null — familyGroupId 와 동일 (신규 코드용)
  personalSpaceId,// string | null — 개인 일정/지출 저장 대상
  sharedSpaceId,  // string | null — 공유 일정/지출 저장 대상
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

| 기능 | admin / 공간 지기 | editor / 공간 운영자 | viewer / 공간 멤버 |
|------|:-----:|:------:|:------:|
| 일정/지출 조회 | ✅ | ✅ | ✅ |
| 일정/지출 생성 | ✅ | ✅ | ❌ |
| 공간 이름 변경 | ✅ | ❌ | ❌ |
| 멤버 제거 | ✅ | ❌ | ❌ |

초대 링크/코드로 처음 참여한 사용자의 기본 역할은 `viewer`(공간 멤버)입니다. 공간 지기가 필요할 때만 `editor` 또는 `admin`으로 승격합니다.

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

### 제품 기준

`/budget`은 개인 가계부 전용입니다. 공간 지출을 가계부 안에서 탭으로 함께 보여주지 않습니다.

```text
개인 가계부 = 내가 실제 소비했거나 내 기록으로 남길 돈의 흐름
공간 지출   = 공간 안에서 함께 관리하는 공동비/모임비/가족비/데이트비
반영        = 공간 지출 중 내가 낸 금액 또는 내 부담분을 개인 가계부로 복사
```

### 저장 규칙

- 개인 가계부 항목: `family_group_id = personalSpaceId`, `visibility = 'private'`
- 공간 지출 항목: `family_group_id = sharedSpaceId`, `visibility = 'space'`
- 공간 지출을 개인 가계부로 반영하면 새 private expense를 만들고 원본 연결 컬럼을 채움
- 원본 연결 컬럼: `source_space_expense_id`, `source_space_id`, `expense_reflection_type`, `expense_reflected_at`
- 같은 사용자가 같은 공간 지출을 중복 반영하지 않도록 DB unique index 사용

### 일회성 지출 vs 정기 지출 상태 규칙

가계부는 현재 `schedules` 테이블의 `type='expense'`를 사용하지만, 일회성 지출은 일정/결제 예정이 아니라 이미 발생한 돈의 흐름이다.

```typescript
repeat === 'none'
  ? { status: 'completed', automationPolicy: 'reminder_only' }
  : { status: 'pending',   automationPolicy: 'payment_due' };
```

- 일회성 지출: 등록 즉시 `completed`, 가계부에서 `지출반영`으로 표시, 홈/일정 타임라인에는 노출하지 않음.
- 정기 지출: `pending`으로 시작, 가계부에서만 `결제예정/결제완료` 토글 가능, 일정 타임라인의 `정기지출` 필터에 노출 가능.
- 기존 데이터 보정 SQL: `supabase/migrations/009_fix_one_time_expense_status.sql`
- 공간 지출 반영 컬럼 SQL: `supabase/migrations/011_add_expense_reflection_columns.sql`

### `AddExpenseInput` 타입

```typescript
export interface AddExpenseInput {
  title: string;
  amount: number;
  date: Date;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  repeat: RepeatType;
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

---

## Codex 작업 인수인계 — 2026-05-28 오후

### 1. 백오피스 Firebase App Distribution 연동 보정

**문제**
- Firebase Console에는 `internal-testers` 그룹과 테스터가 존재했지만, 백오피스 `/releases` 페이지에는 데이터가 비어 보였음.

**원인**
- App Distribution REST API 경로는 `projects/{projectNumber}` 기준인데 기존 코드는 `projects/gleaum-firebase`처럼 Firebase project id를 사용함.
- 그룹 상세 조회 응답에 테스터 배열이 포함된다고 가정했지만 실제로는 `projects/{projectNumber}/testers`를 별도 조회한 뒤 `tester.groups`로 필터링해야 함.
- 실패 응답을 빈 배열로 삼켜서 운영 화면에서는 단순 “데이터 없음”처럼 보였음.

**수정 파일**
- `backoffice/src/lib/firebase-admin.ts`
- `backoffice/src/app/api/releases/route.ts`
- `backoffice/src/app/releases/page.tsx`
- `backoffice/docs/03-current-status.md`
- `backoffice/docs/04-trouble-log.md`
- `docs/07-features-completed.md`
- `docs/10-ai-handoff-guide.md`

**검증**
- 실제 Firebase API 확인 결과: `internal-testers` 그룹 1개, 테스터 1명 확인, 릴리즈는 현재 API 기준 0개.
- `backoffice`에서 `npm run build` 통과.
- `npm run lint`는 기존 백오피스 lint 설정이 `.next` 산출물까지 검사하는 문제와 기존 lint 이슈 때문에 실패. 이번 수정의 빌드 검증은 통과.

**커밋**
- `7362e0c fix(backoffice): repair app distribution sync`

### 2. Android Studio Gradle Sync 오류 수정

**문제**
- Android Studio에서 `firebaseAppDistribution()` 메서드를 찾지 못해 Gradle sync/debug가 실패.

**원인**
- `android/app/build.gradle`에 Firebase App Distribution Gradle DSL이 남아 있었지만 Gradle plugin은 제거/미적용 상태였음.

**수정**
- App Distribution Gradle DSL 제거.
- 배포는 `scripts/distribute-android.sh`의 Firebase CLI 방식으로 유지.

**검증**
- `cd android && JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :app:tasks --quiet` 통과.
- `cd android && JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :app:assembleDebug --quiet` 통과.

**커밋**
- `7a37e08 fix(android): remove app distribution gradle DSL`

### 3. 공간 초대 코드/초대문 유효성 보강

**문제**
- 공유된 초대문에 포함된 `GLEAUM-QL7NG86K` 링크가 `/invite/GLEAUM-QL7NG86K`에서 “유효하지 않은 초대 코드”로 표시됨.

**확인 결과**
- 프로덕션 API 직접 확인: `https://www.gleaum.com/api/invite/info?code=GLEAUM-QL7NG86K`가 404 반환.
- 즉 해당 코드는 현재 운영 DB 기준 존재하지 않는 코드였음.

**수정 방향**
- 초대 코드/초대 링크/전체 초대문을 복사 또는 공유하기 전에 `/api/invite/info`로 실제 서버 유효성을 확인.
- 유효하지 않은 오래된 코드면 공간 지기 권한에서 자동 재발급 후, 재발급된 코드가 서버에서 확인될 때만 공유.
- 공간 설정 페이지의 “코드 복사”도 동일한 검증 로직 적용.

**수정 파일**
- `src/app/space/DesktopSpace.tsx`
- `src/app/space/MobileSpace.tsx`
- `src/app/space/settings/page.tsx`
- `docs/07-features-completed.md`
- `docs/10-ai-handoff-guide.md`
- `docs/README.md`

**검증**
- `npm run build` 통과.

**커밋**
- `6d36c17 fix(space): validate invite codes before sharing`

### 4. 현재 작업트리 주의사항

위 과거 Android 미커밋 항목은 이후 체크포인트에 모두 정리됐다. 2026-07-23 현재 제품 코드 워크트리는 동기화·검증 시점에 깨끗하며 Android 버전은 `versionCode 26`, `versionName 1.1.5`다.

**다음 AI에게 권장**
- 먼저 `git status -sb`와 `docs/24-project-work-tracker.md`를 확인한다.
- 최신 기능은 아직 `main`이 아니라 `codex/platform-parity-sync-20260723`에 있으므로 임의로 과거 `main`으로 전환하지 않는다.
- 맥미니 `stash@{0}`는 동기화 전 오래된 WD_BLACK 작업 백업이다. 최신 코드와 충돌 가능성이 있으므로 사용자 확인 없이 `stash pop/apply`하지 않는다.
- 공간 수명주기·알림 파리티는 코드와 빌드만 완료된 상태다. Preview/Production 배포와 실제 계정 회귀 전에는 완료로 닫지 않는다.

---

## 2026-06-02 Codex 인수인계 — Android Google 로그인 네이티브 세션 보정

### 문제

Google Play 배포본에서 Google 로그인을 완료한 뒤 앱 내부가 인증 상태로 전환되지 않고 모바일 웹 로그인 화면으로 돌아가는 증상이 발생했다.

### 원인

Android 네이티브 로그인은 Supabase implicit OAuth(`gleaum://auth/callback#access_token=...`)를 사용한다. 기존 구조는 OAuth 콜백을 WebView의 `appUrlOpen` 이벤트로 넘겨 React 쪽에서 처리하는 흐름이었는데, 앱 cold start/라우터 전환 시점에는 WebView 리스너가 아직 붙기 전이라 콜백 이벤트를 놓칠 수 있었다. 또한 React의 implicit 토큰 처리 분기는 Supabase 세션만 설정하고 네이티브 `SessionManager`에는 저장하지 않아, 다음 네이티브 라우팅에서 로그인 상태를 확인하지 못할 수 있었다.

### 수정

- `android/app/src/main/java/com/gleaum/app/RouterActivity.kt`
  - `gleaum://auth/callback` 진입 시 URL fragment의 `access_token`, `refresh_token`, `expires_in`을 직접 파싱해 `SessionManager`에 먼저 저장.
  - WebView 이벤트가 유실되어도 네이티브 세션이 남도록 보강.
- `android/app/src/main/java/com/gleaum/app/MainActivity.kt`
  - OAuth 딥링크를 받을 때 동일하게 implicit 세션을 저장하는 방어 로직 추가.
  - RouterActivity를 거치지 않는 재진입 케이스까지 보호.
- `src/components/NativeAppProvider.tsx`
  - PKCE/implicit OAuth 성공 시 공통 `saveNativeSession()`으로 네이티브 세션 저장.
  - implicit 토큰 분기도 `NativeSession.saveSession()`을 호출하도록 수정.

### 검증

- `npm run build` 통과.
- `cd android && JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :app:assembleDebug --quiet` 통과.

### 다음 배포 주의

- Google Play에 이미 올라간 빌드에는 이 수정이 포함되어 있지 않으므로 새 Android 빌드를 생성해 배포해야 한다.
- 배포 전 `android/app/build.gradle`의 `versionCode`/`versionName`이 Play Console 기준으로 증가되어 있는지 확인할 것.
- 실제 단말에서 Google 로그인 후 `/login`으로 돌아가지 않고 `/home` 또는 온보딩 미완료 시 `/onboarding`으로 이동하는지 확인할 것.

---

## 2026-06-02 Codex 인수인계 — 네이티브 생체인증 앱 잠금 추가

### 목적

글리움 앱에서 개인 일정, 공간 데이터, 가계부 정보가 노출되지 않도록 Android 지문/기기 잠금, iOS Face ID/Touch ID 기반 앱 잠금 기능을 추가했다. 설정은 계정 단위가 아니라 기기별 로컬 설정으로 저장한다.

### 구현 범위

- 신규 사용자: 온보딩 마지막 단계에 `앱 잠금 설정` 단계 추가
- 기존 사용자: 네이티브 앱 첫 진입 시 1회 생체인증 잠금 제안 모달 표시
- 마이페이지: `계정 & 보안` 영역에서 생체인증 앱 잠금 토글 제공
- 앱 실행/백그라운드 복귀: 잠금이 켜져 있으면 생체인증 또는 기기 잠금 인증 요구
- 웹 브라우저: 기능 비활성. 네이티브 앱에서만 동작

### 수정 파일

- `android/app/src/main/java/com/gleaum/app/NativeBiometricPlugin.kt` — Android framework `BiometricPrompt` 기반 인증 브리지
- `android/app/src/main/java/com/gleaum/app/MainActivity.kt` — `NativeBiometricPlugin` 등록
- `android/app/src/main/AndroidManifest.xml` — `USE_BIOMETRIC`, `USE_FINGERPRINT`, optional fingerprint feature 선언
- `ios/App/App/NativeBiometricPlugin.swift` — iOS `LocalAuthentication` 기반 Face ID/Touch ID 브리지
- `ios/App/Gleaum.xcodeproj/project.pbxproj` — iOS 신규 Swift 파일 타겟 포함
- `src/lib/native-biometric.ts` — JS 측 Capacitor 브리지 + 기기별 로컬 설정 래퍼
- `src/components/NativeBiometricGate.tsx` — 앱 잠금 오버레이, 기존 사용자 1회 제안, 앱 복귀 인증 처리
- `src/app/layout.tsx` — 전역 `NativeBiometricGate` 삽입
- `src/app/onboarding/page.tsx` — 온보딩 마지막 보안 설정 단계 추가
- `src/app/mypage/page.tsx`, `src/app/mypage/MobileMyPage.tsx`, `src/app/mypage/DesktopMyPage.tsx` — 마이페이지 생체인증 토글 추가

### 검증

- `npm run build` 통과
- `cd android && JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :app:assembleDebug --quiet` 통과
- `xcodebuild -project ios/App/Gleaum.xcodeproj -scheme Gleaum -configuration Debug -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build` 통과

### 주의사항

- 실제 생체인증 UX는 빌드 통과만으로 완전히 검증되지 않는다. Android 실기기 지문 등록 상태, iPhone Face ID/Touch ID 등록 상태에서 최종 확인해야 한다.
- 이 기능은 앱 잠금 UX이며, 현재 세션 저장소 자체를 Android Keystore / iOS Keychain으로 암호화 이전한 것은 아니다. 다음 보안 고도화 단계는 네이티브 세션 저장소 강화다.

---

## 2026-06-02 Codex 인수인계 — PC/Mobile Web/Native WebView 테마 동기화 기반

### 목적

PC 웹, 모바일 웹, 네이티브 앱 WebView가 서로 다른 배경/쉘 감각을 갖고 있던 문제를 줄이기 위해 공통 테마 시스템을 추가했다. 기본 라이트 모드는 전체 배경을 흰색 기준으로 정리하고, 사용자가 `자동/라이트/다크` 중 선택할 수 있게 했다.

### 구현 범위

- `자동`: OS/브라우저 `prefers-color-scheme`에 따라 라이트/다크 자동 적용
- `라이트`: 전체 앱 배경을 흰색 중심으로 고정
- `다크`: 전역 배경, 텍스트, 서피스, 네비게이션 쉘을 다크 토큰으로 전환
- 설정 저장은 `localStorage`의 `gleaum:theme-mode` 사용
- 초기 렌더 깜빡임을 줄이기 위해 `layout.tsx` head에 테마 초기화 스크립트 삽입

### 수정 파일

- `src/lib/theme.ts` — 테마 모드 타입, 저장 키, 적용/해결 유틸
- `src/components/ThemeProvider.tsx` — 전역 테마 컨텍스트 및 시스템 모드 감지
- `src/components/ui/ThemeModeSelector.tsx` — `자동/라이트/다크` 선택 UI
- `src/app/layout.tsx` — `ThemeProvider` 적용 및 초기화 스크립트 추가
- `src/styles/tokens.css` — `--theme-*` 라이트/다크 토큰 추가
- `src/app/globals.css` — 전역 body/app shell/mesh/glass-card 배경을 테마 토큰 기반으로 변경
- `src/components/layout/BottomNav.tsx`, `src/components/layout/DesktopSidebar.tsx` — 공통 네비게이션 쉘을 테마 토큰 기반으로 전환
- `src/app/mypage/DesktopMyPage.tsx`, `src/app/mypage/MobileMyPage.tsx` — 마이페이지 앱 설정에 화면 모드 선택 추가

### 검증

- `npm run build` 통과

### 남은 작업

- 이번 작업은 전역 테마 기반과 핵심 쉘 동기화다. 아직 각 페이지 내부에 남아 있는 인라인 하드코딩 색상은 화면별로 점진적으로 `var(--theme-*)` 토큰으로 전환해야 한다.
- 특히 홈/일정/가계부/공간 상세 화면의 카드 배경과 텍스트 색상은 후속 정리가 필요하다.

---

## 2026-06-02 Codex 인수인계 — 네이티브 보안 설정 고도화

### 목적

기존 생체인증 앱 잠금은 온보딩과 마이페이지 토글 중심이라, 온보딩을 이미 마친 기존 사용자에게 명확한 보안 설정 구간이 부족했다. 또한 앱 전체/민감 구간별 잠금 범위와 재인증 주기를 설정할 수 없었다. 이를 보완하기 위해 독립 보안 설정 페이지를 추가했다.

### 구현 범위

- `/settings/security` 신규 추가
- Desktop/Mobile 분리 규칙 준수: `DesktopSecuritySettings.tsx`, `MobileSecuritySettings.tsx`, `page.tsx`
- 공통 UI/로직: `SecuritySettingsContent.tsx`
- 마이페이지 계정/보안 영역에서 생체인증 토글을 직접 숨기거나 노출하는 방식 대신, 항상 `보안 설정` 메뉴로 진입하도록 변경
- 네이티브 앱이 아닌 웹에서는 “앱 전용 기능” 안내를 표시
- 생체인증 미지원/미등록 기기에서는 휴대폰 설정에서 지문, Face ID 또는 기기 잠금을 먼저 등록해야 한다는 안내 표시

### 수정 파일

- `src/lib/native-biometric.ts`
  - 잠금 범위 저장 키 추가: `gleaum:biometric-lock-scopes`
  - 재인증 주기 저장 키 추가: `gleaum:biometric-relock-interval`
  - `getBiometricLockScopes()`, `setBiometricLockScopes()` 추가
  - `getBiometricRelockInterval()`, `setBiometricRelockInterval()` 추가
  - `shouldRequireBiometricUnlock()` 추가
- `src/components/NativeBiometricGate.tsx`
  - `usePathname()` 기반 현재 경로 감지
  - 보호 범위 설정에 따라 앱 전체 또는 특정 민감 경로에서만 잠금 요구
  - 재인증 주기에 따라 최근 인증 시간이 유효하면 즉시 재인증하지 않도록 보정
- `src/app/settings/security/page.tsx`
- `src/app/settings/security/DesktopSecuritySettings.tsx`
- `src/app/settings/security/MobileSecuritySettings.tsx`
- `src/app/settings/security/SecuritySettingsContent.tsx`
- `src/app/mypage/MobileMyPage.tsx`
  - 기존 사용자도 항상 `보안 설정` 메뉴를 볼 수 있도록 변경
- `src/app/mypage/DesktopMyPage.tsx`
  - PC 마이페이지 계정/보안 영역에 `보안 설정` 메뉴 추가

### 보호 범위 매핑

- `app`: 제외 경로를 제외한 앱 전체
- `budget`: `/budget`
- `spaceSettings`: `/space/settings`
- `accountSettings`: `/mypage`, `/settings/security`

### 검증

- `npm run build` 통과

### 남은 작업

- Android/iOS 실기기에서 각 보호 범위 진입 시 인증 UX 확인 필요
- 보호 범위 후보는 현재 핵심 민감 화면 위주다. 추후 `/schedules/[id]/edit`, 공간 상세 내 민감 액션 등으로 확대 여부를 검토할 수 있다.
- 현재 설정은 기기별 로컬 저장소 기준이다. 계정 단위 보안 정책이 필요해지면 DB 프로필 설정과 병합 정책을 별도로 설계해야 한다.

---

## 2026-06-02 Codex 인수인계 — Android 네이티브 로그인 후 웹 로그인 재노출 방지

### 문제

Google Play 배포/Android 단말에서 네이티브 Google 로그인 처리가 끝난 뒤 다시 모바일 웹 로그인 화면(`/login`)이 뜨는 증상이 재발했다. 원인은 네이티브 세션 저장 자체보다 WebView 초기 라우팅과 서버 proxy의 인증 판정 타이밍 레이스로 판단했다.

### 원인 정리

- Android `SessionManager`에는 Supabase 세션이 저장될 수 있다.
- `MainActivity`는 WebView localStorage에 세션을 주입하지만, 서버 `proxy.ts`는 최초 보호 경로 요청을 쿠키 기준으로 판단한다.
- 루트(`/`)의 `RootPageRouter`가 네이티브 앱에서도 즉시 `/home`으로 이동시키면, 브라우저 클라이언트가 세션/cookie를 완전히 적용하기 전에 서버 proxy가 `/home` 요청을 받고 `/login`으로 리다이렉트할 수 있다.
- 기존 `NativeAppProvider.applyNativeSession()`은 Supabase 클라이언트에 이미 세션이 있다고 판단하면 조기 return 했기 때문에, `/login`에 머무는 상황을 다시 `/home`으로 복구하지 못할 수 있었다.

### 수정

- `src/components/NativeAppProvider.tsx`
  - `resolvePostLoginPath()` 추가: 온보딩 완료 여부에 따라 `/home` 또는 `/onboarding` 결정.
  - 네이티브 `NativeSessionPlugin.getSession()` 값이 있으면 기존 Supabase 클라이언트 세션 여부와 관계없이 `supabase.auth.setSession()`을 다시 호출.
  - WebView localStorage와 Supabase 브라우저 클라이언트 세션/cookie 적용 타이밍을 맞춤.
  - WebView 세션만 살아 있고 현재 경로가 `/` 또는 `/login`이면 후속 경로로 복구.
- `src/components/landing/RootPageRouter.tsx`
  - 네이티브 앱에서는 루트 페이지가 직접 `/home`으로 이동하지 않도록 변경.
  - 네이티브 로그인 후 이동 책임을 `NativeAppProvider`로 일원화.

### 검증

- `npm run build` 통과.
- `cd android && JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :app:assembleDebug --quiet` 통과.

### 실기기 확인 필요

- Google 로그인 후 모바일 웹 `/login`이 다시 노출되지 않는지 확인.
- 로그인 완료 후 기존 사용자 `/home`, 온보딩 미완료 사용자 `/onboarding` 이동 확인.
- 이미 배포된 Play 빌드에는 포함되지 않으므로 Android 새 빌드/AAB 생성 후 재배포 필요.

---

## 2026-06-04 Codex 인수인계 — OAuth 계정 선택/메일 OTP 확인

### 사용자 문의

1. Apple 디바이스에서 Google 로그인을 누르면 계정 목록이 나오지 않고 최근 로그인 계정으로 바로 진행됨.
2. 메일 로그인에서 인증코드를 보낸다고 하는데 실제 메일 발송 구현이 없는 것 같음.

### 확인 결과

- iOS 네이티브 로그인은 `LoginViewController.swift`에서 `SFSafariViewController`로 Supabase Google OAuth URL을 직접 열고 있었다.
- Safari/Google 세션이 재사용되면 Google이 최근 계정으로 바로 진행할 수 있다.
- 이메일 OTP는 미구현이 아니라 iOS/Android 네이티브 코드에 구현되어 있다.
  - 발송: Supabase `/auth/v1/otp`
  - 검증: Supabase `/auth/v1/verify`
  - `create_user: false`라 기존 가입 이메일에 대해서만 OTP 발송을 시도한다.
- 실제 이메일 도착 여부는 Supabase Auth Email Provider, SMTP 설정, 템플릿, Rate Limit, 수신함/스팸함 정책에 의존한다.

### 수정

- `ios/App/App/LoginViewController.swift`
  - Google OAuth URL에 `prompt=select_account` 추가.
  - OTP 발송/검증 요청에 `Authorization: Bearer <anon key>` 헤더 추가.
- `android/app/src/main/java/com/gleaum/app/LoginActivity.kt`
  - Google OAuth URL에 `prompt=select_account` 추가.
  - OTP 발송/검증 요청에 `Authorization: Bearer <anon key>` 헤더 추가.
- `src/hooks/useAuth.ts`
  - Supabase OAuth `queryParams: { prompt: 'select_account' }` 추가.

### 검증

- `npm run build` 통과.
- `cd android && JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :app:assembleDebug --quiet` 통과.
- `xcodebuild -project ios/App/Gleaum.xcodeproj -scheme Gleaum -configuration Debug -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build` 통과.

### 남은 확인

- iOS 실기기에서 Google 계정 선택 화면이 뜨는지 확인해야 한다.
- 여전히 최근 계정으로 바로 진행되면 다음 단계는 `SFSafariViewController` 대신 `ASWebAuthenticationSession` + `prefersEphemeralWebBrowserSession` 전환을 검토한다. 단, 이 방식은 사용자가 매번 더 자주 로그인해야 할 수 있어 UX 비용이 있다.
- 메일 OTP가 도착하지 않으면 Supabase Dashboard → Authentication → Email 설정/SMTP/템플릿/로그를 확인해야 한다.

---

## 2026-06-04 Codex 인수인계 — 다크모드 대비/토큰 안정화 1차

### 문제

`자동/라이트/다크` 테마 모드가 추가된 뒤에도 다수 화면이 `white`, `#1A1B2E`, `#8E8E93`, `#F5F5F7` 같은 값을 인라인 스타일 또는 Tailwind arbitrary class로 직접 들고 있어 다크모드 전환 시 텍스트/카드 대비가 깨졌다. 특히 모바일 앱 WebView에서 시스템 다크모드 또는 수동 다크모드 설정 후 검정 텍스트가 어두운 배경 위에 남아 UI가 보이지 않는 문제가 있었다.

### 수정

- `src/styles/tokens.css`
  - `--theme-control-bg`, `--theme-control-active`, `--theme-control-text`, `--theme-disabled-bg`, `--theme-disabled-text` 추가.
  - 라이트/다크 모드별 컨트롤·비활성 상태 토큰을 분리.
- `src/app/globals.css`
  - 다크모드 전용 inline-style 안전망을 확장.
  - 밝은 카드 배경, 어두운 텍스트, 흐린 텍스트, 밝은 border가 런타임 조건부 inline 값으로 남아도 `var(--theme-*)`로 보정되도록 처리.
- 주요 앱 화면 전반
  - 홈, 일정, 공간, 가계부, 알림, 온보딩, 마이페이지, 광고/관리 일부 화면의 하드코딩된 밝은 배경/어두운 텍스트를 테마 토큰으로 1차 교체.
- `src/app/mypage/page.tsx`
  - 프로필/비밀번호/탈퇴 모달의 Tailwind 하드코딩 색상을 인라인 테마 토큰으로 보강.
  - 프로필 수정 모달 제목 중복 노출을 정리.

### 검증

- `npm run build` 통과.

### 남은 작업

- 이번 작업은 화면이 보이지 않는 치명 증상을 줄이는 1차 안정화다.
- 조건부 버튼 색상, SVG `stroke/fill`, 일부 관리자 페이지 상태 색상은 아직 브랜드/상태 색상 하드코딩이 남아 있다.
- 이후 작업은 화면 단위로 `#1A1B2E`, `#8E8E93`, `white`, `#F5F5F7` 등을 직접 쓰지 않고 `var(--theme-*)` 토큰을 사용하도록 점진 정리해야 한다.

### 2026-06-04 추가 보정

사용자 모바일 웹 캡처 확인 결과, 1차 안정화 이후에도 일부 모바일 화면에서 다크모드가 불완전하게 적용됐다. 원인은 inline hex 외에도 Tailwind arbitrary class, SVG stroke/fill, 모바일 sticky header의 고정 밝은 배경, 조건부 버튼 색상이 남아 있었기 때문이다.

추가 수정:
- 모바일 홈/일정/공간 sticky header를 `--theme-nav-bg`, `--theme-border` 기반으로 변경.
- 모바일 홈 BI 워드마크를 현재 resolved theme에 따라 `dark/white` variant로 전환.
- 마이페이지 모바일 메뉴 라벨/chevron/toggle 비활성색을 테마 토큰으로 변경.
- 가계부 지출 등록/수정 모달의 카테고리/결제방법/주기/비활성 버튼 색상을 테마 토큰으로 변경.
- Tailwind arbitrary class 잔여 색상 보정을 `globals.css`에 추가.
- `npm run build` 통과.

### 2026-06-04 iOS 스플래시 이후 검은 화면 긴급 보정

사용자 iOS 디바이스에서 스플래시 종료 후 검은 화면에서 진행되지 않는 증상이 발생했다. Xcode 콘솔에는 `No APNS token specified before fetching FCM Token` 로그가 있었지만, FCM 토큰 실패는 `useFCM()` 내부에서 catch 처리되어 렌더를 중단하지 않는 구조다.

원인 후보 중 실제 위험도가 높은 부분은 `globals.css`의 다크모드 보정이었다. `[style*="rgba(255,255,255"]`와 `[style*="backdrop-filter"]` 전역 선택자가 iOS WebView에서 앱 초기 렌더링 요소/오버레이/시트까지 강제로 어둡게 덮을 수 있었다.

수정:
- `src/app/globals.css`에서 과도한 전역 selector 제거.
- 다크모드 헤더는 각 모바일 화면에서 직접 `--theme-nav-bg`, `--theme-border`를 쓰도록 유지.
- `npm run build` 통과.

남은 확인:
- iOS 실기기에서 스플래시 후 `/home` 또는 네이티브 로그인 화면이 정상 표시되는지 확인.
- FCM/APNS 경고는 화면 정지와 별개로 Apple Push Notifications 설정/권한/실기기 APNS 토큰 발급 흐름에서 따로 정리 필요.

---

## 2026-06-04 — iOS splash 이후 검은 화면 재보정

### 증상
- iOS/Apple 디바이스에서 LaunchScreen 이후 검은 화면에 머물고 네이티브 로그인 화면으로 넘어가지 않는 증상이 재현됨.
- Xcode 콘솔에는 `No APNS token specified before fetching FCM Token` 로그가 보였지만, 이는 FCM 푸시 토큰 발급 실패 로그이며 화면 정지의 직접 원인으로 보기는 어려움.

### 원인 판단
- 네이티브 앱의 `/` 루트는 마케팅 랜딩/웹 로그인 플래시를 막기 위해 어두운 대기 화면을 보여주고, `NativeAppProvider` 또는 iOS `LoginViewController` 표시를 기다리는 구조임.
- iOS에서 `AppDelegate.window?.rootViewController`가 아직 준비되지 않았거나 root view가 window에 붙기 전이면 `LoginViewController` 표시가 한 번 누락될 수 있음.
- 이 경우 `/` 루트 대기 화면이 계속 남아 검은 화면처럼 보일 수 있음.

### 수정 내용
- `ios/App/App/AppDelegate.swift`
  - `window?.rootViewController`만 보지 않고 `UIApplication.shared.connectedScenes`의 key window를 찾아 root view controller를 보정.
  - root view가 아직 window에 붙지 않았으면 최대 20회, 0.2초 간격으로 재시도.
  - 이미 `LoginViewController` 또는 `SFSafariViewController`가 표시 중이면 중복 표시하지 않음.
  - `setupWebView()`도 동일한 root view 탐색 로직을 사용하도록 변경.
- `src/components/landing/RootPageRouter.tsx`
  - 네이티브 앱 `/` 대기 화면에 `GLEAUM` 텍스트를 표시.
  - 네이티브 로그인 표시가 실패해도 영구 검은 화면이 되지 않도록 4.2초 후 `/login` fallback 이동.
  - fallback은 최후 안전망이며 정상 케이스에서는 iOS 네이티브 로그인 화면이 먼저 떠야 함.

### 검증/배포 메모
- `AppDelegate.swift` 변경은 네이티브 코드 변경이므로 Vercel 배포만으로는 기존 설치 앱에 반영되지 않음.
- 반드시 Xcode/TestFlight/스토어용 iOS 앱을 다시 빌드해 설치해야 네이티브 로그인 표시 재시도 로직이 적용됨.
- `RootPageRouter.tsx` 변경은 웹 배포로 반영되지만, 네이티브 로그인 표시 문제의 핵심 수정은 iOS 재빌드가 필요함.

---

## 2026-06-04 — iOS 생체인증 문구/판정 보정 + iOS 기기 캘린더 연동 추가

### 배경
- iOS 기기에서 보안 설정의 생체인증 잠금 활성화 시, Face ID/Touch ID 등록 상태와 기기 암호 fallback 판정이 사용자에게 혼동되게 보일 수 있었음.
- 기기 캘린더 연동은 Android `NativeCalendarPlugin.kt`만 존재했고, iOS는 `src/lib/native-calendar.ts`에서 지원 불가로 처리되고 있었음.

### 생체인증 보정
- `ios/App/App/NativeBiometricPlugin.swift`
  - `isAvailable()` 응답에 `reason`을 명확히 추가.
  - Face ID/Touch ID가 없더라도 iOS 기기 암호가 설정되어 있으면 `available: true`, `biometryType: deviceCredential`로 반환.
  - `authenticate()`에 `localizedFallbackTitle = "암호 사용"` 적용.
  - `LAError`를 `biometry_not_enrolled`, `passcode_not_set`, `biometry_not_available`, `biometry_lockout` 등 내부 reason 코드로 정규화.
- `src/app/settings/security/SecuritySettingsContent.tsx`
  - `deviceCredential` 문구를 `기기 암호 잠금 사용 가능`으로 명확화.
  - Face ID/Touch ID 미등록과 기기 암호 미설정 상태를 구분해 안내 문구 표시.

### iOS 캘린더 연동 추가
- `ios/App/App/NativeCalendarPlugin.swift` 신규 추가.
  - EventKit 기반 `NativeCalendar` Capacitor 플러그인.
  - Android와 동일한 JS 메서드 제공:
    - `checkPermissions()`
    - `requestPermissions()`
    - `listCalendars()`
    - `createEvent()`
    - `listEvents()`
  - iOS 17+는 `requestFullAccessToEvents`, 이전 버전은 `requestAccess(to: .event)` 사용.
  - `EKEventStore.authorizationStatus(for: .event)`의 `fullAccess`, `writeOnly`, `authorized`를 `granted`로 매핑.
- `ios/App/Gleaum.xcodeproj/project.pbxproj`
  - `NativeCalendarPlugin.swift`를 App group과 Sources build phase에 등록.
- `ios/App/App/Info.plist`
  - `NSCalendarsUsageDescription` 추가.
  - `NSCalendarsFullAccessUsageDescription` 추가.
- `src/lib/native-calendar.ts`
  - 지원 플랫폼을 Android 전용에서 Android/iOS 네이티브 앱으로 확장.
- `src/app/settings/calendar/page.tsx`
  - 화면 문구를 Android 전용에서 Android/iOS 네이티브 앱 기준으로 수정.

### 검증
- `npm run build` 통과.
- `xcodebuild -project ios/App/Gleaum.xcodeproj -scheme Gleaum -configuration Debug -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build` 통과.

### 주의
- 생체인증/캘린더 모두 네이티브 코드 변경이 포함되어 있으므로 Vercel 배포만으로 기존 설치 앱에 반영되지 않음.
- iOS 실기기에서 확인하려면 Xcode/TestFlight/스토어용 iOS 앱 재빌드가 필요함.

---

## 2026-06-04 — Android 릴리즈/Google 로그인/AdMob 잔여 변경 정리

### 확인한 잔여 변경
- `android/app/build.gradle`
  - Android 앱 버전을 `versionCode 15`, `versionName 1.0.15`로 상향.
- `android/app/google-services.json`
  - Android OAuth client 추가.
  - 릴리즈/실기기 Google 로그인 인증서 SHA 연결에 필요한 설정으로 판단.
- `android/app/src/main/java/com/gleaum/app/NativeBiometricPlugin.kt`
  - Android 생체인증 오류/취소 시 `call.reject()` 대신 `{ success: false }`를 resolve하도록 변경.
  - JS 측 생체인증 처리 흐름과 iOS 처리 방식에 맞춰 오류 throw 대신 성공 여부로 통일.
- `src/lib/admob.ts`
  - 인라인 배너 광고 단위 ID를 배너 형식 ID(`6211229285`)로 교체.
  - 기존 `1438321314`는 네이티브 고급형 광고 ID라 배너 요청 시 403이 발생할 수 있음.

### 제외한 변경
- `android/.idea/deploymentTargetSelector.xml`
  - Android Studio 실행 대상 timestamp 변경이므로 커밋 제외.
- `ios/App/App/Base.lproj/LaunchScreen.storyboard`
  - 사용자가 직접 조정한 LaunchScreen 아이콘 위치 변경으로 보이나 `misplaced="YES"`가 포함되어 있어 별도 실기기/Xcode 확인 후 커밋 권장.
- `gleaum-mail-auth-only.txt`, `gleaum.com.cleaned.txt`
  - DNS/메일 운영 참고 파일로 앱 코드 변경과 분리.

---

## 2026-06-04 — iOS LaunchScreen Auto Layout 경고 정리

### 증상
- Xcode에서 LaunchScreen에 노란 경고가 표시됨.
- 사용자가 Splash 이미지 프레임을 크게 조정했지만, 실제 빌드에서는 커지지 않는 현상 발생.

### 원인
- `ios/App/App/Base.lproj/LaunchScreen.storyboard`의 `img-logo-01` 실제 프레임은 `257x257`로 커져 있었지만 Auto Layout 제약은 기존 `180x180`으로 남아 있었음.
- 따라서 런타임/빌드 시 제약값 기준으로 이미지가 다시 계산되어 커진 프레임이 반영되지 않았음.
- 타이틀 라벨에는 leading만 있고 trailing 제약이 없어 Xcode가 missing trailing constraint 경고를 표시함.

### 수정
- `img-logo-01`의 Auto Layout 제약을 사용자 캡처 의도에 맞게 정리.
  - width/height: `257`
  - trailing: `31`
  - centerY: `110.5`
  - `misplaced="YES"` 제거
- 타이틀 라벨 3개에 `trailing <= -32` 제약 추가.
- `ios/App/App/AppDelegate.swift`의 deprecated `UIApplication.shared.windows` fallback 제거.

### 검증
- `xcodebuild -project ios/App/Gleaum.xcodeproj -scheme Gleaum -configuration Debug -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build` 통과.
- 빌드 출력에서 LaunchScreen 관련 Auto Layout warning은 재확인되지 않음.

---

## 2026-06-04 — 홈 대시보드/가계부 도메인 확장 검토 및 1차 반영

### 사용자 요구
- 홈 화면은 서비스 내부 기능의 허브여야 하며, 일정/가계부/공간 정보를 일관성 있게 보여줘야 한다.
- 사용자가 설정한 홈 레이아웃(`balanced`, `calendar_first`, `expense_first`, `space_first`, `routine_first`)이 실제 홈 구성 순서에 반영되어야 한다.
- 오늘 일정 empty state 안의 `새 일정 추가`와 하단 quick action `새 일정`이 중복되어 UX가 어색하다.
- 가계부는 지출만이 아니라 수입까지 포함하는 자금 흐름 관리로 확장해야 한다.
- 고정 지출은 사용자가 중지하기 전까지 매월/매주/매년 예정 항목으로 자동 반영되어야 한다.

### 확인된 현재 구조 문제
- `/home`은 현재 활성 공간의 `schedules`만 읽고 있어 개인 가계부가 개인 공간(`preferences.personalSpaceId`)에 저장된 경우 홈에서 누락될 수 있다.
- 가계부는 아직 `schedules.type = 'expense'`에 강하게 의존한다.
- `repeat !== 'none'`인 고정 지출은 하나의 schedule row로만 존재하며, 다음 달 발생분/납부상태를 독립적으로 관리할 occurrence 모델이 없다.
- 따라서 단순히 start_time만 다음 달로 복사하거나 status를 토글하면 “이번 달 납부 완료”가 “다음 달도 완료”처럼 해석될 위험이 있다.

### 이번 1차 코드 반영
- `/home`에서 활성 공간 일정과 개인 가계부 데이터를 분리해 읽도록 변경.
  - 일정/공간 표시: 현재 `familyGroupId` 기준
  - 개인 가계부 요약: `preferences.personalSpaceId` 기준
- 모바일/데스크탑 홈에 `personalExpenses`를 전달하고 이번 달 개인 가계부 요약 카드를 추가.
- `homeLayout === 'expense_first'`인 경우 가계부 요약 카드가 캘린더/일정 영역보다 먼저 보이도록 반영.
- 모바일 홈 empty state 내부의 `+ 새 일정 추가` 링크를 제거하고, 하단 quick action으로 유도해 중복 CTA를 줄임.

### 다음 단계 권장 설계 — 가계부 Phase 2

수입/지출/반복 예정 처리는 더 이상 `schedules`만으로 확장하지 않는 것이 안전하다. 권장 모델은 다음과 같다.

1. `budget_entries` 또는 `ledger_entries` 신규 테이블
   - `kind`: `income | expense`
   - `scope`: `personal | space`
   - `space_id`: 개인 공간 또는 공유 공간
   - `owner_id`: 개인 귀속 사용자
   - `amount`, `category`, `payment_method`, `occurred_at`, `memo`
   - 개인 가계부와 공간 공동 지출의 저장 경계를 명확히 분리

2. `recurring_budget_rules` 신규 테이블
   - 월세/구독/보험/급여처럼 반복되는 수입·지출의 원본 규칙
   - `kind`, `amount`, `frequency`, `day_of_month`, `start_date`, `end_date`, `is_active`

3. `budget_occurrences` 신규 테이블
   - 반복 규칙에서 생성된 월별/주별 실제 예정 항목
   - `rule_id`, `due_date`, `status: pending | paid | skipped | canceled`
   - 같은 고정지출이라도 6월분/7월분 납부 상태를 독립적으로 관리

4. 크론/서버 액션
   - 매일 또는 매월 초 `recurring_budget_rules`를 기준으로 다음 N개월 occurrence를 미리 생성
   - 중복 방지 unique key: `(rule_id, due_date)`
   - 홈/가계부는 occurrences를 기준으로 예정/완료/연체를 표시

### 주의
- 수입 기능을 `schedules.type`에 억지로 추가하면 일정/가계부 경계가 더 흐려진다.
- 고정지출 자동 반영을 단일 schedule row의 `repeat`와 `status`만으로 처리하면 월별 납부 상태가 분리되지 않는다.
- 다음 작업자는 먼저 SQL 마이그레이션을 설계하고 Supabase RLS까지 포함해야 한다.

### 현재 구현 상태 (2026-06-15) — 임시 이월 방식
> 위 Phase 2(별도 `recurring_budget_rules`/`budget_occurrences` 테이블)는 **아직 미구현**이며, 그 사이의 임시 해법으로 다음을 적용했다.
- 정기지출은 **달마다 별도의 `schedules` row로 이월 생성**된다 → 6월분/7월분 납부(`status`) 상태가 자연히 분리된다(라인 1210~1211의 우려를 부분 해소).
- 시리즈 식별 키: **`title` + `repeat`**의 최신 인스턴스. (전용 rule 테이블이 없으므로 제목이 바뀌면 별도 시리즈로 인식되는 한계 존재)
- 생성 위치: 클라이언트 `materializeRecurringExpenses(spaceId)`(가계부 진입 시 lazy, `src/lib/db.ts`) + 서버 크론 `/api/cron/recurring-expenses`(매일 00:10 KST). 둘 다 멱등(같은 달 중복 생성 방지).
- 정기지출 row는 `end_time = null` + `automation_policy = 'reminder_only'`로 저장해 `automations` 크론의 missed 전환을 피한다.
- **장기적으로는 여전히 위 Phase 2 모델(특히 수입 기능 도입 시)로 전환 권장.** 현재 방식은 제목 변경/규칙 중단(일시정지) 관리가 약하다.

### 검증
- `npm run build` 통과.
- 기존 경고: `/_next/static/(.*)` Cache-Control 경고는 이번 변경과 무관한 기존 설정 경고.

---

## 2026-06-04 — Android/Mobile 홈 레이아웃 순서 정리

### 사용자 요구
- Android 앱 기준 홈 화면의 정보 순서를 명확히 재정렬.
- 요구 순서: 최상단 종합일정 → 오늘(투데이/달력) → 오늘 일정 → 광고 → 가계부.
- 오늘 일정 영역에서 새 일정을 바로 등록할 수 있어야 함.
- 하단 `빠른 액션` 블록은 중복/불필요하므로 제거.

### 반영 내용
- `src/app/home/MobileHome.tsx`에서 모바일 홈 섹션 순서를 재배치.
- `오늘/선택일 일정` 헤더 오른쪽에 `+ 새 일정` 버튼 추가 (`/schedules/new`).
- 오늘 일정 empty state 문구를 새 버튼 위치에 맞게 수정.
- 기존 하단 quick action 카드 2개(`새 일정`, `가계부`) 제거.
- 광고 배너는 오늘 일정 이후, 가계부 요약은 광고 이후에 고정 배치.

### 검증
- 최초 `npm run build`는 Google Fonts 네트워크 fetch 실패로 중단.
- 네트워크 권한으로 `npm run build` 재실행 후 통과.
- 기존 `/_next/static/(.*)` Cache-Control 경고는 이번 변경과 무관한 기존 설정 경고.

---

## 2026-06-08 — 일정 등록 실패 제보 조사 및 1차 방어 수정

### 제보
- 앱 빌드/배포 이후 사용자들이 일정 등록이 진행되지 않는다고 보고.

### 로그/운영 확인
- Vercel runtime/deployment logs는 현재 MCP 권한 부족으로 `403 Forbidden` 발생.
  - scope: `edwin-spaces-projects`
  - Vercel 재인증 또는 권한 있는 토큰 필요.
- Supabase 운영 DB 확인 결과:
  - 최근 24시간 `schedules` 신규 생성: `0건`
  - 최근 7일 신규 생성: `7건`
  - 마지막 일정 생성: `2026-06-05 08:05:32 UTC`
- 운영 DB의 `schedules` 신규 컬럼(`category`, `visibility`, `automation_policy`, 지출 반영 컬럼 등)은 존재함.
- 개인공간 멤버십 누락은 확인되지 않음. `personalSpaceId`가 있는 온보딩 완료 사용자는 개인공간 `admin` 멤버십 보유.
- 일부 계정에서 `profiles.family_group_id`가 멤버십 없는 공간을 가리키는 상태가 확인됨. 이 경우 공유/자녀 일정 등록은 RLS에서 실패할 수 있음.

### 원인 후보
- 개인 일정 저장은 RLS 시뮬레이션상 정상 통과.
- 공유/자녀/공간 지출 등록은 공유 공간 역할(`myRole`) 확인이 필요함.
- 기존 `/schedules/new`는 `myRole === 'viewer'`만 차단하고, `myRole === null` 또는 공간 권한 로딩 중 상태를 차단하지 않아 RLS 실패가 사용자에게 일반 실패로 보일 수 있었음.
- 기존 catch는 실제 Supabase 오류 메시지를 숨기고 `일정 저장에 실패했습니다`만 표시해 현장 원인 파악이 어려웠음.

### 이번 수정
- `src/app/schedules/new/page.tsx`
  - `useSpace(sharedSpaceId)`의 `spaceLoading`을 사용.
  - 공유 공간 대상 저장 시 권한 로딩 중이면 저장을 막고 재시도 안내.
  - 공유 공간 대상 저장 시 `admin/editor`가 아니면 명확히 차단.
  - 저장 실패 catch에서 실제 오류 메시지를 토스트와 콘솔에 표시.

### 검증
- `npm run build` 통과.
- 기존 `/_next/static/(.*)` Cache-Control 경고는 이번 변경과 무관한 기존 설정 경고.

### 후속 권장
- Vercel 로그 접근 권한을 재인증해 production runtime log 확인 필요.
- 클라이언트 오류를 서버로 수집하는 `/api/client-errors` 또는 Firebase Crashlytics/Sentry 연동 권장.
- `profiles.family_group_id`가 실제 멤버십 없는 공간을 가리키는 레거시 데이터를 보정하는 SQL 검토 필요.

---

## 2026-06-18 — iOS 네이티브 홈/일정 전환 1차 기반

### 배경
- 회원가입/로그인 외 iOS 네이티브 전환 대상 점검 결과, 전체 SwiftUI 재작성보다 홈 요약과 일정 빠른 등록부터 단계적으로 전환하는 것이 안전하다고 판단.
- Swift 화면에서 Supabase 쿼리를 직접 흩뿌리면 Web/Android/iOS 데이터 계약이 분리되므로, Next.js Route Handler를 BFF처럼 쓰는 기반을 먼저 추가.

### 반영 내용
- `docs/16-ios-native-roadmap.md`
  - iOS 네이티브 전환 우선순위, 유지 대상/전환 대상, API 계약, 다음 구현 순서 정리.
- `src/lib/supabase/native-route.ts`
  - WebView cookie 세션과 Swift 네이티브 `Authorization: Bearer <access_token>` 호출을 모두 지원하는 인증 헬퍼 추가.
- `src/lib/db.ts`
  - `getNativeHomeSummary()` 추가: iOS 네이티브 홈 요약용 사용자/공간/오늘 일정/향후 일정/가계부 원장 요약 제공.
  - `createNativeSchedule()` 추가: iOS 네이티브 일정 등록 Sheet용 일정 생성 함수 제공.
  - 공유 공간 일정은 `space_members.role`이 `admin` 또는 `editor`인 경우만 생성 가능.
  - 개인 일정은 개인 공간(`preferences.personalSpaceId`)에 private visibility로 저장되도록 경계 유지.
- `src/app/api/native/home-summary/route.ts`
  - `GET /api/native/home-summary` 추가.
- `src/app/api/native/schedules/route.ts`
  - `POST /api/native/schedules` 추가.

### 다음 작업
- iOS SwiftUI Shell을 추가하고 `GET /api/native/home-summary`를 호출해 네이티브 홈 요약 화면을 구성한다.
- 홈의 `+ 새 일정`은 SwiftUI Sheet로 띄우고 저장 시 `POST /api/native/schedules`를 호출한다.
- 성공 시 홈 요약을 재조회하거나 WebView 일정 목록을 갱신한다.

### 주의
- 새 네이티브 화면은 Supabase 테이블을 직접 조회하지 말고 위 API 계약을 우선 사용한다.
- 날짜 범위는 현재 서버 기준이다. 사용자 타임존별 day/month 경계가 필요하면 API에 `timezone` 입력을 추가해 보강한다.
- 가계부는 `ledger_entries` 원장 기준이며, 일회성 지출을 다시 일정처럼 확장하지 않는다.

---

## 2026-06-18 — iOS 커스텀 Capacitor 플러그인 등록 보강

### 문제
- iOS Simulator 실행 로그에서 `NativeSession.getSession()` 호출이 `UNIMPLEMENTED`로 실패.
- 이 상태에서는 네이티브 로그인 세션을 WebView Supabase 세션으로 복구하지 못해 로그인 후 `/login` 재노출, 세션 유지 실패, 생체인증 게이트 오작동으로 이어질 수 있다.

### 원인
- `NativeSessionPlugin.swift`, `NativeBiometricPlugin.swift`, `NativeCalendarPlugin.swift`는 Xcode Sources에는 포함되어 있었지만 Capacitor bridge 등록 경로가 불안정했다.
- `ios/App/App/capacitor.config.json`의 `packageClassList`는 Capacitor CLI가 npm 플러그인 위주로 생성하므로 앱 타깃 내부 커스텀 Swift 플러그인이 `cap sync` 이후 누락될 수 있다.

### 수정
- `ios/App/App/AppBridgeViewController.swift` 추가.
  - `CAPBridgeViewController.capacitorDidLoad()`를 override.
  - `NativeSessionPlugin`, `NativeBiometricPlugin`, `NativeCalendarPlugin`을 `bridge.registerPluginInstance()`로 명시 등록.
- `ios/App/App/Base.lproj/Main.storyboard`
  - 루트 ViewController를 `CAPBridgeViewController`에서 `AppBridgeViewController`로 변경.
- `ios/App/Gleaum.xcodeproj/project.pbxproj`
  - `AppBridgeViewController.swift`를 target Sources에 추가.
- `ios/App/App/capacitor.config.json`
  - 현재 산출물 기준 `packageClassList`에도 커스텀 플러그인 3개를 추가.

### 검증
- XcodeBuildMCP `build_run_sim` 통과.
- iOS Simulator 로그에서 다음 호출이 정상 확인됨.
  - `To Native -> NativeSession getSession`
  - `TO JS {"session":null}`
  - `To Native -> NativeBiometric isAvailable`
- `UNIMPLEMENTED`는 더 이상 `NativeSession`/`NativeBiometric`/`NativeCalendar`에서 발생하지 않음.

### 남은 보안 이슈
- `FirebaseAppCheckPlugin`, `FirebaseRemoteConfigPlugin`은 여전히 `UNIMPLEMENTED`.
- 현재 `ios/App/CapApp-SPM/Package.swift`에 `@capacitor-firebase/messaging`만 연결되어 있고 App Check/Remote Config SPM 제품이 빠진 상태가 원인 후보.
- 다음 작업자는 `npx cap sync ios` 또는 SPM 의존성 수동 정리를 통해 AppCheck/RemoteConfig/Crashlytics/Performance/Analytics iOS 플러그인 연결 상태를 별도 점검해야 한다.

---

## 2026-06-18 — iOS Face ID 설정 가능 여부 판정 보정

### 문제
- iOS Simulator에서 Face ID/Touch ID가 등록되어 있지 않은데도 보안 설정 구간에 기기 비밀번호/PIN 설정 성격의 안내가 노출됨.
- 원인은 `NativeBiometricPlugin.isAvailable()`이 `.deviceOwnerAuthentication` 성공만으로 `available=true`, `biometryType=deviceCredential`를 반환하던 구조.
- Simulator의 `.deviceOwnerAuthentication` 결과는 실제 기기 패스코드/생체 등록 상태와 다르게 잡힐 수 있어 Face ID 설정 UX에 부정확한 상태가 표시될 수 있다.

### 수정
- `ios/App/App/NativeBiometricPlugin.swift`
  - `isAvailable()`은 Face ID/Touch ID 등록 여부(`.deviceOwnerAuthenticationWithBiometrics`)만 기준으로 `available=true`를 반환하도록 변경.
  - 기기 암호는 `authenticate()` 단계의 iOS 시스템 폴백으로만 허용.
- `src/app/settings/security/SecuritySettingsContent.tsx`
  - 생체인증 불가 상태에서 비상용 PIN 카드가 먼저 노출되지 않도록 조건 보정.
  - "기기 잠금" 중심 문구를 Face ID/Touch ID/지문 등록 기준으로 정리.
- `src/app/onboarding/page.tsx`, `src/app/mypage/page.tsx`
  - 생체인증 불가 안내 문구에서 "기기 잠금"을 제거하고 실제 생체 등록 상태 확인으로 정리.

### 검증
- `npm run build` 통과.
- XcodeBuildMCP `build_run_sim` 통과.
- iOS Simulator 로그 확인:
  - `NativeBiometric isAvailable`
  - `TO JS {"reason":"biometry_not_enrolled","available":false,"biometryType":"none"}`
- 더 이상 `deviceCredential`만으로 Face ID 사용 가능 상태가 되지 않는다.


---

## 2026-06-18 — iOS P0 네이티브 앱 셸/홈/일정 빠른 등록 1차

### 목적
- 회원가입/로그인 이후 앱 사용자가 가장 먼저 만나는 홈, 일정 빠른 등록, 앱 라우팅, 알림 권한, 초대 링크 진입점을 네이티브 앱 기준으로 안정화.
- 전체 앱을 즉시 SwiftUI로 재작성하지 않고, 기존 Capacitor WebView 위에 P0 네이티브 화면을 full-screen으로 얹는 하이브리드 전환 방식 채택.

### 반영 파일
- `ios/App/App/NativeHomeModels.swift` — 네이티브 홈/일정 API Codable 모델.
- `ios/App/App/NativeAPIClient.swift` — `https://www.gleaum.com/api/native/*` 호출 클라이언트. `SessionManager.accessToken()`으로 Bearer 인증.
- `ios/App/App/NativeRouteCoordinator.swift` — `/home`은 네이티브 홈, 그 외 경로는 WebView로 로드. `gleaum://invite/{code}` 및 Universal Link 초대 URL을 `/invite/{code}`로 라우팅.
- `ios/App/App/NativeHomeViewController.swift` — 네이티브 홈. 레이아웃 순서: 종합 일정 → 오늘 달력 → 오늘 일정 → 광고 → 가계부 → 앱 설정.
- `ios/App/App/NativeScheduleCreateViewController.swift` — 네이티브 일정 등록 Sheet. 저장 성공 시 홈 요약 재조회.
- `ios/App/App/SessionManager.swift` — `accessToken()` 추가.
- `ios/App/App/AppDelegate.swift` — 세션 보유 시 네이티브 홈 표시, 로그인 세션 저장 후 네이티브 홈 표시, 딥링크 라우팅 연결.
- `ios/App/Gleaum.xcodeproj/project.pbxproj` — 신규 Swift 파일 5개 target Sources 등록.

### 검증
- `npm run build` 통과. 빌드 결과에 `/api/native/home-summary`, `/api/native/schedules` 라우트가 포함됨.
- XcodeBuildMCP `build_run_sim` 통과.
- iOS Simulator에서 네이티브 홈 화면 표시 확인. 현재 운영 배포본에는 `/api/native/home-summary`가 아직 없으므로 Simulator에서는 `서버 요청에 실패했습니다. (404)`가 정상적으로 표시되고 `웹 홈으로 이동` fallback이 노출됨.

### 배포 순서 주의
1. 먼저 웹/Vercel 배포로 `/api/native/home-summary`, `/api/native/schedules`가 운영에 반영되어야 한다.
2. 그 다음 iOS 빌드를 배포해야 네이티브 홈이 실제 데이터를 불러온다.
3. iOS만 먼저 배포하면 네이티브 홈은 404 fallback을 표시한다. 앱이 막히지는 않지만 네이티브 홈 데이터는 보이지 않는다.

### 남은 P0 보강
- 네이티브 홈에서 웹 구간으로 이동한 뒤 다시 네이티브 홈으로 돌아오는 명시적 홈 버튼/하단 탭 UX 필요.
- 일정 등록 Sheet는 1차 기본형이다. 반복, 장소, 참여자 선택, 공유 공간 권한 안내는 추가 보강 필요.
- 보안 설정은 Face ID 판정/웹 설정 UI 보정까지 완료됐지만, 완전 네이티브 보안 설정 화면은 후속 작업으로 남아 있다.


### 2026-06-18 추가 보정 — 네이티브 홈 API 미배포 시 자동 WebView fallback
- 문제: iOS 앱 실행 직후 네이티브 홈이 `GET /api/native/home-summary`를 운영(`https://www.gleaum.com`)으로 호출하지만, 운영 배포 전에는 404가 발생해 `홈을 불러오지 못했어요` 에러 화면이 첫 화면으로 노출됨.
- 수정: `NativeAPIError.shouldFallbackToWebHome` 추가. 404 또는 5xx는 앱 진입을 막지 않고 `NativeRouteCoordinator.openWebPath("/home")`으로 자동 전환.
- 검증: XcodeBuildMCP `build_run_sim` 통과. Simulator에서 더 이상 네이티브 홈 에러 화면이 뜨지 않고 기존 모바일 웹 홈으로 진입 확인.
- 주의: 운영/Vercel에 `/api/native/home-summary`가 배포되기 전까지는 네이티브 홈 대신 WebView 홈이 보이는 것이 의도된 안전 동작이다.


### 2026-06-18 추가 보정 — 네이티브 홈/WebView 홈 무한 반복 차단
- 문제: 네이티브 홈 API 404 fallback 이후 WebView `/home`으로 이동했지만, `prefersNativeHome`이 계속 true로 남아 앱 활성화/세션 저장 알림 때 네이티브 홈이 다시 표시됨. 이로 인해 `불러오는 중` 네이티브 화면과 모바일 웹 홈이 반복 전환됨.
- 수정 1: `NativeRouteCoordinator.openWebPath()` 진입 시 `prefersNativeHome = false`로 설정.
- 수정 2: `AppDelegate.onNativeSessionSaved()`는 `prefersNativeHome == true`일 때만 네이티브 홈을 표시. WebView 홈의 세션 동기화가 네이티브 홈 재표시를 유발하지 않도록 차단.
- 검증: XcodeBuildMCP `build_run_sim` 통과. Simulator에서 3초/9초/17초 캡처 모두 모바일 웹 홈에 안정적으로 머무는 것 확인.


### 2026-06-18 운영 배포 후 iOS 네이티브 홈 활성화 검증
- GitHub `main` push로 Vercel 운영 배포가 반영됨.
- `curl https://www.gleaum.com/api/native/home-summary` 결과가 404에서 인증 없는 요청 기준 정상인 `401 {"error":"Unauthorized"}`로 변경됨. `x-matched-path: /api/native/home-summary` 확인.
- `NativeRouteCoordinator.nativeHomeEnabled = true`, `prefersNativeHome = true`로 전환.
- XcodeBuildMCP `build_run_sim` 통과.
- iOS Simulator에서 네이티브 홈이 실제 운영 API 데이터를 받아 `글리움 관리자님`, 공간 `데디스컴퍼니`, 종합 일정/오늘/가계부 카드 표시 확인.
- 8초 후 재캡처에서도 네이티브 홈 유지 확인.
- `+ 새 일정` Sheet 오픈/닫기 확인. 실제 데이터 오염 방지를 위해 저장 테스트는 수행하지 않음.


### 2026-06-18 추가 보정 — WebView `/home` 복귀를 네이티브 홈으로 승격
- 문제: 네이티브 홈에서 가계부/공간/설정 등 WebView 기능으로 이동한 뒤 웹 하단 홈 탭 또는 `/home` 라우팅을 타면 WebView 홈이 유지됨. 앱 셸 관점에서는 `/home`이 항상 네이티브 홈이어야 한다.
- 원인: 기존 보정은 `WKNavigationAction`만 감시했지만, Next.js App Router의 클라이언트 라우팅(`history.pushState`, `replaceState`, `popstate`)은 WK 네비게이션 delegate에 항상 잡히지 않는다.
- 수정: `AppBridgeViewController`에 `gleaumRoute` WKScriptMessageHandler와 document-start route observer script 추가. WebView 내부의 `pushState`/`replaceState`/`popstate`/click 후 현재 `location.pathname`을 네이티브로 전달한다. `/` 또는 `/home`이면 `NativeRouteCoordinator.presentNativeHome()`을 호출한다.
- 시작 플래시 보정: 세션 보유 + 네이티브 홈 활성 상태에서는 `AppBridgeViewController.viewDidAppear`와 `NativeRouteCoordinator.presentNativeHome()`에서 WebView를 숨긴 뒤 네이티브 홈을 즉시 표시한다. WebView 기능으로 이동할 때는 `openWebPath()`에서 WebView를 다시 표시한다.
- 검증: XcodeBuildMCP `build_run_sim` 통과. 앱 시작 3초 후 네이티브 홈 직접 표시 확인.


### 2026-06-18 추가 보정 — iOS 네이티브 홈 하단 네비게이션 추가
- 문제: 네이티브 홈이 full-screen으로 WebView 위에 표시되면서 기존 웹 하단 메뉴가 가려짐. 네이티브 홈에는 하단 네비게이션이 별도로 구현되어 있지 않아 메뉴가 사라진 것처럼 보임.
- 수정: `NativeHomeViewController`에 고정 하단 네비게이션 추가. 항목은 `홈 / 일정 / 공간 / 가계부 / 전체`.
- 동작: 홈은 네이티브 홈 새로고침, 일정/공간/가계부/전체는 각각 `/schedules`, `/space`, `/budget`, `/mypage` WebView 경로로 이동.
- 레이아웃: ScrollView bottom을 하단 네비게이션 top에 고정해 콘텐츠와 메뉴가 겹치지 않게 조정.
- 검증: XcodeBuildMCP `build_run_sim` 통과. Simulator 화면과 `snapshot_ui`에서 하단 메뉴 버튼 5개가 정상 표시/타깃으로 잡힘.


### 2026-06-18 추가 보정 — iOS 네이티브 하단 네비게이션 UI 고도화
- 문제: 1차 하단 네비게이션은 텍스트 기호 아이콘(`⌂`, `◴` 등) 기반이라 조잡하고 iOS 네이티브 앱 품질 기준에 맞지 않음.
- 수정: SF Symbols 기반 `UIButton.Configuration` 탭으로 교체. `house.fill`, `calendar`, `person.2`, `creditcard`, `line.3.horizontal` 사용.
- 디자인: 어두운 블러 글래스 컨테이너 + 활성 탭 pill 배경 + Teal 활성 색상 + muted 비활성 색상으로 네이티브 홈 톤에 맞춤.
- 접근성/자동화: 각 탭을 실제 `UIButton`으로 구현하고 `accessibilityLabel`/selected trait 지정. XcodeBuildMCP `snapshot_ui`에서 홈/일정/공간/가계부/전체 버튼 타깃 확인.
- 검증: XcodeBuildMCP `build_run_sim` 통과 및 Simulator 화면 확인.

---

## 2026-06-23 — Android Firebase 운영 계측/푸시 라우팅 보강

### 배경
- Android 네이티브 전환 이후 `NativeHomePortActivity` 등 네이티브 화면으로 직접 진입하는 구간이 생겼다.
- 기존 React `FCMProvider`, `FirebaseServicesProvider`, `trackEvent()`는 WebView/React가 마운트되어야 실행된다.
- 따라서 완전 네이티브 진입 상태에서는 FCM 토큰 등록, 알림 탭 라우팅, 화면 이벤트 수집이 누락될 수 있었다.

### 수정
- `android/app/src/main/java/com/gleaum/app/NativeFirebase.kt`
  - Firebase App/Analytics/Crashlytics/Remote Config 초기화 허브 추가.
  - 세션 JWT에서 user id를 추출해 Analytics userId, Crashlytics userId/custom key 연결.
  - FirebaseMessaging token을 받아 Supabase REST `profiles.fcm_token`에 직접 저장.
  - 모든 Activity 화면 진입을 `screen_view` 이벤트와 Crashlytics `last_screen` key로 기록.
- `android/app/src/main/java/com/gleaum/app/GleaumFirebaseMessagingService.kt`
  - FCM token refresh 수신 시 서버 동기화.
  - foreground/data 메시지를 시스템 알림으로 표시.
  - 알림 탭 Intent에 `url` extra를 전달.
- `android/app/src/main/java/com/gleaum/app/NativeDeepLinkRouter.kt`
  - FCM/App Link/WebView bridge에서 공통으로 사용할 네이티브 경로 매핑 추가.
  - `/home`, `/schedules`, `/schedules/{id}`, `/budget`, `/notifications`, `/space`, `/mypage`, `/legal/*`를 네이티브 화면으로 매핑.
- `android/app/src/main/java/com/gleaum/app/SplashActivity.kt`
  - 스플래시가 RouterActivity로 전환할 때 최초 Intent data/extras/action을 보존하도록 수정.
  - 푸시 알림/딥링크로 앱을 열 때 URL 정보가 스플래시에서 유실되던 문제 방지.
- `android/app/src/main/java/com/gleaum/app/RouterActivity.kt`
  - 로그인 세션이 있고 알림 URL이 네이티브 경로로 매핑 가능하면 해당 Native Activity로 직접 이동.
  - OAuth callback은 기존대로 MainActivity로 전달.
- `android/app/src/main/java/com/gleaum/app/SessionManager.kt`
  - 세션 저장 직후 NativeFirebase 세션 동기화 실행.
- `android/app/src/main/AndroidManifest.xml`
  - `GleaumFirebaseMessagingService` 등록.
- `android/app/build.gradle`
  - 직접 네이티브 FCM 서비스를 사용하기 위해 `firebase-messaging-ktx` 추가.

### 검증
- `cd android && JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :app:assembleDebug --quiet` 통과.

### 남은 운영 검증
- Firebase Console DebugView 또는 실시간 이벤트에서 네이티브 Activity별 `screen_view` 수신 확인.
- Crashlytics에서 user id / `last_screen` custom key가 붙는지 확인.
- 실기기에서 FCM token이 `profiles.fcm_token`에 저장되는지 확인.
- FCM payload `data.url`이 `/schedules/{id}`, `/budget`, `/notifications`일 때 해당 네이티브 화면으로 직접 진입하는지 확인.

---

## 2026-06-23 — Android Native Port 다크모드/태블릿/라우팅 1차 보강

### 목적
- 모든 핵심 앱 경로가 Android 네이티브 화면을 우선 사용하도록 정리.
- 기존 네이티브 화면의 라이트 고정 컬러를 시스템 다크모드에 맞춰 대응.
- 태블릿/폴더블은 `NativeAdaptive` 기준의 최대 폭/중앙 정렬 구조를 유지.

### 수정
- `NativeTheme.kt` 추가
  - DESIGN.md의 `--theme-*`에 대응하는 Android 네이티브 테마 매퍼.
  - `uiMode`가 다크면 배경/표면/보조 텍스트/테두리 컬러를 다크 토큰으로 변환.
  - `applySystemBars()`로 라이트/다크 시스템바 아이콘 대비를 자동 조정.
- 주요 Android 네이티브 화면의 `color("#...")` 호출을 `NativeTheme.color()` 경유로 변경.
- 주요 Android 네이티브 화면의 `applyLightSystemBars()`를 `NativeTheme.applySystemBars()`로 교체.
- `MainActivity` WebView route bridge의 경로 매핑을 `NativeDeepLinkRouter`로 단일화.
- `NativeDeepLinkRouter`에 `/invite/{code}`, `/family`, `/space/settings` 매핑 추가.
- `NativeSpaceActivity`에 `invite_code` extra 처리 추가.
  - 초대 링크로 진입하면 네이티브 공간 화면에서 참여 확인 다이얼로그 표시.
- `LoginActivity`가 최초 딥링크/초대 경로를 기억하고, 로그인 후 가능한 네이티브 경로로 이어가도록 보정.
- `NativePortFlags`의 schedule/budget/space 플래그를 실제 라우팅 상태에 맞춰 `true`로 정리.

### 검증
- Android `:app:assembleDebug` 통과.

### 아직 완전 네이티브 예외
- `/onboarding`은 아직 WebView 기반이다. 네이티브 로그인 이후 온보딩/개인화 플로우를 완전히 Android Native로 옮기려면 별도 Activity/API 설계가 필요하다.
- `/admin/ads`, `/download`는 앱 내부 핵심 사용자 기능이 아니라 웹 유지 가능 영역이다.
- `/legal/*`은 네이티브 Activity 안의 인앱 WebView 문서 뷰로 유지한다. 법무 문서는 서버 문서 단일 소스가 더 안전하다.
- 다크모드는 1차 토큰 매핑 적용 단계다. 실기기에서 각 화면별 대비 캡처 검수가 필요하다.

---

## 2026-06-23 — Android 네이티브 온보딩 1차 추가

### 목적
- 로그인 직후 신규 사용자가 WebView `/onboarding`으로 떨어지지 않게 Android Native 온보딩 흐름을 제공.
- 웹 온보딩과 같은 `profiles` 필드/`preferences` 구조를 저장하되, Android에서는 1차 핵심 단계로 단순화.

### 수정
- `src/app/api/native/onboarding/complete/route.ts` 추가
  - Bearer/cookie 모두 지원하는 `createNativeRouteAuth()` 기반.
  - `completeNativeOnboarding()` 호출 후 profile summary 반환.
- `src/lib/db.ts`
  - `NativeProfileSummary.onboardingCompleted` 추가.
  - `getNativeProfileSummary()` / `updateNativeProfile()` select에 `onboarding_completed_at` 포함.
  - `completeNativeOnboarding()` 추가: 웹 `completeOnboarding()`과 동일한 필드 저장.
- `android/app/src/main/java/com/gleaum/app/NativeOnboardingApi.kt` 추가
  - `POST https://www.gleaum.com/api/native/onboarding/complete` 호출.
- `android/app/src/main/java/com/gleaum/app/NativeOnboardingActivity.kt` 추가
  - 4단계 네이티브 온보딩: 이름/표시 방식 → 사용 목적 → 홈 구성 → 공간/알림.
  - 저장 데이터는 웹 온보딩과 동일한 `preferences`, `notification_settings`, `onboarding_completed_at`.
- `android/app/src/main/java/com/gleaum/app/NativeHomePortModels.kt`
  - 홈 요약의 `user.onboardingCompleted` 파싱.
- `android/app/src/main/java/com/gleaum/app/NativeHomePortActivity.kt`
  - 홈 요약 로딩 후 온보딩 미완료 사용자는 `NativeOnboardingActivity`로 전환.
- `android/app/src/main/java/com/gleaum/app/LoginActivity.kt`
  - 로그인 성공 기본 목적지를 네이티브 `/home`으로 변경. 홈에서 온보딩 필요 여부를 판정.
- `android/app/src/main/java/com/gleaum/app/NativeDeepLinkRouter.kt`, `MainActivity.kt`
  - `/onboarding`도 네이티브 온보딩 Activity로 승격.
- `android/app/src/main/AndroidManifest.xml`
  - `NativeOnboardingActivity` 등록.

### 검증
- Android `:app:assembleDebug` 통과.
- `npm run build` 통과. `/api/native/onboarding/complete` 라우트 생성 확인.

### 후속
- 네이티브 온보딩 1차는 생체인증 설정/공간 생성·참여까지 모두 포함하지 않고 핵심 개인화 저장에 집중한다.
- 공간 생성/참여는 현재 네이티브 `NativeSpaceActivity`에서 처리 가능하므로, 온보딩 내 직접 생성/참여까지 넣을지는 실기기 UX 확인 후 결정.

### 2026-06-23 추가 — Android 온보딩 공간/생체 설정 보강
- `NativeOnboardingActivity` 4단계 핵심 온보딩을 5단계로 확장.
- 공간 설정 단계 추가:
  - `나중에 설정`
  - `새 공유 공간 만들기` → `NativeSpaceApi.create()` 호출
  - `초대 코드로 참여` → `NativeSpaceApi.join()` 호출
- 알림/보안 단계에 생체인증 앱 잠금 토글 추가.
  - 기기 잠금/지문 사용 가능 여부를 확인하고, 가능할 때만 `CapacitorStorage`의 기존 생체인증 키(`gleaum:biometric-*`)에 설정 저장.
  - 실제 인증 프롬프트 강제 실행은 하지 않음. 첫 잠금/해제는 기존 앱 잠금 흐름이 처리.
- Android `:app:assembleDebug` 통과.

### 2026-06-24 추가 — Android Native Theme 사용자 선택값 반영

- `NativeTheme.isDark()`가 시스템 다크모드만 보던 문제를 수정.
- `CapacitorStorage`의 `gleaum:theme-mode` 값을 읽어 `system/light/dark`를 네이티브 화면 전체 테마 판단에 반영.
- `NativeMyMenuActivity`에서 화면 모드 변경 직후 system bar 색상까지 즉시 재적용.
- Android `:app:assembleDebug` 통과.

### 2026-06-24 추가 — Android Native Home Layout 설정 연결

- `NativeMyMenuActivity`의 홈 레이아웃 설정 값을 웹 공통 타입과 맞춤.
  - 기존 Android 로컬 값 `schedule_first` → `calendar_first`, `budget_first` → `expense_first` 하위 호환 처리.
  - 신규 저장값은 `balanced/calendar_first/routine_first/expense_first/space_first` 사용.
- `NativeHomePortActivity`가 `gleaum:home-layout` 값을 읽어 홈 히어로 카피와 캘린더 초기 펼침 상태에 반영.
- 웹 `MobileHome.tsx` 기준과 동일하게 섹션 전체 재배치가 아니라 홈 개인화 문구/초기 캘린더 상태 중심으로 반영.
- Android `:app:assembleDebug` 통과.

### 2026-06-24 추가 — Android Native UI 품질 보정

- 다크모드에서 보조 텍스트/chevron/가계부 금액 텍스트가 고정 색상처럼 보이던 구간을 `NativeTheme.text/muted` 기반으로 보정.
- 화면별로 복붙되어 있던 하단 네비게이션을 `NativeBottomNav` 공통 컴포넌트로 분리.
  - 홈/일정/공간/가계부/전체 화면이 동일한 높이, 아이콘 위치, 라벨 위치, active indicator를 사용.
  - 일정 화면의 문자 기반 임시 아이콘(`⌂`, `□`, `⌘`) 제거.
- 반복되는 작은 타일/칩/통계 박스의 과한 그라데이션을 단색 브랜드 accent/surface 처리로 낮춤.
- Android `:app:assembleDebug` 통과 후 연결 기기 `HA1R8ST7`에 `installDebug` 완료.

### 2026-06-24 추가 — Android 다크모드 색상 역할 보정 및 M3 개편 계획

- `NativeTheme`에 `rawColor()`, `alpha()`, `onDarkText()`, `onDarkMuted()` 추가.
- `NativeTheme.text/muted/subtle`을 다크모드에서 명시적 readable color로 반환하도록 수정.
- 각 Native Activity의 `colorWithAlpha()`가 테마 치환을 타지 않고 절대색 alpha를 쓰도록 일괄 보정.
- 입력 필드 hint/text 색상 일부를 `NativeTheme.text/subtle`로 보정.
- 다크모드 실기기 캡처에서 홈 주요 텍스트 대비가 회복됨 확인.
- Android Material Design 3 전면 개편 계획 문서 추가: `docs/19-android-material3-redesign-plan.md`.

### 2026-06-24 추가 — Android 전면 개편 방향 상향: Compose Material 3

- Android Native UI는 더 이상 수작업 View 기반 Material 유사 UI로 유지하지 않음.
- Google 공식 Material 3 컴포넌트를 기본 베이스로 삼는 Compose Material 3 전환 방향으로 확정.
- 당시 Gradle은 Compose 미활성 상태였으며, 바로 다음 Phase 0 작업에서 Compose BOM/material3/activity-compose/adaptive 의존성 추가를 완료했다.
- M3 컴포넌트 도입 대상: Scaffold, TopAppBar, NavigationBar/Rail/Drawer, FAB, Card, ListItem, TextField, SegmentedButton, Chip, DatePicker, TimePicker, Dialog, BottomSheet, Snackbar, Badge 등.
- Motion 도입 대상: AnimatedVisibility, animateContentSize, Crossfade, AnimatedContent, animateColorAsState, animateDpAsState, LazyColumn item animation.
- 사용자 요청인 상위 메뉴 선택 시 하위 메뉴가 펼쳐지는 액션은 `AnimatedVisibility + animateContentSize + chevron rotation` 공통 패턴으로 도입 예정.
- 상세 계획은 `docs/19-android-material3-redesign-plan.md` 9~14절 참조.

### 2026-06-24 추가 — Compose Material 3 Phase 0 적용

- Android Gradle에 Compose Material 3 기반을 추가.
  - `org.jetbrains.kotlin.plugin.compose` 적용
  - `buildFeatures.compose = true`
  - Compose BOM `2026.06.00`
  - `androidx.compose.material3:material3`
  - `material3-adaptive-navigation-suite`
  - `activity-compose`
  - `material-icons-extended`
  - `lifecycle-runtime-compose:2.9.1` (`2.11.0`은 compileSdk 37 요구로 제외)
- Compose foundation 추가:
  - `ui/theme/GleaumTheme.kt`
  - `ui/components/GleaumScaffold.kt`
  - `ui/components/GleaumExpandableSection.kt`
  - `ui/screens/Material3ShellPreviewScreen.kt`
- `Material3ShellPreviewActivity` 추가.
  - Debug 검증용 Compose M3 Shell Preview.
  - release build에서는 `BuildConfig.DEBUG` 체크로 즉시 종료.
  - ADB 직접 실행 검증을 위해 manifest `exported=true` 설정.
- 실기기 `HA1R8ST7`에서 Preview Activity 실행 및 캡처 확인: `/tmp/gleaum-material3-shell-preview.png`.
- Android `:app:assembleDebug` 및 `:app:installDebug` 통과.

다음 작업은 기존 `NativeHomePortActivity`를 바로 수정하지 말고, Compose Home screen을 병행 구현한 뒤 feature flag로 전환하는 방식이 안전하다.

### 2026-07-09 추가 — Android Kakao AdFit SDK 탑재

- Android 네이티브 앱에 Kakao AdFit SDK 기반 의존성을 추가했다.
- 추가 파일:
  - `android/build.gradle`
    - Kakao Dev Maven repository `https://devrepo.kakao.com/nexus/content/groups/public/` 추가.
  - `android/app/build.gradle`
    - `com.kakao.adfit:ads-base:3.22.2`
    - `com.google.android.gms:play-services-ads-identifier:18.2.0`
- 현재 상태:
  - SDK 탑재 완료.
  - 홈 화면 하단 광고 지면 연결 완료.
  - 광고 단위명: 앱 실행 하단.
  - 광고 단위 코드: `DAN-Brd0FQAE3ByDWwJu`.
  - 스플래시 종료 후 `NativeHomePortActivity`의 Compose 홈 화면에 진입하면 하단 NavigationBar 바로 위에 노출된다.
- 추가 파일:
  - `android/app/src/main/java/com/gleaum/app/ui/components/AdFitBanner.kt`
    - `BannerAdView`를 Compose `AndroidView`로 감싼 홈 하단 전용 배너 컴포넌트.
    - Activity lifecycle에 맞춰 `resume/pause/destroy` 처리.
- 변경 파일:
  - `android/app/src/main/java/com/gleaum/app/ui/components/GleaumScaffold.kt`
    - 홈 화면에만 하단 광고 슬롯을 주입할 수 있도록 `bottomContent` 추가.
  - `android/app/src/main/java/com/gleaum/app/NativeHomePortActivity.kt`
    - `GleaumScaffold(bottomContent = { AdFitHomeBottomBanner() })` 연결.
  - `android/app/src/main/java/com/gleaum/app/ui/screens/home/ComposeHomeScreen.kt`
    - 기존 중간 광고 placeholder 제거.
- 주의:
  - Android 네이티브 AdFit은 웹 `<script>` 방식이 아니라 SDK + 광고 단위 ID 기반으로 연결한다.
  - 기존 AdMob/App Open Ad 구조와 충돌하지 않도록 AdFit 지면은 별도 네이티브 컴포넌트로 분리했다.
  - AdFit 광고 View는 심사/수익 문제 방지를 위해 라운딩, 클리핑, 오버레이 없이 원본 영역 그대로 노출해야 한다.
  - 검증: Android `:app:assembleDebug` 통과.

### 2026-07-09 추가 — 웹 검색/관리자 크롤링 차단/Google Play 연결

- Google Play 프로덕션 승인 이후 웹 SEO/보안 노출 정책을 보강했다.
- 프론트 공개 구간:
  - `src/app/robots.ts` 추가.
    - `/` 검색 허용.
    - `/admin/`, `/api/admin/`, `/api/cron/`, `/api/native/`, `/api/push/`, `/auth/callback` 크롤링 차단.
    - `https://gleaum.com/sitemap.xml` 연결.
  - `src/app/sitemap.ts` 추가.
    - `/`, `/download`, `/legal/terms`, `/legal/privacy`, `/legal/delete-account`만 사이트맵에 포함.
- 관리자/백엔드 검색 차단:
  - `next.config.ts`에 `X-Robots-Tag: noindex, nofollow, noarchive` 헤더 추가.
    - `/admin/:path*`
    - `/api/admin/:path*`
    - `/api/cron/:path*`
  - `src/app/admin/layout.tsx`에 `robots: noindex/nofollow` metadata 추가.
- Google Play 다운로드 연결:
  - Play Store URL: `https://play.google.com/store/apps/details?id=com.gleaum.app`
  - `src/components/landing/PcLandingPage.tsx`
    - Google Play 배지 클릭 시 실제 Play Store로 이동.
    - 랜딩 상단/하단 `다운로드` 링크는 `/download`로 이동.
  - `src/app/download/layout.tsx` 추가.
    - `/download` canonical, OpenGraph, App Links metadata, Google Play 앱 힌트 추가.
- 앱 링크/검색 결과 보강:
  - `src/app/layout.tsx`
    - Android App Links metadata 추가.
    - `android-app://com.gleaum.app/https/gleaum.com`, `android-app://com.gleaum.app/https/www.gleaum.com` alternate 추가.
  - `src/app/page.tsx`, `src/app/download/page.tsx`
    - `SoftwareApplication` JSON-LD 추가.
  - `public/manifest.json`
    - `related_applications`에 Google Play 앱(`com.gleaum.app`) 추가.
    - `prefer_related_applications`는 `false` 유지. PWA 설치를 강제하지 않고 네이티브 앱 연관성만 제공.
- 기존 Android App Links 기반:
  - `public/.well-known/assetlinks.json`은 이미 `com.gleaum.app`과 release SHA-256을 포함.
  - AndroidManifest는 `gleaum.com`, `www.gleaum.com` https App Links와 `gleaum://` scheme을 이미 처리.
- 검증:
  - `npm run build` 통과.

### 2026-07-09 추가 — 모바일 웹 OS별 앱 설치 안내 분리

- 모바일 웹 사용자의 설치 안내를 OS별로 분리했다.
- 변경 파일:
  - `src/components/PWAInstallBanner.tsx`
- Android 모바일 브라우저:
  - 기존 `beforeinstallprompt` 기반 PWA 설치 안내를 1순위로 쓰지 않는다.
  - 1.5초 후 공식 Google Play 설치 CTA를 노출한다.
  - 문구: `Google Play 앱으로 더 안정적으로 사용하세요`
  - 주요 CTA: `Google Play에서 설치`
  - 보조 CTA: `웹으로 계속`
  - Play Store URL: `https://play.google.com/store/apps/details?id=com.gleaum.app`
- iPhone/iPad Safari:
  - iOS 앱 출시 전까지 기존 PWA 홈 화면 추가 안내를 유지한다.
  - 공유 버튼 → 홈 화면에 추가 → 추가 순서 안내.
- 네이티브 앱 내부:
  - 기존처럼 Capacitor 네이티브 앱에서는 설치 배너를 표시하지 않는다.
- 검증:
  - `npm run build` 통과.

### 2026-07-09 추가 — 백엔드 P0 RLS/알림 API 하드닝 1차

- 목적:
  - 공간 멤버십, 알림, 캠페인 로그, 푸시 발송 구간의 우회 가능성을 먼저 차단했다.
  - 운영 DB에는 아래 SQL을 Supabase SQL Editor에서 별도 실행해야 실제 반영된다.
- 추가 파일:
  - `supabase/migrations/018_harden_backend_rls.sql`
    - `space_members` 자가 참여 insert 정책 제거.
    - 초대코드 참여는 서버 `service_role` 기반 API에서만 처리하도록 RLS 경계 보강.
    - `notifications` 일반 클라이언트 insert는 본인 알림만 허용.
    - `campaign_logs`, `campaign_clicks`, `campaign_send_details`는 `service_role` 전용 정책으로 교체.
    - 주요 `SECURITY DEFINER` 함수의 `search_path`와 `EXECUTE` 권한 하드닝.
    - `schedules` UPDATE `WITH CHECK` 추가.
    - `schedule_participants` insert 시 같은 공간 멤버만 추가 가능하도록 제한.
  - `src/lib/api/request-guards.ts`
    - UUID, 내부 URL, 문자열 길이 제한 검증 유틸.
- 변경 파일:
  - `src/app/api/notifications/send/route.ts`
    - raw FCM token 직접 발송 API를 `CRON_SECRET`/`INTERNAL_API_SECRET` 서버 호출 전용으로 제한.
    - title/body/url/fcmToken 길이 및 내부 URL 검증 추가.
  - `src/app/api/notifications/renotify/route.ts`
    - 일정 존재 확인 후 작성자 또는 공간 editor/admin만 재알림 가능하도록 권한 검증 추가.
    - 외부 URL 주입 방지.
  - `src/app/api/push/send/route.ts`
    - 요청자 인증 필수화.
    - 요청자가 해당 공간 멤버인지 먼저 검증.
    - 멤버/토큰 조회는 검증 후 `service_role`로 수행.
    - `VAPID_PRIVATE_KEY`가 없어도 네이티브 FCM 발송은 계속 가능하도록 웹푸시/FCM 흐름 분리.
- 검증:
  - `npm run build` 통과.
- 운영 반영 필요:
  - Supabase Dashboard → SQL Editor → New query에서 `supabase/migrations/018_harden_backend_rls.sql` 파일 전체 내용을 복사해 실행해야 한다.
  - 실행 후 마지막 `pg_policies` 결과에서 새 정책명이 보이는지 확인한다.

### 2026-07-09 추가 — space_members UPDATE 정책 추가 하드닝

- Supabase에서 `018_harden_backend_rls.sql` 실행 후 `space_members` 닉네임 수정 UPDATE 정책이 중복으로 남아 있는 것이 확인됐다.
- 추가 파일:
  - `supabase/migrations/019_tighten_space_member_update_policies.sql`
- 목적:
  - `space_members: 본인 닉네임 수정` / `space_members_nickname_update` 중복 정책 정리.
  - RLS가 컬럼 단위 제한이 아니라는 점을 보완하기 위해 `guard_space_member_update()` 트리거 추가.
  - 일반 사용자는 본인 닉네임만 수정 가능하고, `role`, `space_id`, `user_id`, `joined_at` 변경은 기존 공간 admin만 가능하도록 DB 레벨에서 차단.
  - `space_members`, `schedules`, `schedule_participants`의 기존 `{public}` 정책을 `TO authenticated`로 명확화.
- 운영 반영 필요:
  - Supabase Dashboard → SQL Editor → New query에서 `supabase/migrations/019_tighten_space_member_update_policies.sql` 파일 전체 내용을 복사해 실행한다.

### 2026-07-10 추가 — 관리자 콘솔 단일화 및 운영 기능 보강

- 공식 관리자 콘솔은 `admins.gleaum.com` 백오피스만 사용한다.
- 메인 앱 내부 `/admin` 광고 관리 페이지와 `/api/admin/ads` 계열 API는 제거했다.
- `https://gleaum.com/admin` 및 하위 경로는 `https://admins.gleaum.com`으로 영구 리다이렉트한다.
- 백오피스 공간 관리 보강:
  - `/spaces`에 서버 페이지네이션을 추가했다. 기본 50개 단위.
  - `/spaces/[id]` 상세 페이지를 추가했다.
  - 공간 상세에서 멤버, 역할, FCM 상태, 최근 일정, 원장 항목, 초대코드, 커뮤니티 게시글 수를 확인한다.
- 백오피스 회원 관리 보강:
  - `/users`에 서버 페이지네이션을 추가했다. 기본 50명 단위.
- 캠페인 Space 세그먼트 오류 수정:
  - `space_member` 발송 조건 선택 시 대상 Space 선택 UI를 추가했다.
  - 대상 수 조회와 발송 대상을 `profiles.family_group_id`가 아니라 `space_members.space_id` 기준으로 변경했다.
  - `{{space_name}}` 변수도 선택한 Space 이름 기준으로 치환한다.
- 광고 관리 보강:
  - 백오피스 `/ads`가 공식 광고 관리 화면이다.
  - 광고 삭제 버튼은 물리 삭제가 아니라 `is_active=false`, `ends_at=now()` 보관 처리로 변경했다.
  - 광고 슬롯은 백오피스의 `ad_slots` DB 로딩 기준을 사용한다.
- 검증:
  - `npm run build` 루트 통과.
  - `npm run build` 백오피스 통과.
  - `npx tsc --noEmit` 백오피스 통과.

### 2026-07-14 추가 — 공간 전환 및 공간 화면 UX 개편

- 변경 파일:
  - `src/app/space/SpaceSwitcher.tsx`
  - `src/app/space/MobileSpace.tsx`
  - `src/app/space/DesktopSpace.tsx`
  - `src/app/space/SpaceFeed.tsx`
  - `src/lib/db.ts`
- 활성 공간 결정 우선순위는 `URL sid → localStorage 최근 공간 → 현재 화면 공간 → profiles.family_group_id`이며, 반드시 `getMySpaces()` 결과에 포함된 공간만 선택한다.
- 공간을 선택하면 `/space?sid={spaceId}`와 `gleaum_lastSpaceId`를 함께 갱신한다. 이후 공간 상세 기능을 추가할 때도 `profiles.family_group_id`만 현재 공간으로 간주하지 않는다.
- `joinSpaceByCode()` 성공 결과에 `spaceId`를 포함하므로 참여 완료 직후 정확한 공간으로 전환할 수 있다.
- PC는 대형 Hero를 제거하고 공간 선택·역할/월 요약·일정/초대 액션을 한 행으로 축소했다.
- 모바일과 PC의 공간 본문은 `소식 / 일정 / 멤버` 탭을 공유한다. 일정은 `SpaceScheduleTimeline`을 현재 화면 안에서 사용한다.
- 검증 완료: `npm run build`, 공간 TSX 대상 ESLint.

### 2026-07-14 추가 — Android 네이티브 공간 전환 긴급 수정

- 실제 Android 화면은 `NativePortFlags.ENABLE_COMPOSE_SPACE=true`이므로 `ComposeSpaceScreen` 경로가 운영 대상이다.
- 기존 `NativeSpaceActivity`의 `onSpaceClick`은 비활성 공간을 눌러도 준비 중 토스트만 표시했다. 현재는 `NativeSpaceApi.activate()`를 호출한다.
- 신규 운영 API:
  - `POST /api/native/spaces/{spaceId}/activate`
  - 로그인 사용자와 `space_members` 멤버십을 확인한 후에만 활성 공간을 변경한다.
  - 별도 Supabase migration/SQL 실행은 필요 없다.
- Android Material 3 공간 화면:
  - 현재 공간 compact card
  - 공간 전환 `ModalBottomSheet`
  - `요약 / 멤버 / 관리` section chip
  - 초대 코드, 일정 이동, 공간 참여/생성 액션
- 운영 배포:
  - Vercel deployment `dpl_4qcuBya9ZMZYX1Z3hGe2CdpVM6o9`
  - `https://www.gleaum.com` alias 반영 완료
- 검증:
  - `npm run build` 통과
  - Android `:app:assembleDebug` 통과
  - 연결 기기 `SM_F731N` APK 설치 성공
  - `NativeSpaceActivity` 실행 로그에 크래시 없음. 단말 화면이 꺼져 있어 시각 캡처 검증은 사용자가 화면을 켠 뒤 최종 확인 필요.

### 2026-07-14 추가 — Android 공간 정보 구조를 커뮤니티 중심으로 재정렬

- 직전 `요약 / 멤버 / 관리` 구조는 공간의 운영 정보가 콘텐츠보다 먼저 노출되는 문제가 있어 폐기했다.
- 기본 진입 화면을 `소식`으로 변경하고 `소식 / 일정 / 멤버`를 공간의 3개 핵심 구간으로 확정했다.
- 공간 화면에서 바로 일반 소식을 작성할 수 있는 네이티브 API와 작성 UI를 추가했다.
  - `POST /api/native/spaces/{spaceId}/posts`
  - `space_posts` 기존 테이블/RLS를 사용하므로 신규 Supabase SQL은 없다.
- 공간 요약 API가 현재 공간의 최근 게시글 12개와 다가오는 일정 8개를 함께 반환한다.
- 초대 코드, 역할, 공간 이름 변경 등 운영 정보는 우측 설정 버튼의 `ModalBottomSheet`로 이동했다.
- 색상 체계에서 Material 3 미지정 fallback role이 보라/분홍 계열로 나타나지 않도록 light/dark `ColorScheme`의 container·inverse·error·surface 역할을 모두 글리움 Blue/Teal/Green 및 neutral로 명시했다.
- 검증 완료: `npm run build`, Android `:app:assembleDebug`.

### 2026-07-14 추가 — Android Material 3 UI A등급 기반 정리

- Android UI 작업의 정량 기준은 `docs/22-android-material3-ui-audit.md`가 단일 기준이다.
- 공통 UI는 `GleaumTheme`, `GleaumScaffold`, `GleaumAdaptiveContent`, `GleaumFeedbackBanner`, `GleaumStatusBadge`, `GleaumStateCard`를 우선 사용한다.
- 카드 역할은 `Elevated=대표 요약`, `Filled=정보 그룹`, `Outlined=행동/목록`으로 고정한다.
- 정적 상태/분류를 `AssistChip(onClick = {})`로 표시하거나 일반 안내에 `errorContainer`를 사용하는 패턴은 금지한다.
- 공통 메뉴는 Material 3 Adaptive Navigation Suite이므로 화면별 별도 하단 메뉴를 만들지 않는다.
- 코드 감사 평균은 90.8점(A)이며, 연결 단말은 잠금/화면 꺼짐 상태라 시각 QA 점수는 아직 확정하지 않았다.
- Android debug 빌드 통과, lint 오류 0건.

### 2026-07-23 추가 — 자녀 연결 WebView 안전 영역과 네이티브 전환 경계

- `/space/children`, `/invite/child/[token]`, `/family/guardian/verify`에서 전역 하단 내비게이션·푸터·PC 사이드바가 집중 흐름과 겹치지 않도록 제거했다.
- Android `MainActivity`는 실제 시스템바·컷아웃 `WindowInsets`를 CSS `--native-safe-area-inset-*`로 전달한다.
- Web은 CSS `env()`와 Android 주입값을 `--app-safe-*`로 병합하고, 자녀 연결 화면에는 구버전 앱용 최소 24px fallback을 둔다.
- 검증: 대상 ESLint, TypeScript, 자녀 테스트 3/3, Next production build 55/55, Android debug build 통과.
- 운영: 커밋 `996b891`, Vercel Production `dpl_Cy4qKA2ctT4TmuoJsYwZnPfyevXU`, 공개 루트·초대 경로 200, `SM_F731N` debug APK 설치 완료.
- 실기기 생체인증 해제 후 상·하단 버튼 조작 회귀가 남아 있다.
- 다음 `FAM-013`은 보호자 자녀 목록/등록/OTP/동의/공유/승인·거절과 자녀 claim을 Compose Material 3로 전환한다. 외부 Google OAuth와 법적 원문만 시스템 인증·`LegalWebViewActivity`로 유지한다.

### 2026-07-23 추가 — 자녀 Compose 전환·공개 랜딩·Android 네이티브 Google

- `FAM-013` 네이티브 코드는 완료했다. `NativeChildAccountActivity`에서 자녀 목록/등록, 8자리 OTP, 필수 동의, 초대 공유, 승인·거절, 자녀 claim을 처리한다.
- 관련 자녀 API는 Cookie와 Android Bearer access token을 모두 검증한다. Production 배포 후 `SM_F731N`에서 기존 자녀 2명 조회를 확인했다.
- 자녀 생년월일 필드는 숫자 키보드에서 하이픈을 입력할 수 없던 문제를 수정했다. 숫자 8자리를 자동 포맷하며 `TextFieldValue`로 커서를 끝에 유지한다. 단위 테스트와 `SM_F731N` 등록 버튼 활성화까지 통과했다.
- 공개 `/`은 PC·태블릿·모바일 공통 반응형 랜딩이며 SSR HTML에도 서비스 소개를 제공한다. 앱 런타임만 hydration 후 네이티브 세션 라우팅으로 전환한다.
- Android Google 로그인은 Credential Manager 계정 선택 → Google ID token → Supabase `grant_type=id_token` 교환 방식이다.
- 외부 설정 잔여: Firebase Android 앱 `com.gleaum.app`에 debug SHA-1 `9D:9E:3B:4F:AB:1C:B3:46:C7:9F:D0:70:F4:A1:07:49:17:7B:64:E2`, release 및 Play App Signing SHA-1을 모두 등록하고 최신 `google-services.json`을 내려받아야 한다.
- iOS 재개 기준과 P0/P1 순서는 `docs/27-ios-resumption-readiness.md`가 최신 단일 보고서다.
