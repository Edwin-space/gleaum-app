package com.gleaum.app.ui.screens.menu

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountCircle
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.Key
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Palette
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Security
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.SpaceDashboard
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Badge
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Button
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.TextButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.gleaum.app.NativeAccountStatus
import com.gleaum.app.NativeHomePortSummary
import com.gleaum.app.NativeProfile
import com.gleaum.app.ui.components.FeedbackKind
import com.gleaum.app.ui.components.GleaumFeedbackBanner
import com.gleaum.app.ui.components.GleaumLabelBadge

enum class MyMenuAction {
    ADD_SCHEDULE,
    OPEN_BUDGET,
    OPEN_SPACE,
    THEME_MODE,
    HOME_LAYOUT,
    CALENDAR_SETTINGS,
    NOTIFICATION_SETTINGS,
    BIOMETRIC_SETTINGS,
    PASSWORD_SETTINGS,
    PROFILE,
    ACCOUNT_STATUS,
    LEGAL,
    LOGOUT,
}

enum class MyMenuSettingsDialog {
    THEME_MODE,
    HOME_LAYOUT,
    NOTIFICATIONS,
    BIOMETRIC,
    CALENDAR,
    PASSWORD,
    PROFILE,
    ACCOUNT_STATUS,
    LEGAL,
}

data class CalendarChoice(
    val id: String,
    val name: String,
    val accountName: String,
)

