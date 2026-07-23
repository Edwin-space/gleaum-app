# iOS 개발 재개 준비 보고서

> 기준일: 2026-07-23  
> 목적: Android 기능 마감 후 iOS 개발을 재개할 때 기존 구현을 과대평가하거나 Android/Web 작업을 중복하지 않도록 현재 상태와 재개 순서를 고정한다.

## 1. 결론

iOS는 **로그인·세션 브리지, 네이티브 홈, 일정 빠른 등록의 1차 기반만 존재**한다. 전체 네이티브 앱으로 볼 수 없으며 일정 목록, 공간, 가계부, 알림, 전체 메뉴, 가족·자녀 연결은 대부분 WebView 또는 미구현 상태다.

재개 시 기존 Swift 코드를 폐기하지 않는다. Android에서 확정한 공통 API·권한·오류 계약을 유지하면서 iOS 화면과 OS 기능만 SwiftUI/UIKit으로 구현한다.

### 2026-07-23 실제 감사 기준

- `Gleaum` 스킴의 서명 제외 iPhoneOS Debug 빌드는 성공했다.
- 현재 프로젝트는 iPhone/iPad 유니버설 타겟이며 Bundle ID는 `com.gleaum.app`, 최소 지원 버전은 iOS 15다.
- Xcode가 누락된 개발 구성요소를 설치하고 stale CoreSimulator 서비스를 교체해 iOS 26.4/26.5 런타임을 복구했다. iPhone 17 Pro 시뮬레이터 Debug 빌드·설치·콜드 스타트가 통과했다.
- `NativeRouteCoordinator`는 `/`와 `/home`만 네이티브 화면으로 처리하고 나머지 경로는 운영 WebView로 연다.
- 현재 구조는 Capacitor 루트 위에 로그인·홈을 전체 화면 modal로 올리고 내리는 방식이라 네이티브 → WebView → 네이티브 왕복 시 화면 상태와 내비게이션 소유권이 섞일 위험이 있다.
- Push Notifications·Associated Domains·Sign in with Apple entitlement를 프로젝트 타겟에 연결했다. Debug는 APNs development, Release는 production 값을 사용한다.
- `PrivacyInfo.xcprivacy`를 앱 Resources에 포함하고 이름·이메일·사용자/기기 ID·가계부·사용자 콘텐츠·자녀 계정 정보·제품 상호작용을 실제 수집 목적에 맞춰 선언했다.
- 카메라·사진·마이크·현재 위치·ATT와 background fetch 과다 선언을 제거하고 현재 구현된 캘린더·Face ID·remote notification만 유지했다.
- 현재 Xcode 계정은 Personal Development Team이다. 해당 팀은 Sign in with Apple·Associated Domains·Push Notifications가 포함된 프로비저닝 프로파일을 만들 수 없어 실제 iPhone 서명 빌드가 차단된다.

## 2. 구현 원칙

1. **기능 계약은 공통, 화면은 Apple 네이티브**
   - Supabase·공통 API·RLS·capability·오류 코드는 Android/Web과 동일하게 유지한다.
   - Android Material 3 화면을 그대로 복제하지 않는다. iOS는 SwiftUI, Apple semantic color, SF Symbols, Dynamic Type와 Human Interface Guidelines를 기준으로 구현한다.
   - 글리움 브랜드 컬러와 정보 구조는 유지하되 iOS 기본 내비게이션·시트·선택·권한 UX를 따른다.

2. **단일 네이티브 앱 셸**
   - `TabView`와 탭별 `NavigationStack`, 중앙 Route enum/coordinator를 앱의 유일한 내비게이션 소유자로 둔다.
   - 홈·일정·공간·가계부·전체 메뉴는 같은 네이티브 셸 안에서 상태를 유지한다.
   - 기존 UIKit 홈·일정 등록은 즉시 폐기하지 않고 SwiftUI 셸에서 단계적으로 교체한다.
   - WebView는 법적 원문·외부 인증 fallback처럼 명확히 정의된 보조 화면에만 허용한다.

3. **시작 선조회와 캐시**
   - Android에서 확정한 방식대로 스플래시 동안 session context·홈·공간·일정·가계부·알림을 병렬 선조회한다.
   - 탭 이동마다 전체 재호출하지 않고 프로세스 캐시, pull-to-refresh, 쓰기 작업 후 선택 무효화를 적용한다.

## 3. 현재 코드 상태

