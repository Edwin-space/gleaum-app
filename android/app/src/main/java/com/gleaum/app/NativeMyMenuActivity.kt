package com.gleaum.app

import android.Manifest
import android.app.AlertDialog
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.hardware.biometrics.BiometricManager
import android.os.Build
import android.os.Bundle
import android.provider.CalendarContract
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

/**
 * Android Native "전체" menu shell.
 *
 * Native-first settings entry. Detailed screens that are not ported yet keep a
 * WebView fallback, but device-bound actions such as biometrics, calendar
 * permission and logout are handled natively here.
 */
class NativeMyMenuActivity : AppCompatActivity() {

    private var summary: NativeHomePortSummary? = null
    private var loading = true
    private var message: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        applyLightSystemBars()
        render()
        loadSummary()
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

    private fun loadSummary() {
        val token = SessionManager.get(this)?.let {
            runCatching { JSONObject(it).optString("access_token") }.getOrNull()
        }
        if (token.isNullOrBlank()) {
            loading = false
            message = "로그인 세션을 찾을 수 없어요. 다시 로그인해 주세요."
            render()
            return
        }

        Thread {
            try {
                val loaded = requestHomeSummary(token)
                runOnUiThread {
                    summary = loaded
                    loading = false
                    message = null
                    render()
                }
            } catch (e: Exception) {
                runOnUiThread {
                    loading = false
                    message = "프로필 정보를 불러오지 못했어요."
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
            setRequestProperty("X-Gleaum-Native-Preview", "android-menu")
        }
        val responseText = readResponse(connection)
        val json = if (responseText.isBlank()) JSONObject() else JSONObject(responseText)
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException(json.optString("error").ifBlank { "menu_summary_failed" })
        }
        return NativeHomePortSummary.fromJson(json)
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }

    private fun render() {
        setContentView(buildScreen())
    }

    private fun buildScreen(): FrameLayout {
        return FrameLayout(this).apply {
            setBackgroundColor(color("#FAFAFD"))

            addView(ScrollView(context).apply {
                overScrollMode = View.OVER_SCROLL_NEVER
                addView(LinearLayout(context).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(dp(20), statusBarHeight() + dp(76), dp(20), dp(88))

                    addView(buildProfileCard(), matchWrap())
                    if (message != null) addView(buildMessageCard(), matchWrap().apply { topMargin = dp(12) })
                    addView(buildQuickActions(), matchWrap().apply { topMargin = dp(16) })
                    addView(buildSectionTitle("앱 설정"), matchWrap().apply { topMargin = dp(22) })
                    addView(buildSettingsGroup(listOf(
                        MenuRow("화면 모드", "다음 단계에서 네이티브화 예정", MenuIcon.SUN, "준비중") { openWebPath("/mypage") },
                        MenuRow("홈 레이아웃", "홈 화면 구성 변경", MenuIcon.GRID, null) { openWebPath("/settings/home-layout") },
                        MenuRow("캘린더 설정", calendarSettingsSubtitle(), MenuIcon.CALENDAR, calendarSettingsBadge()) { showCalendarSettings() },
                        MenuRow("알림 설정", "푸시와 일정 알림 관리", MenuIcon.BELL, null) { openWebPath("/settings") },
                    )), matchWrap().apply { topMargin = dp(10) })

                    addView(buildSectionTitle("계정 & 보안"), matchWrap().apply { topMargin = dp(22) })
                    addView(buildSettingsGroup(listOf(
                        MenuRow("생체인증 보안", biometricSubtitle(), MenuIcon.LOCK, biometricBadge()) { showBiometricSettings() },
                        MenuRow("비밀번호 설정", "이메일 로그인 보안 설정", MenuIcon.KEY, null) { openWebPath("/settings/security") },
                        MenuRow("프로필 관리", "닉네임, 이름, 계정 정보", MenuIcon.USER, null) { openWebPath("/mypage") },
                    )), matchWrap().apply { topMargin = dp(10) })

                    addView(buildSectionTitle("서비스"), matchWrap().apply { topMargin = dp(22) })
                    addView(buildSettingsGroup(listOf(
                        MenuRow("약관 및 개인정보", "서비스 이용약관과 개인정보 처리방침", MenuIcon.DOC, null) { openWebPath("/legal/terms") },
                        MenuRow("앱 버전", "네이티브 전환 작업 진행 중", MenuIcon.INFO, BuildConfig.VERSION_NAME) {},
                        MenuRow("로그아웃", "현재 기기의 로그인 세션을 삭제합니다", MenuIcon.LOGOUT, null) { logout() },
                    )), matchWrap().apply { topMargin = dp(10) })
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
            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL

                addView(LinearLayout(context).apply {
                    orientation = LinearLayout.HORIZONTAL
                    gravity = Gravity.CENTER_VERTICAL
                    addView(ImageView(context).apply {
                        setImageResource(R.drawable.gleaum_logo_native)
                        scaleType = ImageView.ScaleType.FIT_CENTER
                    }, LinearLayout.LayoutParams(dp(32), dp(32)))
                    addView(ImageView(context).apply {
                        setImageResource(R.drawable.gleaum_bi_native)
                        scaleType = ImageView.ScaleType.FIT_CENTER
                        adjustViewBounds = true
                    }, LinearLayout.LayoutParams(dp(88), dp(24)).apply { leftMargin = dp(8) })
                }, LinearLayout.LayoutParams(0, dp(44), 1f))

                addView(TextView(context).apply {
                    text = "전체"
                    textSize = 18f
                    typeface = brandBold()
                    setTextColor(color("#1A1B2E"))
                    gravity = Gravity.CENTER_VERTICAL
                })
            }, FrameLayout.LayoutParams(match(), dp(44), Gravity.BOTTOM).apply {
                leftMargin = dp(20)
                rightMargin = dp(20)
                bottomMargin = dp(10)
            })
            addView(View(context).apply { setBackgroundColor(color("#EEF0F4")) }, FrameLayout.LayoutParams(match(), dp(1), Gravity.BOTTOM))
        }
    }

    private fun buildProfileCard(): LinearLayout {
        val name = summary?.displayName?.takeIf { it.isNotBlank() } ?: "글리움 사용자"
        val space = summary?.activeSpaceName?.takeIf { it.isNotBlank() } ?: "연결된 공간"
        val members = summary?.memberCount ?: 0
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(22), dp(22), dp(22), dp(20))
            background = gradientDrawable("#1A1B2E", "#2D2E4A", 28)
            elevation = dp(8).toFloat()

            addView(TextView(context).apply {
                text = if (loading) "프로필을 불러오는 중" else "좋은 하루예요"
                textSize = 13f
                typeface = brandMedium()
                setTextColor(color("#0CC9B5"))
            })
            addView(TextView(context).apply {
                text = "${name}님"
                textSize = 25f
                typeface = brandBold()
                letterSpacing = -0.02f
                setTextColor(Color.WHITE)
            }, matchWrap().apply { topMargin = dp(10) })
            addView(TextView(context).apply {
                text = "${space} · ${members}명 참여 중"
                textSize = 12f
                typeface = brandMedium()
                setTextColor(colorWithAlpha("#FFFFFF", 0.54f))
            }, matchWrap().apply { topMargin = dp(6) })
        }
    }

