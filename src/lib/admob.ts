/**
 * 글리움 — Google AdMob 유틸리티
 *
 * 네이티브 앱(iOS/Android)에서만 동작합니다. 웹에서는 모든 함수가 no-op.
 *
 * ── 광고 단위 ───────────────────────────────────────────────────
 * App Open    : ca-app-pub-7426507548879721/5027423989  (GleaumApp.kt 직접 처리)
 * Interstitial: ca-app-pub-7426507548879721/5949776341
 * Inline Banner (홈피드): ca-app-pub-7426507548879721/1438321314
 *
 * ── Interstitial 쿨다운 ─────────────────────────────────────────
 * - 최소 간격: 10분
 * - 일일 최대: 5회
 * - 저장소: localStorage (세션 간 유지)
 */

import { isNativeApp } from '@/lib/native';

// ── 광고 단위 ID ──────────────────────────────────────────────────────────────

const IS_TESTING = process.env.NODE_ENV === 'development';

const AD_UNIT = {
  INTERSTITIAL:    IS_TESTING ? 'ca-app-pub-3940256099942544/1033173712' : 'ca-app-pub-7426507548879721/5949776341',
  INLINE_BANNER:   IS_TESTING ? 'ca-app-pub-3940256099942544/6300978111' : 'ca-app-pub-7426507548879721/1438321314',
} as const;

// ── 테스트 기기 해시 목록 ─────────────────────────────────────────────────────
// AdMob 대시보드에 등록된 테스트 기기의 MD5 해시 (GAID 기준)
// 새 기기 추가: MD5(GAID) 값을 여기에 추가
const TEST_DEVICE_HASHES = [
  '984BF1704E20ADFA3C368E9E7746DF08',  // 갤럭시 테스트폰 (GAID: aef92330-...)
  // iOS IDFA 는 AdMob 대시보드 등록으로만 처리 (코드 추가 불필요)
];

// ── 초기화 ────────────────────────────────────────────────────────────────────

let initialized = false;

export async function initAdMob(): Promise<void> {
  if (!isNativeApp() || initialized) return;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.initialize({
      // 개발 환경: 에뮬레이터 포함 / 프로덕션: 등록된 테스트 기기만
      testingDevices: IS_TESTING
        ? ['EMULATOR', ...TEST_DEVICE_HASHES]
        : TEST_DEVICE_HASHES,
      initializeForTesting: IS_TESTING,
    });
    initialized = true;
  } catch (err) {
    console.warn('[AdMob] 초기화 실패:', err);
  }
}

// ── Interstitial 쿨다운 ───────────────────────────────────────────────────────

const KEY_LAST  = 'admob_intrs_last';   // 마지막 노출 타임스탬프
const KEY_DAY   = 'admob_intrs_day';    // 당일 날짜 문자열
const KEY_COUNT = 'admob_intrs_count';  // 당일 노출 횟수

const COOLDOWN_MS  = 10 * 60 * 1000;   // 10분
const DAILY_LIMIT  = 5;                 // 일 5회 상한

function canShowInterstitial(): boolean {
  if (typeof localStorage === 'undefined') return false;

  const now  = Date.now();
  const last = parseInt(localStorage.getItem(KEY_LAST) ?? '0', 10);
  if (now - last < COOLDOWN_MS) return false;

  const today = new Date().toDateString();
  const day   = localStorage.getItem(KEY_DAY);
  const count = day === today ? parseInt(localStorage.getItem(KEY_COUNT) ?? '0', 10) : 0;
  return count < DAILY_LIMIT;
}

function recordInterstitialShown(): void {
  if (typeof localStorage === 'undefined') return;
  const today = new Date().toDateString();
  const day   = localStorage.getItem(KEY_DAY);
  const prev  = day === today ? parseInt(localStorage.getItem(KEY_COUNT) ?? '0', 10) : 0;

  localStorage.setItem(KEY_LAST,  Date.now().toString());
  localStorage.setItem(KEY_DAY,   today);
  localStorage.setItem(KEY_COUNT, (prev + 1).toString());
}

// ── Interstitial ──────────────────────────────────────────────────────────────

let interstitialReady = false;

/**
 * Interstitial 미리 로드 — 페이지 마운트 시 호출
 * 저장/제출 버튼 클릭 시 이미 로드돼 있도록 선제적으로 준비합니다.
 */
