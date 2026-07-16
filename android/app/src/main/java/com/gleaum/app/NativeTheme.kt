package com.gleaum.app

import android.content.Context
import android.content.res.Configuration
import android.graphics.Color
import android.os.Build
import android.view.View
import android.view.Window
import androidx.core.view.WindowCompat

/** Android native equivalent of DESIGN.md theme tokens. */
object NativeTheme {
    const val BRAND_BLUE = "#0084CC"
    const val BRAND_TEAL = "#0CC9B5"
    const val BRAND_GREEN = "#2EE895"
    const val BRAND_NAVY = "#1A1B2E"
    private const val CAPACITOR_PREFS_NAME = "CapacitorStorage"
    private const val THEME_MODE_KEY = "gleaum:theme-mode"

    fun isDark(context: Context): Boolean {
        return when (themeMode(context)) {
            "light" -> false
            "dark" -> true
            else -> (context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
        }
    }

    fun themeMode(context: Context): String =
        context.getSharedPreferences(CAPACITOR_PREFS_NAME, Context.MODE_PRIVATE)
            .getString(THEME_MODE_KEY, "system")
            ?.takeIf { it == "system" || it == "light" || it == "dark" }
            ?: "system"

    fun color(context: Context, hex: String): Int = Color.parseColor(resolve(context, hex))
    fun rawColor(hex: String): Int = Color.parseColor(hex)
    fun alpha(hex: String, alpha: Float): Int {
        val base = rawColor(hex)
        return Color.argb((alpha * 255).toInt(), Color.red(base), Color.green(base), Color.blue(base))
    }

    fun resolve(context: Context, hex: String): String {
        if (!isDark(context)) return hex
        return when (hex.uppercase()) {
            "#FAFAFD" -> "#0F172A"
            "#FFFFFF" -> "#151D2F"
            "#F8FAFC", "#F7F8FB", "#F5F5F7", "#F5F5F3" -> "#1D2638"
            "#EEF0F4", "#E8E8E4", "#E5E5EA" -> "#2A3548"
            "#F0FAFF" -> "#102A3A"
            "#DFF6F3", "#BDEBFF" -> "#123A42"
            "#6E6E66" -> "#CBD5E1"
            "#8E8E93", "#AEAEA8" -> "#94A3B8"
            else -> hex
        }
    }

    fun background(context: Context): Int = color(context, "#FAFAFD")
    fun surface(context: Context): Int = color(context, "#FFFFFF")
    fun surfaceMuted(context: Context): Int = color(context, "#F8FAFC")
    fun border(context: Context): Int = color(context, "#EEF0F4")
    fun text(context: Context): Int = if (isDark(context)) rawColor("#F8FAFC") else rawColor("#1A1B2E")
    fun muted(context: Context): Int = if (isDark(context)) rawColor("#CBD5E1") else rawColor("#8E8E93")
    fun subtle(context: Context): Int = if (isDark(context)) rawColor("#94A3B8") else rawColor("#AEAEA8")
    fun onDarkText(): Int = rawColor("#FFFFFF")
    fun onDarkMuted(alpha: Float = 0.62f): Int = alpha("#FFFFFF", alpha)

    fun applySystemBars(window: Window, context: Context, statusHex: String = "#FAFAFD", navHex: String = "#FAFAFD") {
        val dark = isDark(context)
        window.statusBarColor = color(context, statusHex)
        window.navigationBarColor = color(context, navHex)

        val controller = WindowCompat.getInsetsController(window, window.decorView)
        controller.isAppearanceLightStatusBars = !dark
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            controller.isAppearanceLightNavigationBars = !dark
        }

        @Suppress("DEPRECATION")
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            var flags = 0
            if (!dark) {
                flags = flags or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    flags = flags or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
                }
            }
            window.decorView.systemUiVisibility = flags
        }
    }
}
