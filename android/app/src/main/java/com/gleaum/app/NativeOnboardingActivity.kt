package com.gleaum.app

import android.content.Intent
import android.app.KeyguardManager
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.hardware.biometrics.BiometricManager
import android.os.Build
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import android.content.Context
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject

class NativeOnboardingActivity : AppCompatActivity() {
    private var step = 0
    private var saving = false
    private var displayName = ""
    private var realName = ""
    private var nameMode = "nickname"
    private var primaryGoal = "personal_schedule"
    private var homeLayout = "calendar_first"
    private var spaceIntent = "solo"
    private var spaceSetupMode = "skip"
    private var newSpaceName = ""
    private var joinCode = ""
    private var biometricLock = false
    private var reminderMinutes = 30
    private var scheduleReminders = true
    private var expenseReminders = true
    private var spaceUpdates = true

    private var nameInput: EditText? = null
    private var realNameInput: EditText? = null
    private var spaceNameInput: EditText? = null
    private var joinCodeInput: EditText? = null

    private val goals = listOf(
        Option("personal_schedule", "개인 일정", "나의 하루를 체계적으로", "calendar_first"),
        Option("routine", "루틴 관리", "꾸준한 습관 만들기", "routine_first"),
        Option("expense", "자금 관리", "수입과 지출을 한눈에", "expense_first"),
        Option("couple", "연인과 함께", "둘만의 일상 연결", "space_first"),
        Option("friends", "친구·모임", "함께하는 약속 관리", "space_first"),
        Option("group", "그룹 공간", "여럿이 함께 공유", "space_first"),
    )

    private val layouts = listOf(
        Option("balanced", "밸런스", "모든 기능을 균형 있게", "balanced"),
        Option("calendar_first", "캘린더 중심", "일정 확인이 최우선", "calendar_first"),
        Option("routine_first", "루틴 중심", "습관 형성에 최적화", "routine_first"),
        Option("expense_first", "지출 중심", "자금 흐름 한눈에", "expense_first"),
        Option("space_first", "공간 중심", "그룹 소식을 우선", "space_first"),
    )

    private val spaces = listOf(
        Option("solo", "혼자 사용", "나만의 개인 공간으로", "solo"),
        Option("couple", "연인", "둘이서 함께 기록", "couple"),
        Option("friends", "친구·모임", "여럿이 함께 계획", "friends"),
        Option("group", "그룹", "팀 또는 가족과 공유", "group"),
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        NativeTheme.applySystemBars(window, this)
        loadProfileName()
        render()
    }

    private fun loadProfileName() {
        Thread {
            try {
                val profile = NativeProfileApi.fetch(this)
                runOnUiThread {
                    if (profile.onboardingCompleted) {
                        goHome()
                    } else {
                        displayName = profile.displayName.takeIf { it.isNotBlank() } ?: profile.name
                        render()
                    }
                }
            } catch (_: Exception) { }
        }.start()
    }

