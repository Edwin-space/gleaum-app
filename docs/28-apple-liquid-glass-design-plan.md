# Apple 네이티브·Liquid Glass 전환 계획

> 기준일: 2026-07-24
> 적용 플랫폼: iPhone, iPad, macOS
> 구현 순서: Android 기준 동작 확정 → iPhone 완성 → iPad → macOS → 유료 Apple Developer Program 가입 → 실제 기기·배포 capability·App Store 검증
> 상태·우선순위의 단일 기준: `docs/24-project-work-tracker.md`

## 1. 결정

Apple 앱의 기존 UIKit 화면 디자인은 유지·확장하지 않는다. 기존 코드에서 재사용하는 것은 세션 저장 형식, Native API 모델·클라이언트, Firebase·APNs·EventKit·LocalAuthentication 연결 기반과 공통 데이터 계약이다. 고정 색상, 수동 하단 바, 커스텀 카드·버튼, modal 위주의 화면 소유권은 SwiftUI와 Apple Human Interface Guidelines 기반으로 교체한다.

Apple의 공식 디자인 언어는 **Liquid Glass**다. 다만 Liquid Glass는 앱 전체의 카드 배경이 아니라 탭 바, 내비게이션 바, toolbar, floating control처럼 콘텐츠 위에 놓이는 **기능·탐색 계층**에 사용한다. 목록, 폼, 카드, 본문 배경은 SwiftUI 표준 컴포넌트와 semantic color/material을 사용한다.

Android에서 확정한 기능·권한·오류 의미를 Apple에 이식하되 Android Material 3 화면 모양은 복제하지 않는다.

iPad는 iPhone 화면을 비율만 키우지 않는다. 같은 기능과 ViewModel을 공유하되 sidebar, list-detail, inspector와 다열 대시보드를 사용하는 별도 적응형 배치를 설계한다. macOS는 `Designed for iPad`를 최종 제품으로 삼지 않고 SwiftUI 공통 모듈을 공유하는 네이티브 macOS 앱을 목표로 한다.

구현 순서는 화면 간 동시 진행이 아니라 **iPhone 기능·로컬 QA 완료 → iPad 적응형 배치 완료 → macOS 네이티브 UX**다. iPhone 단계에서는 iPad/macOS shell이나 화면을 함께 만들지 않고, 추후 재사용할 수 있도록 상태·API·디자인 의미만 플랫폼 비종속적으로 유지한다.

유료 Apple Developer Program은 Apple 코드·디자인·로컬 검증을 먼저 완료한 뒤 획득한다. 가입 전에는 서명 capability 때문에 막히는 실제 Apple 로그인, APNs, Universal Links, TestFlight/App Store 검증만 후순위로 두며, 이를 이유로 SwiftUI 화면·세션·공통 API·iPad/macOS 레이아웃 구현을 멈추지 않는다.

## 2. 현재 Apple 코드 판정

