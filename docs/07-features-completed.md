# 07. 완료된 기능

### 2026-07-23 — Supabase OTP 메일 목적 분리

- Supabase Dashboard에 사용자 정의 Auth 템플릿 종류를 추가할 수 없는 제약을 반영해 고정 `Magic link or OTP` 슬롯을 조건 분기형으로 변경
- 보호자 OTP 요청에 `emailRedirectTo=https://www.gleaum.com/auth/email-purpose/guardian-verification` 식별값 추가
- 템플릿의 `{{ .RedirectTo }}` 조건문으로 보호자 확인 안내와 향후 일반 이메일 OTP 안내 분리
- 공용 제목을 `[글리움] 이메일 확인 코드`로 변경하고 운영 Supabase Dashboard에 저장 완료
- 일반 이메일/비밀번호 회원가입은 별도 `Confirm sign up` 템플릿을 사용하므로 영향 없음
- Vercel Production `dpl_3M2He5p9F3UfBs5H4tW3u7kRXZwy` 배포 완료
- 운영 실메일이 8자리로 발급되는 것을 기준으로 UI·API 검증·메일 안내를 `GUARDIAN_EMAIL_OTP_LENGTH=8`로 통일
- 8자리 보정 Vercel Production `dpl_6tpDS5ay519BAZsTaVZo18JhJFKe` 배포 완료

검증:
- 운영 Supabase Redirect URL에 `https://www.gleaum.com/**` 허용 확인
- 대상 ESLint, `git diff --check`, `npm run build` 통과
- Dashboard 저장 알림 `Successfully updated email template` 확인
- 운영 보호자 인증 API 미인증 요청이 `401 unauthorized`를 반환하는 것 확인
- 실제 보호자 메일 수신·본문 분기와 OTP 완료는 로그인 실사용자 회귀 확인 필요

### 2026-07-23 — 보호자 이메일 OTP·필수 동의 흐름 정합화

- Supabase 메일 템플릿은 OTP를 발송하지만 앱은 Magic Link를 기다리던 프로토콜 불일치 수정
- 자녀 관리 화면에 운영 메일과 일치하는 8자리 OTP 입력·재발송 UI 추가
- OTP 성공 후에만 `guardian_email_verifications.verified_at`을 기록하는 서버 함수 추가
- 확인 증적이 없는 필수 동의 요청은 DB에서 차단
- 보호자 관계와 동의 증빙 방법을 `email_otp`, 정책 버전을 `2026-07-23-email-otp-v2`로 명시
- 운영 Supabase migration `20260723035907_guardian_email_otp_verification.sql` 적용 및 함수 권한 검증 완료
- Supabase Auth의 Magic Link/OTP 제목·본문을 저장소 HTML로 운영 적용
- Vercel Production `dpl_Gc7Dmx7ahfUVTw7qvnEY7GYEzLfr` 배포 완료

검증:
- 변경 경로 ESLint, `git diff --check`, `npm run build` 통과
- `confirm_guardian_email_verification`, `complete_guardian_email_consent`: `anon=false`, `authenticated=true`
- 운영 `/space/children` 인증 리다이렉트 `307`, 신규 OTP API 미인증 요청 `401`

### 2026-07-23 — Android 자녀 초대 WebView 경로 복귀 오류 수정

- 가족 공간 멤버 탭에서 `초대 → 자녀`를 선택하면 `/space/children?sid=...`가 잠깐 열린 뒤 네이티브 홈으로 돌아가던 오류 수정
- 원인: `NativeAppProvider.applyNativeSession()`이 네이티브 세션을 재적용할 때 현재 WebView 경로와 관계없이 `/home` 또는 `/onboarding`으로 이동
- 세션 재적용은 계속 수행하되, 후속 진입 경로 계산과 화면 이동은 `/` 또는 `/login`에서만 실행하도록 제한
- `/space/children`, 약관, 설정 등 의도적으로 연 WebView 기능 경로는 세션 동기화 후에도 그대로 유지
- 운영 Vercel Production `dpl_8haU9476UgHXLDmZ3Pnd8maqwXJN` 배포 완료

검증:
- 변경 파일 ESLint 통과
- `npm run build` 54/54 통과
- `SM_F731N`에서 `초대 → 자녀` 진입 후 `MainActivity`가 유지되고 7초 뒤에도 네이티브 홈으로 복귀하지 않음
- WebView DevTools에서 실제 URL이 `/space/children?sid=...`로 유지되는 것을 확인

### 2026-07-23 — Android 가족 관계 역할·초대/설정 분리

- 공간 권한 `admin | editor | viewer`와 가족 관계 `family_role`을 분리
- 아빠, 엄마, 할아버지, 할머니, 배우자, 아들, 딸, 형제/자매, 보호자, 가족 구성원, 기타 관계 지원
- 가족 공간 멤버 카드에서 관계를 주 배지로 표시하고 공간 권한은 보조 정보로 유지
- 공간 지기가 멤버별 가족 관계를 변경할 수 있도록 Native API와 Android UI 연결
- 가족 공간 멤버 초대 시 `일반 가족 구성원`과 `자녀`를 먼저 선택하도록 전용 초대 시트 추가
- 일반 가족은 기존 보안 초대 코드/링크를 사용하고, 자녀는 보호자 확인·동의·일회성 초대 관리 화면으로 연결
- 공간 설정에서 초대 코드·초대 동선을 제거하고 이름 변경·가족 전환·삭제 등 공간 자체 설정만 유지
- 운영 Supabase migration 2개 적용, Vercel Production 배포, Android debug 실기기 UI 회귀 완료

검증:
- `npm run build` 54/54 통과
- 변경 TypeScript ESLint 통과
- Android `testDebugUnitTest`, `assembleDebug` 통과
- `SM_F731N`에서 가족 초대 유형 선택, 일반 가족 초대 코드/공유, 관계 선택, 설정/초대 분리 확인

### 2026-07-13 — 보호자 이메일 확인·자녀 최종 승인 흐름

- 초기 비용을 줄이기 위해 외부 SMS 발송 없이 보호자 로그인 이메일 확인을 사용
- 필수 동의 3종을 각각 확인하고 정책 버전·확인 방법·증적 식별자를 DB에 기록
- 보호자 휴대폰의 OS 공유 시트로 문자·카카오톡 등에 자녀 초대 링크를 직접 전달
- 자녀 Google 이메일과 72시간 일회성 토큰이 일치해도 `approval_pending`만 생성
- 보호자 최종 승인 전에는 `space_members`를 만들지 않아 가족 공간 데이터 접근 차단
- `/space/children`, `/family/guardian/verify`, `/invite/child/[token]` PC/Mobile 화면 구현
- 위치 수집·공유 및 마케팅 동의는 제외하고 계속 비활성

전환 조건:
- 활성 자녀 계정 1,000명, 월 연결 500건, 관계 분쟁 1건, 위치/결제 도입 또는 정책 강화 시 SMS OTP/PASS/NICE/KCB 본인확인으로 전환

검증:
- Supabase migration `022_guardian_email_consent_flow.sql` 운영 적용 완료
- 신규 증적 테이블, 함수 3종, RLS 정책 확인
- `npm run build`, 변경 경로 ESLint 통과

### 2026-07-13 — 가족 공간 자녀 계정 백엔드 뼈대

- `family_groups.space_type`으로 개인/일반/가족 공간 저장 기준 추가
- 가입 전 자녀 프로필, 보호자 관계, 항목별 동의, 일회성 초대, 연령 상태 테이블 설계
- 이메일 일치만으로 연결하지 않고 검증된 Google 이메일 + 일회성 초대를 함께 확인하는 DB 트랜잭션 추가
- 만 14세/19세 전환을 서버 생년월일 기준으로 갱신하는 계정 모드 기반 추가
- Web/Android/iOS 공통 `/api/session/context` capability 계약 추가
- 가족 자녀 기능은 후속 이메일 확인·최종 승인 흐름으로 운영 UI 연결

검증:
- `npm run build` 통과
- Supabase migration `020_family_child_foundation.sql`, `021_family_child_foundation_hardening.sql` 운영 적용 완료
- 신규 테이블 5개·함수 4개·RLS 정책 확인, 신규 외래키 인덱스/auth.uid initplan Advisor 경고 0건

### 2026-06-19 — PC 웹 루트 랜딩 리다이렉트 보정

- `www.gleaum.com` 접속 시 PC에서도 `/login`으로 이동할 수 있던 문제 수정
- 원인: `RootPageRouter`가 `useIsDesktop()`의 hydration 초기값 `false`를 기준으로 `/login` 리다이렉트를 먼저 실행할 수 있었음
- 조치: 루트 리다이렉트 effect 내부에서 `window.matchMedia('(min-width: 1024px)')`로 실제 브라우저 뷰포트를 재확인
- PC 웹은 랜딩 페이지 유지, 모바일 웹/네이티브 앱의 로그인 이동 정책은 유지

검증:
- `npm run build` 통과


### 2026-06-18 — Android 이메일 로그인/회원가입 네이티브 전환

- Android `LoginActivity`의 `이메일로 계속하기`가 더 이상 WebView `/login?view=email`을 호출하지 않도록 변경
- 네이티브 이메일 로그인/회원가입 폼 추가
- Supabase Auth REST API 직접 연동
  - 로그인: `/auth/v1/token?grant_type=password`
  - 회원가입: `/auth/v1/signup`
- 이메일 로그인 성공 시 Supabase 세션 JSON에 `expires_at`을 보강해 `SessionManager`에 저장
- 저장된 세션은 기존 `MainActivity`의 localStorage 주입 구조를 그대로 사용
- 회원가입에는 이름/닉네임 입력과 필수 동의 체크(만 14세 이상, 이용약관, 개인정보 수집·이용)를 포함
- 회원가입 동의 구간 보강: `[필수] 전체 동의`, 개별 동의 상태 동기화, 이용약관/개인정보처리방침 보기 링크 추가
- 약관/개인정보 `보기`는 외부 브라우저가 아니라 Android 인앱 `LegalWebViewActivity`로 열리도록 변경
- 인앱 약관 브라우저 하단에 `닫기` 버튼 제공해 회원가입 화면으로 즉시 복귀
- 태블릿에서 약관/개인정보 문서가 모바일 폭으로 떠 좌우 배경이 과도하게 노출되던 문제 보정
- Android 인앱 약관 브라우저에서 웹 nav/footer/배경 블롭을 숨기고, 본문 폭/패딩/텍스트 크기를 태블릿 문서 뷰에 맞게 재조정
- 태블릿 환경에서 로그인 컨트롤 폭이 과도하게 늘어나지 않도록 최대 폭 보정

검증:
- Android `:app:assembleDebug` 통과
- `npm run build` 통과

### 2026-06-18 — Android 홈 Native Port 스냅샷 + 비활성 골격

- `docs/18-android-home-port-snapshot.md` 추가
- Android 홈 네이티브화의 원본 기준을 `src/app/home/MobileHome.tsx`, `BottomNav`, `InlineFeedAd`, `ScheduleCard`, `CalendarView`로 고정
- 섹션 순서, 주요 수치, 문구, 광고 위치, 가계부 카드, 하단 네비게이션 기준을 문서화
- `NativeHomePortModels.kt` 추가: `/api/native/home-summary` 응답을 Android 홈 포트용 데이터 계약으로 정리
- `NativeHomePortActivity.kt` 추가: 운영 진입점에 연결하지 않은 비활성 골격
- `NativePortFlags.ENABLE_NATIVE_HOME=false` 유지

