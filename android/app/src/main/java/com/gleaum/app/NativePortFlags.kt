package com.gleaum.app

/**
 * Android Native Port feature gates.
 *
 * Android native screens must be implemented behind explicit flags first.
 * Do not connect a native screen directly to MainActivity's default route
 * before comparing it with the Mobile Web source UI.
 */
object NativePortFlags {
    /**
     * Debug build only preview gate.
     *
     * This lets Android Studio/adb open NativeHomePortActivity for visual
     * comparison while keeping release builds and the default app route on
     * the WebView home.
     */
    const val ENABLE_NATIVE_HOME_PREVIEW = true

    const val ENABLE_NATIVE_HOME = true
    const val ENABLE_COMPOSE_HOME = true
    const val ENABLE_COMPOSE_SCHEDULES = true
    const val ENABLE_COMPOSE_SCHEDULE_DETAIL = true
    const val ENABLE_COMPOSE_SCHEDULE_FORM = true
    const val ENABLE_COMPOSE_BUDGET = true
    const val ENABLE_COMPOSE_BUDGET_FORM = true
    const val ENABLE_COMPOSE_SPACE = true
    const val ENABLE_COMPOSE_MENU = true
    const val ENABLE_COMPOSE_NOTIFICATIONS = true
    const val ENABLE_COMPOSE_ONBOARDING = true
    const val ENABLE_NATIVE_SCHEDULE_FORM = true
    const val ENABLE_NATIVE_BUDGET = true
    const val ENABLE_NATIVE_SPACE = true
}
