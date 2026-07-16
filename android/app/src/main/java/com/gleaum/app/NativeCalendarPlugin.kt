package com.gleaum.app

import android.Manifest
import android.content.ContentUris
import android.content.ContentValues
import android.provider.CalendarContract
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

/**
 * NativeCalendarPlugin — Android 기기 캘린더 연동 브리지.
 *
 * 1차 범위:
 * - 캘린더 권한 확인/요청
 * - 로컬 캘린더 목록 조회
 * - 글리움 일정을 기기 캘린더에 생성
 * - 글리움이 생성한 기기 일정의 수동 동기화(수정/삭제)
 * - 지정 기간의 기기 캘린더 이벤트 조회
 */
@CapacitorPlugin(
    name = "NativeCalendar",
    permissions = [
        Permission(
            strings = [Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR],
            alias = NativeCalendarPlugin.CALENDAR_PERMISSION
        )
    ]
)
class NativeCalendarPlugin : Plugin() {

    companion object {
        const val CALENDAR_PERMISSION = "calendar"
        private const val GLEAUM_EVENT_MARKER = "gleaum:schedule:"
    }

    @PluginMethod
    override fun checkPermissions(call: PluginCall) {
        call.resolve(permissionResult())
    }

    @PluginMethod
    override fun requestPermissions(call: PluginCall) {
        if (getPermissionState(CALENDAR_PERMISSION) == PermissionState.GRANTED) {
            call.resolve(permissionResult())
            return
        }
        requestPermissionForAlias(CALENDAR_PERMISSION, call, "calendarPermissionCallback")
    }

    @PermissionCallback
    private fun calendarPermissionCallback(call: PluginCall) {
        call.resolve(permissionResult())
    }