| 영역 | 현재 상태 | 전환 판정 |
|---|---|---|
| 앱 루트 | Capacitor WebView 위에 로그인·홈을 full-screen modal로 표시 | SwiftUI 단일 루트 상태 머신으로 교체 |
| 로그인 | UIKit `LoginViewController` + Safari OAuth | Sign in with Apple, 기존 Google browser OAuth, 이메일 인증을 SwiftUI 상태 머신으로 통합 |
| 세션 | 만료 60초 전부터 `nil`, refresh token 사용 안 함 | Android와 동일한 refresh 우선·일시 실패 보존 상태 머신 구현 |
| 홈 | UIKit 고정 다크 컬러·커스텀 하단 바 | SwiftUI 홈으로 교체 |
| 일정 등록 | UIKit 커스텀 폼 | `Form`, `DatePicker`, `Picker`, native sheet 기반 SwiftUI 화면으로 교체 |
| 핵심 기능 | 일정·공간·가계부·알림·전체 메뉴 대부분 WebView | 5탭 네이티브 셸 안에서 신규 구현 |
| 생체인증 | LocalAuthentication 브리지 존재 | 앱 시작 Face ID/Touch ID·기기 암호 gate로 연결 |
| 캘린더 | EventKit 브리지 존재 | 권한 설명·캘린더 선택·가져오기·중복 UX 구현 |
| Firebase·푸시 | Firebase Messaging SPM 의존성, `GoogleService-Info.plist`, APNs 등록·FCM token 코드 존재 | 외부 준비에서 제외. 서버 등록·딥링크 UX 구현 후 유료 계정 단계에서 실제 토큰만 검증 |
| Google 로그인 | `SFSafariViewController`가 Supabase Google OAuth를 호출하고 `gleaum://auth/callback`을 처리 | 동작 기반 존재. 외부 준비에서 제외하고 SwiftUI 인증 상태 머신에 연결. 네이티브 SDK 전환은 별도 UX 개선 |
| Apple 로그인 | entitlement만 존재하고 `AuthenticationServices` 실행 코드 없음 | UI·상태 계약은 로컬 구현, capability·실계정 검증은 유료 계정 단계 |
| Universal Links | Associated Domains entitlement·AASA·중앙 URL 처리 기반 존재 | 외부 준비에서 제외. 운영 Team ID·실기기 연결 검증만 유료 계정 단계 |
| iPad | universal device family와 회전 설정은 존재하지만 iPad 전용 정보 배치 없음 | regular width용 sidebar·list-detail·inspector 설계 |
| macOS | `targetEnvironment(macCatalyst)` 조건부 window 크기 코드만 있고 `SUPPORTS_MACCATALYST=NO` | 현재 지원되지 않음. 공통 SwiftUI 모듈을 공유하는 네이티브 macOS 타겟 신규 구성 |
| 앱 아이콘 | 단일 AppIcon 자산 | Icon Composer 기반 layered/light/dark/tinted 아이콘 준비 |

기존 `NativeHomeViewController`, `NativeScheduleCreateViewController`, `LoginViewController`는 기능 요구사항 참고 자료로만 사용한다. 새 화면의 디자인 기준이나 공통 UI 라이브러리로 사용하지 않는다.

## 3. 지원 버전 전략

현재 프로젝트의 최소 지원 버전은 iOS 15지만 `NavigationStack`은 iOS 16부터 사용할 수 있고 Liquid Glass 전용 API는 최신 OS에서만 제공된다. macOS 지원은 아직 빌드 타겟이 없다.

권장 기준은 다음과 같다.

- 최소 지원 버전: **iOS/iPadOS 17 이상**을 기본안으로 검토
- macOS 최소 지원 버전: **macOS 14 이상**을 기본안으로 검토
- 빌드 기준: 최신 안정 Xcode와 SDK
- iOS/iPadOS/macOS 26 이상: 표준 SwiftUI 컴포넌트의 Liquid Glass 외형과 필요한 최소 custom glass 적용
- iOS/iPadOS 17~25·macOS 14~15: 같은 정보 구조를 시스템 표준 material과 control로 자연스럽게 fallback
- iOS 26 전용 외형 때문에 최소 지원 버전을 26으로 올리지 않음
- 실제 구현 착수 전에 기존 iOS 사용자가 없다는 전제와 지원 기기 범위를 확인한 뒤 deployment target 확정

핵심은 OS 버전별 화면을 두 벌 만드는 것이 아니다. 표준 `TabView`, `NavigationStack`, toolbar, sheet, alert를 우선 사용하면 최신 OS에서는 새 외형을 자동 적용하고 이전 OS에서는 해당 OS에 맞는 표준 외형을 유지한다.

## 4. Apple 디자인 시스템

### 4.1 원칙

1. **시스템 컴포넌트 우선**
   - `TabView`, `NavigationStack`, `NavigationSplitView`, `List`, `Form`, `ToolbarItem`, `Menu`, `Sheet`, `Alert`, `ConfirmationDialog`, `Searchable`, `ContentUnavailableView`를 우선한다.
   - 커스텀 탭 바, 내비게이션 바, 스위치, segmented control, date picker를 새로 만들지 않는다.

2. **Liquid Glass는 탐색·기능 계층에 제한**
   - 탭 바, toolbar, floating primary action, transient control에만 사용한다.
   - 콘텐츠 카드마다 glass를 적용하지 않는다.
   - `regular`를 기본으로 하고 `clear`는 사진·영상처럼 충분히 풍부한 배경 위에서만 사용한다.
   - glass 안에 glass를 중첩하거나 모든 control에 브랜드 tint를 넣지 않는다.

