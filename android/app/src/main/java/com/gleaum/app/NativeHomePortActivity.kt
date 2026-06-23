package com.gleaum.app

import android.content.Intent
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
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
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL
import java.text.NumberFormat
import java.util.Locale

/**
 * Android Native Home Port preview.
 *
 * This Activity remains gated by NativePortFlags and the debug manifest. It is
 * used to compare Mobile Web Home UI with a native implementation before the
 * default WebView home is replaced.
 *
 * Source UI snapshot: docs/18-android-home-port-snapshot.md
 */
class NativeHomePortActivity : AppCompatActivity() {

    private var summary: NativeHomePortSummary? = null
    private var loading = true
    private var errorMessage: String? = null
    private var selectedDateKey: String? = null
    private var previewDisabled = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val previewAllowed = BuildConfig.DEBUG && NativePortFlags.ENABLE_NATIVE_HOME_PREVIEW
        if (!NativePortFlags.ENABLE_NATIVE_HOME && !previewAllowed) {
            previewDisabled = true
            loading = false
            errorMessage = "Native Home Preview는 debug build에서만 열 수 있어요."
            applyLightSystemBars()
            render()
            return
        }

        applyLightSystemBars()
        render()
        loadHomeSummary()
    }

    private fun applyLightSystemBars() {
        window.statusBarColor = color("#FAFAFD")
        window.navigationBarColor = color("#FAFAFD")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            var flags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                flags = flags or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
            }
            window.decorView.systemUiVisibility = flags
        }
    }

    private fun loadHomeSummary() {
        val session = SessionManager.get(this)
        if (session.isNullOrBlank()) {
            loading = false
            errorMessage = "로그인 세션을 찾을 수 없어요. 앱에서 로그인한 뒤 Preview를 다시 열어 주세요."
            render()
            return
        }

        val token = runCatching { JSONObject(session).optString("access_token") }.getOrNull()
        if (token.isNullOrBlank()) {
            loading = false
            errorMessage = "세션 토큰을 읽을 수 없어요. 다시 로그인한 뒤 확인해 주세요."
            render()
            return
        }

        Thread {
            try {
                val loaded = requestHomeSummary(token)
                runOnUiThread {
                    summary = loaded
                    selectedDateKey = loaded.selectedDate.takeIf { it.isNotBlank() }
                    loading = false
                    errorMessage = null
                    render()
                }
            } catch (e: Exception) {
                runOnUiThread {
                    loading = false
                    errorMessage = e.message ?: "홈 데이터를 불러오지 못했어요."
                    render()
                }
            }
        }.start()
    }

    private fun requestHomeSummary(token: String): NativeHomePortSummary {
        val connection = (URL(HOME_SUMMARY_URL).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 15000
            readTimeout = 20000
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("X-Gleaum-Native-Preview", "android-home")
        }

        val responseText = readResponse(connection)
        val json = if (responseText.isBlank()) JSONObject() else JSONObject(responseText)
        if (connection.responseCode !in 200..299) {
            val message = json.optString("error").ifBlank { "홈 데이터 요청 실패 (${connection.responseCode})" }
            throw IllegalStateException(message)
        }
        return NativeHomePortSummary.fromJson(json)
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }

    private fun render() {
        setContentView(buildHomeSkeleton())
    }

    private fun buildHomeSkeleton(): FrameLayout {
        return FrameLayout(this).apply {
            setBackgroundColor(color("#FAFAFD"))

            addView(ScrollView(context).apply {
                isFillViewport = true
                overScrollMode = View.OVER_SCROLL_NEVER

                addView(LinearLayout(context).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(dp(20), statusBarHeight() + dp(74), dp(20), dp(84))

                    if (loading || errorMessage != null) {
                        addView(buildStateCard(), matchWrap())
                    }
                    if (previewDisabled) return@apply
                    addView(buildGreetingCard(), matchWrap().apply { topMargin = dp(14) })
                    addView(buildTodayToggle(), matchWrap().apply { topMargin = dp(14) })
                    addView(buildWeekCalendarStrip(), matchWrap().apply { topMargin = dp(10) })
                    addView(buildSelectedDateSection(), matchWrap().apply { topMargin = dp(14) })
                    addView(buildAdPlaceholder(), matchWrap().apply { topMargin = dp(14) })
                    addView(buildBudgetSummary(), matchWrap().apply { topMargin = dp(14) })
                    addView(buildUpcomingSection(), matchWrap().apply { topMargin = dp(14) })
                }, ViewGroup.LayoutParams(match(), wrap()))
            }, FrameLayout.LayoutParams(match(), match()))

            addView(buildHeaderBar(), FrameLayout.LayoutParams(match(), statusBarHeight() + dp(64), Gravity.TOP))
            addView(buildBottomNav(), FrameLayout.LayoutParams(match(), dp(56), Gravity.BOTTOM))
        }
    }

    private fun buildHeaderBar(): FrameLayout {
        return FrameLayout(this).apply {
            setBackgroundColor(color("#FAFAFD"))
            elevation = dp(2).toFloat()

            addView(buildHeader(), FrameLayout.LayoutParams(match(), dp(44), Gravity.BOTTOM).apply {
                leftMargin = dp(20)
                rightMargin = dp(20)
                bottomMargin = dp(10)
            })

            addView(View(context).apply {
                setBackgroundColor(color("#EEF0F4"))
            }, FrameLayout.LayoutParams(match(), dp(1), Gravity.BOTTOM))
        }
    }

    private fun buildHeader(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL

                addView(ImageView(context).apply {
                    setImageResource(R.drawable.gleaum_logo_native)
                    scaleType = ImageView.ScaleType.FIT_CENTER
                    clipToOutline = true
                }, LinearLayout.LayoutParams(dp(32), dp(32)))

                addView(ImageView(context).apply {
                    setImageResource(R.drawable.gleaum_bi_native)
                    scaleType = ImageView.ScaleType.FIT_CENTER
                    adjustViewBounds = true
                }, LinearLayout.LayoutParams(dp(88), dp(24)).apply { leftMargin = dp(8) })
            }, LinearLayout.LayoutParams(0, dp(44), 1f))

            addView(FrameLayout(context).apply {
                gravity = Gravity.CENTER
                background = roundDrawable("#FFFFFF", 20, "#E8E8E4")
                setOnClickListener { openWebPath("/notifications") }
                addView(NativeBottomNavIconView(context, NativeNavIcon.BELL, color("#1A1B2E")), FrameLayout.LayoutParams(dp(20), dp(20), Gravity.CENTER))
            }, LinearLayout.LayoutParams(dp(40), dp(40)))
        }
    }

    private fun buildStateCard(): TextView {
        return TextView(this).apply {
            text = if (loading) "홈 데이터를 불러오는 중이에요." else errorMessage.orEmpty()
            textSize = 13f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setTextColor(if (loading) color("#0084CC") else color("#EF4444"))
            setPadding(dp(16), dp(14), dp(16), dp(14))
            background = roundDrawable(if (loading) "#F0FAFF" else "#FFF1F2", 18, if (loading) "#D8F0FF" else "#FECACA")
        }
    }

    private fun buildGreetingCard(): FrameLayout {
        val data = summary
        val todayCount = data?.todayCount ?: 0
        val pendingCount = data?.pendingCount ?: todayCount
        val completedCount = data?.completedCount ?: 0

        return FrameLayout(this).apply {
            background = gradientDrawable("#1A1B2E", "#2D2E4A", 28)
            elevation = dp(8).toFloat()
            clipToOutline = true

            addView(NativeGlowView(context, color("#0084CC"), 0.35f), FrameLayout.LayoutParams(dp(140), dp(140), Gravity.TOP or Gravity.RIGHT).apply {
                topMargin = -dp(30)
                rightMargin = -dp(30)
            })
            addView(NativeGlowView(context, color("#0CC9B5"), 0.25f), FrameLayout.LayoutParams(dp(100), dp(100), Gravity.BOTTOM or Gravity.LEFT).apply {
                leftMargin = -dp(20)
                bottomMargin = -dp(20)
            })

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(24), dp(28), dp(24), dp(24))

                addView(TextView(context).apply {
                    text = greetingText()
                    textSize = 13f
                    typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
                    setTextColor(colorWithAlpha("#0CC9B5", 0.90f))
                })

                addView(TextView(context).apply {
                    text = "${data?.displayName?.takeIf { it.isNotBlank() } ?: "글리움 사용자"}님"
                    textSize = 26f
                    typeface = Typeface.DEFAULT_BOLD
                    setTextColor(Color.WHITE)
                    letterSpacing = -0.02f
                }, matchWrap().apply { topMargin = dp(10) })

                addView(TextView(context).apply {
                    text = data?.activeSpaceName?.let { "${it} 공간의 일정과 소식을 확인합니다." }
                        ?: "친구·연인과 연결된 공간의 일정과 소식을 확인합니다."
                    textSize = 12f
                    typeface = Typeface.create("sans-serif", Typeface.NORMAL)
                    setTextColor(colorWithAlpha("#FFFFFF", 0.50f))
                }, matchWrap().apply { topMargin = dp(6) })

                addView(LinearLayout(context).apply {
                    orientation = LinearLayout.HORIZONTAL

                    addMetric(todayCount.toString(), "오늘 전체", Color.WHITE)
                    addMetric(completedCount.toString(), "완료", color("#2EE895"))
                    addMetric(pendingCount.toString(), "남은 일정", color("#0CC9B5"))
                }, matchWrap().apply { topMargin = dp(18) })
            }, FrameLayout.LayoutParams(match(), wrap()))
        }
    }

    private fun LinearLayout.addMetric(value: String, label: String, valueColor: Int) {
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(8), dp(12), dp(8), dp(12))
            background = roundDrawable("rgba-white-08", 16)

            addView(TextView(context).apply {
                text = value
                textSize = 24f
                typeface = Typeface.DEFAULT_BOLD
                gravity = Gravity.CENTER
                setTextColor(valueColor)
            })
            addView(TextView(context).apply {
                text = label
                textSize = 11f
                typeface = Typeface.DEFAULT_BOLD
                gravity = Gravity.CENTER
                setTextColor(colorWithAlpha("#FFFFFF", 0.54f))
            }, matchWrap().apply { topMargin = dp(4) })
        }, LinearLayout.LayoutParams(0, wrap(), 1f).apply {
            if (childCount > 0) leftMargin = dp(10)
        })
    }

    private fun buildTodayToggle(): LinearLayout {
        val selectedDate = selectedDateKey ?: summary?.selectedDate
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(20), dp(14), dp(20), dp(14))
            background = cardDrawable()
            elevation = dp(2).toFloat()

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL

                addView(NativeBottomNavIconView(context, NativeNavIcon.CALENDAR, color("#1A1B2E")), LinearLayout.LayoutParams(dp(22), dp(22)))
                addView(TextView(context).apply {
                    text = formatDateTitle(selectedDate)
                    textSize = 15f
                    typeface = Typeface.DEFAULT_BOLD
                    setTextColor(color("#1A1B2E"))
                }, LinearLayout.LayoutParams(wrap(), wrap()).apply { leftMargin = dp(10) })
            }, LinearLayout.LayoutParams(0, wrap(), 1f))

            if (selectedDate == summary?.selectedDate) {
                addView(TextView(context).apply {
                    text = "TODAY"
                    textSize = 10f
                    typeface = Typeface.DEFAULT_BOLD
                    gravity = Gravity.CENTER
                    setTextColor(Color.WHITE)
                    background = gradientDrawable("#0CC9B5", "#0084CC", 999)
                }, LinearLayout.LayoutParams(dp(58), dp(24)))
            }
        }
    }

    private fun buildWeekCalendarStrip(): LinearLayout {
        val days = summary?.calendarWeek.orEmpty()
        val selected = selectedDateKey ?: summary?.selectedDate

        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(dp(8), dp(10), dp(8), dp(10))
            background = cardDrawable(20)
            elevation = dp(2).toFloat()

            if (days.isEmpty()) {
                addView(TextView(context).apply {
                    text = "캘린더 데이터를 준비하는 중이에요"
                    textSize = 12f
                    gravity = Gravity.CENTER
                    setTextColor(color("#8E8E93"))
                }, LinearLayout.LayoutParams(match(), dp(56)))
                return@apply
            }

            days.forEachIndexed { index, day ->
                val isSelected = day.date == selected
                addView(LinearLayout(context).apply {
                    orientation = LinearLayout.VERTICAL
                    gravity = Gravity.CENTER
                    setPadding(dp(4), dp(6), dp(4), dp(6))
                    background = when {
                        isSelected -> gradientDrawable("#0CC9B5", "#0084CC", 16)
                        day.isToday -> roundDrawable("#F0FAFF", 16, "#D8F0FF")
                        else -> roundDrawable("#FFFFFF", 16)
                    }
                    setOnClickListener {
                        selectedDateKey = day.date
                        render()
                    }

                    addView(TextView(context).apply {
                        text = listOf("월", "화", "수", "목", "금", "토", "일")[index]
                        textSize = 10f
                        typeface = Typeface.DEFAULT_BOLD
                        gravity = Gravity.CENTER
                        setTextColor(if (isSelected) Color.WHITE else color("#8E8E93"))
                    })
                    addView(TextView(context).apply {
                        text = day.day.toString()
                        textSize = 16f
                        typeface = Typeface.DEFAULT_BOLD
                        gravity = Gravity.CENTER
                        setTextColor(if (isSelected) Color.WHITE else color("#1A1B2E"))
                    }, matchWrap().apply { topMargin = dp(2) })

                    addView(buildTypeDots(day, isSelected), matchWrap().apply { topMargin = dp(5) })
                }, LinearLayout.LayoutParams(0, dp(72), 1f).apply {
                    if (index > 0) leftMargin = dp(4)
                })
            }
        }
    }

    private fun buildTypeDots(day: NativeHomePortCalendarDay, selected: Boolean): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            val types = day.types.take(3)
            if (types.isEmpty()) {
                addView(View(context), LinearLayout.LayoutParams(dp(5), dp(5)))
                return@apply
            }

            types.forEachIndexed { index, type ->
                addView(View(context).apply {
                    background = roundDrawable(if (selected) "#FFFFFF" else scheduleTypeColor(type), 999)
                }, LinearLayout.LayoutParams(dp(5), dp(5)).apply {
                    if (index > 0) leftMargin = dp(3)
                })
            }
        }
    }

    private fun buildSelectedDateSection(): LinearLayout {
        val selected = selectedDateKey ?: summary?.selectedDate
        val selectedSchedules = summary?.range.orEmpty()
            .filter { scheduleDateKey(it.startTime) == selected }
            .sortedBy { it.startTime }
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL

            addView(sectionHeader("${formatDateTitle(selected)} 일정", "${selectedSchedules.size}개", "+ 새 일정", "/schedules/new"))
            if (selectedSchedules.isEmpty()) {
                addView(buildEmptyScheduleCard(), matchWrap().apply { topMargin = dp(12) })
            } else {
                selectedSchedules.take(3).forEach { schedule ->
                    addView(buildScheduleCard(schedule), matchWrap().apply { topMargin = dp(10) })
                }
            }
        }
    }

    private fun buildEmptyScheduleCard(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(20), dp(48), dp(20), dp(48))
            background = cardDrawable(24)
            elevation = dp(2).toFloat()

            addView(FrameLayout(context).apply {
                background = roundDrawable("#F0FAFF", 28)
                addView(NativeBottomNavIconView(context, NativeNavIcon.CALENDAR, color("#0084CC")), FrameLayout.LayoutParams(dp(26), dp(26), Gravity.CENTER))
            }, LinearLayout.LayoutParams(dp(56), dp(56)))

            addView(TextView(context).apply {
                text = "등록된 일정이 없어요"
                textSize = 14f
                typeface = Typeface.DEFAULT_BOLD
                gravity = Gravity.CENTER
                setTextColor(color("#1A1B2E"))
            }, matchWrap().apply { topMargin = dp(18) })

            addView(TextView(context).apply {
                text = "오른쪽 위 새 일정 버튼으로 바로 추가할 수 있어요"
                textSize = 12f
                gravity = Gravity.CENTER
                setTextColor(color("#8E8E93"))
            }, matchWrap().apply { topMargin = dp(6) })
        }
    }

    private fun buildScheduleCard(schedule: NativeHomePortSchedule): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(16), dp(14), dp(16), dp(14))
            background = cardDrawable(20)
            elevation = dp(2).toFloat()
            setOnClickListener {
                if (schedule.id.isNotBlank()) openWebPath("/schedules/${schedule.id}")
            }

            addView(TextView(context).apply {
                text = timeText(schedule.startTime)
                textSize = 13f
                typeface = Typeface.DEFAULT_BOLD
                gravity = Gravity.CENTER
                setTextColor(color("#0084CC"))
                background = roundDrawable("#F0FAFF", 14)
            }, LinearLayout.LayoutParams(dp(68), dp(54)))

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                addView(TextView(context).apply {
                    text = schedule.title
                    textSize = 15f
                    typeface = Typeface.DEFAULT_BOLD
                    setTextColor(color("#1A1B2E"))
                })
                addView(TextView(context).apply {
                    text = scheduleSubtitle(schedule)
                    textSize = 12f
                    setTextColor(color("#8E8E93"))
                }, matchWrap().apply { topMargin = dp(4) })
            }, LinearLayout.LayoutParams(0, wrap(), 1f).apply { leftMargin = dp(12) })
        }
    }

    private fun buildAdPlaceholder(): TextView {
        return TextView(this).apply {
            text = "AD"
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setTextColor(color("#8E8E93"))
            background = roundDrawable("#F2F4F7", 12)
            elevation = dp(1).toFloat()
        }.also {
            it.minHeight = dp(60)
        }
    }

    private fun buildBudgetSummary(): LinearLayout {
        val data = summary
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(20), dp(20), dp(18))
            background = cardDrawable(24)
            elevation = dp(2).toFloat()
            setOnClickListener { openWebPath("/budget") }

            addView(TextView(context).apply {
                text = "MONEY FLOW"
                textSize = 11f
                typeface = Typeface.DEFAULT_BOLD
                letterSpacing = 0.08f
                setTextColor(color("#0CC9B5"))
            })

            addView(TextView(context).apply {
                text = "이번 달 개인 가계부"
                textSize = 18f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(color("#1A1B2E"))
            }, matchWrap().apply { topMargin = dp(8) })

            addView(TextView(context).apply {
                text = if (data == null) {
                    "지출 기록과 고정 지출 예정 흐름을 확인하세요."
                } else {
                    "수입 ${money(data.incomeTotal)} · 지출 ${money(data.expenseTotal)} · 순흐름 ${money(data.net)}"
                }
                textSize = 12f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(color("#8E8E93"))
            }, matchWrap().apply { topMargin = dp(4) })
        }
    }

    private fun buildUpcomingSection(): LinearLayout {
        val upcoming = summary?.upcoming.orEmpty()
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(sectionHeader("다가오는 일정", "${summary?.upcomingCount ?: 0}개", null))
            if (upcoming.isEmpty()) {
                addView(TextView(context).apply {
                    text = "앞으로 예정된 일정이 없어요"
                    textSize = 13f
                    gravity = Gravity.CENTER
                    setTextColor(color("#8E8E93"))
                    background = cardDrawable(20)
                    setPadding(dp(20), dp(28), dp(20), dp(28))
                }, matchWrap().apply { topMargin = dp(12) })
            } else {
                upcoming.take(3).forEach { schedule ->
                    addView(buildScheduleCard(schedule), matchWrap().apply { topMargin = dp(10) })
                }
            }
        }
    }

    private fun sectionHeader(title: String, count: String, action: String?, actionPath: String? = null): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL

            addView(TextView(context).apply {
                text = title
                textSize = 18f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(color("#1A1B2E"))
            })

            addView(TextView(context).apply {
                text = count
                textSize = 13f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(color("#0084CC"))
                gravity = Gravity.CENTER_VERTICAL
            }, LinearLayout.LayoutParams(0, wrap(), 1f).apply { leftMargin = dp(8) })

            if (action != null) {
                addView(TextView(context).apply {
                    text = action
                    textSize = 12f
                    typeface = Typeface.DEFAULT_BOLD
                    gravity = Gravity.CENTER
                    setTextColor(Color.WHITE)
                    background = gradientDrawable("#0CC9B5", "#0084CC", 999)
                    if (actionPath != null) setOnClickListener { openWebPath(actionPath) }
                }, LinearLayout.LayoutParams(dp(84), dp(32)))
            }
        }
    }

    private fun buildBottomNav(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(dp(0), dp(0), dp(0), dp(0))
            background = roundDrawable("#FFFFFF", 0, "#E8E8E4")

            listOf(
                NativeNavItem("홈", NativeNavIcon.HOME, "/home"),
                NativeNavItem("일정", NativeNavIcon.CALENDAR, "/schedules"),
                NativeNavItem("공간", NativeNavIcon.SPACE, "/space"),
                NativeNavItem("가계부", NativeNavIcon.BUDGET, "/budget"),
                NativeNavItem("전체", NativeNavIcon.MENU, "/mypage"),
            ).forEachIndexed { index, item ->
                addView(buildBottomNavItem(item, active = index == 0), LinearLayout.LayoutParams(0, match(), 1f))
            }
        }
    }

    private fun buildBottomNavItem(item: NativeNavItem, active: Boolean): LinearLayout {
        val activeColor = color("#0084CC")
        val inactiveColor = color("#8E8E93")

        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(4), dp(0), dp(4), dp(0))
            setOnClickListener { openWebPath(item.path) }

            addView(View(context).apply {
                background = if (active) roundDrawable("#0084CC", 999) else null
            }, LinearLayout.LayoutParams(dp(28), dp(3)).apply { bottomMargin = dp(5) })

            addView(NativeBottomNavIconView(context, item.icon, if (active) activeColor else inactiveColor), LinearLayout.LayoutParams(dp(20), dp(20)))

            addView(TextView(context).apply {
                text = item.label
                textSize = 10f
                typeface = Typeface.create("sans-serif", if (active) Typeface.BOLD else Typeface.NORMAL)
                gravity = Gravity.CENTER
                includeFontPadding = false
                setTextColor(if (active) activeColor else inactiveColor)
            }, matchWrap().apply { topMargin = dp(3) })
        }
    }

    private fun openWebPath(path: String) {
        startActivity(Intent(this, MainActivity::class.java).apply {
            putExtra("start_path", path)
        })
        finish()
    }

    private fun scheduleSubtitle(schedule: NativeHomePortSchedule): String {
        val typeLabel = when (schedule.type) {
            "shared" -> "공유일정"
            "child" -> "자녀일정"
            "expense" -> "지출"
            else -> "개인일정"
        }
        return "$typeLabel · ${timeText(schedule.startTime)}"
    }

    private fun scheduleDateKey(raw: String): String = raw.take(10)

    private fun formatDateTitle(dateKey: String?): String {
        if (dateKey.isNullOrBlank() || dateKey.length < 10) return "오늘"
        val parts = dateKey.split("-")
        if (parts.size != 3) return "오늘"
        return "${parts[1].toIntOrNull() ?: parts[1]}월 ${parts[2].toIntOrNull() ?: parts[2]}일"
    }

    private fun scheduleTypeColor(type: String): String = when (type) {
        "shared" -> "#0084CC"
        "child" -> "#2EE895"
        "expense" -> "#F59E0B"
        else -> "#0CC9B5"
    }

    private fun timeText(raw: String): String {
        val tIndex = raw.indexOf('T')
        return if (tIndex >= 0 && raw.length >= tIndex + 6) raw.substring(tIndex + 1, tIndex + 6) else raw.take(5)
    }

    private fun greetingText(): String {
        val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
        return when (hour) {
            in 5..10 -> "좋은 아침이에요"
            in 11..16 -> "좋은 오후예요"
            else -> "좋은 저녁이에요"
        }
    }

    private fun money(value: Long): String = NumberFormat.getNumberInstance(Locale.KOREA).format(value) + "원"

    private fun cardDrawable(radius: Int = 20): GradientDrawable =
        roundDrawable("#FFFFFF", radius, "#EEF0F4")

    private fun roundDrawable(fill: String, radius: Int, stroke: String? = null): GradientDrawable {
        val fillColor = if (fill == "rgba-white-08") Color.argb(20, 255, 255, 255) else color(fill)
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setColor(fillColor)
            cornerRadius = dp(radius).toFloat()
            if (stroke != null) setStroke(dp(1), color(stroke))
        }
    }

    private fun gradientDrawable(start: String, end: String, radius: Int): GradientDrawable =
        GradientDrawable(GradientDrawable.Orientation.TL_BR, intArrayOf(color(start), color(end))).apply {
            cornerRadius = dp(radius).toFloat()
        }

    private fun color(hex: String): Int = Color.parseColor(hex)

    private fun colorWithAlpha(hex: String, alpha: Float): Int {
        val base = color(hex)
        return Color.argb(
            (alpha * 255).toInt(),
            Color.red(base),
            Color.green(base),
            Color.blue(base)
        )
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
    private fun statusBarHeight(): Int {
        val id = resources.getIdentifier("status_bar_height", "dimen", "android")
        return if (id > 0) resources.getDimensionPixelSize(id) else 0
    }
    private fun match(): Int = ViewGroup.LayoutParams.MATCH_PARENT
    private fun wrap(): Int = ViewGroup.LayoutParams.WRAP_CONTENT
    private fun matchWrap(): LinearLayout.LayoutParams = LinearLayout.LayoutParams(match(), wrap())

    companion object {
        private const val HOME_SUMMARY_URL = "https://www.gleaum.com/api/native/home-summary"
    }
}

