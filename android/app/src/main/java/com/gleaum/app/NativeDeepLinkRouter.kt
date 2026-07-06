package com.gleaum.app

import android.content.Context
import android.content.Intent
import android.net.Uri

/**
 * 네이티브 진입 라우터.
 * FCM 알림, App Link, WebView 브리지에서 동일한 경로 규칙을 쓰기 위한 경량 매퍼입니다.
 */
object NativeDeepLinkRouter {
    fun pathFromUrl(raw: String?): String? {
        if (raw.isNullOrBlank()) return null
        return try {
            val uri = Uri.parse(raw)
            when {
                uri.scheme == "http" || uri.scheme == "https" -> {
                    val path = uri.path?.takeIf { it.isNotBlank() } ?: "/home"
                    val query = uri.encodedQuery?.let { "?$it" }.orEmpty()
                    path + query
                }
                raw.startsWith("/") -> raw
                else -> null
            }
        } catch (_: Exception) {
            null
        }
    }

    fun pathFromIntent(intent: Intent?): String? {
        val extras = intent?.extras
        val url = extras?.getString("url")
            ?: extras?.getString("link")
            ?: extras?.getString("deep_link")
            ?: extras?.getString("gcm.notification.url")
            ?: intent?.dataString
        return pathFromUrl(url)
    }

    fun intentFor(context: Context, pathWithQuery: String?): Intent? {
        val path = routePath(pathWithQuery) ?: return null
        return when {
            path == "/home" -> Intent(context, NativeHomePortActivity::class.java)
            path == "/onboarding" -> Intent(context, NativeOnboardingActivity::class.java)
            path == "/budget" -> Intent(context, NativeBudgetActivity::class.java)
            path == "/notifications" -> Intent(context, NativeNotificationActivity::class.java)
            path == "/mypage" -> Intent(context, NativeMyMenuActivity::class.java)
            path == "/settings/security" -> Intent(context, NativeMyMenuActivity::class.java)
            path == "/settings/calendar" -> Intent(context, NativeMyMenuActivity::class.java)
            path == "/settings/home-layout" -> Intent(context, NativeMyMenuActivity::class.java)
            path == "/space" || path == "/space/new" -> Intent(context, NativeSpaceActivity::class.java)
            path == "/space/settings" -> Intent(context, NativeSpaceActivity::class.java)
            path == "/family" -> Intent(context, NativeSpaceActivity::class.java)
            path.matches(Regex("^/invite/[^/]+$")) -> {
                val code = path.removePrefix("/invite/")
                Intent(context, NativeSpaceActivity::class.java).putExtra("invite_code", code)
            }
            path == "/schedules" -> Intent(context, NativeScheduleListActivity::class.java)
            path == "/schedules/new" -> Intent(context, NativeScheduleCreateActivity::class.java)
            path.matches(Regex("^/schedules/[^/]+/edit$")) -> {
                val id = path.removePrefix("/schedules/").removeSuffix("/edit")
                Intent(context, NativeScheduleCreateActivity::class.java).putExtra("schedule_id", id)
            }
            path.matches(Regex("^/schedules/[^/]+$")) && path != "/schedules/children" -> {
                val id = path.removePrefix("/schedules/")
                Intent(context, NativeScheduleDetailActivity::class.java).putExtra("schedule_id", id)
            }
            path == "/legal/terms" -> legalIntent(context, "이용약관", "/legal/terms")
            path == "/legal/privacy" -> legalIntent(context, "개인정보처리방침", "/legal/privacy")
            else -> null
        }
    }

    private fun routePath(pathWithQuery: String?): String? {
        if (pathWithQuery.isNullOrBlank()) return null
        val uri = Uri.parse(pathWithQuery)
        return uri.path?.takeIf { it.isNotBlank() }
    }

    private fun legalIntent(context: Context, title: String, path: String): Intent =
        Intent(context, LegalWebViewActivity::class.java).apply {
            putExtra(LegalWebViewActivity.EXTRA_TITLE, title)
            putExtra(LegalWebViewActivity.EXTRA_URL, "https://www.gleaum.com$path?view=android-app")
        }
}
