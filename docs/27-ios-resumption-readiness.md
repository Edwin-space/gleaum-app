# Apple 네이티브 개발 재개 준비 보고서

> 기준일: 2026-07-24
> 목적: Android 기능 마감 후 iPhone·iPad·macOS 개발을 재개할 때 기존 구현을 과대평가하거나 Android/Web 작업을 중복하지 않도록 현재 상태와 재개 순서를 고정한다.

## 1. 결론

iPhone/iPad 앱은 **로그인·세션 브리지, 네이티브 홈, 일정 빠른 등록의 1차 기반만 존재**한다. 전체 네이티브 앱으로 볼 수 없으며 일정 목록, 공간, 가계부, 알림, 전체 메뉴, 가족·자녀 연결은 대부분 WebView 또는 미구현 상태다. macOS 앱은 아직 빌드 타겟이 없다.

재개 시 기존 Swift의 세션 형식·API 모델·OS 브리지 기반은 재사용하되 기존 UIKit 시각 디자인은 확장하지 않는다. Android에서 확정한 공통 API·권한·오류 계약을 유지하면서 제품 화면은 SwiftUI와 Apple Human Interface Guidelines, Liquid Glass 원칙으로 교체한다. iPad는 별도 적응형 배치를 제공하고 macOS는 공통 SwiftUI 모듈을 쓰는 네이티브 타겟으로 확장한다. 상세 디자인·구조 기준은 `docs/28-apple-liquid-glass-design-plan.md`가 소유한다.

구현은 iPhone을 먼저 완성한 뒤 iPad, 그다음 macOS 순으로 진행한다. iPhone 단계에서는 iPad/macOS 화면 구현을 섞지 않는다.

### 2026-07-23 실제 감사 기준

- `Gleaum` 스킴의 서명 제외 iPhoneOS Debug 빌드는 성공했다.
- 현재 프로젝트는 iPhone/iPad 유니버설 타겟이며 Bundle ID는 `com.gleaum.app`, 최소 지원 버전은 iOS 15다.
- iPad는 빌드 대상과 회전 설정만 존재하며 sidebar·list-detail·다열 레이아웃은 없다.
- macOS는 `targetEnvironment(macCatalyst)` 조건부 window 크기 코드만 남아 있고 `SUPPORTS_MACCATALYST=NO`라 현재 빌드 대상이 아니다.
- Xcode가 누락된 개발 구성요소를 설치하고 stale CoreSimulator 서비스를 교체해 iOS 26.4/26.5 런타임을 복구했다. iPhone 17 Pro 시뮬레이터 Debug 빌드·설치·콜드 스타트가 통과했다.
- `NativeRouteCoordinator`는 `/`와 `/home`만 네이티브 화면으로 처리하고 나머지 경로는 운영 WebView로 연다.
- 현재 구조는 Capacitor 루트 위에 로그인·홈을 전체 화면 modal로 올리고 내리는 방식이라 네이티브 → WebView → 네이티브 왕복 시 화면 상태와 내비게이션 소유권이 섞일 위험이 있다.
- Push Notifications·Associated Domains·Sign in with Apple entitlement를 프로젝트 타겟에 연결했다. Debug는 APNs development, Release는 production 값을 사용한다.
- Firebase Messaging SPM 의존성, `GoogleService-Info.plist`, APNs 등록/FCM token callback이 이미 연결되어 있다.
- Google 로그인은 네이티브 SDK가 아니라 `SFSafariViewController` → Supabase OAuth → `gleaum://auth/callback` 방식으로 이미 호출된다. 현재 plist에는 Google Sign-In용 `CLIENT_ID`·`REVERSED_CLIENT_ID`가 없다.
- AASA 파일은 `public/.well-known/apple-app-site-association`에 존재한다.
- `PrivacyInfo.xcprivacy`를 앱 Resources에 포함하고 이름·이메일·사용자/기기 ID·가계부·사용자 콘텐츠·자녀 계정 정보·제품 상호작용을 실제 수집 목적에 맞춰 선언했다.
- 카메라·사진·마이크·현재 위치·ATT와 background fetch 과다 선언을 제거하고 현재 구현된 캘린더·Face ID·remote notification만 유지했다.
- 현재 Xcode 계정은 Personal Development Team이다. 해당 팀은 Sign in with Apple·Associated Domains·Push Notifications가 포함된 프로비저닝 프로파일을 만들 수 없어 해당 capability의 실제 기기 검증은 불가능하다. 사용자 결정에 따라 유료 계정 획득은 모든 라이선스 비의존 구현·시뮬레이터·로컬 Mac 검증 이후로 미룬다.

