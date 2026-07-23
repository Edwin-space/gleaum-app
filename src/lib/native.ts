/**
 * 글리움 네이티브 앱 유틸리티
 *
 * Capacitor 플러그인을 래핑하여 웹/네이티브 환경을 통합 처리합니다.
 * 웹 환경에서는 기본 Web API로 폴백, 네이티브 환경에서는 플러그인 사용.
 */

// ── 환경 감지 ─────────────────────────────────────────────────────────────────

/** 현재 Capacitor 네이티브 앱 환경 여부 */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  // Capacitor가 주입하는 글로벌 객체
  return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    ?.isNativePlatform?.();
}

/** 현재 플랫폼 문자열 반환 */
export function getNativePlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const platform = cap?.getPlatform?.();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'web';
}

/**
 * Mac Catalyst 환경 감지
 *
 * Capacitor는 Mac Catalyst에서도 getPlatform() = 'ios'를 반환합니다.
 * userAgent의 'Macintosh' 포함 여부로 실제 macOS 실행을 구분합니다.
 *
 * iOS/iPadOS → false
 * Mac Catalyst → true
 * 웹 브라우저(macOS Safari) → false (isNativeApp() 체크로 배제)
 */
export function isMacCatalyst(): boolean {
  if (!isNativeApp()) return false;
  if (typeof navigator === 'undefined') return false;
  return getNativePlatform() === 'ios' && navigator.userAgent.includes('Macintosh');
}

// ── 보안 스토리지 (iOS Keychain / Android EncryptedSharedPreferences) ─────────

/**
 * 네이티브 환경: @capacitor/preferences (암호화된 저장소)
 * 웹 환경: localStorage (sessionStorage는 탭 닫으면 삭제되어 부적합)
 */
export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    if (isNativeApp()) {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },

  async get(key: string): Promise<string | null> {
    if (isNativeApp()) {
      const { Preferences } = await import('@capacitor/preferences');
      const { value } = await Preferences.get({ key });
      return value;
    } else {
      return localStorage.getItem(key);
    }
  },

  async remove(key: string): Promise<void> {
    if (isNativeApp()) {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },

  async clear(): Promise<void> {
    if (isNativeApp()) {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  },
};

// ── 햅틱 피드백 ───────────────────────────────────────────────────────────────

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * 네이티브 햅틱 피드백
 * 웹에서는 Vibration API 폴백, 지원 안 하면 조용히 무시
 */
export async function haptic(style: HapticStyle = 'light'): Promise<void> {
  if (isNativeApp()) {
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');

    switch (style) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning });
        break;
      case 'error':
        await Haptics.notification({ type: NotificationType.Error });
        break;
    }
  } else {
    // 웹 폴백: Vibration API
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      const durationMap: Record<HapticStyle, number | number[]> = {
        light: 10,
        medium: 20,
        heavy: 40,
        success: [10, 50, 10],
        warning: [20, 100, 20],
        error: [50, 100, 50],
      };
      navigator.vibrate(durationMap[style]);
    }
  }
}

// ── 스플래시 스크린 ───────────────────────────────────────────────────────────

/** 앱 로드 완료 후 스플래시 숨기기 */
export async function hideSplash(): Promise<void> {
  if (isNativeApp()) {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 300 });
  }
}

// ── 상태바 제어 ───────────────────────────────────────────────────────────────

/**
 * 상태바 스타일 설정 (다크 배경 위: Light 텍스트)
 * Mac Catalyst는 상태바 개념이 없으므로 자동 스킵
 */
export async function setStatusBarDark(): Promise<void> {
  if (isNativeApp() && getNativePlatform() === 'ios' && !isMacCatalyst()) {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0F1A2E' });
  }
}

/**
 * 상태바 스타일 설정 (밝은 배경 위: Dark 텍스트)
 * Mac Catalyst는 상태바 개념이 없으므로 자동 스킵
 */
export async function setStatusBarLight(): Promise<void> {
  if (isNativeApp() && getNativePlatform() === 'ios' && !isMacCatalyst()) {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#FAFAFD' });
  }
}

export type NativeThemeMode = 'light' | 'dark' | 'system';

