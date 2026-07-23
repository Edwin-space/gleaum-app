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
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import com.kakao.adfit.ads.popup.AdFitPopupAd
import com.kakao.adfit.ads.popup.AdFitPopupAdDialogFragment
import com.kakao.adfit.ads.popup.AdFitPopupAdLoader
import com.kakao.adfit.ads.popup.AdFitPopupAdRequest
import com.gleaum.app.ui.components.GleaumDestination
import com.gleaum.app.ui.components.GleaumScaffold
import com.gleaum.app.ui.screens.home.ComposeHomeScreen
import com.gleaum.app.ui.theme.GleaumTheme
import org.json.JSONObject
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
    private var calendarExpanded = true
    private var calendarMode = CalendarMode.WEEK
    private var popupAdLoader: AdFitPopupAdLoader? = null
    private var popupAdRequested = false

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
        calendarExpanded = normalizedHomeLayout() == "calendar_first"
        render()
        loadHomeSummary()
    }

    private fun applyLightSystemBars() {
        NativeTheme.applySystemBars(window, this)
    }

    override fun onResume() {
        super.onResume()
        applyLightSystemBars()
        if (!loading && summary != null && NativeAppDataCache.home == null) {
            loadHomeSummary(force = true)
        }
    }

    private fun loadHomeSummary(force: Boolean = false) {
        if (!force) {
            NativeAppDataCache.home?.let {
                applyHomeSummary(it)
                return
            }
        }
        val session = SessionManager.get(this)
        if (session.isNullOrBlank()) {
            redirectToLogin()
            return
        }

        val token = runCatching { JSONObject(session).optString("access_token") }.getOrNull()
        if (token.isNullOrBlank()) {
            redirectToLogin()
            return
        }

        Thread {
            try {
                val loaded = NativeHomeApi.summary(this)
                runOnUiThread {
                    NativeAppDataCache.home = loaded
                    applyHomeSummary(loaded)
                }
            } catch (e: Exception) {
                runOnUiThread {
                    if (e.message == "session_required") {
                        redirectToLogin()
                    } else {
                        loading = false
                        errorMessage = e.message ?: "홈 데이터를 불러오지 못했어요."
                        render()
                    }
                }
            }
        }.start()
    }

    private fun applyHomeSummary(loaded: NativeHomePortSummary) {
        if (!loaded.onboardingCompleted) {
            startActivity(Intent(this, NativeOnboardingActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            })
            finish()
            return
        }
        NativeAccountContextStore.save(this, loaded.account)
        (application as? GleaumApp)?.syncAdvertisingEligibility()
        summary = loaded
        selectedDateKey = loaded.selectedDate.takeIf { it.isNotBlank() }
        loading = false
        errorMessage = null
        render()
        maybeShowLaunchBottomAd()
    }

    private fun redirectToLogin() {
        SessionManager.clear(this)
        startActivity(Intent(this, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        })
        finish()
    }

    private fun normalizedHomeLayout(): String {
        val stored = getSharedPreferences(CAPACITOR_PREFS_NAME, Context.MODE_PRIVATE)
            .getString(HOME_LAYOUT_KEY, "balanced")
        return when (stored) {
            "schedule_first" -> "calendar_first"
            "budget_first" -> "expense_first"
            "calendar_first", "routine_first", "expense_first", "space_first" -> stored
            else -> "balanced"
        }
    }

    private fun homeLayoutCopy(): String = if (isManagedAccount()) {
        "오늘 할 일과 가까운 일정을 하나씩 확인해 보세요."
    } else when (normalizedHomeLayout()) {
        "calendar_first" -> "가장 가까운 약속과 캘린더 흐름을 우선으로 보여드립니다."
        "routine_first" -> "반복되는 습관과 완료 확인이 필요한 일을 놓치지 않게 도와드립니다."
        "expense_first" -> "정기결제와 공동비용 알림을 중심으로 홈을 구성합니다."
        "space_first" -> "친구·연인과 연결된 공간의 일정과 소식을 우선합니다."
        else -> "일정, 루틴, 자금, Space를 한 화면에서 확인하세요."
    }

    private fun render() {
        if (NativePortFlags.ENABLE_COMPOSE_HOME) {
            renderComposeHome()
            return
        }
        setContentView(buildHomeSkeleton())
    }

    @OptIn(ExperimentalMaterial3Api::class)
    private fun renderComposeHome() {
        setContent {
            GleaumTheme {
                GleaumScaffold(
                    title = "gleaum",
                    selectedDestination = GleaumDestination.HOME,
                    onDestinationSelected = ::handleComposeDestination,
                    onNotificationClick = { openWebPath("/notifications") },
                    onFabClick = { openWebPath("/schedules/new") },
                ) { innerPadding ->
                    PullToRefreshBox(
                        isRefreshing = loading && summary != null,
                        onRefresh = {
                            loading = true
                            errorMessage = null
                            render()
                            loadHomeSummary(force = true)
                        },
                    ) {
                        ComposeHomeScreen(
                            innerPadding = innerPadding,
                            summary = summary,
                            loading = loading,
                            errorMessage = errorMessage,
                            selectedDateKey = selectedDateKey,
                            onRetry = {
                                loading = true
                                errorMessage = null
                                render()
                                loadHomeSummary(force = true)
                            },
                            onSelectDate = { date ->
                                selectedDateKey = date
                                render()
                            },
                            onAddSchedule = { openWebPath("/schedules/new") },
                            onOpenSchedule = { id -> openWebPath("/schedules/$id") },
                            onOpenSchedules = { openWebPath("/schedules") },
                            onOpenBudget = { openWebPath("/budget") },
                        )
                    }
                }
            }
        }
    }

    private fun maybeShowLaunchBottomAd() {
        if (summary?.account?.capabilities?.canShowAds != true) {
            Log.d(TAG, "AdFit launch popup skipped: accountMode=${summary?.account?.accountMode}, canShowAds=false")
            return
        }
        if (popupAdRequested || isFinishing || isDestroyed) {
            Log.d(TAG, "AdFit launch popup skipped: requested=$popupAdRequested, finishing=$isFinishing, destroyed=$isDestroyed")
            return
        }
        popupAdRequested = true
        Log.d(TAG, "AdFit launch popup request scheduled")

        Handler(Looper.getMainLooper()).postDelayed({
            if (isFinishing || isDestroyed || !NativeAccountContextStore.capabilities(this).canShowAds) return@postDelayed

            val loader = AdFitPopupAdLoader.create(this, HOME_BOTTOM_ADFIT_CLIENT_ID)
            popupAdLoader = loader

            if (loader.isBlockedByRequestPolicy) {
                Log.d(TAG, "AdFit launch popup blocked by request policy")
                return@postDelayed
            }

            val request = AdFitPopupAdRequest.Builder(AdFitPopupAd.Type.Transition)
                .setTestModeEnabled(BuildConfig.DEBUG)
                .build()

            val requested = loader.loadAd(
                request,
                object : AdFitPopupAdLoader.OnAdLoadListener {
                    override fun onAdLoaded(ad: AdFitPopupAd) {
                        if (isFinishing || isDestroyed || !NativeAccountContextStore.capabilities(this@NativeHomePortActivity).canShowAds) {
                            popupAdLoader?.destroy()
                            popupAdLoader = null
                            return
                        }
                        Log.d(TAG, "AdFit launch popup loaded")
                        runOnUiThread {
                            runCatching {
                                AdFitPopupAdDialogFragment.Builder(ad)
                                    .setNavigationBarColor(NativeTheme.background(this@NativeHomePortActivity), !NativeTheme.isDark(this@NativeHomePortActivity))
                                    .build()
                                    .show(supportFragmentManager, AdFitPopupAdDialogFragment.TAG)
                            }.onFailure {
                                Log.w(TAG, "AdFit launch popup show failed", it)
                            }
                        }
                    }

                    override fun onAdLoadError(errorCode: Int) {
                        Log.w(TAG, "AdFit launch popup failed: $errorCode")
                    }
                },
            )

            if (!requested) {
                Log.w(TAG, "AdFit launch popup request rejected")
            }
        }, 500L)
    }

    override fun onDestroy() {
        popupAdLoader?.destroy()
        popupAdLoader = null
        super.onDestroy()
    }

    private fun handleComposeDestination(destination: GleaumDestination) {
        when (destination) {
            GleaumDestination.HOME -> openWebPath("/home")
            GleaumDestination.SCHEDULES -> openWebPath("/schedules")
            GleaumDestination.SPACE -> openWebPath("/space")
            GleaumDestination.BUDGET -> if (summary?.account?.capabilities?.canViewHouseholdBudget == true) {
                openWebPath("/budget")
            }
            GleaumDestination.MENU -> openWebPath("/mypage")
        }
    }

    private fun buildHomeSkeleton(): FrameLayout {
        return FrameLayout(this).apply {
            setBackgroundColor(color("#FAFAFD"))

            addView(ScrollView(context).apply {
                isFillViewport = true
                overScrollMode = View.OVER_SCROLL_NEVER

                addView(LinearLayout(context).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(dp(NativeAdaptive.pagePaddingDp(this@NativeHomePortActivity)), statusBarHeight() + dp(74), dp(NativeAdaptive.pagePaddingDp(this@NativeHomePortActivity)), dp(if (NativeAdaptive.isLarge(this@NativeHomePortActivity)) 104 else 84))

                    if (errorMessage != null) {
                        addView(buildStateCard(), matchWrap())
                    } else if (loading) {
                        addView(buildLoadingSkeleton(), matchWrap())
                    }
                    if (previewDisabled) return@apply
                    addView(buildGreetingCard(), matchWrap().apply { topMargin = dp(14) })
                    if (isManagedAccount()) {
                        addView(buildManagedAccountCard(), matchWrap().apply { topMargin = dp(14) })
                    }
                    addView(buildTodayToggle(), matchWrap().apply { topMargin = dp(14) })
                    if (calendarExpanded) {
                        addView(buildCalendarPanel(), matchWrap().apply { topMargin = dp(10) })
                    }
                    addView(buildSelectedDateSection(), matchWrap().apply { topMargin = dp(14) })
                    if (summary?.account?.capabilities?.canShowAds == true) {
                        addView(buildAdPlaceholder(), matchWrap().apply { topMargin = dp(14) })
                    }
                    if (summary?.account?.capabilities?.canViewHouseholdBudget == true) {
                        addView(buildBudgetSummary(), matchWrap().apply { topMargin = dp(14) })
                    }
                    addView(buildUpcomingSection(), matchWrap().apply { topMargin = dp(14) })
                }, NativeAdaptive.scrollChildParams(this@NativeHomePortActivity))
            }, FrameLayout.LayoutParams(match(), match()))

            addView(buildHeaderBar(), FrameLayout.LayoutParams(match(), statusBarHeight() + dp(64), Gravity.TOP))
            addView(NativeBottomNav.create(this@NativeHomePortActivity, NativeBottomDestination.HOME), NativeAdaptive.bottomNavParams(this@NativeHomePortActivity, dp(if (NativeAdaptive.isLarge(this@NativeHomePortActivity)) 64 else 56)))
        }
    }

    private fun buildHeaderBar(): FrameLayout {
        return FrameLayout(this).apply {
            setBackgroundColor(color("#FAFAFD"))
            elevation = dp(2).toFloat()

            addView(buildHeader(), NativeAdaptive.headerContentParams(this@NativeHomePortActivity, dp(44), dp(20), dp(10)))

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
                setOnClickListener {
                    startActivity(Intent(this@NativeHomePortActivity, NativeNotificationActivity::class.java))
                }
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

    private fun buildLoadingSkeleton(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(18), dp(20), dp(18))
            background = cardDrawable(22)
            elevation = dp(2).toFloat()

            addView(TextView(context).apply {
                text = "홈을 준비하고 있어요"
                textSize = 14f
                typeface = brandBold()
                setTextColor(color("#0084CC"))
            })

            addView(TextView(context).apply {
                text = "일정, 캘린더, 가계부 흐름을 불러오는 중입니다."
                textSize = 12f
                typeface = brandMedium()
                setTextColor(NativeTheme.muted(context))
            }, matchWrap().apply { topMargin = dp(6) })

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                repeat(3) { index ->
                    addView(View(context).apply {
                        background = shimmerDrawable(index)
                    }, LinearLayout.LayoutParams(0, dp(42), 1f).apply {
                        if (index > 0) leftMargin = dp(8)
                    })
                }
            }, matchWrap().apply { topMargin = dp(16) })
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
                    text = homeLayoutCopy()
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

    private fun buildManagedAccountCard(): LinearLayout {
        val pendingConsent = summary?.account?.accountMode in setOf("pending_guardian_consent", "teen_consent_pending")
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(20), dp(20), dp(20))
            background = cardDrawable(24)
            elevation = dp(2).toFloat()

            addView(TextView(context).apply {
                text = if (pendingConsent) "동의 확인 필요" else "보호자 관리 계정"
                textSize = 11f
                typeface = brandBold()
                setTextColor(color("#0084CC"))
            })
            addView(TextView(context).apply {
                text = if (pendingConsent) "동의 상태를 확인하고 있어요" else "일정과 루틴에 집중하는 홈이에요"
                textSize = 18f
                typeface = brandBold()
                setTextColor(NativeTheme.text(context))
            }, matchWrap().apply { topMargin = dp(8) })
            addView(TextView(context).apply {
                text = "가계부·공간 관리·멤버 초대·광고는 나이와 동의 상태에 맞게 제한됩니다."
                textSize = 13f
                typeface = brandMedium()
                setTextColor(NativeTheme.muted(context))
            }, matchWrap().apply { topMargin = dp(6) })
        }
    }

    private fun isManagedAccount(): Boolean = summary?.account?.accountMode in setOf(
        "pending_guardian_consent",
        "child_managed",
        "teen_consent_pending",
        "teen",
    )

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
            setOnClickListener {
                calendarExpanded = !calendarExpanded
                render()
            }

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL

                addView(NativeBottomNavIconView(context, NativeNavIcon.CALENDAR, color("#1A1B2E")), LinearLayout.LayoutParams(dp(22), dp(22)))
                addView(TextView(context).apply {
                    text = formatDateTitle(selectedDate)
                    textSize = 15f
                    typeface = Typeface.DEFAULT_BOLD
                    setTextColor(NativeTheme.text(context))
                }, LinearLayout.LayoutParams(wrap(), wrap()).apply { leftMargin = dp(10) })
            }, LinearLayout.LayoutParams(0, wrap(), 1f))

            if (selectedDate == summary?.selectedDate) {
                addView(TextView(context).apply {
                    text = "TODAY"
                    textSize = 10f
                    typeface = Typeface.DEFAULT_BOLD
                    gravity = Gravity.CENTER
                    setTextColor(Color.WHITE)
                    background = roundDrawable("#0084CC", 999)
                }, LinearLayout.LayoutParams(dp(58), dp(24)))
            }

            addView(TextView(context).apply {
                text = if (calendarExpanded) "⌃" else "⌄"
                textSize = 18f
                typeface = brandBold()
                gravity = Gravity.CENTER
                setTextColor(NativeTheme.muted(context))
            }, LinearLayout.LayoutParams(dp(28), dp(24)).apply { leftMargin = dp(8) })
        }
    }

    private fun buildCalendarPanel(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(16), dp(16), dp(16))
            background = cardDrawable(24)
            elevation = dp(2).toFloat()

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                setPadding(dp(3), dp(3), dp(3), dp(3))
                background = roundDrawable("#F7F8FB", 12)

                addCalendarModeTab("월간", CalendarMode.MONTH)
                addCalendarModeTab("주간", CalendarMode.WEEK)
                addCalendarModeTab("일간", CalendarMode.DAY)
            }, matchWrap())

            when (calendarMode) {
                CalendarMode.MONTH -> addView(buildMonthCalendarGrid(), matchWrap().apply { topMargin = dp(14) })
                CalendarMode.WEEK -> addView(buildWeekCalendarStrip(), matchWrap().apply { topMargin = dp(14) })
                CalendarMode.DAY -> addView(buildDayCalendarPreview(), matchWrap().apply { topMargin = dp(14) })
            }
        }
    }

    private fun LinearLayout.addCalendarModeTab(label: String, mode: CalendarMode) {
        val active = calendarMode == mode
        addView(TextView(context).apply {
            text = label
            textSize = 13f
            typeface = if (active) brandBold() else brandMedium()
            gravity = Gravity.CENTER
            setTextColor(if (active) color("#1A1B2E") else color("#8E8E93"))
            background = if (active) roundDrawable("#FFFFFF", 10) else roundDrawable("#00FFFFFF", 10)
            elevation = if (active) dp(1).toFloat() else 0f
            setOnClickListener {
                calendarMode = mode
                render()
            }
        }, LinearLayout.LayoutParams(0, dp(32), 1f).apply {
            if (childCount > 0) leftMargin = dp(2)
        })
    }

    private fun buildWeekCalendarStrip(): LinearLayout {
        val days = summary?.calendarWeek.orEmpty()
        val selected = selectedDateKey ?: summary?.selectedDate

        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(dp(8), dp(10), dp(8), dp(10))
            background = roundDrawable("#FFFFFF", 18, "#EEF0F4")

            if (days.isEmpty()) {
                addView(TextView(context).apply {
                    text = "캘린더 데이터를 준비하는 중이에요"
                    textSize = 12f
                    gravity = Gravity.CENTER
                    setTextColor(NativeTheme.muted(context))
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
                        isSelected -> roundDrawable("#0084CC", 16)
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
                        setTextColor(if (isSelected) Color.WHITE else NativeTheme.text(context))
                    }, matchWrap().apply { topMargin = dp(2) })

                    addView(buildTypeDots(day, isSelected), matchWrap().apply { topMargin = dp(5) })
                }, LinearLayout.LayoutParams(0, dp(72), 1f).apply {
                    if (index > 0) leftMargin = dp(4)
                })
            }
        }
    }

    private fun buildMonthCalendarGrid(): LinearLayout {
        val days = summary?.calendarDays.orEmpty()
        val selected = selectedDateKey ?: summary?.selectedDate
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = roundDrawable("#FFFFFF", 18, "#EEF0F4")
            setPadding(dp(10), dp(10), dp(10), dp(10))

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                listOf("월", "화", "수", "목", "금", "토", "일").forEach {
                    addView(TextView(context).apply {
                        text = it
                        textSize = 10f
                        typeface = brandBold()
                        gravity = Gravity.CENTER
                        setTextColor(NativeTheme.muted(context))
                    }, LinearLayout.LayoutParams(0, dp(22), 1f))
                }
            })

            if (days.isEmpty()) {
                addView(TextView(context).apply {
                    text = "월간 캘린더 데이터를 준비하는 중이에요"
                    textSize = 12f
                    gravity = Gravity.CENTER
                    setTextColor(NativeTheme.muted(context))
                }, LinearLayout.LayoutParams(match(), dp(88)))
                return@apply
            }

            val leadingBlanks = runCatching {
                val parts = days.first().date.split("-").map { it.toInt() }
                val cal = java.util.Calendar.getInstance().apply {
                    set(parts[0], parts[1] - 1, parts[2])
                }
                (cal.get(java.util.Calendar.DAY_OF_WEEK) + 5) % 7
            }.getOrDefault(0)
            val cells = MutableList<NativeHomePortCalendarDay?>(leadingBlanks) { null }.apply { addAll(days) }
            while (cells.size % 7 != 0) cells.add(null)

            cells.chunked(7).take(6).forEach { week ->
                addView(LinearLayout(context).apply {
                    orientation = LinearLayout.HORIZONTAL
                    week.forEachIndexed { index, day ->
                        if (day == null) {
                            addView(View(context), LinearLayout.LayoutParams(0, dp(48), 1f).apply {
                                if (index > 0) leftMargin = dp(2)
                            })
                        } else {
                            val isSelected = day.date == selected
                            addView(LinearLayout(context).apply {
                                orientation = LinearLayout.VERTICAL
                                gravity = Gravity.CENTER
                                background = when {
                                    isSelected -> roundDrawable("#0084CC", 14)
                                    day.isToday -> roundDrawable("#F0FAFF", 14, "#D8F0FF")
                                    else -> roundDrawable("#FFFFFF", 14)
                                }
                                setOnClickListener {
                                    selectedDateKey = day.date
                                    render()
                                }

                                addView(TextView(context).apply {
                                    text = day.day.toString()
                                    textSize = 14f
                                    typeface = brandBold()
                                    gravity = Gravity.CENTER
                                    setTextColor(if (isSelected) Color.WHITE else NativeTheme.text(context))
                                })
                                addView(buildTypeDots(day, isSelected), matchWrap().apply { topMargin = dp(3) })
                            }, LinearLayout.LayoutParams(0, dp(48), 1f).apply {
                                if (index > 0) leftMargin = dp(2)
                            })
                        }
                    }
                }, matchWrap().apply { topMargin = dp(4) })
            }
        }
    }

    private fun buildDayCalendarPreview(): LinearLayout {
        val selected = selectedDateKey ?: summary?.selectedDate
        val selectedSchedules = schedulesForDate(selected)
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = roundDrawable("#FFFFFF", 18, "#EEF0F4")
            setPadding(dp(16), dp(16), dp(16), dp(16))

            addView(TextView(context).apply {
                text = "${formatDateTitle(selected)} 상세"
                textSize = 15f
                typeface = brandBold()
                setTextColor(NativeTheme.text(context))
            })

            addView(TextView(context).apply {
                text = if (selectedSchedules.isEmpty()) "선택한 날짜에 등록된 일정이 없어요" else "${selectedSchedules.size}개의 일정이 있어요"
                textSize = 12f
                typeface = brandMedium()
                setTextColor(NativeTheme.muted(context))
            }, matchWrap().apply { topMargin = dp(4) })

            selectedSchedules.take(2).forEach {
                addView(buildMiniScheduleRow(it), matchWrap().apply { topMargin = dp(10) })
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
        val selectedSchedules = schedulesForDate(selected)
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
                setTextColor(NativeTheme.text(context))
            }, matchWrap().apply { topMargin = dp(18) })

            addView(TextView(context).apply {
                text = "오른쪽 위 새 일정 버튼으로 바로 추가할 수 있어요"
                textSize = 12f
                gravity = Gravity.CENTER
                setTextColor(NativeTheme.muted(context))
            }, matchWrap().apply { topMargin = dp(6) })
        }
    }

    private fun buildScheduleCard(schedule: NativeHomePortSchedule): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(16), dp(14), dp(16), dp(14))
            background = roundDrawable("#FFFFFF", 20, "#EEF0F4")
            elevation = dp(2).toFloat()
            setOnClickListener {
                if (schedule.id.isNotBlank()) openWebPath("/schedules/${schedule.id}")
            }

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                background = roundDrawable(scheduleTypeBg(schedule.type), 14)
                addView(TextView(context).apply {
                    text = timeText(schedule.startTime)
                    textSize = 14f
                    typeface = brandBold()
                    gravity = Gravity.CENTER
                    setTextColor(color(scheduleTypeColor(schedule.type)))
                })
                addView(TextView(context).apply {
                    text = scheduleTypeLabel(schedule.type)
                    textSize = 9f
                    typeface = brandBold()
                    gravity = Gravity.CENTER
                    setTextColor(color(scheduleTypeColor(schedule.type)))
                }, matchWrap().apply { topMargin = dp(2) })
            }, LinearLayout.LayoutParams(dp(68), dp(58)))

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                addView(LinearLayout(context).apply {
                    orientation = LinearLayout.HORIZONTAL
                    gravity = Gravity.CENTER_VERTICAL
                    addView(TextView(context).apply {
                        text = scheduleTypeLabel(schedule.type)
                        textSize = 10f
                        typeface = brandBold()
                        gravity = Gravity.CENTER
                        setTextColor(color(scheduleTypeColor(schedule.type)))
                        background = roundDrawable(scheduleTypeBg(schedule.type), 999)
                        setPadding(dp(8), dp(3), dp(8), dp(3))
                    })
                    addView(TextView(context).apply {
                        text = statusLabel(schedule.status)
                        textSize = 10f
                        typeface = brandBold()
                        gravity = Gravity.CENTER
                        setTextColor(Color.WHITE)
                        background = roundDrawable(statusColor(schedule.status), 999)
                        setPadding(dp(8), dp(3), dp(8), dp(3))
                    }, LinearLayout.LayoutParams(wrap(), wrap()).apply { leftMargin = dp(6) })
                })
                addView(TextView(context).apply {
                    text = schedule.title
                    textSize = 15f
                    typeface = brandBold()
                    setTextColor(NativeTheme.text(context))
                    maxLines = 1
                }, matchWrap().apply { topMargin = dp(6) })
                addView(TextView(context).apply {
                    text = scheduleSubtitle(schedule)
                    textSize = 12f
                    typeface = brandMedium()
                    setTextColor(NativeTheme.muted(context))
                }, matchWrap().apply { topMargin = dp(4) })
            }, LinearLayout.LayoutParams(0, wrap(), 1f).apply { leftMargin = dp(12) })

            addView(TextView(context).apply {
                text = "›"
                textSize = 24f
                gravity = Gravity.CENTER
                setTextColor(NativeTheme.muted(context))
            }, LinearLayout.LayoutParams(dp(18), match()))
        }
    }

    private fun buildAdPlaceholder(): TextView {
        return TextView(this).apply {
            text = "AD"
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setTextColor(NativeTheme.muted(context))
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

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.TOP

                addView(LinearLayout(context).apply {
                    orientation = LinearLayout.VERTICAL

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
                        letterSpacing = -0.01f
                        setTextColor(NativeTheme.text(context))
                    }, matchWrap().apply { topMargin = dp(6) })

                    addView(TextView(context).apply {
                        text = "수입과 지출, 이번 달 순흐름을 확인하세요."
                        textSize = 12f
                        typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
                        setTextColor(NativeTheme.muted(context))
                    }, matchWrap().apply { topMargin = dp(4) })
                }, LinearLayout.LayoutParams(0, wrap(), 1f))

                addView(FrameLayout(context).apply {
                    background = roundDrawable("#F0FAFF", 999)
                    addView(NativeBottomNavIconView(context, NativeNavIcon.BUDGET, color("#0084CC")), FrameLayout.LayoutParams(dp(22), dp(22), Gravity.CENTER))
                }, LinearLayout.LayoutParams(dp(44), dp(44)).apply { leftMargin = dp(12) })
            })

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                addBudgetStat("수입", money(data?.incomeTotal ?: 0L), "#ECFDF5", "#0CC9B5", true)
                addBudgetStat("지출", money(data?.expenseTotal ?: 0L), "#F8FAFC", "#1A1B2E", false)
                addBudgetStat("순흐름", money(data?.net ?: 0L), "#F8FAFC", if ((data?.net ?: 0L) < 0L) "#F59E0B" else "#0084CC", false)
            }, matchWrap().apply { topMargin = dp(16) })

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL

                addView(TextView(context).apply {
                    text = "개인 공간 기준"
                    textSize = 12f
                    typeface = Typeface.DEFAULT_BOLD
                    setTextColor(NativeTheme.muted(context))
                }, LinearLayout.LayoutParams(0, wrap(), 1f))

                addView(TextView(context).apply {
                    text = "가계부 보기 →"
                    textSize = 12f
                    typeface = Typeface.DEFAULT_BOLD
                    setTextColor(color("#0084CC"))
                })
            }, matchWrap().apply { topMargin = dp(12) })
        }
    }

    private fun LinearLayout.addBudgetStat(label: String, value: String, fill: String, valueColor: String, wide: Boolean) {
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(12), dp(12), dp(12), dp(12))
            background = if (wide) roundDrawable("#E6FFFA", 16, "#BDEBFF") else roundDrawable(fill, 16)

            addView(TextView(context).apply {
                text = label
                textSize = 10f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(NativeTheme.muted(context))
            })

            addView(TextView(context).apply {
                text = value
                textSize = if (wide) 16f else 14f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(color(valueColor))
                maxLines = 1
                includeFontPadding = false
            }, matchWrap().apply { topMargin = dp(6) })
        }, LinearLayout.LayoutParams(0, wrap(), if (wide) 1.2f else 1f).apply {
            if (childCount > 0) leftMargin = dp(8)
        })
    }

    private fun buildUpcomingSection(): LinearLayout {
        val upcoming = summary?.upcoming.orEmpty()
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(sectionHeader("다가오는 일정", "${summary?.upcomingCount ?: 0}개", "전체보기", "/schedules"))
            if (upcoming.isEmpty()) {
                addView(TextView(context).apply {
                    text = "앞으로 예정된 일정이 없어요"
                    textSize = 13f
                    gravity = Gravity.CENTER
                    setTextColor(NativeTheme.muted(context))
                    background = roundDrawable("#FFFFFF", 20, "#EEF0F4")
                    setPadding(dp(20), dp(28), dp(20), dp(28))
                }, matchWrap().apply { topMargin = dp(12) })
            } else {
                upcoming.take(3).forEach { schedule ->
                    addView(buildUpcomingScheduleRow(schedule), matchWrap().apply { topMargin = dp(8) })
                }
            }
        }
    }

    private fun buildMiniScheduleRow(schedule: NativeHomePortSchedule): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(12), dp(10), dp(12), dp(10))
            background = roundDrawable("#F8FAFC", 14)
            setOnClickListener {
                if (schedule.id.isNotBlank()) openWebPath("/schedules/${schedule.id}")
            }

            addView(View(context).apply {
                background = roundDrawable(scheduleTypeColor(schedule.type), 999)
            }, LinearLayout.LayoutParams(dp(4), dp(34)))

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                addView(TextView(context).apply {
                    text = schedule.title
                    textSize = 13f
                    typeface = brandBold()
                    maxLines = 1
                    setTextColor(NativeTheme.text(context))
                })
                addView(TextView(context).apply {
                    text = scheduleSubtitle(schedule)
                    textSize = 11f
                    typeface = brandMedium()
                    setTextColor(NativeTheme.muted(context))
                }, matchWrap().apply { topMargin = dp(2) })
            }, LinearLayout.LayoutParams(0, wrap(), 1f).apply { leftMargin = dp(10) })
        }
    }

    private fun buildUpcomingScheduleRow(schedule: NativeHomePortSchedule): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(14), dp(14), dp(14), dp(14))
            background = roundDrawable("#FFFFFF", 16, "#EEF0F4")
            elevation = dp(1).toFloat()
            setOnClickListener {
                if (schedule.id.isNotBlank()) openWebPath("/schedules/${schedule.id}")
            }

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                background = roundDrawable(scheduleTypeBg(schedule.type), 12)
                addView(TextView(context).apply {
                    text = monthText(schedule.startTime)
                    textSize = 10f
                    typeface = brandBold()
                    gravity = Gravity.CENTER
                    setTextColor(color(scheduleTypeColor(schedule.type)))
                })
                addView(TextView(context).apply {
                    text = dayText(schedule.startTime)
                    textSize = 16f
                    typeface = brandBold()
                    gravity = Gravity.CENTER
                    setTextColor(NativeTheme.text(context))
                }, matchWrap().apply { topMargin = dp(1) })
            }, LinearLayout.LayoutParams(dp(44), dp(44)))

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                addView(TextView(context).apply {
                    text = schedule.title
                    textSize = 14f
                    typeface = brandBold()
                    maxLines = 1
                    setTextColor(NativeTheme.text(context))
                })
                addView(TextView(context).apply {
                    text = "${formatDateTitle(scheduleDateKey(schedule.startTime))} · ${timeText(schedule.startTime)}"
                    textSize = 12f
                    typeface = brandMedium()
                    setTextColor(NativeTheme.muted(context))
                }, matchWrap().apply { topMargin = dp(3) })
            }, LinearLayout.LayoutParams(0, wrap(), 1f).apply { leftMargin = dp(12) })

            addView(TextView(context).apply {
                text = "›"
                textSize = 22f
                gravity = Gravity.CENTER
                setTextColor(NativeTheme.muted(context))
            }, LinearLayout.LayoutParams(dp(16), match()))
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
                setTextColor(NativeTheme.text(context))
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
                    background = roundDrawable("#0084CC", 999)
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
            background = roundDrawable("#FFFFFF", if (NativeAdaptive.isLarge(this@NativeHomePortActivity)) 28 else 0, "#E8E8E4")

            buildList {
                add(NativeNavItem("홈", NativeNavIcon.HOME, "/home"))
                add(NativeNavItem("일정", NativeNavIcon.CALENDAR, "/schedules"))
                add(NativeNavItem("공간", NativeNavIcon.SPACE, "/space"))
                if (summary?.account?.capabilities?.canViewHouseholdBudget == true) {
                    add(NativeNavItem("가계부", NativeNavIcon.BUDGET, "/budget"))
                }
                add(NativeNavItem("전체", NativeNavIcon.MENU, "/mypage"))
            }.forEachIndexed { index, item ->
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
        if (path == "/schedules") {
            startActivity(Intent(this, NativeScheduleListActivity::class.java))
            finish()
            return
        }
        if (path == "/home") {
            loading = true
            errorMessage = null
            render()
            loadHomeSummary()
            return
        }
        if (path == "/schedules/new") {
            startActivity(Intent(this, NativeScheduleCreateActivity::class.java).apply {
                putExtra("selected_date", selectedDateKey ?: summary?.selectedDate)
            })
            return
        }
        if (path.startsWith("/schedules/")) {
            val id = path.removePrefix("/schedules/").substringBefore("/")
            startActivity(Intent(this, NativeScheduleDetailActivity::class.java).putExtra("schedule_id", id))
            return
        }
        if (path == "/budget") {
            if (summary?.account?.capabilities?.canViewHouseholdBudget != true) return
            startActivity(Intent(this, NativeBudgetActivity::class.java))
            finish()
            return
        }
        if (path == "/space") {
            startActivity(Intent(this, NativeSpaceActivity::class.java))
            finish()
            return
        }
        if (path == "/notifications") {
            startActivity(Intent(this, NativeNotificationActivity::class.java))
            return
        }
        if (path == "/mypage") {
            startActivity(Intent(this, NativeMyMenuActivity::class.java))
            finish()
            return
        }
        startActivity(Intent(this, MainActivity::class.java).apply {
            putExtra("start_path", path)
        })
        finish()
    }

    private fun scheduleSubtitle(schedule: NativeHomePortSchedule): String {
        return "${scheduleTypeLabel(schedule.type)} · ${timeText(schedule.startTime)}"
    }

    private fun schedulesForDate(dateKey: String?): List<NativeHomePortSchedule> =
        summary?.range.orEmpty()
            .filter { scheduleDateKey(it.startTime) == dateKey }
            .sortedBy { it.startTime }

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

    private fun scheduleTypeBg(type: String): String = when (type) {
        "shared" -> "#EAF6FF"
        "child" -> "#ECFDF5"
        "expense" -> "#FFF7ED"
        else -> "#E6FFFA"
    }

    private fun scheduleTypeLabel(type: String): String = when (type) {
        "shared" -> "공유일정"
        "child" -> "자녀일정"
        "expense" -> "지출"
        else -> "개인일정"
    }

    private fun statusLabel(status: String): String = when (status) {
        "completed" -> "완료"
        "missed" -> "미완료"
        "in_progress" -> "진행중"
        else -> "예정"
    }

    private fun statusColor(status: String): String = when (status) {
        "completed" -> "#2EE895"
        "missed" -> "#EF4444"
        "in_progress" -> "#0084CC"
        else -> "#AEAEA8"
    }

    private fun monthText(raw: String): String {
        val key = scheduleDateKey(raw)
        val parts = key.split("-")
        return if (parts.size == 3) "${parts[1].toIntOrNull() ?: parts[1]}월" else ""
    }

    private fun dayText(raw: String): String {
        val key = scheduleDateKey(raw)
        val parts = key.split("-")
        return if (parts.size == 3) "${parts[2].toIntOrNull() ?: parts[2]}" else ""
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

    private fun brandRegular(): Typeface = Typeface.create("sans-serif", Typeface.NORMAL)
    private fun brandMedium(): Typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
    private fun brandBold(): Typeface = Typeface.create("sans-serif", Typeface.BOLD)

    private fun cardDrawable(radius: Int = 20): GradientDrawable =
        roundDrawable("#FFFFFF", radius, "#EEF0F4")

    private fun shimmerDrawable(index: Int): GradientDrawable =
        GradientDrawable(
            GradientDrawable.Orientation.LEFT_RIGHT,
            if (index % 2 == 0) intArrayOf(color("#F0FAFF"), color("#FFFFFF")) else intArrayOf(color("#F7F8FB"), color("#FFFFFF"))
        ).apply {
            cornerRadius = dp(16).toFloat()
            setStroke(dp(1), color("#EEF0F4"))
        }

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

    private fun color(hex: String): Int = NativeTheme.color(this, hex)

    private fun colorWithAlpha(hex: String, alpha: Float): Int = NativeTheme.alpha(hex, alpha)

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
    private fun statusBarHeight(): Int {
        val id = resources.getIdentifier("status_bar_height", "dimen", "android")
        return if (id > 0) resources.getDimensionPixelSize(id) else 0
    }
    private fun match(): Int = ViewGroup.LayoutParams.MATCH_PARENT
    private fun wrap(): Int = ViewGroup.LayoutParams.WRAP_CONTENT
    private fun matchWrap(): LinearLayout.LayoutParams = LinearLayout.LayoutParams(match(), wrap())

    companion object {
        private const val HOME_BOTTOM_ADFIT_CLIENT_ID = "DAN-Brd0FQAE3ByDWwJu"
        private const val TAG = "GleaumHomeAdFit"
        private const val CAPACITOR_PREFS_NAME = "CapacitorStorage"
        private const val HOME_LAYOUT_KEY = "gleaum:home-layout"
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

private enum class CalendarMode {
    MONTH,
    WEEK,
    DAY,
}

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
