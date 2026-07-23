package com.gleaum.app

import android.content.Context
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

object NativeHomeApi {
    private const val SUMMARY_URL = "https://www.gleaum.com/api/native/home-summary"

    fun summary(context: Context, source: String = "android-home"): NativeHomePortSummary {
        val session = SessionManager.get(context) ?: throw IllegalStateException("session_required")
        val token = JSONObject(session).optString("access_token").takeIf { it.isNotBlank() }
            ?: throw IllegalStateException("session_required")
        val connection = (URL(SUMMARY_URL).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 15000
            readTimeout = 20000
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("X-Gleaum-Native-Preview", source)
        }
        val responseText = readResponse(connection)
        val json = if (responseText.isBlank()) JSONObject() else JSONObject(responseText)
        if (connection.responseCode == HttpURLConnection.HTTP_UNAUTHORIZED) {
            throw IllegalStateException("session_required")
        }
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException(json.optString("error").ifBlank { "home_summary_failed" })
        }
        return NativeHomePortSummary.fromJson(json)
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }
}