function resolveNativeTheme(mode: NativeThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * 네이티브 앱의 시스템바를 앱 화면 모드와 동기화합니다.
 * Android는 MainActivity의 JS bridge를 통해 navigation bar까지 함께 갱신합니다.
 */
export async function applyNativeSystemBars(mode: NativeThemeMode): Promise<void> {
  if (!isNativeApp()) return;

  const resolved = resolveNativeTheme(mode);
  const platform = getNativePlatform();

  if (platform === 'android') {
    const bridge = (window as unknown as {
      GleaumNativeTheme?: { setThemeMode?: (mode: NativeThemeMode) => void };
    }).GleaumNativeTheme;
    bridge?.setThemeMode?.(mode);
    return;
  }

  if (platform === 'ios' && !isMacCatalyst()) {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: resolved === 'dark' ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: resolved === 'dark' ? '#0F172A' : '#FAFAFD' });
  }
}

// ── OAuth / 브라우저 ──────────────────────────────────────────────────────────

/**
 * OAuth용 브라우저 열기
 *
 * ▸ Android: App.openUrl → 시스템 브라우저(일반 Chrome)로 오픈
 *   Chrome Custom Tab(CCT)은 OAuth 완료 후 gleaum:// 딥링크를 앱에
 *   전달하지 못하는 버그가 있음. 시스템 브라우저는 커스텀 스킴 Intent를
 *   정상적으로 처리하므로 appUrlOpen이 올바르게 발화됨.
 *
 * ▸ iOS: @capacitor/browser (SFSafariViewController) — 문제 없음
 * ▸ Web: window.location.href
 */
export async function openBrowser(url: string): Promise<void> {
  if (!isNativeApp()) {
    window.location.href = url;
    return;
  }

  const platform = getNativePlatform();

  if (platform === 'android') {
    // Android: CCT(Chrome Custom Tab)가 gleaum:// Intent를 앱에 전달하지 않는 버그 우회.
    // Browser.open()은 내부적으로 CCT를 사용하므로 동일한 문제 발생.
    // 대신 window.open으로 열면 Capacitor WebView가 shouldOverrideUrlLoading을 통해
    // 시스템 Intent(ACTION_VIEW)로 라우팅 → 일반 Chrome에서 열림.
    window.open(url, '_blank');
  } else {
    // iOS: SFSafariViewController (CCT 문제 없음)
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({
      url,
      toolbarColor: '#1A1B2E',
      presentationStyle: 'fullscreen',
    });
  }
}

/** 인앱 브라우저 닫기 (Android 시스템 브라우저는 닫을 수 없으므로 iOS 전용) */
export async function closeBrowser(): Promise<void> {
  if (!isNativeApp() || getNativePlatform() === 'android') return;
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.close();
  } catch {
    // 이미 닫혀 있으면 무시
  }
}

// ── 앱 생명주기 ───────────────────────────────────────────────────────────────

/**
 * 앱이 포그라운드로 돌아올 때 콜백 등록
 * (세션 만료 체크, 데이터 새로고침 등에 활용)
 */
export async function onAppResume(callback: () => void): Promise<() => void> {
  if (isNativeApp()) {
    const { App } = await import('@capacitor/app');
    const handle = await App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) callback();
    });
    return () => handle.remove();
  }
  // 웹 폴백: visibilitychange 이벤트
  const handler = () => {
    if (document.visibilityState === 'visible') callback();
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}

/**
 * Android 뒤로가기 버튼 처리
 * 기본 동작(앱 종료)을 막고 커스텀 핸들러 실행
 */
export async function onAndroidBackButton(callback: () => void): Promise<() => void> {
  if (isNativeApp() && getNativePlatform() === 'android') {
    const { App } = await import('@capacitor/app');
    const handle = await App.addListener('backButton', callback);
    return () => handle.remove();
  }
  return () => {};
}

// ── 앱 버전 ───────────────────────────────────────────────────────────────────

export interface AppVersionInfo {
  /** 설치된 네이티브 앱 버전 (예: "1.0.2"). 웹이면 null. */
  installedVersion: string | null;
  /** 빌드 번호 (예: "102"). 웹이면 null. */
  buildNumber: string | null;
  /** 실행 환경 */
  platform: 'ios' | 'android' | 'web';
}

/**
 * 설치된 앱 버전 정보 조회
 * - 네이티브(iOS/Android): @capacitor/app App.getInfo() 사용
 * - 웹: installedVersion = null
 */
export async function getAppVersionInfo(): Promise<AppVersionInfo> {
  const platform = getNativePlatform();
  if (!isNativeApp()) {
    return { installedVersion: null, buildNumber: null, platform: 'web' };
  }
  try {
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    return {
      installedVersion: info.version,
      buildNumber: info.build,
      platform: platform as 'ios' | 'android',
    };
  } catch {
    return { installedVersion: null, buildNumber: null, platform: platform as 'ios' | 'android' };
  }
}
