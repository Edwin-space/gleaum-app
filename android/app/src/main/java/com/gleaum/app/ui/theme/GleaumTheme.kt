package com.gleaum.app.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

object GleaumColors {
    val BrandBlue = Color(0xFF0084CC)
    val BrandTeal = Color(0xFF0CC9B5)
    val BrandGreen = Color(0xFF2EE895)
    val BrandNavy = Color(0xFF1A1B2E)
}

private val GleaumLightColorScheme = lightColorScheme(
    primary = GleaumColors.BrandBlue,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD8F0FF),
    onPrimaryContainer = Color(0xFF002F49),
    secondary = GleaumColors.BrandTeal,
    onSecondary = Color(0xFF002B28),
    secondaryContainer = Color(0xFFDFF6F3),
    onSecondaryContainer = Color(0xFF003B36),
    tertiary = GleaumColors.BrandGreen,
    onTertiary = Color(0xFF00351D),
    tertiaryContainer = Color(0xFFD7FBE8),
    onTertiaryContainer = Color(0xFF00351D),
    background = Color(0xFFFAFAFD),
    onBackground = GleaumColors.BrandNavy,
    surface = Color.White,
    onSurface = GleaumColors.BrandNavy,
    surfaceVariant = Color(0xFFF5F7FB),
    onSurfaceVariant = Color(0xFF6E6E66),
    outline = Color(0xFFE3E7EF),
    outlineVariant = Color(0xFFEEF0F4),
    error = Color(0xFFEF4444),
    onError = Color.White,
)

private val GleaumDarkColorScheme = darkColorScheme(
    primary = Color(0xFF38BDF8),
    onPrimary = Color(0xFF002F49),
    primaryContainer = Color(0xFF0B3A52),
    onPrimaryContainer = Color(0xFFD8F0FF),
    secondary = Color(0xFF2DD4BF),
    onSecondary = Color(0xFF002B28),
    secondaryContainer = Color(0xFF123A42),
    onSecondaryContainer = Color(0xFFDFF6F3),
    tertiary = Color(0xFF4ADE80),
    onTertiary = Color(0xFF00351D),
    tertiaryContainer = Color(0xFF163C2A),
    onTertiaryContainer = Color(0xFFD7FBE8),
    background = Color(0xFF0F172A),
    onBackground = Color(0xFFF8FAFC),
    surface = Color(0xFF151D2F),
    onSurface = Color(0xFFF8FAFC),
    surfaceVariant = Color(0xFF1D2638),
    onSurfaceVariant = Color(0xFFCBD5E1),
    outline = Color(0xFF334155),
    outlineVariant = Color(0xFF2A3548),
    error = Color(0xFFF87171),
    onError = Color(0xFF450A0A),
)

@Composable
fun GleaumTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) GleaumDarkColorScheme else GleaumLightColorScheme
    ApplySystemBars(colorScheme, darkTheme)

    MaterialTheme(
        colorScheme = colorScheme,
        typography = GleaumTypography,
        shapes = GleaumShapes,
        content = content,
    )
}

@Composable
private fun ApplySystemBars(colorScheme: ColorScheme, darkTheme: Boolean) {
    val view = LocalView.current
    val context = LocalContext.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (context as? Activity)?.window ?: return@SideEffect
            window.statusBarColor = colorScheme.background.toArgb()
            window.navigationBarColor = colorScheme.surface.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }
}

private val GleaumTypography = Typography()

private val GleaumShapes = Shapes()
