package com.gleaum.app

import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val previewAllowed = BuildConfig.DEBUG && NativePortFlags.ENABLE_NATIVE_HOME_PREVIEW
        if (!NativePortFlags.ENABLE_NATIVE_HOME && !previewAllowed) {
            finish()
            return
        }

        window.statusBarColor = color("#FAFAFD")
        window.navigationBarColor = color("#FAFAFD")
        render()
        loadHomeSummary()
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
                    setPadding(dp(20), dp(16), dp(20), dp(104))

                    addView(buildHeader())
                    if (loading || errorMessage != null) {
                        addView(buildStateCard(), matchWrap().apply { topMargin = dp(14) })
                    }
                    addView(buildGreetingCard(), matchWrap().apply { topMargin = dp(14) })
                    addView(buildTodayToggle(), matchWrap().apply { topMargin = dp(14) })
                    addView(buildSelectedDateSection(), matchWrap().apply { topMargin = dp(14) })
                    addView(buildAdPlaceholder(), matchWrap().apply { topMargin = dp(14) })
                    addView(buildBudgetSummary(), matchWrap().apply { topMargin = dp(14) })
                    addView(buildUpcomingSection(), matchWrap().apply { topMargin = dp(14) })
                }, ViewGroup.LayoutParams(match(), wrap()))
            }, FrameLayout.LayoutParams(match(), match()))

            addView(buildBottomNav(), FrameLayout.LayoutParams(match(), dp(76), Gravity.BOTTOM))
        }
    }

    private fun buildHeader(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL

            addView(TextView(context).apply {
                text = "gleaum"
                textSize = 23f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(color("#1A1B2E"))
                letterSpacing = -0.03f
            }, LinearLayout.LayoutParams(0, dp(44), 1f))

            addView(TextView(context).apply {
                text = "알림"
                textSize = 12f
                typeface = Typeface.DEFAULT_BOLD
                gravity = Gravity.CENTER
                setTextColor(color("#0084CC"))
                background = roundDrawable("#FFFFFF", 20, "#E8E8E4")
                setOnClickListener { openWebPath("/notifications") }
            }, LinearLayout.LayoutParams(dp(48), dp(40)))
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

    private fun buildGreetingCard(): LinearLayout {
        val data = summary
        val todayCount = data?.todayCount ?: 0
        val pendingCount = data?.pendingCount ?: todayCount
        val completedCount = data?.completedCount ?: 0

        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(28), dp(24), dp(24))
            background = gradientDrawable("#1A1B2E", "#2D2E4A", 28)

            addView(TextView(context).apply {
                text = greetingText()
                textSize = 13f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(color("#0CC9B5"))
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
                setTextColor(colorWithAlpha("#FFFFFF", 0.50f))
            }, matchWrap().apply { topMargin = dp(6) })

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL

                addMetric(todayCount.toString(), "오늘 전체", Color.WHITE)
                addMetric(completedCount.toString(), "완료", color("#2EE895"))
                addMetric(pendingCount.toString(), "남은 일정", color("#0CC9B5"))
            }, matchWrap().apply { topMargin = dp(18) })
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
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(20), dp(14), dp(20), dp(14))
            background = cardDrawable()

            addView(TextView(context).apply {
                text = "▣  오늘"
                textSize = 15f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(color("#1A1B2E"))
            }, LinearLayout.LayoutParams(0, wrap(), 1f))

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

    private fun buildSelectedDateSection(): LinearLayout {
        val today = summary?.today.orEmpty()
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL

            addView(sectionHeader("오늘 일정", "${summary?.todayCount ?: 0}개", "+ 새 일정", "/schedules/new"))
            if (today.isEmpty()) {
                addView(buildEmptyScheduleCard(), matchWrap().apply { topMargin = dp(12) })
            } else {
                today.take(3).forEach { schedule ->
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

            addView(TextView(context).apply {
                text = "▣"
                textSize = 26f
                gravity = Gravity.CENTER
                setTextColor(color("#0084CC"))
                background = roundDrawable("#F0FAFF", 28)
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
            setPadding(dp(16), dp(8), dp(16), dp(10))
            background = roundDrawable("#FFFFFF", 0, "#E8E8E4")

            listOf(
                "홈" to "/home",
                "일정" to "/schedules",
                "공간" to "/space",
                "가계부" to "/budget",
                "마이" to "/mypage",
            ).forEachIndexed { index, (label, path) ->
                addView(TextView(context).apply {
                    text = label
                    textSize = 11f
                    typeface = Typeface.DEFAULT_BOLD
                    gravity = Gravity.CENTER
                    setTextColor(if (index == 0) color("#0084CC") else color("#8E8E93"))
                    setOnClickListener { openWebPath(path) }
                }, LinearLayout.LayoutParams(0, match(), 1f))
            }
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
    private fun match(): Int = ViewGroup.LayoutParams.MATCH_PARENT
    private fun wrap(): Int = ViewGroup.LayoutParams.WRAP_CONTENT
    private fun matchWrap(): LinearLayout.LayoutParams = LinearLayout.LayoutParams(match(), wrap())

    companion object {
        private const val HOME_SUMMARY_URL = "https://www.gleaum.com/api/native/home-summary"
    }
}
