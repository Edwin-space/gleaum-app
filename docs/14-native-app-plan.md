# 14. 네이티브 앱 확장 계획 — 전 플랫폼 종합 설계서

> 작성일: 2026-05-08  
> 개발 환경: **macOS (Apple Silicon Mac Mini)**  
> 목표: 글리움 웹 서비스 코드베이스를 최대한 재사용하여  
> **Apple 생태계(iPhone/iPad/macOS)** + **Android 생태계(Phone/Tablet)** 동시 네이티브 배포

---

## 0. 빠른 의사결정 — 무엇부터 시작할 것인가

현재 Mac 환경에서 병렬로 진행할 수 있는 작업 순서:

```
[지금 즉시 시작 가능]
  ① 공통 Capacitor 기반 설정 (2~3시간)
  ② Next.js 정적 빌드 전환 + API Routes 분리 (1~2일)

[Xcode 세팅 후 → Apple 전체 동시 진행]
  ③-A  Xcode 유니버설 프로젝트: iPhone + iPad + macOS (Mac Catalyst)
        → 단 하나의 Xcode 프로젝트로 3개 플랫폼 동시 빌드

[Android Studio 세팅 후 → Android 전체 동시 진행]
  ③-B  Android Studio: Phone + Tablet
        → 동일 APK/AAB가 Phone과 Tablet 모두 커버

[③-A, ③-B는 Mac 1대에서 병렬 작업 가능]
```

**핵심**: Apple 생태계(iPhone + iPad + macOS)는 **Xcode 1개 프로젝트**에서 처리.  
Android 생태계(Phone + Tablet)는 **Android Studio 1개 프로젝트**에서 처리.  
코드는 Capacitor를 통해 **100% 공유**.

---

## 1. 기술 아키텍처 전체 그림

```
┌──────────────────────────────────────────────────────────┐
│                글리움 코드베이스 (공유)                     │
│                                                          │
│  Next.js + TypeScript (현재 웹 코드 ~90% 그대로 사용)       │
│  └── output: 'export' → /out 폴더 (정적 HTML/JS/CSS)      │
└─────────────────────┬────────────────────────────────────┘
                      │  Capacitor 래핑
           ┌──────────┴──────────┐
           │                     │
    ┌──────▼──────┐       ┌──────▼──────┐
    │  Apple 생태계 │       │ Android 생태계│
    │  (Xcode)    │       │ (Android    │
    │             │       │  Studio)    │
    │ ┌─────────┐ │       │ ┌─────────┐ │
    │ │ iPhone  │ │       │ │ Phone   │ │
    │ │ iPad    │ │       │ │ Tablet  │ │
    │ │ macOS   │ │       │ └─────────┘ │
    │ └─────────┘ │       └─────────────┘
    └─────────────┘
           │                     │
    App Store /            Google Play /
    Mac App Store           Direct APK
           │                     │
           └──────────┬──────────┘
                      │
          Supabase (동일 DB, 동일 Auth)
          gleaum.com API Routes (공유)
```

---

## 2. 공통 기반 설정 (플랫폼 무관, 가장 먼저 실행)

### 2-1. 패키지 설치

```bash
cd "/Volumes/WD_BLACK/Ai Works/gleaum"

# Capacitor 핵심
npm install @capacitor/core @capacitor/cli

# Apple 플랫폼 (iOS = iPhone + iPad + macOS Catalyst)
npm install @capacitor/ios

# Android 플랫폼
npm install @capacitor/android

# 공통 필수 플러그인
npm install @capacitor/push-notifications    # FCM(Android) + APNs(Apple) 통합
npm install @capacitor/local-notifications   # 로컬 예약 알림
npm install @capacitor/browser               # OAuth 외부 브라우저 처리
npm install @capacitor/splash-screen         # 스플래시 스크린
npm install @capacitor/status-bar            # 상태바 색상 (Apple/Android)
npm install @capacitor/keyboard              # 키보드 이벤트
npm install @capacitor/haptics               # 햅틱 피드백
npm install @capacitor/share                 # 네이티브 공유 시트
npm install @capacitor/preferences          # 안전한 로컬 스토리지 (Keychain/Keystore 연동)
npm install @capacitor/network               # 네트워크 상태 감지
npm install @capacitor/app                   # 앱 라이프사이클 (백그라운드/포그라운드)

# 보안 관련
npm install @capacitor-community/secure-storage-plugin  # 암호화 스토리지
npm install @aparajita/capacitor-biometric-auth          # Face ID / Touch ID / 지문

# 앱 추적 투명성 (iOS ATT — GA4 사용 시 필수)
npm install @capacitor-community/app-tracking-transparency

# 아이콘/스플래시 자동 생성
npm install -D @capacitor/assets
```

### 2-2. Capacitor 초기화

```bash
npx cap init "글리움" "com.gleaum.app" --web-dir=out
```

### 2-3. capacitor.config.ts (공통)

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gleaum.app',
  appName: '글리움',
  webDir: 'out',
  bundledWebRuntime: false,

  server: {
    // 개발 중에는 로컬 서버 연결 가능 (빌드 없이 Hot Reload)
    // url: 'http://192.168.x.x:3000',
    // cleartext: true,
    hostname: 'gleaum.app',
    androidScheme: 'https',
    iosScheme: 'gleaum',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0F1A2E',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#0084CC',
      sound: 'beep.wav',
    },
    StatusBar: {
      style: 'Dark',          // Apple
      backgroundColor: '#0F1A2E',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },

  ios: {
    scheme: 'gleaum',
    contentInset: 'always',    // safe area inset 자동 처리
    backgroundColor: '#0F1A2E',
  },

  android: {
    backgroundColor: '#0F1A2E',
    allowMixedContent: false,  // HTTPS only
    captureInput: true,
    webContentsDebuggingEnabled: false,  // 배포 시 false 필수
  },
};

export default config;
```

### 2-4. Next.js 정적 빌드 전환 (핵심 작업)

```typescript
// next.config.ts
const isNativeBuild = process.env.BUILD_TARGET === 'native';