검증:
- 운영 앱 흐름 영향 없음: Activity는 Manifest에 등록하지 않았고 `MainActivity`와도 연결하지 않음
- `npm run build` 통과
- Android `:app:assembleDebug` 통과

다음 단계:
- Mobile Web 홈 화면 캡처 기준으로 Android 네이티브 첫 섹션부터 픽셀/문구 비교
- `ENABLE_NATIVE_HOME`은 비활성 구현 → 비교 검증 → 내부 테스트 활성화 전까지 절대 켜지 않음

### 2026-06-18 — Android 네이티브 홈 레이어 1차 시도 후 보류

- Android 앱은 **현재 모바일 웹 UI를 최대한 유지**하는 방향이어야 함
- `MainActivity` 위에 별도 네이티브 홈 레이어를 얹는 방식은 WebView 홈 복귀 무한루프와 디자인 이질감이 확인되어 철회
- `NativeHomeController` / `NativeHomeWebViewClient` 1차 구현은 제거하고, Android는 기존 WebView UI 안정성을 유지
- 다음 Android 네이티브화는 화면 전체 재구현이 아니라 기존 모바일 웹 UI를 유지하면서 로그인/세션/캘린더/생체인증/푸시 등 네이티브 기능 브리지 안정화부터 진행

검증:
- Android `:app:assembleDebug` 통과

다음 단계:
- Android Google/이메일 로그인 후 기존 모바일 웹 UI가 그대로 표시되는지 회귀 테스트
- 일정 등록 실패 사용자 제보 재현
- 네이티브 기능은 UI 재작성보다 WebView 내 현재 UI에 연결되는 브리지/권한/세션 안정화 방식으로 진행

### 2026-06-18 — Android/WebView 푸시 등록 경로 정리

- 네이티브 앱은 전역 `FCMProvider` → `useFCM` → `@capacitor-firebase/messaging` 경로로 FCM 토큰 등록을 일원화
- `MobileSpace`에서 별도로 실행되던 `useNativePush()` 제거
- 미사용 `src/hooks/useNativePush.ts` 삭제 (`@capacitor/push-notifications` 기반 구 경로)
- `usePushSubscription()`은 네이티브 앱에서 실행하지 않도록 방어 추가 — Web Push(service worker + PushManager)는 웹/PWA 전용
- 네이티브 포그라운드 FCM 리스너 cleanup을 `removeAllListeners()`에서 개별 listener handle 제거로 변경해 알림 탭 리스너가 같이 제거되지 않도록 보정

검증:
- `npm run build` 통과
- Android `:app:assembleDebug` 통과

## Day 1 — 프로젝트 기반 (완료)

- [x] Next.js 16 App Router + TypeScript + Tailwind CSS v4 프로젝트 생성
- [x] 디자인 토큰 시스템 (`src/styles/tokens.css`)
- [x] 공통 TypeScript 타입 정의 (`src/types/index.ts`)
- [x] Supabase 클라이언트 설정 (브라우저 + 서버)
- [x] GitHub 저장소 연결 (`Edwin-space/gleaum-app`)
- [x] Vercel 자동 배포 파이프라인 구성
- [x] Supabase-Vercel 연동 (환경변수 자동 주입)

---


### 2026-06-02 — Android 기기 캘린더 연동 1차 구현

- Android 네이티브 `NativeCalendarPlugin` 추가
- `READ_CALENDAR` / `WRITE_CALENDAR` 권한 선언 및 Capacitor permission bridge 연결
- `src/lib/native-calendar.ts` 추가: 권한 확인/요청, 캘린더 목록 조회, 이벤트 생성, 이벤트 조회, 로컬 설정 저장
- `/settings/calendar` 화면을 Android 앱 기준으로 전환
- Android 앱에서 캘린더 권한 요청, 쓰기 가능한 기기 캘린더 선택, 앞으로 30일 글리움 일정 수동 내보내기 지원
- 지출 일정은 기기 캘린더 내보내기 대상에서 제외
- 중복 내보내기 방지를 위해 기기 캘린더 이벤트 description에 `gleaum:schedule:{id}` marker 저장 및 기존 marker 조회

검증:
- `npm run build` 통과
- Android `:app:assembleDebug` 통과

다음 단계:
- 일정 생성/수정 시 자동 내보내기 여부 결정
- 기기 캘린더 이벤트 수정/삭제 동기화 정책 설계
- 외부 캘린더에서 글리움으로 가져오기(import) UI/충돌 정책 설계


### 2026-06-02 — iOS 스플래시 후 웹 로그인 flash 보정

- `NativeAppProvider`의 `hideSplash()` 타이머를 300ms에서 3000ms로 변경
- 원인: Capacitor 스플래시는 3초로 설정했지만 JS가 300ms에 강제로 숨겨 WebView `/login`이 네이티브 로그인 화면 전에 잠깐 노출됨
- iOS `LoginViewController`는 0.45초에 미리 fullScreen으로 올려 스플래시가 사라질 때 네이티브 로그인 화면이 바로 보이도록 조정

검증:
- `npm run build` 통과
- iOS Simulator compile-only build 통과 (`Gleaum`, Debug, iPhone 17)


### 2026-06-02 — iOS 스플래시/로그인 전환 UX 보정

- Capacitor SplashScreen 표시 시간을 2초에서 3초로 변경
- iOS 반영본 `ios/App/App/capacitor.config.json`도 동일하게 3초로 업데이트
- 세션이 없는 Apple 디바이스에서 `LoginViewController` 표시를 2.75초 지연시켜 스플래시 종료 직전 로그인 화면을 준비
- `modalTransitionStyle = .crossDissolve` 유지 + 중복 LoginViewController 표시 방지

검증:
- `npm run build` 통과
- iOS Simulator compile-only build 통과 (`Gleaum`, Debug, iPhone 17)


### 2026-06-02 — iOS 네이티브 로그인 OAuth UX 보정

- iOS 네이티브 `LoginViewController`의 Google 버튼 아이콘이 `globe` fallback으로 보일 수 있던 문제를 막기 위해 `google_icon` asset 추가
- iOS Google OAuth용 `SFSafariViewController`를 fullscreen으로 열도록 변경
- OAuth 성공 콜백 수신 시 `AppDelegate`가 Safari/Login presentation stack을 자동 dismiss하도록 보정
- JS `NativeAppProvider`에서 `Browser.close()`를 `await`하지 않도록 변경해, 사용자가 닫기를 누르기 전까지 세션 교환이 지연되는 문제 방지
- iOS 앱 활성화 시 OAuth 진행 중일 때만 launch URL을 재확인하는 fallback 추가

검증:
- `npm run build` 통과
- iOS Simulator compile-only build 통과 (`Gleaum`, Debug, iPhone 17)


### 2026-06-02 — P0 개인/공간 데이터 경계 RLS 보강

- `getScheduleById()` 단일 일정 조회에 `visibility='private'` 생성자 필터를 추가해, 직접 URL 접근에서도 타인의 private 일정/지출이 null 처리되도록 보강
- `supabase/migrations/015_harden_private_schedule_rls.sql` 추가
- `schedules` SELECT/UPDATE/DELETE RLS 정책에서 private 일정/개인 가계부는 생성자 본인에게만 허용하도록 강화
- `schedule_participants` SELECT RLS도 private 일정 참여자 정보는 생성자 본인에게만 보이도록 강화
- `supabase/schema.sql` 기준 정책도 동일하게 업데이트

> 운영 DB 반영을 위해 Supabase SQL Editor에서 `015_harden_private_schedule_rls.sql` 실행 필요

## Day 2 — 전체 화면 UI (완료)

### 구현된 페이지
- [x] `/login` — 구글 로그인 페이지
- [x] `/home` — 홈 대시보드 (캘린더 + 일정 요약)
- [x] `/schedules` — 일정 전체 목록 (검색 + 필터)
- [x] `/schedules/new` — 새 일정 추가 폼
- [x] `/schedules/[id]` — 일정 상세 + 상태 변경 + 삭제
- [x] `/schedules/children` — 자녀 일정 대시보드
- [x] `/family` — 가족 구성원 관리
- [x] `/budget` — 가계부 (월별 정기지출)
- [x] `/mypage` — 마이페이지 + 설정
- [x] `/notifications` — 알림 목록
- [x] `/settings/calendar` — 캘린더 연동 설정 페이지

---

## Day 3 — 구글 로그인 + 배포 (완료)

- [x] Google OAuth 2.0 실제 연동
- [x] Supabase Auth Google Provider 설정
- [x] `/auth/callback` 서버 라우트 구현
- [x] 로그인 후 `/home` 리다이렉트
- [x] 미들웨어 인증 보호
- [x] Vercel 프로덕션 배포 (`https://gleaum-app.vercel.app`)
- [x] 실제 구글 계정으로 로그인 테스트 완료

---

## Day 4 — Supabase DB 실데이터 연동 (완료)

- [x] DB 스키마 생성 (`supabase/schema.sql`)
- [x] RLS 정책 설정 (가족 그룹 단위 보안)
- [x] 자동 트리거 (신규 사용자 프로필 자동 생성, updated_at 자동 갱신)
- [x] `src/lib/db.ts` — 모든 DB 쿼리 함수 구현
- [x] `useCurrentUser` 훅 — 실 로그인 사용자 프로필
- [x] `useFamily` 훅 — 가족 구성원 실 데이터
- [x] `useSchedules` 훅 — 일정 CRUD
- [x] 첫 로그인 시 프로필 + 가족 그룹 자동 생성
- [x] 모든 페이지에서 `sampleData` 제거 → 실 DB 연동
- [x] 일정 생성 시 실제 DB 저장
- [x] 일정 상태 변경 → 실 DB 업데이트
- [x] 일정 삭제 → 실 DB 삭제
- [x] 가족 초대 코드 생성 및 합류 기능

---

## Day 5 — 초대 링크 + 전 페이지 디자인 리뉴얼 (완료)

### 초대 링크 페이지 (`/invite/[code]`)
- [x] `src/app/invite/[code]/page.tsx` 신규 생성
- [x] `src/middleware.ts` — `/invite` 공개 경로 추가
- [x] `src/hooks/useAuth.ts` — `signInWithGoogle(next?)` 파라미터 추가
- [x] `src/app/login/page.tsx` — `?next=` 파라미터 읽어서 OAuth에 전달 + 초대 배너 표시
- [x] `src/lib/db.ts` — `joinFamilyByCode` 반환 타입 강화

### 나머지 7개 페이지 디자인 리뉴얼 (Green/Teal/Blue 통일)
- [x] `/notifications`, `/mypage`, `/family`, `/budget`, `/schedules/children`, `/schedules/[id]`, `/schedules/new`, `/schedules` 전체 리뉴얼

---

## Day 6 — FCM 푸시 알림 + Supabase Cron 리마인더 (완료)

- [x] Firebase Cloud Messaging 클라이언트 연동
- [x] 로그인 사용자 FCM 토큰 저장 (`profiles.fcm_token`)
- [x] FCM HTTP v1 서버 발송 구현 (`src/lib/fcm.ts`)
- [x] 수동 재알림 API (`/api/notifications/renotify`)
- [x] 일정 리마인더 크론 API (`/api/cron/reminders`)
- [x] Supabase `pg_cron` + `pg_net` 연동 완료

---

## 제품 모델 재정의 — 개인 중심 + Space 확장형 (완료)

