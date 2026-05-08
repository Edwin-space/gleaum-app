package com.gleaum.app

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsetsController
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // ── 1. SplashScreen API 초기화 (반드시 super.onCreate 전에) ──────────
        installSplashScreen()

        super.onCreate(savedInstanceState)

        // ── 2. Edge-to-Edge: WebView가 상태바·네비게이션바 뒤까지 확장 ───────
        setupEdgeToEdge()

        // ── 3. OAuth 딥링크 처리 (앱이 이미 실행 중인 상태에서 딥링크 수신) ──
        handleIntent(intent)
    }

    // onNewIntent: 앱이 포그라운드에 있을 때 딥링크 수신
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    // gleaum:// 딥링크를 Capacitor Bridge(WebView)로 전달
    private fun handleIntent(intent: Intent?) {
        intent?.data?.let { uri ->
            if (uri.scheme == "gleaum") {
                // Capacitor가 앱 시작 시 URL을 처리하도록 Bridge에 전달
                bridge?.webView?.post {
                    bridge?.triggerWindowJSEvent("appUrlOpen", "{ url: '${uri}' }")
                }
            }
        }
    }

    private fun setupEdgeToEdge() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+: WindowInsetsController 사용
            window.insetsController?.apply {
                // 상태바 아이콘 색상: 흰색 (다크 배경 위)
                setSystemBarsAppearance(0, WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS)
                setSystemBarsAppearance(0, WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS)
            }
        } else {
            // Android 10 이하: 레거시 플래그
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            )
        }

        // 상태바/네비게이션바 배경: 다크 네이비
        window.statusBarColor = android.graphics.Color.parseColor("#0F1A2E")
        window.navigationBarColor = android.graphics.Color.parseColor("#0F1A2E")
    }
}