const nextConfig = {
  output: isNativeBuild ? 'export' : undefined,
  trailingSlash: isNativeBuild,
  images: {
    unoptimized: isNativeBuild,
  },
  // 네이티브 빌드 시 API 라우트 비활성화를 위한 표시
  ...(isNativeBuild && {
    env: {
      NEXT_PUBLIC_IS_NATIVE: 'true',
    },
  }),
};

export default nextConfig;
```

```json
// package.json scripts 추가
{
  "scripts": {
    "build:native": "BUILD_TARGET=native next build",
    "cap:sync": "npm run build:native && npx cap sync",
    "cap:ios": "npm run build:native && npx cap sync ios && npx cap open ios",
    "cap:android": "npm run build:native && npx cap sync android && npx cap open android"
  }
}
```

### 2-5. API Routes 처리 전략

`output: 'export'` 사용 시 `/api/*` 라우트 비활성화됨.  
아래 전략 중 **권장: 전략 A + B 혼합** 사용.

| API Route | 현재 기능 | 네이티브 처리 전략 |
|-----------|---------|-----------------|
| `/api/cron/reminders` | 일정 리마인더 FCM 발송 | **전략 A**: 웹 서비스에서 계속 처리 (앱에서 호출 불필요) |
| `/api/cron/automations` | 자동화 정책 상태 전이 | **전략 A**: 웹 서비스에서 계속 처리 |
| `/api/notifications/send` | FCM 서버 발송 | **전략 B**: Supabase Edge Function 이관 |
| `/api/notifications/renotify` | 수동 재알림 | **전략 B**: Supabase Edge Function 이관 |

- **전략 A**: `gleaum.com` 웹 서비스의 API Routes를 그대로 유지. 앱은 `https://gleaum.com/api/...` 직접 호출
- **전략 B**: Supabase Edge Functions (`supabase/functions/`) 이관. 앱/웹 모두 사용 가능

```typescript
// src/lib/api-client.ts (공통 API 클라이언트)
const BASE_URL = process.env.NEXT_PUBLIC_IS_NATIVE === 'true'
  ? 'https://gleaum.com'  // 네이티브 앱 → 웹 API 직접 호출
  : '';                    // 웹 → 상대 경로

export async function callAPI(path: string, options?: RequestInit) {
  return fetch(`${BASE_URL}${path}`, options);
}
```

### 2-6. 앱 아이콘 & 스플래시 자동 생성

```bash
# assets/ 폴더 구조 준비
mkdir -p assets
# assets/icon.png — 1024×1024, 배경색 있음 (투명 없음), PNG
# assets/icon-foreground.png — Android Adaptive Icon용 포그라운드 레이어
# assets/splash.png — 2732×2732, 중앙 로고만 (여백 충분히)
# assets/splash-dark.png — 다크모드 스플래시 (선택)

# 전 플랫폼 아이콘/스플래시 자동 생성
npx capacitor-assets generate --ios --android
```

생성 결과:
- iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/` 모든 사이즈 자동
- Android: `android/app/src/main/res/` 모든 dpi 폴더 자동

---

## 3. Apple 생태계 — iPhone + iPad + macOS (Xcode 단일 프로젝트)

> **핵심**: Xcode 프로젝트 1개 = iPhone + iPad + macOS 동시 빌드.  
> App Store에서 "Universal" 앱으로 iPhone/iPad 동시 배포. Mac App Store는 별도 심사.

### 3-1. Xcode 프로젝트 생성 및 기본 설정

```bash
# iOS 플랫폼 추가 (iPhone + iPad + macOS Catalyst 모두 포함)
npx cap add ios
npx cap open ios  # Xcode 실행
```

**Xcode 기본 설정 (TARGETS > App > General)**:

| 항목 | 값 |
|------|-----|
| Bundle Identifier | `com.gleaum.app` |
| Display Name | `글리움` |
| Version | `1.0.0` |
| Build | `1` |
| Deployment Target | iOS 16.0+ (iPhone/iPad), macOS 13.0+ |
| Devices | iPhone + iPad (Universal) |
| Mac Catalyst | ✅ 체크 (macOS 앱 자동 생성) |

**Signing & Capabilities**:
- Team: Apple Developer 계정 선택
- Signing Certificate: Apple Distribution (배포용)
- Provisioning Profile: 자동 생성
- Capabilities 추가 (+ 버튼):
  - `Push Notifications`
  - `Background Modes` → Remote Notifications 체크
  - `Associated Domains` → `applinks:gleaum.com` (Universal Links)
  - `Keychain Sharing`

### 3-2. iPhone 특화 설정

**Info.plist 추가 키**:
```xml
<!-- 위치 (일정 장소 알림용, 선택) -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>일정 장소 도착 알림을 위해 위치 정보가 필요합니다.</string>

<!-- 사진 (파일 첨부용) -->
<key>NSPhotoLibraryUsageDescription</key>
<string>일정에 사진을 첨부하려면 사진 접근 권한이 필요합니다.</string>
<key>NSCameraUsageDescription</key>
<string>일정에 사진을 바로 찍어 첨부할 수 있습니다.</string>

<!-- 연락처 (참여자 초대용, 선택) -->
<key>NSContactsUsageDescription</key>
<string>가족 구성원을 쉽게 초대하려면 연락처 접근이 필요합니다.</string>

<!-- Face ID -->
<key>NSFaceIDUsageDescription</key>
<string>앱 잠금 해제를 위해 Face ID를 사용합니다.</string>

<!-- 알림 -->
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
  <string>fetch</string>
</array>
```

**화면 방향**:
```xml
<!-- iPhone: 세로만 -->
<key>UISupportedInterfaceOrientations</key>
<array>
  <string>UIInterfaceOrientationPortrait</string>
</array>
```

### 3-3. iPad 특화 설정 (심층)

iPad는 iPhone과 같은 Xcode 타겟이지만, **별도로 처리해야 할 부분이 많음**.

#### 3-3-1. 화면 방향 (4방향 모두 지원)
```xml
<!-- iPad: 4방향 모두 지원 -->
<key>UISupportedInterfaceOrientations~ipad</key>
<array>
  <string>UIInterfaceOrientationPortrait</string>
  <string>UIInterfaceOrientationPortraitUpsideDown</string>
  <string>UIInterfaceOrientationLandscapeLeft</string>
  <string>UIInterfaceOrientationLandscapeRight</string>
</array>
```

#### 3-3-2. iPad 멀티태스킹 지원 (Stage Manager / Split View)

`Info.plist`에 반드시 추가:
```xml
<!-- Split View & Slide Over 멀티태스킹 활성화 -->
<key>UIRequiresFullScreen</key>
<false/>

<!-- Stage Manager 지원 (iPadOS 16+, M-chip iPad) -->
<key>UISupportedInterfaceOrientations~ipad</key>
<!-- 위의 4방향 설정이 이미 Stage Manager를 암묵적으로 활성화 -->
```

**iPad 멀티태스킹 모드별 뷰포트 크기**:
| 모드 | 뷰포트 너비 | useIsDesktop() 결과 | 렌더링 |
|------|-----------|-------------------|--------|
| Full Screen (12.9") Landscape | 1366px | `true` | DesktopXxx |
| Full Screen (11") Landscape | 1194px | `true` | DesktopXxx |
| Full Screen (11") Portrait | 834px | `false` | MobileXxx |
| Split View 50% (11") Landscape | ~597px | `false` | MobileXxx |
| Split View 45% (11") Landscape | ~507px | `false` | MobileXxx |
| Slide Over | ~320px | `false` | MobileXxx |
| Stage Manager (resizable) | 400~1300px | 동적 변경 | 실시간 전환 |

> ⚠️ **주의**: Stage Manager에서는 창 크기가 실시간으로 바뀜.  
> `useIsDesktop()`의 `window.matchMedia` 리스너가 자동 대응하므로 추가 작업 없음.  
> 단, 레이아웃 전환 시 **깜빡임**이 발생할 수 있어 CSS transition 추가 권장.

```typescript
// src/hooks/useMediaQuery.ts — 이미 구현됨, 변경 불필요
// matchMedia('(min-width: 1024px)') 리스너가 Stage Manager 창 크기 변경에 자동 반응
```

#### 3-3-3. 포인터 지원 (Magic Trackpad / Apple Pencil)

iPad에서 Magic Trackpad 연결 시 마우스 커서 지원. 현재 인라인 스타일로 작성된 버튼들에 hover 상태 추가 권장:

```typescript
// 현재 버튼 스타일에 cursor 추가 (이미 되어 있는 부분 확인)
style={{ cursor: 'pointer' }}  // ← 이미 적용됨

// 추가 권장: hover 상태를 위한 CSS-in-JS 또는 CSS 클래스
// iPad + trackpad에서 hover 효과가 있으면 데스크탑 수준의 UX 제공
```

`globals.css`에 추가:
```css
/* 포인터 디바이스에서만 hover 효과 활성화 (터치 기기 오작동 방지) */
@media (hover: hover) and (pointer: fine) {
  .native-btn:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }
}
```

#### 3-3-4. 외부 키보드 단축키 (iPad + Keyboard)

```typescript
// src/hooks/useKeyboardShortcuts.ts (신규 생성 필요)
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardShortcuts() {
  const router = useRouter();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'n': e.preventDefault(); router.push('/schedules/new'); break;
          case 'h': e.preventDefault(); router.push('/home'); break;
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [router]);
}
```

### 3-4. macOS (Mac Catalyst) 특화 설정

Mac Catalyst는 iPad 코드를 macOS로 자동 변환. 추가 설정 필요 부분:

#### 3-4-1. 창 크기 설정

```swift
// ios/App/App/AppDelegate.swift에 추가
import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(_ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

    #if targetEnvironment(macCatalyst)
    // macOS 기본 창 크기 설정
    if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
      if let titlebar = windowScene.titlebar {
        titlebar.toolbarStyle = .unified
        titlebar.titleVisibility = .hidden  // 타이틀바 숨김 (웹앱처럼 보이게)
      }
      // 창 크기: 최소 900×700, 기본 1280×800
      windowScene.sizeRestrictions?.minimumSize = CGSize(width: 900, height: 700)
      windowScene.sizeRestrictions?.maximumSize = CGSize(width: 1920, height: 1200)
    }
    #endif

    return true
  }
}
```

#### 3-4-2. macOS 메뉴바

Mac Catalyst는 기본 iOS 메뉴를 macOS 메뉴바로 변환. 추가 메뉴 항목 커스터마이징:
```swift
// 불필요한 기본 메뉴 항목 제거 (File > New Window 등)
override func buildMenu(with builder: UIMenuBuilder) {
  super.buildMenu(with: builder)
  builder.remove(menu: .newScene)
  builder.remove(menu: .openRecent)
}
```

#### 3-4-3. macOS 디자인 레이아웃

macOS Catalyst에서는 `useIsDesktop()`이 항상 `true` 반환 (창 너비 ≥ 1024px).  
→ `DesktopSidebar` + `DesktopXxx` 컴포넌트가 자동으로 렌더링됨. **추가 작업 불필요**.

### 3-5. APNs 푸시 알림 연동

```bash
# 1. Apple Developer Console에서 APNs Key 생성
# Developer Console → Certificates → Keys → (+) → Apple Push Notifications Service (APNs)
# → 다운로드: AuthKey_XXXXXXXXXX.p8