- [x] 개인 중심 + Space 확장형 토털 라이프 관리 서비스로 비전 재정의
- [x] `docs/12-product-model.md` 작성 및 적용
- [x] `schedule.type`을 Space / Category / Visibility / Automation Policy 축으로 분리 설계

---

## 개인화 온보딩 1차 (완료)

- [x] `/onboarding` 단계형 플로우 구현
- [x] 시작 목적/관심사 기반 개인화 설정 저장
- [x] `profiles` 테이블 개인화 컬럼 확장 및 SQL 적용
- [x] 신규 사용자 기본 그룹 이름을 `"나의 공간"`으로 전환

---

## 프리미엄 UI/UX 리뉴얼 1차 (완료)

- [x] Glassmorphism 도입: `.glass-card` 전면 적용
- [x] Mesh Gradient 배경: 애니메이션 기반 메쉬 그라디언트
- [x] 하이엔드 타이포그래피: `Outfit` (영문) + `Pretendard` (국문)
- [x] 아이콘 시스템 정교화: SVG 라인 아이콘 통일

---

## Sprint 2 + 적응형(Adaptive) UI 구현 (완료)

- [x] `sonner` 라이브러리 기반 전역 토스트 시스템
- [x] 주간/일간/월간 캘린더 뷰 확장
- [x] `DesktopSidebar.tsx` 및 PC 전용 2컬럼/3컬럼 레이아웃 적용
- [x] 1024px 이상 환경에서 사이드바 자동 전환

---

## Day 9 — SEO 및 품질 안정화 (완료)

- [x] 네이버 서치어드바이저 인증 메타 태그 적용
- [x] Open Graph, Twitter Cards, robots, keywords 웹 표준 메타데이터 전체 적용
- [x] 일정 등록 페이지 오류 수정
- [x] 빌드 안정화: Ref 타입 오류 및 미사용 카테고리 타입 수정

---

## PC WEB 전 구간 프리미엄 인라인 스타일 리디자인 (완료 — 2026-05-08)

> **핵심 결정**: Tailwind CSS v4의 클래스 신뢰성 문제로 인해 **모든 PC/모바일 컴포넌트를 100% 인라인 스타일로 재작성**. `glass-card`, `animate-*`, `var()` CSS 변수 등 Tailwind 유틸리티 클래스 완전 제거.

### 신규 생성 파일 (PC 전용 컴포넌트)
- [x] `src/app/schedules/new/DesktopNewSchedule.tsx` — 2컬럼 프리미엄 일정 등록 폼
- [x] `src/app/schedules/[id]/edit/DesktopEditSchedule.tsx` — 일정 수정 PC 전용 컴포넌트
- [x] `src/app/schedules/[id]/DesktopScheduleDetail.tsx` — 일정 상세 2컬럼 PC 레이아웃

### 수정된 PC 페이지
- [x] `src/app/schedules/[id]/edit/page.tsx` — `useIsDesktop()` 분기 추가, DesktopEditSchedule 연결
- [x] 모든 Desktop* 컴포넌트에서 내부 padding 제거 (pc-content-area와 충돌 방지)

### 디자인 패턴 (PC)
- 다크 히어로 헤더: `linear-gradient(135deg, #1A1B2E 0%, #2D2E4A 100%)` + glow blob
- 2컬럼 그리드: 좌측 메인 콘텐츠 `1fr` + 우측 액션 패널 `360px`
- 카드 스타일: `background:'white', borderRadius:'20px', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.04)'`
- 타입별 컬러 시스템: shared(teal), personal(cyan), child(green), expense(amber)

---

## 모바일 웹 전 구간 프리미엄 인라인 스타일 리디자인 (완료 — 2026-05-08)

> 아래 모든 파일에서 Tailwind 유틸리티 클래스, `glass-card`, `animate-*`, `var()` CSS 변수 완전 제거 → 100% 인라인 스타일로 대체.

| 파일 | 주요 변경 내용 |
|------|--------------|
| `src/app/home/MobileHome.tsx` | 다크 인사 히어로 카드, 접이식 캘린더, 퀵 액션, useMemo 최적화 |
| `src/app/schedules/MobileSchedules.tsx` | 검색/필터 칩, 일정 카드 인라인 스타일 전체 교체 |
| `src/app/schedules/new/MobileNewSchedule.tsx` | 프리미엄 타입 타일(soft bg + 컬러 border), 3컬럼 날짜/시간 그리드 |
| `src/app/schedules/[id]/MobileScheduleDetail.tsx` | 풀블리드 히어로, 바텀시트 모달, child stepper, 참여자 카드 |
| `src/app/schedules/children/MobileChildren.tsx` | SVG 원형 진행률, 탭, 완료 바텀시트 모달 |
| `src/app/budget/MobileBudget.tsx` | 다크 그린 그라디언트 히어로, -24px 겹침 요약 카드 |
| `src/app/family/MobileFamily.tsx` | 바텀시트 모달 스타일 (borderRadius: '32px 32px 0 0') |
| `src/app/notifications/MobileNotifications.tsx` | 타입별 컬러 좌측 보더, 미읽음/읽음 투명도 구분 |
| `src/app/mypage/MobileMyPage.tsx` | GleaumAppIcon→GleaumBI 교체, 인라인 토글 컴포넌트 |
| `src/components/PWAInstallBanner.tsx` | 다크 그라디언트 프리뷰 헤더, 번호 원형 스텝, 그라디언트 설치 버튼 |
| `src/components/layout/BottomNav.tsx` | glass-card → 명시적 frosted glass 인라인 스타일, FAB 중앙 플로팅 |

### 모바일 Safe Area 패턴
```
paddingTop: 'calc(env(safe-area-inset-top) + 48px)'
paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)'
```

---

## 사이드바 모바일 노출 버그 수정 (완료 — 2026-05-08)

- [x] `src/components/layout/DesktopSidebar.tsx` — `useIsDesktop()` 추가, 모바일에서 `return null`
- [x] `src/components/layout/BottomNav.tsx` — `useIsDesktop()` 추가, 데스크탑에서 `return null`
  - 기존 `className="lg:hidden"` Tailwind 클래스가 Tailwind v4에서 동작 안 하던 문제 해결

---

## 모바일 로그인 화면 리디자인 (완료 — 2026-05-08)

- [x] `src/app/login/page.tsx` — `var(--font-display)` 제거
- [x] 플로팅 앱 아이콘 카드 (72px, 그라디언트 bg, glow shadow)
- [x] 점 배경 텍스처 (radial-gradient 패턴)
- [x] safe-area-inset 패딩 적용 (노치/홈바 안전 영역)
- [x] 이메일/비밀번호 인풋 — 왼쪽 아이콘 삽입
- [x] 에러 메시지 → 아이콘 포함 박스 UI로 개선
- [x] 로그인 버튼 — 그라디언트 (`#0084CC → #0CC9B5`)
- [x] Suspense fallback도 다크 배경으로 통일

---

## 모바일 /home 성능 최적화 (완료 — 2026-05-08)

> Vercel Speed Insights에서 `/home` poor 판정 → 7가지 최적화 적용

| 최적화 항목 | 수정 파일 | 효과 |
|------------|---------|------|
| 중복 BottomNav 제거 | `MobileHome.tsx` | DOM 절감, GPU 컴포지팅 레이어 1개 제거 |
| `useMediaQuery` 초기값 즉시 평가 | `src/hooks/useMediaQuery.ts` | hydration 후 재렌더 방지 |
| 폰트 `preconnect` 추가 | `src/app/layout.tsx` | DNS/TLS 핸드셰이크 선제 해소 |
| Pretendard full static → Variable Dynamic Subset | `src/app/layout.tsx` | 폰트 CSS ~70% 경량화 |
| `PWAInstallBanner` → `LazyPWABanner` dynamic import | `src/components/LazyPWABanner.tsx` | 초기 렌더에서 1.5초 setTimeout 재렌더 제거 |
| schedule 필터 `useMemo` 래핑 | `MobileHome.tsx` | 무관한 state 변경 시 재연산 방지 |
| mesh-blob 애니메이션 모바일 비활성화 | `src/app/globals.css` | 모바일 GPU 부하 감소 |
| `@keyframes spin` globals.css 이동 | `src/app/globals.css` | loading 토글마다 style DOM 추가/삭제 방지 |

---

## Google Analytics 4 (GA4) 세팅 (완료 — 2026-05-08)

- [x] Measurement ID: `G-BK5RQTGVNT` (기존 Firebase 프로젝트 연결)
- [x] `src/lib/analytics.ts` — 타입 안전 이벤트 트래킹 유틸리티
  - `GleaumEventParams` 타입으로 이벤트별 파라미터 강제
  - `KEY_EVENTS` 배열로 GA4 콘솔에서 Key Event 지정할 이벤트 목록 관리
- [x] `src/components/GoogleAnalytics.tsx` — `next/script afterInteractive` 전략으로 렌더 블로킹 없이 로드
  - SPA 라우트 전환 시 `page_view` 자동 전송 (`usePathname` + `useSearchParams`)
- [x] Vercel 환경변수 `NEXT_PUBLIC_GA_ID` 등록

### 트래킹 이벤트 목록

| 이벤트 | 발생 위치 | Key Event |
|--------|---------|-----------|
| `login` | `src/app/login/page.tsx` | ✅ |
| `onboarding_complete` | `src/app/onboarding/page.tsx` | ✅ |
| `schedule_create` | `src/app/schedules/new/page.tsx` | ✅ |
| `schedule_view` | `src/app/schedules/[id]/page.tsx` | |
| `schedule_complete` | `src/app/schedules/[id]/page.tsx` | ✅ |
| `pwa_banner_show` | `src/components/PWAInstallBanner.tsx` | |
| `pwa_install_accept` | `src/components/PWAInstallBanner.tsx` | |
| `pwa_installed` | `src/components/PWAInstallBanner.tsx` | ✅ |
| `pwa_install_dismiss` | `src/components/PWAInstallBanner.tsx` | |
| `calendar_toggle` | `src/app/home/MobileHome.tsx` | |

### GA4 콘솔 후속 작업 (사용자 직접 수행)
1. [관리] → [이벤트] → Key Events에서 위 ✅ 이벤트 지정
2. [탐색] → 새 보고서 → **유입경로 탐색**: `page_view(/login)` → `login` → `onboarding_complete` → `schedule_create` 퍼널 설정

---

## PWA 완성 (완료)

- [x] `public/manifest.json` — `standalone` 디스플레이 모드
- [x] `src/app/icon.tsx` — 고화질 다이아몬드 로고 아이콘 동적 생성
- [x] `public/sw.js` + `PwaRegistry.tsx` — 오프라인 지원/설치 가능
- [x] iOS 스플래시 스크린 20종 (`apple-touch-startup-image`) 적용
- [x] Android/iOS PWA 홈 화면 추가 배너 (`PWAInstallBanner.tsx`)

---

---

## Capacitor 네이티브 앱 기반 구축 (완료 — 2026-05-08)

> `docs/14-native-app-plan.md` 계획서에 따른 1단계 작업 완료

