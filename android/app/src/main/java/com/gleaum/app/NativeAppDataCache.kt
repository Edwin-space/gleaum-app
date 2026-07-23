package com.gleaum.app

import java.util.concurrent.ConcurrentHashMap

/**
 * Process-scoped Android data snapshot. Cold starts rebuild it during the splash
 * screen; navigation reuses it until a mutation or an explicit refresh occurs.
 */
object NativeAppDataCache {
    @Volatile var home: NativeHomePortSummary? = null
    @Volatile var spaces: NativeSpaceSummary? = null
    @Volatile var schedules: List<NativeAppSchedule>? = null
    @Volatile var budget: NativeBudgetSummary? = null
    @Volatile var notifications: NativeNotificationSummary? = null
    @Volatile var profile: NativeProfile? = null
    val scheduleDetails = ConcurrentHashMap<String, NativeAppSchedule>()

    fun clear() {
        home = null
        spaces = null
        schedules = null
        budget = null
        notifications = null
        profile = null
        scheduleDetails.clear()
    }

    fun invalidateSchedules() {
        schedules = null
        scheduleDetails.clear()
        home = null
        spaces = null
    }

    /**
     * Keeps a successful mutation visible immediately while the server-backed
     * aggregate cache is refreshed on the next explicit reload or cold start.
     */
    fun upsertSchedule(schedule: NativeAppSchedule) {
        val current = schedules.orEmpty()
        schedules = (current.filterNot { it.id == schedule.id } + schedule)
            .sortedBy { it.startTime }
        scheduleDetails[schedule.id] = schedule
        home = null
        spaces = null
    }

    fun invalidateBudget() {
        budget = null
        home = null
    }

    fun invalidateSpaces() {
        spaces = null
        home = null
    }
}
