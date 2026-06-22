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

    const val ENABLE_NATIVE_HOME = false
    const val ENABLE_NATIVE_SCHEDULE_FORM = false
    const val ENABLE_NATIVE_BUDGET = false
    const val ENABLE_NATIVE_SPACE = false
}
