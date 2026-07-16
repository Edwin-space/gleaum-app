package com.gleaum.app

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.gms.ads.AdListener
import com.google.android.gms.ads.AdLoader
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.nativead.NativeAd
import com.google.android.gms.ads.nativead.NativeAdOptions

/**
 * NativeAdPlugin — AdMob 네이티브 광고를 JavaScript 에 노출하는 Capacitor 플러그인
 *
 * 흐름:
 *   JS: NativeAdPlugin.loadAd() 호출
 *   → Android: NativeAd 로드
 *   → JS: 광고 에셋(headline, body, imageUrl, callToAction) 반환
 *   → JS: InlineFeedAd / AdSlot 컴포넌트에서 인라인 렌더링
 *
 * 하우스광고 없을 때 폴백으로 사용.
 */
@CapacitorPlugin(name = "NativeAd")
class NativeAdPlugin : Plugin() {

    companion object {
        private const val AD_UNIT_ID = "ca-app-pub-7426507548879721/1438321314" // 홈-중단영역 네이티브 고급형
        private const val AD_UNIT_ID_TEST = "ca-app-pub-3940256099942544/2247696110" // 테스트용
        private val IS_DEBUG = BuildConfig.DEBUG
    }

    private var currentNativeAd: NativeAd? = null

    /**
     * 네이티브 광고 로드 요청
     * JS: const { ad } = await NativeAd.loadAd();
     * 반환: { headline, body, imageUrl, callToAction, advertiser } or { ad: null }
     */
    @PluginMethod
    fun loadAd(call: PluginCall) {
        if (!NativeAccountContextStore.capabilities(context).canShowAds) {
            currentNativeAd?.destroy()
            currentNativeAd = null
            call.resolve(JSObject().apply { put("ad", null) })
            return
        }
        val adUnitId = if (IS_DEBUG) AD_UNIT_ID_TEST else AD_UNIT_ID

        activity.runOnUiThread {
            try {
                // 이전 광고 해제
                currentNativeAd?.destroy()
                currentNativeAd = null

                val adLoader = AdLoader.Builder(activity, adUnitId)
                    .forNativeAd { nativeAd ->
                        if (!NativeAccountContextStore.capabilities(context).canShowAds) {
                            nativeAd.destroy()
                            call.resolve(JSObject().apply { put("ad", null) })
                            return@forNativeAd
                        }
                        currentNativeAd = nativeAd
                        val imageUrl = nativeAd.images.firstOrNull()?.uri?.toString()
                        android.util.Log.d("NativeAdPlugin", "광고 로드 성공: ${nativeAd.headline}")
                        call.resolve(JSObject().apply {
                            put("headline",    nativeAd.headline     ?: "")
                            put("body",        nativeAd.body         ?: "")
                            put("callToAction",nativeAd.callToAction  ?: "더 알아보기")
                            put("advertiser",  nativeAd.advertiser   ?: "")
                            put("imageUrl",    imageUrl              ?: "")
                        })
                    }
                    .withAdListener(object : AdListener() {
                        override fun onAdFailedToLoad(error: LoadAdError) {
                            android.util.Log.e("NativeAdPlugin", "광고 로드 실패: ${error.message} (code=${error.code})")
                            // 실패 시에도 resolve (null 체크는 JS에서)
                            call.resolve(JSObject().apply {
                                put("error", "code=${error.code}: ${error.message}")
                            })
                        }
                    })
                    .withNativeAdOptions(
                        NativeAdOptions.Builder()
                            .setAdChoicesPlacement(NativeAdOptions.ADCHOICES_TOP_RIGHT)
                            .build()
                    )
                    .build()

                adLoader.loadAd(AdRequest.Builder().build())
            } catch (e: Exception) {
                android.util.Log.e("NativeAdPlugin", "광고 로드 실패: ${e.message}")
                call.resolve(JSObject().apply { put("error", e.message) })
            }
        }
    }

    /** 광고 클릭 시 호출 (노출 이벤트 기록) */
    @PluginMethod
    fun reportImpression(call: PluginCall) {
        // NativeAd SDK가 자동 처리하므로 현재는 단순 resolve
        call.resolve()
    }

    /** 플러그인 소멸 시 광고 리소스 해제 */
    override fun handleOnDestroy() {
        currentNativeAd?.destroy()
        currentNativeAd = null
        super.handleOnDestroy()
    }
}