    private fun render() {
        setContentView(FrameLayout(this).apply {
            setBackgroundColor(color("#FAFAFD"))
            addView(ScrollView(context).apply {
                overScrollMode = View.OVER_SCROLL_NEVER
                addView(LinearLayout(context).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(dp(NativeAdaptive.pagePaddingDp(this@NativeOnboardingActivity)), statusBarHeight() + dp(24), dp(NativeAdaptive.pagePaddingDp(this@NativeOnboardingActivity)), dp(28))
                    addView(hero(), matchWrap())
                    addView(stepContent(), matchWrap().apply { topMargin = dp(18) })
                    addView(actions(), matchWrap().apply { topMargin = dp(18) })
                }, NativeAdaptive.scrollChildParams(this@NativeOnboardingActivity, compact = true))
            }, FrameLayout.LayoutParams(match(), match()))
        })
    }

    private fun hero(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(24), dp(24), dp(24), dp(24))
        background = gradient("#1A1B2E", "#2D2E4A", 28)
        addView(TextView(context).apply {
            text = "GLEAUM SETUP  ${step + 1}/5"
            textSize = 11f
            typeface = bold()
            letterSpacing = 0.08f
            setTextColor(color("#0CC9B5"))
        })
        addView(TextView(context).apply {
            text = when (step) {
                0 -> "어떻게 불러드릴까요?"
                1 -> "무엇을 중심으로 쓸까요?"
                2 -> "홈 화면을 고를게요"
                3 -> "공간을 바로 준비할까요?"
                else -> "알림과 보안을 맞춰요"
            }
            textSize = 25f
            typeface = bold()
            setTextColor(Color.WHITE)
        }, matchWrap().apply { topMargin = dp(8) })
        addView(TextView(context).apply {
            text = "처음 화면과 기본 설정을 사용자에게 맞게 구성합니다."
            textSize = 13f
            typeface = medium()
            setTextColor(colorWithAlpha("#FFFFFF", 0.58f))
        }, matchWrap().apply { topMargin = dp(8) })
    }

    private fun stepContent(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        when (step) {
            0 -> addNameStep(this)
            1 -> addOptionList(this, goals, primaryGoal) { option -> primaryGoal = option.key; homeLayout = option.value; render() }
            2 -> addOptionList(this, layouts, homeLayout) { option -> homeLayout = option.key; render() }
            3 -> addSpaceSetupStep(this)
            4 -> addFinalStep(this)
        }
    }

    private fun addNameStep(parent: LinearLayout) {
        parent.addView(label("닉네임 / 표시 이름"), matchWrap())
        nameInput = input("예: 글리움 관리자", displayName).also { parent.addView(it, matchWrap().apply { topMargin = dp(8) }) }
        parent.addView(label("실명 (선택)"), matchWrap().apply { topMargin = dp(16) })
        realNameInput = input("필요하면 입력", realName).also { parent.addView(it, matchWrap().apply { topMargin = dp(8) }) }
        parent.addView(optionCard("nickname", "닉네임으로 표시", "서비스 안에서 닉네임을 기본으로 사용", nameMode == "nickname") { nameMode = "nickname"; render() }, matchWrap().apply { topMargin = dp(16) })
        parent.addView(optionCard("real_name", "실명으로 표시", "내 이름을 그대로 사용", nameMode == "real_name") { nameMode = "real_name"; render() }, matchWrap().apply { topMargin = dp(10) })
    }

    private fun addFinalStep(parent: LinearLayout) {
        parent.addView(label("알림"), matchWrap())
        parent.addView(toggleCard("일정 리마인더", "일정 시작 전 알림", scheduleReminders) { scheduleReminders = !scheduleReminders; render() }, matchWrap().apply { topMargin = dp(8) })
        parent.addView(toggleCard("가계부 알림", "정기 지출 D-1 알림", expenseReminders) { expenseReminders = !expenseReminders; render() }, matchWrap().apply { topMargin = dp(8) })
        parent.addView(toggleCard("공간 업데이트", "초대/멤버/공간 소식", spaceUpdates) { spaceUpdates = !spaceUpdates; render() }, matchWrap().apply { topMargin = dp(8) })

        parent.addView(label("앱 잠금"), matchWrap().apply { topMargin = dp(16) })
        val available = isBiometricAvailableForLock()
        parent.addView(toggleCard(
            "생체인증 앱 잠금",
            if (available) "앱을 열 때 지문 또는 기기 잠금으로 보호" else "기기 보안 설정 후 사용할 수 있어요",
            biometricLock && available
        ) {
            if (available) {
                biometricLock = !biometricLock
                render()
            } else {
                toast("기기 잠금 또는 지문을 먼저 등록해 주세요.")
            }
        }, matchWrap().apply { topMargin = dp(8) })
    }

    private fun addSpaceSetupStep(parent: LinearLayout) {
        parent.addView(label("공간 사용 방식"), matchWrap())
        addOptionList(parent, spaces, spaceIntent) { option ->
            spaceIntent = option.key
            if (option.key == "solo") spaceSetupMode = "skip"
            render()
        }

        parent.addView(label("공간 설정"), matchWrap().apply { topMargin = dp(16) })
        parent.addView(optionCard("skip", "나중에 설정", "먼저 개인 공간으로 시작", spaceSetupMode == "skip") { spaceSetupMode = "skip"; render() }, matchWrap().apply { topMargin = dp(8) })
        parent.addView(optionCard("create", "새 공유 공간 만들기", "연인, 친구, 가족과 함께 쓸 공간 생성", spaceSetupMode == "create") { spaceSetupMode = "create"; render() }, matchWrap().apply { topMargin = dp(8) })
        if (spaceSetupMode == "create") {
            spaceNameInput = input("예: 우리집, 데이트 캘린더", newSpaceName).also {
                parent.addView(it, matchWrap().apply { topMargin = dp(8) })
            }
        }
        parent.addView(optionCard("join", "초대 코드로 참여", "받은 GLEAUM 코드로 공간 입장", spaceSetupMode == "join") { spaceSetupMode = "join"; render() }, matchWrap().apply { topMargin = dp(8) })
        if (spaceSetupMode == "join") {
            joinCodeInput = input("GLEAUM-XXXXXXX", joinCode).also {
                parent.addView(it, matchWrap().apply { topMargin = dp(8) })
            }
        }
    }

    private fun addOptionList(parent: LinearLayout, options: List<Option>, selected: String, onSelect: (Option) -> Unit) {
        options.forEachIndexed { index, option ->
            parent.addView(optionCard(option.key, option.title, option.desc, option.key == selected) { onSelect(option) }, matchWrap().apply { if (index > 0) topMargin = dp(10) })
        }
    }

    private fun optionCard(key: String, title: String, desc: String, active: Boolean, action: () -> Unit): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(18), dp(16), dp(18), dp(16))
        background = round(if (active) "#F0FAFF" else "#FFFFFF", 20, if (active) "#0084CC" else "#EEF0F4")
        setOnClickListener { action() }
        addView(TextView(context).apply {
            text = if (active) "✓" else ""
            textSize = 15f
            gravity = Gravity.CENTER
            typeface = bold()
            setTextColor(color("#0084CC"))
            background = round(if (active) "#EAF6FD" else "#F8FAFC", 999, "#EEF0F4")
        }, LinearLayout.LayoutParams(dp(34), dp(34)))
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            addView(TextView(context).apply { text = title; textSize = 16f; typeface = bold(); setTextColor(NativeTheme.text(context)) })
            addView(TextView(context).apply { text = desc; textSize = 12f; typeface = medium(); setTextColor(NativeTheme.muted(context)) }, matchWrap().apply { topMargin = dp(3) })
        }, LinearLayout.LayoutParams(0, wrap(), 1f).apply { leftMargin = dp(12) })
    }

    private fun toggleCard(title: String, desc: String, active: Boolean, action: () -> Unit): LinearLayout = optionCard(if (active) "on" else "off", title, desc, active, action)

    private fun actions(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        if (step > 0) {
            addView(button("이전", false) { step -= 1; render() }, LinearLayout.LayoutParams(0, dp(52), 1f).apply { rightMargin = dp(8) })
        }
        addView(button(if (step == 4) "시작하기" else "다음", true) { next() }, LinearLayout.LayoutParams(0, dp(52), if (step > 0) 1f else 1f))
    }

    private fun next() {
        if (saving) return
        if (step == 0) {
            displayName = nameInput?.text?.toString()?.trim().orEmpty()
            realName = realNameInput?.text?.toString()?.trim().orEmpty()
            if (displayName.isBlank()) { toast("표시 이름을 입력해 주세요."); return }
        }
        if (step == 3) {
            newSpaceName = spaceNameInput?.text?.toString()?.trim().orEmpty()
            joinCode = joinCodeInput?.text?.toString()?.trim().orEmpty()
            if (spaceSetupMode == "create" && newSpaceName.isBlank()) { toast("새 공간 이름을 입력해 주세요."); return }
            if (spaceSetupMode == "join" && joinCode.isBlank()) { toast("초대 코드를 입력해 주세요."); return }
        }
        if (step < 4) {
            step += 1
            hideKeyboard()
            render()
            return
        }
        complete()
    }

    private fun complete() {
        saving = true
        render()
        Thread {
            try {
                if (spaceSetupMode == "create") {
                    NativeSpaceApi.create(this, newSpaceName)
                } else if (spaceSetupMode == "join") {
                    NativeSpaceApi.join(this, joinCode.trim().uppercase())
                }
                applyBiometricPreferenceIfNeeded()
                NativeOnboardingApi.complete(
                    this,
                    displayName,
                    realName.takeIf { it.isNotBlank() },
                    nameMode,
                    primaryGoal,
                    homeLayout,
                    modulesForGoal(primaryGoal),
                    reminderMinutes,
                    listOf(spaceIntent),
                    JSONObject()
                        .put("scheduleReminders", scheduleReminders)
                        .put("routineReminders", scheduleReminders)
                        .put("expenseReminders", expenseReminders)
                        .put("spaceUpdates", spaceUpdates),
                )
                runOnUiThread { goHome() }
            } catch (e: Exception) {
                runOnUiThread { saving = false; toast("온보딩 저장에 실패했어요. 잠시 후 다시 시도해 주세요."); render() }
            }
        }.start()
    }

    private fun modulesForGoal(goal: String): List<String> = when (goal) {
        "routine" -> listOf("calendar", "routine")
        "expense" -> listOf("calendar", "expense")
        "couple", "friends", "group" -> listOf("calendar", "spaces", "expense")
        else -> listOf("calendar")
    }


    private fun applyBiometricPreferenceIfNeeded() {
        nativePrefs().edit()
            .putString(BIOMETRIC_PROMPT_SEEN_KEY, "true")
            .putString(BIOMETRIC_LOCK_ENABLED_KEY, if (biometricLock && isBiometricAvailableForLock()) "true" else "false")
            .putString(BIOMETRIC_LOCK_SCOPES_KEY, "[\"app\"]")
            .putString(BIOMETRIC_UNLOCKED_AT_KEY, System.currentTimeMillis().toString())
            .apply()
    }

    private fun isBiometricAvailableForLock(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return false
        val keyguard = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
        if (!keyguard.isDeviceSecure) return false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val manager = getSystemService(BiometricManager::class.java)
            return manager?.canAuthenticate() == BiometricManager.BIOMETRIC_SUCCESS || keyguard.isDeviceSecure
        }
        return packageManager.hasSystemFeature(PackageManager.FEATURE_FINGERPRINT) || keyguard.isDeviceSecure
    }

    private fun nativePrefs(): SharedPreferences = getSharedPreferences(CAPACITOR_PREFS_NAME, Context.MODE_PRIVATE)

    private fun goHome() {
        startActivity(Intent(this, NativeHomePortActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        })
        finish()
    }

    private fun button(textValue: String, primary: Boolean, action: () -> Unit): TextView = TextView(this).apply {
        text = if (saving && primary) "저장 중..." else textValue
        textSize = 15f
        typeface = bold()
        gravity = Gravity.CENTER
        setTextColor(if (primary) Color.WHITE else color("#0084CC"))
        background = if (primary) gradient("#0CC9B5", "#0084CC", 999) else round("#FFFFFF", 999, "#D8E8F2")
        setOnClickListener { action() }
    }

    private fun label(textValue: String): TextView = TextView(this).apply { text = textValue; textSize = 13f; typeface = bold(); setTextColor(NativeTheme.text(context)) }
    private fun input(hintText: String, value: String): EditText = EditText(this).apply {
        hint = hintText
        setText(value)
        textSize = 16f
        typeface = medium()
        setSingleLine(true)
        setTextColor(NativeTheme.text(context))
        setHintTextColor(NativeTheme.muted(context))
        setPadding(dp(16), 0, dp(16), 0)
        minHeight = dp(54)
        background = round("#FFFFFF", 16, "#EEF0F4")
    }

    private fun hideKeyboard() {
        val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        imm.hideSoftInputFromWindow(window.decorView.windowToken, 0)
    }

    private fun toast(message: String) = Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    private fun bold(): Typeface = Typeface.create("sans-serif", Typeface.BOLD)
    private fun medium(): Typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
    private fun color(hex: String): Int = NativeTheme.color(this, hex)
    private fun colorWithAlpha(hex: String, alpha: Float): Int = NativeTheme.alpha(hex, alpha)
    private fun round(fill: String, radius: Int, stroke: String? = null): GradientDrawable = GradientDrawable().apply { setColor(color(fill)); cornerRadius = dp(radius).toFloat(); if (stroke != null) setStroke(dp(1), color(stroke)) }
    private fun gradient(start: String, end: String, radius: Int): GradientDrawable = GradientDrawable(GradientDrawable.Orientation.TL_BR, intArrayOf(color(start), color(end))).apply { cornerRadius = dp(radius).toFloat() }
    private fun match(): Int = ViewGroup.LayoutParams.MATCH_PARENT
    private fun wrap(): Int = ViewGroup.LayoutParams.WRAP_CONTENT
    private fun matchWrap(): LinearLayout.LayoutParams = LinearLayout.LayoutParams(match(), wrap())
    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
    private fun statusBarHeight(): Int { val id = resources.getIdentifier("status_bar_height", "dimen", "android"); return if (id > 0) resources.getDimensionPixelSize(id) else 0 }

    data class Option(val key: String, val title: String, val desc: String, val value: String)

    companion object {
        private const val CAPACITOR_PREFS_NAME = "CapacitorStorage"
        private const val BIOMETRIC_LOCK_ENABLED_KEY = "gleaum:biometric-lock-enabled"
        private const val BIOMETRIC_PROMPT_SEEN_KEY = "gleaum:biometric-lock-prompt-seen"
        private const val BIOMETRIC_UNLOCKED_AT_KEY = "gleaum:biometric-unlocked-at"
        private const val BIOMETRIC_LOCK_SCOPES_KEY = "gleaum:biometric-lock-scopes"
    }
}