# 2. Firebase Console에 APNs Key 등록
# Firebase → 프로젝트 설정 → Cloud Messaging → Apple 앱 설정 → APN 인증 키 업로드

# 3. Capacitor 플러그인 (이미 설치됨)
# @capacitor/push-notifications 가 FCM(Android)과 APNs(Apple) 통합 처리
```

```typescript
// src/hooks/usePushNotifications.ts (신규)
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export async function registerPushNotifications() {
  if (!Capacitor.isNativePlatform()) return; // 웹에서는 기존 FCM 로직 사용

  const result = await PushNotifications.requestPermissions();
  if (result.receive === 'granted') {
    await PushNotifications.register();
  }

  // FCM/APNs 토큰을 Supabase profiles.fcm_token에 저장
  PushNotifications.addListener('registration', async (token) => {
    await saveDeviceToken(token.value); // src/lib/db.ts의 기존 함수 재사용
  });
}
```

### 3-6. Universal Links (URL Scheme 보안 강화)

> 2026-05-27 현재 상태: Universal Links용 웹 파일(`public/.well-known/apple-app-site-association`)은 준비되었지만, 무료 Apple Developer 계정에서는 Associated Domains capability가 지원되지 않아 iOS entitlement 연결은 임시 제거되었습니다. 유료 Apple Developer Program 전환 후 이 섹션의 capability를 다시 활성화하세요.


Custom URL Scheme(`gleaum://`) 대신 Universal Links 사용:
- **이유**: Custom URL Scheme은 다른 앱이 동일 scheme 등록 시 가로채기 가능 (보안 취약)
- Universal Links는 `https://gleaum.com/.well-known/apple-app-site-association` 도메인 검증으로 보안

