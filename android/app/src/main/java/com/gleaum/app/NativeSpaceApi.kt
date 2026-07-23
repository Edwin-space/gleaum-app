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
    val spaceKind: String,
    val purpose: String?,
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
            spaceKind = json.optString("spaceKind", if (json.optBoolean("isPersonal", false)) "personal" else "general"),
            purpose = json.optString("purpose").takeIf { it.isNotBlank() && it != "null" },
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

data class NativeSpacePost(
    val id: String,
    val type: String,
    val content: String,
    val pinned: Boolean,
    val authorName: String,
    val commentCount: Int,
    val createdAt: String,
) {
    companion object {
        fun fromJson(json: JSONObject): NativeSpacePost = NativeSpacePost(
            id = json.optString("id"),
            type = json.optString("type", "general"),
            content = json.optString("content"),
            pinned = json.optBoolean("pinned", false),
            authorName = json.optString("authorName", "공간 멤버"),
            commentCount = json.optInt("commentCount", 0),
            createdAt = json.optString("createdAt"),
        )

        fun listFrom(array: JSONArray): List<NativeSpacePost> = buildList {
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
    val recentPosts: List<NativeSpacePost>,
    val upcomingSchedules: List<NativeAppSchedule>,
) {
    companion object {
        fun fromJson(json: JSONObject): NativeSpaceSummary = NativeSpaceSummary(
            personalSpaceId = json.optString("personalSpaceId").takeIf { it.isNotBlank() },
            activeSpaceId = json.optString("activeSpaceId").takeIf { it.isNotBlank() },
            activeSpace = json.optJSONObject("activeSpace")?.let(NativeSpaceItem::fromJson),
            spaces = NativeSpaceItem.listFrom(json.optJSONArray("spaces") ?: JSONArray()),
            members = NativeSpaceMember.listFrom(json.optJSONArray("members") ?: JSONArray()),
            recentPosts = NativeSpacePost.listFrom(json.optJSONArray("recentPosts") ?: JSONArray()),
            upcomingSchedules = NativeAppSchedule.listFrom(json.optJSONArray("upcomingSchedules") ?: JSONArray()),
        )
    }
}

object NativeSpaceApi {
    private const val SUMMARY_URL = "https://www.gleaum.com/api/native/spaces/summary"
    private const val SPACE_URL = "https://www.gleaum.com/api/native/spaces"

    fun summary(context: Context): NativeSpaceSummary {
        return NativeSpaceSummary.fromJson(request(context, "GET", SUMMARY_URL))
    }

    fun updateName(context: Context, spaceId: String, name: String): NativeSpaceSummary {
        return NativeSpaceSummary.fromJson(request(context, "PATCH", "$SPACE_URL/$spaceId", JSONObject().put("name", name)))
    }

    fun activate(context: Context, spaceId: String): NativeSpaceSummary {
        return NativeSpaceSummary.fromJson(request(context, "POST", "$SPACE_URL/$spaceId/activate"))
    }

    fun createPost(context: Context, spaceId: String, content: String): NativeSpaceSummary {
        return NativeSpaceSummary.fromJson(
            request(context, "POST", "$SPACE_URL/$spaceId/posts", JSONObject().put("content", content)),
        )
    }

    fun create(context: Context, name: String): NativeSpaceSummary {
        return NativeSpaceSummary.fromJson(request(context, "POST", SPACE_URL, JSONObject().put("name", name)))
    }

    fun join(context: Context, code: String): NativeSpaceSummary {
        return NativeSpaceSummary.fromJson(request(context, "POST", "$SPACE_URL/join", JSONObject().put("code", code)))
    }

    fun regenerateInviteCode(context: Context, spaceId: String): NativeSpaceSummary {
        return NativeSpaceSummary.fromJson(request(context, "POST", "$SPACE_URL/$spaceId/invite-code"))
    }

    fun convertToFamily(context: Context, spaceId: String): NativeSpaceSummary {
        return NativeSpaceSummary.fromJson(request(context, "POST", "$SPACE_URL/$spaceId/family"))
    }

    fun delete(context: Context, spaceId: String): NativeSpaceSummary {
        return NativeSpaceSummary.fromJson(request(context, "DELETE", "$SPACE_URL/$spaceId"))
    }

    fun updateMemberRole(context: Context, spaceId: String, userId: String, role: String): NativeSpaceSummary {
        return NativeSpaceSummary.fromJson(request(context, "PATCH", "$SPACE_URL/$spaceId/members/$userId", JSONObject().put("role", role)))
    }

    fun removeMember(context: Context, spaceId: String, userId: String): NativeSpaceSummary {
        return NativeSpaceSummary.fromJson(request(context, "DELETE", "$SPACE_URL/$spaceId/members/$userId"))
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
            setRequestProperty("X-Gleaum-Native-Preview", "android-space")
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
            throw IllegalStateException(json.optString("error").ifBlank { "space_summary_failed" })
        }
        return json
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }
}
