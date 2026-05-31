package com.gleaum.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsetsController
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // ── 1. SplashScreen API 초기화 (반드시 super.onCreate 전에) ──────────
        installSplashScreen()

        super.onCreate(savedInstanceState)

        // ── 2-a. 세션 없으면 LoginActivity 로 ────────────────────────────────
        // NativeAppProvider 가 WebView 에서 세션을 주입받기 때문에
        // LoginActivity 에서 로그인한 세션은 여기서 WebView 에 전달됨.
        if (!SessionManager.hasValid(this) && !isOAuthCallback()) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        // ── 2-b. WebView 성능 최적화 ─────────────────────────────────────────
        bridge?.webView?.settings?.apply {
            cacheMode         = WebSettings.LOAD_DEFAULT
            domStorageEnabled = true
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                safeBrowsingEnabled = false
            }
        }

        // ── 2-c. 세션을 WebView 에 주입 ──────────────────────────────────────
        // NativeAppProvider.tsx 가 window.__GLEAUM_NATIVE_SESSION__ 을 읽어
        // supabase.auth.setSession() 호출
        injectSessionOnLoad()

        // ── 2-d. FCM 알림 채널 생성 ──────────────────────────────────────────
        createNotificationChannels()

        // ── 2-e. Edge-to-Edge 설정 ───────────────────────────────────────────
        setupEdgeToEdge()

        // ── 2-f. OAuth 딥링크 처리 ────────────────────────────────────────────
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    /** gleaum:// 딥링크 → Capacitor Bridge(WebView)로 전달 */
    private fun handleIntent(intent: Intent?) {
        intent?.data?.let { uri ->
            if (uri.scheme == "gleaum") {
                bridge?.webView?.post {
                    bridge?.triggerWindowJSEvent("appUrlOpen", "{ url: '${uri}' }")
                }
            }
        }
    }

    /**
     * 현재 Intent 가 OAuth 콜백 딥링크인지 확인
     * — gleaum://auth/callback 으로 시작되면 세션 없어도 진입 허용
     */
    private fun isOAuthCallback(): Boolean {
        val uri = intent?.data ?: return false
        return uri.scheme == "gleaum" && uri.host == "auth"
    }

    /**
     * WebView 첫 페이지 로드 완료 시 네이티브 세션을 JS 전역변수로 주입.
     * NativeAppProvider.tsx 가 이 값을 읽어 supabase.auth.setSession() 수행.
     */
    private fun injectSessionOnLoad() {
        val sessionJson = SessionManager.get(this) ?: return

        // JSON 내 특수문자 이스케이프 (JS 삽입 안전 처리)
        val escaped = sessionJson
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\n", "\\n")

        bridge?.webView?.webViewClient = object : WebViewClient() {
            private var injected = false

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                if (injected) return
                injected = true
                view?.evaluateJavascript(
                    """(function(){
                        try {
                            window.__GLEAUM_NATIVE_SESSION__ = JSON.parse('$escaped');
                        } catch(e) {}
                    })();""".trimIndent(),
                    null
                )
            }
        }
    }

    // ── FCM 알림 채널 ─────────────────────────────────────────────────────────

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val defaultChannel = NotificationChannel(
                "gleaum_notifications",
                "글리움 알림",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "캠페인 및 서비스 알림"
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
            }
            manager.createNotificationChannel(defaultChannel)

            val scheduleChannel = NotificationChannel(
                "gleaum_schedules",
                "일정 알림",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "일정 리마인더 알림"
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
            }
            manager.createNotificationChannel(scheduleChannel)
        }
    }

    // ── Edge-to-Edge ──────────────────────────────────────────────────────────

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
