package com.gleaum.app

import android.util.Log
import androidx.fragment.app.FragmentActivity
import com.kakao.adfit.ads.popup.AdFitPopupAd
import com.kakao.adfit.ads.popup.AdFitPopupAdDialogFragment
import com.kakao.adfit.ads.popup.AdFitPopupAdLoader
import com.kakao.adfit.ads.popup.AdFitPopupAdRequest

/**
 * Kakao AdFit Android Native Ad Manager.
 *
 * Managing App Transition Ads and App Exit Popup Ads.
 */
object NativeAdFitManager {
    private const val TAG = "GleaumAdFit"

    // ── Kakao AdFit Ad Unit IDs ───────────────────────────────────────
    const val ADFIT_HOME_LAUNCH_ID = "DAN-Brd0FQAE3ByDWwJu"          // 홈/스플래시 앱 진입 전환 팝업
    const val ADFIT_SCHEDULE_TRANSITION_ID = "DAN-VG6AtTLdBJTNevr6" // 일정 등록 완료 후 전환 팝업
    const val ADFIT_APP_EXIT_ID = "DAN-41h5P4d0nqgrMVmK"             // 뒤로가기 앱 종료 팝업

    private var exitAdLoader: AdFitPopupAdLoader? = null
    private var preloadedExitAd: AdFitPopupAd? = null

    /**
     * 일정 등록 완료 후 일정 화면으로 복귀할 때 띄우는 앱 전환 팝업 광고
     */
    fun showScheduleTransitionAd(activity: FragmentActivity) {
        if (activity.isFinishing || activity.isDestroyed || !NativeAccountContextStore.capabilities(activity).canShowAds) {
            return
        }

        val loader = AdFitPopupAdLoader.create(activity, ADFIT_SCHEDULE_TRANSITION_ID)
        if (loader.isBlockedByRequestPolicy) {
            Log.d(TAG, "Schedule transition ad blocked by request policy")
            return
        }

        val request = AdFitPopupAdRequest.Builder(AdFitPopupAd.Type.Transition)
            .setTestModeEnabled(BuildConfig.DEBUG)
            .build()

        loader.loadAd(
            request,
            object : AdFitPopupAdLoader.OnAdLoadListener {
                override fun onAdLoaded(ad: AdFitPopupAd) {
                    if (activity.isFinishing || activity.isDestroyed || !NativeAccountContextStore.capabilities(activity).canShowAds) {
                        loader.destroy()
                        return
                    }
                    activity.runOnUiThread {
                        runCatching {
                            AdFitPopupAdDialogFragment.Builder(ad)
                                .setNavigationBarColor(
                                    NativeTheme.background(activity),
                                    !NativeTheme.isDark(activity)
                                )
                                .build()
                                .show(activity.supportFragmentManager, AdFitPopupAdDialogFragment.TAG)
                        }.onFailure {
                            Log.w(TAG, "Schedule transition ad show failed", it)
                        }
                    }
                }

                override fun onAdLoadError(errorCode: Int) {
                    Log.w(TAG, "Schedule transition ad load error: $errorCode")
                }
            }
        )
    }

    /**
     * 앱 화면(홈/메인) 진입 시 앱 종료 광고를 사전 로드합니다.
     */
    fun preloadExitAd(activity: FragmentActivity) {
        if (activity.isFinishing || activity.isDestroyed || !NativeAccountContextStore.capabilities(activity).canShowAds) {
            return
        }
        if (preloadedExitAd != null) return

        val loader = AdFitPopupAdLoader.create(activity, ADFIT_APP_EXIT_ID)
        exitAdLoader = loader

        val request = AdFitPopupAdRequest.Builder(AdFitPopupAd.Type.Exit)
            .setTestModeEnabled(BuildConfig.DEBUG)
            .build()

        loader.loadAd(
            request,
            object : AdFitPopupAdLoader.OnAdLoadListener {
                override fun onAdLoaded(ad: AdFitPopupAd) {
                    if (activity.isFinishing || activity.isDestroyed) {
                        return
                    }
                    preloadedExitAd = ad
                    Log.d(TAG, "App exit ad preloaded successfully")
                }

                override fun onAdLoadError(errorCode: Int) {
                    Log.w(TAG, "App exit ad preload error: $errorCode")
                }
            }
        )
    }

