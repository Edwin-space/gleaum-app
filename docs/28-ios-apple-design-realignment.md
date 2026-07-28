# iOS Apple 디자인·시작 아키텍처 재정렬

> 기준일: 2026-07-28
> 대상: `IOS-009`, `IOS-010`, `IOS-011`  
> 결론: 인증·세션 기반은 보존하고 현재 UIKit 표현 계층과 Capacitor 중심 화면 소유권은 교체한다.

## 0. 2026-07-28 구현 상태

- SwiftUI `IOSAppRootView`가 실제 window root를 소유하도록 전환했다.
- Launch Screen은 브랜드 배경·로고로 단순화하고 앱 내부 `BrandTransitionView`에서만 절제된 전환을 사용한다. 두 화면과 네이티브 로그인은 `img/gleaum_bi.svg`에서 만든 vector asset을 사용하며 수동 텍스트 BI를 금지한다.
- `StartupSnapshotStore`가 account/home/spaces/schedules/notifications와 capability 조건부 budget을 병렬 선조회하고 5분 프로세스 캐시·부분 실패를 관리한다.
- 시스템 `TabView` 5탭과 snapshot 기반 SwiftUI 홈 1차를 구현했다.
- Capacitor는 앱 시작 때 WebView를 만들지 않으며, 네이티브 전환 전 화면에서만 지연 생성되는 폴백으로 축소했다.
- 현재 제품 우선순위는 iPhone이다. iPad·Split View와 Android 태블릿·폴더블은 휴대전화 기능 마감 뒤 재개한다.
- 네이티브 로그인은 Apple·Google·기존 이메일 로그인만 제공하며 별도 회원가입 UI를 두지 않는다. Apple 공식 시스템 버튼과 Google 공식 G 자산/버튼 규격, Dynamic Type, 공식 BI를 적용했다. 정적 Launch Screen·브랜드 전환·로그인의 로고/BI 규격과 중앙 축을 통일하고 인증 액션은 하단 엄지 접근 영역에 배치했다. 신규 소셜 사용자는 인증 후 네이티브 온보딩으로 분기한다.
- 일정 탭은 WebView 폴백을 제거했다. 시스템 `List`·검색·유형/기간 필터, 상세, `Form` 기반 생성/수정, 상태 변경, 삭제 확인과 시작 snapshot 캐시를 연결했다.
- 공간 탭은 WebView 폴백을 제거했다. 시스템 `List`·toolbar·menu·sheet·confirmation dialog로 개인/공유/가족 공간 전환, 다가오는 일정, 소식, 멤버, 초대, 공간 생성·참여·설정을 연결했다. 개인 공간은 커뮤니티·초대·관리 액션을 노출하지 않으며 공유 공간 역할과 가족 관계 표시값을 분리한다.
- 가계부 탭은 WebView 폴백을 제거했다. 개인 원장 API만 사용해 월간 흐름·검색·카테고리·반복 예정·최근 내역과 `Form` 기반 수입/지출 CRUD·상태 변경을 연결했다. 가계부 제한 계정은 탭을 숨기고 공유 공간 원장은 선택할 수 없다.
- 알림은 홈 toolbar 배지에서 여는 SwiftUI 알림 센터로 전환했다. 시스템 목록·필터·개별/전체 읽음, 일정 상세·공간 이동, 서버 수신 설정, iOS 권한 상태·설정 앱 이동과 APNs/FCM 토큰 등록을 연결했다. 푸시 탭은 중앙 네이티브 라우터가 목적지를 판정하고 핵심 화면을 WebView 없이 연다.
- 전체 탭은 Apple inset grouped `List`와 `Form`으로 전환했다. 프로필 표시 방식, 알림, 시스템/라이트/다크, Face ID/Touch ID 앱 잠금, 비밀번호, 탈퇴·복원, 로그아웃을 실제 API와 로컬 보안 상태에 연결했다. 법적 원문만 전용 인앱 `WKWebView`를 유지하며 외부 브라우저 이탈은 없다.
- 가족 공간은 일반 가족과 자녀 초대를 먼저 구분한다. 자녀는 목록·등록·보호자 8자리 OTP·필수 동의·일회성 초대·claim·최종 승인/거절을 SwiftUI 시스템 화면에서 처리하며 로그인 전 초대 링크도 네이티브 인증 뒤 복원한다. 위치 수집은 포함하지 않는다.