3. **색상은 semantic token**
   - 배경: `Color(.systemBackground)`, `Color(.secondarySystemBackground)`
   - 텍스트: `.primary`, `.secondary`
   - 구분선: `Color(.separator)`
   - 상태: 시스템 semantic color
   - 브랜드 Blue/Teal/Green은 primary action, 선택 상태, 일정 유형처럼 의미가 있는 위치에만 제한한다.
   - 웹·Android의 고정 Hex를 SwiftUI에 그대로 복사하지 않는다.

4. **타이포그래피**
   - 기본은 Apple 시스템 폰트와 Dynamic Type이다.
   - `.largeTitle`, `.title2`, `.headline`, `.body`, `.caption` 등 semantic style을 사용한다.
   - `gleaum` wordmark 같은 브랜드 자산만 예외로 별도 typography/image를 허용한다.

5. **아이콘**
   - 기능 아이콘은 SF Symbols 이름으로 관리한다.
   - Android Vector/Material icon을 복사하거나 SF Symbol codepoint를 직접 저장하지 않는다.
   - 앱 아이콘은 Icon Composer의 layer·depth·light/dark/tinted 변형으로 별도 제작한다.

6. **모션과 접근성**
   - system transition과 symbol effect를 우선한다.
   - Reduce Motion에서는 브랜드 시작 모션을 축약한다.
   - Reduce Transparency·Increase Contrast에서 정보 손실이 없어야 한다.
   - VoiceOver label/value/hint, Dynamic Type, Button Shapes, 44pt 터치 영역을 완료 조건에 포함한다.

7. **크기별 정보 구조**
   - iPhone compact width는 5개 탭과 push navigation을 사용한다.
   - iPad compact window는 iPhone 구조로 자연스럽게 축소한다.
   - iPad regular width는 `NavigationSplitView`와 sidebar/list-detail을 사용하고 빈 여백을 큰 카드로 억지 확대하지 않는다.
   - macOS는 sidebar·toolbar·menu command·keyboard shortcut·context menu·resizable window를 기본 상호작용으로 사용한다.
   - iPad와 macOS는 같은 화면 스크린샷을 늘리는 것이 아니라 공통 데이터 상태를 각 장치의 작업 흐름에 맞게 재배치한다.

### 4.2 Figma ↔ SwiftUI 계약

Apple 디자인 파일을 만들 경우 Figma 변수는 SwiftUI 의미 토큰과 1:1로 유지한다.

| Figma 의미 변수 | SwiftUI |
|---|---|
| `background/primary` | `Color(.systemBackground)` |
| `background/secondary` | `Color(.secondarySystemBackground)` |
| `label/primary` | `.primary` |
| `label/secondary` | `.secondary` |
| `separator/default` | `Color(.separator)` |
| `tint/brand` | 앱 `tint`의 Brand Blue |

SF Symbols는 이름으로 왕복하고, Figma의 절대 좌표·고정 픽셀 프레임을 SwiftUI에 그대로 옮기지 않는다. 실제 SwiftUI 구조는 Apple 패턴인 `TabView`, `NavigationStack`, `List`, `Form`을 기준으로 해석한다.

### 4.3 iPhone·iPad·macOS 레이아웃 계약

| 기능 | iPhone | iPad regular width | macOS |
|---|---|---|---|
| 전역 탐색 | 하단 5탭 | 접을 수 있는 sidebar + content | sidebar + toolbar + menu commands |
| 홈 | 단일 세로 피드 | 요약·일정·가계부 2~3열 대시보드 | resizable dashboard, 위젯별 최소/최대 폭 |
| 일정 | 목록 → 상세 push | sidebar/filter + 목록 + 상세 2~3열 | 목록·상세·inspector, 새 창/키보드 단축키 |
| 공간 | 공간 선택 → 세부 탭 | 공간 sidebar + 피드/일정/멤버 detail | 공간 sidebar + detail + 선택 항목 inspector |
| 가계부 | 월 요약 → 거래 목록 | 요약 차트 + 거래 목록 + 편집 pane | 넓은 표/목록, column 정렬, inspector 편집 |
| 알림·전체 | 목록·설정 push | popover 또는 detail column | toolbar, Settings scene, menu command |

iPad는 Stage Manager와 Split View에서 창 폭이 계속 변하므로 기기 모델이 아니라 실제 horizontal size class와 container width로 분기한다. macOS는 최소 창 크기만 정하고 사용자가 창을 자유롭게 늘리고 줄일 수 있어야 한다.