| 구간 | 현재 상태 | 판정 |
|---|---|---|
| 앱 셸·세션 | `SessionManager`, `NativeSessionPlugin`, `AppBridgeViewController` 존재 | 기반 재사용 |
| Google 로그인 | `LoginViewController`가 `SFSafariViewController`로 Supabase OAuth 호출 | 네이티브 SDK 아님, 교체 필요 |
| 네이티브 홈 | `NativeHomeViewController` + `/api/native/home-summary` | 1차 구현, 실제 계정 회귀 필요 |
| 일정 등록 | `NativeScheduleCreateViewController` + `/api/native/schedules` | 빠른 등록만 존재 |
| 일정·공간·가계부·전체 메뉴 | 네이티브 홈 하단에서 WebView 경로로 이동 | 네이티브 전환 필요 |
| 생체인증 | `NativeBiometricPlugin`의 LocalAuthentication 브리지 존재 | 설정 화면·잠금 정책 마감 필요 |
| 기기 캘린더 | `NativeCalendarPlugin`의 EventKit 브리지 존재 | 캘린더 선택·가져오기·중복 UX 필요 |
| 푸시 | Firebase Messaging 의존성과 APNs 등록 코드 일부 존재 | capability·실기기 토큰·딥링크 회귀 필요 |
| Universal Links | 라우팅 코드는 있으나 Associated Domains entitlement가 주석 상태 | 운영 준비 전 미완료 |
| 가족·자녀 | 네이티브 구현 없음 | Android 확정 흐름 기준 신규 구현 |
| 개인정보 선언 | `PrivacyInfo.xcprivacy` 존재 | SDK와 실제 수집 항목 재감사 필요 |

## 4. 재개 전 외부 준비

- 유료 Apple Developer Program 계정과 운영 Team ID 확정
- Bundle ID `com.gleaum.app`의 App ID, 배포 인증서, 프로비저닝 프로파일 준비
- Push Notifications·Associated Domains·Sign in with Apple capability 활성화
- APNs Auth Key를 Firebase에 연결하고 실기기 APNs/FCM 토큰 발급 확인
- `gleaum.com`과 `www.gleaum.com`의 AASA 파일에 운영 Team ID + Bundle ID 반영
- App Store Connect 앱, 테스트 계정, 개인정보·연령등급·심사 메모 준비

## 5. 필수 선행 수정

### P0 — 출시를 막는 항목

1. **인증 체계**
   - Google 소셜 로그인을 유지하면 App Review Guideline 4.8에 맞는 동등 로그인 수단을 제공해야 한다.
   - 기본 방향은 `Sign in with Apple` 추가 + Google 로그인 네이티브 SDK 전환이다.
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

### Phase 0 — 빌드·서명·권한 기준선

- [x] 서명 제외 generic iPhoneOS Debug 빌드
- [x] CoreSimulator/Xcode 버전 불일치 해소
- [ ] 유료 Apple Developer Team·배포 인증서·프로비저닝 프로파일 확보
- [x] Sign in with Apple·Push Notifications·Associated Domains capability 소스 구성
- [x] 불필요한 `Info.plist` 권한 문구 제거
- [x] `PrivacyInfo.xcprivacy`와 실제 앱 수집 항목 대조·타겟 포함
- [ ] 서명 Debug 빌드의 실제 iPhone 설치·콜드 스타트 확인

현재 차단 해제 조건은 Xcode의 Apple ID를 유료 Apple Developer Program Team에 연결하고, `com.gleaum.app` App ID에 Sign in with Apple·Push Notifications·Associated Domains를 활성화하는 것이다. 이후 Automatic Signing으로 개발 프로파일을 생성하고 실제 iPhone에서 서명 빌드·APNs entitlement를 확인한다.

### Phase 1 — 인증·세션·앱 셸

- [ ] SwiftUI 루트 앱 셸, 5개 탭, 탭별 `NavigationStack` 구성
- [ ] 세션 복원·만료·로그아웃·재로그인 상태 머신 통합
- [ ] Sign in with Apple 구현
- [ ] Google Sign-In 네이티브 SDK 구현과 계정 선택 보장
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

### Phase 4 — iPhone/iPad 품질·출시

- [ ] 소형 iPhone·표준·Pro Max·iPad·Split View 레이아웃
- [ ] 라이트·다크·시스템 모드와 상태바/홈 인디케이터 정합성
- [ ] Dynamic Type·VoiceOver·Reduce Motion·키보드 탐색
- [ ] 오프라인·부분 API 실패·세션 만료·중복 탭 방지
- [ ] TestFlight 내부 테스트와 Crashlytics 회귀
- [ ] App Store 개인정보·연령등급·심사 계정·심사 메모·스크린샷

## 7. 범위 분리

### iOS 핵심 완료 전 보류

- macOS Catalyst 전환
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
- App Store Connect 개인정보 답변, Privacy Manifest, 실제 권한 요청이 일치한다.

## 9. 공식 기준

- Apple App Review Guidelines 4.8: <https://developer.apple.com/app-store/review/guidelines/#login-services>
- Associated Domains: <https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.associated-domains>
- Universal Links: <https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app>
- APNs 등록: <https://developer.apple.com/documentation/usernotifications/registering-your-app-with-apns>
- Privacy Manifest: <https://developer.apple.com/documentation/bundleresources/adding-a-privacy-manifest-to-your-app-or-third-party-sdk>