## 1. 감사 결론

사용자의 문제 제기는 맞다. 현재 구현은 Apple 네이티브 앱의 완성 방향이 아니라 **Capacitor WebView를 루트로 유지한 채 UIKit 화면을 modal로 덧씌운 과도기 구조**다.

### 확인된 P0 문제

1. SwiftUI 화면이 없고 로그인·홈·일정 등록이 수동 UIKit이다.
2. `/home` 외 일정·공간·가계부·전체 메뉴는 WebView로 이동한다.
3. 앱의 실제 root는 Capacitor이며 네이티브 홈은 full-screen modal이다.
4. 홈 하단 내비게이션은 시스템 `TabView`가 아닌 수동 floating pill이다.
5. 시작 시 세션만 판정하고 홈·공간·일정·가계부·알림을 선조회하지 않는다.
6. 공용 제품 데이터 캐시가 없어 홈이 다시 표시될 때 요약을 재요청한다.
7. Launch Screen은 문구와 로고가 많은 정적 마케팅 화면이고, 이후에도 별도 정적 shield가 이어진다.

### 확인된 P1 문제

1. 카드·큰 corner radius·고정 point font 사용이 많아 Apple의 정보 계층과 Dynamic Type을 충분히 활용하지 못한다.
2. iPad에서 휴대전화 폭 로그인 카드를 중앙에 두어 넓은 공간을 낭비한다.
3. SF Symbols, system list/form/sheet, semantic background, sidebar/split navigation 사용이 부족하다.
4. 테마 토큰은 일부 도입됐지만 UIKit 수동 값이 많아 다크 모드·대비·접근성 검증 비용이 크다.

## 2. 보존과 폐기 경계

### 보존

- `SessionManager` Keychain 저장·refresh 정책
- `AppSessionStateCoordinator`의 인증 상태 판정 계약
- Apple·Google·이메일 인증 클라이언트와 Supabase 세션 정규화
- Firebase/APNs/Universal Link 서비스 코드
- 공통 API·RLS·capability·오류 코드
- EventKit·생체인증 플러그인의 기능 계약

### 확장 중단 후 교체

- Capacitor root 위 full-screen modal 홈
- `NativeHomeViewController`의 custom floating tab
- 화면마다 반복되는 UIKit 카드·버튼·고정 font 구성
- `LaunchScreen.storyboard`의 마케팅 문구
- 정적 `launchShield`를 로딩 화면처럼 사용하는 흐름
- 핵심 탭의 WebView 라우팅

## 3. 목표 시작 흐름

```text
System Launch Screen
  → SwiftUI BrandTransitionView
      ├─ 세션/계정 판정
      ├─ 홈 요약
      ├─ 공간
      ├─ 일정
      ├─ 알림
      └─ capability 확인 후 가계부
  → SwiftUI App Root
      ├─ signedOut
      ├─ authenticated
      ├─ offlineCached
      └─ recoverableError
```

### Launch Screen

- 첫 앱 화면과 같은 단순 배경·고정 로고 정도만 사용한다.
- 마케팅 문구, 진행 상태, 임의 대기 시간은 넣지 않는다.
- Launch Screen 자체에 애니메이션을 넣지 않는다.

### 앱 내부 브랜드 전환

- SwiftUI `BrandTransitionView`에서만 0.8~1.2초의 절제된 로고 opacity/scale/layer 전환을 사용한다.
- Reduce Motion에서는 crossfade만 사용한다.
- 데이터 선조회와 동시에 실행하며 애니메이션 때문에 3초를 강제로 기다리지 않는다.
- 1.5~2초 안에 선조회가 끝나지 않으면 셸로 이동하고 각 화면은 skeleton 또는 캐시 데이터를 표시한다.

