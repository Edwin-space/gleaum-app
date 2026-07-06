package com.gleaum.app.ui.screens.notifications

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.EventAvailable
import androidx.compose.material.icons.outlined.Mail
import androidx.compose.material.icons.outlined.MarkEmailRead
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.TaskAlt
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Badge
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.gleaum.app.NativeNotificationItem
import com.gleaum.app.NativeNotificationSummary
import com.gleaum.app.ui.components.GleaumDestination

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComposeNotificationScreen(
    summary: NativeNotificationSummary?,
    loading: Boolean,
    message: String?,
    onRefresh: () -> Unit,
    onMarkAllRead: () -> Unit,
    onNotificationClick: (NativeNotificationItem) -> Unit,
    onBack: () -> Unit,
    onDestinationSelected: (GleaumDestination) -> Unit,
    modifier: Modifier = Modifier,
) {
    Scaffold(
        modifier = modifier,
        topBar = {
            TopAppBar(
                title = { Text("알림") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "뒤로")
                    }
                },
                actions = {
                    IconButton(onClick = onRefresh) {
                        Icon(Icons.Outlined.Refresh, contentDescription = "새로고침")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground,
                    navigationIconContentColor = MaterialTheme.colorScheme.onBackground,
                    actionIconContentColor = MaterialTheme.colorScheme.onBackground,
                ),
            )
        },
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                GleaumDestination.entries.forEach { destination ->
                    NavigationBarItem(
                        selected = false,
                        onClick = { onDestinationSelected(destination) },
                        icon = { Icon(destination.icon, contentDescription = destination.label) },
                        label = { Text(destination.label) },
                    )
                }
            }
        },
    ) { innerPadding ->
        NotificationContent(
            innerPadding = innerPadding,
            summary = summary,
            loading = loading,
            message = message,
            onRefresh = onRefresh,
            onMarkAllRead = onMarkAllRead,
            onNotificationClick = onNotificationClick,
        )
    }
}

@Composable
private fun NotificationContent(
    innerPadding: PaddingValues,
    summary: NativeNotificationSummary?,
    loading: Boolean,
    message: String?,
    onRefresh: () -> Unit,
    onMarkAllRead: () -> Unit,
    onNotificationClick: (NativeNotificationItem) -> Unit,
) {
    val notifications = summary?.notifications.orEmpty()
    val unreadCount = summary?.unreadCount ?: 0

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            start = 20.dp,
            top = innerPadding.calculateTopPadding() + 12.dp,
            end = 20.dp,
            bottom = innerPadding.calculateBottomPadding() + 24.dp,
        ),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item { NotificationHero(unreadCount = unreadCount, loading = loading) }

        when {
            loading -> item { StateCard("알림을 불러오는 중이에요.", danger = false) }
            !message.isNullOrBlank() -> item {
                StateCard(
                    text = message,
                    danger = true,
                    actionLabel = "다시 시도",
                    onAction = onRefresh,
                )
            }
            notifications.isEmpty() -> item {
                StateCard(
                    text = "아직 도착한 알림이 없어요.\n일정과 공간 활동이 생기면 이곳에서 확인할 수 있어요.",
                    danger = false,
                )
            }
            else -> {
                item {
                    NotificationSectionHeader(
                        unreadCount = unreadCount,
                        onMarkAllRead = onMarkAllRead,
                    )
                }
                items(notifications, key = { it.id }) { item ->
                    NotificationCard(item = item, onClick = { onNotificationClick(item) })
                }
            }
        }
    }
}

@Composable
private fun NotificationHero(unreadCount: Int, loading: Boolean) {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
    ) {
        Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            AssistChip(
                onClick = {},
                label = { Text(if (loading) "동기화 중" else "Notification Center") },
                leadingIcon = { Icon(Icons.Outlined.Notifications, contentDescription = null, modifier = Modifier.size(18.dp)) },
            )
            Text(
                text = if (unreadCount > 0) "읽지 않은 알림 ${unreadCount}개" else "모든 알림을 확인했어요",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
            )
            Text(
                text = "일정, 공간, 가계부 흐름에서 놓치면 안 되는 내용을 모아둡니다.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.72f),
            )
        }
    }
}

@Composable
private fun NotificationSectionHeader(unreadCount: Int, onMarkAllRead: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text("최근 알림", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("최신순으로 정리했어요", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        if (unreadCount > 0) {
            FilledTonalButton(onClick = onMarkAllRead) {
                Icon(Icons.Outlined.MarkEmailRead, contentDescription = null, modifier = Modifier.size(18.dp))
                Text("모두 읽음", modifier = Modifier.padding(start = 6.dp))
            }
        } else {
            AssistChip(onClick = {}, label = { Text("정리됨") }, leadingIcon = { Icon(Icons.Outlined.TaskAlt, contentDescription = null, modifier = Modifier.size(18.dp)) })
        }
    }
}

@Composable
private fun NotificationCard(item: NativeNotificationItem, onClick: () -> Unit) {
    OutlinedCard(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.outlinedCardColors(
            containerColor = if (item.read) MaterialTheme.colorScheme.surface else MaterialTheme.colorScheme.secondaryContainer,
        ),
    ) {
        ListItem(
            headlineContent = {
                Text(
                    item.title.ifBlank { "알림" },
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    fontWeight = FontWeight.SemiBold,
                )
            },
            supportingContent = {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(item.body.ifBlank { "내용을 확인해 주세요." }, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    Text(relativeDate(item.createdAt), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            },
            leadingContent = {
                Surface(
                    shape = MaterialTheme.shapes.medium,
                    color = if (item.read) MaterialTheme.colorScheme.surfaceVariant else MaterialTheme.colorScheme.primaryContainer,
                ) {
                    Icon(
                        notificationIcon(item.type),
                        contentDescription = null,
                        tint = if (item.read) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(10.dp).size(22.dp),
                    )
                }
            },
            trailingContent = {
                if (!item.read) Badge(containerColor = MaterialTheme.colorScheme.primary) { Text("new") }
            },
        )
    }
}

@Composable
private fun StateCard(
    text: String,
    danger: Boolean,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
) {
    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(
                imageVector = if (danger) Icons.Outlined.Refresh else Icons.Outlined.CheckCircle,
                contentDescription = null,
                tint = if (danger) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(28.dp),
            )
            Text(
                text = text,
                style = MaterialTheme.typography.bodyMedium,
                color = if (danger) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (actionLabel != null && onAction != null) {
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                TextButton(onClick = onAction) { Text(actionLabel) }
            }
        }
    }
}

private fun notificationIcon(type: String): ImageVector = when (type) {
    "reminder" -> Icons.Outlined.Schedule
    "completion" -> Icons.Outlined.EventAvailable
    "invite" -> Icons.Outlined.Mail
    "re_notify" -> Icons.Outlined.Notifications
    else -> Icons.Outlined.Notifications
}

private fun relativeDate(raw: String): String = raw.take(10).ifBlank { "최근" }