    private fun buildMessageCard(): TextView = TextView(this).apply {
        text = message.orEmpty()
        textSize = 13f
        typeface = brandBold()
        gravity = Gravity.CENTER
        setTextColor(color("#EF4444"))
        setPadding(dp(16), dp(14), dp(16), dp(14))
        background = roundDrawable("#FFF1F2", 18, "#FECACA")
    }

    private fun buildQuickActions(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(dp(16), dp(14), dp(16), dp(14))
            background = roundDrawable("#FFFFFF", 24, "#EEF0F4")
            elevation = dp(2).toFloat()

            addQuickAction("일정 추가", MenuIcon.CALENDAR) {
                startActivity(Intent(this@NativeMyMenuActivity, NativeScheduleCreateActivity::class.java))
            }
            addQuickAction("가계부", MenuIcon.BUDGET) { startActivity(Intent(this@NativeMyMenuActivity, NativeBudgetActivity::class.java)); finish() }
            addQuickAction("공간", MenuIcon.SPACE) { startActivity(Intent(this@NativeMyMenuActivity, NativeSpaceActivity::class.java)); finish() }
        }
    }

    private fun LinearLayout.addQuickAction(label: String, icon: MenuIcon, action: () -> Unit) {
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setOnClickListener { action() }
            addView(FrameLayout(context).apply {
                background = roundDrawable(iconBg(icon), 16)
                addView(MenuIconView(context, icon, color(iconColor(icon))), FrameLayout.LayoutParams(dp(24), dp(24), Gravity.CENTER))
            }, LinearLayout.LayoutParams(dp(52), dp(52)))
            addView(TextView(context).apply {
                text = label
                textSize = 12f
                typeface = brandBold()
                gravity = Gravity.CENTER
                setTextColor(color("#1A1B2E"))
            }, matchWrap().apply { topMargin = dp(8) })
        }, LinearLayout.LayoutParams(0, wrap(), 1f))
    }

    private fun buildSectionTitle(title: String): TextView = TextView(this).apply {
        text = title
        textSize = 13f
        typeface = brandBold()
        setTextColor(color("#8E8E93"))
    }

    private fun buildSettingsGroup(rows: List<MenuRow>): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = roundDrawable("#FFFFFF", 24, "#EEF0F4")
            elevation = dp(2).toFloat()
            rows.forEachIndexed { index, row ->
                addView(buildRow(row), matchWrap())
                if (index < rows.lastIndex) addView(View(context).apply {
                    setBackgroundColor(color("#EEF0F4"))
                }, LinearLayout.LayoutParams(match(), dp(1)).apply { leftMargin = dp(76) })
            }
        }
    }

    private fun buildRow(row: MenuRow): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(18), dp(14), dp(16), dp(14))
            minimumHeight = dp(72)
            setOnClickListener { row.action() }

            addView(FrameLayout(context).apply {
                background = roundDrawable(iconBg(row.icon), 16)
                addView(MenuIconView(context, row.icon, color(iconColor(row.icon))), FrameLayout.LayoutParams(dp(22), dp(22), Gravity.CENTER))
            }, LinearLayout.LayoutParams(dp(44), dp(44)))

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                addView(TextView(context).apply {
                    text = row.title
                    textSize = 15f
                    typeface = brandBold()
                    setTextColor(color("#1A1B2E"))
                })
                addView(TextView(context).apply {
                    text = row.subtitle
                    textSize = 12f
                    typeface = brandMedium()
                    maxLines = 1
                    setTextColor(color("#8E8E93"))
                }, matchWrap().apply { topMargin = dp(4) })
            }, LinearLayout.LayoutParams(0, wrap(), 1f).apply { leftMargin = dp(14) })

            if (!row.badge.isNullOrBlank()) {
                addView(TextView(context).apply {
                    text = row.badge
                    textSize = 11f
                    typeface = brandBold()
                    gravity = Gravity.CENTER
                    setTextColor(color("#0084CC"))
                    background = roundDrawable("#F0FAFF", 999)
                    setPadding(dp(10), dp(5), dp(10), dp(5))
                })
            } else {
                addView(TextView(context).apply {
                    text = "›"
                    textSize = 24f
                    gravity = Gravity.CENTER
                    setTextColor(color("#AEAEA8"))
                }, LinearLayout.LayoutParams(dp(18), match()))
            }
        }
    }

    private fun buildBottomNav(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            background = roundDrawable("#FFFFFF", 0, "#E8E8E4")
            listOf(
                BottomItem("홈", MenuIcon.HOME) { openWebPath("/home") },
                BottomItem("일정", MenuIcon.CALENDAR) { startActivity(Intent(this@NativeMyMenuActivity, NativeScheduleListActivity::class.java)); finish() },
                BottomItem("공간", MenuIcon.SPACE) { startActivity(Intent(this@NativeMyMenuActivity, NativeSpaceActivity::class.java)); finish() },
                BottomItem("가계부", MenuIcon.BUDGET) { startActivity(Intent(this@NativeMyMenuActivity, NativeBudgetActivity::class.java)); finish() },
                BottomItem("전체", MenuIcon.MENU) {},
            ).forEachIndexed { index, item ->
                addView(buildBottomItem(item, index == 4), LinearLayout.LayoutParams(0, match(), 1f))
            }
        }
    }

    private fun buildBottomItem(item: BottomItem, active: Boolean): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setOnClickListener { item.action() }
            addView(View(context).apply {
                background = if (active) roundDrawable("#0084CC", 999) else null
            }, LinearLayout.LayoutParams(dp(28), dp(3)).apply { bottomMargin = dp(5) })
            addView(MenuIconView(context, item.icon, if (active) color("#0084CC") else color("#8E8E93")), LinearLayout.LayoutParams(dp(20), dp(20)))
            addView(TextView(context).apply {
                text = item.label
                textSize = 10f
                typeface = if (active) brandBold() else brandRegular()
                includeFontPadding = false
                setTextColor(if (active) color("#0084CC") else color("#8E8E93"))
            }, matchWrap().apply { topMargin = dp(3) })
        }
    }

    private fun biometricSubtitle(): String {
        if (isBiometricLockEnabled()) return "앱 잠금 사용 중 · ${relockIntervalLabel(getBiometricRelockInterval())}"
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return "이 기기는 생체인증을 지원하지 않아요"
        val keyguard = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
        val secure = keyguard.isDeviceSecure
        if (!secure) return "기기 잠금 설정이 필요해요"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val manager = getSystemService(BiometricManager::class.java)
            return if (manager?.canAuthenticate() == BiometricManager.BIOMETRIC_SUCCESS) "지문 또는 기기 잠금 사용 가능" else "기기 잠금으로 보호 가능"
        }
        return if (packageManager.hasSystemFeature(PackageManager.FEATURE_FINGERPRINT)) "지문 인증 사용 가능" else "기기 잠금 설정 확인 필요"
    }

    private fun biometricBadge(): String = if (isBiometricLockEnabled()) "켜짐" else if (biometricSubtitle().contains("가능")) "가능" else "확인"

    private fun showBiometricSettings() {
        val enabled = isBiometricLockEnabled()
        val available = isBiometricAvailableForLock()
        val title = if (enabled) "생체인증 보안" else "앱 잠금 설정"
        val message = if (available) {
            "앱을 다시 열거나 보호 구간에 접근할 때 지문 또는 기기 잠금으로 확인합니다."
        } else {
            "이 기능을 사용하려면 먼저 Android 기기 잠금 또는 지문을 설정해야 합니다."
        }

        val items = if (enabled) {
            arrayOf("앱 잠금 끄기", "재잠금: 항상", "재잠금: 5분 후", "재잠금: 15분 후", "재잠금: 30분 후", "기기 보안 설정 열기")
        } else {
            arrayOf("앱 잠금 켜기", "기기 보안 설정 열기")
        }

        AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setItems(items) { _, which ->
                if (enabled) {
                    when (which) {
                        0 -> setBiometricLock(false)
                        1 -> setBiometricRelockInterval("always")
                        2 -> setBiometricRelockInterval("5m")
                        3 -> setBiometricRelockInterval("15m")
                        4 -> setBiometricRelockInterval("30m")
                        5 -> startActivity(Intent(Settings.ACTION_SECURITY_SETTINGS))
                    }
                } else {
                    when (which) {
                        0 -> if (available) setBiometricLock(true) else startActivity(Intent(Settings.ACTION_SECURITY_SETTINGS))
                        1 -> startActivity(Intent(Settings.ACTION_SECURITY_SETTINGS))
                    }
                }
            }
            .setNegativeButton("닫기", null)
            .show()
    }

    private fun calendarSettingsSubtitle(): String {
        if (!hasCalendarPermission()) return "기기 캘린더 권한을 허용해 주세요"
        if (!isCalendarSyncEnabled()) return "권한 허용됨 · 동기화 꺼짐"
        return selectedCalendarName()?.let { "선택됨 · $it" } ?: "캘린더를 선택해 주세요"
    }

    private fun calendarSettingsBadge(): String = when {
        !hasCalendarPermission() -> "설정"
        isCalendarSyncEnabled() -> "켜짐"
        else -> "꺼짐"
    }

    private fun hasCalendarPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CALENDAR) == PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_CALENDAR) == PackageManager.PERMISSION_GRANTED

    private fun showCalendarSettings() {
        if (!hasCalendarPermission()) {
            requestCalendarPermission()
            return
        }

        val calendars = queryWritableCalendars()
        if (calendars.isEmpty()) {
            AlertDialog.Builder(this)
                .setTitle("캘린더 설정")
                .setMessage("쓰기 가능한 기기 캘린더를 찾지 못했어요. Google 캘린더 또는 기기 캘린더 계정을 먼저 확인해 주세요.")
                .setPositiveButton("확인", null)
                .show()
            return
        }

        val selectedId = selectedCalendarId()
        val checkedIndex = calendars.indexOfFirst { it.id == selectedId }.takeIf { it >= 0 } ?: 0
        AlertDialog.Builder(this)
            .setTitle("캘린더 선택")
            .setSingleChoiceItems(calendars.map { "${it.name}\n${it.accountName}" }.toTypedArray(), checkedIndex) { dialog, which ->
                setSelectedCalendar(calendars[which])
                dialog.dismiss()
            }
            .setNeutralButton("동기화 끄기") { _, _ ->
                nativePrefs().edit()
                    .putString(CALENDAR_ENABLED_KEY, "false")
                    .apply()
                message = "기기 캘린더 동기화를 껐어요."
                render()
            }
            .setNegativeButton("닫기", null)
            .show()
    }

    private fun requestCalendarPermission() {
        if (hasCalendarPermission()) {
            message = "캘린더 권한이 이미 허용되어 있어요."
            render()
            return
        }
        ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR), CALENDAR_PERMISSION_REQUEST)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == CALENDAR_PERMISSION_REQUEST) {
            message = if (hasCalendarPermission()) "캘린더 권한이 허용되었어요." else "캘린더 권한이 필요해요."
            render()
        }
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

    private fun isBiometricLockEnabled(): Boolean = nativePrefs().getString(BIOMETRIC_LOCK_ENABLED_KEY, "false") == "true"

    private fun setBiometricLock(enabled: Boolean) {
        nativePrefs().edit()
            .putString(BIOMETRIC_LOCK_ENABLED_KEY, if (enabled) "true" else "false")
            .putString(BIOMETRIC_PROMPT_SEEN_KEY, "true")
            .putString(BIOMETRIC_LOCK_SCOPES_KEY, "[\"app\"]")
            .putString(BIOMETRIC_UNLOCKED_AT_KEY, System.currentTimeMillis().toString())
            .apply()
        message = if (enabled) "생체인증 앱 잠금을 켰어요." else "생체인증 앱 잠금을 껐어요."
        render()
    }

    private fun getBiometricRelockInterval(): String =
        nativePrefs().getString(BIOMETRIC_RELOCK_INTERVAL_KEY, "always") ?: "always"

    private fun setBiometricRelockInterval(interval: String) {
        nativePrefs().edit().putString(BIOMETRIC_RELOCK_INTERVAL_KEY, interval).apply()
        message = "재잠금 기준을 ${relockIntervalLabel(interval)}로 변경했어요."
        render()
    }

    private fun relockIntervalLabel(interval: String): String = when (interval) {
        "5m" -> "5분 후"
        "15m" -> "15분 후"
        "30m" -> "30분 후"
        else -> "항상"
    }

    private fun queryWritableCalendars(): List<DeviceCalendarRow> {
        if (!hasCalendarPermission()) return emptyList()
        val projection = arrayOf(
            CalendarContract.Calendars._ID,
            CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
            CalendarContract.Calendars.ACCOUNT_NAME,
            CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL,
            CalendarContract.Calendars.VISIBLE,
        )
        return runCatching {
            contentResolver.query(
                CalendarContract.Calendars.CONTENT_URI,
                projection,
                null,
                null,
                "${CalendarContract.Calendars.CALENDAR_DISPLAY_NAME} ASC",
            )?.use { cursor ->
                val idIndex = cursor.getColumnIndexOrThrow(CalendarContract.Calendars._ID)
                val nameIndex = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME)
                val accountIndex = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.ACCOUNT_NAME)
                val accessIndex = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL)
                val visibleIndex = cursor.getColumnIndexOrThrow(CalendarContract.Calendars.VISIBLE)
                buildList {
                    while (cursor.moveToNext()) {
                        val access = cursor.getInt(accessIndex)
                        val visible = cursor.getInt(visibleIndex) == 1
                        val canWrite = access >= CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR
                        if (visible && canWrite) {
                            add(DeviceCalendarRow(
                                id = cursor.getLong(idIndex).toString(),
                                name = cursor.getString(nameIndex).orEmpty().ifBlank { "기기 캘린더" },
                                accountName = cursor.getString(accountIndex).orEmpty(),
                            ))
                        }
                    }
                }
            }.orEmpty()
        }.getOrElse { emptyList() }
    }

    private fun selectedCalendarId(): String? = nativePrefs().getString(SELECTED_CALENDAR_KEY, null)

    private fun selectedCalendarName(): String? {
        val id = selectedCalendarId() ?: return null
        return queryWritableCalendars().firstOrNull { it.id == id }?.name
    }

    private fun isCalendarSyncEnabled(): Boolean = nativePrefs().getString(CALENDAR_ENABLED_KEY, "false") == "true"

    private fun setSelectedCalendar(calendar: DeviceCalendarRow) {
        nativePrefs().edit()
            .putString(CALENDAR_ENABLED_KEY, "true")
            .putString(SELECTED_CALENDAR_KEY, calendar.id)
            .apply()
        Toast.makeText(this, "${calendar.name} 캘린더를 선택했어요.", Toast.LENGTH_SHORT).show()
        message = "기기 캘린더 동기화를 켰어요."
        render()
    }

    private fun logout() {
        SessionManager.clear(this)
        startActivity(Intent(this, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        })
        finish()
    }

    private fun openWebPath(path: String) {
        startActivity(Intent(this, MainActivity::class.java).apply { putExtra("start_path", path) })
        finish()
    }

    private fun iconBg(icon: MenuIcon): String = when (icon) {
        MenuIcon.LOCK, MenuIcon.KEY -> "#EEF2FF"
        MenuIcon.CALENDAR, MenuIcon.BELL -> "#F0FAFF"
        MenuIcon.SUN, MenuIcon.GRID -> "#E6FFFA"
        MenuIcon.LOGOUT -> "#FFF1F2"
        else -> "#F8FAFC"
    }

    private fun iconColor(icon: MenuIcon): String = when (icon) {
        MenuIcon.LOCK, MenuIcon.KEY -> "#6366F1"
        MenuIcon.CALENDAR, MenuIcon.BELL -> "#0084CC"
        MenuIcon.SUN, MenuIcon.GRID -> "#0CC9B5"
        MenuIcon.LOGOUT -> "#EF4444"
        else -> "#1A1B2E"
    }

    private fun brandRegular(): Typeface = Typeface.create("sans-serif", Typeface.NORMAL)
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
        GradientDrawable(GradientDrawable.Orientation.TL_BR, intArrayOf(color(start), color(end))).apply {
            cornerRadius = dp(radius).toFloat()
        }

    companion object {
        private const val HOME_SUMMARY_URL = "https://www.gleaum.com/api/native/home-summary"
        private const val CALENDAR_PERMISSION_REQUEST = 9001
        private const val CAPACITOR_PREFS_NAME = "CapacitorStorage"
        private const val CALENDAR_ENABLED_KEY = "gleaum:calendar-sync-enabled"
        private const val SELECTED_CALENDAR_KEY = "gleaum:calendar-sync-calendar-id"
        private const val BIOMETRIC_LOCK_ENABLED_KEY = "gleaum:biometric-lock-enabled"
        private const val BIOMETRIC_PROMPT_SEEN_KEY = "gleaum:biometric-lock-prompt-seen"
        private const val BIOMETRIC_UNLOCKED_AT_KEY = "gleaum:biometric-unlocked-at"
        private const val BIOMETRIC_LOCK_SCOPES_KEY = "gleaum:biometric-lock-scopes"
        private const val BIOMETRIC_RELOCK_INTERVAL_KEY = "gleaum:biometric-relock-interval"
    }

    private fun nativePrefs(): SharedPreferences = getSharedPreferences(CAPACITOR_PREFS_NAME, Context.MODE_PRIVATE)
}