@Composable
fun ComposeMyMenuScreen(
    innerPadding: PaddingValues,
    summary: NativeHomePortSummary?,
    loading: Boolean,
    message: String?,
    canViewHouseholdBudget: Boolean,
    modifier: Modifier = Modifier,
    messageKind: FeedbackKind = FeedbackKind.ERROR,
    themeModeSubtitle: String,
    themeModeBadge: String?,
    homeLayoutSubtitle: String,
    calendarSubtitle: String,
    calendarBadge: String?,
    notificationSubtitle: String,
    notificationBadge: String?,
    biometricSubtitle: String,
    biometricBadge: String?,
    appVersion: String,
    activeSettingsDialog: MyMenuSettingsDialog? = null,
    themeModeValue: String = "system",
    homeLayoutValue: String = "balanced",
    notificationScheduleEnabled: Boolean = true,
    notificationBudgetEnabled: Boolean = true,
    biometricLockEnabled: Boolean = false,
    biometricAvailable: Boolean = false,
    biometricRelockInterval: String = "always",
    calendarPermissionGranted: Boolean = false,
    calendarSyncEnabled: Boolean = false,
    calendarSyncMode: String = "manual",
    selectedCalendarId: String? = null,
    calendarChoices: List<CalendarChoice> = emptyList(),
    profile: NativeProfile? = null,
    accountStatus: NativeAccountStatus? = null,
    onDismissSettingsDialog: () -> Unit = {},
    onThemeModeSelected: (String) -> Unit = {},
    onHomeLayoutSelected: (String) -> Unit = {},
    onNotificationSettingsSaved: (Boolean, Boolean) -> Unit = { _, _ -> },
    onBiometricLockChanged: (Boolean) -> Unit = {},
    onBiometricRelockIntervalSelected: (String) -> Unit = {},
    onOpenDeviceSecuritySettings: () -> Unit = {},
    onRequestCalendarPermission: () -> Unit = {},
    onCalendarSelected: (CalendarChoice) -> Unit = {},
    onCalendarSyncModeChanged: (Boolean) -> Unit = {},
    onCalendarSyncDisabled: () -> Unit = {},
    onOpenCalendarImport: () -> Unit = {},
    onPasswordSave: (String, String) -> Unit = { _, _ -> },
    onProfileSave: (String, String, String) -> Unit = { _, _, _ -> },
    onAccountWithdraw: (String) -> Unit = {},
    onAccountRestore: () -> Unit = {},
    onOpenTerms: () -> Unit = {},
    onOpenPrivacy: () -> Unit = {},
    onAction: (MyMenuAction) -> Unit,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            start = 20.dp,
            top = innerPadding.calculateTopPadding() + 12.dp,
            end = 20.dp,
            bottom = innerPadding.calculateBottomPadding() + 24.dp,
        ),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item { ProfileHero(summary = summary, loading = loading) }
        if (!message.isNullOrBlank()) {
            item { GleaumFeedbackBanner(message = message, kind = messageKind) }
        }
        item { QuickActions(onAction, canViewHouseholdBudget) }
        item { SectionTitle("앱 설정") }
        item {
            MenuGroup(
                rows = listOf(
                    MenuItemSpec("화면 모드", themeModeSubtitle, Icons.Outlined.Palette, themeModeBadge, MyMenuAction.THEME_MODE),
                    MenuItemSpec("홈 레이아웃", homeLayoutSubtitle, Icons.Outlined.GridView, null, MyMenuAction.HOME_LAYOUT),
                    MenuItemSpec("캘린더 설정", calendarSubtitle, Icons.Outlined.CalendarMonth, calendarBadge, MyMenuAction.CALENDAR_SETTINGS),
                    MenuItemSpec("알림 설정", notificationSubtitle, Icons.Outlined.Notifications, notificationBadge, MyMenuAction.NOTIFICATION_SETTINGS),
                ),
                onAction = onAction,
            )
        }
        item { SectionTitle("계정 & 보안") }
        item {
            MenuGroup(
                rows = listOf(
                    MenuItemSpec("생체인증 보안", biometricSubtitle, Icons.Outlined.Lock, biometricBadge, MyMenuAction.BIOMETRIC_SETTINGS),
                    MenuItemSpec("비밀번호 설정", "이메일 로그인 보안 설정", Icons.Outlined.Key, null, MyMenuAction.PASSWORD_SETTINGS),
                    MenuItemSpec("프로필 관리", "닉네임, 이름, 계정 정보", Icons.Outlined.AccountCircle, null, MyMenuAction.PROFILE),
                    MenuItemSpec("계정 탈퇴/복구", "탈퇴 신청 상태 확인과 복구", Icons.Outlined.Security, null, MyMenuAction.ACCOUNT_STATUS),
                ),
                onAction = onAction,
            )
        }
        item { SectionTitle("서비스") }
        item {
            MenuGroup(
                rows = listOf(
                    MenuItemSpec("약관 및 개인정보", "서비스 이용약관과 개인정보 처리방침", Icons.Outlined.Description, null, MyMenuAction.LEGAL),
                    MenuItemSpec("앱 버전", "네이티브 전환 작업 진행 중", Icons.Outlined.Settings, appVersion, null),
                    MenuItemSpec("로그아웃", "현재 기기의 로그인 세션을 삭제합니다", Icons.AutoMirrored.Outlined.Logout, null, MyMenuAction.LOGOUT),
                ),
                onAction = onAction,
            )
        }
    }

    when (activeSettingsDialog) {
        MyMenuSettingsDialog.THEME_MODE -> ChoiceSettingsDialog(
            title = "화면 모드",
            description = "앱 화면을 시스템 설정에 맞추거나 원하는 모드로 고정합니다.",
            options = listOf(
                SettingsChoice("system", "자동", "기기 시스템 설정을 따릅니다."),
                SettingsChoice("light", "라이트", "밝은 화면으로 고정합니다."),
                SettingsChoice("dark", "다크", "어두운 화면으로 고정합니다."),
            ),
            selectedValue = themeModeValue,
            onSelected = onThemeModeSelected,
            onDismiss = onDismissSettingsDialog,
        )
        MyMenuSettingsDialog.HOME_LAYOUT -> ChoiceSettingsDialog(
            title = "홈 레이아웃",
            description = "홈에서 먼저 보여줄 정보 흐름을 선택합니다.",
            options = buildList {
                add(SettingsChoice("balanced", "균형형", "일정과 공간 흐름을 고르게 보여줍니다."))
                add(SettingsChoice("calendar_first", "일정 중심", "오늘과 다가오는 일정을 먼저 보여줍니다."))
                add(SettingsChoice("routine_first", "루틴 중심", "반복 흐름과 할 일을 우선합니다."))
                if (canViewHouseholdBudget) add(SettingsChoice("expense_first", "가계부 중심", "수입/지출 흐름을 먼저 보여줍니다."))
                add(SettingsChoice("space_first", "공간 중심", "함께 쓰는 공간 정보를 우선합니다."))
            },
            selectedValue = homeLayoutValue,
            onSelected = onHomeLayoutSelected,
            onDismiss = onDismissSettingsDialog,
        )
        MyMenuSettingsDialog.NOTIFICATIONS -> NotificationSettingsDialog(
            scheduleEnabled = notificationScheduleEnabled,
            budgetEnabled = notificationBudgetEnabled,
            canViewHouseholdBudget = canViewHouseholdBudget,
            onSave = onNotificationSettingsSaved,
            onDismiss = onDismissSettingsDialog,
        )
        MyMenuSettingsDialog.BIOMETRIC -> BiometricSettingsDialog(
            enabled = biometricLockEnabled,
            available = biometricAvailable,
            relockInterval = biometricRelockInterval,
            onEnabledChange = onBiometricLockChanged,
            onRelockIntervalSelected = onBiometricRelockIntervalSelected,
            onOpenDeviceSecuritySettings = onOpenDeviceSecuritySettings,
            onDismiss = onDismissSettingsDialog,
        )
        MyMenuSettingsDialog.CALENDAR -> CalendarSettingsDialog(
            permissionGranted = calendarPermissionGranted,
            syncEnabled = calendarSyncEnabled,
            automaticSync = calendarSyncMode == "automatic",
            selectedCalendarId = selectedCalendarId,
            calendars = calendarChoices,
            onRequestPermission = onRequestCalendarPermission,
            onCalendarSelected = onCalendarSelected,
            onAutomaticSyncChanged = onCalendarSyncModeChanged,
            onSyncDisabled = onCalendarSyncDisabled,
            onOpenImport = onOpenCalendarImport,
            onDismiss = onDismissSettingsDialog,
        )
        MyMenuSettingsDialog.PASSWORD -> PasswordSettingsDialog(
            onSave = onPasswordSave,
            onDismiss = onDismissSettingsDialog,
        )
        MyMenuSettingsDialog.PROFILE -> ProfileSettingsDialog(
            profile = profile,
            onSave = onProfileSave,
            onDismiss = onDismissSettingsDialog,
        )
        MyMenuSettingsDialog.ACCOUNT_STATUS -> AccountStatusDialog(
            status = accountStatus,
            onWithdraw = onAccountWithdraw,
            onRestore = onAccountRestore,
            onDismiss = onDismissSettingsDialog,
        )
        MyMenuSettingsDialog.LEGAL -> LegalDocumentsDialog(
            onOpenTerms = onOpenTerms,
            onOpenPrivacy = onOpenPrivacy,
            onDismiss = onDismissSettingsDialog,
        )
        null -> Unit
    }
}