### 설치된 Capacitor 패키지 (v8.3.2)
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`
- `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/keyboard`
- `@capacitor/haptics`, `@capacitor/browser`, `@capacitor/local-notifications`
- `@capacitor/app`, `@capacitor/preferences` (보안 스토리지)

### 신규/수정 파일
| 파일 | 내용 |
|------|------|
| `capacitor.config.ts` | 프로덕션 URL 방식(server.url) 설정, 플러그인 설정 |
| `ios/` | iOS Xcode 프로젝트 (npx cap add ios) |
| `android/` | Android Gradle 프로젝트 (npx cap add android) |
| `ios/App/App/Info.plist` | URL 스킴(gleaum://), WKAppBoundDomains, ATT, 권한 요청 메시지 전체 설정 |
| `android/app/src/main/AndroidManifest.xml` | Deep Link, App Links, 권한, Edge-to-Edge 설정 |
| `android/app/src/main/res/xml/network_security_config.xml` | HTTPS 강제, 개발 환경 로컬 IP HTTP 허용 |
| `src/lib/native.ts` | 네이티브 유틸리티 레이어 (isNativeApp, secureStorage, haptic, hideSplash, setStatusBar, openBrowser, onAppResume, onAndroidBackButton) |
| `src/components/NativeAppProvider.tsx` | 앱 마운트 시 스플래시 숨기기 + 상태바 설정 + 뒤로가기 처리 |
| `src/app/layout.tsx` | NativeAppProvider 추가 |
| `.gitignore` | iOS Pods, Android Gradle 빌드 아티팩트 제외 |

### 배포 전략: 서버 URL 방식
- `output: 'export'` 불사용 (API Routes, /auth/callback 유지 필요)
- Capacitor `server.url = 'https://www.gleaum.com'` 설정
- Vercel 배포 후 `npx cap sync` → Xcode/Android Studio에서 제출
- 개발 시: `CAP_DEV_SERVER_URL=http://192.168.x.x:3000 npx cap run ios`

### npm 스크립트 추가
```bash
npm run cap:sync         # 양쪽 동기화
npm run cap:sync:ios     # iOS 동기화
npm run cap:sync:android # Android 동기화
npm run cap:open:ios     # Xcode 열기
npm run cap:open:android # Android Studio 열기
```

### 다음 단계 (Xcode 설치 후 진행)
- [ ] Xcode 설치 (Mac App Store — 약 15GB, 1시간 소요)
- [ ] `npm run cap:open:ios` → 번들 ID `com.gleaum.app` 확인
- [ ] Apple Developer 계정 연결 → 프로비저닝 프로파일 생성
- [ ] Simulator 실행 테스트
- [ ] CocoaPods 설치: `sudo gem install cocoapods && npx cap update ios`

---

## 인프라 및 배포 (현재 상태)

- **프로덕션 URL**: `https://www.gleaum.com`
- **GitHub**: `Edwin-space/gleaum-app` (`main` 브랜치 push → Vercel 자동 배포)
- **Vercel CLI 직접 배포도 가능**: `npx vercel --prod`
- **최신 커밋**: `b68ab5e` (2026-05-08)

---

## Phase 1 — 공간(Space) 아키텍처 전환 (완료 — 2026-05-11)

> `/family` 경로·개념을 전면 `/space`로 마이그레이션. DB 테이블명(`family_groups`, `space_members`)은 유지하되 UI·라우팅·훅만 변경.

### 변경된 핵심 파일

| 파일 | 변경 내용 |
|------|---------|
| `src/app/auth/callback/route.ts` | 자동 Space 생성 로직 제거 — 온보딩에서 사용자가 직접 선택 |
| `src/app/onboarding/page.tsx` | 6단계 플로우로 확장; 4번째 단계 '공간 설정'(만들기/합류/건너뛰기) 추가 |
| `src/app/family/page.tsx` | `redirect('/space')` 영구 리다이렉트 (하위 호환) |
| `src/app/space/page.tsx` | 신규 — `useIsDesktop()` 분기 라우터 |
| `src/app/space/DesktopSpace.tsx` | 신규 — 공간 관리 PC UI |
| `src/app/space/MobileSpace.tsx` | 신규 — 공간 관리 모바일 UI |
| `src/app/invite/[code]/page.tsx` | `/family` → `/space` 리다이렉트 2곳 수정 |
| `src/app/mypage/DesktopMyPage.tsx` | href `/family` → `/space` |
| `src/app/mypage/MobileMyPage.tsx` | href `/family` → `/space` |
| `src/app/home/DesktopHome.tsx` | `space_first` 문구 업데이트 |
| `src/components/layout/DesktopSidebar.tsx` | 사이드바 레이블 `가족` → `공간`, href `/family` → `/space` |
| `src/app/api/cron/reminders/route.ts` | FCM 토큰 조회를 `profiles.family_group_id` → `space_members` JOIN 방식으로 변경 |
| `src/app/api/cron/automations/route.ts` | 동일 패턴 적용 |
| `src/app/api/notifications/renotify/route.ts` | 동일 패턴 적용 |
| `src/lib/analytics.ts` | `onboarding_complete` 이벤트 타입에 `space_setup?: string` 추가 |

### 온보딩 Space 설정 단계 (Step 4)
- **만들기**: 공간 이름 입력 → `createSpace()` 호출
- **합류하기**: 초대 코드 입력 → `joinSpaceByCode()` 호출
- **건너뛰기**: 바로 통과 (나중에 /space에서 생성 가능)

---

## Phase 2 — 4개 기능 개선 동시 적용 (완료 — 2026-05-11)

### #1 모바일 입력 오버플로우 버그 수정

**원인**: `MobileNewSchedule.tsx`의 날짜/시간 영역이 `gridTemplateColumns: '1fr 1fr 1fr'` 3컬럼 그리드여서 iOS Safari에서 입력 필드가 잘림.

**수정**: `src/app/schedules/new/MobileNewSchedule.tsx`
- 날짜 input: 독립 행으로 분리, `marginBottom: '10px'`
- 시간 row: `display: flex` + 각 input에 `flex: 1, minWidth: 0` 적용

### #2 일정 visibility 보안 수정 + UI 배지

**문제**: `getSchedules()`가 `visibility === 'private'`인 타인의 일정도 노출하는 보안 결함.

**수정**: `src/lib/db.ts`
```typescript
.or(`visibility.neq.private,visibility.is.null,created_by.eq.${userId}`)
```

**UI**: `src/components/ui/Card.tsx` — `visibility === 'private'`일 때 `🔒 나만` 배지 표시

### #3 가계부 탭 분리 (공간 지출 / 내 지출)

**수정 파일들**:

| 파일 | 변경 내용 |
|------|---------|
| `src/app/budget/page.tsx` | `BudgetTab = 'space' \| 'personal'` 타입 export; `tab` state 추가; expenses 필터링 로직 분기 |
| `src/app/budget/MobileBudget.tsx` | 탭 switcher UI 추가 (🏠 공간 지출 / 👤 내 지출) |
| `src/app/budget/DesktopBudget.tsx` | 탭 switcher UI 추가; 누락된 `isCurrentMonth` prop 추가 |

**필터 로직**:
- 공간 지출: `visibility !== 'private'` (공간 전체 공유 지출)
- 내 지출: `createdBy === userId && visibility === 'private'` (나만 보는 지출)

### #3-1 가계부 일회성 지출 상태/타임라인 보정 (2026-05-27)

**문제**: 가계부에서 `일회성`으로 등록한 소비가 `status='pending'`으로 저장되어 `결제 예정`처럼 표시되고, 일정 타임라인에도 정기지출처럼 노출될 수 있었음.

**수정 파일들**:

| 파일 | 변경 내용 |
|------|---------|
| `src/lib/db.ts` | `type='expense' AND repeat='none'` 기본값을 `status='completed'`, `automation_policy='reminder_only'`로 중앙 보정 |
| `src/app/budget/page.tsx` | 일회성 지출을 반영 완료 금액/건수로 집계, 정기 지출만 예정 건수에 포함 |
| `src/app/budget/MobileBudget.tsx` | 일회성 배지/`지출반영` 의미로 표시, 일회성 지출의 결제 예정 토글 비활성화 |
| `src/app/budget/DesktopBudget.tsx` | 동일 규칙을 데스크탑 지출 목록/요약 카드에 적용 |
| `src/app/home/page.tsx` | 일회성 지출을 홈 일정/캘린더 데이터에서 제외 |
| `src/app/schedules/page.tsx` | 일회성 지출을 일정 목록/오늘 일정에서 제외 |
| `supabase/migrations/009_fix_one_time_expense_status.sql` | 기존 운영 데이터 중 일회성 지출이 pending/payment_due로 남은 건을 completed/reminder_only로 보정 |

**운영 규칙**:
- 일회성 지출: 이미 소비한 돈의 흐름 → 등록 즉시 `completed`, 자동화/크론 결제 대상 아님.
- 정기 지출: 앞으로 결제/납부할 항목 → `pending`, `payment_due`, 가계부에서 `결제예정/결제완료` 전환 가능.

### #4 공간 권한 시스템 UI 적용

**`useSpace` 훅 확장** (`src/hooks/useSpace.ts`):
- `myRole: SpaceRole | null` 상태 추가
- `Promise.all([getSpaceWithMembers, getMyRoleInSpace])` 병렬 로드

**일정 생성/수정 viewer 차단**:
- `src/app/schedules/new/page.tsx` — `myRole === 'viewer'` 시 토스트 에러 + 조기 반환
- `src/app/schedules/[id]/edit/page.tsx` — 동일 적용

**일정 visibility 토글 (expense 타입)**:
- `src/app/schedules/new/page.tsx` — `expenseVisibility` state (`'space'` 기본값)
- `src/app/schedules/new/MobileNewSchedule.tsx` — 🏠 공간 공유 / 🔒 내 지출 토글 UI
- `src/app/schedules/new/DesktopNewSchedule.tsx` — 동일 UI 추가

**공간 관리 Admin UI**:

| 파일 | 변경 내용 |
|------|---------|
| `src/app/space/MobileSpace.tsx` | ✏️ 이름 수정 버튼(admin), 멤버 역할 배지 Admin/Editor/Viewer, ✕ 제거 버튼(admin, 자신 제외), 이름 수정 모달 |
| `src/app/space/DesktopSpace.tsx` | 동일 기능 PC 버전 — ✏️ 버튼, 역할 배지, ✕ 제거 버튼, 중앙 정렬 다이얼로그 모달 |

**역할 배지 색상**:
- Admin: `#0084CC` (Blue)
- Editor: `#0CC9B5` (Teal)
- Viewer: `#8E8E93` (Gray)

### typeConfig 아이콘 업데이트
- `shared` 타입: 아이콘 `👨‍👩‍👧‍👦` → `🏠`, 설명 `가족 전체` → `공간 공유`

---

## 2026-05-27 — PC 핵심 화면 안정화 (진행 중)

### Space 설정 PC 레이아웃
- [x] `/space/settings`에 Desktop 전용 2컬럼 레이아웃 추가
- [x] PC에서 공간 이름, 목적, 일정 유형, 초대 코드, 멤버, 위험 구역을 한 화면에서 관리 가능
- [x] Desktop 이름 저장은 설정 화면에 머무르도록 분리하고 모바일 기존 흐름은 유지

### Space 생성 PC 레이아웃
- [x] `/space/new`에 Desktop 전용 2컬럼 생성 화면 추가
- [x] PC에서 좌측 공간 설명/기능 요약, 우측 이름·목적 입력 및 생성 폼 제공
- [x] 공간 생성 완료 후 초대 링크 복사/카카오톡 공유/공유 시트/공간 이동 액션을 PC 카드형으로 제공
- [x] Kakao SDK window 타입을 명시해 `no-explicit-any` 린트 오류 제거