## 2. 구현 원칙

1. **기능 계약은 공통, 화면은 Apple 네이티브**
   - Supabase·공통 API·RLS·capability·오류 코드는 Android/Web과 동일하게 유지한다.
   - Android Material 3 화면을 그대로 복제하지 않는다. iOS는 SwiftUI, Apple semantic color, SF Symbols, Dynamic Type와 Human Interface Guidelines를 기준으로 구현한다.
   - 글리움 브랜드 컬러와 정보 구조는 유지하되 iOS 기본 내비게이션·시트·선택·권한 UX를 따른다.
   - 기존 UIKit 고정 색상·수동 하단 바·커스텀 카드 디자인은 신규 화면의 기준으로 사용하지 않는다.
   - Liquid Glass는 탭·내비게이션·toolbar 등 기능 계층에만 사용하고 콘텐츠 카드에 반복 적용하지 않는다.

2. **단일 네이티브 앱 셸**
   - `TabView`와 탭별 `NavigationStack`, 중앙 Route enum/coordinator를 앱의 유일한 내비게이션 소유자로 둔다.
   - 홈·일정·공간·가계부·전체 메뉴는 같은 네이티브 셸 안에서 상태를 유지한다.
   - 기존 UIKit 홈·일정 등록은 즉시 폐기하지 않고 SwiftUI 셸에서 단계적으로 교체한다.
   - WebView는 법적 원문·외부 인증 fallback처럼 명확히 정의된 보조 화면에만 허용한다.

3. **시작 선조회와 캐시**
   - Android에서 확정한 방식대로 스플래시 동안 session context·홈·공간·일정·가계부·알림을 병렬 선조회한다.
   - 탭 이동마다 전체 재호출하지 않고 프로세스 캐시, pull-to-refresh, 쓰기 작업 후 선택 무효화를 적용한다.

4. **버전별 단일 구조**
   - 최신 SDK의 표준 SwiftUI 컴포넌트를 우선해 iOS 26 이상에서 Liquid Glass 외형을 자동 적용한다.
   - 이전 지원 OS는 같은 화면 구조에서 시스템 표준 material로 fallback하며 화면을 두 벌 만들지 않는다.
   - 현재 iOS 15 deployment target은 구현 착수 전에 iOS 17 이상 권장안과 지원 기기 범위를 대조해 확정한다.

5. **iPad와 macOS는 별도 작업 표면**
   - iPad regular width는 `NavigationSplitView`, sidebar, list-detail, 필요 시 inspector를 사용한다.
   - iPad compact window에서는 iPhone 5탭 구조로 축소하고 선택·입력 상태를 보존한다.
   - macOS는 `Designed for iPad`나 단순 Catalyst 확대를 최종 상태로 삼지 않고 shared Swift Package를 사용하는 네이티브 SwiftUI 타겟으로 구성한다.
   - macOS는 resizable window, menu command, keyboard shortcut, context menu와 Settings scene를 완료 조건에 포함한다.

## 3. 현재 코드 상태

