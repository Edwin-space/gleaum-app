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
import com.gleaum.app.databinding.ActivityLoginEmailBinding
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * LoginActivity — 네이티브 로그인 화면
 *
 * 로그인 방식:
 *  1. Google로 계속하기
 *     → Chrome Custom Tab으로 Supabase Google OAuth 실행
 *     → gleaum://auth/callback 딥링크 → RouterActivity → MainActivity
 *     → NativeAppProvider가 코드 교환 + NativeSession.saveSession() 저장
 *     → onResume() 에서 SessionManager 확인 후 MainActivity 이동
 *
 *  2. 이메일 주소로 사용하기 (기존 Google 가입 계정 OTP)
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

        binding.btnEmail.paintFlags =
            binding.btnEmail.paintFlags or android.graphics.Paint.UNDERLINE_TEXT_FLAG

        binding.btnGoogle.setOnClickListener { handleGoogleSignIn() }
        binding.btnEmail.setOnClickListener  { startEmailLogin() }
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
        binding.btnEmail.isClickable     = !loading
    }

    // ── 이메일 OTP 로그인 ────────────────────────────────────────────────────

    private fun startEmailLogin() {
        val emailBinding = ActivityLoginEmailBinding.inflate(layoutInflater)
        setContentView(emailBinding.root)

        emailBinding.btnResend.paintFlags =
            emailBinding.btnResend.paintFlags or android.graphics.Paint.UNDERLINE_TEXT_FLAG

        var currentEmail = ""

        emailBinding.btnBack.setOnClickListener { setContentView(binding.root) }

        emailBinding.btnSendOtp.setOnClickListener {
            val email = emailBinding.inputEmail.text?.toString()?.trim() ?: ""
            if (email.isEmpty()) { showToast("이메일을 입력해 주세요."); return@setOnClickListener }
            currentEmail = email
            sendOtp(email, emailBinding)
        }

        emailBinding.btnVerifyOtp.setOnClickListener {
            val otp = emailBinding.inputOtp.text?.toString()?.trim() ?: ""
            if (otp.length != 6) { showToast("6자리 코드를 입력해 주세요."); return@setOnClickListener }
            verifyOtp(currentEmail, otp)
        }

        emailBinding.btnResend.setOnClickListener {
            if (currentEmail.isNotEmpty()) sendOtp(currentEmail, emailBinding)
        }
    }

    private fun sendOtp(email: String, emailBinding: ActivityLoginEmailBinding) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val conn = (URL("${getString(R.string.supabase_url)}/auth/v1/otp").openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("apikey", getString(R.string.supabase_anon_key))
                    setRequestProperty("Content-Type", "application/json")
                    doOutput = true
                }
                OutputStreamWriter(conn.outputStream).use {
                    it.write(JSONObject().apply { put("email", email); put("create_user", false) }.toString())
                }
                val success = conn.responseCode == 200
                withContext(Dispatchers.Main) {
                    if (success) {
                        emailBinding.otpDesc.text = "${email}으로\n6자리 코드를 보냈습니다."
                        emailBinding.emailStep.visibility = View.GONE
                        emailBinding.otpStep.visibility   = View.VISIBLE
                    } else {
                        showToast("이메일을 찾을 수 없습니다.\nGoogle 로그인을 먼저 이용해 주세요.")
                    }
                }
            } catch (_: Exception) {
                withContext(Dispatchers.Main) { showToast("네트워크 오류가 발생했습니다.") }
            }
        }
    }

    private fun verifyOtp(email: String, otp: String) {
        CoroutineScope(Dispatchers.Main).launch {
            val session = withContext(Dispatchers.IO) {
                try {
                    val conn = (URL("${getString(R.string.supabase_url)}/auth/v1/verify").openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        setRequestProperty("apikey", getString(R.string.supabase_anon_key))
                        setRequestProperty("Content-Type", "application/json")
                        doOutput = true
                    }
                    OutputStreamWriter(conn.outputStream).use {
                        it.write(JSONObject().apply {
                            put("type", "email"); put("token", otp); put("email", email)
                        }.toString())
                    }
                    if (conn.responseCode == 200)
                        addExpiresAt(conn.inputStream.bufferedReader().readText())
                    else null
                } catch (_: Exception) { null }
            }
            if (session != null) {
                SessionManager.save(this@LoginActivity, session)
                goToMain()
            } else {
                showToast("인증 코드가 올바르지 않습니다.")
            }
        }
    }

    // ── 유틸 ────────────────────────────────────────────────────────────────

    private fun addExpiresAt(json: String): String = try {
        val obj = JSONObject(json)
        obj.put("expires_at", System.currentTimeMillis() / 1000L + obj.optLong("expires_in", 3600L))
        obj.toString()
    } catch (_: Exception) { json }

    private fun showToast(msg: String) =
        Toast.makeText(this, msg, Toast.LENGTH_LONG).show()

    private fun goToMain() {
        startActivity(Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        })
        finish()
    }
}