---

## 2026-05-26~27 — 초대/공간 정책/네이티브 안정화 (완료)

### 신규 유저 및 온보딩
- [x] 신규 유저가 온보딩으로 직접 진입하도록 플로우 개선
- [x] 온보딩 UI 교체 및 네이티브 앱 감각에 맞춘 초기 경험 개선
- [x] 네이티브 앱 수준 성능 최적화 적용

### 초대/공간 정책
- [x] 초대 링크 로그인 후 공간 합류 경로 유실 버그 수정
- [x] 초대 링크 복사 문제 수정 및 `invite_code` null 자동 생성 처리
- [x] 초대 랜딩 페이지 추가 및 초대 정보 조회 API 추가
- [x] 공간 정책 개편, 초대 공유 3종, 다운로드 페이지 추가
- [x] PC 화면 파리티 보강 — 공간 정책, 초대 공유, 앱 설정 섹션

### 광고/SEO/공개 접근
- [x] `ads.txt` 추가 및 Google AdSense 크롤러 접근 허용
- [x] 페이지 타이틀/OG 이미지 경로 개선
- [x] `/download` 페이지 추가

### 네이티브 앱 안정화
- [x] iOS WKWebView 성능 최적화, 세로 고정, 알림 권한 타이밍 개선
- [x] Android Kotlin stdlib 버전 충돌 해결
- [x] iOS 무료 Apple Developer 계정 빌드를 위해 Associated Domains entitlement 임시 제거
- [x] Universal Links 웹 기반 파일(`apple-app-site-association`)은 준비됨. iOS capability는 유료 Apple Developer 계정 전환 후 재활성화 필요

### 버그 수정
- [x] 가계부 지출 등록 시 즉시 FCM 알림이 발송되던 크리티컬 버그 수정
- [x] 초대/로그인 플로우 및 iOS 인앱 브라우저 대응 개선
- [x] Android 네이티브 앱 로그인 화면이 초대 링크용 인앱 브라우저 차단 안내로 막히던 문제 수정

---

## Google Play 스토어 출시 준비 (완료 — 2026-05-14)

### Firebase SDK 네이티브 연동
- [x] `@capacitor-firebase/messaging` 플러그인 설치 및 연동
- [x] iOS `AppDelegate.swift` — `FirebaseApp.configure()` + `Messaging.messaging().delegate` + APNs 토큰 매핑
- [x] `ios/App/CapApp-SPM/Package.swift` — `CapacitorFirebaseMessaging` 의존성 수동 추가
- [x] `src/lib/firebase.ts` — 네이티브(Capacitor) / 웹(JS SDK) FCM 토큰 분기 처리
- [x] `google-services.json` (Android), `GoogleService-Info.plist` (iOS) — Firebase 구성 파일 배치 완료

### Google OAuth 스코프 축소 (구글 검수 회피)
- [x] `src/hooks/useAuth.ts` — Calendar, Drive 스코프 제거 → `email`, `profile`만 요청
- [x] Google Cloud Console OAuth 스코프 단순화로 Google 앱 검수 불필요 상태 달성

### 구글 캘린더 연동 제거 (기기 캘린더 전환 준비)
- [x] `src/lib/googleCalendar.ts` — 파일 전체 삭제
- [x] `src/lib/db.ts` — Google Calendar API 호출 3곳 제거 (`createSchedule`, `updateSchedule`, `deleteSchedule`)
- [x] `src/app/settings/calendar/page.tsx` — "Google 캘린더 동기화" → "기기 캘린더 연동 준비 중" 안내 페이지로 교체
- [x] `src/app/mypage/MobileMyPage.tsx` — "구글 캘린더" → "기기 캘린더 연동 (준비 중)"
- [x] `src/app/mypage/DesktopMyPage.tsx` — 동일 변경
- [x] `src/types/index.ts` — `source: 'local' | 'google_drive'` → `source: 'local'`

### 법적 문서 페이지 (이용약관 + 개인정보처리방침)
- [x] `src/app/legal/terms/page.tsx` — 이용약관 12개 조항 (운영자: 유태성, helper@gleaum.com)
- [x] `src/app/legal/privacy/page.tsx` — 개인정보처리방침 11개 조항 (테이블형 수탁업체 목록 포함)
- [x] `src/proxy.ts` — `/legal` 공개 경로 추가 (비로그인 접근 허용)
- [x] `src/app/login/page.tsx` — 로그인 화면 하단에 이용약관·개인정보처리방침 링크 연결
- [x] `src/app/mypage/MobileMyPage.tsx` — 마이페이지 푸터에 법적 문서 링크 추가

### Google Play Console 등록 및 패키지명 인증
- [x] Google Play 개발자 등록 및 인증 완료
- [x] 릴리즈 키스토어 생성: `~/gleaum-release.keystore` (alias: gleaum, RSA 2048, 유효: 10,000일)
- [x] 패키지명 소유권 증명 완료 (`com.gleaum.app` — debug.keystore SHA-256 활용)
- [x] `adi-registration.properties` 파일로 APK 서명 후 Play Console 검증 통과
- [x] `android/app/build.gradle` — `signingConfigs.release` 설정 추가
- [x] `android/app/build.gradle` — `proguard-android.txt` → `proguard-android-optimize.txt` 수정 (Gradle 9.4 호환)
- [x] `android/app/src/main/AndroidManifest.xml` — 미사용 권한 제거 (`CAMERA`, `READ_MEDIA_IMAGES`, `READ/WRITE_EXTERNAL_STORAGE`, `USE_BIOMETRIC`, `USE_FINGERPRINT`)
- [x] 서명된 AAB 빌드 성공 (`app-release.aab`) — Google Play 내부 테스트 버전 업로드 완료
- [x] 앱 무결성 설정 완료 (자동 보호 + Google Play 서명 버전)

---

## 백오피스(Admin Backoffice) Phase 1~4 완료 (완료 — 2026-05-13)

> 기존 사용자 앱과 완전히 분리된 독립 관리자 인터페이스.
> 상세 문서는 `backoffice/docs/` 폴더를 참조하세요.

### 기술 스택
- Next.js 16.2.6 (App Router) + Tailwind CSS v4 + shadcn/ui
- Vercel 독립 프로젝트 배포 (Root Directory: `backoffice`)
- 기존 Supabase 프로젝트 공유 사용
- GA4 Data API (`@google-analytics/data` v5, gRPC 기반)

### 구현 완료 화면

| 라우트 | 기능 |
|--------|------|
| `/login` | 관리자 로그인 — Supabase Auth 이메일/비밀번호 |
| `/` | 대시보드 — KPI 카드(회원/공간/일정), GA4 실시간 접속자·7일 통계·상위 페이지 |
| `/users` | 회원 관리 — `profiles` 실데이터, 온보딩 상태·공간 보유 배지 |
| `/spaces` | 공간 관리 — `family_groups` 실데이터, 초대코드 표시 |
| `/campaigns` | CRM 캠페인 빌더 — 5채널 탭 + `{{변수}}` 에디터 + 스마트폰 미리보기 |
| `/ads` | 광고 매니저 — 전략 스위치 + 앱 목업 시뮬레이터 |
| `/settings` | 시스템 설정 — 비밀번호 변경, GA4 연동 상태, API 키 관리 |

### Phase 4 완료 내용 (2026-05-13)

**인증 시스템**
- `src/proxy.ts` — Next.js 16 라우트 보호 미들웨어 (미인증 시 전체 → `/login` 리다이렉트)
- `src/app/login/page.tsx` — 로그인 폼
- `src/components/ConditionalSidebar.tsx` — 로그인 페이지 사이드바 숨김

**비활동 세션 타이머 (10분)**
- `src/components/SessionProvider.tsx` — 마지막 활동 시각 sessionStorage 저장, 10분 비활동 시 자동 로그아웃
- `src/components/Sidebar.tsx` — 카운트다운 UI (120s 이하 노랑, 60s 이하 빨강), 로그아웃 버튼

**GA4 Data API 연동**
- `src/lib/ga4.ts` — `BetaAnalyticsDataClient`로 7일 통계 + 실시간 접속자 + 상위 페이지 조회
- `next.config.ts` — `serverExternalPackages` 설정으로 gRPC 번들링 충돌 해결
- GA4 서비스 계정(`gleaum-backoffice@gleaum-firebase.iam.gserviceaccount.com`) 뷰어 권한 부여 완료

**실데이터 연동**
- 전 페이지 `force-dynamic` 적용으로 정적 렌더링 문제 해결
- 회원 관리 컬럼명 오류 수정 (`full_name` → `name`, `onboarding_completed` → `onboarding_completed_at`)

### 미완료 (Phase 5 이후)
- Recharts 차트 (WAU 트렌드, 가계부 vs 캘린더 비율)
- 회원/공간 상세 페이지
- CRM 실제 발송 API
- 광고 설정 DB 저장

---

## 공간 데이터 경계 보정 (완료 — 2026-05-28)

> 핵심 원칙: 개인 공간과 공유 공간은 데이터 저장/조회 경계가 완전히 분리되어야 한다. 사용자가 의도하지 않은 공간에 개인 일정/지출이 저장되거나 표시되면 안 된다.

- [x] `src/hooks/useCurrentUser.ts` — `personalSpaceId`, `sharedSpaceId` 반환 추가. 온보딩 완료 사용자의 캐시 프로필에 `personalSpaceId`가 없으면 `ensureUserSetup()` 재실행
- [x] `src/lib/db.ts` — `createPersonalSpace()`가 기존 공유 공간 포인터를 덮어쓰지 않도록 수정, `ensureUserSetup()`이 공유 공간 사용자에게도 개인 공간을 보정 생성
- [x] `src/app/budget/page.tsx` — 개인 지출은 `personalSpaceId`, 공간 지출은 `sharedSpaceId` 기준으로 완전 분리 조회/등록
- [x] `src/app/schedules/new/page.tsx` — 개인 일정/개인 지출은 개인 공간에 저장, 공유 일정/공간 지출은 공유 공간에 저장
- [x] `src/app/home/page.tsx`, `src/app/schedules/page.tsx`, `src/app/space/SpaceScheduleTimeline.tsx` — 공유 공간 화면에서 `visibility='private'` 데이터 제외
- [x] `src/lib/db.ts` — `getSpaceWithMembers()`, `getSpaceMembers()`, `getMySpaces()`의 Supabase nested join 의존 제거. 멤버십/프로필/공간을 분리 조회해 공간 멤버 누락 방지
- [x] `src/app/space/settings/page.tsx`, `src/app/space/MobileSpace.tsx` — 현재 보고 있는 공간의 설정을 열 수 있도록 `?sid=` 기반 설정 대상 지정
- [x] `supabase/migrations/010_move_private_records_to_personal_space.sql` — 과거 공유 공간에 잘못 저장된 private 일정/지출을 개인 공간으로 이동하는 보정 SQL 추가

---

## 공간 초대/역할/아바타 안정화 (완료 — 2026-05-28)