| 구간 | 현재 상태 | 판정 |
|---|---|---|
| 앱 셸·세션 | `SessionManager`, `NativeSessionPlugin`, `AppBridgeViewController` 존재 | 기반 재사용 |
| Google 로그인 | `LoginViewController`가 `SFSafariViewController`로 Supabase OAuth 호출 | 동작 기반 재사용. 네이티브 SDK 전환은 필수 외부 준비가 아닌 UX 개선 |
| 네이티브 홈 | `NativeHomeViewController` + `/api/native/home-summary` | 1차 구현, 실제 계정 회귀 필요 |
| 일정 등록 | `NativeScheduleCreateViewController` + `/api/native/schedules` | 빠른 등록만 존재 |
| 일정·공간·가계부·전체 메뉴 | 네이티브 홈 하단에서 WebView 경로로 이동 | 네이티브 전환 필요 |
| 생체인증 | `NativeBiometricPlugin`의 LocalAuthentication 브리지 존재 | 설정 화면·잠금 정책 마감 필요 |
| 기기 캘린더 | `NativeCalendarPlugin`의 EventKit 브리지 존재 | 캘린더 선택·가져오기·중복 UX 필요 |
| 푸시 | Firebase Messaging 의존성·plist·APNs 등록·FCM token callback 존재 | 서버 등록·딥링크 구현 후 유료 계정 단계에서 실제 token 회귀 |
| Universal Links | 라우팅 코드·Associated Domains entitlement·AASA 존재 | 운영 Team capability와 실제 기기 회귀만 후순위 |
| iPad | universal device family·회전 설정 존재 | 별도 적응형 정보 배치 신규 구현 |
| macOS | 비활성 Catalyst 조건부 코드만 존재 | native SwiftUI target 신규 구현 |
| 가족·자녀 | 네이티브 구현 없음 | Android 확정 흐름 기준 신규 구현 |
| 개인정보 선언 | `PrivacyInfo.xcprivacy` 존재 | SDK와 실제 수집 항목 재감사 필요 |

## 4. 준비 순서

### 이미 존재해 외부 준비에서 제외

- Firebase Messaging SDK와 `GoogleService-Info.plist`
- APNs 등록·FCM token callback 코드
- Supabase Google browser OAuth와 `gleaum://auth/callback`
- LocalAuthentication·EventKit 브리지
- Associated Domains entitlement·AASA
- Bundle ID·Privacy Manifest·iPhone/iPad universal target

### 유료 라이선스 전에 완료

- SwiftUI 디자인 시스템·루트 상태 머신·공통 API/session/cache
- iPhone 5탭, iPad sidebar/list-detail, macOS native target
- Google browser OAuth·이메일 인증 연결
- Sign in with Apple protocol/UI와 mock 가능한 상태 전이
- push·Universal Link route와 서버 token 등록 클라이언트
- iPhone/iPad 시뮬레이터·로컬 Mac build/test·접근성 정적 감사

### 모든 로컬 구현 후 유료 계정으로 마감

- 운영 Team·App ID·배포 인증서·프로비저닝 프로파일
- Sign in with Apple·Push Notifications·Associated Domains capability
- APNs Auth Key→Firebase와 실제 APNs/FCM token
- 운영 Team ID 기준 AASA 실기기 검증
- iPhone/iPad 서명 설치, TestFlight, macOS 서명·공증, App Store Connect

## 5. 필수 선행 수정

### P0 — 출시를 막는 항목

1. **인증 체계**
   - Google 소셜 로그인을 유지하면 App Review Guideline 4.8에 맞는 동등 로그인 수단을 제공해야 한다.
   - 기본 방향은 `Sign in with Apple` 추가 + 기존 Google browser OAuth의 SwiftUI 상태 머신 통합이다. Google 네이티브 SDK 전환은 계정 선택 UX 개선이 필요할 때 별도 수행한다.
   - Supabase 세션 저장 형식은 Android/Web과 동일한 access/refresh token 계약을 유지한다.

2. **라우팅과 화면 소유권**
   - `NativeRouteCoordinator`가 현재 `/home`만 네이티브로 처리하는 구조를 화면 레지스트리 방식으로 확장한다.
   - 홈 → WebView 기능 → 홈 복귀 시 네이티브/웹 상태가 뒤섞이지 않도록 단일 탭 컨테이너를 둔다.
   - 자녀 초대, 일반 공간 초대, 알림 일정 이동은 Universal Link와 앱 내부 라우팅이 같은 목적지로 가야 한다.