private data class DeviceCalendarRow(
    val id: String,
    val name: String,
    val accountName: String,
)

private data class MenuRow(
    val title: String,
    val subtitle: String,
    val icon: MenuIcon,
    val badge: String?,
    val action: () -> Unit,
)

private data class BottomItem(
    val label: String,
    val icon: MenuIcon,
    val action: () -> Unit,
)

private enum class MenuIcon {
    HOME, CALENDAR, SPACE, BUDGET, MENU, BELL, SUN, GRID, LOCK, KEY, USER, DOC, INFO, LOGOUT
}

private class MenuIconView(
    context: Context,
    private val icon: MenuIcon,
    iconColor: Int,
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
        val left = w * 0.17f
        val right = w * 0.83f
        val top = h * 0.17f
        val bottom = h * 0.83f
        val midX = w / 2f
        val midY = h / 2f
        when (icon) {
            MenuIcon.HOME -> drawHome(canvas, left, right, top, bottom, midX)
            MenuIcon.CALENDAR -> drawCalendar(canvas, left, right, top, bottom, w, h)
            MenuIcon.SPACE -> drawSpace(canvas, left, right, top, bottom, midX, midY)
            MenuIcon.BUDGET -> drawBudget(canvas, left, right, top, bottom)
            MenuIcon.MENU -> drawMenu(canvas, w, h)
            MenuIcon.BELL -> drawBell(canvas, w, h)
            MenuIcon.SUN -> drawSun(canvas, midX, midY, w)
            MenuIcon.GRID -> drawGrid(canvas, left, top, w)
            MenuIcon.LOCK -> drawLock(canvas, left, right, top, bottom, w, h)
            MenuIcon.KEY -> drawKey(canvas, w, h)
            MenuIcon.USER -> drawUser(canvas, w, h, midX)
            MenuIcon.DOC -> drawDoc(canvas, left, right, top, bottom)
            MenuIcon.INFO -> drawInfo(canvas, midX, midY, w)
            MenuIcon.LOGOUT -> drawLogout(canvas, w, h)
        }
    }

    private fun drawHome(canvas: Canvas, left: Float, right: Float, top: Float, bottom: Float, midX: Float) {
        val path = Path().apply { moveTo(left, bottom * 0.58f); lineTo(midX, top); lineTo(right, bottom * 0.58f); lineTo(right, bottom); lineTo(left, bottom); close() }
        canvas.drawPath(path, paint)
    }
    private fun drawCalendar(canvas: Canvas, left: Float, right: Float, top: Float, bottom: Float, w: Float, h: Float) {
        canvas.drawRoundRect(RectF(left, top + h * 0.06f, right, bottom), w * 0.08f, w * 0.08f, paint)
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
    private fun drawBell(canvas: Canvas, w: Float, h: Float) {
        val bell = Path().apply {
            moveTo(w * 0.72f, h * 0.72f); lineTo(w * 0.28f, h * 0.72f)
            cubicTo(w * 0.34f, h * 0.62f, w * 0.36f, h * 0.50f, w * 0.36f, h * 0.38f)
            cubicTo(w * 0.36f, h * 0.18f, w * 0.64f, h * 0.18f, w * 0.64f, h * 0.38f)
            cubicTo(w * 0.64f, h * 0.50f, w * 0.66f, h * 0.62f, w * 0.72f, h * 0.72f)
        }
        canvas.drawPath(bell, paint)
        canvas.drawArc(RectF(w * 0.42f, h * 0.72f, w * 0.58f, h * 0.88f), 18f, 144f, false, paint)
    }
    private fun drawSun(canvas: Canvas, midX: Float, midY: Float, w: Float) { canvas.drawCircle(midX, midY, w * 0.18f, paint) }
    private fun drawGrid(canvas: Canvas, left: Float, top: Float, w: Float) {
        val size = w * 0.18f
        listOf(0f, 0.32f).forEach { row -> listOf(0f, 0.32f).forEach { col -> canvas.drawRoundRect(RectF(left + w * col, top + w * row, left + w * col + size, top + w * row + size), 3f, 3f, paint) } }
    }
    private fun drawLock(canvas: Canvas, left: Float, right: Float, top: Float, bottom: Float, w: Float, h: Float) {
        canvas.drawRoundRect(RectF(left, h * 0.44f, right, bottom), w * 0.08f, w * 0.08f, paint)
        canvas.drawArc(RectF(w * 0.32f, top, w * 0.68f, h * 0.58f), 200f, 140f, false, paint)
    }
    private fun drawKey(canvas: Canvas, w: Float, h: Float) {
        canvas.drawCircle(w * 0.35f, h * 0.42f, w * 0.15f, paint)
        canvas.drawLine(w * 0.48f, h * 0.52f, w * 0.78f, h * 0.78f, paint)
        canvas.drawLine(w * 0.68f, h * 0.68f, w * 0.78f, h * 0.58f, paint)
    }
    private fun drawUser(canvas: Canvas, w: Float, h: Float, midX: Float) {
        canvas.drawCircle(midX, h * 0.31f, w * 0.14f, paint)
        canvas.drawArc(RectF(w * 0.28f, h * 0.52f, w * 0.72f, h * 0.90f), 205f, 130f, false, paint)
    }
    private fun drawDoc(canvas: Canvas, left: Float, right: Float, top: Float, bottom: Float) {
        canvas.drawRoundRect(RectF(left, top, right, bottom), 5f, 5f, paint)
        canvas.drawLine(left + width * 0.16f, top + height * 0.28f, right - width * 0.12f, top + height * 0.28f, paint)
        canvas.drawLine(left + width * 0.16f, top + height * 0.46f, right - width * 0.12f, top + height * 0.46f, paint)
    }
    private fun drawInfo(canvas: Canvas, midX: Float, midY: Float, w: Float) {
        canvas.drawCircle(midX, midY, w * 0.32f, paint)
        canvas.drawPoint(midX, midY - w * 0.12f, paint)
        canvas.drawLine(midX, midY, midX, midY + w * 0.16f, paint)
    }
    private fun drawLogout(canvas: Canvas, w: Float, h: Float) {
        canvas.drawLine(w * 0.18f, h * 0.50f, w * 0.68f, h * 0.50f, paint)
        canvas.drawLine(w * 0.52f, h * 0.34f, w * 0.70f, h * 0.50f, paint)
        canvas.drawLine(w * 0.52f, h * 0.66f, w * 0.70f, h * 0.50f, paint)
        canvas.drawArc(RectF(w * 0.12f, h * 0.18f, w * 0.70f, h * 0.82f), 110f, 140f, false, paint)
    }
}
