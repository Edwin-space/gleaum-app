package com.gleaum.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsetsController
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.getcapacitor.BridgeActivity
import com.getcapacitor.WebViewListener
import org.json.JSONObject
import java.net.URLDecoder

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // NativeSessionPlugin 등록 (반드시 super.onCreate 전)
        registerPlugin(NativeSessionPlugin::class.java)
        registerPlugin(NativeBiometricPlugin::class.java)
        registerPlugin(NativeAdPlugin::class.java)
        registerPlugin(NativeCalendarPlugin::class.java)

        super.onCreate(savedInstanceState)

        // ── 네이티브 로그인 세션 → WebView localStorage 주입 ─────────────────
        // Supabase JS 클라이언트는 localStorage 에서 세션을 읽어 초기화됨.
        // addDocumentStartJavaScript 로 페이지 스크립트 실행 전에 주입하면
        // 서버 미들웨어 리다이렉트 없이 바로 인증 상태로 시작됨.
        injectSessionIntoWebView()
        installNativeRouteBridge()

        // ── WebView 최적화 ────────────────────────────────────────────────────
        bridge?.webView?.settings?.apply {
            cacheMode         = WebSettings.LOAD_DEFAULT
            domStorageEnabled = true
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                safeBrowsingEnabled = false
            }
        }

        // ── 시작 경로 오버라이드 ──────────────────────────────────────────────
        // 외부 딥링크/레거시 진입에서 start_path가 넘어오면 WebView 시작 경로를 조정한다.
        // Android 이메일 로그인/회원가입은 LoginActivity 네이티브 폼에서 직접 처리한다.
        loadStartPath(intent)

        createNotificationChannels()
        setupEdgeToEdge()
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
        loadStartPath(intent)
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

    /**
     * 오늘 배포용 native bridge.
     *
     * 홈은 기존 WebView를 유지하고, 사용자가 WebView 내부에서 일정/가계부/전체 메뉴로
     * 이동하는 순간만 네이티브 Activity로 넘긴다. Remote Config 도입 전까지는
     * 운영 리스크가 큰 홈 전체 네이티브 전환을 피한다.
     */
    private fun installNativeRouteBridge() {
        val webView = bridge?.webView ?: return
        webView.addJavascriptInterface(NativeRouteBridge(), "GleaumNativeRoute")

        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(
                webView,
                nativeRouteScript(),
                setOf("https://www.gleaum.com")
            )
            webView.post { webView.evaluateJavascript(nativeRouteScript(), null) }
        } else {
            bridge?.addWebViewListener(object : WebViewListener() {
                override fun onPageLoaded(webView: WebView) {
                    webView.evaluateJavascript(nativeRouteScript(), null)
                }
            })
        }
    }

    private fun nativeRouteScript(): String = """
        (function(){
          if (window.__gleaumNativeRouteBridge) return;
          window.__gleaumNativeRouteBridge = true;

          function normalize(input) {
            try {
              var url = new URL(input, location.origin);
              if (url.origin !== location.origin) return null;
              return url.pathname + url.search + url.hash;
            } catch (e) {
              return null;
            }
          }

          function canTryNative(path) {
            if (!path) return false;
            return /^\/home\/?([?#].*)?${'$'}/.test(path) ||
                   /^\/schedules(\/.*)?([?#].*)?${'$'}/.test(path) ||
                   /^\/budget\/?([?#].*)?${'$'}/.test(path) ||
                   /^\/notifications\/?([?#].*)?${'$'}/.test(path) ||
                   /^\/space(\/new)?\/?([?#].*)?${'$'}/.test(path) ||
                   /^\/mypage\/?([?#].*)?${'$'}/.test(path);
          }

          function openNative(path) {
            if (!canTryNative(path)) return false;
            try {
              return !!(window.GleaumNativeRoute && window.GleaumNativeRoute.open(path));
            } catch (e) {
              return false;
            }
          }

          document.addEventListener('click', function(event) {
            var target = event.target;
            while (target && target.tagName !== 'A') target = target.parentElement;
            if (!target) return;
            var path = normalize(target.getAttribute('href') || target.href);
            if (openNative(path)) {
              event.preventDefault();
              event.stopImmediatePropagation();
            }
          }, true);

          ['pushState', 'replaceState'].forEach(function(name) {
            var original = history[name];
            history[name] = function(state, title, url) {
              if (url) {
                var path = normalize(url);
                if (openNative(path)) return;
              }
              return original.apply(this, arguments);
            };
          });
        })();
    """.trimIndent()

    private inner class NativeRouteBridge {
        @JavascriptInterface
        fun open(pathWithQuery: String?): Boolean {
            val path = routePath(pathWithQuery) ?: return false
            val intent = nativeIntentFor(path) ?: return false
            runOnUiThread { startActivity(intent) }
            return true
        }
    }

    private fun routePath(pathWithQuery: String?): String? {
        if (pathWithQuery.isNullOrBlank()) return null
        val uri = Uri.parse(pathWithQuery)
        return uri.path?.takeIf { it.isNotBlank() }
    }

    private fun nativeIntentFor(path: String): Intent? = when {
        path == "/home" -> Intent(this, NativeHomePortActivity::class.java)
        path == "/budget" -> Intent(this, NativeBudgetActivity::class.java)
        path == "/notifications" -> Intent(this, NativeNotificationActivity::class.java)
        path == "/mypage" -> Intent(this, NativeMyMenuActivity::class.java)
        path == "/space" -> Intent(this, NativeSpaceActivity::class.java)
        path == "/space/new" -> Intent(this, NativeSpaceActivity::class.java)
        path == "/schedules" -> Intent(this, NativeScheduleListActivity::class.java)
        path == "/schedules/new" -> Intent(this, NativeScheduleCreateActivity::class.java)
        path.matches(Regex("^/schedules/[^/]+/edit$")) -> {
            val id = path.removePrefix("/schedules/").removeSuffix("/edit")
            Intent(this, NativeScheduleCreateActivity::class.java).putExtra("schedule_id", id)
        }
        path.matches(Regex("^/schedules/[^/]+$")) && path != "/schedules/children" -> {
            val id = path.removePrefix("/schedules/")
            Intent(this, NativeScheduleDetailActivity::class.java).putExtra("schedule_id", id)
        }
        else -> null
    }

    private fun loadStartPath(intent: Intent?) {
        intent?.getStringExtra("start_path")?.takeIf { it.isNotBlank() }?.let { path ->
            nativeIntentFor(routePath(path) ?: path)?.let { nativeIntent ->
                startActivity(nativeIntent)
                return
            }
            bridge?.webView?.post {
                bridge?.webView?.loadUrl("https://www.gleaum.com$path")
            }
        }
    }

    private fun handleIntent(intent: Intent?) {
        intent?.data?.let { uri ->
            if (uri.scheme == "gleaum" && uri.host == "auth") {
                saveImplicitSession(uri)
            }
            if (uri.scheme == "gleaum") {
                bridge?.webView?.post {
                    bridge?.triggerWindowJSEvent("appUrlOpen", "{ url: '${uri}' }")
                }
            }
        }
    }

    /** WebView 리스너가 OAuth 딥링크를 놓쳐도 세션을 네이티브 저장소에 보존한다. */
    private fun saveImplicitSession(uri: Uri) {
        val fragment = uri.fragment ?: return
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
        android.util.Log.d("GleaumMain", "OAuth implicit 세션 저장 완료")
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
