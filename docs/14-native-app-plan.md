# 14. 네이티브 앱 확장 계획 (Capacitor — macOS → iOS → Android)

> 작성일: 2026-05-08  
> 상태: **Phase A (macOS) 계획 수립 완료 — 작업 대기 중**

---

## 1. 전략 개요

### 핵심 원칙
현재 Next.js 웹 서비스(`gleaum.com`)를 **그대로 유지**하면서, 동일한 코드베이스를 **Capacitor.js**로 래핑해 네이티브 앱으로 배포한다. 별도 백엔드나 새로운 DB 없이 **기존 Supabase 프로젝트를 공유**한다.

```
현재 Next.js 웹 (gleaum.com) ──── 계속 운영
         │
         └── Capacitor 래핑
                ├── Phase A: macOS App (Mac App Store / .dmg)
                ├── Phase B: iOS / iPad App (App Store)
                └── Phase C: Android App (Google Play)
```

### 기술 선택 근거: Capacitor vs React Native vs Flutter

| 항목 | Capacitor | React Native | Flutter |
|------|-----------|--------------|---------|
| 코드 재사용률 | **~85~90%** (기존 Next.js 그대로) | ~30% (별도 RN 컴포넌트) | ~0% (Dart) |
| 웹→앱 전환 난이도 | **낮음** | 중간 | 높음 |
| 네이티브 기능 접근 | 플러그인 시스템 | Bridge | 채널 |
| macOS 지원 | **Mac Catalyst로 바로 지원** | 제한적 | 별도 작업 |
| 현재 PWA와의 관계 | PWA 코드 그대로 앱에 활용 | 별도 구현 | 별도 구현 |

**결론**: 글리움처럼 이미 완성된 웹 서비스가 있고 코드 재사용이 최우선일 때 Capacitor가 최적.

---

## 2. Phase A — macOS 앱

### 2-1. 아키텍처 결정

```
┌─────────────────────────────────┐
│  macOS Native Shell (Capacitor) │  ← Xcode / Swift
│  ┌───────────────────────────┐  │
│  │  WKWebView                │  │
│  │  ┌─────────────────────┐  │  │
│  │  │  Next.js 정적 빌드  │  │  │
│  │  │  (웹 코드 그대로)   │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
         │
         └── Supabase API (동일 DB)
```

**렌더링 방식**: Next.js `output: 'export'` (정적 HTML/JS/CSS 번들)을 WKWebView에서 로컬 서빙. 서버 사이드 렌더링 불필요 (모든 데이터 fetch는 클라이언트에서 Supabase SDK로 직접).

> ⚠️ **주의**: `output: 'export'` 전환 시 API Routes(`/api/*`)가 동작하지 않음. Cron 리마인더 등 서버 기능은 웹 서비스(gleaum.com)에서 계속 처리하거나 Supabase Edge Functions으로 이관 검토.

---

### 2-2. 단계별 작업 목록

#### Step 1 — 환경 설정
```bash
# 1. Capacitor 설치
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/macos  # macOS 타겟

# 2. Capacitor 초기화
npx cap init "글리움" "com.gleaum.app" --web-dir=out

# 3. macOS 플랫폼 추가
npx cap add @capacitor-community/macos
```

#### Step 2 — Next.js 정적 빌드 설정
`next.config.ts`에 조건부 static export 추가:
```ts
// next.config.ts
const isNativeApp = process.env.BUILD_TARGET === 'native';

const nextConfig = {
  output: isNativeApp ? 'export' : undefined,
  trailingSlash: true,  // native 빌드에서 필요
  images: {
    unoptimized: isNativeApp,  // next/image는 static export에서 최적화 불가
  },
};
```

빌드 명령 추가 (`package.json`):
```json
{
  "scripts": {
    "build:native": "BUILD_TARGET=native next build",
    "build:ios": "npm run build:native && npx cap sync ios",
    "build:macos": "npm run build:native && npx cap sync @capacitor-community/macos"
  }
}
```

#### Step 3 — capacitor.config.ts 구성
```ts
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gleaum.app',
  appName: '글리움',
  webDir: 'out',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F1A2E',  // 현재 로그인 화면 배경색
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    scheme: 'gleaum',
  },
};
export default config;
```

#### Step 4 — Xcode 설정 (macOS)
1. Xcode 열기: `npx cap open @capacitor-community/macos`
2. 프로젝트 설정:
   - Bundle Identifier: `com.gleaum.app`
   - Display Name: `글리움`
   - Deployment Target: macOS 12.0+
   - Signing: Apple Developer 계정 선택
