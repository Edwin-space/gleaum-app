package com.gleaum.app

import android.content.Context
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

data class NativeProfile(
    val id: String,
    val email: String,
    val name: String,
    val displayName: String,
    val realName: String?,
    val nameDisplayMode: String,
    val avatar: String?,
    val timezone: String,
    val locale: String,
    val onboardingCompleted: Boolean,
    val notificationSettings: NativeNotificationSettings?,
) {
    companion object {
        fun fromJson(json: JSONObject): NativeProfile = NativeProfile(
            id = json.optString("id"),
            email = json.optString("email"),
            name = json.optString("name", "사용자"),
            displayName = json.optString("displayName", json.optString("name", "사용자")),
            realName = json.optString("realName").takeIf { it.isNotBlank() && it != "null" },
            nameDisplayMode = json.optString("nameDisplayMode", "nickname"),
            avatar = json.optString("avatar").takeIf { it.isNotBlank() && it != "null" },
            timezone = json.optString("timezone", "Asia/Seoul"),
            locale = json.optString("locale", "ko-KR"),
            onboardingCompleted = json.optBoolean("onboardingCompleted", false),
            notificationSettings = json.optJSONObject("notificationSettings")?.let { NativeNotificationSettings.fromJson(it) },
        )
    }
}

data class NativeNotificationSettings(
    val scheduleReminders: Boolean,
    val routineReminders: Boolean,
    val expenseReminders: Boolean,
) {
    companion object {
        fun fromJson(json: JSONObject): NativeNotificationSettings = NativeNotificationSettings(
            scheduleReminders = json.optBoolean("scheduleReminders", true),
            routineReminders = json.optBoolean("routineReminders", true),
            expenseReminders = json.optBoolean("expenseReminders", true),
        )
    }
}

object NativeProfileApi {
    private const val PROFILE_URL = "https://www.gleaum.com/api/native/profile"
    private const val PASSWORD_URL = "https://www.gleaum.com/api/native/security/password"

    fun fetch(context: Context): NativeProfile {
        val json = request(context, "GET", PROFILE_URL)
        return NativeProfile.fromJson(json.optJSONObject("profile") ?: JSONObject())
    }

    fun update(context: Context, displayName: String, realName: String?, nameDisplayMode: String): NativeProfile {
        val body = JSONObject()
            .put("displayName", displayName)
            .put("realName", realName ?: JSONObject.NULL)
            .put("nameDisplayMode", nameDisplayMode)
        val json = request(context, "PATCH", PROFILE_URL, body)
        return NativeProfile.fromJson(json.optJSONObject("profile") ?: JSONObject())
    }

    fun updatePassword(context: Context, password: String) {
        val body = JSONObject().put("password", password)
        request(context, "PATCH", PASSWORD_URL, body)
    }

    fun updateNotificationSettings(
        context: Context,
        scheduleEnabled: Boolean,
        budgetEnabled: Boolean,
    ): NativeProfile {
        val settings = JSONObject()
            .put("scheduleReminders", scheduleEnabled)
            .put("routineReminders", scheduleEnabled)
            .put("expenseReminders", budgetEnabled)
        val json = request(
            context,
            "PATCH",
            PROFILE_URL,
            JSONObject().put("notificationSettings", settings),
        )
        val profileJson = json.optJSONObject("profile") ?: throw IllegalStateException("profile_update_failed")
        if (!profileJson.has("notificationSettings")) {
            throw IllegalStateException("notification_settings_not_supported")
        }
        return NativeProfile.fromJson(profileJson)
    }

    private fun request(context: Context, method: String, url: String, body: JSONObject? = null): JSONObject {
        val session = SessionManager.get(context) ?: throw IllegalStateException("session_required")
        val token = JSONObject(session).optString("access_token").takeIf { it.isNotBlank() }
            ?: throw IllegalStateException("session_required")
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 15000
            readTimeout = 20000
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("X-Gleaum-Native-Preview", "android-profile")
            if (body != null) {
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }
        }
        if (body != null) {
            java.io.OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { it.write(body.toString()) }
        }
        val text = readResponse(connection)
        val json = if (text.isBlank()) JSONObject() else JSONObject(text)
        if (connection.responseCode == HttpURLConnection.HTTP_UNAUTHORIZED) {
            throw IllegalStateException("session_required")
        }
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException(json.optString("error").ifBlank { "profile_request_failed" })
        }
        return json
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }
}
