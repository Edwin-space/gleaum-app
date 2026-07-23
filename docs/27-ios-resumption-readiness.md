# iOS 개발 재개 준비 보고서

> 기준일: 2026-07-23  
> 목적: Android 기능 마감 후 iOS 개발을 재개할 때 기존 구현을 과대평가하거나 Android/Web 작업을 중복하지 않도록 현재 상태와 재개 순서를 고정한다.

## 1. 결론

iOS는 **로그인·세션 브리지, 네이티브 홈, 일정 빠른 등록의 1차 기반만 존재**한다. 전체 네이티브 앱으로 볼 수 없으며 일정 목록, 공간, 가계부, 알림, 전체 메뉴, 가족·자녀 연결은 대부분 WebView 또는 미구현 상태다.

재개 시 기존 Swift 코드를 폐기하지 않는다. Android에서 확정한 공통 API·권한·오류 계약을 유지하면서 iOS 화면과 OS 기능만 SwiftUI/UIKit으로 구현한다.

## 2. 현재 코드 상태

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

## 3. 재개 전 외부 준비

- 유료 Apple Developer Program 계정과 운영 Team ID 확정
- Bundle ID `com.gleaum.app`의 App ID, 배포 인증서, 프로비저닝 프로파일 준비
- Push Notifications·Associated Domains·Sign in with Apple capability 활성화
- APNs Auth Key를 Firebase에 연결하고 실기기 APNs/FCM 토큰 발급 확인
- `gleaum.com`과 `www.gleaum.com`의 AASA 파일에 운영 Team ID + Bundle ID 반영
- App Store Connect 앱, 테스트 계정, 개인정보·연령등급·심사 메모 준비

## 4. 필수 선행 수정

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

## 5. 권장 구현 순서

1. Xcode 서명·capability·최소 권한·Privacy Manifest 정리
2. Sign in with Apple + 네이티브 Google 로그인 + 세션 회귀
3. 단일 네이티브 탭 셸과 딥링크 라우터 확정
4. Android 공통 API를 사용한 일정·공간·가계부·알림·전체 메뉴 이식
5. 가족·자녀 연결 이식
6. EventKit·생체인증·APNs 운영 마감
7. iPhone/iPad 라이트·다크·Dynamic Type·VoiceOver 회귀
8. TestFlight 내부 테스트 → App Store 심사

## 6. 완료 기준

- 핵심 화면이 WebView로 되돌아가지 않고 네이티브 탭 상태를 유지한다.
- Android/Web과 같은 계정으로 일정·공간·가계부·알림 데이터가 동일하게 보인다.
- 개인/공간 데이터 경계와 역할별 쓰기 권한이 동일하다.
- Google·Apple·이메일 로그인과 로그아웃·재로그인·세션 만료가 실기기에서 통과한다.
- 자녀 계정은 capability에 따라 메뉴·광고·가계부·공간 관리가 제한된다.
- Universal Link, APNs 알림, 캘린더, 생체인증을 실제 iPhone에서 검증한다.
- App Store Connect 개인정보 답변, Privacy Manifest, 실제 권한 요청이 일치한다.

## 7. 공식 기준

- Apple App Review Guidelines 4.8: <https://developer.apple.com/app-store/review/guidelines/#login-services>
- Associated Domains: <https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.associated-domains>
- Universal Links: <https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app>
- APNs 등록: <https://developer.apple.com/documentation/usernotifications/registering-your-app-with-apns>
- Privacy Manifest: <https://developer.apple.com/documentation/bundleresources/adding-a-privacy-manifest-to-your-app-or-third-party-sdk>

