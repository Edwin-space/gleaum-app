package com.gleaum.app

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.provider.CalendarContract
import androidx.core.content.ContextCompat

data class NativeDeviceCalendarEvent(
    val eventId: String,
    val occurrenceStart: Long,
    val title: String,
    val startTime: Long,
    val endTime: Long?,
    val allDay: Boolean,
    val location: String,
    val description: String,
) {
    val importId: String get() = "$eventId:$occurrenceStart"
}

object NativeDeviceCalendarRepository {
    private const val GLEAUM_EVENT_MARKER = "gleaum:schedule:"

    fun listImportableEvents(
        context: Context,
        calendarId: String,
        rangeStart: Long,
        rangeEnd: Long,
    ): List<NativeDeviceCalendarEvent> {
        check(
            ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CALENDAR) ==
                PackageManager.PERMISSION_GRANTED,
        ) { "calendar_permission_required" }

        val projection = arrayOf(
            CalendarContract.Instances.EVENT_ID,
            CalendarContract.Instances.CALENDAR_ID,
            CalendarContract.Instances.TITLE,
            CalendarContract.Instances.BEGIN,
            CalendarContract.Instances.END,
            CalendarContract.Instances.ALL_DAY,
            CalendarContract.Instances.EVENT_LOCATION,
            CalendarContract.Instances.DESCRIPTION,
        )
        val uri = CalendarContract.Instances.CONTENT_URI.buildUpon().apply {
            android.content.ContentUris.appendId(this, rangeStart)
            android.content.ContentUris.appendId(this, rangeEnd)
        }.build()

        return context.contentResolver.query(
            uri,
            projection,
            "${CalendarContract.Instances.CALENDAR_ID} = ?",
            arrayOf(calendarId),
            "${CalendarContract.Instances.BEGIN} ASC",
        )?.use { cursor ->
            val eventIdIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.EVENT_ID)
            val titleIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.TITLE)
            val beginIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.BEGIN)
            val endIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.END)
            val allDayIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.ALL_DAY)
            val locationIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.EVENT_LOCATION)
            val descriptionIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.DESCRIPTION)
            buildList {
                while (cursor.moveToNext()) {
                    val title = cursor.getString(titleIndex).orEmpty().trim()
                    val description = cursor.getString(descriptionIndex).orEmpty()
                    if (title.isBlank() || description.contains(GLEAUM_EVENT_MARKER)) continue
                    val start = cursor.getLong(beginIndex)
                    add(
                        NativeDeviceCalendarEvent(
                            eventId = cursor.getLong(eventIdIndex).toString(),
                            occurrenceStart = start,
                            title = title,
                            startTime = start,
                            endTime = cursor.getLong(endIndex).takeIf { it > 0L },
                            allDay = cursor.getInt(allDayIndex) == 1,
                            location = cursor.getString(locationIndex).orEmpty(),
                            description = description,
                        ),
                    )
                }
            }
        }.orEmpty()
    }
}