### 4.4 코드 구조 제안

현재 iOS 타겟이 UIKit·Capacitor에 강하게 연결되어 있으므로 즉시 단일 multiplatform target으로 바꾸지 않는다. 먼저 공통 SwiftUI 코드를 로컬 Swift Package로 분리하고 iPhone/iPad 타겟을 교체한 뒤, 같은 패키지를 사용하는 네이티브 macOS 타겟을 추가한다.

```text
ios/App/
├── Packages/
│   ├── GleaumCore/          # API, models, session, cache, route
│   ├── GleaumDesignSystem/  # semantic token, symbols, shared components
│   └── GleaumFeatures/      # shared ViewModel + adaptive SwiftUI feature views
├── App-iOS/
│   ├── GleaumMobileApp.swift
│   ├── PhoneShell/
│   ├── PadShell/
│   └── Services/            # UIKit/LocalAuthentication/EventKit/APNs adapters
├── App-macOS/
│   ├── GleaumMacApp.swift
│   ├── MacShell/
│   ├── Commands/
│   └── Services/            # AppKit/macOS notification·calendar adapters
└── SupportWeb/
    └── WebSupportView.swift
```

`SupportWeb`은 법적 원문, 외부 인증 fallback, 앱 미설치/구버전 링크처럼 정책상 유지되는 Web 지원 표면만 담당한다. 홈·일정·공간·가계부·알림·전체 메뉴를 WebView로 되돌리는 fallback은 최종 Apple 완료 상태에서 허용하지 않는다.

## 5. Android 완료 사항의 Apple 이식 체크리스트

### 5.1 앱 시작·세션·인증

- [ ] 정적 Launch Screen → SwiftUI 브랜드 모션 연결
- [x] access token 만료 시 refresh token 우선 갱신
- [x] 4xx refresh 거부만 로그아웃, 네트워크·5xx는 세션 보존·재시도
- [x] 앱 잠금 사용 시 Face ID/Touch ID·기기 암호 gate
- [x] 인증 직후 중복 생체인증 방지 유예
- [ ] Sign in with Apple
- [ ] 기존 Google browser OAuth 계정 선택·취소·복귀
- [ ] 이메일 로그인·가입·필수 약관
- [ ] 로그아웃·회원탈퇴·재로그인 상태 정리

완료 근거(2026-07-24): `SessionManager`에 동시 요청을 합치는 refresh gate, 회전 refresh token 저장, 일시 장애 세션 보존, 늦게 도착한 refresh 응답의 로그아웃 세션 부활 방지를 구현했다. `AppDelegate`는 앱 시작·복귀에서 유효/갱신 필요/일시 실패/무효 상태를 분기하고 SwiftUI 재시도 화면을 표시한다. `NativeAPIClient`는 만료 전 자동 갱신과 API 401 후 단 한 번의 강제 refresh·재요청을 수행한다. 순수 Swift 6 시나리오 13/13, iPhone 17 Pro simulator light/dark/최대 접근성 글꼴, simulator Debug 및 generic iPhone arm64 Debug 무서명 build를 통과했다.

### 5.2 앱 셸·캐시

- [ ] iPhone 5탭: 홈·일정·공간·가계부·전체
- [ ] 탭별 독립 `NavigationStack`
- [ ] iPad의 sidebar/split-view 적응형 구조
- [ ] 중앙 `AppRoute`가 Universal Link·push·내부 이동을 모두 처리
- [ ] 시작 병렬 선조회
- [ ] 프로세스 캐시와 중복 요청 합치기
- [ ] pull-to-refresh
- [ ] 쓰기 후 관련 캐시만 선택 무효화
- [ ] 오프라인·부분 실패·빈 상태 분리

### 5.3 기능 동등화

- [ ] 홈: 개인/활성 공간 요약, 오늘 일정, 가계부, 제한 계정 상태
- [ ] 일정: 목록·상세·생성·수정·삭제·반복·참여자·재알림
- [ ] 공간: 선택·소식·일정·멤버·설정·가족 전환·안전 삭제
- [ ] 가족 관계: 권한 `role`과 표시 관계 `family_role` 분리
- [ ] 자녀: 등록·8자리 보호자 OTP·필수 동의·초대 공유·claim·승인/거절
- [ ] 가계부: 개인/공간 원장 경계, 수입·지출·반복·월별 요약
- [ ] 알림: 목록·읽음·설정·목적지 이동
- [ ] 전체: 프로필·보안·캘린더·약관·로그아웃·탈퇴
- [ ] capability에 따른 탭·메뉴·광고·쓰기 권한 제한

