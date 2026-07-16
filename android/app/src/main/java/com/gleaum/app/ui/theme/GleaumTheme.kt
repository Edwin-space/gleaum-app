package com.gleaum.app.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat
import com.gleaum.app.NativeTheme

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
    errorContainer = Color(0xFFFEECEC),
    onErrorContainer = Color(0xFF7F1D1D),
    inverseSurface = GleaumColors.BrandNavy,
    inverseOnSurface = Color(0xFFF8FAFC),
    inversePrimary = Color(0xFF6CCBFF),
    surfaceTint = GleaumColors.BrandBlue,
    scrim = Color.Black,
    surfaceBright = Color.White,
    surfaceDim = Color(0xFFE7EAF0),
    surfaceContainerLowest = Color.White,
    surfaceContainerLow = Color(0xFFF7F8FB),
    surfaceContainer = Color(0xFFF2F4F8),
    surfaceContainerHigh = Color(0xFFEDF0F5),
    surfaceContainerHighest = Color(0xFFE7EBF1),
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
    errorContainer = Color(0xFF521B1B),
    onErrorContainer = Color(0xFFFECACA),
    inverseSurface = Color(0xFFF1F5F9),
    inverseOnSurface = Color(0xFF111827),
    inversePrimary = Color(0xFF006B9F),
    surfaceTint = Color(0xFF38BDF8),
    scrim = Color.Black,
    surfaceBright = Color(0xFF263249),
    surfaceDim = Color(0xFF0B1220),
    surfaceContainerLowest = Color(0xFF0A1120),
    surfaceContainerLow = Color(0xFF11192A),
    surfaceContainer = Color(0xFF151D2F),
    surfaceContainerHigh = Color(0xFF1A2437),
    surfaceContainerHighest = Color(0xFF202C41),
)

@Composable
fun GleaumTheme(
    darkTheme: Boolean? = null,
    content: @Composable () -> Unit,
) {
    val context = LocalContext.current
    val resolvedDarkTheme = darkTheme ?: NativeTheme.isDark(context)
    val colorScheme = if (resolvedDarkTheme) GleaumDarkColorScheme else GleaumLightColorScheme
    ApplySystemBars(colorScheme, resolvedDarkTheme)

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

private val GleaumTypography = Typography(
    displayLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 32.sp, lineHeight = 40.sp, letterSpacing = (-0.5).sp),
    displayMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 28.sp, lineHeight = 36.sp, letterSpacing = (-0.4).sp),
    headlineLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 26.sp, lineHeight = 34.sp, letterSpacing = (-0.3).sp),
    headlineMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 24.sp, lineHeight = 32.sp, letterSpacing = (-0.25).sp),
    headlineSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 22.sp, lineHeight = 30.sp, letterSpacing = (-0.2).sp),
    titleLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 20.sp, lineHeight = 28.sp, letterSpacing = (-0.15).sp),
    titleMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 17.sp, lineHeight = 24.sp, letterSpacing = (-0.1).sp),
    titleSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, lineHeight = 22.sp),
    bodyLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 21.sp),
    bodySmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Normal, fontSize = 13.sp, lineHeight = 19.sp),
    labelLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, lineHeight = 20.sp),
    labelMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = 12.sp, lineHeight = 18.sp),
    labelSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = 11.sp, lineHeight = 16.sp, letterSpacing = 0.2.sp),
)

private val GleaumShapes = Shapes(
    extraSmall = androidx.compose.foundation.shape.RoundedCornerShape(8.dp),
    small = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
    medium = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
    large = androidx.compose.foundation.shape.RoundedCornerShape(24.dp),
    extraLarge = androidx.compose.foundation.shape.RoundedCornerShape(32.dp),
)
