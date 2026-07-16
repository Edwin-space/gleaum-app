package com.gleaum.app

import android.content.Context
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

/**
 * Android native surfaces consume the same server-managed capability contract
 * as Web. Missing or invalid context always fails closed.
 */
object NativeAccountContextStore {
    private const val PREFS_NAME = "gleaum_native_account_context"
    private const val KEY_CONTEXT = "account_context"
    private const val CONTEXT_URL = "https://www.gleaum.com/api/session/context"

    fun current(context: Context): NativeAccountContext? {
        val raw = prefs(context).getString(KEY_CONTEXT, null) ?: return null
        return runCatching { NativeAccountContext.fromJson(JSONObject(raw)) }.getOrNull()
    }

    fun capabilities(context: Context): NativeAccountCapabilities =
        current(context)?.capabilities ?: NativeAccountCapabilities.DENIED

    fun save(context: Context, value: NativeAccountContext) {
        prefs(context).edit().putString(KEY_CONTEXT, value.toJson().toString()).apply()
    }

    fun clear(context: Context) {
        prefs(context).edit().remove(KEY_CONTEXT).apply()
    }

    fun refresh(context: Context): NativeAccountContext {
        val session = SessionManager.get(context) ?: throw IllegalStateException("session_required")
        val token = JSONObject(session).optString("access_token").takeIf { it.isNotBlank() }
            ?: throw IllegalStateException("session_required")
        val connection = (URL(CONTEXT_URL).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 5000
            readTimeout = 7000
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("Accept", "application/json")
        }
        val body = readResponse(connection)
        val json = if (body.isBlank()) JSONObject() else JSONObject(body)
        if (connection.responseCode == HttpURLConnection.HTTP_UNAUTHORIZED) {
            throw IllegalStateException("session_required")
        }
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException(json.optString("error").ifBlank { "account_context_failed" })
        }
        return NativeAccountContext.fromJson(json).also { save(context, it) }
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }
}
