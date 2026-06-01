/**
 * NativeAd — AdMob 네이티브 광고 Capacitor 플러그인 인터페이스
 *
 * 하우스광고 없을 때 AdMob 네이티브 광고를 인라인으로 표시하는 데 사용.
 * 웹 환경에서는 항상 null 반환 (AdSense 처리).
 */
import { registerPlugin } from '@capacitor/core';

export interface NativeAdData {
  headline:     string;
  body:         string;
  callToAction: string;
  advertiser:   string;
  imageUrl:     string;
  error?:       string;
}

export interface NativeAdPlugin {
  /** 네이티브 광고 로드. 실패 시 error 필드 포함 반환 */
  loadAd(): Promise<NativeAdData>;
  /** 노출 이벤트 기록 */
  reportImpression(): Promise<void>;
}

export const NativeAd = registerPlugin<NativeAdPlugin>('NativeAd', {
  web: () => ({
    async loadAd() {
      return { headline: '', body: '', callToAction: '', advertiser: '', imageUrl: '', error: 'web' };
    },
    async reportImpression() {},
  }),
});
