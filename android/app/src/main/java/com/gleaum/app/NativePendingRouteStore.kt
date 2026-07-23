package com.gleaum.app

import android.content.Context

/**
 * 외부 App Link로 로그인 화면에 진입한 사용자의 목적지를 OAuth 왕복 동안 보존한다.
 * 짧은 TTL을 두어 오래된 초대 경로가 일반 앱 실행에 재사용되지 않게 한다.
 */
object NativePendingRouteStore {
    private const val PREFS = "gleaum_pending_route"
    private const val KEY_PATH = "path"
    private const val KEY_SAVED_AT = "saved_at"
    private const val TTL_MILLIS = 15 * 60 * 1000L

    fun save(context: Context, path: String?) {
        if (path.isNullOrBlank()) return
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PATH, path)
            .putLong(KEY_SAVED_AT, System.currentTimeMillis())
            .apply()
    }

    fun peek(context: Context): String? {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val savedAt = prefs.getLong(KEY_SAVED_AT, 0L)
        if (savedAt <= 0L || System.currentTimeMillis() - savedAt > TTL_MILLIS) {
            clear(context)
            return null
        }
        return prefs.getString(KEY_PATH, null)?.takeIf { it.isNotBlank() }
    }

    fun clear(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
    }
}
