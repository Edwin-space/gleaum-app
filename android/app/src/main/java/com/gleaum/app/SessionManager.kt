package com.gleaum.app

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

/**
 * Supabase 세션을 SharedPreferences 에 저장/조회/삭제하는 유틸
 *
 * 저장 형식: Supabase auth 응답 JSON 그대로 + expires_at(epoch seconds) 추가
 */
object SessionManager {

    private const val PREFS_NAME  = "gleaum_native_session"
    private const val KEY_SESSION = "supabase_session"

    /** 세션 저장 (로그인 성공 시) */
    fun save(context: Context, sessionJson: String) {
        val previous = prefs(context).getString(KEY_SESSION, null)
        if (previous != sessionJson) NativeAccountContextStore.clear(context)
        prefs(context).edit().putString(KEY_SESSION, sessionJson).apply()
        NativeFirebase.syncSession(context, "session_saved")
    }

    /**
     * 유효한 세션 JSON 반환.
     * 만료 60초 전부터 null 반환 → WebView 쪽에서 토큰 갱신 처리
     */
    fun get(context: Context): String? {
        val raw = prefs(context).getString(KEY_SESSION, null) ?: return null
        return try {
            val obj       = JSONObject(raw)
            val expiresAt = obj.optLong("expires_at", 0L)
            val nowSec    = System.currentTimeMillis() / 1000L
            if (expiresAt > 0 && nowSec > expiresAt - 60) null else raw
        } catch (_: Exception) { null }
    }

    /** 만료 여부와 무관하게 refresh_token 포함 원본 반환 (토큰 갱신용) */
    fun getRaw(context: Context): String? =
        prefs(context).getString(KEY_SESSION, null)

    fun hasValid(context: Context): Boolean = get(context) != null

    /** 세션 삭제 (로그아웃 시) */
    fun clear(context: Context) {
        prefs(context).edit().remove(KEY_SESSION).apply()
        NativeAccountContextStore.clear(context)
    }

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
}