```json
// public/.well-known/apple-app-site-association (신규 생성)
{
  "applinks": {
    "details": [
      {
        "appIDs": ["XXXXXXXXXX.com.gleaum.app"],
        "components": [
          { "/": "/auth/callback", "comment": "OAuth callback" },
          { "/": "/invite/*", "comment": "초대 링크" },
          { "/": "/share/*", "comment": "일정 공유" }
        ]
      }
    ]
  }
}
```

### 3-7. Privacy Manifest (2024년 5월 이후 필수)

Apple이 2024년 5월부터 App Store 심사 시 `PrivacyInfo.xcprivacy` 파일 필수 요구.

```xml
<!-- ios/App/App/PrivacyInfo.xcprivacy -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "...">
<plist version="1.0">
<dict>
  <!-- 사용하는 API 목록 -->
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <!-- UserDefaults 사용 (Capacitor Preferences) -->
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>  <!-- 앱 기능 제공 목적 -->
      </array>
    </dict>
    <!-- 파일 타임스탬프 (캐시 관리) -->
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>C617.1</string>
      </array>
    </dict>
  </array>

  <!-- 수집하는 데이터 -->
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeEmailAddress</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
  </array>

  <key>NSPrivacyTracking</key>
  <false/>  <!-- GA4 사용하지만 ATT 거부해도 수집 안 함으로 처리 가능 -->
</dict>
</plist>
```

### 3-8. ATT (App Tracking Transparency) — GA4 관련

iOS 14.5+부터 사용자 추적 시 ATT 권한 팝업 필수.

```typescript
// src/lib/analytics-native.ts (신규)
import { Capacitor } from '@capacitor/core';
import { trackEvent, GA_ID } from './analytics';

// ATT 권한 요청 후 GA4 초기화
export async function initNativeAnalytics() {
  if (!Capacitor.isNativePlatform()) return;

  const platform = Capacitor.getPlatform();
  if (platform === 'ios') {
    // @capacitor-community/app-tracking-transparency 사용
    const { AppTrackingTransparency } = await import(
      '@capacitor-community/app-tracking-transparency'
    );
    const { status } = await AppTrackingTransparency.requestPermission();

    if (status === 'authorized') {
      // ATT 승인 시 GA4 정상 동작
      window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    } else {
      // ATT 거부 시 GA4 익명 집계 모드
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
    }
  }
}
```

### 3-9. App Store 제출 체크리스트

**필수 스크린샷 사이즈**:
| 디바이스 | 해상도 | 개수 |
|---------|--------|------|
| iPhone 6.7" (15 Pro Max) | 1290 × 2796 | 3~10장 |
| iPhone 6.5" (11 Pro Max) | 1242 × 2688 | 3~10장 |
| iPad Pro 12.9" | 2048 × 2732 | 3~10장 |
| iPad Pro 11" | 1668 × 2388 | 3~10장 |
| macOS (1280×800 최소) | 1280 × 800 이상 | 3~10장 |

**심사 주의 사항**:
- 로그인 테스트 계정 제공 필수 (심사팀이 실제 사용해봄)
- Google OAuth 앱 검증 완료 상태여야 함
- Privacy Policy URL 필수 (gleaum.com/privacy 페이지 필요)
- 앱 내 구매 없으면 IAP 관련 언급 불필요

---

## 4. Android 생태계 — Phone + Tablet (Android Studio 단일 프로젝트)

> **핵심**: 하나의 APK/AAB가 Phone과 Tablet 모두 커버.  
> 태블릿에서는 `useIsDesktop()` 결과에 따라 자동으로 DesktopXxx 레이아웃 사용.

### 4-1. Android 플랫폼 추가

```bash
npx cap add android
npx cap open android  # Android Studio 실행
```

### 4-2. Android 기본 설정

**`android/app/src/main/AndroidManifest.xml`**:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

  <!-- 권한 -->
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />  <!-- Android 13+ -->
  <uses-permission android:name="android.permission.VIBRATE" />
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />  <!-- 재부팅 후 알림 복원 -->

  <!-- 카메라/미디어 (파일 첨부) -->
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />  <!-- Android 13+ -->
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />  <!-- Android 12 이하 -->

  <application
    android:label="글리움"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:theme="@style/AppTheme"
    android:usesCleartextTraffic="false"  <!-- HTTPS only -->
    android:networkSecurityConfig="@xml/network_security_config"

    <!-- 태블릿 멀티윈도우 지원 -->
    android:resizeableActivity="true"
    android:supportsPictureInPicture="false">

    <activity
      android:name=".MainActivity"
      android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
      android:exported="true">

      <!-- App Links (Universal Links Android 버전) -->
      <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="gleaum.com"
              android:pathPrefix="/auth/callback" />
        <data android:scheme="https" android:host="gleaum.com"
              android:pathPrefix="/invite" />
      </intent-filter>

    </activity>
  </application>
