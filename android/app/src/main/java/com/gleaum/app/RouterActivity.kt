package com.gleaum.app

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

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

        val target = when {
            SessionManager.hasValid(this) -> MainActivity::class.java
            isOAuthCallback              -> MainActivity::class.java  // OAuth 콜백은 Main 으로
            else                         -> LoginActivity::class.java
        }

        startActivity(
            Intent(this, target).apply {
                // 딥링크 / App Link Intent 데이터 그대로 전달
                data   = intent?.data
                action = intent?.action
                if (intent?.extras != null) putExtras(intent.extras!!)
                // singleTask Main 재활용 방지 — 새 인스턴스로 시작
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
        )
        finish()
        overridePendingTransition(0, 0)
    }
}
