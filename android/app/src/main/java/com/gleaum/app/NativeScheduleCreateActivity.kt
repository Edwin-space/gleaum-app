package com.gleaum.app

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject
import java.util.Calendar
import java.util.Locale

/** Native schedule creation form for Android Home Port. */
class NativeScheduleCreateActivity : AppCompatActivity() {

    private var scheduleId: String? = null
    private var editingSchedule: NativeAppSchedule? = null
    private var type = "personal"
    private val startCalendar = Calendar.getInstance()
    private val endCalendar = Calendar.getInstance()
    private lateinit var titleInput: EditText
    private lateinit var memoInput: EditText
    private var saving = false
    private var message: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        scheduleId = intent.getStringExtra("schedule_id")
        intent.getStringExtra("selected_date")?.takeIf { it.length >= 10 }?.let(::applySelectedDate)
        endCalendar.timeInMillis = startCalendar.timeInMillis + 60L * 60L * 1000L
        applyLightSystemBars()
        if (scheduleId != null) loadScheduleForEdit() else render()
    }

    private fun applySelectedDate(dateKey: String) {
        val parts = dateKey.split("-").mapNotNull { it.toIntOrNull() }
        if (parts.size == 3) {
            startCalendar.set(parts[0], parts[1] - 1, parts[2], 9, 0, 0)
            startCalendar.set(Calendar.MILLISECOND, 0)
            endCalendar.set(parts[0], parts[1] - 1, parts[2], 10, 0, 0)
            endCalendar.set(Calendar.MILLISECOND, 0)
        }
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

    private fun render() {
        setContentView(buildScreen())
    }

    private fun loadScheduleForEdit() {
        saving = true
        render()
        Thread {
            try {
                val loaded = NativeScheduleApi.detail(this, scheduleId ?: return@Thread)
                runOnUiThread {
                    editingSchedule = loaded
                    type = loaded.type
                    applyIsoToCalendar(startCalendar, loaded.startTime)
                    loaded.endTime?.let { applyIsoToCalendar(endCalendar, it) }
                        ?: run { endCalendar.timeInMillis = startCalendar.timeInMillis + 60L * 60L * 1000L }
                    saving = false
                    render()
                }
            } catch (e: Exception) {
                runOnUiThread {
                    saving = false
                    message = friendlyError(e.message)
                    render()
                }
            }
        }.start()
    }

    private fun buildScreen(): FrameLayout {
        return FrameLayout(this).apply {
            setBackgroundColor(color("#FAFAFD"))
            addView(ScrollView(context).apply {
                overScrollMode = View.OVER_SCROLL_NEVER
                addView(LinearLayout(context).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(dp(20), statusBarHeight() + dp(76), dp(20), dp(36))

                    addView(buildHero(), matchWrap())
                    message?.let { addView(buildMessage(it), matchWrap().apply { topMargin = dp(12) }) }
                    addView(buildTypeSelector(), matchWrap().apply { topMargin = dp(16) })
                    addView(buildFormCard(), matchWrap().apply { topMargin = dp(14) })
                    addView(buildSaveButton(), matchWrap().apply { topMargin = dp(18) })
                }, ViewGroup.LayoutParams(match(), wrap()))
            }, FrameLayout.LayoutParams(match(), match()))
            addView(buildHeaderBar(), FrameLayout.LayoutParams(match(), statusBarHeight() + dp(64), Gravity.TOP))
        }
    }

    private fun buildHeaderBar(): FrameLayout {
        return FrameLayout(this).apply {
            setBackgroundColor(color("#FAFAFD"))
            elevation = dp(2).toFloat()
            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                addView(TextView(context).apply {
                    text = "‹"
                    textSize = 34f
                    gravity = Gravity.CENTER
                    setTextColor(color("#1A1B2E"))
                    background = roundDrawable("#FFFFFF", 999, "#EEF0F4")
                    setOnClickListener { finish() }
                }, LinearLayout.LayoutParams(dp(40), dp(40)))
                addView(TextView(context).apply {
                    text = if (scheduleId == null) "새 일정" else "일정 수정"
                    textSize = 18f
                    typeface = brandBold()
                    setTextColor(color("#1A1B2E"))
                    gravity = Gravity.CENTER_VERTICAL
                }, LinearLayout.LayoutParams(0, dp(44), 1f).apply { leftMargin = dp(12) })
                addView(ImageView(context).apply {
                    setImageResource(R.drawable.gleaum_logo_native)
                    scaleType = ImageView.ScaleType.FIT_CENTER
                }, LinearLayout.LayoutParams(dp(32), dp(32)))
            }, FrameLayout.LayoutParams(match(), dp(44), Gravity.BOTTOM).apply {
                leftMargin = dp(20)
                rightMargin = dp(20)
                bottomMargin = dp(10)
            })
            addView(View(context).apply { setBackgroundColor(color("#EEF0F4")) }, FrameLayout.LayoutParams(match(), dp(1), Gravity.BOTTOM))
        }
    }

    private fun buildHero(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(24), dp(26), dp(24), dp(24))
        background = gradientDrawable("#1A1B2E", "#2D2E4A", 28)
        elevation = dp(8).toFloat()
        addView(TextView(context).apply {
            text = "SCHEDULE"
            textSize = 12f
            typeface = brandBold()
            letterSpacing = 0.08f
            setTextColor(color("#0CC9B5"))
        })
        addView(TextView(context).apply {
            text = if (scheduleId == null) "새 일정을 등록해요" else "일정을 수정해요"
            textSize = 25f
            typeface = brandBold()
            letterSpacing = -0.02f
            setTextColor(Color.WHITE)
        }, matchWrap().apply { topMargin = dp(8) })
        addView(TextView(context).apply {
            text = "개인 일정은 개인 공간에, 공유 일정은 연결된 공간에 저장됩니다."
            textSize = 12f
            typeface = brandMedium()
            setTextColor(colorWithAlpha("#FFFFFF", 0.54f))
        }, matchWrap().apply { topMargin = dp(6) })
    }

    private fun buildMessage(text: String): TextView = TextView(this).apply {
        this.text = text
        textSize = 13f
        typeface = brandBold()
        gravity = Gravity.CENTER
        setTextColor(if (text.contains("완료")) color("#0084CC") else color("#EF4444"))
        setPadding(dp(16), dp(14), dp(16), dp(14))
        background = roundDrawable(if (text.contains("완료")) "#F0FAFF" else "#FFF1F2", 18, if (text.contains("완료")) "#D8F0FF" else "#FECACA")
    }

    private fun buildTypeSelector(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        setPadding(dp(4), dp(4), dp(4), dp(4))
        background = roundDrawable("#F7F8FB", 16)
        addTypeTab("개인", "personal")
        addTypeTab("공유", "shared")
        addTypeTab("자녀", "child")
    }

    private fun LinearLayout.addTypeTab(label: String, value: String) {
        val active = type == value
        addView(TextView(context).apply {
            text = label
            textSize = 14f
            typeface = if (active) brandBold() else brandMedium()
            gravity = Gravity.CENTER
            setTextColor(if (active) Color.WHITE else color("#8E8E93"))
            background = if (active) gradientDrawable("#0CC9B5", "#0084CC", 13) else roundDrawable("#00FFFFFF", 13)
            setOnClickListener {
                type = value
                render()
            }
        }, LinearLayout.LayoutParams(0, dp(42), 1f).apply { if (childCount > 0) leftMargin = dp(4) })
    }

    private fun buildFormCard(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(20), dp(20), dp(20), dp(20))
        background = roundDrawable("#FFFFFF", 24, "#EEF0F4")
        elevation = dp(2).toFloat()

        titleInput = input("일정 제목", "예: 병원, 회의, 가족 식사", false).apply {
            editingSchedule?.title?.let { setText(it) }
        }
        addView(label("일정 제목"))
        addView(titleInput, matchWrap().apply { topMargin = dp(8) })

        addView(label("날짜와 시간"), matchWrap().apply { topMargin = dp(18) })
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            addView(pickerBox("날짜", dateText()) { pickDate() }, LinearLayout.LayoutParams(0, dp(64), 1f))
            addView(pickerBox("시작", timeText(startCalendar)) { pickTime(startCalendar) }, LinearLayout.LayoutParams(0, dp(64), 1f).apply { leftMargin = dp(8) })
            addView(pickerBox("종료", timeText(endCalendar)) { pickTime(endCalendar) }, LinearLayout.LayoutParams(0, dp(64), 1f).apply { leftMargin = dp(8) })
        }, matchWrap().apply { topMargin = dp(8) })

        memoInput = input("메모", "필요한 내용을 적어주세요", true).apply {
            editingSchedule?.memo?.let { setText(it) }
        }
        addView(label("메모"), matchWrap().apply { topMargin = dp(18) })
        addView(memoInput, matchWrap().apply { topMargin = dp(8) })
    }

    private fun label(text: String): TextView = TextView(this).apply {
        this.text = text
        textSize = 13f
        typeface = brandBold()
        setTextColor(color("#1A1B2E"))
    }

    private fun input(title: String, hint: String, multiline: Boolean): EditText = EditText(this).apply {
        this.hint = hint
        textSize = 15f
        typeface = brandMedium()
        setTextColor(color("#1A1B2E"))
        setHintTextColor(color("#AEAEA8"))
        setPadding(dp(16), dp(12), dp(16), dp(12))
        background = roundDrawable("#F8FAFC", 16, "#EEF0F4")
        minHeight = if (multiline) dp(104) else dp(52)
        if (multiline) {
            gravity = Gravity.TOP
            minLines = 3
        } else {
            setSingleLine(true)
        }
    }

    private fun pickerBox(caption: String, value: String, action: () -> Unit): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER
        setPadding(dp(8), dp(8), dp(8), dp(8))
        background = roundDrawable("#F8FAFC", 16, "#EEF0F4")
        setOnClickListener { action() }
        addView(TextView(context).apply {
            text = caption
            textSize = 10f
            typeface = brandBold()
            gravity = Gravity.CENTER
            setTextColor(color("#8E8E93"))
        })
        addView(TextView(context).apply {
            text = value
            textSize = 13f
            typeface = brandBold()
            gravity = Gravity.CENTER
            setTextColor(color("#1A1B2E"))
        }, matchWrap().apply { topMargin = dp(4) })
    }

    private fun buildSaveButton(): TextView = TextView(this).apply {
        text = if (saving) { if (scheduleId == null) "등록 중..." else "저장 중..." } else { if (scheduleId == null) "일정 등록" else "수정 완료" }
        textSize = 16f
        typeface = brandBold()
        gravity = Gravity.CENTER
        setTextColor(Color.WHITE)
        background = gradientDrawable("#0CC9B5", "#0084CC", 999)
        minHeight = dp(52)
        alpha = if (saving) 0.7f else 1f
        setOnClickListener { if (!saving) saveSchedule() }
    }

    private fun pickDate() {
        DatePickerDialog(this, { _, year, month, day ->
            startCalendar.set(year, month, day)
            endCalendar.set(year, month, day)
            render()
        }, startCalendar.get(Calendar.YEAR), startCalendar.get(Calendar.MONTH), startCalendar.get(Calendar.DAY_OF_MONTH)).show()
    }

    private fun pickTime(target: Calendar) {
        TimePickerDialog(this, { _, hour, minute ->
            target.set(Calendar.HOUR_OF_DAY, hour)
            target.set(Calendar.MINUTE, minute)
            target.set(Calendar.SECOND, 0)
            target.set(Calendar.MILLISECOND, 0)
            if (endCalendar.timeInMillis <= startCalendar.timeInMillis) {
                endCalendar.timeInMillis = startCalendar.timeInMillis + 60L * 60L * 1000L
            }
            render()
        }, target.get(Calendar.HOUR_OF_DAY), target.get(Calendar.MINUTE), true).show()
    }

    private fun saveSchedule() {
        val title = titleInput.text?.toString()?.trim().orEmpty()
        if (title.isBlank()) {
            message = "일정 제목을 입력해 주세요."
            render()
            return
        }
        saving = true
        message = null
        render()
        Thread {
            try {
                val payload = buildPayload(title, memoInput.text?.toString()?.trim().orEmpty())
                val id = scheduleId
                if (id == null) NativeScheduleApi.create(this, payload) else NativeScheduleApi.update(this, id, payload)
                runOnUiThread {
                    saving = false
                    startActivity(Intent(this, NativeScheduleListActivity::class.java))
                    finish()
                }
            } catch (e: Exception) {
                runOnUiThread {
                    saving = false
                    message = friendlyError(e.message)
                    render()
                }
            }
        }.start()
    }

    private fun buildPayload(title: String, memo: String): JSONObject = JSONObject().apply {
        put("title", title)
        put("type", type)
        put("startTime", NativeScheduleApi.toIsoUtc(startCalendar))
        put("endTime", NativeScheduleApi.toIsoUtc(endCalendar))
        put("reminder", editingSchedule?.reminder ?: 15)
        put("repeat", editingSchedule?.repeat ?: "none")
        put("memo", memo)
        if (type == "personal") put("visibility", "private")
    }

    private fun friendlyError(code: String?): String = when (code) {
        "space_required" -> "일정을 저장할 공간을 찾을 수 없어요."
        "space_editor_required" -> "공유 일정은 공간 운영자 이상만 등록할 수 있어요."
        "title_required" -> "일정 제목을 입력해 주세요."
        "invalid_start_time" -> "시작 시간이 올바르지 않아요."
        "invalid_end_time" -> "종료 시간이 올바르지 않아요."
        else -> "일정 저장에 실패했어요. 잠시 후 다시 시도해 주세요."
    }

    private fun applyIsoToCalendar(calendar: Calendar, iso: String) {
        val parsed = runCatching { java.time.Instant.parse(iso) }.getOrNull()
        if (parsed != null) calendar.timeInMillis = parsed.toEpochMilli()
    }

    private fun dateText(): String = "${startCalendar.get(Calendar.MONTH) + 1}월 ${startCalendar.get(Calendar.DAY_OF_MONTH)}일"
    private fun timeText(calendar: Calendar): String = String.format(Locale.KOREA, "%02d:%02d", calendar.get(Calendar.HOUR_OF_DAY), calendar.get(Calendar.MINUTE))
    private fun brandMedium(): Typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
    private fun brandBold(): Typeface = Typeface.create("sans-serif", Typeface.BOLD)
    private fun color(hex: String): Int = Color.parseColor(hex)
    private fun colorWithAlpha(hex: String, alpha: Float): Int {
        val base = color(hex)
        return Color.argb((alpha * 255).toInt(), Color.red(base), Color.green(base), Color.blue(base))
    }
    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
    private fun statusBarHeight(): Int {
        val id = resources.getIdentifier("status_bar_height", "dimen", "android")
        return if (id > 0) resources.getDimensionPixelSize(id) else 0
    }
    private fun match(): Int = ViewGroup.LayoutParams.MATCH_PARENT
    private fun wrap(): Int = ViewGroup.LayoutParams.WRAP_CONTENT
    private fun matchWrap(): LinearLayout.LayoutParams = LinearLayout.LayoutParams(match(), wrap())
    private fun roundDrawable(fill: String, radius: Int, stroke: String? = null): GradientDrawable = GradientDrawable().apply {
        shape = GradientDrawable.RECTANGLE
        setColor(color(fill))
        cornerRadius = dp(radius).toFloat()
        if (stroke != null) setStroke(dp(1), color(stroke))
    }
    private fun gradientDrawable(start: String, end: String, radius: Int): GradientDrawable =
        GradientDrawable(GradientDrawable.Orientation.TL_BR, intArrayOf(color(start), color(end))).apply { cornerRadius = dp(radius).toFloat() }
}
