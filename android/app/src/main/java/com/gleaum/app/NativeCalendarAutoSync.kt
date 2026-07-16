package com.gleaum.app

import android.Manifest
import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.content.pm.PackageManager
import android.provider.CalendarContract
import androidx.core.content.ContextCompat
import java.util.TimeZone

/**
 * Applies only user-enabled, one-way schedule changes to the selected device
 * calendar. Events without the Gleaum marker are never queried for mutation.
 */
object NativeCalendarAutoSync {
    private const val PREFS = "CapacitorStorage"
    private const val ENABLED_KEY = "gleaum:calendar-sync-enabled"
    private const val MODE_KEY = "gleaum:calendar-sync-mode"
    private const val CALENDAR_ID_KEY = "gleaum:calendar-sync-calendar-id"
    private const val MARKER = "gleaum:schedule:"

    fun upsert(context: Context, schedule: NativeAppSchedule) {
        if (!isEnabled(context) || schedule.type == "expense") return
        val calendarId = selectedCalendarId(context) ?: return
        val start = parseMillis(schedule.startTime) ?: return
        val values = ContentValues().apply {
            put(CalendarContract.Events.TITLE, schedule.title)
            put(CalendarContract.Events.DTSTART, start)
            put(CalendarContract.Events.DTEND, parseMillis(schedule.endTime) ?: start + 60 * 60 * 1000L)
            put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().id)
            put(CalendarContract.Events.ALL_DAY, if (schedule.allDay) 1 else 0)
            put(CalendarContract.Events.DESCRIPTION, description(schedule))
        }
        val existingId = findGleaumEventId(context, calendarId, schedule.id)
        if (existingId == null) {
            values.put(CalendarContract.Events.CALENDAR_ID, calendarId)
            context.contentResolver.insert(CalendarContract.Events.CONTENT_URI, values)
        } else {
            context.contentResolver.update(
                ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, existingId),
                values,
                null,
                null,
            )
        }
    }

    fun delete(context: Context, schedule: NativeAppSchedule?) {
        if (!isEnabled(context) || schedule == null) return
        val calendarId = selectedCalendarId(context) ?: return
        val eventId = findGleaumEventId(context, calendarId, schedule.id) ?: return
        context.contentResolver.delete(
            ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventId),
            null,
            null,
        )
    }

    private fun isEnabled(context: Context): Boolean {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.WRITE_CALENDAR) != PackageManager.PERMISSION_GRANTED) return false
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        return prefs.getString(ENABLED_KEY, "false") == "true" && prefs.getString(MODE_KEY, "manual") == "automatic"
    }

    private fun selectedCalendarId(context: Context): Long? =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(CALENDAR_ID_KEY, null)?.toLongOrNull()

    private fun findGleaumEventId(context: Context, calendarId: Long, scheduleId: String): Long? {
        val projection = arrayOf(CalendarContract.Events._ID)
        val selection = "${CalendarContract.Events.CALENDAR_ID} = ? AND ${CalendarContract.Events.DESCRIPTION} LIKE ?"
        val args = arrayOf(calendarId.toString(), "%$MARKER$scheduleId%")
        context.contentResolver.query(CalendarContract.Events.CONTENT_URI, projection, selection, args, null)?.use { cursor ->
            return if (cursor.moveToFirst()) cursor.getLong(cursor.getColumnIndexOrThrow(CalendarContract.Events._ID)) else null
        }
        return null
    }

    private fun description(schedule: NativeAppSchedule): String = listOfNotNull(
        schedule.memo?.takeIf { it.isNotBlank() },
        "글리움에서 동기화한 일정입니다.",
        "$MARKER${schedule.id}",
    ).joinToString("\n")

    private fun parseMillis(value: String?): Long? = NativeDateTime.parseIsoMillis(value)
}
