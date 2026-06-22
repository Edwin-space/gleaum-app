package com.gleaum.app

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

/**
 * Disabled Android Native Home Port skeleton.
 *
 * This Activity intentionally remains gated by NativePortFlags.ENABLE_NATIVE_HOME.
 * It is a visual parity scaffold for porting Mobile Web Home UI into Android
 * native views without affecting the default WebView runtime.
 *
 * Source UI snapshot: docs/18-android-home-port-snapshot.md
 */
class NativeHomePortActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val previewAllowed = BuildConfig.DEBUG && NativePortFlags.ENABLE_NATIVE_HOME_PREVIEW
        if (!NativePortFlags.ENABLE_NATIVE_HOME && !previewAllowed) {
            finish()
            return
        }

        window.statusBarColor = color("#FAFAFD")
        window.navigationBarColor = color("#FAFAFD")
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
            }, LinearLayout.LayoutParams(dp(48), dp(40)))
        }
    }

    private fun buildGreetingCard(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(28), dp(24), dp(24))
            background = gradientDrawable("#1A1B2E", "#2D2E4A", 28)

            addView(TextView(context).apply {
                text = "좋은 오후예요"
                textSize = 13f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(color("#0CC9B5"))
            })

            addView(TextView(context).apply {
                text = "글리움 사용자님"
                textSize = 26f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(Color.WHITE)
                letterSpacing = -0.02f
            }, matchWrap().apply { topMargin = dp(10) })

            addView(TextView(context).apply {
                text = "친구·연인과 연결된 공간의 일정과 소식을 확인합니다."
                textSize = 12f
                setTextColor(colorWithAlpha("#FFFFFF", 0.50f))
            }, matchWrap().apply { topMargin = dp(6) })

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL

                addMetric("0", "오늘 전체", Color.WHITE)
                addMetric("0", "완료", color("#2EE895"))
                addMetric("0", "남은 일정", color("#0CC9B5"))
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
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL

            addView(sectionHeader("오늘 일정", "0개", "+ 새 일정"))
            addView(LinearLayout(context).apply {
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
            }, matchWrap().apply { topMargin = dp(12) })
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
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(20), dp(20), dp(18))
            background = cardDrawable(24)

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
                text = "지출 기록과 고정 지출 예정 흐름을 확인하세요."
                textSize = 12f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(color("#8E8E93"))
            }, matchWrap().apply { topMargin = dp(4) })
        }
    }

    private fun buildUpcomingSection(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(sectionHeader("다가오는 일정", "0개", null))
            addView(TextView(context).apply {
                text = "앞으로 예정된 일정이 없어요"
                textSize = 13f
                gravity = Gravity.CENTER
                setTextColor(color("#8E8E93"))
                background = cardDrawable(20)
                setPadding(dp(20), dp(28), dp(20), dp(28))
            }, matchWrap().apply { topMargin = dp(12) })
        }
    }

    private fun sectionHeader(title: String, count: String, action: String?): LinearLayout {
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

            listOf("홈", "일정", "공간", "가계부", "마이").forEachIndexed { index, label ->
                addView(TextView(context).apply {
                    text = label
                    textSize = 11f
                    typeface = Typeface.DEFAULT_BOLD
                    gravity = Gravity.CENTER
                    setTextColor(if (index == 0) color("#0084CC") else color("#8E8E93"))
                }, LinearLayout.LayoutParams(0, match(), 1f))
            }
        }
    }

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
}
