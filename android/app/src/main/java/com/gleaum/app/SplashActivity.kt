package com.gleaum.app

import android.content.Intent
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Shader
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.WindowInsetsController
import androidx.activity.ComponentActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.gleaum.app.databinding.ActivitySplashBinding

/**
 * SplashActivity — 전체 화면 브랜딩 스플래시
 *
 * 구성:
 *  - 배경: #0A0B10 (다크 블랙)
 *  - 상단: "Making everyday life shine together" (teal)
 *  - 헤드라인: "나, 그리고 / 연인/가족의" (흰색 Bold)
 *  - 그라디언트 텍스트: "일상 네트워크" (teal → green)
 *  - 우측 중앙: 글리움 로고 아이콘
 *  - 하단: "gleaum" 브랜드 텍스트
 *
 * 2초 후 RouterActivity 로 전환 (페이드 아웃)
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

        // "일상 네트워크" teal → green 그라디언트 적용
        binding.textGradient.post {
            val width = binding.textGradient.width.toFloat()
            if (width > 0f) {
                binding.textGradient.paint.shader = LinearGradient(
                    0f, 0f, width, 0f,
                    intArrayOf(
                        Color.parseColor("#0CC9B5"),  // Teal
                        Color.parseColor("#2EE895"),  // Green
                    ),
                    null,
                    Shader.TileMode.CLAMP
                )
                binding.textGradient.invalidate()
            }
        }

        // 2초 후 RouterActivity 로 이동
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
        }, 2000L)
    }
}
