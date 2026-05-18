package com.gleaum.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
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

        // ── 2. FCM 알림 채널 생성 (Android 8+ 필수) ──────────────────────────
        createNotificationChannels()

        // ── 3. Edge-to-Edge: WebView가 상태바·네비게이션바 뒤까지 확장 ───────
        setupEdgeToEdge()

        // ── 4. OAuth 딥링크 처리 (앱이 이미 실행 중인 상태에서 딥링크 수신) ──
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

    /**
     * FCM 알림 채널 등록 (Android 8 Oreo 이상 필수)
     *
     * FCM 페이로드의 android.notification.channel_id 와 반드시 일치해야 합니다.
     * 채널이 없으면 Android 8+ 에서 알림이 무음 처리되거나 표시되지 않습니다.
     */
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // ── 기본 알림 채널 (캠페인, 시스템 알림) ────────────────────────
            val defaultChannel = NotificationChannel(
                "gleaum_notifications",         // channel_id — FCM 페이로드와 동일
                "글리움 알림",                   // 설정 화면에 표시되는 채널 이름
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description      = "캠페인 및 서비스 알림"
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
            }
            manager.createNotificationChannel(defaultChannel)

            // ── 일정 알림 채널 (리마인더) ─────────────────────────────────
            val scheduleChannel = NotificationChannel(
                "gleaum_schedules",
                "일정 알림",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description      = "일정 리마인더 알림"
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
            }
            manager.createNotificationChannel(scheduleChannel)
        }
    }

    private fun setupEdgeToEdge() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+: WindowInsetsController 사용
            window.insetsController?.apply {
                // 상태바 아이콘: 흰색 (다크 배경)
                setSystemBarsAppearance(0, WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS)
                // 네비게이션 바 아이콘: 어두운 색 (밝은 배경 #FAFAFD 위)
                setSystemBarsAppearance(
                    WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
                )
            }
        } else {
            // Android 10 이하: 레거시 플래그
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR  // 네비게이션 바 아이콘 다크
            )
        }

        // 상태바: 다크 네이비 (앱 상단 배경과 일치)
        window.statusBarColor = android.graphics.Color.parseColor("#0F1A2E")
        // 네비게이션 바: 앱 배경색(#FAFAFD)과 일치 → BottomNav safe area 갭 제거
        window.navigationBarColor = android.graphics.Color.parseColor("#FAFAFD")
    }
}
