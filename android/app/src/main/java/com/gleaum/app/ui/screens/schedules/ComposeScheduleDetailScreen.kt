package com.gleaum.app.ui.screens.schedules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Event
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Repeat
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.gleaum.app.NativeAppSchedule
import com.gleaum.app.ui.components.GleaumLabelBadge
import com.gleaum.app.ui.components.GleaumStatusBadge
import com.gleaum.app.ui.components.GleaumStateCard
import com.gleaum.app.ui.components.StateKind
import com.gleaum.app.ui.components.GleaumAdaptiveContent
import com.gleaum.app.ui.theme.expenseContainer
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComposeScheduleDetailScreen(
    schedule: NativeAppSchedule?,
    loading: Boolean,
    errorMessage: String?,
    onBack: () -> Unit,
    onEdit: (String) -> Unit,
    onToggleComplete: (String) -> Unit,
    onRenotify: () -> Unit,
    renotifying: Boolean,
    onOpenLocation: (String) -> Unit,
    onDelete: () -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Scaffold(
        modifier = modifier,
        topBar = {
            TopAppBar(
                title = { Text("일정 상세") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "뒤로") }
                },
                actions = {
                    if (schedule?.permissions?.canEdit == true) {
                        IconButton(onClick = { onEdit(schedule.id) }) { Icon(Icons.Outlined.Edit, contentDescription = "수정") }
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
    ) { innerPadding ->
        GleaumAdaptiveContent {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(innerPadding),
            ) {
                when {
                loading -> DetailStateCard(
                    title = "일정을 불러오는 중이에요",
                    message = "일정 정보를 확인하고 있어요.",
                    actionLabel = null,
                    onAction = onRetry,
                    modifier = Modifier.padding(20.dp),
                )
                errorMessage != null || schedule == null -> DetailStateCard(
                    title = "일정을 찾을 수 없어요",
                    message = errorMessage ?: "요청한 일정 정보가 없어요.",
                    actionLabel = "다시 시도",
                    onAction = onRetry,
                    modifier = Modifier.padding(20.dp),
                )
                    else -> DetailContent(
                        schedule = schedule,
                        onEdit = onEdit,
                        onToggleComplete = onToggleComplete,
                        onRenotify = onRenotify,
                        renotifying = renotifying,
                        onOpenLocation = onOpenLocation,
                        onDelete = onDelete,
                    )
                }
            }
        }
    }
}

@Composable
private fun DetailContent(
    schedule: NativeAppSchedule,
    onEdit: (String) -> Unit,
    onToggleComplete: (String) -> Unit,
    onRenotify: () -> Unit,
    renotifying: Boolean,
    onOpenLocation: (String) -> Unit,
    onDelete: () -> Unit,
) {
    var confirmDelete by remember { mutableStateOf(false) }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        DetailHero(schedule)
        DetailInfoCard(schedule, onOpenLocation)
        ActionCard(
            schedule = schedule,
            onEdit = onEdit,
            onToggleComplete = onToggleComplete,
            onRenotify = onRenotify,
            renotifying = renotifying,
            onAskDelete = { confirmDelete = true },
        )
    }

    if (confirmDelete) {
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            title = { Text("일정을 삭제할까요?") },
            text = { Text("삭제한 일정은 복구할 수 없어요.") },
            confirmButton = {
                TextButton(onClick = { confirmDelete = false; onDelete() }) { Text("삭제") }
            },
            dismissButton = {
                TextButton(onClick = { confirmDelete = false }) { Text("취소") }
            },
        )
    }
}

@Composable
private fun DetailHero(schedule: NativeAppSchedule) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(22.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    GleaumLabelBadge(typeLabel(schedule.type))
                    GleaumStatusBadge(schedule.status)
                }
                Text(
                    text = schedule.title,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = "${dateTitle(schedule.startTime)} · ${timeText(schedule.startTime)}${schedule.endTime?.let { " ~ ${timeText(it)}" } ?: ""}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.74f),
                )
            }
        }
    }
}