@Composable
private fun ProfileHero(summary: NativeHomePortSummary?, loading: Boolean) {
    val name = summary?.displayName?.takeIf { it.isNotBlank() } ?: "글리움 사용자"
    val space = summary?.activeSpaceName?.takeIf { it.isNotBlank() } ?: "연결된 공간"
    val members = summary?.memberCount ?: 0
    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
    ) {
        Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            GleaumLabelBadge(if (loading) "프로필 불러오는 중" else "좋은 하루예요")
            Text("${name}님", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimaryContainer)
            Text("$space · ${members}명 참여 중", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.72f))
        }
    }
}

@Composable
private fun QuickActions(onAction: (MyMenuAction) -> Unit, canViewHouseholdBudget: Boolean) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
        QuickActionCard("일정 추가", Icons.Outlined.CalendarMonth, Modifier.weight(1f)) { onAction(MyMenuAction.ADD_SCHEDULE) }
        if (canViewHouseholdBudget) {
            QuickActionCard("가계부", Icons.Outlined.CreditCard, Modifier.weight(1f)) { onAction(MyMenuAction.OPEN_BUDGET) }
        }
        QuickActionCard("공간", Icons.Outlined.SpaceDashboard, Modifier.weight(1f)) { onAction(MyMenuAction.OPEN_SPACE) }
    }
}

@Composable
private fun QuickActionCard(label: String, icon: ImageVector, modifier: Modifier = Modifier, onClick: () -> Unit) {
    OutlinedCard(onClick = onClick, modifier = modifier) {
        Column(Modifier.padding(vertical = 18.dp, horizontal = 10.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Surface(shape = MaterialTheme.shapes.medium, color = MaterialTheme.colorScheme.secondaryContainer) {
                Icon(icon, contentDescription = label, tint = MaterialTheme.colorScheme.onSecondaryContainer, modifier = Modifier.padding(10.dp).size(22.dp))
            }
            Text(label, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold, maxLines = 1)
        }
    }
}

@Composable
private fun MenuGroup(rows: List<MenuItemSpec>, onAction: (MyMenuAction) -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        rows.forEachIndexed { index, row ->
            MenuRow(row = row, onAction = onAction)
            if (index != rows.lastIndex) HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
        }
    }
}

