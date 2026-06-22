package com.gleaum.app

import org.json.JSONArray
import org.json.JSONObject

/**
 * Data contract for Android Home Native Port.
 *
 * Source endpoint: GET https://www.gleaum.com/api/native/home-summary
 * Keep this model aligned with docs/18-android-home-port-snapshot.md before
 * enabling NativePortFlags.ENABLE_NATIVE_HOME.
 */
data class NativeHomePortSummary(
    val displayName: String,
    val timezone: String,
    val activeSpaceName: String?,
    val memberCount: Int,
    val todayCount: Int,
    val upcomingCount: Int,
    val today: List<NativeHomePortSchedule>,
    val upcoming: List<NativeHomePortSchedule>,
    val incomeTotal: Long,
    val expenseTotal: Long,
    val net: Long,
) {
    companion object {
        fun fromJson(json: JSONObject): NativeHomePortSummary {
            val user = json.optJSONObject("user") ?: JSONObject()
            val spaces = json.optJSONObject("spaces") ?: JSONObject()
            val schedules = json.optJSONObject("schedules") ?: JSONObject()
            val ledger = json.optJSONObject("ledger") ?: JSONObject()

            return NativeHomePortSummary(
                displayName = user.optString("displayName", "사용자"),
                timezone = user.optString("timezone", "Asia/Seoul"),
                activeSpaceName = spaces.optNullableString("activeSpaceName"),
                memberCount = spaces.optInt("memberCount", 0),
                todayCount = schedules.optInt("todayCount", 0),
                upcomingCount = schedules.optInt("upcomingCount", 0),
                today = NativeHomePortSchedule.listFrom(schedules.optJSONArray("today") ?: JSONArray()),
                upcoming = NativeHomePortSchedule.listFrom(schedules.optJSONArray("upcoming") ?: JSONArray()),
                incomeTotal = ledger.optLong("incomeTotal", 0L),
                expenseTotal = ledger.optLong("expenseTotal", 0L),
                net = ledger.optLong("net", 0L),
            )
        }
    }
}

data class NativeHomePortSchedule(
    val id: String,
    val title: String,
    val type: String,
    val visibility: String?,
    val startTime: String,
    val endTime: String?,
    val status: String,
    val amount: Long?,
) {
    companion object {
        fun listFrom(array: JSONArray): List<NativeHomePortSchedule> = buildList {
            for (index in 0 until array.length()) {
                val item = array.optJSONObject(index) ?: continue
                add(
                    NativeHomePortSchedule(
                        id = item.optString("id"),
                        title = item.optString("title", "제목 없음"),
                        type = item.optString("type", "personal"),
                        visibility = item.optNullableString("visibility"),
                        startTime = item.optString("startTime"),
                        endTime = item.optNullableString("endTime"),
                        status = item.optString("status", "pending"),
                        amount = if (item.has("amount") && !item.isNull("amount")) item.optLong("amount") else null,
                    )
                )
            }
        }
    }
}

private fun JSONObject.optNullableString(key: String): String? {
    if (!has(key) || isNull(key)) return null
    return optString(key).takeIf { it.isNotBlank() && it != "null" }
}
