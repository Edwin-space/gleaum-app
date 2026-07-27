package com.gleaum.app

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * Supabase 세션을 SharedPreferences 에 저장/조회/삭제하는 유틸
 *
 * 저장 형식: Supabase auth 응답 JSON 그대로 + expires_at(epoch seconds) 추가
 */
object SessionManager {

    private const val PREFS_NAME  = "gleaum_native_session"
    private const val KEY_SESSION = "supabase_session"

    enum class Validation {
        VALID,
        REFRESHED,
        TEMPORARY_FAILURE,
        INVALID,
    }

    /** 세션 저장 (로그인 성공 시) */
    fun save(context: Context, sessionJson: String) {
        val previous = prefs(context).getString(KEY_SESSION, null)
        if (previous != sessionJson) {
            NativeAccountContextStore.clear(context)
            NativeStartupPrefetcher.reset()
        }
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

    fun hasStoredSession(context: Context): Boolean = !getRaw(context).isNullOrBlank()

    /**
     * Native API calls use this from their existing worker threads. If the
     * access token expired while the app stayed open, refresh it once and
     * continue instead of surfacing a false "login required" state.
     */
    fun accessToken(context: Context): String? {
        fun readCurrent(): String? = get(context)
            ?.let { runCatching { JSONObject(it).optString("access_token") }.getOrNull() }
            ?.takeIf { it.isNotBlank() }

        readCurrent()?.let { return it }
        return when (validateForLaunch(context.applicationContext)) {
            Validation.VALID,
            Validation.REFRESHED -> readCurrent()
            Validation.TEMPORARY_FAILURE,
            Validation.INVALID -> null
        }
    }

    /**
     * Cold-start session validation.
     *
     * Supabase access tokens are intentionally short lived. A stored refresh
     * token must be tried before sending a returning user to LoginActivity.
     * Network/server failures keep the local session so the user can retry;
     * only an explicit 4xx refresh rejection invalidates it.
     */
    @Synchronized
    fun validateForLaunch(context: Context): Validation {
        if (get(context) != null) return Validation.VALID

        val raw = getRaw(context) ?: return Validation.INVALID
        val refreshToken = runCatching { JSONObject(raw).optString("refresh_token") }
            .getOrNull()
            .orEmpty()
        if (refreshToken.isBlank()) {
            clear(context)
            return Validation.INVALID
        }

        return try {
            val url = "${context.getString(R.string.supabase_url)}/auth/v1/token?grant_type=refresh_token"
            val anonKey = context.getString(R.string.supabase_anon_key)
            val connection = (URL(url).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 5000
                readTimeout = 7000
                doOutput = true
                setRequestProperty("apikey", anonKey)
                setRequestProperty("Authorization", "Bearer $anonKey")
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "application/json")
            }
            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(JSONObject().put("refresh_token", refreshToken).toString())
            }

            val body = readResponse(connection)
            val response = if (body.isBlank()) JSONObject() else JSONObject(body)
            when (connection.responseCode) {
                in 200..299 -> {
                    val accessToken = response.optString("access_token")
                    val nextRefreshToken = response.optString("refresh_token")
                    if (accessToken.isBlank() || nextRefreshToken.isBlank()) {
                        Validation.TEMPORARY_FAILURE
                    } else {
                        val expiresIn = response.optLong("expires_in", 3600L)
                        if (!response.has("expires_at") || response.isNull("expires_at")) {
                            response.put("expires_at", System.currentTimeMillis() / 1000L + expiresIn)
                        }
                        if (!response.has("token_type")) response.put("token_type", "bearer")
                        saveRefreshed(context, response.toString())
                        Validation.REFRESHED
                    }
                }
                in 400..499 -> {
                    clear(context)
                    Validation.INVALID
                }
                else -> Validation.TEMPORARY_FAILURE
            }
        } catch (_: Exception) {
            Validation.TEMPORARY_FAILURE
        }
    }

    /** 세션 삭제 (로그아웃 시) */
    fun clear(context: Context) {
        prefs(context).edit().remove(KEY_SESSION).apply()
        NativeAccountContextStore.clear(context)
        NativeStartupPrefetcher.reset()
    }

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private fun saveRefreshed(context: Context, sessionJson: String) {
        prefs(context).edit().putString(KEY_SESSION, sessionJson).apply()
        NativeFirebase.syncSession(context, "session_refreshed")
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }
}