private class NativeGlowView(
    context: Context,
    private val glowColor: Int,
    private val glowAlpha: Float,
) : View(context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val radius = width.coerceAtLeast(height) / 2f
        paint.shader = RadialGradient(
            width / 2f,
            height / 2f,
            radius,
            intArrayOf(
                Color.argb((255 * glowAlpha).toInt(), Color.red(glowColor), Color.green(glowColor), Color.blue(glowColor)),
                Color.TRANSPARENT,
            ),
            floatArrayOf(0f, 1f),
            Shader.TileMode.CLAMP,
        )
        canvas.drawCircle(width / 2f, height / 2f, radius, paint)
    }
}

private data class NativeNavItem(
    val label: String,
    val icon: NativeNavIcon,
    val path: String,
)

private enum class NativeNavIcon {
    HOME,
    CALENDAR,
    SPACE,
    BUDGET,
    MENU,
    BELL,
}

private class NativeBottomNavIconView(
    context: Context,
    private val icon: NativeNavIcon,
    private val iconColor: Int,
) : View(context) {

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = iconColor
        style = Paint.Style.STROKE
        strokeWidth = 2.2f * resources.displayMetrics.density
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val w = width.toFloat()
        val h = height.toFloat()
        val left = w * 0.16f
        val right = w * 0.84f
        val top = h * 0.14f
        val bottom = h * 0.86f
        val midX = w / 2f
        val midY = h / 2f

        when (icon) {
            NativeNavIcon.HOME -> drawHome(canvas, left, right, top, bottom, midX)
            NativeNavIcon.CALENDAR -> drawCalendar(canvas, left, right, top, bottom, w, h)
            NativeNavIcon.SPACE -> drawSpace(canvas, left, right, top, bottom, midX, midY)
            NativeNavIcon.BUDGET -> drawBudget(canvas, left, right, top, bottom)
            NativeNavIcon.MENU -> drawMenu(canvas, w, h)
            NativeNavIcon.BELL -> drawBell(canvas, w, h, midX)
        }
    }

    private fun drawHome(canvas: Canvas, left: Float, right: Float, top: Float, bottom: Float, midX: Float) {
        val path = Path().apply {
            moveTo(left, bottom * 0.58f)
            lineTo(midX, top)
            lineTo(right, bottom * 0.58f)
            lineTo(right, bottom)
            lineTo(left, bottom)
            close()
        }
        canvas.drawPath(path, paint)
        canvas.drawLine(midX - width * 0.11f, bottom, midX - width * 0.11f, bottom * 0.70f, paint)
        canvas.drawLine(midX + width * 0.11f, bottom, midX + width * 0.11f, bottom * 0.70f, paint)
    }

    private fun drawCalendar(canvas: Canvas, left: Float, right: Float, top: Float, bottom: Float, w: Float, h: Float) {
        val rect = RectF(left, top + h * 0.06f, right, bottom)
        canvas.drawRoundRect(rect, w * 0.08f, w * 0.08f, paint)
        canvas.drawLine(left, top + h * 0.30f, right, top + h * 0.30f, paint)
        canvas.drawLine(left + w * 0.17f, top, left + w * 0.17f, top + h * 0.16f, paint)
        canvas.drawLine(right - w * 0.17f, top, right - w * 0.17f, top + h * 0.16f, paint)
    }

    private fun drawSpace(canvas: Canvas, left: Float, right: Float, top: Float, bottom: Float, midX: Float, midY: Float) {
        canvas.drawCircle(midX - width * 0.13f, top + height * 0.24f, width * 0.15f, paint)
        canvas.drawArc(RectF(left, midY * 1.04f, midX + width * 0.13f, bottom), 202f, 136f, false, paint)
        canvas.drawCircle(midX + width * 0.25f, top + height * 0.32f, width * 0.12f, paint)
        canvas.drawArc(RectF(midX + width * 0.06f, midY * 1.08f, right + width * 0.08f, bottom), 214f, 96f, false, paint)
    }

    private fun drawBudget(canvas: Canvas, left: Float, right: Float, top: Float, bottom: Float) {
        val rect = RectF(left, top + height * 0.12f, right, bottom - height * 0.08f)
        canvas.drawRoundRect(rect, width * 0.08f, width * 0.08f, paint)
        canvas.drawLine(left, top + height * 0.40f, right, top + height * 0.40f, paint)
    }

    private fun drawMenu(canvas: Canvas, w: Float, h: Float) {
        canvas.drawLine(w * 0.18f, h * 0.30f, w * 0.82f, h * 0.30f, paint)
        canvas.drawLine(w * 0.18f, h * 0.50f, w * 0.82f, h * 0.50f, paint)
        canvas.drawLine(w * 0.18f, h * 0.70f, w * 0.82f, h * 0.70f, paint)
    }

    private fun drawBell(canvas: Canvas, w: Float, h: Float, midX: Float) {
        val bell = Path().apply {
            moveTo(w * 0.72f, h * 0.72f)
            lineTo(w * 0.28f, h * 0.72f)
            cubicTo(w * 0.34f, h * 0.62f, w * 0.36f, h * 0.50f, w * 0.36f, h * 0.38f)
            cubicTo(w * 0.36f, h * 0.18f, w * 0.64f, h * 0.18f, w * 0.64f, h * 0.38f)
            cubicTo(w * 0.64f, h * 0.50f, w * 0.66f, h * 0.62f, w * 0.72f, h * 0.72f)
        }
        canvas.drawPath(bell, paint)
        canvas.drawArc(RectF(w * 0.42f, h * 0.72f, w * 0.58f, h * 0.88f), 18f, 144f, false, paint)
    }
}
