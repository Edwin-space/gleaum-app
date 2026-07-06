package com.gleaum.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val isOAuthCallback = intent?.data?.let { uri ->
            uri.scheme == "gleaum" && uri.host == "auth"
        } ?: false

        if (isOAuthCallback) {
            saveImplicitSession(intent?.data)
        }

        NativeFirebase.syncSession(this, "router_entry")

        val notificationPath = NativeDeepLinkRouter.pathFromIntent(intent)
        val nativeDeepLinkIntent = if (SessionManager.hasValid(this) && !isOAuthCallback) {
            NativeDeepLinkRouter.intentFor(this, notificationPath)
        } else {
            null
        }

        val target = when {
            nativeDeepLinkIntent != null -> null
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
}