## 4. 데이터 선조회·캐시 계약

`StartupSnapshotStore`를 Swift Concurrency 기반 공유 store로 구현한다.

1. 콜드 스타트에서 세션·계정 상태를 먼저 판정한다.
2. `async let` 또는 task group으로 홈·공간·일정·알림을 병렬 조회한다.
3. 계정 capability가 가계부를 허용할 때만 가계부를 조회한다.
4. 성공한 도메인은 부분 실패와 무관하게 캐시에 저장한다.
5. 탭 이동은 캐시를 우선 표시하고 매번 전체 재호출하지 않는다.
6. 사용자의 pull-to-refresh와 foreground TTL 만료에서만 재검증한다.
7. 생성·수정·삭제 후 관련 도메인만 선택 무효화하고 응답 데이터는 즉시 캐시에 반영한다.
8. 오프라인에서는 마지막 snapshot을 표시하고 오래된 데이터임을 알린다.

Android의 `NativeStartupPrefetcher`와 `NativeAppDataCache`는 **동작 계약 참고 대상**이며 Kotlin 구조를 그대로 복제하지 않는다.

## 5. Apple 네이티브 셸

### iPhone

- `TabView`: 홈, 일정, 공간, 가계부, 전체
- 각 탭은 독립 `NavigationStack`과 navigation path를 소유한다.
- 시스템 tab bar와 SF Symbols를 사용하고 custom floating pill을 사용하지 않는다.
- 생성·필터·선택은 toolbar, sheet, menu, confirmation dialog의 플랫폼 패턴을 따른다.

### iPad

- **현재 후순위**: iPhone 핵심 기능 네이티브화와 휴대전화 QA를 마친 뒤 재개한다.
- 지원 OS와 정보 구조에 따라 `NavigationSplitView` 또는 sidebar-adaptable tab 구성을 사용한다.
- 목록-상세 화면은 2열을 기본으로 하고 로그인은 고정 휴대전화 카드가 아닌 화면 폭에 맞는 안내/폼 구성을 사용한다.
- Split View와 키보드 사용을 완료 조건에 포함한다.

## 6. 시각 디자인 기준

1. Android Material 3의 기능·정보 구조는 공유하지만 외형을 복제하지 않는다.
2. 배경·텍스트·separator는 Apple semantic color를 우선한다.
3. 브랜드 Green/Teal/Blue는 선택 상태·주요 액션·강조에 제한한다.
4. SF Symbols를 기본 아이콘으로 사용하고 브랜드 로고·BI만 전용 vector asset을 사용한다. `gleaum`을 시스템 폰트로 다시 조판하지 않는다.
5. `largeTitle`, `title`, `headline`, `body`, `caption`과 Dynamic Type을 사용한다.
6. 모든 정보를 둥근 카드에 넣지 않는다. `List`, `Form`, `Section`, plain grouping과 여백을 우선한다.
7. 커스텀 blur/gradient/glass는 정보 계층을 해치지 않는 제한된 브랜드 영역에서만 사용한다.
8. 라이트·다크·시스템, increased contrast, Reduce Motion, VoiceOver를 같은 컴포넌트에서 검증한다.

## 7. 구현 순서

### 1단계 — root와 시작 흐름

- [x] SwiftUI `AppRootView`와 앱 상태 enum
- [x] `UIHostingController`를 사용자 화면의 단일 root로 전환
- [x] 단순 Launch Screen + 앱 내부 `BrandTransitionView`
- [x] `StartupSnapshotStore` 병렬 선조회·부분 실패·캐시
- [x] 기존 세션·인증 서비스를 SwiftUI root 상태에 연결

### 2단계 — 시스템 내비게이션