@Composable
private fun DetailInfoCard(schedule: NativeAppSchedule, onOpenLocation: (String) -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(vertical = 6.dp)) {
            DetailRow(Icons.Outlined.Event, "상태", statusLabel(schedule.status))
            DetailRow(Icons.Outlined.Repeat, "반복", repeatLabel(schedule.repeat))
            DetailRow(Icons.Outlined.Notifications, "알림", if (schedule.reminder > 0) "${schedule.reminder}분 전" else "없음")
            schedule.locationAddress?.takeIf { it.isNotBlank() }?.let { address ->
                DetailRow(Icons.Outlined.LocationOn, "장소", address, onClick = { onOpenLocation(address) })
            }
            DetailRow(Icons.Outlined.Event, "참여자", "${schedule.participantIds.size}명")
            DetailRow(Icons.Outlined.Schedule, "메모", schedule.memo?.takeIf { it.isNotBlank() } ?: "등록된 메모가 없어요")
        }
    }
}

@Composable
private fun DetailRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    onClick: (() -> Unit)? = null,
) {
    ListItem(
        modifier = Modifier.fillMaxWidth(),
        leadingContent = {
            Surface(color = MaterialTheme.colorScheme.surfaceVariant, shape = CircleShape, modifier = Modifier.size(42.dp)) {
                Box(contentAlignment = Alignment.Center) { Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(21.dp)) }
            }
        },
        headlineContent = { Text(label, fontWeight = FontWeight.Bold) },
        supportingContent = { Text(value) },
        trailingContent = if (onClick != null) {
            { TextButton(onClick = onClick) { Text("지도 열기") } }
        } else null,
    )
}

@Composable
private fun ActionCard(
    schedule: NativeAppSchedule,
    onEdit: (String) -> Unit,
    onToggleComplete: (String) -> Unit,
    onRenotify: () -> Unit,
    renotifying: Boolean,
    onAskDelete: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            if (!schedule.permissions.canEdit) {
                Text("이 일정은 읽기 전용이에요.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                return@Column
            }
            if (schedule.permissions.canChangeStatus) {
                Button(onClick = { onToggleComplete(if (schedule.status == "completed") "pending" else "completed") }, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Outlined.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.size(8.dp))
                    Text(if (schedule.status == "completed") "예정으로 되돌리기" else "완료 처리")
                }
            }
            FilledTonalButton(onClick = { onEdit(schedule.id) }, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Outlined.Edit, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.size(8.dp))
                Text("수정하기")
            }
            if (schedule.permissions.canRenotify) {
                FilledTonalButton(onClick = onRenotify, enabled = !renotifying, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Outlined.Notifications, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.size(8.dp))
                    Text(if (renotifying) "발송 중..." else "재알림 보내기")
                }
            }
            if (schedule.permissions.canDelete) {
                OutlinedButton(onClick = onAskDelete, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Outlined.Delete, contentDescription = null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.size(8.dp))
                    Text("삭제하기", color = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}

@Composable
private fun DetailStateCard(title: String, message: String, actionLabel: String?, onAction: () -> Unit, modifier: Modifier = Modifier) {
    GleaumStateCard(
        title = title,
        message = message,
        modifier = modifier,
        kind = if (actionLabel == null) StateKind.LOADING else StateKind.ERROR,
        actionLabel = actionLabel,
        onAction = onAction,
    )
}

private fun typeLabel(type: String): String = when (type) {
    "shared" -> "공유 일정"
    "child" -> "자녀 일정"
    "expense" -> "지출"
    else -> "개인 일정"
}

private fun statusLabel(status: String): String = when (status) {
    "completed" -> "완료"
    "in_progress" -> "진행중"
    "missed" -> "미완료"
    else -> "예정"
}

private fun repeatLabel(repeat: String): String = when (repeat) {
    "daily" -> "매일"
    "weekly" -> "매주"
    "monthly" -> "매월"
    "yearly" -> "매년"
    else -> "반복 없음"
}

@Composable
private fun typeContainer(type: String): Color = when (type) {
    "shared" -> MaterialTheme.colorScheme.primaryContainer
    "child" -> MaterialTheme.colorScheme.tertiaryContainer
    "expense" -> MaterialTheme.colorScheme.expenseContainer
    else -> MaterialTheme.colorScheme.secondaryContainer
}

private fun dateTitle(iso: String): String = parseIso(iso)?.let {
    SimpleDateFormat("M월 d일 EEEE", Locale.KOREA).format(it)
} ?: "날짜 미정"

private fun timeText(iso: String): String = parseIso(iso)?.let {
    SimpleDateFormat("HH:mm", Locale.KOREA).format(it)
} ?: "--:--"

private fun parseIso(iso: String): Date? = runCatching {
    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.parse(iso)
}.getOrNull() ?: runCatching {
    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.parse(iso)
}.getOrNull()
