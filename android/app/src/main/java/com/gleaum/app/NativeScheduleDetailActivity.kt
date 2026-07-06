package com.gleaum.app

import android.app.AlertDialog
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
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatActivity
import com.gleaum.app.ui.screens.schedules.ComposeScheduleDetailScreen
import com.gleaum.app.ui.theme.GleaumTheme
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class NativeScheduleDetailActivity : AppCompatActivity() {
    private var scheduleId: String = ""
    private var schedule: NativeAppSchedule? = null
    private var loading = true
    private var errorMessage: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        scheduleId = intent.getStringExtra("schedule_id").orEmpty()
        applyLightSystemBars()
        render()
        loadSchedule()
    }

    override fun onResume() {
        super.onResume()
        if (!loading && scheduleId.isNotBlank()) loadSchedule(silent = true)
    }

    private fun applyLightSystemBars() {
        NativeTheme.applySystemBars(window, this)
    }

    private fun loadSchedule(silent: Boolean = false) {
        if (scheduleId.isBlank()) {
            loading = false
            errorMessage = "일정을 찾을 수 없어요."
            render()
            return
        }
        if (!silent) {
            loading = true
            render()
        }
        Thread {
            try {
                val loaded = NativeScheduleApi.detail(this, scheduleId)
                runOnUiThread {
                    schedule = loaded
                    loading = false
                    errorMessage = null
                    render()
                }
            } catch (e: Exception) {
                runOnUiThread {
                    loading = false
                    errorMessage = friendlyError(e.message)
                    render()
                }
            }
        }.start()
    }

    private fun render() {
        if (NativePortFlags.ENABLE_COMPOSE_SCHEDULE_DETAIL) {
            renderComposeDetail()
            return
        }
        setContentView(buildScreen())
    }

    private fun renderComposeDetail() {
        setContent {
            GleaumTheme {
                ComposeScheduleDetailScreen(
                    schedule = schedule,
                    loading = loading,
                    errorMessage = errorMessage,
                    onBack = { finish() },
                    onEdit = { id -> openEdit(id) },
                    onToggleComplete = { status -> patchStatus(status) },
                    onDelete = { deleteSchedule() },
                    onRetry = { loadSchedule() },
                )
            }
        }
    }

    private fun buildScreen(): FrameLayout = FrameLayout(this).apply {
        setBackgroundColor(color("#FAFAFD"))
        addView(ScrollView(context).apply {
            overScrollMode = View.OVER_SCROLL_NEVER
            addView(LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                val s = schedule
                if (s == null) {
                    setPadding(dp(20), statusBarHeight() + dp(84), dp(20), dp(36))
                    addView(messageCard(if (loading) "일정을 불러오는 중이에요..." else errorMessage ?: "일정을 찾을 수 없어요."), matchWrap())
                    return@apply
                }
                addView(buildHero(s), matchWrap())
                setPadding(0, 0, 0, dp(36))
                addView(buildContent(s), matchWrap().apply { topMargin = dp(16); leftMargin = dp(16); rightMargin = dp(16) })
                addView(buildActions(s), matchWrap().apply { topMargin = dp(14); leftMargin = dp(16); rightMargin = dp(16) })
            }, ViewGroup.LayoutParams(match(), wrap()))
        }, FrameLayout.LayoutParams(match(), match()))
    }

    private fun buildHero(s: NativeAppSchedule): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(20), statusBarHeight() + dp(16), dp(20), dp(32))
        background = gradientForType(s.type)
        addView(LinearLayout(context).apply {
            gravity = Gravity.CENTER_VERTICAL
            addView(circleButton("‹") { finish() }, LinearLayout.LayoutParams(dp(40), dp(40)))
            addView(TextView(context).apply {
                text = "일정 상세"
                textSize = 16f
                typeface = bold()
                gravity = Gravity.CENTER
                setTextColor(Color.WHITE)
            }, LinearLayout.LayoutParams(0, dp(40), 1f))
            addView(TextView(context).apply {
                text = "수정"
                textSize = 13f
                typeface = bold()
                gravity = Gravity.CENTER
                setTextColor(Color.WHITE)
                background = round("#33FFFFFF", 999)
                setOnClickListener { openEdit(s.id) }
            }, LinearLayout.LayoutParams(dp(64), dp(36)))
        })
        addView(TextView(context).apply {
            text = typeLabel(s.type)
            textSize = 11f
            typeface = bold()
            letterSpacing = 0.08f
            setTextColor(colorWithAlpha("#FFFFFF", 0.80f))
        }, matchWrap().apply { topMargin = dp(24) })
        addView(TextView(context).apply {
            text = s.title
            textSize = 26f
            typeface = bold()
            setTextColor(Color.WHITE)
        }, matchWrap().apply { topMargin = dp(8) })
        addView(TextView(context).apply {
            text = "${dateTitle(s.startTime)}  ${timeText(s.startTime)}${s.endTime?.let { " ~ ${timeText(it)}" } ?: ""}"
            textSize = 13f
            setTextColor(colorWithAlpha("#FFFFFF", 0.86f))
        }, matchWrap().apply { topMargin = dp(12) })
    }

    private fun circleButton(textValue: String, action: () -> Unit): TextView = TextView(this).apply {
        text = textValue
        textSize = 32f
        gravity = Gravity.CENTER
        setTextColor(Color.WHITE)
        background = round("#33FFFFFF", 999)
        setOnClickListener { action() }
    }

    private fun buildContent(s: NativeAppSchedule): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(20), dp(20), dp(20), dp(20))
        background = round("#FFFFFF", 24, "#EEF0F4")
        elevation = dp(2).toFloat()
        addInfo("상태", statusLabel(s.status))
        addInfo("반복", repeatLabel(s.repeat))
        addInfo("알림", if (s.reminder > 0) "${s.reminder}분 전" else "없음")
        addInfo("메모", s.memo ?: "등록된 메모가 없어요")
    }

    private fun LinearLayout.addInfo(label: String, value: String) {
        addView(TextView(context).apply {
            text = label
            textSize = 11f
            typeface = bold()
            letterSpacing = 0.08f
            setTextColor(NativeTheme.muted(context))
        }, matchWrap().apply { if (childCount > 0) topMargin = dp(18) })
        addView(TextView(context).apply {
            text = value
            textSize = 16f
            typeface = bold()
            setTextColor(NativeTheme.text(context))
        }, matchWrap().apply { topMargin = dp(6) })
    }

    private fun buildActions(s: NativeAppSchedule): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        if (s.status != "completed") addView(primaryButton("완료 처리") { patchStatus("completed") }, matchWrap())
        else addView(primaryButton("예정으로 되돌리기") { patchStatus("pending") }, matchWrap())
        addView(secondaryButton("수정하기") { openEdit(s.id) }, matchWrap().apply { topMargin = dp(10) })
        addView(dangerButton("삭제하기") { confirmDelete() }, matchWrap().apply { topMargin = dp(10) })
    }

    private fun primaryButton(label: String, action: () -> Unit): TextView = button(label, Color.WHITE, gradient("#0CC9B5", "#0084CC", 999), action)
    private fun secondaryButton(label: String, action: () -> Unit): TextView = button(label, color("#0084CC"), round("#F0FAFF", 999, "#D8F0FF"), action)
    private fun dangerButton(label: String, action: () -> Unit): TextView = button(label, color("#DC2626"), round("#FFF1F2", 999, "#FECACA"), action)
    private fun button(label: String, fg: Int, bg: GradientDrawable, action: () -> Unit): TextView = TextView(this).apply {
        text = label
        textSize = 15f
        typeface = bold()
        gravity = Gravity.CENTER
        setTextColor(fg)
        background = bg
        minHeight = dp(50)
        setOnClickListener { action() }
    }

    private fun patchStatus(status: String) {
        Thread {
            try {
                NativeScheduleApi.update(this, scheduleId, org.json.JSONObject().put("status", status))
                runOnUiThread { loadSchedule() }
            } catch (e: Exception) {
                runOnUiThread { errorMessage = friendlyError(e.message); render() }
            }
        }.start()
    }

    private fun confirmDelete() {
        AlertDialog.Builder(this)
            .setTitle("일정을 삭제할까요?")
            .setMessage("삭제한 일정은 복구할 수 없어요.")
            .setNegativeButton("취소", null)
            .setPositiveButton("삭제") { _, _ -> deleteSchedule() }
            .show()
    }

    private fun deleteSchedule() {
        Thread {
            try {
                NativeScheduleApi.delete(this, scheduleId)
                runOnUiThread { finish() }
            } catch (e: Exception) {
                runOnUiThread { errorMessage = friendlyError(e.message); render() }
            }
        }.start()
    }

    private fun openEdit(id: String) {
        startActivity(Intent(this, NativeScheduleCreateActivity::class.java).putExtra("schedule_id", id))
    }

    private fun messageCard(textValue: String): TextView = TextView(this).apply {
        text = textValue
        textSize = 15f
        typeface = bold()
        gravity = Gravity.CENTER
        setTextColor(NativeTheme.muted(context))
        setPadding(dp(20), dp(48), dp(20), dp(48))
        background = round("#FFFFFF", 24, "#EEF0F4")
    }

    private fun friendlyError(code: String?): String = when (code) {
        "schedule_not_found" -> "일정을 찾을 수 없어요."
        "space_editor_required" -> "공유 일정은 공간 운영자 이상만 수정할 수 있어요."
        "session_required" -> "로그인 세션을 찾을 수 없어요. 다시 로그인해 주세요."
        else -> "일정 요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요."
    }

    private fun gradientForType(type: String): GradientDrawable = when (type) {
        "shared" -> gradient("#0CC9B5", "#0084CC", 0)
        "child" -> gradient("#2EE895", "#059669", 0)
        else -> gradient("#22D3EE", "#0891B2", 0)
    }
    private fun typeLabel(type: String): String = when (type) { "shared" -> "공유 일정"; "child" -> "자녀 일정"; else -> "개인 일정" }
    private fun statusLabel(status: String): String = when (status) { "completed" -> "완료"; "in_progress" -> "진행중"; "missed" -> "미완료"; else -> "예정" }
    private fun repeatLabel(repeat: String): String = when (repeat) { "daily" -> "매일"; "weekly" -> "매주"; "monthly" -> "매월"; "yearly" -> "매년"; else -> "반복 없음" }
    private fun dateTitle(iso: String): String = parseIso(iso)?.let { SimpleDateFormat("M월 d일 EEEE", Locale.KOREA).format(it) } ?: "날짜 미정"
    private fun timeText(iso: String): String = parseIso(iso)?.let { SimpleDateFormat("HH:mm", Locale.KOREA).format(it) } ?: "--:--"
    private fun parseIso(iso: String): Date? = runCatching { SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.parse(iso) }.getOrNull()
        ?: runCatching { SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.parse(iso) }.getOrNull()
    private fun bold(): Typeface = Typeface.create("sans-serif", Typeface.BOLD)
    private fun color(hex: String): Int = NativeTheme.color(this, hex)
    private fun colorWithAlpha(hex: String, alpha: Float): Int = NativeTheme.alpha(hex, alpha)
    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()
    private fun statusBarHeight(): Int { val id = resources.getIdentifier("status_bar_height", "dimen", "android"); return if (id > 0) resources.getDimensionPixelSize(id) else 0 }
    private fun match(): Int = ViewGroup.LayoutParams.MATCH_PARENT
    private fun wrap(): Int = ViewGroup.LayoutParams.WRAP_CONTENT
    private fun matchWrap(): LinearLayout.LayoutParams = LinearLayout.LayoutParams(match(), wrap())
    private fun round(fill: String, radius: Int, stroke: String? = null): GradientDrawable = GradientDrawable().apply { setColor(color(fill)); cornerRadius = dp(radius).toFloat(); if (stroke != null) setStroke(dp(1), color(stroke)) }
    private fun gradient(a: String, b: String, radius: Int): GradientDrawable = GradientDrawable(GradientDrawable.Orientation.TL_BR, intArrayOf(color(a), color(b))).apply { cornerRadius = dp(radius).toFloat() }
}
