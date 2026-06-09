package com.gleaum.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.WindowInsetsController
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.gleaum.app.databinding.ActivityLoginBinding

/**
 * LoginActivity — 네이티브 로그인 화면
 *
 * 로그인 방식: Google로 계속하기
 *  → Chrome Custom Tab으로 Supabase Google OAuth 실행
 *  → gleaum://auth/callback 딥링크 → RouterActivity → MainActivity
 *  → NativeAppProvider가 코드 교환 + NativeSession.saveSession() 저장
 *  → onResume() 에서 SessionManager 확인 후 MainActivity 이동
 */
class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (SessionManager.hasValid(this)) { goToMain(); return }

        window.statusBarColor     = android.graphics.Color.BLACK
        window.navigationBarColor = android.graphics.Color.BLACK

        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            window.insetsController?.setSystemBarsAppearance(
                0,
                WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            )
        }

        binding.btnGoogle.setOnClickListener { handleGoogleSignIn() }
    }

    /**
     * 앱 복귀 시 (Chrome Custom Tab OAuth 완료 후) 세션 확인
     * NativeAppProvider가 saveSession() 을 호출하는 데 약간의 시간이 필요하므로 재시도
     */
    override fun onResume() {
        super.onResume()
        if (SessionManager.hasValid(this)) {
            goToMain()
            return
        }
        // OAuth 처리 시간(약 2초) 후 재확인
        Handler(Looper.getMainLooper()).postDelayed({
            if (!isFinishing && SessionManager.hasValid(this)) {
                goToMain()
            }
        }, 2500L)
    }

    // ── Google 로그인 — Chrome Custom Tab ──────────────────────────────────

    private fun handleGoogleSignIn() {
        setGoogleLoading(true)

        val supabaseUrl = getString(R.string.supabase_url)
        val oauthUri = Uri.parse("$supabaseUrl/auth/v1/authorize")
            .buildUpon()
            .appendQueryParameter("provider", "google")
            .appendQueryParameter("redirect_to", "gleaum://auth/callback")
            // PKCE 없이 브라우저에서 직접 시작하므로 implicit flow 사용
            // → 콜백 URL에 access_token/refresh_token 이 직접 포함됨
            .appendQueryParameter("flow_type", "implicit")
            // Google 계정 선택 화면을 항상 노출해 최근 계정 자동 로그인을 방지
            .appendQueryParameter("prompt", "select_account")
            .build()

        try {
            startActivity(Intent(Intent.ACTION_VIEW, oauthUri))
        } catch (e: Exception) {
            showToast("브라우저를 열 수 없습니다.")
        } finally {
            setGoogleLoading(false)
        }
    }

    private fun setGoogleLoading(loading: Boolean) {
        binding.googleLoading.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnGoogleText.visibility = if (loading) View.GONE   else View.VISIBLE
        binding.googleIcon.visibility    = if (loading) View.GONE   else View.VISIBLE
        binding.btnGoogle.isClickable    = !loading
    }

    // ── 유틸 ────────────────────────────────────────────────────────────────

    private fun showToast(msg: String) =
        Toast.makeText(this, msg, Toast.LENGTH_LONG).show()

    private fun goToMain() {
        startActivity(Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        })
        finish()
    }
}
