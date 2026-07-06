package com.gleaum.app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.TimeZone

object NativeOnboardingApi {
    private const val COMPLETE_URL = "https://www.gleaum.com/api/native/onboarding/complete"

    fun complete(
        context: Context,
        displayName: String,
        realName: String?,
        nameDisplayMode: String,
        primaryGoal: String,
        homeLayout: String,
        enabledModules: List<String>,
        defaultReminderMinutes: Int,
        spaceIntent: List<String>,
        notificationSettings: JSONObject,
    ): NativeProfile {
        val body = JSONObject()
            .put("displayName", displayName)
            .put("realName", realName ?: JSONObject.NULL)
            .put("nameDisplayMode", nameDisplayMode)
            .put("primaryGoal", primaryGoal)
            .put("homeLayout", homeLayout)
            .put("enabledModules", JSONArray(enabledModules))
            .put("defaultReminderMinutes", defaultReminderMinutes)
            .put("spaceIntent", JSONArray(spaceIntent))
            .put("notificationSettings", notificationSettings)
            .put("timezone", TimeZone.getDefault().id.ifBlank { "Asia/Seoul" })
            .put("locale", Locale.getDefault().toLanguageTag().ifBlank { "ko-KR" })

        val json = request(context, body)
        return NativeProfile.fromJson(json.optJSONObject("profile") ?: JSONObject())
    }

    private fun request(context: Context, body: JSONObject): JSONObject {
        val session = SessionManager.get(context) ?: throw IllegalStateException("session_required")
        val token = JSONObject(session).optString("access_token").takeIf { it.isNotBlank() }
            ?: throw IllegalStateException("session_required")
        val connection = (URL(COMPLETE_URL).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15000
            readTimeout = 20000
            doOutput = true
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("X-Gleaum-Native-Preview", "android-onboarding")
        }
        OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { it.write(body.toString()) }
        val text = readResponse(connection)
        val json = if (text.isBlank()) JSONObject() else JSONObject(text)
        if (connection.responseCode == HttpURLConnection.HTTP_UNAUTHORIZED) throw IllegalStateException("session_required")
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException(json.optString("error").ifBlank { "onboarding_complete_failed" })
        }
        return json
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }
}