- [x] `src/app/space/DesktopSpace.tsx`, `src/app/space/MobileSpace.tsx` — `코드 복사`/`코드만 복사` 액션이 초대 URL이 아니라 순수 초대 코드만 복사하도록 수정
- [x] 초대문/링크 복사 전 초대 코드 실서버 유효성 확인. DB에 없는 오래된 코드는 자동 재발급 후 최신 코드로 공유
- [x] `src/lib/db.ts`, `src/app/api/invite/join/route.ts`, `src/app/space/[spaceId]/join/page.tsx` — 초대/공간 참여자의 기본 역할을 `editor`에서 `viewer`로 변경
- [x] 역할 명칭 변경: `admin → 공간 지기`, `editor → 공간 운영자`, `viewer → 공간 멤버`
- [x] `src/components/ui/UserAvatar.tsx` — Google 프로필 이미지 URL이 텍스트로 렌더링되어 레이아웃을 침범하던 문제 방지용 공통 아바타 컴포넌트 추가
- [x] 공간/마이페이지/공간 설정/공간 타임라인의 아바타 표시를 URL 이미지와 이모지 모두 안전하게 처리하도록 보정


---

## 개인 가계부 / 공간 지출 분리 (완료 — 2026-05-28)

- [x] `/budget`을 개인 가계부 전용으로 고정하고 공간 지출 탭 제거
- [x] 개인 가계부 조회/생성 기준을 `personalSpaceId + visibility='private'`로 고정
- [x] 공간 내부 `SpaceScheduleTimeline`에 공간 지출 섹션과 `내 가계부` 반영 버튼 추가
- [x] `reflectSpaceExpenseToPersonalBudget()` 추가: 공간 지출을 개인 가계부 private expense로 복사
- [x] `supabase/migrations/011_add_expense_reflection_columns.sql` 추가: 원본 공간 지출 연결 컬럼과 중복 반영 방지 인덱스


---

## Claude 작업 반영 — 알림/Firebase/백오피스 (완료 — 2026-05-28)

- [x] 고정지출 연체 알림 API 추가: `/api/cron/overdue-expenses`
- [x] 주간 소비 다이제스트 API 추가: `/api/cron/weekly-digest`
- [x] Supabase 크론 등록 SQL 추가: `supabase/migrations/012_cron_overdue_and_digest.sql`
- [x] 가계부 PC/모바일 D-day UI 추가: D-N, 내일 결제, 오늘 결제일, N일 경과
- [x] 모바일 홈 가계부 카드 미결제 고정지출 배지 추가
- [x] Firebase Crashlytics, Remote Config, App Check, App Distribution 기반 추가
- [x] Android Firebase App Distribution 배포 스크립트 추가: `scripts/distribute-android.sh`
- [x] 백오피스 릴리즈 관리 + Remote Config 편집기 추가
- [x] 백오피스 App Distribution REST API projectNumber 경로 보정 및 테스터 그룹 필터 조회 수정
- [x] 중복 사용자 앱 `/admin` 대시보드 제거 후 백오피스로 통합
- [x] Android AGP 9.x 호환 문제로 Firebase Performance Gradle plugin 제거
- [x] 지출 카테고리 가이드 초안 추가: `docs/Guide/expenses.md`


---

## Android Studio Sync 안정화 (완료 — 2026-05-28)

- [x] `android/app/build.gradle`의 `firebaseAppDistribution { ... }` DSL 제거
- [x] `android/build.gradle`의 Firebase App Distribution Gradle plugin classpath 제거
- [x] Firebase App Distribution 배포는 Gradle 플러그인이 아니라 `scripts/distribute-android.sh` Firebase CLI 방식으로 유지
- [x] `:app:tasks`, `:app:assembleDebug` 통과 확인

---

## Android Google 로그인 세션 보정 (완료 — 2026-06-02)

- [x] Google Play 배포본에서 Google 로그인 후 모바일 웹 로그인 화면으로 돌아가던 문제 원인 확인
- [x] `RouterActivity`에서 Supabase implicit OAuth callback fragment를 직접 파싱해 네이티브 `SessionManager`에 저장
- [x] `MainActivity`에도 동일한 저장 로직을 추가해 딥링크 재진입/이벤트 유실 케이스 방어
- [x] `NativeAppProvider`의 implicit OAuth 처리 분기도 `NativeSession.saveSession()`을 호출하도록 보정
- [x] `npm run build`, Android `:app:assembleDebug` 통과

---

## 네이티브 생체인증 앱 잠금 (완료 — 2026-06-02)

- [x] Android 지문/기기 잠금 인증 브리지 추가
- [x] iOS Face ID/Touch ID 인증 브리지 추가
- [x] 온보딩 마지막 단계에 신규 사용자용 보안 설정 추가
- [x] 기존 사용자 대상 네이티브 앱 첫 진입 1회 생체인증 제안 모달 추가
- [x] 마이페이지 계정/보안 영역에서 생체인증 앱 잠금 토글 제공
- [x] 앱 실행 및 백그라운드 복귀 시 잠금 해제 인증 처리
- [x] 웹 브라우저에서는 비활성화하고 네이티브 앱에서만 동작하도록 분리
- [x] `npm run build`, Android Debug 빌드, iOS Simulator Debug 빌드 통과

---

## PC/Mobile Web/Native WebView 테마 동기화 기반 (완료 — 2026-06-02)

- [x] `자동/라이트/다크` 테마 모드 추가
- [x] 시스템 환경 설정(`prefers-color-scheme`) 기반 자동 전환 지원
- [x] 라이트 모드 기본 배경을 흰색 중심으로 정리
- [x] 다크 모드용 전역 배경/텍스트/서피스/네비게이션 토큰 추가
- [x] PC 사이드바, 모바일 하단 네비게이션, 마이페이지 설정 영역을 테마 토큰 기반으로 보정
- [x] 마이페이지 앱 설정에 화면 모드 선택 UI 추가
- [x] 초기 렌더링 시 테마 깜빡임을 줄이는 head 초기화 스크립트 추가
- [x] `npm run build` 통과

---

## 네이티브 보안 설정 고도화 (완료 — 2026-06-02)

- [x] `/settings/security` 보안 설정 페이지 추가
- [x] 프로젝트 규칙에 맞춰 `DesktopSecuritySettings.tsx` + `MobileSecuritySettings.tsx` + `page.tsx` 분기 구조 적용
- [x] 기존 사용자도 마이페이지에서 항상 `보안 설정` 메뉴를 볼 수 있도록 수정
- [x] 생체인증 사용 가능 여부와 무관하게 보안 설정 화면에서 상태/안내 노출
- [x] 생체인증 앱 잠금 설정을 기기별 로컬 저장소에 유지
- [x] 잠금 적용 범위 설정 추가: 앱 시작/복귀, 가계부, 공간 설정/초대, 계정/보안 설정
- [x] 재인증 주기 설정 추가: 항상 확인, 5분, 15분, 30분
- [x] `NativeBiometricGate`가 설정된 보호 범위와 재인증 주기를 읽어 잠금 처리하도록 보정
- [x] `npm run build` 통과

---

## Android 네이티브 로그인 후 웹 로그인 재노출 방지 (완료 — 2026-06-02)

- [x] Android 네이티브 Google 로그인 후 MainActivity WebView가 모바일 웹 `/login`으로 돌아갈 수 있는 레이스 조건 보정
- [x] `NativeAppProvider`가 네이티브 저장소의 Supabase 세션을 항상 브라우저 클라이언트에 재적용하도록 수정
- [x] WebView `localStorage` 주입만으로 서버 proxy 쿠키가 준비되지 않는 구간을 방어
- [x] 네이티브 앱 루트(`/`) 진입 시 `RootPageRouter`가 직접 `/home`으로 이동하지 않도록 변경
- [x] 네이티브 세션 적용 완료 후 `/home` 또는 온보딩 미완료 시 `/onboarding`으로 이동하도록 일원화
- [x] `npm run build`, Android `:app:assembleDebug` 통과

---

## iOS/Android OAuth 계정 선택 및 이메일 OTP 요청 보강 (완료 — 2026-06-04)

- [x] iOS 네이티브 Google OAuth에 `prompt=select_account` 추가
- [x] Android 네이티브 Google OAuth에 `prompt=select_account` 추가
- [x] Web/Native WebView Supabase OAuth 옵션에도 `queryParams.prompt='select_account'` 추가
- [x] iOS/Android 이메일 OTP 요청과 검증 요청에 `Authorization: Bearer <anon key>` 헤더 추가
- [x] 이메일 OTP는 앱 코드에서 Supabase `/auth/v1/otp`, `/auth/v1/verify`를 호출하는 구조임을 확인
- [x] 실제 메일 발송은 Supabase Auth Email/SMTP 설정에 의존함
- [x] `npm run build`, Android `:app:assembleDebug`, iOS Simulator Debug 빌드 통과

---

## 다크모드 대비/토큰 안정화 1차 (완료 — 2026-06-04)

- [x] 다크모드에서 하드코딩된 밝은 카드/어두운 텍스트가 보이지 않는 문제 원인 확인
- [x] 컨트롤/비활성 상태용 테마 토큰 추가
- [x] 전역 다크모드 inline-style 보정 범위 확장
- [x] 홈, 일정, 공간, 가계부, 알림, 온보딩, 마이페이지 등 주요 화면의 하드코딩 배경/텍스트 색상 1차 토큰화
- [x] 마이페이지 공통 모달 다크모드 대비 보정
- [x] `npm run build` 통과

---

## 이메일 회원가입·로그인 + 로그인 화면 소셜 우선 재구성 (완료 — 2026-06-15)

- [x] `useAuth`에 `signUpWithEmail(email, password, name)` / `signInWithEmail(email, password)` 추가 (`src/hooks/useAuth.ts`)
- [x] `/login`을 소셜 우선 구조로 재구성: 구글 버튼 우선, 그 아래 "이메일로 로그인" / "이메일로 회원가입" 진입
- [x] 애플·카카오 로그인은 심사·연동 부담으로 **UI에서 제외(보류)** — 추후 재도입
- [x] 이메일 회원가입 폼에 `[필수]` 만 14세 이상 / 이용약관 / 개인정보 수집·이용 동의 체크박스 + "전체 동의" 토글 (정보통신망법·개인정보보호법 준수, 미동의 시 제출 차단)
- [x] Confirm signup 이메일 템플릿 한글화(대시보드 적용 완료). 실제 발송은 Supabase Email/SMTP 설정 의존
- [x] `/login` `?view=email`·`?mode=signup` 딥링크 지원

## 네이티브 앱 이메일 로그인 파리티 (완료 — 2026-06-15)

- [x] 네이티브 `LoginActivity`(Google 전용)에 "이메일로 계속하기" 버튼 추가 (`activity_login.xml` + `btn_email_bg.xml`)
- [x] 버튼 → `MainActivity`를 `start_path=/login?view=email`로 실행 → WebView가 웹 이메일 폼 표시 (`?view=email`은 Google 버튼 없이 이메일만 → WebView Google OAuth 차단 회피)
- [x] `MainActivity`가 `start_path` extra를 받아 WebView를 해당 경로로 이동
- [x] `NativeAppProvider`: `onAuthStateChange(SIGNED_IN/TOKEN_REFRESHED)`에서 `saveNativeSession()` 호출 → WebView 이메일 로그인 세션을 네이티브 `SessionManager`에 저장(콜드 재실행 로그인 유지)
- [x] `android :app:assembleDebug` 통과(APK 생성 확인). ⚠️ 런타임 동작은 에뮬레이터/기기 스모크 테스트 권장

## 가계부 정기지출 이월 + 데이터/날짜 버그 수정 (완료 — 2026-06-15)

