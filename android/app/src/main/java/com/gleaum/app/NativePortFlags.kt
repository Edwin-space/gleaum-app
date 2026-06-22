package com.gleaum.app

/**
 * Android Native Port feature gates.
 *
 * Android native screens must be implemented behind explicit flags first.
 * Do not connect a native screen directly to MainActivity's default route
 * before comparing it with the Mobile Web source UI.
 */
object NativePortFlags {
    const val ENABLE_NATIVE_HOME = false
    const val ENABLE_NATIVE_SCHEDULE_FORM = false
    const val ENABLE_NATIVE_BUDGET = false
    const val ENABLE_NATIVE_SPACE = false
}