</manifest>
```

### 4-3. Android Phone 특화 설정

**엣지-투-엣지 디스플레이 (Android 15+ 기본 적용)**:
```kotlin
// android/app/src/main/java/com/gleaum/app/MainActivity.kt
class MainActivity : BridgeActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // 엣지-투-엣지 처리 (상태바/네비게이션바 영역까지 앱 확장)
    WindowCompat.setDecorFitsSystemWindows(window, false)
  }
}
```

이미 `env(safe-area-inset-*)` CSS를 사용하고 있어 Android WebView에서도 자동 대응됨.

**뒤로가기 버튼 처리**:
```typescript
// src/hooks/useAndroidBackButton.ts (신규)
import { App } from '@capacitor/app';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAndroidBackButton() {
  const router = useRouter();
  useEffect(() => {
    const handler = App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        router.back();
      } else {
        // 홈화면으로 이동 (앱 종료 대신)
        router.push('/home');
      }
    });
    return () => { handler.then(h => h.remove()); };
  }, [router]);
}
```

### 4-4. Android Tablet 특화 설정 (심층)

#### 4-4-1. 화면 크기 분류

Android는 dp(밀도 독립 픽셀) 기준으로 태블릿 판단:
| 분류 | 최소 너비 | 기기 예시 |
|------|---------|---------|
| 소형 태블릿 | sw600dp | 7인치 탭 |
| 대형 태블릿 | sw720dp | 10~12인치 탭 |
| 폴더블 (펼침) | sw600dp+ | Galaxy Z Fold |

**가로 모드 기준 실제 뷰포트 너비 (WebView)**:
| 기기 | 해상도 | WebView 너비 | useIsDesktop() |
|------|--------|------------|----------------|
| Galaxy Tab S9 (11") Landscape | 1600×2560 | ~1100dp | `true` ✅ |
| Galaxy Tab S9 (11") Portrait | 1600×2560 | ~700dp | `false` |
| Galaxy Tab S9 FE (10.9") Landscape | ~1280dp | `true` ✅ |
| Pixel Tablet (11") Landscape | ~1200dp | `true` ✅ |
| Galaxy Z Fold 5 (펼침) Landscape | ~900dp | `true` ✅ |
| Galaxy Z Fold 5 (접힘) Portrait | ~393dp | `false` |

→ 대부분의 태블릿 가로 모드에서 자동으로 `DesktopXxx` 레이아웃 사용.

#### 4-4-2. Large Screen Quality Tier (Google Play 요건)

Google Play에서 태블릿/대화면 지원 앱은 3등급으로 평가됨:
- **Tier 3 (기본)**: 태블릿에서 동작하지만 최적화 없음
- **Tier 2**: 화면 크기에 맞게 레이아웃 조정됨 ← **목표**
- **Tier 1**: 태블릿 전용 UX (사이드 패널, 멀티패널) ← 나중

Tier 2 달성 체크리스트:
```xml
<!-- android/app/src/main/AndroidManifest.xml 에 추가 -->
<!-- 태블릿 지원 명시 -->
<compatible-screens>
  <screen android:screenSize="normal" android:screenDensity="ldpi" />
  <screen android:screenSize="normal" android:screenDensity="mdpi" />
  <screen android:screenSize="normal" android:screenDensity="hdpi" />
  <screen android:screenSize="normal" android:screenDensity="xhdpi" />
  <screen android:screenSize="large" android:screenDensity="ldpi" />
  <screen android:screenSize="large" android:screenDensity="mdpi" />
  <screen android:screenSize="large" android:screenDensity="hdpi" />
  <screen android:screenSize="large" android:screenDensity="xhdpi" />
  <screen android:screenSize="xlarge" android:screenDensity="mdpi" />
  <screen android:screenSize="xlarge" android:screenDensity="hdpi" />
  <screen android:screenSize="xlarge" android:screenDensity="xhdpi" />
</compatible-screens>
```

`build.gradle`에서 태블릿 해상도 스크린샷 요건 대응:
```groovy
// 태블릿 스크린샷 (Play Console에서 7인치/10인치 카테고리에 각각 업로드 필요)
```

#### 4-4-3. 폴더블 기기 대응

Galaxy Z Fold 시리즈처럼 폴딩/언폴딩 상태 전환 처리:
```typescript
// src/hooks/useFoldStateChange.ts (신규)
import { Capacitor } from '@capacitor/core';

export function useFoldStateChange(callback: (isFolded: boolean) => void) {
  if (!Capacitor.isNativePlatform()) return;

  // WebView viewport 변경을 통해 폴딩 상태 감지
  useEffect(() => {
    const handler = () => {
      const isFolded = window.innerWidth < 400;
      callback(isFolded);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [callback]);
}
```

#### 4-4-4. Android 태블릿 멀티윈도우

`android:resizeableActivity="true"` 설정으로 자동 대응.  
앱이 화면 일부를 차지할 때 WebView 크기 변경 → `useIsDesktop()` 자동 반응.

### 4-5. Network Security Config (네트워크 보안)

```xml
<!-- android/app/src/main/res/xml/network_security_config.xml (신규 생성) -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <!-- 기본: 모든 HTTPS만 허용 -->
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>

  <!-- Supabase API 도메인 인증서 피닝 (선택 — 높은 보안 요구 시) -->
  <!--
  <domain-config>
    <domain includeSubdomains="true">tyvjdsescukaeorcuaga.supabase.co</domain>
    <pin-set expiration="2027-01-01">
      <pin digest="SHA-256">실제 인증서 핀값</pin>
    </pin-set>
  </domain-config>
  -->

  <!-- 개발 환경에서만 로컬 서버 허용 -->
  <debug-overrides>
    <trust-anchors>
      <certificates src="user" />
    </certificates>
    </trust-anchors>
  </debug-overrides>
</network-security-config>
```

### 4-6. App Links (Android Universal Links)

```json
// public/.well-known/assetlinks.json (신규 생성)
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.gleaum.app",
    "sha256_cert_fingerprints": [
      "키스토어에서 추출한 SHA-256 fingerprint"
    ]
  }
}]
```

SHA-256 fingerprint 추출:
```bash
keytool -list -v -keystore your-keystore.jks -alias your-alias | grep SHA256
```

### 4-7. Adaptive Icons (Android 8.0+)

```xml
<!-- android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml -->
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/ic_launcher_background" />
  <foreground android:drawable="@mipmap/ic_launcher_foreground" />
  <monochrome android:drawable="@mipmap/ic_launcher_foreground" />  <!-- Android 13+ -->
</adaptive-icon>
```

```xml
<!-- android/app/src/main/res/values/colors.xml -->
<resources>
  <color name="ic_launcher_background">#0F1A2E</color>