3. **권한 최소화**
   - 현재 `Info.plist`의 카메라, 사진, 위치, 마이크, 추적 권한 문구는 실제 제공 기능보다 넓다.
   - 출시 빌드에서 사용하지 않는 권한 문구·SDK를 제거하고 필요한 권한은 기능을 누른 시점에만 요청한다.
   - `PrivacyInfo.xcprivacy`와 App Store Connect 개인정보 답변을 실제 SDK 수집 항목에 맞춘다.

4. **APNs와 Universal Links**
   - Push Notifications capability와 `aps-environment` entitlement를 실제 서명 빌드에 포함한다.
   - APNs 실패 콜백, FCM 토큰 서버 등록, 토큰 갱신, 알림 탭 딥링크를 실기기에서 검증한다.
   - Associated Domains와 AASA를 양쪽에 설정하고 초대 링크 입력값을 검증한다.

### P1 — Android 기능 동등화

1. 일정 목록·상세·생성/수정
2. 공간 목록·전환·일반/가족 공간·멤버 관계·초대
3. 자녀 등록·보호자 OTP·필수 동의·초대 공유·claim·최종 승인/거절
4. 개인 가계부 수입/지출·반복 항목·월별 요약
5. 알림 목록·읽음·설정·목적지 이동
6. 전체 메뉴·프로필·비밀번호·탈퇴/복구·법적 문서
7. EventKit 캘린더 선택·내보내기·가져오기·중복 방지
8. Face ID/Touch ID 앱 잠금과 재잠금 간격

## 6. 실행 단계

### Phase 0 — 빌드·권한 소스 기준선

- [x] 서명 제외 generic iPhoneOS Debug 빌드
- [x] CoreSimulator/Xcode 버전 불일치 해소
- [ ] 유료 Apple Developer Team·배포 인증서·프로비저닝 프로파일 확보 — 라이선스 비의존 작업 완료 후 재개
- [x] Sign in with Apple·Push Notifications·Associated Domains capability 소스 구성
- [x] 불필요한 `Info.plist` 권한 문구 제거
- [x] `PrivacyInfo.xcprivacy`와 실제 앱 수집 항목 대조·타겟 포함
- [ ] 서명 Debug 빌드의 실제 iPhone 설치·콜드 스타트 확인

유료 계정 대기는 현재 구현 차단 사유가 아니다. SwiftUI 화면·세션·API·iPad/macOS 레이아웃을 먼저 완료하고, 실제 Apple 로그인·APNs·Universal Links·TestFlight 검증 단계에 도달했을 때 Xcode를 운영 Team에 연결한다.

### Phase 1 — 인증·세션·앱 셸

- [ ] Apple semantic token·SF Symbols·Liquid Glass 사용 경계 확정
- [ ] 기존 UIKit 시각 컴포넌트 신규 확장 중단
- [ ] SwiftUI 루트 앱 셸, iPhone 5탭, iPad sidebar/list-detail 구성
- [ ] 세션 복원·만료·로그아웃·재로그인 상태 머신 통합
- [ ] Sign in with Apple 구현
- [ ] 기존 Google browser OAuth 통합과 계정 선택 보장
- [ ] 네이티브 이메일 로그인·가입·약관 동의 구현
- [ ] Universal Link·custom scheme·푸시 목적지의 단일 Route 계약 구현
- [ ] 스플래시 선조회·캐시·수동 새로고침 정책 적용

### Phase 2 — 핵심 기능 네이티브화

