package com.gleaum.app

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
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
import android.widget.Toast
import android.app.AlertDialog
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import com.gleaum.app.ui.components.GleaumDestination
import com.gleaum.app.ui.components.GleaumScaffold
import com.gleaum.app.ui.screens.space.ComposeSpaceScreen
import com.gleaum.app.ui.screens.space.SpaceManageAction
import com.gleaum.app.ui.theme.GleaumTheme

class NativeSpaceActivity : AppCompatActivity() {
    private var summary: NativeSpaceSummary? = null
    private var loading = true
    private var errorMessage: String? = null
    private var pendingInviteCode: String? = null
    private var invitePromptShown = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        pendingInviteCode = intent.getStringExtra("invite_code")?.trim()?.uppercase()?.takeIf { it.isNotBlank() }
        applyLightSystemBars()
        render()
        loadSummary()
    }

    private fun applyLightSystemBars() {
        NativeTheme.applySystemBars(window, this)
    }

    override fun onResume() {
        super.onResume()
        applyLightSystemBars()
    }

    private fun loadSummary(force: Boolean = false) {
        if (!force) {
            NativeAppDataCache.spaces?.let {
                summary = it
                loading = false
                errorMessage = null
                render()
                showPendingInviteIfNeeded()
                return
            }
        }
        loading = true
        errorMessage = null
        render()
        Thread {
            try {
                val loaded = NativeSpaceApi.summary(this)
                runOnUiThread {
                    NativeAppDataCache.spaces = loaded
                    summary = loaded
                    loading = false
                    render()
                    showPendingInviteIfNeeded()
                }
            } catch (e: Exception) {
                runOnUiThread { loading = false; errorMessage = friendlyError(e.message); render() }
            }
        }.start()
    }

    private fun render() {
        if (NativePortFlags.ENABLE_COMPOSE_SPACE) {
            renderComposeSpace()
            return
        }
        setContentView(buildScreen())
    }

    @OptIn(ExperimentalMaterial3Api::class)
    private fun renderComposeSpace() {
        setContent {
            GleaumTheme {
                GleaumScaffold(
                    title = "공간",
                    selectedDestination = GleaumDestination.SPACE,
                    onDestinationSelected = ::handleComposeDestination,
                    onNotificationClick = { startActivity(Intent(this, NativeNotificationActivity::class.java)) },
                    onFabClick = null,
                ) { innerPadding ->
                    PullToRefreshBox(
                        isRefreshing = loading && summary != null,
                        onRefresh = { loadSummary(force = true) },
                    ) {
                      ComposeSpaceScreen(
                        innerPadding = innerPadding,
                        summary = summary,
                        canManageSpaces = accountCapabilities().canManageSpaces,
                        canInviteMembers = accountCapabilities().canInviteMembers,
                        loading = loading,
                        errorMessage = errorMessage,
                        onRetry = { loadSummary(force = true) },
                        onCopyInviteCode = { code -> copyInviteCode(code) },
                        onSpaceClick = { space -> activateSpace(space) },
                        onMemberClick = { member -> showMemberActions(member) },
                        onManageAction = { action -> handleSpaceManageAction(action) },
                        onCreatePost = { content -> createPost(content) },
                        onCreateSchedule = { startActivity(Intent(this@NativeSpaceActivity, NativeScheduleCreateActivity::class.java)) },
                        onOpenSchedule = { scheduleId ->
                            startActivity(Intent(this@NativeSpaceActivity, NativeScheduleDetailActivity::class.java).putExtra("schedule_id", scheduleId))
                        },
                      )
                    }
                }
            }
        }
    }

    private fun handleComposeDestination(destination: GleaumDestination) {
        when (destination) {
            GleaumDestination.HOME -> { startActivity(Intent(this, NativeHomePortActivity::class.java)); finish() }
            GleaumDestination.SCHEDULES -> { startActivity(Intent(this, NativeScheduleListActivity::class.java)); finish() }
            GleaumDestination.SPACE -> Unit
            GleaumDestination.BUDGET -> { startActivity(Intent(this, NativeBudgetActivity::class.java)); finish() }
            GleaumDestination.MENU -> { startActivity(Intent(this, NativeMyMenuActivity::class.java)); finish() }
        }
    }

    private fun activateSpace(space: NativeSpaceItem) {
        if (space.isActive) return
        loading = true
        errorMessage = null
        render()
        Thread {
            try {
                val updated = NativeSpaceApi.activate(this, space.id)
                runOnUiThread {
                    summary = updated
                    loading = false
                    render()
                    toast("${space.name} 공간으로 전환했습니다.")
                }
            } catch (error: Exception) {
                runOnUiThread {
                    loading = false
                    errorMessage = friendlyError(error.message)
                    render()
                }
            }
        }.start()
    }

    private fun createPost(content: String) {
        val activeSpaceId = summary?.activeSpace?.id ?: return
        Thread {
            try {
                val updated = NativeSpaceApi.createPost(this, activeSpaceId, content)
                runOnUiThread {
                    summary = updated
                    render()
                    toast("공간에 소식을 공유했습니다.")
                }
            } catch (error: Exception) {
                runOnUiThread {
                    toast(friendlyError(error.message))
                }
            }
        }.start()
    }

    private fun handleSpaceManageAction(action: SpaceManageAction) {
        val active = summary?.activeSpace
        val canManage = active?.role == "admin"
        val capabilities = accountCapabilities()
        when (action) {
            SpaceManageAction.JOIN -> if (capabilities.canInviteMembers) showJoinSpaceDialog() else toast("보호자가 관리하는 계정에서는 공간에 참여할 수 없어요.")
            SpaceManageAction.CREATE -> if (capabilities.canManageSpaces) showCreateSpaceDialog() else toast("보호자가 관리하는 계정에서는 공간을 만들 수 없어요.")
            SpaceManageAction.RENAME -> if (capabilities.canManageSpaces && canManage) showRenameDialog() else toast("공간 지기만 수정할 수 있어요.")
            SpaceManageAction.REGENERATE_INVITE -> {
                if (!capabilities.canInviteMembers) toast("보호자가 관리하는 계정에서는 초대 코드를 관리할 수 없어요.")
                else if (active?.isPersonal == true) toast("개인 공간은 초대할 수 없어요.")
                else if (canManage) confirmRegenerateInviteCode()
                else toast("공간 지기만 초대 코드를 관리할 수 있어요.")
            }
            SpaceManageAction.CONVERT_TO_FAMILY -> {
                when {
                    !capabilities.canManageSpaces -> toast("보호자가 관리하는 계정에서는 공간 설정을 변경할 수 없어요.")
                    active == null || !canManage -> toast("공간 지기만 가족 공간으로 전환할 수 있어요.")
                    active.isPersonal -> toast("개인 공간은 가족 공간으로 전환할 수 없어요.")
                    active.spaceKind == "family" -> toast("이미 가족 공간으로 사용 중이에요.")
                    else -> confirmConvertToFamily(active)
                }
            }
            SpaceManageAction.DELETE -> {
                when {
                    !capabilities.canManageSpaces -> toast("보호자가 관리하는 계정에서는 공간을 삭제할 수 없어요.")
                    active == null || !canManage -> toast("공간 지기만 공간을 삭제할 수 있어요.")
                    active.isPersonal -> toast("개인 공간은 삭제할 수 없어요.")
                    active.memberCount > 1 -> toast("다른 멤버를 모두 내보낸 뒤 삭제해 주세요.")
                    else -> confirmDeleteSpace(active)
                }
            }
            SpaceManageAction.ADVANCED -> if (capabilities.canManageSpaces) showAdvancedSpaceDialog() else toast("보호자가 관리하는 계정에서는 공간 설정을 변경할 수 없어요.")
        }
    }

    private fun buildScreen(): FrameLayout = FrameLayout(this).apply {
        setBackgroundColor(color("#FAFAFD"))
        addView(ScrollView(context).apply {
            overScrollMode = View.OVER_SCROLL_NEVER
            addView(LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(NativeAdaptive.pagePaddingDp(this@NativeSpaceActivity)), statusBarHeight() + dp(76), dp(NativeAdaptive.pagePaddingDp(this@NativeSpaceActivity)), dp(if (NativeAdaptive.isLarge(this@NativeSpaceActivity)) 104 else 88))
                if (loading) {
                    addView(loadingCard(), matchWrap())
                } else if (errorMessage != null) {
                    addView(messageCard(errorMessage ?: "공간 정보를 불러오지 못했어요."), matchWrap())
                } else {
                    addView(heroCard(), matchWrap())
                    addView(sectionTitle("내 공간"), matchWrap().apply { topMargin = dp(22) })
                    addView(spaceList(), matchWrap().apply { topMargin = dp(10) })
                    addView(sectionTitle("공간 멤버"), matchWrap().apply { topMargin = dp(22) })
                    addView(memberList(), matchWrap().apply { topMargin = dp(10) })
                    if (accountCapabilities().canManageSpaces || accountCapabilities().canInviteMembers) {
                        addView(sectionTitle("공간 관리"), matchWrap().apply { topMargin = dp(22) })
                        addView(manageGroup(), matchWrap().apply { topMargin = dp(10) })
                    }
                }
            }, NativeAdaptive.scrollChildParams(this@NativeSpaceActivity))
        }, FrameLayout.LayoutParams(match(), match()))
        addView(header(), FrameLayout.LayoutParams(match(), statusBarHeight() + dp(64), Gravity.TOP))
        addView(NativeBottomNav.create(this@NativeSpaceActivity, NativeBottomDestination.SPACE), NativeAdaptive.bottomNavParams(this@NativeSpaceActivity, dp(if (NativeAdaptive.isLarge(this@NativeSpaceActivity)) 64 else 56)))
    }

    private fun header(): FrameLayout = FrameLayout(this).apply {
        setBackgroundColor(color("#FAFAFD"))
        elevation = dp(2).toFloat()
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(if (NativeAdaptive.isLarge(this@NativeSpaceActivity)) 0 else dp(20), 0, if (NativeAdaptive.isLarge(this@NativeSpaceActivity)) 0 else dp(20), 0)
            addView(ImageView(context).apply {
                setImageResource(R.drawable.gleaum_logo_native)
                scaleType = ImageView.ScaleType.FIT_CENTER
            }, LinearLayout.LayoutParams(dp(34), dp(34)))
            addView(TextView(context).apply {
                text = "공간"
                textSize = 27f
                typeface = bold()
                setTextColor(NativeTheme.text(context))
            }, matchWrap().apply { leftMargin = dp(12) })
            addView(View(context), LinearLayout.LayoutParams(0, 1, 1f))
            addView(TextView(context).apply {
                text = "+"
                textSize = 28f
                typeface = bold()
                gravity = Gravity.CENTER
                setTextColor(Color.WHITE)
                background = round("#0084CC", 26, null)
                setOnClickListener { showCreateSpaceDialog() }
            }, LinearLayout.LayoutParams(dp(52), dp(52)))
        }, NativeAdaptive.headerContentParams(this@NativeSpaceActivity, dp(54), dp(20), dp(0)).apply { gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL })
    }

    private fun heroCard(): LinearLayout = LinearLayout(this).apply {
        val active = summary?.activeSpace
        orientation = LinearLayout.VERTICAL
        setPadding(dp(24), dp(24), dp(24), dp(22))
        background = gradient("#1A1B2E", "#2D2E4A", 28)
        elevation = dp(8).toFloat()
        addView(TextView(context).apply {
            text = if (active?.isPersonal == true) "PERSONAL SPACE" else "SHARED SPACE"
            textSize = 12f
            typeface = bold()
            letterSpacing = 0.08f
            setTextColor(color("#0CC9B5"))
        })
        addView(TextView(context).apply {
            text = active?.name ?: "나의 공간"
            textSize = 28f
            typeface = bold()
            setTextColor(Color.WHITE)
        }, matchWrap().apply { topMargin = dp(10) })
        addView(TextView(context).apply {
            text = if (active?.isPersonal == true) "개인 일정과 가계부가 안전하게 분리되는 기본 공간입니다." else "함께하는 사람들과 일정과 소식을 나누는 공간입니다."
            textSize = 13f
            typeface = medium()
            setTextColor(colorWithAlpha("#FFFFFF", 0.64f))
        }, matchWrap().apply { topMargin = dp(8) })
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            addView(heroStat("멤버", "${active?.memberCount ?: 0}명"), LinearLayout.LayoutParams(0, dp(76), 1f))
            addView(heroStat("내 역할", roleLabel(active?.role)), LinearLayout.LayoutParams(0, dp(76), 1f).apply { leftMargin = dp(12) })
        }, matchWrap().apply { topMargin = dp(20) })
        if (active?.inviteCode != null) {
            addView(inviteCodeBox(active.inviteCode), matchWrap().apply { topMargin = dp(16) })
        }
    }

    private fun heroStat(label: String, value: String): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER
        background = round("#29334F", 20, "#35415F")
        addView(TextView(context).apply { text = value; textSize = 22f; typeface = bold(); setTextColor(color("#2EE895")) })
        addView(TextView(context).apply { text = label; textSize = 12f; typeface = medium(); setTextColor(colorWithAlpha("#FFFFFF", 0.62f)) }, matchWrap().apply { topMargin = dp(4) })
    }

    private fun inviteCodeBox(code: String): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(18), dp(16), dp(14), dp(16))
        background = round("#FFFFFF", 22, "#FFFFFF")
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            addView(TextView(context).apply { text = "초대 코드"; textSize = 11f; typeface = bold(); letterSpacing = 0.08f; setTextColor(NativeTheme.muted(context)) })
            addView(TextView(context).apply { text = code; textSize = 22f; typeface = bold(); letterSpacing = 0.12f; setTextColor(color("#0CC9B5")) }, matchWrap().apply { topMargin = dp(4) })
        }, LinearLayout.LayoutParams(0, wrap(), 1f))
        addView(TextView(context).apply {
            text = "복사"
            textSize = 13f
            typeface = bold()
            gravity = Gravity.CENTER
            setTextColor(Color.WHITE)
            background = round("#0084CC", 999, null)
            setOnClickListener { copyInviteCode(code) }
        }, LinearLayout.LayoutParams(dp(68), dp(40)))
    }

    private fun spaceList(): LinearLayout = cardGroup().apply {
        val spaces = summary?.spaces.orEmpty()
        if (spaces.isEmpty()) {
            addView(emptyText("아직 연결된 공간이 없어요."), matchWrap())
        } else {
            spaces.forEachIndexed { index, space ->
                addView(spaceRow(space), matchWrap())
                if (index != spaces.lastIndex) addView(divider(), matchWrap().apply { leftMargin = dp(64) })
            }
        }
    }

    private fun spaceRow(space: NativeSpaceItem): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(16), dp(14), dp(16), dp(14))
        addView(TextView(context).apply {
            text = if (space.isPersonal) "나" else "함께"
            textSize = 12f
            typeface = bold()
            gravity = Gravity.CENTER
            setTextColor(color(if (space.isPersonal) "#0CC9B5" else "#0084CC"))
            background = round(if (space.isPersonal) "#E6FAF7" else "#EAF6FD", 18, null)
        }, LinearLayout.LayoutParams(dp(48), dp(48)))
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            addView(TextView(context).apply { text = space.name; textSize = 16f; typeface = bold(); setTextColor(NativeTheme.text(context)) })
            addView(TextView(context).apply { text = "${space.memberCount}명 · ${roleLabel(space.role)}"; textSize = 12f; typeface = medium(); setTextColor(NativeTheme.muted(context)) }, matchWrap().apply { topMargin = dp(3) })
        }, LinearLayout.LayoutParams(0, wrap(), 1f).apply { leftMargin = dp(12) })
        if (space.isActive) {
            addView(TextView(context).apply { text = "현재"; textSize = 11f; typeface = bold(); gravity = Gravity.CENTER; setTextColor(color("#0084CC")); background = round("#EAF6FD", 999, null) }, LinearLayout.LayoutParams(dp(52), dp(28)))
        }
    }

    private fun memberList(): LinearLayout = cardGroup().apply {
        val members = summary?.members.orEmpty()
        if (members.isEmpty()) {
            addView(emptyText("이 공간에 표시할 멤버가 없어요."), matchWrap())
        } else {
            members.forEachIndexed { index, member ->
                addView(memberRow(member), matchWrap())
                if (index != members.lastIndex) addView(divider(), matchWrap().apply { leftMargin = dp(64) })
            }
        }
    }

    private fun memberRow(member: NativeSpaceMember): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(16), dp(14), dp(16), dp(14))
        val active = summary?.activeSpace
        if (active?.role == "admin" && active.isPersonal.not() && !member.isMe) {
            setOnClickListener { showMemberActions(member) }
        }
        addView(TextView(context).apply {
            text = member.displayName.take(1).ifBlank { "?" }
            textSize = 18f
            typeface = bold()
            gravity = Gravity.CENTER
            setTextColor(NativeTheme.text(context))
            background = round("#F0FBF8", 18, null)
        }, LinearLayout.LayoutParams(dp(48), dp(48)))
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            addView(TextView(context).apply { text = member.displayName + if (member.isMe) " (나)" else ""; textSize = 15f; typeface = bold(); setTextColor(NativeTheme.text(context)) })
            addView(TextView(context).apply { text = member.email.ifBlank { roleLabel(member.role) }; textSize = 12f; typeface = medium(); setTextColor(NativeTheme.muted(context)) }, matchWrap().apply { topMargin = dp(3) })
        }, LinearLayout.LayoutParams(0, wrap(), 1f).apply { leftMargin = dp(12) })
        addView(TextView(context).apply { text = roleLabel(member.role); textSize = 11f; typeface = bold(); gravity = Gravity.CENTER; setTextColor(color("#0084CC")); background = round("#EAF6FD", 999, null) }, LinearLayout.LayoutParams(dp(74), dp(28)))
    }

    private fun manageGroup(): LinearLayout = cardGroup().apply {
        val active = summary?.activeSpace
        val canManage = active?.role == "admin"
        val capabilities = accountCapabilities()
        val rows = mutableListOf<View>()
        if (capabilities.canInviteMembers) rows += manageRow("공간 참여하기", "초대 코드로 다른 공간에 입장합니다") { showJoinSpaceDialog() }
        if (capabilities.canManageSpaces) {
            rows += manageRow("새 공간 만들기", "친구, 연인, 가족과 함께할 공간을 만듭니다") { showCreateSpaceDialog() }
            rows += manageRow("공간 이름 변경", if (canManage) "현재 공간의 이름을 바로 수정합니다" else "공간 지기만 수정할 수 있어요") {
                if (canManage) showRenameDialog() else toast("공간 지기만 수정할 수 있어요.")
            }
        }
        if (capabilities.canInviteMembers) rows += manageRow("초대 코드 새로 만들기", if (active?.isPersonal == true) "개인 공간은 초대할 수 없어요" else "기존 코드는 새 코드로 교체됩니다") {
            if (active?.isPersonal == true) toast("개인 공간은 초대할 수 없어요.")
            else if (canManage) confirmRegenerateInviteCode()
            else toast("공간 지기만 초대 코드를 관리할 수 있어요.")
        }
        if (capabilities.canManageSpaces) rows += manageRow("고급 설정", "공간 관리 상태와 지원 항목을 확인합니다") { showAdvancedSpaceDialog() }
        rows.forEachIndexed { index, row ->
            if (index > 0) addView(divider(), matchWrap().apply { leftMargin = dp(16) })
            addView(row, matchWrap())
        }
    }

    private fun manageRow(title: String, subtitle: String, action: () -> Unit): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        setPadding(dp(16), dp(14), dp(16), dp(14))
        setOnClickListener { action() }
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            addView(TextView(context).apply { text = title; textSize = 15f; typeface = bold(); setTextColor(NativeTheme.text(context)) })
            addView(TextView(context).apply { text = subtitle; textSize = 12f; typeface = medium(); setTextColor(NativeTheme.muted(context)) }, matchWrap().apply { topMargin = dp(3) })
        }, LinearLayout.LayoutParams(0, wrap(), 1f))
        addView(TextView(context).apply { text = "›"; textSize = 24f; gravity = Gravity.CENTER; setTextColor(NativeTheme.muted(context)) }, LinearLayout.LayoutParams(dp(20), dp(40)))
    }

    private fun bottomNav(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
        background = round("#FFFFFF", if (NativeAdaptive.isLarge(this@NativeSpaceActivity)) 28 else 0, "#E8E8E4")
        listOf(
            "홈" to { openWebPath("/home") },
            "일정" to { startActivity(Intent(this@NativeSpaceActivity, NativeScheduleListActivity::class.java)); finish() },
            "공간" to {},
            "가계부" to { startActivity(Intent(this@NativeSpaceActivity, NativeBudgetActivity::class.java)); finish() },
            "전체" to { startActivity(Intent(this@NativeSpaceActivity, NativeMyMenuActivity::class.java)); finish() },
        ).forEachIndexed { index, item -> addView(bottomItem(item.first, index == 2, item.second), LinearLayout.LayoutParams(0, match(), 1f)) }
    }

    private fun bottomItem(label: String, active: Boolean, action: () -> Unit): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER
        setOnClickListener { action() }
        addView(View(context).apply { background = if (active) round("#0084CC", 999, null) else null }, LinearLayout.LayoutParams(dp(28), dp(3)).apply { bottomMargin = dp(6) })
        addView(NativeTabIconView(context, tabIcon(label), if (active) color("#0084CC") else NativeTheme.muted(context)), LinearLayout.LayoutParams(dp(20), dp(20)))
        addView(TextView(context).apply { text = label; textSize = 10f; typeface = Typeface.create("sans-serif", if (active) Typeface.BOLD else Typeface.NORMAL); setTextColor(if (active) color("#0084CC") else NativeTheme.muted(context)) }, matchWrap().apply { topMargin = dp(3) })
    }

    private fun tabIcon(label: String): NativeTabIcon = when (label) {
        "홈" -> NativeTabIcon.HOME
        "일정" -> NativeTabIcon.CALENDAR
        "공간" -> NativeTabIcon.SPACE
        "가계부" -> NativeTabIcon.BUDGET
        else -> NativeTabIcon.MENU
    }

    private fun copyInviteCode(code: String) {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText("글리움 초대 코드", code))
        Toast.makeText(this, "초대 코드가 복사됐어요.", Toast.LENGTH_SHORT).show()
    }

    private fun showAdvancedSpaceDialog() {
        val active = summary?.activeSpace
        val message = if (active == null) {
            "활성 공간을 찾지 못했어요."
        } else if (active.isPersonal) {
            "개인 공간은 초대와 멤버 관리를 지원하지 않아요. 공유 공간을 만들거나 초대 코드로 참여하면 함께 관리할 수 있어요."
        } else {
            "이 공간은 이름·초대·멤버 관리와 가족 공간 전환을 지원합니다. 다른 멤버와 연결된 자녀가 없는 단독 공간은 삭제할 수 있어요."
        }
        val items = if (active?.isPersonal == true) {
            arrayOf("새 공유 공간 만들기", "초대 코드로 참여하기")
        } else {
            buildList {
                add("공간 이름 변경")
                add("초대 코드 재생성")
                if (active?.spaceKind != "family") add("가족 공간으로 전환")
                add("공간 삭제")
                add("초대 코드로 참여하기")
                add("새 공간 만들기")
            }.toTypedArray()
        }

        AlertDialog.Builder(this)
            .setTitle("공간 고급 설정")
            .setMessage(message)
            .setItems(items) { _, which ->
                if (active?.isPersonal == true) {
                    when (which) {
                        0 -> showCreateSpaceDialog()
                        1 -> showJoinSpaceDialog()
                    }
                } else {
                    when (items[which]) {
                        "공간 이름 변경" -> if (active?.role == "admin") showRenameDialog() else toast("공간 지기만 수정할 수 있어요.")
                        "초대 코드 재생성" -> if (active?.role == "admin") confirmRegenerateInviteCode() else toast("공간 지기만 초대 코드를 관리할 수 있어요.")
                        "가족 공간으로 전환" -> handleSpaceManageAction(SpaceManageAction.CONVERT_TO_FAMILY)
                        "공간 삭제" -> handleSpaceManageAction(SpaceManageAction.DELETE)
                        "초대 코드로 참여하기" -> showJoinSpaceDialog()
                        "새 공간 만들기" -> showCreateSpaceDialog()
                    }
                }
            }
            .setNegativeButton("닫기", null)
            .show()
    }

    private fun showCreateSpaceDialog() {
        val input = EditText(this).apply {
            hint = "예: 우리집, 데이트 공간, 친구모임"
            textSize = 16f
            setSingleLine(true)
            setPadding(dp(16), dp(10), dp(16), dp(10))
            background = round("#F8FAFC", 16, "#EEF0F4")
        }
        AlertDialog.Builder(this)
            .setTitle("새 공간 만들기")
            .setMessage("무료 플랜에서는 개인 공간 외 공유 공간을 최대 2개까지 사용할 수 있어요.")
            .setView(FrameLayout(this).apply {
                setPadding(dp(20), dp(8), dp(20), 0)
                addView(input, FrameLayout.LayoutParams(match(), wrap()))
            })
            .setNegativeButton("취소", null)
            .setPositiveButton("만들기") { _, _ -> createSpace(input.text?.toString().orEmpty()) }
            .show()
    }

    private fun createSpace(name: String) {
        runSpaceMutation("공간을 만들지 못했어요. 공유 공간 한도를 확인해 주세요.") {
            NativeSpaceApi.create(this, name)
        }
    }

    private fun showJoinSpaceDialog() {
        val input = EditText(this).apply {
            hint = "GLEAUM-XXXXXXX"
            textSize = 16f
            setSingleLine(true)
            setAllCaps(false)
            setPadding(dp(16), dp(10), dp(16), dp(10))
            background = round("#F8FAFC", 16, "#EEF0F4")
        }
        AlertDialog.Builder(this)
            .setTitle("공간 참여하기")
            .setMessage("초대받은 코드를 입력하면 공간 멤버로 참여합니다.")
            .setView(FrameLayout(this).apply {
                setPadding(dp(20), dp(8), dp(20), 0)
                addView(input, FrameLayout.LayoutParams(match(), wrap()))
            })
            .setNegativeButton("취소", null)
            .setPositiveButton("참여") { _, _ -> joinSpace(input.text?.toString().orEmpty()) }
            .show()
    }

    private fun showPendingInviteIfNeeded() {
        val code = pendingInviteCode ?: return
        if (!accountCapabilities().canInviteMembers) return
        if (invitePromptShown) return
        invitePromptShown = true
        AlertDialog.Builder(this)
            .setTitle("초대받은 공간에 참여할까요?")
            .setMessage("초대 코드 $code 로 공간 멤버로 참여합니다.")
            .setNegativeButton("나중에", null)
            .setPositiveButton("참여") { _, _ -> joinSpace(code) }
            .show()
    }

    private fun accountCapabilities(): NativeAccountCapabilities =
        NativeAccountContextStore.capabilities(this)

    private fun joinSpace(code: String) {
        runSpaceMutation("공간에 참여하지 못했어요. 초대 코드를 확인해 주세요.") {
            NativeSpaceApi.join(this, code.trim().uppercase())
        }
    }

    private fun showRenameDialog() {
        val active = summary?.activeSpace ?: return
        val input = EditText(this).apply {
            setText(active.name)
            selectAll()
            textSize = 16f
            setSingleLine(true)
            setPadding(dp(16), dp(10), dp(16), dp(10))
            background = round("#F8FAFC", 16, "#EEF0F4")
        }
        AlertDialog.Builder(this)
            .setTitle("공간 이름 변경")
            .setView(FrameLayout(this).apply {
                setPadding(dp(20), dp(8), dp(20), 0)
                addView(input, FrameLayout.LayoutParams(match(), wrap()))
            })
            .setNegativeButton("취소", null)
            .setPositiveButton("저장") { _, _ -> updateSpaceName(active.id, input.text?.toString().orEmpty()) }
            .show()
    }

    private fun updateSpaceName(spaceId: String, name: String) {
        runSpaceMutation("공간 이름을 변경하지 못했어요.") {
            NativeSpaceApi.updateName(this, spaceId, name)
        }
    }

    private fun confirmRegenerateInviteCode() {
        val active = summary?.activeSpace ?: return
        AlertDialog.Builder(this)
            .setTitle("초대 코드를 새로 만들까요?")
            .setMessage("기존 초대 코드는 더 이상 사용할 수 없어요.")
            .setNegativeButton("취소", null)
            .setPositiveButton("새로 만들기") { _, _ ->
                runSpaceMutation("초대 코드를 새로 만들지 못했어요.") {
                    NativeSpaceApi.regenerateInviteCode(this, active.id)
                }
            }
            .show()
    }

    private fun confirmConvertToFamily(active: NativeSpaceItem) {
        AlertDialog.Builder(this)
            .setTitle("가족 공간으로 전환할까요?")
            .setMessage("${active.name}의 일정, 소식, 멤버는 그대로 유지됩니다. 전환 후에는 자녀 계정과 가족 기능을 연결할 수 있으며 일반 공간으로 되돌릴 수 없어요.")
            .setNegativeButton("취소", null)
            .setPositiveButton("가족 공간으로 전환") { _, _ ->
                runSpaceMutation("가족 공간 전환에 실패했어요.", "가족 공간으로 전환했습니다.") {
                    NativeSpaceApi.convertToFamily(this, active.id)
                }
            }
            .show()
    }

    private fun confirmDeleteSpace(active: NativeSpaceItem) {
        AlertDialog.Builder(this)
            .setTitle("${active.name} 공간을 삭제할까요?")
            .setMessage("이 공간의 일정, 소식, 가계부 데이터가 영구 삭제되며 복구할 수 없어요. 연결된 자녀가 있으면 안전을 위해 삭제가 차단됩니다.")
            .setNegativeButton("취소", null)
            .setPositiveButton("영구 삭제") { _, _ ->
                runSpaceMutation("공간을 삭제하지 못했어요. 다른 멤버나 연결된 자녀가 남아 있는지 확인해 주세요.", "공간을 삭제했습니다.") {
                    NativeSpaceApi.delete(this, active.id)
                }
            }
            .show()
    }

    private fun showMemberActions(member: NativeSpaceMember) {
        val labels = arrayOf("공간 운영자로 변경", "공간 멤버로 변경", "공간 지기로 변경", "멤버 내보내기")
        AlertDialog.Builder(this)
            .setTitle(member.displayName)
            .setItems(labels) { _, which ->
                when (which) {
                    0 -> updateMemberRole(member, "editor")
                    1 -> updateMemberRole(member, "viewer")
                    2 -> updateMemberRole(member, "admin")
                    3 -> confirmRemoveMember(member)
                }
            }
            .show()
    }

    private fun updateMemberRole(member: NativeSpaceMember, role: String) {
        val spaceId = summary?.activeSpace?.id ?: return
        runSpaceMutation("멤버 역할을 변경하지 못했어요.") {
            NativeSpaceApi.updateMemberRole(this, spaceId, member.userId, role)
        }
    }

    private fun confirmRemoveMember(member: NativeSpaceMember) {
        val spaceId = summary?.activeSpace?.id ?: return
        AlertDialog.Builder(this)
            .setTitle("멤버를 내보낼까요?")
            .setMessage("${member.displayName}님을 이 공간에서 제거합니다.")
            .setNegativeButton("취소", null)
            .setPositiveButton("내보내기") { _, _ ->
                runSpaceMutation("멤버를 내보내지 못했어요.") {
                    NativeSpaceApi.removeMember(this, spaceId, member.userId)
                }
            }
            .show()
    }

    private fun runSpaceMutation(errorText: String, successText: String? = null, action: () -> NativeSpaceSummary) {
        loading = true
        render()
        Thread {
            try {
                val next = action()
                runOnUiThread {
                    summary = next
                    NativeAppDataCache.spaces = next
                    NativeAppDataCache.home = null
                    loading = false
                    errorMessage = null
                    render()
                    successText?.let(::toast)
                }
            } catch (e: Exception) {
                runOnUiThread {
                    loading = false
                    errorMessage = null
                    render()
                    toast(spaceMutationError(e.message, errorText))
                }
            }
        }.start()
    }

    private fun loadingCard(): TextView = messageCard("공간 정보를 불러오는 중...")
    private fun messageCard(textValue: String): TextView = TextView(this).apply { text = textValue; textSize = 15f; typeface = bold(); gravity = Gravity.CENTER; setTextColor(NativeTheme.muted(context)); setPadding(dp(20), dp(64), dp(20), dp(64)); background = round("#FFFFFF", 24, "#EEF0F4") }
    private fun sectionTitle(title: String): TextView = TextView(this).apply { text = title; textSize = 17f; typeface = bold(); setTextColor(NativeTheme.text(context)) }
    private fun emptyText(textValue: String): TextView = TextView(this).apply { text = textValue; textSize = 14f; gravity = Gravity.CENTER; setTextColor(NativeTheme.muted(context)); setPadding(dp(18), dp(30), dp(18), dp(30)) }
    private fun cardGroup(): LinearLayout = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; background = round("#FFFFFF", 24, "#EEF0F4"); elevation = dp(2).toFloat() }
    private fun divider(): View = View(this).apply { setBackgroundColor(color("#EEF0F4")); layoutParams = LinearLayout.LayoutParams(match(), 1) }
    private fun roleLabel(role: String?): String = when (role) { "admin" -> "공간 지기"; "editor" -> "공간 운영자"; "viewer" -> "공간 멤버"; else -> "공간 멤버" }
    private fun friendlyError(code: String?): String = if (code == "session_required") "로그인 세션을 찾을 수 없어요. 다시 로그인해 주세요." else "공간 정보를 불러오지 못했어요."
    private fun spaceMutationError(code: String?, fallback: String): String = when (code) {
        "space_has_other_members" -> "다른 멤버를 모두 내보낸 뒤 삭제해 주세요."
        "family_space_has_dependents" -> "연결된 자녀와 가족 이력이 있어 이 공간은 삭제할 수 없어요."
        "personal_space_locked" -> "개인 공간은 삭제하거나 가족 공간으로 전환할 수 없어요."
        "space_admin_required" -> "공간 지기만 이 작업을 할 수 있어요."
        "account_capability_required" -> "보호자가 관리하는 계정에서는 이 작업을 할 수 없어요."
        "space_not_found" -> "이미 삭제되었거나 존재하지 않는 공간이에요. 목록을 새로 불러와 주세요."
        "session_required" -> "로그인 세션을 찾을 수 없어요. 다시 로그인해 주세요."
        else -> fallback
    }
    private fun toast(message: String) = Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    private fun openWebPath(path: String) {
        if (path == "/home") {
            startActivity(Intent(this, NativeHomePortActivity::class.java))
            finish()
            return
        }
        startActivity(Intent(this, MainActivity::class.java).putExtra("start_path", path))
        finish()
    }
    private fun bold(): Typeface = Typeface.create("sans-serif", Typeface.BOLD)
    private fun medium(): Typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
    private fun color(hex: String): Int = NativeTheme.color(this, hex)
    private fun colorWithAlpha(hex: String, alpha: Float): Int = NativeTheme.alpha(hex, alpha)
    private fun round(fill: String, radius: Int, stroke: String?): GradientDrawable = GradientDrawable().apply { setColor(color(fill)); cornerRadius = dp(radius).toFloat(); if (stroke != null) setStroke(1, color(stroke)) }
    private fun gradient(start: String, end: String, radius: Int): GradientDrawable = GradientDrawable(GradientDrawable.Orientation.TL_BR, intArrayOf(color(start), color(end))).apply { cornerRadius = dp(radius).toFloat() }
    private fun match(): Int = ViewGroup.LayoutParams.MATCH_PARENT
    private fun wrap(): Int = ViewGroup.LayoutParams.WRAP_CONTENT
    private fun matchWrap(): LinearLayout.LayoutParams = LinearLayout.LayoutParams(match(), wrap())
    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()
    private fun statusBarHeight(): Int { val id = resources.getIdentifier("status_bar_height", "dimen", "android"); return if (id > 0) resources.getDimensionPixelSize(id) else 0 }
}