</resources>
```

### 4-8. Google Play 제출 체크리스트

**필수 스크린샷**:
| 디바이스 | 해상도 | 개수 |
|---------|--------|------|
| Phone (16:9 이상) | 320~3840px 범위 내 | 2~8장 |
| 7인치 태블릿 (선택 권장) | 320~3840px 범위 내 | 2~8장 |
| 10인치 태블릿 (선택 권장) | 320~3840px 범위 내 | 2~8장 |

**AAB(Android App Bundle) 제출** (APK 대신):
```bash
# Android Studio → Build → Generate Signed Bundle/APK → Android App Bundle
# 또는 Gradle:
cd android && ./gradlew bundleRelease
```

---

## 5. 태블릿 지원 전략 — Apple iPad + Android Tablet 통합

### 5-1. 현재 코드의 태블릿 대응 현황

```typescript
// src/hooks/useMediaQuery.ts — 현재 브레이크포인트
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
```

**문제점**: 태블릿 세로 모드(portrait) 시 대부분 1024px 미만 → MobileXxx 렌더링.  
태블릿에서도 좋은 UX를 위해 **중간 레이아웃(Tablet Layout)** 고려 필요.

### 5-2. 브레이크포인트 전략 개선안

```typescript
// src/hooks/useMediaQuery.ts 개선안
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

// 추가: 태블릿 구분
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsMobile(): boolean {
  const isDesktop = useIsDesktop();
  const isTablet = useIsTablet();
  return !isDesktop && !isTablet;
}
```

```
뷰포트 너비     | 레이아웃 타입  | 컴포넌트
< 768px        | Mobile        | MobileXxx
768~1023px     | Tablet        | TabletXxx (또는 MobileXxx + 2컬럼 그리드)
≥ 1024px       | Desktop       | DesktopXxx
```

### 5-3. 태블릿 레이아웃 구현 전략 (2가지 선택지)

**Option A: 2-레이아웃 유지 (빠름, 권장)**  
MobileXxx에서 768px 이상 시 CSS 그리드로 2컬럼 전환:
```typescript
// 예: MobileSchedules.tsx 내부
const { isTablet } = useViewport(); // 새 훅

<div style={{
  display: 'grid',
  gridTemplateColumns: isTablet ? 'repeat(2, 1fr)' : '1fr',
  gap: '12px',
}}>
  {schedules.map(...)}
</div>
```

**Option B: 3-레이아웃 추가 (완성도 높음, 시간 소요)**  
`MobileXxx`, `TabletXxx`, `DesktopXxx` 3개 컴포넌트로 분리.  
태블릿은 모바일과 PC 사이의 중간 UX: 1컬럼 리스트 대신 2컬럼 카드 그리드, 사이드바 없이 하단 탭.

→ **초기 배포는 Option A로 빠르게 진행, 업데이트에서 Option B 적용 권장**.

### 5-4. iPad 세로 모드 특화 처리

iPad 11인치 세로(834px)는 MobileXxx 렌더링. 이 경우 BottomNav + 현재 모바일 레이아웃으로 충분하지만, **패딩/폰트 크기 조정** 권장:

```typescript
// globals.css 추가
/* 태블릿 세로: 여백/폰트 확대 */
@media (min-width: 768px) and (max-width: 1023px) {
  body {
    font-size: 17px;  /* 모바일 16px보다 약간 크게 */
  }

  /* 카드 패딩 증가 */
  /* 단, 인라인 스타일 사용 중이므로 컴포넌트에서 직접 처리 권장 */
}
```

---

## 6. 보안 전략 (플랫폼별 + 태블릿 공유 기기 시나리오)

### 6-1. 인증 토큰 보안 저장

현재 Supabase Auth는 `localStorage`에 세션 토큰 저장.  
WebView의 `localStorage`는 네이티브 앱에서 **암호화되지 않은 상태**로 저장됨.

```typescript
// src/lib/secure-storage.ts (신규)
import { Capacitor } from '@capacitor/core';
import { SecureStoragePlugin } from '@capacitor-community/secure-storage-plugin';
import { Preferences } from '@capacitor/preferences';

// 플랫폼에 따라 보안 스토리지 사용
export async function setSecureItem(key: string, value: string) {
  if (Capacitor.isNativePlatform()) {
    // iOS: Keychain / Android: EncryptedSharedPreferences
    await SecureStoragePlugin.set({ key, value });
  } else {
    // 웹: 기존 localStorage (Supabase 기본)
    localStorage.setItem(key, value);
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const result = await SecureStoragePlugin.get({ key });
    return result.value;
  }
  return localStorage.getItem(key);
}
```

Supabase 클라이언트에 커스텀 스토리지 어댑터 연결:
```typescript
// src/lib/supabase-native.ts (신규)
import { createClient } from '@supabase/supabase-js';
import { setSecureItem, getSecureItem } from './secure-storage';

export const supabaseNative = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: {
        getItem: (key) => getSecureItem(key),
        setItem: (key, value) => setSecureItem(key, value),
        removeItem: (key) => SecureStoragePlugin.remove({ key }),
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,  // 네이티브에서 URL 파싱 비활성화
    },
  }
);
```

### 6-2. 생체 인증 (Face ID / Touch ID / 지문)

```typescript
// src/lib/biometric-auth.ts (신규)
import { Capacitor } from '@capacitor/core';
import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';

export async function checkBiometricSupport() {
  if (!Capacitor.isNativePlatform()) return false;
  const info = await BiometricAuth.checkBiometry();
  return info.isAvailable;
}

// 앱 포그라운드 복귀 시 재인증 (민감 정보 보호)
export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    await BiometricAuth.authenticate({
      reason: '글리움 보안 잠금 해제',
      cancelTitle: '취소',
      allowDeviceCredential: true,  // PIN/패턴 폴백 허용
    });
    return true;
  } catch {
    return false;
  }
}
```

### 6-3. 태블릿 공유 기기 시나리오 (가족 공유)

글리움은 가족 앱이므로 태블릿을 여러 가족 구성원이 공유하는 상황이 발생.  
이때 발생하는 보안 이슈와 대응:

**시나리오**: 부모가 로그인된 태블릿을 자녀가 사용

| 이슈 | 대응 방안 |
|------|---------|
| 자녀가 부모 일정/가계부 열람 | 앱 잠금 타이머: 백그라운드 N분 후 생체인증 재요구 |
| 자녀가 일정 임의 삭제 | 어린이 모드 UI: 쓰기 작업에 PIN 재확인 |
| 스크린샷으로 개인정보 유출 | FLAG_SECURE 처리 (아래) |
| 다른 앱에서 캐시 접근 | 암호화 스토리지 (6-1 적용) |

**앱 잠금 타이머 구현**:
```typescript
// src/hooks/useAppLock.ts (신규)
import { App, AppState } from '@capacitor/app';
import { useEffect, useRef } from 'react';

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5분

