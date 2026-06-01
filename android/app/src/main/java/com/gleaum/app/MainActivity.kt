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
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()

        registerPlugin(NativeSessionPlugin::class.java)

        super.onCreate(savedInstanceState)

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
