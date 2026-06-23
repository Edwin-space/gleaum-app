package com.gleaum.app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

data class NativeNotificationItem(
    val id: String,
    val scheduleId: String?,
    val title: String,
    val body: String,
    val type: String,
    val read: Boolean,
    val createdAt: String,
) {
    companion object {
        fun fromJson(json: JSONObject): NativeNotificationItem = NativeNotificationItem(
            id = json.optString("id"),
            scheduleId = json.optString("scheduleId").takeIf { it.isNotBlank() && it != "null" },
            title = json.optString("title", "알림"),
            body = json.optString("body"),
            type = json.optString("type", "system"),
            read = json.optBoolean("read", false),
            createdAt = json.optString("createdAt"),
        )

        fun listFrom(array: JSONArray): List<NativeNotificationItem> = buildList {
            for (index in 0 until array.length()) {
                array.optJSONObject(index)?.let { add(fromJson(it)) }
            }
        }
    }
}

data class NativeNotificationSummary(
    val notifications: List<NativeNotificationItem>,
    val unreadCount: Int,
) {
    companion object {
        fun fromJson(json: JSONObject): NativeNotificationSummary = NativeNotificationSummary(
            notifications = NativeNotificationItem.listFrom(json.optJSONArray("notifications") ?: JSONArray()),
            unreadCount = json.optInt("unreadCount", 0),
        )
    }
}

object NativeNotificationApi {
    private const val NOTIFICATIONS_URL = "https://www.gleaum.com/api/native/notifications"

    fun fetch(context: Context): NativeNotificationSummary {
        return NativeNotificationSummary.fromJson(request(context, "GET", NOTIFICATIONS_URL))
    }

    fun markAllRead(context: Context) {
        request(context, "PATCH", NOTIFICATIONS_URL)
    }

    fun markRead(context: Context, id: String) {
        request(context, "PATCH", "$NOTIFICATIONS_URL/$id")
    }

    private fun request(context: Context, method: String, url: String): JSONObject {
        val session = SessionManager.get(context) ?: throw IllegalStateException("session_required")
        val token = JSONObject(session).optString("access_token").takeIf { it.isNotBlank() }
            ?: throw IllegalStateException("session_required")
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 15000
            readTimeout = 20000
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("X-Gleaum-Native-Preview", "android-notifications")
        }
        val text = readResponse(connection)
        val json = if (text.isBlank()) JSONObject() else JSONObject(text)
        if (connection.responseCode == HttpURLConnection.HTTP_UNAUTHORIZED) {
            throw IllegalStateException("session_required")
        }
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException(json.optString("error").ifBlank { "notifications_request_failed" })
        }
        return json
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }
}
