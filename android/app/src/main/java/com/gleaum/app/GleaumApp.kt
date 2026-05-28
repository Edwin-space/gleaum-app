package com.gleaum.app

import android.app.Activity
import android.app.Application
import android.os.Bundle
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.appopen.AppOpenAd
import java.util.Date

/**
 * 글리움 Application 클래스
 *
 * 역할:
 *  1. MobileAds SDK 초기화
 *  2. App Open 광고 로드 및 표시
 *     - 앱 콜드 스타트: 스플래시 종료 후 2.5초 뒤 표시
 *     - 백그라운드 복귀: 30분 쿨다운 후 표시
 *
 * App Open Ad Unit: ca-app-pub-7426507548879721/5027423989
 */
class GleaumApp : Application(), Application.ActivityLifecycleCallbacks, DefaultLifecycleObserver {

    private lateinit var appOpenAdManager: AppOpenAdManager
    private var currentActivity: Activity? = null

    /** 콜드 스타트 여부 — 첫 번째 ON_START 는 스플래시 지연 후 표시 */
    private var isColdStart = true

    // ── Application 생명주기 ──────────────────────────────────────────────────

    override fun onCreate() {
        super<Application>.onCreate()

        registerActivityLifecycleCallbacks(this)
        ProcessLifecycleOwner.get().lifecycle.addObserver(this)

        // MobileAds 초기화 (백그라운드 스레드 권장)
        MobileAds.initialize(this)

        appOpenAdManager = AppOpenAdManager()
        appOpenAdManager.loadAd(this)
    }

    // ── DefaultLifecycleObserver: 앱 포그라운드 감지 ─────────────────────────

    /** 앱이 포그라운드로 전환될 때 호출 (콜드 스타트 + 백그라운드 복귀 모두 포함) */
    override fun onStart(owner: LifecycleOwner) {
        val activity = currentActivity ?: return
        if (isColdStart) {
            isColdStart = false
            // 스플래시 애니메이션(~2초)이 끝난 후 광고 표시
            activity.window.decorView.postDelayed({
                appOpenAdManager.showAdIfAvailable(activity)
            }, 2500L)
        } else {
            // 백그라운드에서 복귀
            appOpenAdManager.showAdIfAvailable(activity)
        }
    }

    // ── ActivityLifecycleCallbacks: 현재 액티비티 추적 ───────────────────────

    override fun onActivityResumed(activity: Activity) {
        currentActivity = activity
    }

    override fun onActivityPaused(activity: Activity) {
        if (currentActivity === activity) currentActivity = null
    }

    // 나머지 콜백 — 사용하지 않음
    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
    override fun onActivityStarted(activity: Activity) {}
    override fun onActivityStopped(activity: Activity) {}
    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
    override fun onActivityDestroyed(activity: Activity) {}

    // ── App Open Ad 매니저 ────────────────────────────────────────────────────

    inner class AppOpenAdManager {

        private var appOpenAd: AppOpenAd? = null
        private var isLoadingAd  = false
        private var isShowingAd  = false
        private var loadTime     = 0L
        private var lastShowTime = 0L

        companion object {
            /** 실제 광고 단위 ID */
            private const val AD_UNIT_ID = "ca-app-pub-7426507548879721/5027423989"

            /** Google 테스트 광고 단위 ID (디버그 빌드에서만 사용) */
            private const val AD_UNIT_ID_TEST = "ca-app-pub-3940256099942544/9257395921"

            /** 로드된 광고 유효 시간 (4시간) */
            private const val AD_EXPIRE_MS = 4L * 3_600_000L

            /** 광고 재표시 최소 간격 (30분) */
            private const val COOLDOWN_MS = 30L * 60_000L
        }

        /** 현재 빌드에 맞는 광고 단위 ID */
        private val adUnitId: String
            get() = if (BuildConfig.DEBUG) AD_UNIT_ID_TEST else AD_UNIT_ID

        /** 광고 로드 */
        fun loadAd(context: android.content.Context) {
            if (isLoadingAd || isAdAvailable()) return
            isLoadingAd = true

            AppOpenAd.load(
                context,
                adUnitId,
                AdRequest.Builder().build(),
                object : AppOpenAd.AppOpenAdLoadCallback() {
                    override fun onAdLoaded(ad: AppOpenAd) {
                        appOpenAd   = ad
                        isLoadingAd = false
                        loadTime    = Date().time
                    }

                    override fun onAdFailedToLoad(error: LoadAdError) {
                        isLoadingAd = false
                    }
                }
            )
        }

        /** 광고가 로드되어 있고 아직 만료되지 않았는지 확인 */
        private fun isAdAvailable(): Boolean {
            return appOpenAd != null && (Date().time - loadTime) < AD_EXPIRE_MS
        }

        /** 쿨다운이 지났는지 확인 */
        private fun isCooldownOver(): Boolean {
            return lastShowTime == 0L || (Date().time - lastShowTime) >= COOLDOWN_MS
        }

        /** 조건이 충족되면 광고 표시 */
        fun showAdIfAvailable(activity: Activity) {
            if (isShowingAd) return
            if (!isCooldownOver()) return

            if (!isAdAvailable()) {
                loadAd(activity)
                return
            }

            appOpenAd?.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdShowedFullScreenContent() {
                    isShowingAd  = true
                    lastShowTime = Date().time
                }

                override fun onAdDismissedFullScreenContent() {
                    appOpenAd   = null
                    isShowingAd = false
                    // 다음 표시를 위해 미리 로드
                    loadAd(activity)
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    isShowingAd = false
                    loadAd(activity)
                }
            }

            appOpenAd?.show(activity)
        }
    }
}
