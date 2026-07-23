package com.gleaum.app

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

data class NativeAppSchedule(
    val id: String,
    val title: String,
    val type: String,
    val visibility: String?,
    val startTime: String,
    val endTime: String?,
    val allDay: Boolean,
    val status: String,
    val repeat: String,
    val reminder: Int,
    val memo: String?,
    val locationAddress: String?,
    val locationLat: Double?,
    val locationLng: Double?,
    val referenceUrl: String?,
    val spaceId: String,
    val createdBy: String,
    val participantIds: List<String>,
    val permissions: NativeSchedulePermissions,
) {
    companion object {
        fun fromJson(json: JSONObject): NativeAppSchedule = NativeAppSchedule(
            id = json.optString("id"),
            title = json.optString("title", "제목 없음"),
            type = json.optString("type", "personal"),
            visibility = json.optNullableString("visibility"),
            startTime = json.optString("startTime"),
            endTime = json.optNullableString("endTime"),
            allDay = json.optBoolean("allDay", false),
            status = json.optString("status", "pending"),
            repeat = json.optString("repeat", "none"),
            reminder = json.optInt("reminder", 15),
            memo = json.optNullableString("memo"),
            locationAddress = json.optNullableString("locationAddress"),
            locationLat = json.optNullableDouble("locationLat"),
            locationLng = json.optNullableDouble("locationLng"),
            referenceUrl = json.optNullableString("referenceUrl"),
            spaceId = json.optString("spaceId"),
            createdBy = json.optString("createdBy"),
            participantIds = json.optJSONArray("participantIds").toStringList(),
            permissions = NativeSchedulePermissions.fromJson(json.optJSONObject("permissions")),
        )

        fun listFrom(array: JSONArray): List<NativeAppSchedule> = buildList {
            for (index in 0 until array.length()) {
                val item = array.optJSONObject(index) ?: continue
                add(fromJson(item))
            }
        }
    }
}

data class NativeSchedulePermissions(
    val canEdit: Boolean,
    val canDelete: Boolean,
    val canChangeStatus: Boolean,
    val canRenotify: Boolean,
) {
    companion object {
        fun fromJson(json: JSONObject?): NativeSchedulePermissions = NativeSchedulePermissions(
            canEdit = json?.optBoolean("canEdit", false) == true,
            canDelete = json?.optBoolean("canDelete", false) == true,
            canChangeStatus = json?.optBoolean("canChangeStatus", false) == true,
            canRenotify = json?.optBoolean("canRenotify", false) == true,
        )
    }
}

object NativeScheduleApi {
    private const val BASE_URL = "https://www.gleaum.com/api/native/schedules"
    private const val RENOTIFY_URL = "https://www.gleaum.com/api/notifications/renotify"

    fun list(context: Context, filter: String = "all", search: String = ""): List<NativeAppSchedule> {
        val now = Calendar.getInstance()
        val from = Calendar.getInstance().apply { add(Calendar.DAY_OF_MONTH, -30) }
        val to = Calendar.getInstance().apply { add(Calendar.DAY_OF_MONTH, 365) }
        val query = buildString {
            append("?from=").append(encode(toIsoUtc(from)))
            append("&to=").append(encode(toIsoUtc(to)))
            append("&filter=").append(encode(filter))
            if (search.isNotBlank()) append("&search=").append(encode(search))
        }
        val json = request(context, "GET", BASE_URL + query)
        return NativeAppSchedule.listFrom(json.optJSONArray("schedules") ?: JSONArray())
    }

    fun detail(context: Context, id: String): NativeAppSchedule {
        val json = request(context, "GET", "$BASE_URL/$id")
        return NativeAppSchedule.fromJson(json.optJSONObject("schedule") ?: JSONObject())
    }

    fun create(context: Context, payload: JSONObject): NativeAppSchedule {
        val json = request(context, "POST", BASE_URL, payload)
        return NativeAppSchedule.fromJson(json.optJSONObject("schedule") ?: JSONObject())
    }

    fun update(context: Context, id: String, payload: JSONObject): NativeAppSchedule {
        val json = request(context, "PATCH", "$BASE_URL/$id", payload)
        return NativeAppSchedule.fromJson(json.optJSONObject("schedule") ?: JSONObject())
    }

    fun delete(context: Context, id: String) {
        request(context, "DELETE", "$BASE_URL/$id")
    }

    fun renotify(context: Context, schedule: NativeAppSchedule) {
        request(
            context,
            "POST",
            RENOTIFY_URL,
            JSONObject()
                .put("scheduleId", schedule.id)
                .put("title", "🔔 재알림: ${schedule.title}")
                .put("body", "놓친 일정을 확인해주세요")
                .put("url", "/schedules/${schedule.id}"),
        )
    }

    private fun request(context: Context, method: String, url: String, body: JSONObject? = null): JSONObject {
        val token = accessToken(context)
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 15000
            readTimeout = 20000
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("Accept", "application/json")
            if (body != null) {
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }
        }
        if (body != null) {
            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { it.write(body.toString()) }
        }
        val text = readResponse(connection)
        val json = if (text.isBlank()) JSONObject() else JSONObject(text)
        if (connection.responseCode == HttpURLConnection.HTTP_UNAUTHORIZED) {
            throw IllegalStateException("session_required")
        }
        if (connection.responseCode !in 200..299) {
            val errorCode = json.optString("error").ifBlank { "schedule_request_failed" }
            Log.e("NativeScheduleApi", "$method $url failed (${connection.responseCode}): $errorCode")
            throw IllegalStateException(errorCode)
        }
        return json
    }

    private fun accessToken(context: Context): String {
        val session = SessionManager.get(context) ?: throw IllegalStateException("session_required")
        return JSONObject(session).optString("access_token").takeIf { it.isNotBlank() }
            ?: throw IllegalStateException("session_required")
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }

    private fun encode(value: String): String = URLEncoder.encode(value, Charsets.UTF_8.name())

    fun toIsoUtc(calendar: Calendar): String = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }.format(calendar.time)
}

private fun JSONObject.optNullableString(key: String): String? {
    if (!has(key) || isNull(key)) return null
    return optString(key).takeIf { it.isNotBlank() && it != "null" }
}

private fun JSONObject.optNullableDouble(key: String): Double? {
    if (!has(key) || isNull(key)) return null
    return optDouble(key).takeUnless { it.isNaN() }
}

private fun JSONArray?.toStringList(): List<String> = buildList {
    val source = this@toStringList ?: return@buildList
    for (index in 0 until source.length()) {
        source.optString(index).takeIf { it.isNotBlank() }?.let(::add)
    }
}
