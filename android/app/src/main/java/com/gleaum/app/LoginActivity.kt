package com.gleaum.app

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.WindowInsetsController
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.gleaum.app.databinding.ActivityLoginBinding
import com.gleaum.app.databinding.ActivityLoginEmailBinding
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * LoginActivity — 네이티브 로그인/회원가입 화면
 *
 * 진입 조건: 세션 없음 (앱 최초 실행 또는 로그아웃 후)
 * 로그인 성공 → SessionManager 저장 → MainActivity 시작
 */
class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 이미 유효한 세션이 있으면 바로 메인으로
        if (SessionManager.hasValid(this)) { goToMain(); return }

        // 상태바/네비게이션바 색상 — setContentView 전에 설정 가능
        window.statusBarColor     = android.graphics.Color.BLACK
        window.navigationBarColor = android.graphics.Color.BLACK

        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // insetsController 는 DecorView 생성(setContentView) 이후에만 호출 가능
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            window.insetsController?.setSystemBarsAppearance(
                0,
                WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            )
        }

        // 이메일 링크 밑줄 — XML paintFlags 미지원으로 코드에서 처리
        binding.btnEmail.paintFlags = binding.btnEmail.paintFlags or android.graphics.Paint.UNDERLINE_TEXT_FLAG

        // Google 로그인
        binding.btnGoogle.setOnClickListener { handleGoogleSignIn() }

        // 이메일 로그인
        binding.btnEmail.setOnClickListener { startEmailLogin() }
    }

    // ── Google Sign-In ──────────────────────────────────────────────────────

    private fun handleGoogleSignIn() {
        setGoogleLoading(true)
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val idToken = fetchGoogleIdToken()
                val session = exchangeGoogleToken(idToken)
                if (session != null) {
                    SessionManager.save(this@LoginActivity, session)
                    goToMain()
                } else {
                    showToast("로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.")
                }
            } catch (_: GetCredentialCancellationException) {
                // 사용자 취소 — 무시
            } catch (e: GetCredentialException) {
                showToast("Google 로그인 오류: ${e.message}")
            } finally {
                setGoogleLoading(false)
            }
        }
    }

    /**
     * Google ID 토큰 획득.
     *
     * 1차: GetGoogleIdOption (Bottom Sheet — 부드러운 UX)
     * 폴백: GetSignInWithGoogleOption (전체 화면 계정 선택 — 계정 없을 때 확실히 동작)
     *
     * "no credentials available" 오류 = 기기에 앱 사용 이력이 없거나
     * SHA-1 불일치 시 1차가 실패하므로 폴백 필수
     */
    private suspend fun fetchGoogleIdToken(): String {
        val credentialManager = CredentialManager.create(this)
        val clientId = getString(R.string.google_web_client_id)

        // ── 1차: GetGoogleIdOption (One Tap / Bottom Sheet) ──────────────
        try {
            val request = GetCredentialRequest.Builder()
                .addCredentialOption(
                    GetGoogleIdOption.Builder()
                        .setFilterByAuthorizedAccounts(false)
                        .setServerClientId(clientId)
                        .setAutoSelectEnabled(false)
                        .build()
                ).build()
            val result = credentialManager.getCredential(this, request)
            return GoogleIdTokenCredential.createFrom(result.credential.data).idToken
        } catch (e: NoCredentialException) {
            // "no credentials available" → 폴백으로 계속
        }

        // ── 폴백: GetSignInWithGoogleOption (전체 화면 계정 선택) ─────────
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(
                GetSignInWithGoogleOption.Builder(clientId).build()
            ).build()
        val result = credentialManager.getCredential(this, request)
        return GoogleIdTokenCredential.createFrom(result.credential.data).idToken
    }

    private fun setGoogleLoading(loading: Boolean) {
        binding.googleLoading.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnGoogleText.visibility = if (loading) View.GONE  else View.VISIBLE
        binding.googleIcon.visibility    = if (loading) View.GONE  else View.VISIBLE
        binding.btnGoogle.isClickable    = !loading
        binding.btnEmail.isClickable     = !loading
    }

    // ── 이메일 로그인 (별도 화면) ───────────────────────────────────────────

    private fun startEmailLogin() {
        val emailBinding = ActivityLoginEmailBinding.inflate(layoutInflater)
        setContentView(emailBinding.root)

        var currentEmail = ""

        // 재발송 링크 밑줄
        emailBinding.btnResend.paintFlags = emailBinding.btnResend.paintFlags or android.graphics.Paint.UNDERLINE_TEXT_FLAG

        emailBinding.btnBack.setOnClickListener {
            setContentView(binding.root)
        }

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
                val url  = URL("${getString(R.string.supabase_url)}/auth/v1/otp")
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("apikey", getString(R.string.supabase_anon_key))
                    setRequestProperty("Content-Type", "application/json")
                    doOutput = true
                }
                OutputStreamWriter(conn.outputStream).use {
                    it.write(JSONObject().apply {
                        put("email", email); put("create_user", false)
                    }.toString())
                }
                val success = conn.responseCode == 200
                withContext(Dispatchers.Main) {
                    if (success) {
                        emailBinding.otpDesc.text = "${email} 으로\n6자리 코드를 보냈습니다."
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
                    val url  = URL("${getString(R.string.supabase_url)}/auth/v1/verify")
                    val conn = (url.openConnection() as HttpURLConnection).apply {
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

    private suspend fun exchangeGoogleToken(idToken: String): String? =
        withContext(Dispatchers.IO) {
            try {
                val url  = URL("${getString(R.string.supabase_url)}/auth/v1/token?grant_type=id_token")
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("apikey", getString(R.string.supabase_anon_key))
                    setRequestProperty("Content-Type", "application/json")
                    doOutput = true
                }
                OutputStreamWriter(conn.outputStream).use {
                    it.write(JSONObject().apply {
                        put("provider", "google"); put("id_token", idToken)
                    }.toString())
                }
                if (conn.responseCode == 200)
                    addExpiresAt(conn.inputStream.bufferedReader().readText())
                else null
            } catch (_: Exception) { null }
        }

    private fun addExpiresAt(json: String): String = try {
        val obj = JSONObject(json)
        obj.put("expires_at", System.currentTimeMillis() / 1000L + obj.optLong("expires_in", 3600L))
        obj.toString()
    } catch (_: Exception) { json }

    private fun showToast(msg: String) =
        Toast.makeText(this, msg, Toast.LENGTH_LONG).show()

    private fun goToMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
