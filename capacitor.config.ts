import type { CapacitorConfig } from '@capacitor/cli';

/**
 * 글리움 Capacitor 설정
 *
 * 배포 전략:
 *  - 네이티브 앱은 Vercel에 배포된 웹 앱(https://www.gleaum.com)을
 *    서버로 사용합니다 (server.url 방식).
 *  - 이 방식은 /api 라우트, /auth/callback 등 서버 기능을 그대로 활용하면서
 *    iOS/Android 네이티브 플러그인(푸시, 햅틱 등)을 추가하는 하이브리드 방식입니다.
 *
 * 개발 시:
 *  CAP_DEV_SERVER_URL=http://192.168.x.x:3000 npx cap run ios
 *  → 로컬 Next.js 서버를 가리킵니다.
 *
 * 프로덕션 빌드 후 배포:
 *  npm run build → git push (Vercel 자동 배포) → npx cap sync → Xcode/Android Studio에서 제출
 */

const devServerUrl = process.env.CAP_DEV_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.gleaum.app',
  appName: '글리움',
  webDir: 'out', // 오프라인 fallback용 (사용되지 않을 수 있음)

  // ── 서버 설정: 프로덕션 URL 직접 로드 ─────────────────────────────────────
  server: {
    url: devServerUrl ?? 'https://www.gleaum.com',
    cleartext: false,           // HTTPS만 허용 (HTTP 차단)
    androidScheme: 'https',     // Android WebView scheme
    // allowNavigation: []      // 외부 도메인 허용 목록 (필요 시 추가)
  },

  // ── iOS / macOS 설정 ───────────────────────────────────────────────────────
  ios: {
    scheme: 'gleaum',            // Custom URL scheme: gleaum://
    contentInset: 'automatic',   // Safe area inset 자동 처리
    scrollEnabled: true,         // 서버 로드 방식에서는 WebView 스크롤 필요
    backgroundColor: '#0F1A2E',  // 스플래시 제거 전 배경색 (다크 네이비)
    preferredContentMode: 'mobile',
    webContentsDebuggingEnabled: !!devServerUrl,  // 개발 시에만 활성
    limitsNavigationsToAppBoundDomains: true,
    // ⚠️ Info.plist > WKAppBoundDomains 에 gleaum.com 등록 필요
  },

  // ── Android 설정 ──────────────────────────────────────────────────────────
  android: {
    buildOptions: {
      keystorePath: process.env.ANDROID_KEYSTORE_PATH,
      keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
      keystoreAlias: process.env.ANDROID_KEY_ALIAS,
      keystoreAliasPassword: process.env.ANDROID_KEY_PASSWORD,
    },
    backgroundColor: '#0F1A2E',
    allowMixedContent: false,
    webContentsDebuggingEnabled: !!devServerUrl,
  },

  // ── 플러그인 설정 ─────────────────────────────────────────────────────────
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0F1A2E',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },

    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0F1A2E',
      overlaysWebView: false,
    },

    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },

    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#0084CC',
      sound: 'beep.wav',
    },
  },
};

export default config;
