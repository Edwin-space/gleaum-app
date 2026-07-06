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
    val onboardingCompleted: Boolean,
    val timezone: String,
    val activeSpaceName: String?,
    val memberCount: Int,
    val todayCount: Int,
    val completedCount: Int,
    val pendingCount: Int,
    val upcomingCount: Int,
    val today: List<NativeHomePortSchedule>,
    val upcoming: List<NativeHomePortSchedule>,
    val range: List<NativeHomePortSchedule>,
    val selectedDate: String,
    val calendarMonth: String,
    val calendarWeek: List<NativeHomePortCalendarDay>,
    val calendarDays: List<NativeHomePortCalendarDay>,
    val incomeTotal: Long,
    val expenseTotal: Long,
    val net: Long,
) {
    companion object {
        fun fromJson(json: JSONObject): NativeHomePortSummary {
            val user = json.optJSONObject("user") ?: JSONObject()
            val spaces = json.optJSONObject("spaces") ?: JSONObject()
            val schedules = json.optJSONObject("schedules") ?: JSONObject()
            val calendar = json.optJSONObject("calendar") ?: JSONObject()
            val ledger = json.optJSONObject("ledger") ?: JSONObject()
            val today = NativeHomePortSchedule.listFrom(schedules.optJSONArray("today") ?: JSONArray())
            val upcoming = NativeHomePortSchedule.listFrom(schedules.optJSONArray("upcoming") ?: JSONArray())
            val range = NativeHomePortSchedule.listFrom(schedules.optJSONArray("range") ?: JSONArray())

            return NativeHomePortSummary(
                displayName = user.optString("displayName", "사용자"),
                onboardingCompleted = user.optBoolean("onboardingCompleted", true),
                timezone = user.optString("timezone", "Asia/Seoul"),
                activeSpaceName = spaces.optNullableString("activeSpaceName"),
                memberCount = spaces.optInt("memberCount", 0),
                todayCount = schedules.optInt("todayCount", today.size),
                completedCount = schedules.optInt("completedCount", today.count { it.status == "completed" }),
                pendingCount = schedules.optInt("pendingCount", today.count { it.status != "completed" }),
                upcomingCount = schedules.optInt("upcomingCount", 0),
                today = today,
                upcoming = upcoming,
                range = range,
                selectedDate = calendar.optString("selectedDate", ""),
                calendarMonth = calendar.optString("month", ""),
                calendarWeek = NativeHomePortCalendarDay.listFrom(calendar.optJSONArray("week") ?: JSONArray()),
                calendarDays = NativeHomePortCalendarDay.listFrom(calendar.optJSONArray("days") ?: JSONArray()),
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

data class NativeHomePortCalendarDay(
    val date: String,
    val day: Int,
    val count: Int,
    val types: List<String>,
    val completedCount: Int,
    val pendingCount: Int,
    val isToday: Boolean,
) {
    companion object {
        fun listFrom(array: JSONArray): List<NativeHomePortCalendarDay> = buildList {
            for (index in 0 until array.length()) {
                val item = array.optJSONObject(index) ?: continue
                add(
                    NativeHomePortCalendarDay(
                        date = item.optString("date"),
                        day = item.optInt("day", 0),
                        count = item.optInt("count", 0),
                        types = item.optJSONArray("types")?.let { types ->
                            buildList {
                                for (typeIndex in 0 until types.length()) {
                                    types.optString(typeIndex).takeIf { it.isNotBlank() }?.let(::add)
                                }
                            }
                        }.orEmpty(),
                        completedCount = item.optInt("completedCount", 0),
                        pendingCount = item.optInt("pendingCount", 0),
                        isToday = item.optBoolean("isToday", false),
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