    @PluginMethod
    fun listCalendars(call: PluginCall) {
        if (!hasCalendarPermission()) {
            call.reject("calendar_permission_required")
            return
        }

        val calendars = JSArray()
        val projection = arrayOf(
            CalendarContract.Calendars._ID,
            CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
            CalendarContract.Calendars.ACCOUNT_NAME,
            CalendarContract.Calendars.OWNER_ACCOUNT,
            CalendarContract.Calendars.CALENDAR_COLOR,
            CalendarContract.Calendars.VISIBLE,
            CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL
        )

        activity.contentResolver.query(
            CalendarContract.Calendars.CONTENT_URI,
            projection,
            null,
            null,
            "${CalendarContract.Calendars.CALENDAR_DISPLAY_NAME} ASC"
        )?.use { cursor ->
            val idIdx = cursor.getColumnIndexOrThrow(CalendarContract.Calendars._ID)
            val nameIdx = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME)
            val accountIdx = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.ACCOUNT_NAME)
            val ownerIdx = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.OWNER_ACCOUNT)
            val colorIdx = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.CALENDAR_COLOR)
            val visibleIdx = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.VISIBLE)
            val accessIdx = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL)

            while (cursor.moveToNext()) {
                val accessLevel = cursor.getInt(accessIdx)
                val canWrite = accessLevel >= CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR
                calendars.put(JSObject().apply {
                    put("id", cursor.getLong(idIdx).toString())
                    put("name", cursor.getString(nameIdx) ?: "캘린더")
                    put("accountName", cursor.getString(accountIdx) ?: "")
                    put("ownerAccount", cursor.getString(ownerIdx) ?: "")
                    put("color", cursor.getInt(colorIdx))
                    put("visible", cursor.getInt(visibleIdx) == 1)
                    put("canWrite", canWrite)
                })
            }
        }

        call.resolve(JSObject().apply { put("calendars", calendars) })
    }

    @PluginMethod
    fun createEvent(call: PluginCall) {
        if (!hasCalendarPermission()) {
            call.reject("calendar_permission_required")
            return
        }

        val calendarId = getLongValue(call, "calendarId")
        val title = call.getString("title")?.trim()
        val startTime = getLongValue(call, "startTime")

        if (calendarId == null) {
            call.reject("calendar_id_required")
            return
        }
        if (title.isNullOrEmpty()) {
            call.reject("title_required")
            return
        }
        if (startTime == null) {
            call.reject("start_time_required")
            return
        }

        val endTime = getLongValue(call, "endTime") ?: (startTime + 60L * 60L * 1000L)
        val allDay = call.getBoolean("allDay", false) ?: false
        val timezone = call.getString("timezone") ?: java.util.TimeZone.getDefault().id
        val location = call.getString("location")
        val description = call.getString("description")

        if (!description.orEmpty().contains(GLEAUM_EVENT_MARKER)) {
            call.reject("gleaum_event_marker_required")
            return
        }

        val values = ContentValues().apply {
            put(CalendarContract.Events.CALENDAR_ID, calendarId)
            put(CalendarContract.Events.TITLE, title)
            put(CalendarContract.Events.DTSTART, startTime)
            put(CalendarContract.Events.DTEND, endTime)
            put(CalendarContract.Events.EVENT_TIMEZONE, timezone)
            put(CalendarContract.Events.ALL_DAY, if (allDay) 1 else 0)
            if (!location.isNullOrBlank()) put(CalendarContract.Events.EVENT_LOCATION, location)
            if (!description.isNullOrBlank()) put(CalendarContract.Events.DESCRIPTION, description)
        }

        val uri = activity.contentResolver.insert(CalendarContract.Events.CONTENT_URI, values)
        val eventId = uri?.lastPathSegment
        if (eventId == null) {
            call.reject("event_create_failed")
            return
        }

        call.resolve(JSObject().apply { put("eventId", eventId) })
    }

    @PluginMethod
    fun updateEvent(call: PluginCall) {
        if (!hasCalendarPermission()) {
            call.reject("calendar_permission_required")
            return
        }

        val eventId = getLongValue(call, "eventId")
        val title = call.getString("title")?.trim()
        val startTime = getLongValue(call, "startTime")
        if (eventId == null) {
            call.reject("event_id_required")
            return
        }
        if (title.isNullOrEmpty()) {
            call.reject("title_required")
            return
        }
        if (startTime == null) {
            call.reject("start_time_required")
            return
        }

        val calendarId = getLongValue(call, "calendarId")
        val description = call.getString("description").orEmpty()
        if (calendarId == null || !isGleaumEvent(eventId, calendarId)) {
            call.reject("gleaum_event_not_found")
            return
        }
        if (!description.contains(GLEAUM_EVENT_MARKER)) {
            call.reject("gleaum_event_marker_required")
            return
        }

        val endTime = getLongValue(call, "endTime") ?: (startTime + 60L * 60L * 1000L)
        val allDay = call.getBoolean("allDay", false) ?: false
        val timezone = call.getString("timezone") ?: java.util.TimeZone.getDefault().id
        val values = ContentValues().apply {
            put(CalendarContract.Events.TITLE, title)
            put(CalendarContract.Events.DTSTART, startTime)
            put(CalendarContract.Events.DTEND, endTime)
            put(CalendarContract.Events.EVENT_TIMEZONE, timezone)
            put(CalendarContract.Events.ALL_DAY, if (allDay) 1 else 0)
            put(CalendarContract.Events.EVENT_LOCATION, call.getString("location").orEmpty())
            put(CalendarContract.Events.DESCRIPTION, description)
        }
        val updated = activity.contentResolver.update(
            ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventId),
            values,
            null,
            null,
        )
        if (updated != 1) {
            call.reject("event_update_failed")
            return
        }
        call.resolve(JSObject().apply { put("eventId", eventId.toString()) })
    }

    @PluginMethod
    fun deleteEvent(call: PluginCall) {
        if (!hasCalendarPermission()) {
            call.reject("calendar_permission_required")
            return
        }
        val eventId = getLongValue(call, "eventId")
        if (eventId == null) {
            call.reject("event_id_required")
            return
        }
        if (!isGleaumEvent(eventId)) {
            call.reject("gleaum_event_not_found")
            return
        }
        val deleted = activity.contentResolver.delete(
            ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventId),
            null,
            null,
        )
        call.resolve(JSObject().apply { put("deleted", deleted > 0) })
    }

    @PluginMethod
    fun listEvents(call: PluginCall) {
        if (!hasCalendarPermission()) {
            call.reject("calendar_permission_required")
            return
        }

        val startMillis = getLongValue(call, "startMillis")
        val endMillis = getLongValue(call, "endMillis")
        if (startMillis == null || endMillis == null) {
            call.reject("range_required")
            return
        }

        val projection = arrayOf(
            CalendarContract.Instances.EVENT_ID,
            CalendarContract.Instances.CALENDAR_ID,
            CalendarContract.Instances.TITLE,
            CalendarContract.Instances.BEGIN,
            CalendarContract.Instances.END,
            CalendarContract.Instances.ALL_DAY,
            CalendarContract.Instances.EVENT_LOCATION,
            CalendarContract.Instances.DESCRIPTION
        )

        val uri = CalendarContract.Instances.CONTENT_URI.buildUpon().apply {
            ContentUris.appendId(this, startMillis)
            ContentUris.appendId(this, endMillis)
        }.build()

        val events = JSArray()
        activity.contentResolver.query(
            uri,
            projection,
            null,
            null,
            "${CalendarContract.Instances.BEGIN} ASC"
        )?.use { cursor ->
            val eventIdIdx = cursor.getColumnIndexOrThrow(CalendarContract.Instances.EVENT_ID)
            val calendarIdIdx = cursor.getColumnIndexOrThrow(CalendarContract.Instances.CALENDAR_ID)
            val titleIdx = cursor.getColumnIndexOrThrow(CalendarContract.Instances.TITLE)
            val beginIdx = cursor.getColumnIndexOrThrow(CalendarContract.Instances.BEGIN)
            val endIdx = cursor.getColumnIndexOrThrow(CalendarContract.Instances.END)
            val allDayIdx = cursor.getColumnIndexOrThrow(CalendarContract.Instances.ALL_DAY)
            val locationIdx = cursor.getColumnIndexOrThrow(CalendarContract.Instances.EVENT_LOCATION)
            val descIdx = cursor.getColumnIndexOrThrow(CalendarContract.Instances.DESCRIPTION)

            while (cursor.moveToNext()) {
                events.put(JSObject().apply {
                    put("eventId", cursor.getLong(eventIdIdx).toString())
                    put("calendarId", cursor.getLong(calendarIdIdx).toString())
                    put("title", cursor.getString(titleIdx) ?: "제목 없음")
                    put("startTime", cursor.getLong(beginIdx).toString())
                    put("endTime", cursor.getLong(endIdx).toString())
                    put("allDay", cursor.getInt(allDayIdx) == 1)
                    put("location", cursor.getString(locationIdx) ?: "")
                    put("description", cursor.getString(descIdx) ?: "")
                })
            }
        }

        call.resolve(JSObject().apply { put("events", events) })
    }

    private fun hasCalendarPermission(): Boolean =
        getPermissionState(CALENDAR_PERMISSION) == PermissionState.GRANTED

    private fun permissionResult(): JSObject = JSObject().apply {
        put("calendar", getPermissionState(CALENDAR_PERMISSION).toString())
    }

    private fun isGleaumEvent(eventId: Long, expectedCalendarId: Long? = null): Boolean {
        val projection = arrayOf(
            CalendarContract.Events.CALENDAR_ID,
            CalendarContract.Events.DESCRIPTION,
        )
        activity.contentResolver.query(
            ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventId),
            projection,
            null,
            null,
            null,
        )?.use { cursor ->
            if (!cursor.moveToFirst()) return false
            val calendarId = cursor.getLong(cursor.getColumnIndexOrThrow(CalendarContract.Events.CALENDAR_ID))
            val description = cursor.getString(cursor.getColumnIndexOrThrow(CalendarContract.Events.DESCRIPTION)).orEmpty()
            return (expectedCalendarId == null || calendarId == expectedCalendarId) &&
                description.contains(GLEAUM_EVENT_MARKER)
        }
        return false
    }

    private fun getLongValue(call: PluginCall, key: String): Long? {
        val value = call.data.opt(key) ?: return null
        return when (value) {
            is Long -> value
            is Int -> value.toLong()
            is Double -> value.toLong()
            is Float -> value.toLong()
            is String -> value.toLongOrNull()
            else -> null
        }
    }
}