### 5.4 Apple OS 연동

- [ ] EventKit 선택·내보내기·가져오기·중복 방지
- [ ] APNs/FCM 토큰 등록·갱신·실패 관측
- [ ] Universal Links·AASA
- [ ] 공유는 `ShareLink`/share sheet 사용
- [ ] 앱 설정 이동과 권한 거부 복구
- [ ] foreground/background 복귀와 deep link 중복 처리 방지

### 5.5 iPad 적응형 UX

- [ ] compact/regular width 전환 시 선택 상태와 작성 중 입력 보존
- [ ] sidebar + list + detail 구조와 필요 시 inspector 제공
- [ ] Stage Manager·Split View·외부 키보드·pointer 지원
- [ ] 화면별 content max width와 2~3열 breakpoint 정의
- [ ] portrait/landscape에서 빈 공간·과도한 카드 폭·긴 행 길이 방지
- [ ] drag and drop·context menu는 일정/공간 순서 변경 등 실제 효용이 있는 곳에만 사용

### 5.6 macOS 네이티브 UX

- [ ] 네이티브 macOS SwiftUI 타겟과 shared package 연결
- [ ] resizable window·최소 창 크기·상태 복원
- [ ] sidebar/list/detail/inspector 구조
- [ ] menu commands·keyboard shortcuts·right-click·hover
- [ ] macOS Settings scene와 계정·알림·캘린더 설정
- [ ] 필요 기능의 다중 창 지원
- [ ] iOS 전용 UIKit·Capacitor 의존성이 공통 모듈로 유입되지 않도록 adapter 경계 유지

## 6. 준비 상태와 라이선스 게이트

### 6.1 이미 존재해 외부 준비에서 제외

- Firebase Core/Messaging 의존성과 `GoogleService-Info.plist`
- APNs 등록 성공/실패 처리와 FCM token callback
- `SFSafariViewController` 기반 Supabase Google OAuth와 `gleaum://auth/callback`
- LocalAuthentication, EventKit 브리지
- Associated Domains entitlement와 `public/.well-known/apple-app-site-association`
- Bundle ID `com.gleaum.app`, Privacy Manifest, iPhone/iPad universal device family

`GoogleService-Info.plist`는 Messaging 구성값은 갖고 있지만 Google Sign-In용 `CLIENT_ID`/`REVERSED_CLIENT_ID`는 없다. 현재 browser OAuth를 유지하면 외부 선행 준비가 아니며, 네이티브 Google SDK 전환을 선택할 때만 Google OAuth client와 URL scheme을 구현 작업으로 추가한다.

### 6.2 유료 라이선스 없이 먼저 완료

- SwiftUI DesignSystem·AppState·공통 API/session/cache package
- iPhone 5탭과 iPad 적응형 sidebar/list-detail
- 네이티브 macOS 타겟·sidebar/window/menu/keyboard UX
- Google browser OAuth·이메일 인증을 새 상태 머신에 연결
- Sign in with Apple UI·protocol·mock callback 구현
- APNs/Universal Link routing·token 등록 클라이언트 구현
- EventKit·LocalAuthentication 기능과 시뮬레이터 가능한 회귀
- 모든 feature Preview, 단위 테스트, iPhone/iPad simulator, 로컬 Mac 빌드
- 아이콘·스크린샷·개인정보·심사 문안 초안

### 6.3 모든 로컬 구현 후 유료 Apple Developer Program 획득

| 라이선스 이후 작업 | 완료 조건 |
|---|---|
| 운영 Team·App ID | iOS/macOS bundle과 capability 활성화 |
| Sign in with Apple | Supabase provider·실계정·재로그인 검증 |
| APNs | APNs Auth Key를 Firebase에 연결하고 실제 token·수신·딥링크 검증 |
| Universal Links | 운영 Team ID 기준 AASA와 실제 기기 연결 검증 |
| 실제 기기 서명 | iPhone·iPad 설치, Face ID·캘린더·백그라운드 회귀 |
| 배포 | TestFlight, Mac 배포 방식, App Store Connect·공증·심사 |

