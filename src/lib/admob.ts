/**
 * 글리움 — Google AdMob 유틸리티
 *
 * 네이티브 앱(iOS/Android)에서만 동작. 웹에서는 모든 함수가 no-op.
 *
 * ── 광고 단위 ID ──────────────────────────────────────────────
 * Android Banner: ca-app-pub-7426507548879721/6211229285
 *
 * ── 배너 동작 방식 ─────────────────────────────────────────────
 * AdMob 배너는 WebView 위에 얹히는 네이티브 뷰입니다.
 * showBannerAt(yPx) 호출 시 TOP_CENTER + margin 으로 특정 Y 위치에 표시됩니다.
 */

import { isNativeApp } from '@/lib/native';

// ── 광고 단위 ID ──────────────────────────────────────────────────────────────
const AD_UNIT = {
  // 테스트 ID (개발/디버그 빌드에서 사용)
  BANNER_TEST: 'ca-app-pub-3940256099942544/6300978111',
  // 실제 배너 ID — 프로덕션 빌드에서 사용
  BANNER_ANDROID: 'ca-app-pub-7426507548879721/6211229285',
} as const;

// 개발 환경에서는 테스트 광고 ID 사용
const IS_TESTING = process.env.NODE_ENV === 'development';
const BANNER_AD_UNIT = IS_TESTING ? AD_UNIT.BANNER_TEST : AD_UNIT.BANNER_ANDROID;

let initialized = false;

/**
 * AdMob 초기화 — 앱 시작 시 1회 호출
 * (FirebaseServicesProvider 또는 첫 광고 표시 전에 호출됨)
 */
export async function initAdMob(): Promise<void> {
  if (!isNativeApp() || initialized) return;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.initialize({
      // 테스트 기기 지정 시 여기에 IDFA/GAID 추가
      testingDevices: IS_TESTING ? ['EMULATOR'] : [],
      initializeForTesting: IS_TESTING,
    });
    initialized = true;
  } catch (err) {
    console.warn('[AdMob] 초기화 실패:', err);
  }
}

/**
 * 홈 배너 표시
 * @param marginFromTop 화면 최상단으로부터의 거리(px)
 */
export async function showHomeBanner(marginFromTop: number): Promise<void> {
  if (!isNativeApp()) return;
  try {
    if (!initialized) await initAdMob();
    const { AdMob, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');
    await AdMob.showBanner({
      adId:     BANNER_AD_UNIT,
      adSize:   BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.TOP_CENTER,
      margin:   Math.round(marginFromTop),
      isTesting: IS_TESTING,
    });
  } catch (err) {
    console.warn('[AdMob] 배너 표시 실패:', err);
  }
}

/**
 * 배너 숨김 (다른 탭으로 이동 시)
 */
export async function hideBanner(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.hideBanner();
  } catch (err) {
    console.warn('[AdMob] 배너 숨김 실패:', err);
  }
}

/**
 * 배너 제거 (완전히 파괴)
 */
export async function removeBanner(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.removeBanner();
  } catch (err) {
    console.warn('[AdMob] 배너 제거 실패:', err);
  }
}