- [ ] 홈 요약·개인화 레이아웃·빈 상태·바로가기
- [ ] 일정 목록·상세·생성·수정·삭제·반복·참여자·알림
- [ ] 공간 목록·전환·소식·일정·멤버·설정·일반/가족 전환
- [ ] 가족 관계 표시와 일반 가족/자녀 초대 분리
- [ ] 자녀 등록·보호자 OTP·동의·초대·claim·최종 승인/거절
- [ ] 개인 가계부 수입·지출·반복 항목·월별 요약
- [ ] 알림 목록·읽음·설정·목적지 이동
- [ ] 전체 메뉴·프로필·계정·약관·탈퇴

### Phase 3 — Apple OS 기능

- [ ] EventKit 캘린더 선택·내보내기·가져오기·중복 방지
- [ ] Face ID/Touch ID 앱 잠금·재잠금 간격·기기 암호 fallback
- [ ] APNs 권한 요청·FCM 토큰 등록/갱신·실패 관측
- [ ] Universal Links와 AASA 실기기 검증
- [ ] 백그라운드/포그라운드 전환과 알림 탭 딥링크 검증

### Phase 4 — iPhone/iPad/macOS 품질

- [ ] 소형 iPhone·표준·Pro Max·iPad·Split View·Stage Manager 레이아웃
- [ ] 네이티브 macOS 타겟·resizable window·sidebar·menu·keyboard
- [ ] 라이트·다크·시스템 모드와 상태바/홈 인디케이터 정합성
- [ ] Dynamic Type·VoiceOver·Reduce Motion·키보드 탐색
- [ ] 오프라인·부분 API 실패·세션 만료·중복 탭 방지
- [ ] iPhone/iPad simulator와 로컬 Mac build/test

### Phase 5 — 유료 라이선스·실기기·출시

- [ ] 운영 Team과 capability 활성화
- [ ] 실제 iPhone/iPad에서 Apple 로그인·APNs·Universal Links·Face ID·EventKit
- [ ] TestFlight 내부 테스트와 Crashlytics 회귀
- [ ] macOS 서명·공증·배포 검증
- [ ] App Store 개인정보·연령등급·심사 계정·심사 메모·스크린샷

## 7. 범위 분리

### Apple 핵심 완료 전 보류

- iOS 광고 SDK·광고 지면
- 이미지·파일 첨부
- 자녀 위치 추적·지오펜싱
- 위젯·Live Activity·Watch 앱

위 항목은 핵심 기능과 계정·공간·자녀 데이터 경계가 안정된 뒤 별도 단계로 진행한다. 특히 자녀 위치는 권한 UI만의 문제가 아니라 보호자 동의, 연령, 보유 기간, 백그라운드 위치 정책을 먼저 확정해야 한다.

## 8. 완료 기준

- 핵심 화면이 WebView로 되돌아가지 않고 네이티브 탭 상태를 유지한다.
- Android/Web과 같은 계정으로 일정·공간·가계부·알림 데이터가 동일하게 보인다.
- 개인/공간 데이터 경계와 역할별 쓰기 권한이 동일하다.
- Google·Apple·이메일 로그인과 로그아웃·재로그인·세션 만료가 실기기에서 통과한다.
- 자녀 계정은 capability에 따라 메뉴·광고·가계부·공간 관리가 제한된다.
- Universal Link, APNs 알림, 캘린더, 생체인증을 실제 iPhone에서 검증한다.
- iPad는 확대된 iPhone 화면이 아니라 sidebar·list-detail·다열 배치를 제공한다.
- macOS는 네이티브 window·sidebar·menu·keyboard 상호작용을 제공한다.
- App Store Connect 개인정보 답변, Privacy Manifest, 실제 권한 요청이 일치한다.

## 9. 공식 기준

- Apple App Review Guidelines 4.8: <https://developer.apple.com/app-store/review/guidelines/#login-services>
- Associated Domains: <https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.associated-domains>
- Universal Links: <https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app>
- APNs 등록: <https://developer.apple.com/documentation/usernotifications/registering-your-app-with-apns>
- Privacy Manifest: <https://developer.apple.com/documentation/bundleresources/adding-a-privacy-manifest-to-your-app-or-third-party-sdk>
