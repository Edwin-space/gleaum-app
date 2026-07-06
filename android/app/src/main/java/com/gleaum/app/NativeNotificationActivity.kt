package com.gleaum.app

import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.compose.setContent
import com.gleaum.app.ui.components.GleaumDestination
import com.gleaum.app.ui.screens.notifications.ComposeNotificationScreen
import com.gleaum.app.ui.theme.GleaumTheme

class NativeNotificationActivity : AppCompatActivity() {
    private var loading = true
    private var message: String? = null
    private var summary: NativeNotificationSummary? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        applyLightSystemBars()
        render()
        loadNotifications()
    }

    override fun onResume() {
        super.onResume()
        if (!loading) loadNotifications(silent = true)
    }

    private fun applyLightSystemBars() {
        NativeTheme.applySystemBars(window, this)
    }

    private fun loadNotifications(silent: Boolean = false) {
        if (!silent) {
            loading = true
            message = null
            render()
        }
        Thread {
            try {
                val loaded = NativeNotificationApi.fetch(this)
                runOnUiThread {
                    summary = loaded
                    loading = false
                    message = null
                    render()
                }
            } catch (e: Exception) {
                runOnUiThread {
                    loading = false
                    message = friendlyError(e.message)
                    render()
                }
            }
        }.start()
    }

    private fun render() {
        if (NativePortFlags.ENABLE_COMPOSE_NOTIFICATIONS) {
            renderComposeNotifications()
            return
        }
        setContentView(buildScreen())
    }

    private fun renderComposeNotifications() {
        setContent {
            GleaumTheme {
                ComposeNotificationScreen(
                    summary = summary,
                    loading = loading,
                    message = message,
                    onRefresh = { loadNotifications() },
                    onMarkAllRead = { markAllRead() },
                    onNotificationClick = { openNotification(it) },
                    onBack = { finish() },
                    onDestinationSelected = ::handleComposeDestination,
                )
            }
        }
    }

    private fun handleComposeDestination(destination: GleaumDestination) {
        when (destination) {
            GleaumDestination.HOME -> { startActivity(Intent(this, NativeHomePortActivity::class.java)); finish() }
            GleaumDestination.SCHEDULES -> { startActivity(Intent(this, NativeScheduleListActivity::class.java)); finish() }
            GleaumDestination.SPACE -> { startActivity(Intent(this, NativeSpaceActivity::class.java)); finish() }
            GleaumDestination.BUDGET -> { startActivity(Intent(this, NativeBudgetActivity::class.java)); finish() }
            GleaumDestination.MENU -> { startActivity(Intent(this, NativeMyMenuActivity::class.java)); finish() }
        }
    }

    private fun buildScreen(): FrameLayout = FrameLayout(this).apply {
        setBackgroundColor(color("#FAFAFD"))
        addView(ScrollView(context).apply {
            overScrollMode = View.OVER_SCROLL_NEVER
            addView(LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(20), statusBarHeight() + dp(76), dp(20), dp(104))

                val data = summary
                if (loading) {
                    addView(stateCard("알림을 불러오는 중이에요.", false), matchWrap())
                } else if (message != null) {
                    addView(stateCard(message.orEmpty(), true), matchWrap())
                } else if (data == null || data.notifications.isEmpty()) {
                    addView(hero(data?.unreadCount ?: 0), matchWrap())
                    addView(emptyCard(), matchWrap().apply { topMargin = dp(16) })
                } else {
                    addView(hero(data.unreadCount), matchWrap())
                    addView(actionRow(data.unreadCount), matchWrap().apply { topMargin = dp(14) })
                    data.notifications.forEach { item ->
                        addView(notificationCard(item), matchWrap().apply { topMargin = dp(10) })
                    }
                }
            })
        }, match())
        addView(header(), FrameLayout.LayoutParams(match(), statusBarHeight() + dp(64), Gravity.TOP))
        addView(bottomNav(), FrameLayout.LayoutParams(match(), dp(72), Gravity.BOTTOM))
    }

    private fun header(): FrameLayout = FrameLayout(this).apply {
        setBackgroundColor(color("#FAFAFD"))
        addView(TextView(context).apply {
            text = "알림"
            textSize = 22f
            typeface = brandBold()
            setTextColor(NativeTheme.text(context))
            gravity = Gravity.CENTER_VERTICAL
        }, FrameLayout.LayoutParams(wrap(), dp(48), Gravity.BOTTOM or Gravity.START).apply { leftMargin = dp(20) })
        addView(TextView(context).apply {
            text = "새로고침"
            textSize = 13f
            typeface = brandBold()
            gravity = Gravity.CENTER
            setTextColor(color("#0084CC"))
            background = roundDrawable("#F0FAFF", 999, "#BDEBFF")
            setOnClickListener { loadNotifications() }
        }, FrameLayout.LayoutParams(dp(92), dp(36), Gravity.BOTTOM or Gravity.END).apply { rightMargin = dp(20); bottomMargin = dp(6) })
    }

    private fun hero(unreadCount: Int): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(20), dp(18), dp(20), dp(18))
        background = gradientCard()
        addView(TextView(context).apply {
            text = "NOTIFICATION CENTER"
            textSize = 11f
            typeface = brandBold()
            letterSpacing = 0.08f
            setTextColor(color("#0CC9B5"))
        }, matchWrap())
        addView(TextView(context).apply {
            text = if (unreadCount > 0) "읽지 않은 알림 ${unreadCount}개" else "모든 알림을 확인했어요"
            textSize = 22f
            typeface = brandBold()
            setTextColor(Color.WHITE)
        }, matchWrap().apply { topMargin = dp(8) })
        addView(TextView(context).apply {
            text = "일정, 공간, 가계부 흐름에서 놓치면 안 되는 내용을 모아둡니다."
            textSize = 13f
            typeface = brandMedium()
            setTextColor(color("#CBD5E1"))
        }, matchWrap().apply { topMargin = dp(8) })
    }

    private fun actionRow(unreadCount: Int): LinearLayout = LinearLayout(this).apply {
        gravity = Gravity.CENTER_VERTICAL
        addView(TextView(context).apply {
            text = "최근 알림"
            textSize = 17f
            typeface = brandBold()
            setTextColor(NativeTheme.text(context))
        }, LinearLayout.LayoutParams(0, wrap(), 1f))
        addView(TextView(context).apply {
            text = if (unreadCount > 0) "모두 읽음" else "정리됨"
            textSize = 13f
            typeface = brandBold()
            gravity = Gravity.CENTER
            setTextColor(if (unreadCount > 0) color("#0084CC") else color("#8E8E93"))
            background = roundDrawable("#FFFFFF", 999, "#E8E8E4")
            isEnabled = unreadCount > 0
            setOnClickListener { markAllRead() }
        }, LinearLayout.LayoutParams(dp(88), dp(34)))
    }

    private fun notificationCard(item: NativeNotificationItem): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(14), dp(14), dp(14), dp(14))
        background = roundDrawable(if (item.read) "#FFFFFF" else "#F0FAFF", 22, if (item.read) "#E8E8E4" else "#BDEBFF")
        setOnClickListener { openNotification(item) }

        addView(TextView(context).apply {
            text = notificationIcon(item.type)
            textSize = 20f
            gravity = Gravity.CENTER
            background = roundDrawable(if (item.read) "#F8FAFC" else "#E6FFFA", 18, null)
        }, LinearLayout.LayoutParams(dp(44), dp(44)))

        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            addView(TextView(context).apply {
                text = item.title.ifBlank { "알림" }
                textSize = 15f
                typeface = brandBold()
                setTextColor(NativeTheme.text(context))
            }, matchWrap())
            addView(TextView(context).apply {
                text = item.body.ifBlank { "내용을 확인해 주세요." }
                textSize = 12f
                typeface = brandMedium()
                setTextColor(NativeTheme.color(context, "#6E6E66"))
                maxLines = 2
            }, matchWrap().apply { topMargin = dp(4) })
            addView(TextView(context).apply {
                text = relativeDate(item.createdAt)
                textSize = 11f
                typeface = brandBold()
                setTextColor(NativeTheme.muted(context))
            }, matchWrap().apply { topMargin = dp(6) })
        }, LinearLayout.LayoutParams(0, wrap(), 1f).apply { leftMargin = dp(12) })

        if (!item.read) {
            addView(View(context).apply { background = roundDrawable("#0084CC", 999) }, LinearLayout.LayoutParams(dp(8), dp(8)))
        }
    }

    private fun emptyCard(): TextView = stateCard("아직 도착한 알림이 없어요.\n일정과 공간 활동이 생기면 이곳에서 확인할 수 있어요.", false)

    private fun stateCard(textValue: String, danger: Boolean): TextView = TextView(this).apply {
        text = textValue
        textSize = 14f
        typeface = brandBold()
        gravity = Gravity.CENTER
        setTextColor(if (danger) color("#EF4444") else color("#6E6E66"))
        setPadding(dp(18), dp(28), dp(18), dp(28))
        background = roundDrawable("#FFFFFF", 24, "#E8E8E4")
    }

    private fun markAllRead() {
        Thread {
            try {
                NativeNotificationApi.markAllRead(this)
                runOnUiThread { loadNotifications() }
            } catch (e: Exception) {
                runOnUiThread { Toast.makeText(this, friendlyError(e.message), Toast.LENGTH_SHORT).show() }
            }
        }.start()
    }

    private fun openNotification(item: NativeNotificationItem) {
        Thread {
            try { if (!item.read) NativeNotificationApi.markRead(this, item.id) } catch (_: Exception) { }
            runOnUiThread {
                if (!item.scheduleId.isNullOrBlank()) {
                    startActivity(Intent(this, NativeScheduleDetailActivity::class.java).putExtra("schedule_id", item.scheduleId))
                } else {
                    loadNotifications(silent = true)
                }
            }
        }.start()
    }

    private fun bottomNav(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
        setPadding(dp(12), dp(6), dp(12), dp(10))
        background = roundDrawable("#FFFFFF", 0, "#E8E8E4")
        listOf(
            "홈" to { openHome() },
            "일정" to { startActivity(Intent(this@NativeNotificationActivity, NativeScheduleListActivity::class.java)); finish() },
            "공간" to { startActivity(Intent(this@NativeNotificationActivity, NativeSpaceActivity::class.java)); finish() },
            "가계부" to { startActivity(Intent(this@NativeNotificationActivity, NativeBudgetActivity::class.java)); finish() },
            "전체" to { startActivity(Intent(this@NativeNotificationActivity, NativeMyMenuActivity::class.java)); finish() },
        ).forEach { (label, action) ->
            addView(TextView(context).apply {
                text = label
                textSize = 11f
                typeface = brandBold()
                gravity = Gravity.CENTER
                setTextColor(if (label == "홈") color("#0084CC") else NativeTheme.muted(context))
                setOnClickListener { action() }
            }, LinearLayout.LayoutParams(0, match(), 1f))
        }
    }

    private fun openHome() {
        startActivity(Intent(this, NativeHomePortActivity::class.java))
        finish()
    }

    private fun friendlyError(code: String?): String = when (code) {
        "session_required", "Unauthorized" -> "로그인 세션을 찾을 수 없어요. 다시 로그인해 주세요."
        else -> "알림을 처리하지 못했어요. 잠시 후 다시 시도해 주세요."
    }

    private fun notificationIcon(type: String): String = when (type) {
        "reminder" -> "⏰"
        "completion" -> "✅"
        "invite" -> "✉"
        "re_notify" -> "🔔"
        else -> "🔔"
    }

    private fun relativeDate(raw: String): String = raw.take(10).ifBlank { "최근" }
    private fun brandBold(): Typeface = Typeface.create("sans-serif", Typeface.BOLD)
    private fun brandMedium(): Typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
    private fun statusBarHeight(): Int = resources.getIdentifier("status_bar_height", "dimen", "android").takeIf { it > 0 }?.let { resources.getDimensionPixelSize(it) } ?: dp(24)
    private fun color(hex: String): Int = NativeTheme.color(this, hex)
    private fun match() = ViewGroup.LayoutParams.MATCH_PARENT
    private fun wrap() = ViewGroup.LayoutParams.WRAP_CONTENT
    private fun matchWrap() = LinearLayout.LayoutParams(match(), wrap())

    private fun roundDrawable(fill: String, radius: Int, stroke: String? = null): GradientDrawable = GradientDrawable().apply {
        setColor(color(fill))
        cornerRadius = dp(radius).toFloat()
        stroke?.let { setStroke(dp(1), color(it)) }
    }

    private fun gradientCard(): GradientDrawable = GradientDrawable(
        GradientDrawable.Orientation.TL_BR,
        intArrayOf(color("#1A1B2E"), color("#2D2E4A"), color("#0084CC")),
    ).apply { cornerRadius = dp(28).toFloat() }
}