3. **Mac Catalyst 활성화**: iOS 타겟 → General → Mac Catalyst 체크 (나중에 iOS/iPad 앱을 macOS로 자동 변환)
4. 앱 아이콘: `Assets.xcassets/AppIcon` → 1024×1024 PNG 삽입
5. 스플래시 스크린: LaunchScreen.storyboard 구성

#### Step 5 — 네이티브 기능 연동

**푸시 알림 (APNs)**
```bash
npm install @capacitor/push-notifications
```
- Apple Developer Console → Certificates → APNs 인증서 생성 (p8 키)
- Firebase Console → 프로젝트 설정 → APNs 인증서 등록
- FCM이 APNs 브릿지 역할 → 기존 FCM 코드 재사용 가능

**로컬 알림**
```bash
npm install @capacitor/local-notifications
```

**OAuth (Google 로그인)**
현재 웹 OAuth 플로우 그대로 사용 가능. Capacitor Browser 플러그인으로 외부 브라우저에서 OAuth 처리:
```bash
npm install @capacitor/browser
```
Supabase Auth 설정에 URL Scheme 추가: `gleaum://auth/callback`

**네이티브 공유**
```bash
npm install @capacitor/share
```

#### Step 6 — 앱 아이콘 및 스플래시 생성
현재 `GleaumLogoImg` 디자인을 기반으로:
- 1024×1024 앱 아이콘 PNG (투명 배경 없이, 둥근 모서리는 OS가 처리)
- 스플래시: `#0F1A2E` 배경 + 로고 중앙 배치

자동 생성 툴: `@capacitor/assets`
```bash
npm install -D @capacitor/assets
# icons/icon.png (1024×1024), splash/splash.png (2732×2732) 준비 후:
npx capacitor-assets generate
```

#### Step 7 — macOS 창 설정
`ios/App/App/AppDelegate.swift` 또는 Capacitor 설정으로 기본 창 크기 지정:
```swift
// 최소 창 크기: 390×844 (iPhone 크기 기준)
// 권장 기본 창 크기: 1280×800
window.setFrame(NSRect(x: 0, y: 0, width: 1280, height: 800), display: true)
window.minSize = NSSize(width: 390, height: 700)
```

#### Step 8 — 빌드 및 테스트
```bash
# 정적 빌드
npm run build:macos

# Xcode에서 Run (Command+R)
# Simulator: My Mac (Designed for iPad)
```

#### Step 9 — Mac App Store 제출
1. Product → Archive
2. Distribute App → App Store Connect
3. App Store Connect에서 앱 정보, 스크린샷, 설명 입력
4. 심사 제출 (보통 1~3일 소요)

---

### 2-3. 예상 일정 (Mac 개발환경 기준)

| 단계 | 내용 | 예상 시간 |
|------|------|---------|
| 환경 설정 | Capacitor 설치, 프로젝트 초기화 | 2~3시간 |
| Next.js 빌드 전환 | static export 설정, 검증 | 1~2일 |
| Xcode 프로젝트 설정 | 아이콘, 스플래시, 서명 | 1일 |
| 네이티브 기능 연동 | APNs, OAuth, 로컬 알림 | 2~3일 |
| 테스트 & 버그 수정 | 실기기 테스트 | 2~3일 |
| App Store 제출 준비 | 스크린샷, 설명 | 1일 |
| **총 예상** | | **7~12일** |

---

## 3. Phase B — iOS / iPad 앱

> Phase A (macOS) 완료 후 진행. Xcode 프로젝트에 iOS 타겟 추가하는 방식.

### 추가 작업 항목

**iOS 특화 네이티브 기능**:
```bash
npm install @capacitor/status-bar    # 상태바 스타일
npm install @capacitor/keyboard      # 키보드 이벤트
npm install @capacitor/haptics       # 햅틱 피드백
```

**Face ID / Touch ID**:
```bash
npm install @aparajita/capacitor-biometric-auth
```

**네이티브 캘린더 접근**:
```bash
npm install @capacitor-community/contacts  # 연락처 연동 (옵션)
```

**iPad 레이아웃**:
- 현재 PC WEB 레이아웃 (`useIsDesktop()` true 분기)이 iPad에서 자동 적용됨
- iPad에서 1024px 이상 시 DesktopXxx 컴포넌트 렌더링 → 별도 작업 최소화

