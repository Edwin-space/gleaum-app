package com.gleaum.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsetsController
import android.webkit.WebSettings
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // NativeSessionPlugin 등록 (반드시 super.onCreate 전)
        registerPlugin(NativeSessionPlugin::class.java)
        registerPlugin(NativeAdPlugin::class.java)

        super.onCreate(savedInstanceState)

        // ── 네이티브 로그인 세션 → WebView localStorage 주입 ─────────────────
        // Supabase JS 클라이언트는 localStorage 에서 세션을 읽어 초기화됨.
        // addDocumentStartJavaScript 로 페이지 스크립트 실행 전에 주입하면
        // 서버 미들웨어 리다이렉트 없이 바로 인증 상태로 시작됨.
        injectSessionIntoWebView()

        // ── WebView 최적화 ────────────────────────────────────────────────────
        bridge?.webView?.settings?.apply {
            cacheMode         = WebSettings.LOAD_DEFAULT
            domStorageEnabled = true
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                safeBrowsingEnabled = false
            }
        }

        createNotificationChannels()
        setupEdgeToEdge()
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    /**
     * 네이티브 로그인(LoginActivity)에서 저장한 세션을
     * WebView 의 localStorage 에 직접 주입.
     *
     * Supabase JS 클라이언트 초기화 전에 실행되므로 서버 미들웨어가
     * 세션을 인식하고 /login 으로 리다이렉트하는 문제를 방지.
     *
     * 키 형식: sb-{projectRef}-auth-token
     */
    private fun injectSessionIntoWebView() {
        val sessionJson = SessionManager.get(this) ?: return

        if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            android.util.Log.w("GleaumMain", "DOCUMENT_START_SCRIPT 미지원 기기")
            return
        }

        val projectRef = "tyvjdsescukaeorcuaga"
        val storageKey = "sb-$projectRef-auth-token"
        // JS 인젝션 안전 이스케이프
        val escaped = sessionJson
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\n", "\\n")
            .replace("\r", "")

        val script = "(function(){try{localStorage.setItem('$storageKey','$escaped');}catch(e){}})()"

        WebViewCompat.addDocumentStartJavaScript(
            bridge!!.webView,
            script,
            setOf("https://www.gleaum.com")
        )
        android.util.Log.d("GleaumMain", "세션 localStorage 주입 완료")
    }

    private fun handleIntent(intent: Intent?) {
        intent?.data?.let { uri ->
            if (uri.scheme == "gleaum") {
                bridge?.webView?.post {
                    bridge?.triggerWindowJSEvent("appUrlOpen", "{ url: '${uri}' }")
                }
            }
        }
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            NotificationChannel("gleaum_notifications", "글리움 알림",
                NotificationManager.IMPORTANCE_HIGH).apply {
                description = "캠페인 및 서비스 알림"
                enableLights(true); enableVibration(true); setShowBadge(true)
                manager.createNotificationChannel(this)
            }

            NotificationChannel("gleaum_schedules", "일정 알림",
                NotificationManager.IMPORTANCE_HIGH).apply {
                description = "일정 리마인더 알림"
                enableLights(true); enableVibration(true); setShowBadge(true)
                manager.createNotificationChannel(this)
            }
        }
    }

    private fun setupEdgeToEdge() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.apply {
                setSystemBarsAppearance(0, WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS)
                setSystemBarsAppearance(
                    WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
                )
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
            )
        }
        window.statusBarColor     = android.graphics.Color.parseColor("#0F1A2E")
        window.navigationBarColor = android.graphics.Color.parseColor("#FAFAFD")
    }
}