- [x] 시스템 `TabView` 5탭
- [x] 홈·일정·공간·가계부·전체 탭 `NavigationStack`
- [x] 중앙 Route와 푸시 목적지 연결 — 홈·알림·일정 단건·공간·가계부의 네이티브 목적지 판정
- [ ] Universal Link 실기기 검증 — 유료 Team·Associated Domains 활성화 뒤 완료
- [ ] iPad `NavigationSplitView` 적응 — 후순위
- [x] Capacitor modal 홈·custom floating tab을 실제 앱 root에서 제거

### 3단계 — 핵심 화면

- [x] 홈 1차 — snapshot 요약·오늘 일정·가계부 요약·새 일정 sheet·pull-to-refresh
- [x] 신규 사용자 온보딩 1차 — 이름/표시 방식·중심 기능·홈 구성·알림, 프로필 완료 여부 기반 분기
- [x] 일정 목록·상세·생성/수정
- [x] 공간 목록·전환·상세·일정·소식·멤버·초대·설정 1차
- [x] 개인 가계부 — 월간 흐름·검색·카테고리·반복 예정·CRUD·상태·개인 데이터 경계
- [x] 알림 — 목록·필터·읽음·연결 목적지·서버 설정·iOS 권한·FCM 토큰
- [x] 전체 메뉴·프로필·보안·법적 문서 설정 — 법적 원문은 전용 인앱 HTML 컨테이너
- [x] 가족·자녀 계정 연결 — 초대 유형·보호자 OTP/동의·claim·최종 승인/거절, 실계정 회귀만 대기
- [x] 기기 캘린더 — EventKit 전체 접근 권한·쓰기 캘린더 선택·30일 내보내기·선택 가져오기·앱 소유 마커·중복 차단, 실기기 회귀만 대기

### 4단계 — 품질 마감

- [ ] iPhone 소형/표준/대형
- [ ] iPad portrait/landscape/Split View
- [ ] 라이트/다크/시스템 — 일정·공간·가계부·알림·전체 메뉴·가족/자녀 화면별 통과, 소형/대형 iPhone 전체 회귀 대기
- [ ] Dynamic Type/VoiceOver/Reduce Motion — 일정·공간·가계부·알림·전체 메뉴·가족/자녀 Dynamic Type/VoiceOver 구조 통과, 실음성·Reduce Motion 전체 회귀 대기
- [ ] 오프라인/부분 실패/세션 갱신/딥링크 회귀
- [ ] EventKit 실기기 회귀 — iCloud/Google 캘린더 전체 접근 허용·거절, 글리움 일정 생성/수정/삭제, 기기 일정 선택 가져오기·중복 차단

## 8. 다음 작업의 금지 사항

- UIKit 카드 화면을 신규 핵심 기능에 추가하지 않는다.
- Android Compose 화면을 iOS에 픽셀 단위로 복제하지 않는다.
- 핵심 탭을 WebView fallback으로 완료 처리하지 않는다.
- 시작 애니메이션을 데이터 로딩 완료를 숨기는 강제 대기로 사용하지 않는다.
- root·modal·WebView가 동시에 내비게이션 상태를 소유하게 두지 않는다.

## 9. 완료 판정

- 앱 시작 후 WebView 또는 UIKit modal이 번쩍이지 않는다.
- 브랜드 전환 중 선조회가 동작하고 홈 첫 표시가 캐시 또는 snapshot 기반이다.
- 5개 탭이 시스템 내비게이션에서 상태를 유지한다.
- 핵심 탭 사이 이동 시 같은 데이터를 매번 전체 재요청하지 않는다.
- 신규 소셜 인증 사용자는 별도 회원가입 화면이나 WebView 없이 네이티브 온보딩을 완료하고 개인 공간을 확보한다.
- iPhone/iPad에서 Apple 플랫폼 패턴과 접근성 기준을 충족한다.
- 법적 문서·명시된 외부 인증 fallback을 제외한 핵심 사용자 흐름이 WebView로 전환되지 않는다.