@Composable
private fun MenuRow(row: MenuItemSpec, onAction: (MyMenuAction) -> Unit) {
    ListItem(
        headlineContent = { Text(row.title, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.SemiBold) },
        supportingContent = { Text(row.subtitle, maxLines = 1, overflow = TextOverflow.Ellipsis) },
        leadingContent = { Icon(row.icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
        trailingContent = {
            when {
                !row.badge.isNullOrBlank() -> Badge(containerColor = MaterialTheme.colorScheme.primaryContainer) { Text(row.badge) }
                row.action != null -> Text("›", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        },
        modifier = Modifier
            .fillMaxWidth()
            .then(if (row.action != null) Modifier.clickable { onAction(row.action) } else Modifier),
    )
}

@Composable
private fun SectionTitle(title: String) {
    Text(title, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
}

@Composable
private fun ChoiceSettingsDialog(
    title: String,
    description: String,
    options: List<SettingsChoice>,
    selectedValue: String,
    onSelected: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                options.forEach { option ->
                    ListItem(
                        headlineContent = { Text(option.label, fontWeight = FontWeight.SemiBold) },
                        supportingContent = { Text(option.description) },
                        leadingContent = { RadioButton(selected = selectedValue == option.value, onClick = { onSelected(option.value) }) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelected(option.value) },
                    )
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("닫기") } },
    )
}

@Composable
private fun NotificationSettingsDialog(
    scheduleEnabled: Boolean,
    budgetEnabled: Boolean,
    canViewHouseholdBudget: Boolean,
    onSave: (Boolean, Boolean) -> Unit,
    onDismiss: () -> Unit,
) {
    var scheduleChecked by remember(scheduleEnabled) { mutableStateOf(scheduleEnabled) }
    var budgetChecked by remember(budgetEnabled) { mutableStateOf(budgetEnabled) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("알림 설정", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("필요한 알림만 받을 수 있도록 항목별 수신 여부를 조정합니다.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                CheckSettingRow(
                    title = "일정 리마인더",
                    description = "일정 시작 전 알림을 받습니다.",
                    checked = scheduleChecked,
                    onCheckedChange = { scheduleChecked = it },
                )
                if (canViewHouseholdBudget) {
                    CheckSettingRow(
                        title = "가계부 결제 알림",
                        description = "정기 지출 예정 알림을 받습니다.",
                        checked = budgetChecked,
                        onCheckedChange = { budgetChecked = it },
                    )
                }
            }
        },
        confirmButton = { TextButton(onClick = { onSave(scheduleChecked, canViewHouseholdBudget && budgetChecked) }) { Text("저장") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("닫기") } },
    )
}

@Composable
private fun LegalDocumentsDialog(
    onOpenTerms: () -> Unit,
    onOpenPrivacy: () -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("약관 및 개인정보", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("글리움 서비스 이용에 필요한 문서를 앱 안에서 확인합니다.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                ListItem(
                    headlineContent = { Text("이용약관", fontWeight = FontWeight.SemiBold) },
                    supportingContent = { Text("서비스 이용 조건과 기본 정책") },
                    leadingContent = { Icon(Icons.Outlined.Description, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onOpenTerms() },
                )
                ListItem(
                    headlineContent = { Text("개인정보처리방침", fontWeight = FontWeight.SemiBold) },
                    supportingContent = { Text("개인정보 수집, 이용, 보관, 삭제 기준") },
                    leadingContent = { Icon(Icons.Outlined.Security, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onOpenPrivacy() },
                )
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("닫기") } },
    )
}

@Composable
private fun PasswordSettingsDialog(
    onSave: (String, String) -> Unit,
    onDismiss: () -> Unit,
) {
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("비밀번호 설정", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("이메일 로그인에 사용할 비밀번호를 변경합니다. Google 로그인 계정은 기존 방식 그대로 사용할 수 있어요.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("새 비밀번호") },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = confirm,
                    onValueChange = { confirm = it },
                    label = { Text("새 비밀번호 확인") },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = { Button(onClick = { onSave(password, confirm) }) { Text("저장") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("취소") } },
    )
}

@Composable
private fun ProfileSettingsDialog(
    profile: NativeProfile?,
    onSave: (String, String, String) -> Unit,
    onDismiss: () -> Unit,
) {
    var displayName by remember(profile?.id) { mutableStateOf(profile?.displayName.orEmpty()) }
    var realName by remember(profile?.id) { mutableStateOf(profile?.realName.orEmpty()) }
    var displayMode by remember(profile?.id) { mutableStateOf(profile?.nameDisplayMode?.takeIf { it == "real_name" } ?: "nickname") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("프로필 관리", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(profile?.email?.ifBlank { "계정 이메일 없음" } ?: "프로필 정보를 불러오는 중이에요.", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                OutlinedTextField(
                    value = displayName,
                    onValueChange = { displayName = it },
                    label = { Text("닉네임") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = realName,
                    onValueChange = { realName = it },
                    label = { Text("실명 (선택)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Text("앱에서 나를 어떻게 부를지 선택해 주세요.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                listOf(
                    SettingsChoice("nickname", "닉네임으로 표시", "공간과 일정에서 닉네임을 우선 사용합니다."),
                    SettingsChoice("real_name", "실명으로 표시", "실명을 입력한 경우 실명을 우선 사용합니다."),
                ).forEach { option ->
                    ListItem(
                        headlineContent = { Text(option.label, fontWeight = FontWeight.SemiBold) },
                        supportingContent = { Text(option.description) },
                        leadingContent = { RadioButton(selected = displayMode == option.value, onClick = { displayMode = option.value }) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { displayMode = option.value },
                    )
                }
            }
        },
        confirmButton = { Button(onClick = { onSave(displayName, realName, displayMode) }, enabled = profile != null) { Text("저장") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("취소") } },
    )
}

@Composable
private fun AccountStatusDialog(
    status: NativeAccountStatus?,
    onWithdraw: (String) -> Unit,
    onRestore: () -> Unit,
    onDismiss: () -> Unit,
) {
    var reason by remember(status?.withdrawalPending) { mutableStateOf("") }
    val pending = status?.withdrawalPending == true
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (pending) "탈퇴 신청 중" else "계정 탈퇴", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                if (status == null) {
                    Text("계정 상태를 확인하는 중이에요.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                } else if (pending) {
                    Text("계정 삭제까지 ${status.daysLeft}일 남았어요. 복구하면 기존 계정을 계속 사용할 수 있습니다.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    status.deleteScheduledAt?.let { Text("삭제 예정일: ${it.take(10)}", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                } else {
                    Text("탈퇴 신청 후 30일 동안 복구할 수 있고, 이후 개인정보가 삭제됩니다. 먼저 데이터를 확인한 뒤 진행해 주세요.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    OutlinedTextField(
                        value = reason,
                        onValueChange = { if (it.length <= 200) reason = it },
                        label = { Text("탈퇴 사유 (선택)") },
                        minLines = 3,
                        supportingText = { Text("${reason.length}/200") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        },
        confirmButton = {
            when {
                status == null -> TextButton(onClick = onDismiss) { Text("닫기") }
                pending -> Button(onClick = onRestore) { Text("복구하기") }
                else -> Button(onClick = { onWithdraw(reason) }) { Text("탈퇴 신청") }
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("닫기") } },
    )
}

@Composable
private fun CalendarSettingsDialog(
    permissionGranted: Boolean,
    syncEnabled: Boolean,
    automaticSync: Boolean,
    selectedCalendarId: String?,
    calendars: List<CalendarChoice>,
    onRequestPermission: () -> Unit,
    onCalendarSelected: (CalendarChoice) -> Unit,
    onAutomaticSyncChanged: (Boolean) -> Unit,
    onSyncDisabled: () -> Unit,
    onOpenImport: () -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("캘린더 설정", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                when {
                    !permissionGranted -> {
                        Text(
                            "글리움 일정을 기기 캘린더와 연결하려면 캘린더 읽기/쓰기 권한이 필요합니다.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        ListItem(
                            headlineContent = { Text("캘린더 권한 허용", fontWeight = FontWeight.SemiBold) },
                            supportingContent = { Text("Android 권한 요청 창을 엽니다.") },
                            leadingContent = { Icon(Icons.Outlined.CalendarMonth, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onRequestPermission() },
                        )
                    }
                    calendars.isEmpty() -> {
                        Text(
                            "쓰기 가능한 기기 캘린더를 찾지 못했어요. Google 캘린더 또는 기기 캘린더 계정을 먼저 확인해 주세요.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    else -> {
                        Text(
                            if (syncEnabled) "글리움 일정을 기록할 기기 캘린더를 선택합니다." else "동기화할 캘린더를 선택하면 기기 캘린더 연동이 켜집니다.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        calendars.forEach { calendar ->
                            ListItem(
                                headlineContent = { Text(calendar.name, fontWeight = FontWeight.SemiBold) },
                                supportingContent = { Text(calendar.accountName.ifBlank { "기기 캘린더" }) },
                                leadingContent = { RadioButton(selected = selectedCalendarId == calendar.id, onClick = { onCalendarSelected(calendar) }) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onCalendarSelected(calendar) },
                            )
                        }
                        ListItem(
                            headlineContent = { Text("일정 변경 시 자동 반영", fontWeight = FontWeight.SemiBold) },
                            supportingContent = { Text("글리움이 만든 일정만 생성·수정·삭제합니다.") },
                            trailingContent = {
                                Switch(
                                    checked = automaticSync,
                                    onCheckedChange = onAutomaticSyncChanged,
                                )
                            },
                            modifier = Modifier.fillMaxWidth(),
                        )
                        TextButton(onClick = onOpenImport) {
                            Text("기기 일정 가져오기")
                        }
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("닫기") } },
        dismissButton = {
            when {
                !permissionGranted -> TextButton(onClick = onRequestPermission) { Text("권한 허용") }
                syncEnabled -> TextButton(onClick = onSyncDisabled) { Text("동기화 끄기") }
            }
        },
    )
}

@Composable
private fun BiometricSettingsDialog(
    enabled: Boolean,
    available: Boolean,
    relockInterval: String,
    onEnabledChange: (Boolean) -> Unit,
    onRelockIntervalSelected: (String) -> Unit,
    onOpenDeviceSecuritySettings: () -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (enabled) "생체인증 보안" else "앱 잠금 설정", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = if (available) "앱을 다시 열거나 보호 구간에 접근할 때 지문 또는 기기 잠금으로 확인합니다." else "이 기능을 사용하려면 먼저 Android 기기 잠금 또는 지문을 설정해야 합니다.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                ListItem(
                    headlineContent = { Text("앱 잠금", fontWeight = FontWeight.SemiBold) },
                    supportingContent = { Text(if (available) "지문 또는 기기 잠금으로 보호" else "기기 보안 설정 후 사용할 수 있어요") },
                    trailingContent = {
                        Switch(
                            checked = enabled,
                            onCheckedChange = { checked -> if (available || !checked) onEnabledChange(checked) else onOpenDeviceSecuritySettings() },
                        )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { if (available || enabled) onEnabledChange(!enabled) else onOpenDeviceSecuritySettings() },
                )
                if (enabled) {
                    Text("재잠금 기준", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    listOf(
                        SettingsChoice("always", "항상", "앱을 다시 열 때마다 확인합니다."),
                        SettingsChoice("5m", "5분 후", "잠금 해제 후 5분 동안 유지합니다."),
                        SettingsChoice("15m", "15분 후", "잠금 해제 후 15분 동안 유지합니다."),
                        SettingsChoice("30m", "30분 후", "잠금 해제 후 30분 동안 유지합니다."),
                    ).forEach { option ->
                        ListItem(
                            headlineContent = { Text(option.label, fontWeight = FontWeight.SemiBold) },
                            supportingContent = { Text(option.description) },
                            leadingContent = { RadioButton(selected = relockInterval == option.value, onClick = { onRelockIntervalSelected(option.value) }) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onRelockIntervalSelected(option.value) },
                        )
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("닫기") } },
        dismissButton = { TextButton(onClick = onOpenDeviceSecuritySettings) { Text("기기 보안 설정") } },
    )
}

@Composable
private fun CheckSettingRow(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    ListItem(
        headlineContent = { Text(title, fontWeight = FontWeight.SemiBold) },
        supportingContent = { Text(description) },
        trailingContent = { Checkbox(checked = checked, onCheckedChange = onCheckedChange) },
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!checked) },
    )
}

private data class SettingsChoice(
    val value: String,
    val label: String,
    val description: String,
)

private data class MenuItemSpec(
    val title: String,
    val subtitle: String,
    val icon: ImageVector,
    val badge: String?,
    val action: MyMenuAction?,
)
