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
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Badge
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.gleaum.app.NativeHomePortSummary

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

@Composable
fun ComposeMyMenuScreen(
    innerPadding: PaddingValues,
    summary: NativeHomePortSummary?,
    loading: Boolean,
    message: String?,
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
    onAction: (MyMenuAction) -> Unit,
    modifier: Modifier = Modifier,
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
        if (!message.isNullOrBlank()) item { MessageCard(message) }
        item { QuickActions(onAction) }
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
            AssistChip(onClick = {}, label = { Text(if (loading) "프로필 불러오는 중" else "좋은 하루예요") }, leadingIcon = { Icon(Icons.Outlined.Person, contentDescription = null, modifier = Modifier.size(18.dp)) })
            Text("${name}님", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimaryContainer)
            Text("$space · ${members}명 참여 중", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.72f))
        }
    }
}

@Composable
private fun QuickActions(onAction: (MyMenuAction) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
        QuickActionCard("일정 추가", Icons.Outlined.CalendarMonth, Modifier.weight(1f)) { onAction(MyMenuAction.ADD_SCHEDULE) }
        QuickActionCard("가계부", Icons.Outlined.CreditCard, Modifier.weight(1f)) { onAction(MyMenuAction.OPEN_BUDGET) }
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
private fun MessageCard(message: String) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
        Text(message, modifier = Modifier.padding(16.dp), color = MaterialTheme.colorScheme.onErrorContainer, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
    }
}

private data class MenuItemSpec(
    val title: String,
    val subtitle: String,
    val icon: ImageVector,
    val badge: String?,
    val action: MyMenuAction?,
)