**App Store 제출 요건**:
- iPhone 스크린샷: 6.7인치 (1290×2796) 필수
- iPad 스크린샷: 12.9인치 (2048×2732) 필수
- Privacy Manifest (`PrivacyInfo.xcprivacy`) 추가 필수 (Apple 2024 요건)

---

## 4. Phase C — Android 앱

> Phase B (iOS) 완료 후 진행.

### 주요 특징 (웹/iOS 대비)
- **FCM 이미 연동됨** → 푸시 알림 추가 작업 거의 없음
- Android Studio 설치 필요 (Windows/Linux/Mac 모두 지원)
- 키스토어 파일 생성 (1회) → APK/AAB 서명

### 추가 설치
```bash
npx cap add android
```

### 빌드
```bash
npm run build:native
npx cap sync android
npx cap open android  # Android Studio 열기
# Build → Generate Signed Bundle/APK
```

### Google Play Console 제출
- 앱 등록비: $25 (1회)
- 심사: 수 시간~1일 (iOS 대비 빠름)

---

## 5. 공통 고려사항

### 5-1. API Routes 처리 전략
`next.config.ts`에서 `output: 'export'` 사용 시 `/api/*` 라우트가 비활성화됨.
현재 API Routes:
| 경로 | 기능 | native 빌드 영향 |
|------|------|---------------|
| `/api/cron/reminders` | 일정 리마인더 발송 | Supabase Edge Function으로 이관 가능 |
| `/api/cron/automations` | 자동화 정책 처리 | Supabase Edge Function으로 이관 가능 |
| `/api/notifications/send` | FCM 발송 | Supabase Edge Function으로 이관 가능 |
| `/api/notifications/renotify` | 수동 재알림 | Supabase Edge Function으로 이관 가능 |

→ **권장**: 웹 서비스(`gleaum.com`)의 API Routes를 그대로 유지하고, 앱에서는 웹 API를 호출하는 방식. 또는 Supabase Edge Functions으로 이관.

### 5-2. OAuth 콜백 처리
Google OAuth는 웹 리다이렉트 방식. 앱에서는 Custom URL Scheme 사용:
```
gleaum://auth/callback
```
Supabase Dashboard → Authentication → URL Configuration에 추가 필요.

### 5-3. 오프라인 지원
현재 `sw.js` PWA 서비스워커는 Capacitor 앱에서 동작하지 않음. 오프라인 지원이 필요하면 `@capacitor/preferences` (로컬 스토리지) + 네이티브 캐싱 전략 별도 구현.

### 5-4. 앱 업데이트 전략
- 웹 코드 변경 시: 앱 재빌드 + 스토어 업데이트 제출 (심사 필요)
- **대안**: Capacitor Live Update (`@capacitor/live-updates`) — 스토어 심사 없이 웹 번들만 교체 가능 (유료 Appflow 서비스)

---

## 6. 필요한 계정 및 등록 사항

| 항목 | 비용 | 필요 시점 |
|------|------|---------|
| Apple Developer Program | $99/년 | macOS/iOS 빌드 서명 시 |
| Mac App Store 앱 등록 | 무료 (Apple Developer 포함) | Phase A 제출 시 |
| App Store 앱 등록 | 무료 (Apple Developer 포함) | Phase B 제출 시 |
| Google Play Console | $25 (1회) | Phase C 제출 시 |
| Capacitor Appflow (선택) | 유료 | 라이브 업데이트 필요 시 |

---

## 7. 참고 자료

- Capacitor 공식 문서: https://capacitorjs.com/docs
- Capacitor macOS: https://github.com/capacitor-community/macos
- Apple Developer: https://developer.apple.com
- Google Play Console: https://play.google.com/console
- Supabase Capacitor 가이드: https://supabase.com/docs/guides/getting-started/tutorials/with-capacitor

---

## 8. 현재 진행 상태

```
[완료] 웹 서비스 (gleaum.com) — 전 구간 리디자인, GA4, 성능 최적화
[완료] 계획서 수립 (이 문서)
[대기] Phase A — macOS 앱 개발 시작
```

**다음 작업 시작 조건**:
1. Apple Developer Program 계정 활성화 여부 확인
2. Xcode 최신 버전 설치 확인 (Mac 환경)
3. `@capacitor/core` 설치 및 `capacitor.config.ts` 작성부터 시작
