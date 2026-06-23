package com.gleaum.app

import android.content.Context
import android.content.res.Resources
import android.view.Gravity
import android.view.ViewGroup
import android.widget.FrameLayout

/**
 * Shared large-screen sizing for Android native screens.
 *
 * Tablet/foldable support should keep the mobile visual language, but avoid
 * stretching cards and navigation across the full display width.
 */
object NativeAdaptive {
    fun isLarge(context: Context): Boolean = isLarge(context.resources)

    fun isLarge(resources: Resources): Boolean {
        val config = resources.configuration
        return config.smallestScreenWidthDp >= 600 || config.screenWidthDp >= 600
    }

    fun isExpanded(context: Context): Boolean = context.resources.configuration.screenWidthDp >= 840

    fun pagePaddingDp(context: Context): Int = if (isLarge(context)) 32 else 20

    fun contentMaxWidthDp(context: Context): Int = when {
        isExpanded(context) -> 1040
        isLarge(context) -> 760
        else -> Int.MAX_VALUE
    }

    fun compactContentMaxWidthDp(context: Context): Int = when {
        isExpanded(context) -> 860
        isLarge(context) -> 720
        else -> Int.MAX_VALUE
    }

    fun navMaxWidthDp(context: Context): Int = if (isLarge(context)) 720 else Int.MAX_VALUE

    fun scrollChildParams(context: Context, compact: Boolean = false): FrameLayout.LayoutParams {
        val width = adaptiveWidthPx(context, if (compact) compactContentMaxWidthDp(context) else contentMaxWidthDp(context))
        return FrameLayout.LayoutParams(width, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
            gravity = Gravity.CENTER_HORIZONTAL
        }
    }

    fun headerContentParams(context: Context, heightPx: Int, horizontalMarginPx: Int, bottomMarginPx: Int): FrameLayout.LayoutParams {
        return FrameLayout.LayoutParams(adaptiveWidthPx(context, contentMaxWidthDp(context)), heightPx, Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL).apply {
            if (!isLarge(context)) {
                leftMargin = horizontalMarginPx
                rightMargin = horizontalMarginPx
            }
            bottomMargin = bottomMarginPx
        }
    }

    fun bottomNavParams(context: Context, heightPx: Int): FrameLayout.LayoutParams {
        return FrameLayout.LayoutParams(adaptiveWidthPx(context, navMaxWidthDp(context)), heightPx, Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL)
    }

    private fun adaptiveWidthPx(context: Context, maxWidthDp: Int): Int {
        if (maxWidthDp == Int.MAX_VALUE) return ViewGroup.LayoutParams.MATCH_PARENT
        val metrics = context.resources.displayMetrics
        val horizontalInset = if (isLarge(context)) dp(context, 32) else 0
        val available = metrics.widthPixels - horizontalInset
        return minOf(available, dp(context, maxWidthDp))
    }

    private fun dp(context: Context, value: Int): Int = (value * context.resources.displayMetrics.density).toInt()
}