export function useAppLock(onLock: () => void) {
  const backgroundAt = useRef<number | null>(null);

  useEffect(() => {
    const listener = App.addListener('appStateChange', (state: AppState) => {
      if (!state.isActive) {
        // 백그라운드 진입 시간 기록
        backgroundAt.current = Date.now();
      } else {
        // 포그라운드 복귀 시 경과 시간 체크
        if (backgroundAt.current) {
          const elapsed = Date.now() - backgroundAt.current;
          if (elapsed > LOCK_TIMEOUT_MS) {
            onLock(); // 잠금 화면 표시
          }
        }
        backgroundAt.current = null;
      }
    });
    return () => { listener.then(l => l.remove()); };
  }, [onLock]);
}
```

**스크린샷/화면 녹화 차단 (FLAG_SECURE)**:
```swift
// iOS: ios/App/App/AppDelegate.swift
// WebView에서 민감 화면(가계부, 마이페이지) 진입 시 호출
func enableSecureMode() {
  #if targetEnvironment(macCatalyst)
  // macOS에서는 스크린샷 제한 불가 (OS 정책)
  #else
  // iOS: 스크린샷 감지 + 화면 흐리기
  NotificationCenter.default.addObserver(
    forName: UIScreen.capturedDidChangeNotification,
    object: nil, queue: .main
  ) { _ in
    if UIScreen.main.isCaptured {
      // 민감 컨텐츠 숨기기
      self.window?.isHidden = true
    } else {
      self.window?.isHidden = false
    }
  }
  #endif
}
```

```kotlin
// Android: android/app/src/main/java/com/gleaum/app/MainActivity.kt
// 민감 화면에서 스크린샷 방지
fun enableSecureMode() {
  window.setFlags(
    WindowManager.LayoutParams.FLAG_SECURE,
    WindowManager.LayoutParams.FLAG_SECURE
  )
}

fun disableSecureMode() {
  window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
}
```

JavaScript에서 네이티브로 통신하는 Capacitor 플러그인으로 래핑:
```typescript
// src/lib/screen-security.ts (신규)
import { Capacitor, registerPlugin } from '@capacitor/core';

const ScreenSecurity = registerPlugin('ScreenSecurity');

// 민감 페이지(/budget, /mypage, /family) 진입 시 호출
export async function enableSecureScreen() {
  if (Capacitor.isNativePlatform()) {
    await ScreenSecurity.enable();
  }
}

export async function disableSecureScreen() {
  if (Capacitor.isNativePlatform()) {
    await ScreenSecurity.disable();
  }
}
```

### 6-4. OAuth 보안 (PKCE 강제)

네이티브 앱 OAuth는 웹과 달리 **PKCE(Proof Key for Code Exchange) 강제** 필요.  
Supabase Auth는 기본적으로 PKCE 지원. 추가 설정:

```typescript
// src/lib/supabase.ts 수정
const supabase = createClient(url, anonKey, {
  auth: {
    flowType: 'pkce',  // ← 네이티브 앱에서 PKCE 강제
    detectSessionInUrl: !Capacitor.isNativePlatform(),
  },
});
```

### 6-5. 앱 실행 시 무결성 검사

```typescript
// src/lib/app-integrity.ts (신규)
import { Capacitor } from '@capacitor/core';

export async function checkAppIntegrity() {
  if (!Capacitor.isNativePlatform()) return true;

  // Android: Play Integrity API
  // iOS: DeviceCheck / App Attest (Apple Silicon 기기)
  // → Supabase RLS가 이미 서버단 보안을 담당하므로 클라이언트 무결성은 선택적
  // → 유료 서비스 기능 (구독 등) 추가 시 필요

  return true;
}
```

---

## 7. CI/CD 파이프라인 (GitHub Actions)

Mac 로컬 빌드 외에 자동화된 빌드 파이프라인 구성:

```yaml
# .github/workflows/native-build.yml (신규 생성)
name: Native App Build

on:
  push:
    tags:
      - 'v*'  # 버전 태그 push 시 자동 빌드

jobs:
  # ── iOS / macOS 빌드 ──────────────────────────────────────
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build Next.js static
        run: npm run build:native
        env:
          BUILD_TARGET: native
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_GA_ID: ${{ secrets.NEXT_PUBLIC_GA_ID }}

      - name: Capacitor sync iOS
        run: npx cap sync ios

      - name: Build & Archive iOS
        uses: yukiarrr/ios-build-action@v1.5.0
        with:
          project-path: ios/App/App.xcodeproj
          workspace-path: ios/App/App.xcworkspace
          scheme: App
          configuration: Release
          output-path: build/gleaum.ipa
          certificate: ${{ secrets.IOS_DISTRIBUTION_CERT_BASE64 }}
          certificate-password: ${{ secrets.IOS_CERT_PASSWORD }}
          provision-profile: ${{ secrets.IOS_PROVISION_PROFILE_BASE64 }}

      - name: Upload to TestFlight
        uses: Apple-Actions/upload-testflight-build@v1
        with:
          app-path: build/gleaum.ipa
          issuer-id: ${{ secrets.APPSTORE_ISSUER_ID }}
          api-key-id: ${{ secrets.APPSTORE_KEY_ID }}
          api-private-key: ${{ secrets.APPSTORE_PRIVATE_KEY }}

  # ── Android 빌드 ──────────────────────────────────────────
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Install dependencies
        run: npm ci

      - name: Build Next.js static
        run: npm run build:native
        env:
          BUILD_TARGET: native
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_GA_ID: ${{ secrets.NEXT_PUBLIC_GA_ID }}

      - name: Capacitor sync Android
        run: npx cap sync android

      - name: Build Android AAB
        run: |
          cd android
          echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > app/gleaum.keystore
          ./gradlew bundleRelease \
            -Pandroid.injected.signing.store.file=gleaum.keystore \
            -Pandroid.injected.signing.store.password=${{ secrets.ANDROID_KEYSTORE_PASSWORD }} \
            -Pandroid.injected.signing.key.alias=${{ secrets.ANDROID_KEY_ALIAS }} \
            -Pandroid.injected.signing.key.password=${{ secrets.ANDROID_KEY_PASSWORD }}

      - name: Upload to Play Console
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.PLAY_SERVICE_ACCOUNT_JSON }}
          packageName: com.gleaum.app
          releaseFiles: android/app/build/outputs/bundle/release/app-release.aab
          track: internal  # internal → alpha → beta → production 순서로 배포