- [x] **치명적 결함 수정**: 매월/매주/매년 정기지출의 다음 주기 인스턴스가 어디서도 생성되지 않던 문제 → 달마다 별도 `schedules` row로 이월
- [x] 클라이언트 `materializeRecurringExpenses(spaceId)` (가계부 진입 시 lazy, 세션당 달·공간별 1회) — `src/lib/db.ts`
- [x] 서버 크론 `/api/cron/recurring-expenses` + `supabase/migrations/016` (매일 00:10 KST). 둘 다 멱등
- [x] 고정지출 수정 시 `end_time`이 설정돼 크론 missed 전환 설계와 충돌하던 버그 수정 (일회성만 동기화)
- [x] 변동지출 "반영 N건" 집계에 고정지출 완료분이 포함되던 오류 수정
- [x] 날짜 입력 UTC 자정 파싱 → `parseDateInput`으로 타임존 보정
- [x] 운영(www.gleaum.com)에서 변동/고정 등록·결제완료 토글·수정·삭제 E2E 검증

## 웹 푸시(FCM)·폰트·하이드레이션 운영 버그 수정 (완료 — 2026-06-15)

- [x] **웹 푸시 전체 미작동 수정**: `src/proxy.ts` matcher가 `.js/.json`을 제외하지 않아 `sw.js`·`firebase-messaging-sw.js`·`manifest.json`의 Content-Type이 `text/plain`으로 변질 → nosniff와 겹쳐 서비스워커 등록 실패. matcher 제외 확장자 추가로 해결, 운영 콘솔 `[FCM] 토큰 발급 성공` 검증
- [x] **Pretendard 폰트 미적용 수정**: `layout.tsx` 문자열 `onLoad` 핸들러를 React가 무시해 폰트가 `media="print"`로 고착되던 문제 + CSP에 `www.gstatic.com`·`cdn.jsdelivr.net` 허용, `worker-src 'self'` 추가
- [x] **데스크탑 레이아웃 밀림(React #418) 수정**: `useMediaQuery`를 `useSyncExternalStore`로 변경(SSR/첫 렌더 일치). 인사말 `useTimeGreeting` 훅 분리, 날짜 표시 `suppressHydrationWarning` 적용
- [x] 운영 데스크탑/모바일에서 #418 콘솔 오류 0건 확인

## Supabase 크론 도메인 통일 + 등록 SQL 정리 (완료 — 2026-06-15)

- [x] 크론 6종 타깃을 `https://www.gleaum.com`으로 통일 (automations·reminders의 구 `gleaum-app.vercel.app`, cleanup의 apex `gleaum.com` 정리)
- [x] `012`/`016` 등록 SQL의 `$$` 도크쿼팅 중첩 버그를 평문 `cron.schedule(name, schedule, '명령문')` 형태로 재작성
- [x] `CRON_SECRET` — Vercel·로컬·크론 6종 일치 확인 (실제 값은 비밀 저장소에서만 관리)

## iOS 네이티브 홈/일정 전환 API 기반 (완료 — 2026-06-18)

- [x] iOS 네이티브 전환 로드맵 문서 추가 (`docs/16-ios-native-roadmap.md`)
- [x] 네이티브 API 인증 헬퍼 추가: WebView cookie 세션 + Swift `Authorization: Bearer <access_token>` 동시 지원 (`src/lib/supabase/native-route.ts`)
- [x] 네이티브 홈 요약 API 추가: `GET /api/native/home-summary`
- [x] 네이티브 일정 생성 API 추가: `POST /api/native/schedules`
- [x] 홈 요약 계약에 사용자/공간/오늘 일정/향후 일정/가계부 원장 요약 포함
- [x] 일정 생성 계약에서 개인 공간/공유 공간 경계를 서버에서 보장
- [x] 공유 공간 일정 생성은 `space_members.role` 기준 `admin/editor`만 허용

## iOS 커스텀 Capacitor 플러그인 등록 보강 (완료 — 2026-06-18)

- [x] iOS Simulator에서 `NativeSession.getSession()`이 `UNIMPLEMENTED`로 실패하던 원인 확인
- [x] `AppBridgeViewController`를 추가해 앱 내부 커스텀 플러그인을 bridge 로드 시 명시 등록
- [x] 등록 대상: `NativeSessionPlugin`, `NativeBiometricPlugin`, `NativeCalendarPlugin`
- [x] `Main.storyboard` 루트 ViewController를 `AppBridgeViewController`로 변경
- [x] Xcode project Sources에 `AppBridgeViewController.swift` 추가
- [x] iOS Simulator 재실행 로그에서 `NativeSession getSession` → `{"session":null}` 정상 응답 확인
- [x] XcodeBuildMCP `build_run_sim` 통과

## iOS Face ID 설정 가능 여부 판정 보정 (완료 — 2026-06-18)

- [x] `NativeBiometricPlugin.isAvailable()`이 기기 암호(`deviceCredential`)만으로 `available=true`를 반환하던 문제 수정
- [x] iOS에서는 Face ID/Touch ID 등록 여부만 생체인증 잠금 활성 가능 상태로 판단
- [x] 기기 암호는 인증 실행 단계의 iOS 시스템 폴백으로만 유지
- [x] 생체인증 불가 상태에서 비상용 PIN 카드가 먼저 노출되지 않도록 보안 설정 UI 조건 보정
- [x] 온보딩/마이페이지/보안 설정의 "기기 잠금" 중심 문구를 Face ID/Touch ID/지문 등록 기준으로 정리
- [x] iOS Simulator 로그에서 `biometry_not_enrolled`, `available=false`, `biometryType=none` 반환 확인


## iOS P0 네이티브 앱 셸/홈/일정 빠른 등록 1차 (완료 — 2026-06-18)

- [x] `SessionManager.accessToken()` 추가 — Swift 네이티브 API 호출용 Bearer 토큰 추출
- [x] `NativeAPIClient` 추가 — `GET /api/native/home-summary`, `POST /api/native/schedules` 호출
- [x] `NativeRouteCoordinator` 추가 — 네이티브 홈/웹 경로/초대 딥링크 라우팅
- [x] 세션 보유 앱 실행 시 `NativeHomeViewController`를 full-screen으로 표시
- [x] 로그인 세션 저장 알림(`gleaumSessionSaved`) 후 네이티브 홈 자동 표시
- [x] 네이티브 홈 1차 구성: 종합 일정, 오늘 달력, 오늘 일정, 광고, 가계부, 앱 설정
- [x] 홈 `+` 및 오늘 일정 `+ 새 일정`에서 `NativeScheduleCreateViewController` Sheet 표시
- [x] 일정 저장 성공 시 홈 요약 재조회
- [x] iOS 알림 권한 요청 진입점 추가 — 홈 앱 설정의 알림 버튼
- [x] `gleaum://invite/{code}` / `https://www.gleaum.com/invite/{code}` 라우팅을 WebView 초대 경로로 연결
- [x] 네이티브 홈 API가 운영에 아직 배포되지 않은 상태를 대비해 `웹 홈으로 이동` fallback 추가
- [x] `npm run build` 통과 — `/api/native/home-summary`, `/api/native/schedules` 라우트 생성 확인
- [x] XcodeBuildMCP `build_run_sim` 통과 및 Simulator에서 네이티브 홈 화면 표시 확인


## iOS 네이티브 홈 API 미배포 fallback 보정 (완료 — 2026-06-18)

- [x] 운영에 `/api/native/home-summary`가 아직 배포되지 않은 상태에서 앱 첫 화면이 에러 화면으로 고정되던 문제 수정
- [x] 404/5xx 응답은 네이티브 홈 에러 화면 대신 기존 WebView `/home`으로 자동 fallback
- [x] XcodeBuildMCP `build_run_sim` 통과
- [x] Simulator에서 에러 화면 대신 모바일 웹 홈 진입 확인


## iOS 네이티브 홈/WebView 홈 반복 전환 차단 (완료 — 2026-06-18)

- [x] 네이티브 홈 API fallback 후 `불러오는 중` 화면과 모바일 웹 홈이 무한 반복되던 문제 수정
- [x] WebView 경로 이동 시 `prefersNativeHome=false` 처리
- [x] WebView 세션 저장 알림이 네이티브 홈을 다시 띄우지 않도록 AppDelegate 조건 보강
- [x] XcodeBuildMCP `build_run_sim` 통과
- [x] Simulator에서 17초 이상 웹 홈에 안정적으로 머무는 것 확인


## iOS 네이티브 홈 운영 API 활성화 검증 (완료 — 2026-06-18)

- [x] GitHub push → Vercel 운영 배포 반영
- [x] `/api/native/home-summary` 운영 경로가 404가 아닌 401 Unauthorized로 응답하는 것 확인
- [x] `nativeHomeEnabled=true` 전환
- [x] iOS Simulator에서 운영 API 기반 네이티브 홈 데이터 표시 확인
- [x] 네이티브 `+ 새 일정` Sheet 열림/닫힘 확인


## iOS WebView 홈 복귀 네이티브 승격 + 시작 플래시 보정 (완료 — 2026-06-18)

- [x] WebView 내부 `/home` SPA 라우팅을 감지하는 `gleaumRoute` WKScriptMessageHandler 추가
- [x] `history.pushState` / `replaceState` / `popstate` / click 후 현재 경로를 네이티브로 전달
- [x] `/` 또는 `/home` 감지 시 WebView 홈 대신 네이티브 홈 표시
- [x] 앱 시작 시 세션 보유 상태에서는 WebView를 숨기고 네이티브 홈을 즉시 표시해 `홈화면으로 이동 중` 노출을 줄임
- [x] WebView 기능 이동 시에는 WebView를 다시 표시하도록 `openWebPath()` 보정
- [x] XcodeBuildMCP `build_run_sim` 통과


## iOS 네이티브 홈 하단 네비게이션 복구 (완료 — 2026-06-18)

- [x] 네이티브 홈 full-screen 전환으로 웹 하단 메뉴가 가려지던 구조 확인
- [x] `NativeHomeViewController`에 고정 하단 네비게이션 추가
- [x] 홈/일정/공간/가계부/전체 5개 메뉴 제공
- [x] 홈은 네이티브 새로고침, 나머지는 WebView 기능 경로로 이동
- [x] XcodeBuildMCP `build_run_sim` 통과 및 Simulator 표시 확인


## iOS 네이티브 하단 네비게이션 UI 고도화 (완료 — 2026-06-18)

- [x] 조잡한 텍스트 기호 아이콘 제거
- [x] SF Symbols 기반 네이티브 탭 아이콘 적용
- [x] 어두운 블러 글래스 컨테이너와 활성 탭 pill 스타일 적용
- [x] `UIButton.Configuration` 기반으로 접근성/자동화 타깃 보강
- [x] XcodeBuildMCP `build_run_sim` 통과
- [x] `snapshot_ui`에서 홈/일정/공간/가계부/전체 버튼 타깃 확인


## Android Firebase 운영 계측/푸시 라우팅 보강 (완료 — 2026-06-23)

- [x] 네이티브 Android Firebase 초기화 허브 `NativeFirebase` 추가
- [x] Activity 화면 진입을 Firebase Analytics `screen_view`와 Crashlytics `last_screen`으로 기록
- [x] 세션 저장/앱 재개 시 Analytics/Crashlytics user id 연결
- [x] 네이티브 FirebaseMessaging token을 Supabase `profiles.fcm_token`에 직접 저장
- [x] FCM token refresh/foreground message 수신 서비스 추가
- [x] foreground FCM 수신 시 시스템 알림 표시
- [x] 스플래시 화면이 푸시/딥링크 Intent data/extras를 RouterActivity로 보존 전달
- [x] 알림 `data.url`을 네이티브 화면으로 직접 라우팅하는 `NativeDeepLinkRouter` 추가
- [x] Android debug 빌드 통과


## Android Native Port 다크모드/태블릿/라우팅 1차 보강 (완료 — 2026-06-23)

- [x] Android 네이티브 공통 `NativeTheme` 추가
- [x] Android 네이티브 핵심 화면의 색상 호출을 시스템 다크모드 대응 경로로 전환
- [x] Android 네이티브 핵심 화면의 시스템바를 라이트/다크 모드에 맞춰 자동 조정
- [x] WebView 내부 핵심 링크를 `NativeDeepLinkRouter` 단일 매퍼로 네이티브 화면 승격
- [x] `/invite/{code}` 초대 링크를 네이티브 공간 참여 흐름으로 연결
- [x] 로그인 화면에서 최초 딥링크 경로를 보존해 로그인 후 이어가기 보강
- [x] schedule/budget/space Native Port flag를 실제 활성 상태와 일치시킴
- [x] Android debug 빌드 통과


## Android 네이티브 온보딩 1차 (완료 — 2026-06-23)

- [x] Native onboarding complete API 추가
- [x] Native profile summary에 onboarding 완료 여부 추가
- [x] Android `NativeOnboardingActivity` 추가
- [x] 이름/표시 방식, 사용 목적, 홈 구성, 공간/알림 핵심 단계 제공
- [x] 웹 온보딩과 동일한 `preferences`, `notification_settings`, `onboarding_completed_at` 저장
- [x] 네이티브 홈 진입 시 온보딩 미완료 사용자를 Native onboarding으로 전환
- [x] `/onboarding` 라우트를 Android Native Activity로 승격
- [x] Android debug 빌드 통과
- [x] `npm run build` 통과


## Android 온보딩 공간/생체 설정 보강 (완료 — 2026-06-23)

- [x] 네이티브 온보딩에 공간 설정 단계 추가
- [x] 온보딩 중 새 공유 공간 생성 지원
- [x] 온보딩 중 초대 코드로 공간 참여 지원
- [x] 온보딩 마지막 단계에 생체인증 앱 잠금 토글 추가
- [x] 기존 `CapacitorStorage` 생체인증 설정 키와 호환
- [x] Android debug 빌드 통과

## Android Native Theme 사용자 선택값 반영 (완료 — 2026-06-24)

- 네이티브 화면의 다크/라이트 판단이 시스템 설정만 따르던 문제 수정
- `gleaum:theme-mode` 저장값(`system/light/dark`)을 `NativeTheme`에서 직접 반영
- 전체 메뉴의 화면 모드 변경 직후 상태바/네비게이션바 색상 재적용
- Android debug 빌드 통과

## Android Native Home Layout 설정 연결 (완료 — 2026-06-24)

- 전체 메뉴의 홈 레이아웃 저장값을 웹 공통 타입과 일치시킴
- 기존 Android 로컬 저장값 `schedule_first`, `budget_first` 하위 호환 처리
- 네이티브 홈 히어로 카피와 캘린더 초기 열림 상태에 홈 레이아웃 반영
- Android debug 빌드 통과

## Android Native UI 품질 보정 (완료 — 2026-06-24)

- 다크모드 텍스트 대비 문제 일부 보정
- 하단 네비게이션 공통 컴포넌트 `NativeBottomNav` 추가
- 홈/일정/공간/가계부/전체 하단 네비게이션 UI 일관화
- 반복 타일/칩의 과한 그라데이션 축소
- Android debug 빌드 및 실기기 설치 완료

## Android 다크모드 색상 역할 보정 (완료 — 2026-06-24)

- `NativeTheme`에 절대색/테마색 역할 분리 추가
- 다크 카드 위 white alpha 텍스트가 surface 색으로 오염되던 문제 수정
- 주요 입력 필드 text/hint 색상 보정
- Android debug 빌드 및 실기기 설치 완료
- Material Design 3 전면 개편 계획 문서 작성

## Android Compose Material 3 Phase 0 적용 (완료 — 2026-06-24)

- Compose Material 3 Gradle 기반 추가
- Gleaum Compose Theme/Scaffold/NavigationBar/ExpandableSection 추가
- Material3ShellPreviewActivity 추가
- 상위 메뉴 선택 시 하위 메뉴가 펼쳐지는 M3 motion 샘플 구현
- Android debug 빌드 및 실기기 Preview 실행 확인

## Web 공간 전환·정보 구조 개편 (완료 — 2026-07-14)

- 모바일의 도트/스와이프 중심 공간 전환을 명시적인 공간 선택 바텀시트로 교체
- PC의 대형 공간 Hero와 공간 칩 목록을 1행 공간 컨텍스트 툴바로 축소
- 공간 선택 시 화면 상태, `gleaum_lastSpaceId`, `/space?sid=`를 함께 갱신
- URL/최근 선택/프로필 기본 공간을 실제 멤버십 목록으로 검증한 뒤 활성 공간 결정
- 초대 코드 참여 완료 직후 참여한 공간으로 자동 전환
- 모바일/PC 공간 내부를 `소식 / 일정 / 멤버` 탭으로 통일
- 존재하지 않는 `/space/schedule` 이동을 현재 공간의 일정 탭 전환으로 수정
- 모바일 피드 하단과 화면 고정 FAB가 중복 노출되던 추가 버튼 제거
- `npm run build`, 공간 관련 ESLint 검사 통과

## Android 네이티브 공간 전환·Material 3 UI 개편 (완료 — 2026-07-14)

- `NativeSpaceActivity`의 임시 `공간 전환 기능은 준비 중` 처리를 실제 전환 API로 교체
- 공간 멤버십 확인 후 `profiles.family_group_id`를 변경하는 `/api/native/spaces/[id]/activate` 추가
- 현재 공간 카드를 누르면 Material 3 `ModalBottomSheet` 공간 선택기 노출
- 대형 Hero와 전체 공간 목록 상시 노출을 제거하고 현재 공간 컨텍스트를 compact card로 축소
- 공간 내부를 `요약 / 멤버 / 관리` 구간으로 분리
- 요약에서 멤버 수, 역할, 초대 코드, 일정·참여·생성 빠른 이동 제공
- 공간 생성용 전역 FAB 제거하고 기능 문맥 안으로 이동
- Android debug APK 빌드 및 연결 기기 설치 성공
- Vercel 운영 배포 완료, `/api/native/spaces/[id]/activate` 인증 경계 401 응답 확인

## Android 공간 커뮤니티 홈 전환 (완료 — 2026-07-14)

- 공간 기본 화면을 운영 요약에서 멤버 커뮤니티 소식으로 변경
- `소식 / 일정 / 멤버` 정보 구조로 Android와 웹의 공간 개념 통일
- 공간 소식 목록, 소식 작성, 고정 소식 및 댓글 수 표시 구현
- 현재 공간의 다가오는 일정 목록, 일정 상세 이동, 일정 추가 진입 구현
- 초대 코드·역할·공간 관리는 설정 바텀시트로 후순위 이동
- Material 3 전체 색상 role을 글리움 브랜드/neutral token으로 명시해 fallback 보라·분홍 제거
- 별도 Supabase migration 없이 기존 `space_posts` RLS를 재사용
- `npm run build`, Android debug 빌드 통과

## Android Material 3 UI 품질 기준 A 개편 (코드 감사 완료 — 2026-07-14)

- light/dark 전체 ColorScheme, Typography, Shapes를 명시적으로 정의했다.
- 임의 그라데이션과 고정 지출 배경색을 제거하고 Material surface/container 및 의미색 토큰으로 교체했다.
- `GleaumFeedbackBanner`, `GleaumStatusBadge`, `GleaumLabelBadge`, `GleaumStateCard`로 안내·상태 UI를 통일했다.
- 일반 안내가 errorContainer로 표시되거나 비클릭 상태가 AssistChip으로 보이던 문제를 제거했다.
- 공통 하단 메뉴를 Material 3 `NavigationSuiteScaffold`로 교체해 폰 NavigationBar와 태블릿 NavigationRail 전환을 공식 컴포넌트에 맡겼다.
- 홈 로딩/오류 시 빈 데이터 본문이 함께 노출되던 문제와 알림 화면의 선택 상태 없는 중복 하단 메뉴를 수정했다.
- 독립 Scaffold 화면(일정 상세/폼, 가계부 폼, 알림)과 온보딩에도 적응형 콘텐츠 폭 제한을 적용했다.
- 로그인/스플래시 XML의 사용자 문자열을 string resource로 이동하고 predictive back lint 오류를 수정했다.
- API 24에서 동작하지 않던 `java.time.Instant` 직접 사용을 호환 ISO 파서로 교체했다.
- 검증: Android `:app:assembleDebug` 통과, `:app:lintDebug` 오류 0건.
- 평가 기준과 화면별 임시 점수는 `docs/22-android-material3-ui-audit.md`에서 관리한다.

## Android 실기기 시작 흐름·네이티브 캘린더 가져오기 보강 (완료 — 2026-07-23)

- `SM_F731N` 실기기에서 Google 로그인 후 스플래시 → 네이티브 홈, 홈/일정/공간/가계부/전체 메뉴 왕복을 확인했다.
- 스플래시 중 선조회한 홈·공간·일정·가계부·알림 캐시가 화면 이동에서 재사용되고 앱 크래시/ANR이 없음을 확인했다.
- 전체 메뉴의 캘린더 선택 목록을 스크롤 가능한 단일 선택 목록으로 변경하고 긴 캘린더/계정 이름을 말줄임 처리했다.
- WebView `/settings/calendar`로 이동하던 `기기 일정 가져오기`를 Compose Material 3 네이티브 화면으로 교체했다.
- 선택한 기기 캘린더에서 어제~30일 뒤 일정을 조회하고, 글리움 표식 일정과 제목·시작 시각이 같은 기존 private 개인 일정을 제외한다.
- 사용자가 선택한 일정만 `type=personal`, `visibility=private`로 생성하며 공유 공간에는 기록하지 않는다.
- 폴더블 하단 시스템 내비게이션 인셋과 가져오기 버튼이 겹치지 않도록 보정했다.
- 실기기에서 후보 3개 조회·선택 UI·뒤로가기·시스템 바를 확인했다. 운영 데이터 보호를 위해 실제 가져오기 실행은 보류했다.
- Android `:app:testDebugUnitTest`, `:app:assembleDebug` 통과 및 최신 debug APK 설치 완료.

## Android Kakao AdFit 실기기 미노출 복구 (완료 — 2026-07-23)

- 가족 계정 도입 전 생성된 일반 계정의 `unknown` account mode를 광고 가능한 레거시 표준 계정으로 정의했다.
- 자녀·청소년 제한 계정 4종의 광고 차단은 유지하고 Web/API/Android capability 계약을 동일하게 맞췄다.
- 운영 Supabase migration `20260723021003_allow_ads_for_legacy_standard_accounts.sql` 적용 및 Vercel Production 배포를 완료했다.
- 스플래시 선조회 스레드가 Google App Open Ad를 백그라운드에서 로드해 앱을 종료시키던 문제를 메인 Looper 강제로 수정했다.
- 실기기에서 AdFit 하단 전환형 팝업 요청·로드·SDK UI 렌더링과 크래시 0건을 확인했다.
