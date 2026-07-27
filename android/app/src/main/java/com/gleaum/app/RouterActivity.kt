package com.gleaum.app

import android.content.Intent
import android.content.Context
import android.graphics.Color
import android.hardware.biometrics.BiometricPrompt
import android.net.Uri
import android.os.Bundle
import android.os.Build
import android.os.CancellationSignal
import android.view.View
import android.view.WindowInsetsController
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import com.gleaum.app.databinding.ActivityStartGateBinding
import org.json.JSONObject
import java.net.URLDecoder

/**
 * RouterActivity — 앱 진입 라우터 (경량 Activity, UI 없음)
 *
 * Capacitor BridgeActivity(MainActivity)를 초기화하기 전에
 * 세션 유무를 판단해 적절한 화면으로 분기합니다.
 *
 * - 세션 있음  → MainActivity (딥링크 Intent 포함 전달)
 * - 세션 없음  → LoginActivity
 * - OAuth 콜백 (gleaum://auth/...) → 세션 없어도 MainActivity로 전달
 *   (기존 PKCE 흐름 — NativeAppProvider 가 WebView 에서 처리)
 */
class RouterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityStartGateBinding
    private var biometricPromptOpen = false
    private var oauthCallback = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.parseColor("#080B12")
        window.navigationBarColor = Color.parseColor("#080B12")
        binding = ActivityStartGateBinding.inflate(layoutInflater)
        setContentView(binding.root)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.setSystemBarsAppearance(
                0,
                WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or
                    WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
            )
        }

        oauthCallback = intent?.data?.let { uri ->
            uri.scheme == "gleaum" && uri.host == "auth"
        } ?: false

        if (oauthCallback) {
            saveImplicitSession(intent?.data)
        }

        NativeFirebase.syncSession(this, "router_entry")
        prepareStart()
    }

    private fun prepareStart() {
        showLoading()
        Thread {
            when (SessionManager.validateForLaunch(applicationContext)) {
                SessionManager.Validation.VALID,
                SessionManager.Validation.REFRESHED -> {
                    NativeStartupPrefetcher.prepareAccount(applicationContext)
                    (application as? GleaumApp)?.syncAdvertisingEligibility()
                    runOnUiThread {
                        if (
                            Build.VERSION.SDK_INT >= Build.VERSION_CODES.P &&
                            shouldUseStartupBiometric() &&
                            !oauthCallback
                        ) {
                            showBiometricGate()
                        } else {
                            route(oauthCallback)
                        }
                    }
                }
                SessionManager.Validation.INVALID -> runOnUiThread { route(oauthCallback) }
                SessionManager.Validation.TEMPORARY_FAILURE -> runOnUiThread { showSessionRecovery() }
            }
        }.start()
    }

    private fun shouldUseStartupBiometric(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return false
        val prefs = getSharedPreferences(CAPACITOR_PREFS_NAME, Context.MODE_PRIVATE)
        if (prefs.getString(BIOMETRIC_LOCK_ENABLED_KEY, "false") != "true") return false
        val scopes = prefs.getString(BIOMETRIC_LOCK_SCOPES_KEY, "[\"app\"]").orEmpty()
        return runCatching {
            val array = org.json.JSONArray(scopes)
            (0 until array.length()).any { array.optString(it) == "app" }
        }.getOrDefault(true)
    }

    private fun showLoading() {
        binding.startGateTitle.setText(R.string.startup_preparing)
        binding.startGateMessage.setText(R.string.startup_session_check)
        binding.startGateProgress.visibility = View.VISIBLE
        binding.startGatePrimary.visibility = View.GONE
        binding.startGateSecondary.visibility = View.GONE
    }

    @RequiresApi(Build.VERSION_CODES.P)
    private fun showBiometricGate() {
        binding.startGateTitle.setText(R.string.startup_unlock_title)
        binding.startGateMessage.setText(R.string.startup_unlock_message)
        binding.startGateProgress.visibility = View.GONE
        binding.startGatePrimary.apply {
            setText(R.string.startup_unlock)
            visibility = View.VISIBLE
            isEnabled = true
            setOnClickListener { requestBiometricUnlock() }
        }
        binding.startGateSecondary.apply {
            setText(R.string.startup_login_again)
            visibility = View.VISIBLE
            setOnClickListener {
                SessionManager.clear(this@RouterActivity)
                route(false)
            }
        }
        binding.startGateRoot.postDelayed({ requestBiometricUnlock() }, 220L)
    }

    @RequiresApi(Build.VERSION_CODES.P)
    private fun requestBiometricUnlock() {
        if (biometricPromptOpen || isFinishing || isDestroyed) return
        biometricPromptOpen = true

        val builder = BiometricPrompt.Builder(this)
            .setTitle(getString(R.string.startup_unlock))
            .setSubtitle(getString(R.string.startup_unlock_subtitle))
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            builder.setDeviceCredentialAllowed(true)
        } else {
            builder.setNegativeButton(getString(R.string.common_cancel), mainExecutor) { _, _ ->
                biometricPromptOpen = false
                showBiometricCancelled()
            }
        }

        builder.build().authenticate(
            CancellationSignal(),
            mainExecutor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult?) {
                    biometricPromptOpen = false
                    markBiometricUnlockedNow()
                    route(oauthCallback)
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence?) {
                    biometricPromptOpen = false
                    showBiometricCancelled()
                }
            },
        )
    }

    private fun showBiometricCancelled() {
        if (isFinishing || isDestroyed) return
        binding.startGateMessage.setText(R.string.startup_unlock_cancelled)
        binding.startGatePrimary.isEnabled = true
    }

    private fun markBiometricUnlockedNow() {
        getSharedPreferences(CAPACITOR_PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(BIOMETRIC_UNLOCKED_AT_KEY, System.currentTimeMillis().toString())
            .apply()
    }

    private fun showSessionRecovery() {
        binding.startGateTitle.setText(R.string.startup_network_title)
        binding.startGateMessage.setText(R.string.startup_network_message)
        binding.startGateProgress.visibility = View.GONE
        binding.startGatePrimary.apply {
            setText(R.string.startup_retry)
            visibility = View.VISIBLE
            isEnabled = true
            setOnClickListener { prepareStart() }
        }
        binding.startGateSecondary.apply {
            setText(R.string.startup_login_again)
            visibility = View.VISIBLE
            setOnClickListener {
                SessionManager.clear(this@RouterActivity)
                route(false)
            }
        }
    }

    private fun route(isOAuthCallback: Boolean) {
        if (isFinishing || isDestroyed) return

        val notificationPath = NativeDeepLinkRouter.pathFromIntent(intent)
            ?: if (SessionManager.hasValid(this)) NativePendingRouteStore.peek(this) else null
        val nativeDeepLinkIntent = if (SessionManager.hasValid(this) && !isOAuthCallback) {
            NativeDeepLinkRouter.intentFor(this, notificationPath)
        } else {
            null
        }

        val target = when {
            nativeDeepLinkIntent != null -> null
            SessionManager.hasValid(this) && !notificationPath.isNullOrBlank() -> MainActivity::class.java
            SessionManager.hasValid(this) && NativePortFlags.ENABLE_NATIVE_HOME -> NativeHomePortActivity::class.java
            SessionManager.hasValid(this) -> MainActivity::class.java
            isOAuthCallback              -> MainActivity::class.java  // OAuth 콜백은 Main 으로
            else                         -> LoginActivity::class.java
        }

        startActivity(
            (nativeDeepLinkIntent ?: Intent(this, target!!)).apply {
                // 딥링크 / App Link Intent 데이터 그대로 전달
                data   = intent?.data
                action = intent?.action
                if (intent?.extras != null) putExtras(intent.extras!!)
                if (!notificationPath.isNullOrBlank()) putExtra("start_path", notificationPath)
                // singleTask Main 재활용 방지 — 새 인스턴스로 시작
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
        )
        if (!notificationPath.isNullOrBlank()) NativePendingRouteStore.clear(this)
        finish()
        overridePendingTransition(0, 0)
    }

    /**
     * Supabase implicit OAuth 콜백은 fragment(#)에 토큰이 담긴다.
     * WebView의 appUrlOpen 리스너가 늦게 붙어 콜백을 놓쳐도 네이티브 세션은 먼저 저장한다.
     */
    private fun saveImplicitSession(uri: Uri?) {
        val fragment = uri?.fragment ?: return
        val params = fragment.split("&")
            .mapNotNull { part ->
                val idx = part.indexOf('=')
                if (idx <= 0) return@mapNotNull null
                val key = URLDecoder.decode(part.substring(0, idx), "UTF-8")
                val value = URLDecoder.decode(part.substring(idx + 1), "UTF-8")
                key to value
            }
            .toMap()

        val accessToken = params["access_token"] ?: return
        val refreshToken = params["refresh_token"] ?: return
        val expiresIn = params["expires_in"]?.toLongOrNull() ?: 3600L
        val expiresAt = System.currentTimeMillis() / 1000L + expiresIn

        val session = JSONObject().apply {
            put("access_token", accessToken)
            put("refresh_token", refreshToken)
            put("expires_in", expiresIn)
            put("expires_at", expiresAt)
            put("token_type", params["token_type"] ?: "bearer")
        }

        SessionManager.save(this, session.toString())
        NativeFirebase.syncSession(this, "oauth_callback")
        android.util.Log.d("GleaumRouter", "OAuth implicit 세션 저장 완료")
    }

    companion object {
        private const val CAPACITOR_PREFS_NAME = "CapacitorStorage"
        private const val BIOMETRIC_LOCK_ENABLED_KEY = "gleaum:biometric-lock-enabled"
        private const val BIOMETRIC_LOCK_SCOPES_KEY = "gleaum:biometric-lock-scopes"
        private const val BIOMETRIC_UNLOCKED_AT_KEY = "gleaum:biometric-unlocked-at"
    }
}
