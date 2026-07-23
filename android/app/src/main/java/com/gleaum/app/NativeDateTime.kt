package com.gleaum.app

import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

/** ISO-8601 parsing that remains compatible with the app's API 24 minimum. */
object NativeDateTime {
    private val isoPatterns = listOf(
        "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
        "yyyy-MM-dd'T'HH:mm:ss'Z'",
    )

    fun parseIsoMillis(value: String?): Long? {
        if (value.isNullOrBlank()) return null
        return isoPatterns.firstNotNullOfOrNull { pattern ->
            runCatching {
                SimpleDateFormat(pattern, Locale.US).apply {
                    isLenient = false
                    timeZone = TimeZone.getTimeZone("UTC")
                }.parse(value)?.time
            }.getOrNull()
        }
    }
}
