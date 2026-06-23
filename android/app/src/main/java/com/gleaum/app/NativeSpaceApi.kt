package com.gleaum.app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

data class NativeSpaceItem(
    val id: String,
    val name: String,
    val role: String,
    val memberCount: Int,
    val inviteCode: String?,
    val isPersonal: Boolean,
    val isActive: Boolean,
) {
    companion object {
        fun fromJson(json: JSONObject): NativeSpaceItem = NativeSpaceItem(
            id = json.optString("id"),
            name = json.optString("name", "공간"),
            role = json.optString("role", "viewer"),
            memberCount = json.optInt("memberCount", 0),
            inviteCode = json.optString("inviteCode").takeIf { it.isNotBlank() },
            isPersonal = json.optBoolean("isPersonal", false),
            isActive = json.optBoolean("isActive", false),
        )

        fun listFrom(array: JSONArray): List<NativeSpaceItem> = buildList {
            for (index in 0 until array.length()) {
                array.optJSONObject(index)?.let { add(fromJson(it)) }
            }
        }
    }
}

data class NativeSpaceMember(
    val id: String,
    val userId: String,
    val displayName: String,
    val email: String,
    val avatar: String?,
    val role: String,
    val isMe: Boolean,
) {
    companion object {
        fun fromJson(json: JSONObject): NativeSpaceMember = NativeSpaceMember(
            id = json.optString("id"),
            userId = json.optString("userId"),
            displayName = json.optString("displayName", "사용자"),
            email = json.optString("email"),
            avatar = json.optString("avatar").takeIf { it.isNotBlank() },
            role = json.optString("role", "viewer"),
            isMe = json.optBoolean("isMe", false),
        )

        fun listFrom(array: JSONArray): List<NativeSpaceMember> = buildList {
            for (index in 0 until array.length()) {
                array.optJSONObject(index)?.let { add(fromJson(it)) }
            }
        }
    }
}

data class NativeSpaceSummary(
    val personalSpaceId: String?,
    val activeSpaceId: String?,
    val activeSpace: NativeSpaceItem?,
    val spaces: List<NativeSpaceItem>,
    val members: List<NativeSpaceMember>,
) {
    companion object {
        fun fromJson(json: JSONObject): NativeSpaceSummary = NativeSpaceSummary(
            personalSpaceId = json.optString("personalSpaceId").takeIf { it.isNotBlank() },
            activeSpaceId = json.optString("activeSpaceId").takeIf { it.isNotBlank() },
            activeSpace = json.optJSONObject("activeSpace")?.let(NativeSpaceItem::fromJson),
            spaces = NativeSpaceItem.listFrom(json.optJSONArray("spaces") ?: JSONArray()),
            members = NativeSpaceMember.listFrom(json.optJSONArray("members") ?: JSONArray()),
        )
    }
}

object NativeSpaceApi {
    private const val SUMMARY_URL = "https://www.gleaum.com/api/native/spaces/summary"

    fun summary(context: Context): NativeSpaceSummary {
        val session = SessionManager.get(context) ?: throw IllegalStateException("session_required")
        val token = JSONObject(session).optString("access_token").takeIf { it.isNotBlank() }
            ?: throw IllegalStateException("session_required")
        val connection = (URL(SUMMARY_URL).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 15000
            readTimeout = 20000
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("X-Gleaum-Native-Preview", "android-space")
        }
        val text = readResponse(connection)
        val json = if (text.isBlank()) JSONObject() else JSONObject(text)
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException(json.optString("error").ifBlank { "space_summary_failed" })
        }
        return NativeSpaceSummary.fromJson(json)
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }
}
