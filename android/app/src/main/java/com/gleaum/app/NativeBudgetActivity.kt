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
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

class NativeBudgetActivity : AppCompatActivity() {
    private var loading = true
    private var errorMessage: String? = null
    private var summary: NativeBudgetSummary? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        applyLightSystemBars()
        render()
        loadSummary()
    }

    override fun onResume() {
        super.onResume()
        if (!loading) loadSummary(silent = true)
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

    private fun loadSummary(silent: Boolean = false) {
        if (!silent) {
            loading = true
            errorMessage = null
            render()
        }
        Thread {
            try {
                val loaded = NativeBudgetApi.summary(this)
                runOnUiThread {
                    summary = loaded
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
                setPadding(dp(20), statusBarHeight() + dp(84), dp(20), dp(84))
                val data = summary
                if (loading) {
                    addView(messageCard("가계부를 불러오는 중이에요..."), matchWrap())
                } else if (errorMessage != null) {
                    addView(messageCard(errorMessage ?: "가계부를 불러오지 못했어요."), matchWrap())
                } else if (data != null) {
                    addView(buildHero(data), matchWrap())
                    addView(buildStatGrid(data), matchWrap().apply { topMargin = dp(14) })
                    addView(buildBreakdown(data), matchWrap().apply { topMargin = dp(14) })
                    addView(buildRecent(data), matchWrap().apply { topMargin = dp(18) })
                }
            }, ViewGroup.LayoutParams(match(), wrap()))
        }, FrameLayout.LayoutParams(match(), match()))
        addView(buildHeader(), FrameLayout.LayoutParams(match(), statusBarHeight() + dp(72), Gravity.TOP))
        addView(buildBottomNav(), FrameLayout.LayoutParams(match(), dp(56), Gravity.BOTTOM))
    }

    private fun buildHeader(): FrameLayout = FrameLayout(this).apply {
        setBackgroundColor(color("#FAFAFD"))
        elevation = dp(2).toFloat()
        addView(LinearLayout(context).apply {
            gravity = Gravity.CENTER_VERTICAL
            orientation = LinearLayout.HORIZONTAL
            addView(ImageView(context).apply { setImageResource(R.drawable.gleaum_logo_native) }, LinearLayout.LayoutParams(dp(34), dp(34)))
            addView(TextView(context).apply {
                text = "가계부"
                textSize = 24f
                typeface = bold()
                setTextColor(color("#1A1B2E"))
            }, LinearLayout.LayoutParams(0, dp(44), 1f).apply { leftMargin = dp(10) })
            addView(TextView(context).apply {
                text = "+"
                textSize = 28f
                typeface = bold()
                gravity = Gravity.CENTER
                setTextColor(Color.WHITE)
                background = gradient("#0CC9B5", "#0084CC", 16)
                setOnClickListener { startActivity(Intent(this@NativeBudgetActivity, NativeBudgetEntryCreateActivity::class.java)) }
            }, LinearLayout.LayoutParams(dp(48), dp(48)))
        }, FrameLayout.LayoutParams(match(), dp(54), Gravity.BOTTOM).apply { leftMargin = dp(20); rightMargin = dp(20); bottomMargin = dp(8) })
        addView(View(context).apply { setBackgroundColor(color("#EEF0F4")) }, FrameLayout.LayoutParams(match(), dp(1), Gravity.BOTTOM))
    }

    private fun buildHero(data: NativeBudgetSummary): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(24), dp(24), dp(24), dp(24))
        background = gradient("#0CC9B5", "#0084CC", 28)
        elevation = dp(8).toFloat()
        addView(TextView(context).apply {
            text = "이번 달 순액"
            textSize = 13f
            typeface = medium()
            setTextColor(colorWithAlpha("#FFFFFF", 0.78f))
        })
        addView(TextView(context).apply {
            text = "${if (data.net >= 0) "+" else "-"}${money(kotlin.math.abs(data.net))}"
            textSize = 34f
            typeface = bold()
            setTextColor(Color.WHITE)
        }, matchWrap().apply { topMargin = dp(4) })
        addView(TextView(context).apply {
            text = "저축률 ${data.savingsRate}% · 개인 가계부 기준"
            textSize = 12f
            typeface = bold()
            setTextColor(colorWithAlpha("#FFFFFF", 0.82f))
        }, matchWrap().apply { topMargin = dp(12) })
    }

    private fun buildStatGrid(data: NativeBudgetSummary): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        addView(statBox("수입", money(data.incomeTotal), "#10B981"), LinearLayout.LayoutParams(0, dp(96), 1f))
        addView(statBox("지출", money(data.expenseTotal), "#0084CC"), LinearLayout.LayoutParams(0, dp(96), 1f).apply { leftMargin = dp(10) })
    }

    private fun statBox(label: String, value: String, accent: String): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(18), 0, dp(18), 0)
        background = round("#FFFFFF", 20, "#EEF0F4")
        elevation = dp(2).toFloat()
        addView(TextView(context).apply { text = label; textSize = 12f; typeface = bold(); setTextColor(color("#8E8E93")) })
        addView(TextView(context).apply { text = value; textSize = 20f; typeface = bold(); setTextColor(color(accent)) }, matchWrap().apply { topMargin = dp(5) })
    }

    private fun buildBreakdown(data: NativeBudgetSummary): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(20), dp(20), dp(20), dp(20))
        background = round("#FFFFFF", 24, "#EEF0F4")
        elevation = dp(2).toFloat()
        addView(sectionTitle("현금 흐름 구성"))
        addMetric("고정 지출", money(data.fixedExpenseTotal), "예정 ${data.pendingExpenseCount}건")
        addMetric("변동 지출", money(data.variableExpenseTotal), "완료 ${data.completedExpenseCount}건")
        addMetric("정기 수입", money(data.recurringIncomeTotal), "예정 ${data.pendingIncomeCount}건")
        addMetric("일회 수입", money(data.onceIncomeTotal), "수령 ${data.completedIncomeCount}건")
    }

    private fun LinearLayout.addMetric(label: String, amount: String, meta: String) {
        addView(LinearLayout(context).apply {
            gravity = Gravity.CENTER_VERTICAL
            addView(TextView(context).apply { text = label; textSize = 14f; typeface = bold(); setTextColor(color("#1A1B2E")) }, LinearLayout.LayoutParams(0, wrap(), 1f))
            addView(TextView(context).apply { text = "$amount\n$meta"; textSize = 13f; gravity = Gravity.RIGHT; typeface = bold(); setTextColor(color("#6E6E66")) })
        }, matchWrap().apply { topMargin = dp(14) })
    }

    private fun buildRecent(data: NativeBudgetSummary): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        addView(sectionTitle("최근 항목"))
        if (data.recentEntries.isEmpty()) {
            addView(messageCard("등록된 수입/지출이 없어요."), matchWrap().apply { topMargin = dp(10) })
        } else {
            data.recentEntries.forEach { entry -> addView(entryCard(entry), matchWrap().apply { topMargin = dp(10) }) }
        }
    }

    private fun entryCard(entry: NativeBudgetEntry): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(16), dp(14), dp(12), dp(14))
        background = round("#FFFFFF", 20, "#EEF0F4")
        elevation = dp(2).toFloat()
        setOnClickListener { openEdit(entry.id) }
        val income = entry.kind == "income"
        addView(TextView(context).apply {
            text = if (income) "수입" else "지출"
            textSize = 12f
            typeface = bold()
            gravity = Gravity.CENTER
            setTextColor(color(if (income) "#10B981" else "#0084CC"))
            background = round(if (income) "#EAFBF4" else "#F0FAFF", 14)
        }, LinearLayout.LayoutParams(dp(52), dp(44)))
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            addView(TextView(context).apply { text = entry.title; textSize = 15f; typeface = bold(); setTextColor(color("#1A1B2E")) })
            addView(TextView(context).apply { text = "${dayText(entry.occurredAt)} · ${recurLabel(entry.recurFreq)}"; textSize = 12f; setTextColor(color("#8E8E93")) }, matchWrap().apply { topMargin = dp(3) })
            if (entry.recurFreq != "none") {
                addView(TextView(context).apply {
                    text = if (entry.status == "completed") (if (income) "수령 완료" else "결제 완료") else (if (income) "수령 예정" else "결제 예정")
                    textSize = 11f
                    typeface = bold()
                    setTextColor(color(if (entry.status == "completed") "#10B981" else "#0084CC"))
                    setOnClickListener { toggleEntryStatus(entry) }
                }, matchWrap().apply { topMargin = dp(5) })
            }
        }, LinearLayout.LayoutParams(0, wrap(), 1f).apply { leftMargin = dp(12) })
        addView(TextView(context).apply {
            text = "${if (income) "+" else "-"}${money(entry.amount)}"
            textSize = 15f
            typeface = bold()
            gravity = Gravity.RIGHT
            setTextColor(color(if (income) "#10B981" else "#1A1B2E"))
        })
        addView(TextView(context).apply {
            text = "×"
            textSize = 20f
            gravity = Gravity.CENTER
            setTextColor(color("#EF4444"))
            setOnClickListener { confirmDelete(entry) }
        }, LinearLayout.LayoutParams(dp(34), dp(44)).apply { leftMargin = dp(6) })
    }

    private fun openEdit(id: String) {
        startActivity(Intent(this, NativeBudgetEntryCreateActivity::class.java).putExtra("entry_id", id))
    }

    private fun toggleEntryStatus(entry: NativeBudgetEntry) {
        val next = if (entry.status == "completed") "pending" else "completed"
        Thread {
            try {
                NativeBudgetApi.update(this, entry.id, org.json.JSONObject().put("status", next))
                runOnUiThread { loadSummary() }
            } catch (e: Exception) {
                runOnUiThread { errorMessage = friendlyError(e.message); render() }
            }
        }.start()
    }

    private fun confirmDelete(entry: NativeBudgetEntry) {
        AlertDialog.Builder(this)
            .setTitle("항목을 삭제할까요?")
            .setMessage("삭제한 수입/지출 항목은 복구할 수 없어요.")
            .setNegativeButton("취소", null)
            .setPositiveButton("삭제") { _, _ -> deleteEntry(entry.id) }
            .show()
    }

    private fun deleteEntry(id: String) {
        Thread {
            try {
                NativeBudgetApi.delete(this, id)
                runOnUiThread { loadSummary() }
            } catch (e: Exception) {
                runOnUiThread { errorMessage = friendlyError(e.message); render() }
            }
        }.start()
    }

    private fun sectionTitle(title: String): TextView = TextView(this).apply { text = title; textSize = 17f; typeface = bold(); setTextColor(color("#1A1B2E")) }
    private fun messageCard(textValue: String): TextView = TextView(this).apply { text = textValue; textSize = 15f; typeface = bold(); gravity = Gravity.CENTER; setTextColor(color("#8E8E93")); setPadding(dp(20), dp(48), dp(20), dp(48)); background = round("#FFFFFF", 24, "#EEF0F4") }

    private fun buildBottomNav(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
        background = round("#FFFFFF", 0, "#E8E8E4")
        listOf(
            "홈" to { startActivity(Intent(this@NativeBudgetActivity, NativeHomePortActivity::class.java)); finish() },
            "일정" to { startActivity(Intent(this@NativeBudgetActivity, NativeScheduleListActivity::class.java)); finish() },
            "공간" to { openWebPath("/space") },
            "가계부" to {},
            "전체" to { startActivity(Intent(this@NativeBudgetActivity, NativeMyMenuActivity::class.java)); finish() },
        ).forEachIndexed { index, item -> addView(bottomItem(item.first, index == 3, item.second), LinearLayout.LayoutParams(0, match(), 1f)) }
    }

    private fun bottomItem(label: String, active: Boolean, action: () -> Unit): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER
        setOnClickListener { action() }
        addView(View(context).apply { background = if (active) round("#0084CC", 999) else null }, LinearLayout.LayoutParams(dp(28), dp(3)).apply { bottomMargin = dp(6) })
        addView(NativeTabIconView(context, tabIcon(label), if (active) color("#0084CC") else color("#8E8E93")), LinearLayout.LayoutParams(dp(20), dp(20)))
        addView(TextView(context).apply { text = label; textSize = 10f; typeface = Typeface.create("sans-serif", if (active) Typeface.BOLD else Typeface.NORMAL); setTextColor(if (active) color("#0084CC") else color("#8E8E93")) }, matchWrap().apply { topMargin = dp(3) })
    }

    private fun tabIcon(label: String): NativeTabIcon = when (label) {
        "홈" -> NativeTabIcon.HOME
        "일정" -> NativeTabIcon.CALENDAR
        "공간" -> NativeTabIcon.SPACE
        "가계부" -> NativeTabIcon.BUDGET
        else -> NativeTabIcon.MENU
    }

    private fun openWebPath(path: String) { startActivity(Intent(this, MainActivity::class.java).putExtra("start_path", path)); finish() }
    private fun friendlyError(code: String?): String = if (code == "session_required") "로그인 세션을 찾을 수 없어요. 다시 로그인해 주세요." else "가계부를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
    private fun money(value: Long): String = NumberFormat.getNumberInstance(Locale.KOREA).format(value) + "원"
    private fun dayText(iso: String): String = parseIso(iso)?.let { SimpleDateFormat("M월 d일", Locale.KOREA).format(it) } ?: iso.take(10)
    private fun parseIso(iso: String): java.util.Date? = runCatching { SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.parse(iso) }.getOrNull() ?: runCatching { SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.parse(iso) }.getOrNull()
    private fun recurLabel(value: String): String = when (value) { "weekly" -> "매주"; "monthly" -> "매월"; "yearly" -> "매년"; else -> "일회" }
    private fun bold(): Typeface = Typeface.create("sans-serif", Typeface.BOLD)
    private fun medium(): Typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
    private fun color(hex: String): Int = Color.parseColor(hex)
    private fun colorWithAlpha(hex: String, alpha: Float): Int { val b = color(hex); return Color.argb((alpha * 255).toInt(), Color.red(b), Color.green(b), Color.blue(b)) }
    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()
    private fun statusBarHeight(): Int { val id = resources.getIdentifier("status_bar_height", "dimen", "android"); return if (id > 0) resources.getDimensionPixelSize(id) else 0 }
    private fun match(): Int = ViewGroup.LayoutParams.MATCH_PARENT
    private fun wrap(): Int = ViewGroup.LayoutParams.WRAP_CONTENT
    private fun matchWrap(): LinearLayout.LayoutParams = LinearLayout.LayoutParams(match(), wrap())
    private fun round(fill: String, radius: Int, stroke: String? = null): GradientDrawable = GradientDrawable().apply { setColor(color(fill)); cornerRadius = dp(radius).toFloat(); if (stroke != null) setStroke(dp(1), color(stroke)) }
    private fun gradient(a: String, b: String, radius: Int): GradientDrawable = GradientDrawable(GradientDrawable.Orientation.TL_BR, intArrayOf(color(a), color(b))).apply { cornerRadius = dp(radius).toFloat() }
}
