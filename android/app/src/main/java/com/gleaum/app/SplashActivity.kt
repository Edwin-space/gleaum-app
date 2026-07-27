package com.gleaum.app

import android.content.Intent
import android.animation.ValueAnimator
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.WindowInsetsController
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import androidx.activity.ComponentActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.gleaum.app.databinding.ActivitySplashBinding

/**
 * SplashActivity — 전체 화면 브랜딩 스플래시
 *
 * Android 12 시스템 로고와 같은 위치에서 시작해 로고, BI, 브랜드 문구를
 * 순차적으로 드러낸 뒤 RouterActivity의 세션/보안 게이트로 연결한다.
 */
// ComponentActivity 사용 — Theme.SplashScreen 은 AppCompat 기반이 아니라
// AppCompatActivity 와 호환 불가. ComponentActivity 는 Theme.SplashScreen 과 호환됨.
class SplashActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // 시스템 스플래시(둥근 아이콘)를 즉시 제거하고 커스텀 UI 로 전환
        installSplashScreen()

        super.onCreate(savedInstanceState)

        // 상태바/네비게이션바 색상 — setContentView 전에 설정 가능
        window.statusBarColor     = Color.parseColor("#0A0B10")
        window.navigationBarColor = Color.parseColor("#0A0B10")

        val binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // 로그인 세션이 있으면 고정 스플래시 시간 동안 공통 화면 데이터를 병렬 선조회한다.
        NativeStartupPrefetcher.start(applicationContext)

        // insetsController 는 DecorView(setContentView) 이후에만 접근 가능
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            window.insetsController?.setSystemBarsAppearance(
                0,
                WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            )
        }

        playBrandEntrance(binding)

        // 고정 지연을 줄이되 브랜드 모션이 읽힐 최소 시간은 보장한다.
        Handler(Looper.getMainLooper()).postDelayed({
            if (!isFinishing) {
                startActivity(Intent(this, RouterActivity::class.java).apply {
                    data = intent?.data
                    action = intent?.action
                    if (intent?.extras != null) putExtras(intent.extras!!)
                })
                finish()
                @Suppress("DEPRECATION")
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            }
        }, if (areSystemAnimationsEnabled()) 1650L else 650L)
    }

    private fun playBrandEntrance(binding: ActivitySplashBinding) {
        val density = resources.displayMetrics.density
        val animationsEnabled = areSystemAnimationsEnabled()

        binding.splashLogo.apply {
            scaleX = if (animationsEnabled) 0.88f else 1f
            scaleY = if (animationsEnabled) 0.88f else 1f
            translationY = if (animationsEnabled) 10f * density else 0f
        }
        binding.brandWordmark.alpha = if (animationsEnabled) 0f else 1f
        binding.brandWordmark.translationY = if (animationsEnabled) 16f * density else 0f
        binding.brandTagline.alpha = if (animationsEnabled) 0f else 1f
        binding.brandTagline.translationY = if (animationsEnabled) 12f * density else 0f
        binding.startupStatus.alpha = if (animationsEnabled) 0f else 1f

        if (!animationsEnabled) return

        binding.glowTeal.animate()
            .alpha(1f)
            .scaleX(1.08f)
            .scaleY(1.08f)
            .setDuration(900L)
            .setInterpolator(DecelerateInterpolator())
            .start()
        binding.glowBlue.animate()
            .alpha(0.85f)
            .setStartDelay(180L)
            .setDuration(1000L)
            .start()
        binding.splashLogo.animate()
            .scaleX(1f)
            .scaleY(1f)
            .translationY(-8f * density)
            .setDuration(720L)
            .setInterpolator(OvershootInterpolator(0.72f))
            .start()
        binding.brandWordmark.animate()
            .alpha(1f)
            .translationY(0f)
            .setStartDelay(340L)
            .setDuration(520L)
            .setInterpolator(DecelerateInterpolator())
            .start()
        binding.brandTagline.animate()
            .alpha(1f)
            .translationY(0f)
            .setStartDelay(620L)
            .setDuration(520L)
            .setInterpolator(DecelerateInterpolator())
            .start()
        binding.startupStatus.animate()
            .alpha(1f)
            .setStartDelay(880L)
            .setDuration(380L)
            .start()
    }

    private fun areSystemAnimationsEnabled(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.O || ValueAnimator.areAnimatorsEnabled()
}
