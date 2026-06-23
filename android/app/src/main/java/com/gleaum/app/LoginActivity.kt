package com.gleaum.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsetsController
import android.view.inputmethod.InputMethodManager
import android.content.Context
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.gleaum.app.databinding.ActivityLoginBinding
import org.json.JSONObject
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * LoginActivity — 네이티브 로그인 화면
 *
 * 로그인 방식:
 * - Google로 계속하기: 브라우저 OAuth → gleaum://auth/callback → 세션 저장
 * - 이메일로 계속하기: 네이티브 이메일 로그인/회원가입 → Supabase Auth REST API → 세션 저장
 */
class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private var emailSignupMode = false
    private var emailLoading = false
    private var syncingConsentChecks = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (SessionManager.hasValid(this)) { goToMain(); return }

        window.statusBarColor     = android.graphics.Color.BLACK
        window.navigationBarColor = android.graphics.Color.BLACK

        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        tuneTabletWidth()

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            window.insetsController?.setSystemBarsAppearance(
                0,
                WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            )
        }

        binding.btnGoogle.setOnClickListener { handleGoogleSignIn() }
        binding.btnEmail.setOnClickListener { showEmailPanel(signup = false) }
        binding.btnEmailBack.setOnClickListener { showSocialPanel() }
        binding.btnToggleEmailMode.setOnClickListener { setEmailMode(!emailSignupMode) }
        binding.btnEmailSubmit.setOnClickListener { handleEmailSubmit() }
        setupConsentControls()
    }

    /**
     * 앱 복귀 시 (Chrome Custom Tab OAuth 완료 후) 세션 확인.
     * NativeAppProvider/MainActivity가 saveSession() 을 호출하는 데 약간의 시간이 필요하므로 재시도한다.
     */
    override fun onResume() {
        super.onResume()
        if (SessionManager.hasValid(this)) {
            goToMain()
            return
        }
        Handler(Looper.getMainLooper()).postDelayed({
            if (!isFinishing && SessionManager.hasValid(this)) {
                goToMain()
            }
        }, 2500L)
    }

    override fun onBackPressed() {
        if (binding.emailPanel.visibility == View.VISIBLE && !emailLoading) {
            showSocialPanel()
            return
        }
        super.onBackPressed()
    }

    // ── Google 로그인 — Chrome Custom Tab ──────────────────────────────────

    private fun handleGoogleSignIn() {
        setGoogleLoading(true)

        val supabaseUrl = getString(R.string.supabase_url)
        val oauthUri = Uri.parse("$supabaseUrl/auth/v1/authorize")
            .buildUpon()
            .appendQueryParameter("provider", "google")
            .appendQueryParameter("redirect_to", "gleaum://auth/callback")
            .appendQueryParameter("flow_type", "implicit")
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

    // ── 이메일 로그인/회원가입 — Native Supabase Auth ─────────────────────

    private fun showEmailPanel(signup: Boolean) {
        binding.socialPanel.visibility = View.GONE
        binding.emailPanel.visibility = View.VISIBLE
        binding.legalNotice.visibility = View.GONE
        setEmailMode(signup)
        binding.inputEmail.requestFocus()
        showKeyboard(binding.inputEmail)
    }

    private fun showSocialPanel() {
        hideKeyboard()
        clearEmailError()
        binding.emailPanel.visibility = View.GONE
        binding.socialPanel.visibility = View.VISIBLE
        binding.legalNotice.visibility = View.VISIBLE
    }

    private fun setEmailMode(signup: Boolean) {
        emailSignupMode = signup
        clearEmailError()
        binding.inputName.visibility = if (signup) View.VISIBLE else View.GONE
        binding.consentPanel.visibility = if (signup) View.VISIBLE else View.GONE
        binding.emailTitle.text = if (signup) "이메일로 회원가입" else "이메일로 로그인"
        binding.emailSubtitle.text = if (signup) {
            "처음 사용하는 이메일이면 계정을 만들 수 있어요."
        } else {
            "글리움 계정 이메일과 비밀번호를 입력해 주세요."
        }
        binding.btnEmailSubmitText.text = if (signup) "회원가입" else "로그인"
        binding.btnToggleEmailMode.text = if (signup) {
            "이미 계정이 있으신가요? 로그인"
        } else {
            "계정이 없으신가요? 회원가입"
        }
        updateAllConsentState()
    }

    private fun handleEmailSubmit() {
        if (emailLoading) return

        val name = binding.inputName.text?.toString()?.trim().orEmpty()
        val email = binding.inputEmail.text?.toString()?.trim().orEmpty()
        val password = binding.inputPassword.text?.toString().orEmpty()

        if (email.isBlank() || password.isBlank()) {
            showEmailError("이메일과 비밀번호를 입력해 주세요.")
            return
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            showEmailError("올바른 이메일 형식이 아니에요.")
            return
        }
        if (password.length < 6) {
            showEmailError("비밀번호는 최소 6자 이상이어야 해요.")
            return
        }
        if (emailSignupMode) {
            if (name.isBlank()) {
                showEmailError("이름 또는 닉네임을 입력해 주세요.")
                return
            }
            if (!binding.checkAge.isChecked || !binding.checkTerms.isChecked || !binding.checkPrivacy.isChecked) {
                showEmailError("필수 동의 항목을 모두 체크해 주세요.")
                return
            }
        }

        setEmailLoading(true)
        Thread {
            try {
                val response = if (emailSignupMode) {
                    requestEmailSignup(name, email, password)
                } else {
                    requestEmailLogin(email, password)
                }
                handleAuthSuccess(response)
            } catch (e: Exception) {
                runOnUiThread {
                    setEmailLoading(false)
                    showEmailError(mapAuthError(e.message.orEmpty()))
                }
            }
        }.start()
    }

    private fun requestEmailLogin(email: String, password: String): JSONObject {
        val body = JSONObject()
            .put("email", email)
            .put("password", password)
        return requestSupabaseAuth("/auth/v1/token?grant_type=password", body)
    }

    private fun requestEmailSignup(name: String, email: String, password: String): JSONObject {
        val data = JSONObject()
            .put("full_name", name)
            .put("name", name)
            .put("display_name", name)
        val body = JSONObject()
            .put("email", email)
            .put("password", password)
            .put("data", data)
        return requestSupabaseAuth("/auth/v1/signup", body)
    }

    private fun requestSupabaseAuth(path: String, body: JSONObject): JSONObject {
        val supabaseUrl = getString(R.string.supabase_url).trimEnd('/')
        val anonKey = getString(R.string.supabase_anon_key)
        val connection = (URL("$supabaseUrl$path").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15000
            readTimeout = 20000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("apikey", anonKey)
            setRequestProperty("Authorization", "Bearer $anonKey")
        }

        OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
            writer.write(body.toString())
        }

        val responseText = readResponse(connection)
        val json = if (responseText.isBlank()) JSONObject() else JSONObject(responseText)
        if (connection.responseCode !in 200..299) {
            val message = json.optString("msg")
                .ifBlank { json.optString("message") }
                .ifBlank { json.optString("error_description") }
                .ifBlank { "인증 요청에 실패했습니다. (${connection.responseCode})" }
            throw IllegalStateException(message)
        }
        return json
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }

    private fun handleAuthSuccess(response: JSONObject) {
        val accessToken = response.optString("access_token")
        val refreshToken = response.optString("refresh_token")

        if (accessToken.isBlank() || refreshToken.isBlank()) {
            runOnUiThread {
                setEmailLoading(false)
                if (emailSignupMode) {
                    showToast("가입 확인 메일을 보냈어요. 메일 인증 후 로그인해 주세요.")
                    setEmailMode(signup = false)
                    binding.inputPassword.setText("")
                } else {
                    showEmailError("로그인 세션을 받을 수 없어요. 잠시 후 다시 시도해 주세요.")
                }
            }
            return
        }

        val expiresIn = response.optLong("expires_in", 3600L)
        if (!response.has("expires_at") || response.isNull("expires_at")) {
            response.put("expires_at", System.currentTimeMillis() / 1000L + expiresIn)
        }
        if (!response.has("token_type")) response.put("token_type", "bearer")

        SessionManager.save(this, response.toString())
        runOnUiThread {
            setEmailLoading(false)
            goToMain()
        }
    }

    private fun setEmailLoading(loading: Boolean) {
        emailLoading = loading
        binding.emailLoading.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnEmailSubmitText.visibility = if (loading) View.GONE else View.VISIBLE
        binding.btnEmailSubmit.isClickable = !loading
        binding.btnToggleEmailMode.isClickable = !loading
        binding.btnEmailBack.isClickable = !loading
        binding.inputName.isEnabled = !loading
        binding.inputEmail.isEnabled = !loading
        binding.inputPassword.isEnabled = !loading
        binding.checkAllConsents.isEnabled = !loading
        binding.checkAge.isEnabled = !loading
        binding.checkTerms.isEnabled = !loading
        binding.checkPrivacy.isEnabled = !loading
        binding.linkTerms.isEnabled = !loading
        binding.linkPrivacy.isEnabled = !loading
    }

    private fun setupConsentControls() {
        binding.checkAllConsents.setOnCheckedChangeListener { _, checked ->
            if (syncingConsentChecks) return@setOnCheckedChangeListener
            syncingConsentChecks = true
            binding.checkAge.isChecked = checked
            binding.checkTerms.isChecked = checked
            binding.checkPrivacy.isChecked = checked
            syncingConsentChecks = false
            clearEmailError()
        }

        val individualListener = { _: android.widget.CompoundButton, _: Boolean ->
            if (!syncingConsentChecks) {
                updateAllConsentState()
                clearEmailError()
            }
        }
        binding.checkAge.setOnCheckedChangeListener(individualListener)
        binding.checkTerms.setOnCheckedChangeListener(individualListener)
        binding.checkPrivacy.setOnCheckedChangeListener(individualListener)

        binding.linkTerms.setOnClickListener { openLegalPage("/legal/terms") }
        binding.linkPrivacy.setOnClickListener { openLegalPage("/legal/privacy") }
    }

    private fun updateAllConsentState() {
        syncingConsentChecks = true
        binding.checkAllConsents.isChecked =
            binding.checkAge.isChecked && binding.checkTerms.isChecked && binding.checkPrivacy.isChecked
        syncingConsentChecks = false
    }

    private fun openLegalPage(path: String) {
        val title = if (path.contains("privacy")) "개인정보처리방침" else "이용약관"
        val deviceMode = if (isTablet()) "tablet" else "phone"
        val url = Uri.parse("https://www.gleaum.com$path")
            .buildUpon()
            .appendQueryParameter("view", "android-app")
            .appendQueryParameter("device", deviceMode)
            .build()
            .toString()

        startActivity(Intent(this, LegalWebViewActivity::class.java).apply {
            putExtra(LegalWebViewActivity.EXTRA_TITLE, title)
            putExtra(LegalWebViewActivity.EXTRA_URL, url)
        })
    }

    private fun showEmailError(message: String) {
        binding.emailError.text = message
        binding.emailError.visibility = View.VISIBLE
    }

    private fun clearEmailError() {
        binding.emailError.text = ""
        binding.emailError.visibility = View.GONE
    }

    private fun mapAuthError(raw: String): String {
        val text = raw.lowercase()
        return when {
            "invalid login" in text || "invalid credentials" in text -> "이메일 또는 비밀번호가 올바르지 않아요."
            "email not confirmed" in text -> "이메일 인증이 아직 완료되지 않았어요. 메일함을 확인해 주세요."
            "user already registered" in text || "already registered" in text -> "이미 가입된 이메일이에요. 로그인으로 진행해 주세요."
            "password" in text -> "비밀번호 조건을 확인해 주세요. 최소 6자 이상이어야 해요."
            "network" in text || "timeout" in text -> "네트워크 연결을 확인한 뒤 다시 시도해 주세요."
            raw.isBlank() -> "요청 처리 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요."
            else -> raw
        }
    }

    // ── 유틸 ────────────────────────────────────────────────────────────────

    private fun tuneTabletWidth() {
        val maxWidth = dp(520)
        binding.controlPanel.post {
            val params = binding.controlPanel.layoutParams
            if (resources.displayMetrics.widthPixels > dp(700)) {
                params.width = maxWidth
                binding.controlPanel.layoutParams = params
            }
            val brandParams = binding.brandPanel.layoutParams
            if (resources.displayMetrics.widthPixels > dp(700)) {
                brandParams.height = dp(420)
                binding.brandPanel.layoutParams = brandParams
            }
        }
    }

    private fun showKeyboard(view: View) {
        view.postDelayed({
            val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
            imm.showSoftInput(view, InputMethodManager.SHOW_IMPLICIT)
        }, 200L)
    }

    private fun hideKeyboard() {
        val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        imm.hideSoftInputFromWindow(binding.root.windowToken, 0)
    }

    private fun showToast(msg: String) =
        Toast.makeText(this, msg, Toast.LENGTH_LONG).show()

    private fun goToMain() {
        startActivity(Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        })
        finish()
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
    private fun isTablet(): Boolean = resources.configuration.smallestScreenWidthDp >= 600
}