    /**
     * 뒤로가기 키로 앱을 종료하는 구간에서 띄우는 앱 종료 팝업 광고.
     * 사전 로드된 광고가 있으면 즉시 띄우고, 없으면 라이브 요청 후 팝업을 표시합니다.
     */
    fun handleAppExitWithAd(activity: FragmentActivity, onFallbackExit: () -> Unit = { activity.finishAffinity() }) {
        if (activity.isFinishing || activity.isDestroyed || !NativeAccountContextStore.capabilities(activity).canShowAds) {
            onFallbackExit()
            return
        }

        // FragmentResultListener 등록: AdFit 팝업 액션(종료, 닫기 등) 수신 시 앱 종료
        activity.supportFragmentManager.setFragmentResultListener(
            AdFitPopupAdDialogFragment.REQUEST_KEY_POPUP_AD,
            activity
        ) { _, bundle ->
            val eventType = bundle.getString(AdFitPopupAdDialogFragment.BUNDLE_KEY_EVENT_TYPE)
            Log.d(TAG, "Exit ad popup event: $eventType")
            when (eventType) {
                AdFitPopupAdDialogFragment.EVENT_EXIT_CONFIRMED,
                AdFitPopupAdDialogFragment.EVENT_POPUP_DISMISSED,
                AdFitPopupAdDialogFragment.EVENT_POPUP_CANCELED,
                AdFitPopupAdDialogFragment.EVENT_BACK_PRESSED -> {
                    activity.finishAffinity()
                }
            }
        }

        val ad = preloadedExitAd
        if (ad != null) {
            preloadedExitAd = null
            runCatching {
                AdFitPopupAdDialogFragment.Builder(ad)
                    .setNavigationBarColor(
                        NativeTheme.background(activity),
                        !NativeTheme.isDark(activity)
                    )
                    .build()
                    .show(activity.supportFragmentManager, AdFitPopupAdDialogFragment.TAG)
            }.onFailure {
                Log.w(TAG, "Preloaded exit ad show failed", it)
                onFallbackExit()
            }
            return
        }

        val loader = AdFitPopupAdLoader.create(activity, ADFIT_APP_EXIT_ID)
        val request = AdFitPopupAdRequest.Builder(AdFitPopupAd.Type.Exit)
            .setTestModeEnabled(BuildConfig.DEBUG)
            .build()

        val requested = loader.loadAd(
            request,
            object : AdFitPopupAdLoader.OnAdLoadListener {
                override fun onAdLoaded(loadedAd: AdFitPopupAd) {
                    if (activity.isFinishing || activity.isDestroyed || !NativeAccountContextStore.capabilities(activity).canShowAds) {
                        onFallbackExit()
                        return
                    }
                    activity.runOnUiThread {
                        runCatching {
                            AdFitPopupAdDialogFragment.Builder(loadedAd)
                                .setNavigationBarColor(
                                    NativeTheme.background(activity),
                                    !NativeTheme.isDark(activity)
                                )
                                .build()
                                .show(activity.supportFragmentManager, AdFitPopupAdDialogFragment.TAG)
                        }.onFailure {
                            Log.w(TAG, "Exit ad show failed", it)
                            onFallbackExit()
                        }
                    }
                }

                override fun onAdLoadError(errorCode: Int) {
                    Log.w(TAG, "Exit ad load error: $errorCode")
                    activity.runOnUiThread { onFallbackExit() }
                }
            }
        )

        if (!requested) {
            onFallbackExit()
        }
    }

    fun destroy() {
        exitAdLoader?.destroy()
        exitAdLoader = null
        preloadedExitAd = null
    }
}
