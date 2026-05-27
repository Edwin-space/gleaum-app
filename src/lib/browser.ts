/**
 * 인앱 브라우저(WebView) 감지 유틸리티
 *
 * Google OAuth는 Android WebView / iOS WKWebView 등 앱 내부 브라우저에서
 * 403 disallowed_useragent 에러가 발생함.
 * 이 경우 사용자에게 외부 브라우저(Chrome / Safari)에서 열도록 안내해야 함.
 *
 * Android: Chrome intent: scheme으로 자동 리다이렉트 시도 가능
 * iOS: WKWebView에서 window.location 변경 시 Safari로 이동 불가 — 수동 안내만 가능
 */

export interface BlockedBrowserInfo {
  appName: string;
  /** 사용자에게 보여줄 외부 브라우저 열기 방법 안내 */
  instruction: string;
  /** Android에서 Chrome intent: scheme으로 즉시 리다이렉트 가능 여부 */
  canAutoRedirect: boolean;
  /** iOS 기기 여부 (URL 복사 후 Safari로 열기 안내에 활용) */
  isIOS: boolean;
}

/**
 * 현재 환경이 Google OAuth가 차단되는 인앱 브라우저인지 확인.
 * 서버 사이드에서는 null 반환.
 */
export function getBlockedBrowserInfo(): BlockedBrowserInfo | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  // iPhone/iPad/iPod — iOS 13+ iPad는 "Macintosh" UA를 쓰기도 하므로 maxTouchPoints 함께 확인
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1);

  // 카카오톡
  if (/KAKAOTALK/i.test(ua)) {
    return {
      appName: '카카오톡',
      instruction: isAndroid
        ? '오른쪽 상단 ⋯ → "다른 앱으로 열기" 또는 "브라우저로 열기"를 탭해 주세요'
        : '오른쪽 하단 공유(↑) 또는 상단 ⋯ → "Safari로 열기"를 탭해 주세요',
      canAutoRedirect: isAndroid,
      isIOS,
    };
  }

  // 네이버 앱
  if (/NAVER\b/i.test(ua)) {
    return {
      appName: '네이버',
      instruction: isAndroid
        ? '상단 주소창 옆 ⋯ → "외부 브라우저로 열기"를 탭해 주세요'
        : '하단 공유(↑) → "Safari에서 열기"를 탭해 주세요',
      canAutoRedirect: isAndroid,
      isIOS,
    };
  }

  // 인스타그램
  if (/Instagram/i.test(ua)) {
    return {
      appName: '인스타그램',
      instruction: isAndroid
        ? '오른쪽 하단 ⋯ → "Chrome에서 열기"를 탭해 주세요'
        : '오른쪽 하단 ⋯ → "Safari에서 열기"를 탭해 주세요',
      canAutoRedirect: isAndroid,
      isIOS,
    };
  }

  // 페이스북
  if (/FBAN|FBAV/i.test(ua)) {
    return {
      appName: '페이스북',
      instruction: isAndroid
        ? '오른쪽 상단 ⋯ → "브라우저에서 열기"를 탭해 주세요'
        : '오른쪽 하단 ⋯ → "Safari에서 열기"를 탭해 주세요',
      canAutoRedirect: isAndroid,
      isIOS,
    };
  }

  // 라인
  if (/Line\//i.test(ua)) {
    return {
      appName: '라인',
      instruction: isAndroid
        ? '오른쪽 상단 ⋯ → "브라우저로 열기"를 탭해 주세요'
        : '오른쪽 상단 ⋯ → "Safari에서 열기"를 탭해 주세요',
      canAutoRedirect: isAndroid,
      isIOS,
    };
  }

  // 네이버 밴드
  if (/BAND\b/i.test(ua)) {
    return {
      appName: '밴드',
      instruction: isAndroid
        ? '상단 ⋯ → "브라우저로 열기"를 탭해 주세요'
        : '상단 ⋯ → "Safari로 열기"를 탭해 주세요',
      canAutoRedirect: isAndroid,
      isIOS,
    };
  }

  // 트위터/X
  if (/Twitter/i.test(ua)) {
    return {
      appName: 'X(트위터)',
      instruction: isAndroid
        ? '오른쪽 상단 ⋯ → "브라우저에서 열기"를 탭해 주세요'
        : '오른쪽 상단 ⋯ → "Safari에서 열기"를 탭해 주세요',
      canAutoRedirect: isAndroid,
      isIOS,
    };
  }

  // 토스
  if (/TossApp/i.test(ua)) {
    return {
      appName: '토스',
      instruction: isAndroid
        ? '상단 ⋯ → "브라우저로 열기"를 탭해 주세요'
        : '상단 공유(↑) → "Safari로 열기"를 탭해 주세요',
      canAutoRedirect: isAndroid,
      isIOS,
    };
  }

  // 당근마켓
  if (/Daangn|karrot/i.test(ua)) {
    return {
      appName: '당근마켓',
      instruction: isAndroid
        ? '상단 ⋯ → "브라우저로 열기"를 탭해 주세요'
        : '상단 공유(↑) → "Safari로 열기"를 탭해 주세요',
      canAutoRedirect: isAndroid,
      isIOS,
    };
  }

  // 유튜브 앱 내 브라우저
  if (/com\.google\.android\.youtube/i.test(ua)) {
    return {
      appName: '유튜브',
      instruction: '상단 ⋯ → "브라우저에서 열기"를 탭해 주세요',
      canAutoRedirect: true,
      isIOS: false,
    };
  }

  // 범용 Android WebView (인앱 브라우저 일반, ;wv 플래그)
  if (isAndroid && /\bwv\b/.test(ua)) {
    return {
      appName: '앱 내부 브라우저',
      instruction: '주소창의 URL을 복사하여 Chrome에서 열어 주세요',
      canAutoRedirect: true,
      isIOS: false,
    };
  }

  // 범용 iOS WKWebView 감지
  // Safari는 UA에 "Safari"가 있고 "CriOS"(Chrome iOS), "FxiOS"(Firefox iOS) 등도 있음.
  // WKWebView는 "Safari"가 없고 "Mobile"은 있음. "GSA"(Google 앱), "DuckDuckGo" 등도 해당.
  if (isIOS) {
    // CriOS = Chrome iOS, FxiOS = Firefox iOS — 이들은 WKWebView지만 OAuth가 동작함
    const isSafariOrTrustedBrowser =
      /Safari\//i.test(ua) || /CriOS/i.test(ua) || /FxiOS/i.test(ua) || /EdgiOS/i.test(ua);
    if (!isSafariOrTrustedBrowser) {
      return {
        appName: '앱 내부 브라우저',
        instruction: '상단 또는 하단 공유(↑) → "Safari로 열기"를 탭해 주세요',
        canAutoRedirect: false,
        isIOS: true,
      };
    }
  }

  return null;
}

/**
 * Android에서 Chrome intent: scheme을 이용해 현재 URL을 Chrome으로 강제 오픈.
 * 카카오톡/네이버 등 일부 앱에서 동작함.
 * iOS에서는 사용 불가 (canAutoRedirect === false).
 */
export function tryOpenInChrome(url: string): void {
  const stripped = url.replace(/^https?:\/\//, '');
  window.location.href = `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;end`;
}