```

**로컬 개발 TestFlight 배포 (Fastlane)**:
```ruby
# ios/fastlane/Fastfile
lane :beta do
  build_app(
    scheme: "App",
    workspace: "App.xcworkspace",
    configuration: "Release",
    export_method: "app-store"
  )
  upload_to_testflight(
    skip_waiting_for_build_processing: true
  )
end
```

---

## 8. 전체 실행 타임라인 (Mac 환경 기준)

### 우선순위 매트릭스

| 작업 | 중요도 | 예상 시간 | 병렬 가능 |
|------|--------|---------|---------|
| 공통 Capacitor 기반 + 정적 빌드 전환 | 🔴 필수 | 1~2일 | — (먼저) |
| iOS iPhone 기본 동작 | 🔴 필수 | 1~2일 | — |
| iPad 레이아웃 검증 | 🔴 필수 | 1일 | iOS와 동시 |
| macOS Catalyst | 🟡 중요 | 0.5일 | iOS 완료 후 |
| Android Phone 기본 동작 | 🔴 필수 | 1~2일 | iOS와 병렬 가능 |
| Android Tablet 레이아웃 검증 | 🟡 중요 | 1일 | Android Phone과 동시 |
| 생체인증 (Face ID/지문) | 🟡 중요 | 1일 | 각 플랫폼 완료 후 |
| 앱 잠금 타이머 | 🟡 중요 | 0.5일 | 생체인증과 동시 |
| App Store / Play Console 제출 | 🔴 필수 | 1~2일 | Apple/Android 병렬 |
| CI/CD 파이프라인 | 🟢 선택 | 1일 | 모든 것 완료 후 |

### 3주 스프린트 플랜

```
Week 1 — 기반 구축
  Day 1~2: 공통 Capacitor 설정, 정적 빌드 전환, API 전략 결정
  Day 3~4: [Apple] Xcode 프로젝트 + iPhone 시뮬레이터 동작 확인
           [Android] Android Studio + Phone 에뮬레이터 동작 확인 (병렬)
  Day 5:   [Apple] iPad 시뮬레이터 레이아웃 검증
           [Android] 태블릿 에뮬레이터 레이아웃 검증

Week 2 — 네이티브 기능 연동
  Day 6~7: APNs + FCM 푸시 알림 통합 테스트 (실기기 필수)
  Day 8:   OAuth 로그인 플로우 (앱 URL Scheme → Universal/App Links)
  Day 9:   생체 인증 + 앱 잠금 타이머
  Day 10:  보안 스토리지 + Privacy Manifest (iOS)

Week 3 — 마무리 + 스토어 제출
  Day 11:  macOS Catalyst 창 설정 + 메뉴바 조정
  Day 12:  [Apple] TestFlight 베타 배포 → 내부 테스트
           [Android] Play Console Internal Track → 내부 테스트
  Day 13~14: 스크린샷 촬영 + 스토어 메타데이터 작성
  Day 15:  App Store + Play Console 심사 제출
  Day 16+: 심사 대기 (Apple 1~3일, Android 수 시간~1일)
```

---

## 9. 필요한 계정, 도구, 비용

| 항목 | 비용 | 용도 | 현재 상태 |
|------|------|------|---------|
| **Apple Developer Program** | $99/년 | iOS/macOS 빌드 서명, 스토어 배포 | 확인 필요 |
| **Google Play Console** | $25 (1회) | Android 앱 배포 | 확인 필요 |
| **Xcode** | 무료 | iOS/macOS 빌드 | Mac App Store 설치 |
| **Android Studio** | 무료 | Android 빌드 | 공식 사이트 설치 |
| **iOS 실기기** | — | 실기기 테스트 필수 | iPhone 보유 확인 |
| **Android 실기기** | — | 실기기 테스트 | Android 기기 확인 |
| **iPad 실기기** | — | 태블릿 레이아웃 확인 (에뮬레이터로 가능) | 선택 |
| **Capacitor Appflow** | 유료 | OTA 업데이트 (스토어 심사 없이 배포) | 선택 |
| **Fastlane** | 무료 | 자동화 빌드/배포 스크립트 | 선택 |

---

## 10. 즉시 시작 체크리스트

```bash
# ✅ 지금 바로 실행 가능한 명령어 순서

cd "/Volumes/WD_BLACK/Ai Works/gleaum"

# 1. Capacitor 설치
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# 2. Capacitor 초기화
npx cap init "글리움" "com.gleaum.app" --web-dir=out

# 3. 정적 빌드 테스트
BUILD_TARGET=native next build
# → /out 폴더 생성 확인, API Routes 없이도 동작하는지 검증

# 4. iOS 플랫폼 추가
npx cap add ios
npx cap sync ios

# 5. Android 플랫폼 추가
npx cap add android
npx cap sync android

# 6. Xcode 열기 (iOS 시뮬레이터 테스트)
npx cap open ios

# 7. Android Studio 열기 (에뮬레이터 테스트)
npx cap open android
```

**현재 진행 상태**:
```
[✅ 완료] 웹 서비스 (gleaum.com) — 전 구간 리디자인, GA4, 성능 최적화
[✅ 완료] 계획서 수립 (이 문서)
[⏳ 대기] Step 1: Apple Developer Program 활성화 확인
[⏳ 대기] Step 2: Xcode 최신 버전 설치 확인
[⏳ 대기] Step 3: Android Studio 설치 확인
[⏳ 대기] Step 4: Capacitor 설치 + 정적 빌드 전환 (시작점)
```