export async function prepareInterstitial(): Promise<void> {
  if (!isNativeApp() || !canShowInterstitial()) return;
  try {
    if (!initialized) await initAdMob();
    const { AdMob, InterstitialAdPluginEvents } = await import('@capacitor-community/admob');

    interstitialReady = false;
    const handle = await AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
      interstitialReady = true;
      void handle.remove();
    });

    await AdMob.prepareInterstitial({ adId: AD_UNIT.INTERSTITIAL, isTesting: IS_TESTING });
  } catch (err) {
    console.warn('[AdMob] Interstitial 준비 실패:', err);
  }
}

/**
 * Interstitial 표시 후 콜백 실행
 *
 * 광고 표시 불가(미로드·쿨다운) 시 즉시 onComplete 호출.
 * 광고 종료 또는 표시 실패 시 onComplete 호출.
 * 안전 타임아웃(30초) 후 강제 onComplete 호출.
 *
 * @param onComplete 광고가 닫힌 뒤(또는 건너뜀) 실행할 콜백
 */
export async function showInterstitialThenDo(onComplete: () => void): Promise<void> {
  if (!isNativeApp() || !canShowInterstitial()) {
    onComplete();
    return;
  }

  try {
    if (!initialized) await initAdMob();
    const { AdMob, InterstitialAdPluginEvents } = await import('@capacitor-community/admob');

    let done = false;
    const finish = () => {
      if (!done) { done = true; onComplete(); }
    };

    // 광고 종료 & 표시 실패 리스너
    const hDismiss = await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      void hDismiss.remove(); void hFail.remove(); finish();
    });
    const hFail = await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => {
      void hDismiss.remove(); void hFail.remove(); finish();
    });

    // 30초 안전 타임아웃
    const timer = setTimeout(() => {
      void hDismiss.remove(); void hFail.remove(); finish();
    }, 30_000);

    try {
      await AdMob.showInterstitial();
      recordInterstitialShown();
      interstitialReady = false;
    } catch {
      clearTimeout(timer);
      void hDismiss.remove(); void hFail.remove(); finish();
    }
  } catch (err) {
    console.warn('[AdMob] Interstitial 표시 실패:', err);
    onComplete();
  }
}

/**
 * Interstitial만 표시 (탐색 없이 — 가계부 등록 후 사용)
 */
export async function showInterstitial(): Promise<void> {
  return showInterstitialThenDo(() => {});
}

// ── 인라인 배너 (홈피드) ──────────────────────────────────────────────────────

let inlineBannerShowing = false;

/**
 * 인라인 홈피드 배너 표시
 * @param marginFromTop 화면 상단으로부터의 CSS px 거리 (sticky 헤더 bottom 위치)
 */
export async function showInlineBanner(marginFromTop: number): Promise<void> {
  if (!isNativeApp() || inlineBannerShowing) return;
  try {
    if (!initialized) await initAdMob();
    const { AdMob, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');
    await AdMob.showBanner({
      adId:      AD_UNIT.INLINE_BANNER,
      adSize:    BannerAdSize.ADAPTIVE_BANNER,
      position:  BannerAdPosition.TOP_CENTER,
      margin:    Math.round(marginFromTop),
      isTesting: IS_TESTING,
    });
    inlineBannerShowing = true;
  } catch (err) {
    console.warn('[AdMob] 인라인 배너 표시 실패:', err);
  }
}

/**
 * 인라인 배너 숨김
 */
export async function hideInlineBanner(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.hideBanner();
    inlineBannerShowing = false;
  } catch (err) {
    console.warn('[AdMob] 인라인 배너 숨김 실패:', err);
  }
}

/**
 * 인라인 배너 제거 (완전히 파괴)
 */
export async function removeInlineBanner(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.removeBanner();
    inlineBannerShowing = false;
  } catch (err) {
    console.warn('[AdMob] 인라인 배너 제거 실패:', err);
  }
}

// ── 레거시 호환 ───────────────────────────────────────────────────────────────
/** @deprecated removeInlineBanner() 를 사용하세요 */
export const removeBanner = removeInlineBanner;
/** @deprecated hideInlineBanner() 를 사용하세요 */
export const hideBanner = hideInlineBanner;
