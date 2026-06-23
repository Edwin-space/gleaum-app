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
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.Date
import java.util.TimeZone

class NativeScheduleListActivity : AppCompatActivity() {
    private var loading = true
    private var errorMessage: String? = null
    private var schedules: List<NativeAppSchedule> = emptyList()
    private var filter = "all"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        applyLightSystemBars()
        render()
        loadSchedules()
    }

    override fun onResume() {
        super.onResume()
        if (!loading) loadSchedules(silent = true)
    }

    private fun applyLightSystemBars() {
        window.statusBarColor = color("#FAFAFD")
        window.navigationBarColor = color("#FAFAFD")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            var flags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) flags = flags or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
            window.decorView.systemUiVisibility = flags
        }
    }

    private fun loadSchedules(silent: Boolean = false) {
        if (!silent) {
            loading = true
            errorMessage = null
            render()
        }
        Thread {
            try {
                val loaded = NativeScheduleApi.list(this, filter)
                runOnUiThread {
                    schedules = loaded
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

    private fun render() = setContentView(buildScreen())

    private fun buildScreen(): FrameLayout = FrameLayout(this).apply {
        setBackgroundColor(color("#FAFAFD"))
        addView(ScrollView(context).apply {
            overScrollMode = View.OVER_SCROLL_NEVER
            addView(LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(20), statusBarHeight() + dp(96), dp(20), dp(84))
                addView(buildHero(), matchWrap())
                addView(buildFilters(), matchWrap().apply { topMargin = dp(14) })
                errorMessage?.let { addView(messageCard(it), matchWrap().apply { topMargin = dp(14) }) }
                if (loading) addView(loadingCard(), matchWrap().apply { topMargin = dp(16) })
                else addScheduleGroups(this)
            }, ViewGroup.LayoutParams(match(), wrap()))
        }, FrameLayout.LayoutParams(match(), match()))
        addView(buildHeader(), FrameLayout.LayoutParams(match(), statusBarHeight() + dp(76), Gravity.TOP))
        addView(buildBottomNav(), FrameLayout.LayoutParams(match(), dp(56), Gravity.BOTTOM))
    }

    private fun buildHeader(): FrameLayout = FrameLayout(this).apply {
        setBackgroundColor(color("#FAFAFD"))
        elevation = dp(2).toFloat()
        addView(LinearLayout(context).apply {
            gravity = Gravity.CENTER_VERTICAL
            orientation = LinearLayout.HORIZONTAL
            addView(ImageView(context).apply {
                setImageResource(R.drawable.gleaum_logo_native)
                scaleType = ImageView.ScaleType.FIT_CENTER
            }, LinearLayout.LayoutParams(dp(34), dp(34)))
            addView(TextView(context).apply {
                text = "나의 일정"
                textSize = 24f
                typeface = bold()
                setTextColor(color("#1A1B2E"))
            }, LinearLayout.LayoutParams(0, dp(44), 1f).apply { leftMargin = dp(10) })
            addView(TextView(context).apply {
                text = "+"
                textSize = 28f
                gravity = Gravity.CENTER
                typeface = bold()
                setTextColor(Color.WHITE)
                background = gradient("#0CC9B5", "#0084CC", 16)
                setOnClickListener { startActivity(Intent(this@NativeScheduleListActivity, NativeScheduleCreateActivity::class.java)) }
            }, LinearLayout.LayoutParams(dp(48), dp(48)))
        }, FrameLayout.LayoutParams(match(), dp(54), Gravity.BOTTOM).apply {
            leftMargin = dp(20); rightMargin = dp(20); bottomMargin = dp(10)
        })
        addView(View(context).apply { setBackgroundColor(color("#EEF0F4")) }, FrameLayout.LayoutParams(match(), dp(1), Gravity.BOTTOM))
    }

    private fun buildHero(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(24), dp(22), dp(24), dp(22))
        background = gradient("#1A1B2E", "#2D2E4A", 28)
        elevation = dp(8).toFloat()
        val today = schedules.count { dateKey(it.startTime) == dateKey(System.currentTimeMillis()) }
        val done = schedules.count { dateKey(it.startTime) == dateKey(System.currentTimeMillis()) && it.status == "completed" }
        addView(TextView(context).apply {
            text = "TODAY'S FOCUS"
            textSize = 10f
            typeface = bold()
            letterSpacing = 0.1f
            setTextColor(colorWithAlpha("#FFFFFF", 0.55f))
        })
        addView(TextView(context).apply {
            text = if (today == 0) "오늘 일정이 없어요" else "오늘 ${today}개의 일정이 있어요"
            textSize = 20f
            typeface = bold()
            setTextColor(Color.WHITE)
        }, matchWrap().apply { topMargin = dp(8) })
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            addPill("오늘 ${today}개", "#22FFFFFF", "#FFFFFF")
            addPill("완료 ${done}개", "#222EE895", "#2EE895")
        }, matchWrap().apply { topMargin = dp(14) })
    }

    private fun LinearLayout.addPill(label: String, bg: String, fg: String) {
        addView(TextView(context).apply {
            text = label
            textSize = 12f
            typeface = bold()
            setTextColor(color(fg))
            gravity = Gravity.CENTER
            setPadding(dp(14), 0, dp(14), 0)
            background = round(bg, 999)
        }, LinearLayout.LayoutParams(wrap(), dp(30)).apply { rightMargin = dp(8) })
    }

    private fun buildFilters(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        listOf("all" to "전체", "shared" to "공유", "personal" to "개인", "child" to "자녀").forEach { (key, label) ->
            val selected = filter == key
            addView(TextView(context).apply {
                text = label
                gravity = Gravity.CENTER
                textSize = 13f
                typeface = bold()
                setTextColor(if (selected) Color.WHITE else color("#8E8E93"))
                background = if (selected) gradient("#0084CC", "#0CC9B5", 12) else round("#FFFFFF", 12, "#EEF0F4")
                setOnClickListener {
                    filter = key
                    loadSchedules()
                }
            }, LinearLayout.LayoutParams(0, dp(40), 1f).apply { if (childCount > 0) leftMargin = dp(8) })
        }
    }

    private fun addScheduleGroups(parent: LinearLayout) {
        val visible = schedules.filter { filter == "all" || it.type == filter }
        if (visible.isEmpty()) {
            parent.addView(emptyCard(), matchWrap().apply { topMargin = dp(18) })
            return
        }
        visible.groupBy { dateTitle(it.startTime) }.forEach { (date, items) ->
            parent.addView(sectionHeader(date, "${items.size}"), matchWrap().apply { topMargin = dp(22) })
            items.forEach { schedule -> parent.addView(scheduleCard(schedule), matchWrap().apply { topMargin = dp(10) }) }
        }
    }

    private fun sectionHeader(title: String, count: String): LinearLayout = LinearLayout(this).apply {
        gravity = Gravity.CENTER_VERTICAL
        addView(TextView(context).apply {
            text = title
            textSize = 17f
            typeface = bold()
            setTextColor(color("#1A1B2E"))
        }, LinearLayout.LayoutParams(0, wrap(), 1f))
        addView(TextView(context).apply {
            text = count
            textSize = 11f
            typeface = bold()
            gravity = Gravity.CENTER
            setTextColor(color("#8E8E93"))
            background = round("#F7F8FB", 999)
            setPadding(dp(9), dp(4), dp(9), dp(4))
        })
    }

    private fun scheduleCard(schedule: NativeAppSchedule): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(16), dp(16), dp(14), dp(16))
        background = round("#FFFFFF", 20, "#EEF0F4")
        elevation = dp(2).toFloat()
        setOnClickListener {
            startActivity(Intent(this@NativeScheduleListActivity, NativeScheduleDetailActivity::class.java).putExtra("schedule_id", schedule.id))
        }
        val typeColor = typeColor(schedule.type)
        addView(TextView(context).apply {
            text = timeText(schedule.startTime)
            textSize = 14f
            typeface = bold()
            gravity = Gravity.CENTER
            setTextColor(typeColor)
            background = roundColor(typeColor, 16, 0.10f)
        }, LinearLayout.LayoutParams(dp(66), dp(58)))
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            addView(TextView(context).apply {
                text = typeLabel(schedule.type)
                textSize = 11f
                typeface = bold()
                setTextColor(typeColor)
            })
            addView(TextView(context).apply {
                text = schedule.title
                textSize = 16f
                typeface = bold()
                setTextColor(color("#1A1B2E"))
            }, matchWrap().apply { topMargin = dp(4) })
            addView(TextView(context).apply {
                text = statusLabel(schedule.status)
                textSize = 12f
                setTextColor(color("#8E8E93"))
            }, matchWrap().apply { topMargin = dp(3) })
        }, LinearLayout.LayoutParams(0, wrap(), 1f).apply { leftMargin = dp(14) })
        addView(TextView(context).apply {
            text = "›"
            textSize = 24f
            gravity = Gravity.CENTER
            setTextColor(color("#AEAEA8"))
        }, LinearLayout.LayoutParams(dp(24), dp(48)))
    }

    private fun loadingCard(): TextView = messageCard("일정을 불러오는 중이에요...")
    private fun emptyCard(): TextView = messageCard("표시할 일정이 없습니다\n새 일정을 추가해보세요")
    private fun messageCard(textValue: String): TextView = TextView(this).apply {
        text = textValue
        textSize = 15f
        typeface = bold()
        gravity = Gravity.CENTER
        setTextColor(color("#8E8E93"))
        setPadding(dp(20), dp(48), dp(20), dp(48))
        background = round("#FFFFFF", 24, "#EEF0F4")
    }

    private fun buildBottomNav(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
        background = round("#FFFFFF", 0, "#E8E8E4")
        listOf(
            "홈" to { startActivity(Intent(this@NativeScheduleListActivity, NativeHomePortActivity::class.java)); finish() },
            "일정" to {},
            "공간" to { openWebPath("/space") },
            "가계부" to { openWebPath("/budget") },
            "전체" to { startActivity(Intent(this@NativeScheduleListActivity, NativeMyMenuActivity::class.java)); finish() },
        ).forEachIndexed { index, item -> addView(bottomItem(item.first, index == 1, item.second), LinearLayout.LayoutParams(0, match(), 1f)) }
    }

    private fun bottomItem(label: String, active: Boolean, action: () -> Unit): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER
        setOnClickListener { action() }
        addView(View(context).apply { background = if (active) round("#0084CC", 999) else null }, LinearLayout.LayoutParams(dp(28), dp(3)).apply { bottomMargin = dp(6) })
        addView(TextView(context).apply {
            text = when (label) { "홈" -> "⌂"; "일정" -> "□"; "공간" -> "⌘"; "가계부" -> "▭"; else -> "☰" }
            textSize = 18f
            gravity = Gravity.CENTER
            setTextColor(if (active) color("#0084CC") else color("#8E8E93"))
        }, LinearLayout.LayoutParams(dp(22), dp(20)))
        addView(TextView(context).apply {
            text = label
            textSize = 10f
            typeface = Typeface.create("sans-serif", if (active) Typeface.BOLD else Typeface.NORMAL)
            setTextColor(if (active) color("#0084CC") else color("#8E8E93"))
        }, matchWrap().apply { topMargin = dp(3) })
    }

    private fun openWebPath(path: String) {
        startActivity(Intent(this, MainActivity::class.java).putExtra("start_path", path))
        finish()
    }

    private fun friendlyError(code: String?): String = when (code) {
        "session_required" -> "로그인 세션을 찾을 수 없어요. 다시 로그인해 주세요."
        else -> "일정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
    }

    private fun typeColor(type: String): Int = color(when (type) { "shared" -> "#0084CC"; "child" -> "#2EE895"; else -> "#0CC9B5" })
    private fun typeLabel(type: String): String = when (type) { "shared" -> "공유일정"; "child" -> "자녀일정"; else -> "개인일정" }
    private fun statusLabel(status: String): String = when (status) { "completed" -> "완료"; "in_progress" -> "진행중"; "missed" -> "미완료"; else -> "예정" }
    private fun dateTitle(iso: String): String = parseIso(iso)?.let { SimpleDateFormat("M월 d일 (E)", Locale.KOREA).format(it) } ?: "날짜 미정"
    private fun dateKey(iso: String): String = parseIso(iso)?.let { SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(it) } ?: iso.take(10)
    private fun dateKey(ms: Long): String = SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(Date(ms))
    private fun timeText(iso: String): String = parseIso(iso)?.let { SimpleDateFormat("HH:mm", Locale.KOREA).format(it) } ?: "--:--"
    private fun parseIso(iso: String): Date? = runCatching {
        SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.parse(iso)
    }.getOrNull() ?: runCatching {
        SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.parse(iso)
    }.getOrNull()
    private fun bold(): Typeface = Typeface.create("sans-serif", Typeface.BOLD)
    private fun color(hex: String): Int = Color.parseColor(hex)
    private fun colorWithAlpha(hex: String, alpha: Float): Int { val b = color(hex); return Color.argb((alpha * 255).toInt(), Color.red(b), Color.green(b), Color.blue(b)) }
    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()
    private fun statusBarHeight(): Int { val id = resources.getIdentifier("status_bar_height", "dimen", "android"); return if (id > 0) resources.getDimensionPixelSize(id) else 0 }
    private fun match(): Int = ViewGroup.LayoutParams.MATCH_PARENT
    private fun wrap(): Int = ViewGroup.LayoutParams.WRAP_CONTENT
    private fun matchWrap(): LinearLayout.LayoutParams = LinearLayout.LayoutParams(match(), wrap())
    private fun round(fill: String, radius: Int, stroke: String? = null, alpha: Float = 1f): GradientDrawable = GradientDrawable().apply { setColor(colorWithAlpha(fill, alpha)); cornerRadius = dp(radius).toFloat(); if (stroke != null) setStroke(dp(1), color(stroke)) }
    private fun roundColor(fill: Int, radius: Int, alpha: Float): GradientDrawable = GradientDrawable().apply { setColor(Color.argb((alpha * 255).toInt(), Color.red(fill), Color.green(fill), Color.blue(fill))); cornerRadius = dp(radius).toFloat() }
    private fun gradient(a: String, b: String, radius: Int): GradientDrawable = GradientDrawable(GradientDrawable.Orientation.TL_BR, intArrayOf(color(a), color(b))).apply { cornerRadius = dp(radius).toFloat() }
}