## 7. 실행 순서

### Phase A — 기준선과 디자인 시스템

- [ ] deployment target 확정
- [ ] Apple semantic token과 brand tint 정의
- [ ] SwiftUI Preview용 iPhone/iPad/macOS 상태 fixture
- [ ] 앱 아이콘 Icon Composer 초안
- [ ] Launch Screen→브랜드 모션 시제품
- [ ] 기존 UIKit 시각 컴포넌트 신규 확장 금지 선언
- [ ] 공통 Swift Package와 iOS/macOS adapter 경계 구성

### Phase B — 루트·인증·세션

- [ ] SwiftUI 루트 `AppState`
- [x] refresh 우선 세션 상태 머신
- [x] 생체인증 앱 잠금
- [ ] Sign in with Apple contract·Google browser OAuth·이메일
- [ ] iPhone 5탭·iPad sidebar/list-detail·중앙 Route

### Phase C — 핵심 기능

Android 완료·실기기 검증이 끝난 기능부터 홈 → 일정 → 공간/가족/자녀 → 가계부 → 알림 → 전체 순으로 이식한다. 각 기능은 공통 API 계약 감사, SwiftUI 구현, 단위 테스트, Preview, 시뮬레이터, 실제 계정 실기기 회귀 순으로 닫는다.

### Phase D — iPad·macOS·OS 연동·로컬 품질

- [ ] EventKit·APNs·Universal Links
- [ ] iPhone 크기·iPad Split View/Stage Manager
- [ ] 네이티브 macOS target·resizable window·menu/keyboard
- [ ] 라이트·다크·tinted appearance
- [ ] Dynamic Type·VoiceOver·Reduce Motion/Transparency·Increase Contrast
- [ ] 오프라인·세션 만료·부분 실패
- [ ] iPhone/iPad simulator와 로컬 Mac build·test

### Phase E — 유료 라이선스·실기기·출시

- [ ] Apple Developer Program 가입과 운영 Team 연결
- [ ] Sign in with Apple·APNs·Universal Links capability 활성화
- [ ] iPhone/iPad 실제 기기 전체 회귀
- [ ] TestFlight·Crashlytics·App Store 제출
- [ ] macOS 배포 서명·공증·App Store 또는 직접 배포 검증

## 8. 완료 기준

- 기존 UIKit 고정 디자인 화면이 제품 핵심 경로에 남지 않는다.
- Android와 데이터·권한·오류 의미는 같고 Apple 표준 탐색·입력·피드백 패턴을 사용한다.
- Liquid Glass를 콘텐츠 장식으로 남용하지 않고 시스템 탐색·컨트롤 계층에서만 사용한다.
- iOS/iPadOS/macOS 26 이상과 fallback 지원 OS에서 같은 기능 의미를 제공한다.
- iPad는 확대된 iPhone 화면이 아니라 sidebar·list-detail·다열 배치를 제공한다.
- macOS는 `Designed for iPad`가 아니라 창·menu·keyboard 상호작용을 갖는 네이티브 SwiftUI 앱으로 동작한다.
- iPhone/iPad/macOS, 라이트/다크, Dynamic Type, VoiceOver, Reduce Motion/Transparency를 통과한다.
- 핵심 기능이 제품 WebView로 돌아가지 않는다.
- 라이선스 획득 전에는 로컬 완료 기준을 모두 통과하고, 라이선스 이후에는 capability·실기기·배포 검증만 남는다.

## 9. 공식 기준

- Apple Human Interface Guidelines: <https://developer.apple.com/design/human-interface-guidelines>
- Materials / Liquid Glass: <https://developer.apple.com/design/human-interface-guidelines/materials>
- Adopting Liquid Glass: <https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass>
- Liquid Glass overview: <https://developer.apple.com/documentation/technologyoverviews/liquid-glass>
- SwiftUI `Glass`: <https://developer.apple.com/documentation/swiftui/glass>
- App icons / Icon Composer: <https://developer.apple.com/design/human-interface-guidelines/app-icons>
- Configuring a multiplatform app: <https://developer.apple.com/documentation/xcode/configuring-a-multiplatform-app-target>
- Sidebars: <https://developer.apple.com/design/human-interface-guidelines/sidebars>
- Designing for macOS: <https://developer.apple.com/design/human-interface-guidelines/designing-for-macos>
