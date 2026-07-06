package com.gleaum.app

import android.app.Activity
import android.content.Intent
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView

enum class NativeBottomDestination {
    HOME, SCHEDULES, SPACE, BUDGET, MENU
}

/**
 * Shared Android bottom navigation.
 *
 * Keep this as the single source for native tab size, icon position and labels.
 * Individual screens should not reimplement their own bottom navigation.
 */
object NativeBottomNav {
    fun create(activity: Activity, active: NativeBottomDestination): LinearLayout {
        return LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            background = rounded(activity, NativeTheme.surface(activity), if (NativeAdaptive.isLarge(activity)) 28 else 0, NativeTheme.border(activity))
            elevation = dp(activity, 8).toFloat()

            items().forEach { item ->
                addView(tab(activity, item, active == item.destination), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f))
            }
        }
    }

    private fun tab(activity: Activity, item: Item, active: Boolean): LinearLayout {
        val activeColor = NativeTheme.color(activity, NativeTheme.BRAND_BLUE)
        val inactiveColor = NativeTheme.muted(activity)
        return LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(0, dp(activity, 4), 0, dp(activity, 5))
            setOnClickListener {
                if (!active) navigate(activity, item.destination)
            }

            addView(View(context).apply {
                background = if (active) rounded(activity, activeColor, 999, null) else null
            }, LinearLayout.LayoutParams(dp(activity, 28), dp(activity, 3)).apply {
                bottomMargin = dp(activity, 5)
            })

            addView(NativeTabIconView(context, item.icon, if (active) activeColor else inactiveColor), LinearLayout.LayoutParams(dp(activity, 20), dp(activity, 20)))

            addView(TextView(context).apply {
                text = item.label
                textSize = 10f
                includeFontPadding = false
                typeface = Typeface.create("sans-serif", if (active) Typeface.BOLD else Typeface.NORMAL)
                setTextColor(if (active) activeColor else inactiveColor)
            }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                topMargin = dp(activity, 3)
            })
        }
    }

    private fun navigate(activity: Activity, destination: NativeBottomDestination) {
        val intent = when (destination) {
            NativeBottomDestination.HOME -> Intent(activity, NativeHomePortActivity::class.java)
            NativeBottomDestination.SCHEDULES -> Intent(activity, NativeScheduleListActivity::class.java)
            NativeBottomDestination.SPACE -> Intent(activity, NativeSpaceActivity::class.java)
            NativeBottomDestination.BUDGET -> Intent(activity, NativeBudgetActivity::class.java)
            NativeBottomDestination.MENU -> Intent(activity, NativeMyMenuActivity::class.java)
        }
        activity.startActivity(intent)
        activity.finish()
    }

    private fun items(): List<Item> = listOf(
        Item("홈", NativeTabIcon.HOME, NativeBottomDestination.HOME),
        Item("일정", NativeTabIcon.CALENDAR, NativeBottomDestination.SCHEDULES),
        Item("공간", NativeTabIcon.SPACE, NativeBottomDestination.SPACE),
        Item("가계부", NativeTabIcon.BUDGET, NativeBottomDestination.BUDGET),
        Item("전체", NativeTabIcon.MENU, NativeBottomDestination.MENU),
    )

    private fun rounded(activity: Activity, fill: Int, radius: Int, stroke: Int?): GradientDrawable =
        GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setColor(fill)
            cornerRadius = dp(activity, radius).toFloat()
            if (stroke != null) setStroke(dp(activity, 1), stroke)
        }

    private fun dp(activity: Activity, value: Int): Int = (value * activity.resources.displayMetrics.density).toInt()

    private data class Item(
        val label: String,
        val icon: NativeTabIcon,
        val destination: NativeBottomDestination,
    )
}
