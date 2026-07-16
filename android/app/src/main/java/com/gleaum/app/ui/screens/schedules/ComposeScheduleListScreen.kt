package com.gleaum.app.ui.screens.schedules

import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.EventAvailable
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material3.Badge
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.gleaum.app.NativeAppSchedule
import com.gleaum.app.ui.components.GleaumStatusBadge
import com.gleaum.app.ui.components.GleaumLabelBadge
import com.gleaum.app.ui.components.GleaumStateCard
import com.gleaum.app.ui.components.StateKind
import com.gleaum.app.ui.theme.expense
import com.gleaum.app.ui.theme.expenseContainer
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

private val scheduleFilters = listOf(
    ScheduleFilter("all", "전체"),
    ScheduleFilter("shared", "공유"),
    ScheduleFilter("personal", "개인"),
    ScheduleFilter("child", "자녀"),
)

@Composable
fun ComposeScheduleListScreen(
    innerPadding: PaddingValues,
    schedules: List<NativeAppSchedule>,
    loading: Boolean,
    errorMessage: String?,
    activeFilter: String,
    onFilterChange: (String) -> Unit,
    onRetry: () -> Unit,
    onAddSchedule: () -> Unit,
    onOpenSchedule: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val todayKey = remember { dateKey(System.currentTimeMillis()) }
    val visible = remember(schedules, activeFilter) {
        schedules.filter { activeFilter == "all" || it.type == activeFilter }
    }
    val grouped = remember(visible) {
        visible.sortedBy { it.startTime }.groupBy { dateTitle(it.startTime) }
    }
    val todayCount = remember(schedules, todayKey) { schedules.count { dateKey(it.startTime) == todayKey } }
    val completedToday = remember(schedules, todayKey) { schedules.count { dateKey(it.startTime) == todayKey && it.status == "completed" } }

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
        item {
            ScheduleHeroCard(todayCount = todayCount, completedToday = completedToday)
        }

        item {
            FilterRow(activeFilter = activeFilter, onFilterChange = onFilterChange)
        }

        if (errorMessage != null) {
            item {
                StateCard(
                    title = "일정을 불러오지 못했어요",
                    message = errorMessage,
                    actionLabel = "다시 시도",
                    onAction = onRetry,
                )
            }
        }

        item {
            AnimatedContent(targetState = loading, label = "schedule-loading") { isLoading ->
                if (isLoading) {
                    StateCard(
                        title = "일정을 불러오는 중이에요",
                        message = "등록된 일정과 상태를 정리하고 있어요.",
                        actionLabel = null,
                        onAction = {},
                    )
                }
            }
        }

        if (!loading && errorMessage == null && visible.isEmpty()) {
            item {
                EmptyScheduleCard(onAddSchedule = onAddSchedule)
            }
        }

        if (!loading && errorMessage == null && visible.isNotEmpty()) {
            grouped.forEach { (date, items) ->
                item(key = "header-$date") {
                    SectionHeader(title = date, count = items.size)
                }
                items.forEach { schedule ->
                    item(key = schedule.id) {
                        ScheduleListCard(schedule = schedule, onOpenSchedule = onOpenSchedule)
                    }
                }
            }
        }
    }
}

@Composable
private fun ScheduleHeroCard(todayCount: Int, completedToday: Int) {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(22.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "TODAY'S FOCUS",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                    )
                    Text(
                        text = if (todayCount == 0) "오늘 일정이 없어요" else "오늘 ${todayCount}개의 일정이 있어요",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                    )
                    Text(
                        text = "일정 흐름을 확인하고 필요한 약속을 바로 추가하세요.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.72f),
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    GleaumLabelBadge("오늘 ${todayCount}개")
                    GleaumLabelBadge("완료 ${completedToday}개")
                }
            }
        }
    }
}

@Composable
private fun FilterRow(activeFilter: String, onFilterChange: (String) -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            scheduleFilters.forEach { filter ->
                FilterChip(
                    selected = activeFilter == filter.key,
                    onClick = { onFilterChange(filter.key) },
                    label = { Text(filter.label) },
                )
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String, count: Int) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(
            text = title,
            modifier = Modifier.weight(1f),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.ExtraBold,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Badge(containerColor = MaterialTheme.colorScheme.surfaceVariant, contentColor = MaterialTheme.colorScheme.onSurfaceVariant) {
            Text(count.toString())
        }
    }
}

@Composable
private fun ScheduleListCard(schedule: NativeAppSchedule, onOpenSchedule: (String) -> Unit) {
    OutlinedCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = schedule.id.isNotBlank()) { onOpenSchedule(schedule.id) },
    ) {
        ListItem(
            leadingContent = { ScheduleTimeBlock(schedule) },
            headlineContent = {
                Text(
                    text = schedule.title,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    fontWeight = FontWeight.Bold,
                )
            },
            supportingContent = {
                Text("${typeLabel(schedule.type)} · ${statusLabel(schedule.status)}")
            },
            trailingContent = {
                GleaumStatusBadge(schedule.status)
            },
        )
    }
}

@Composable
private fun ScheduleTimeBlock(schedule: NativeAppSchedule) {
    Surface(color = typeContainer(schedule.type), shape = RoundedCornerShape(16.dp)) {
        Column(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Text(
                text = if (schedule.allDay) "종일" else timeText(schedule.startTime),
                color = typeColor(schedule.type),
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = typeLabel(schedule.type),
                color = typeColor(schedule.type),
                style = MaterialTheme.typography.labelSmall,
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun EmptyScheduleCard(onAddSchedule: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(30.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Surface(color = MaterialTheme.colorScheme.primaryContainer, shape = CircleShape, modifier = Modifier.size(60.dp)) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Outlined.EventAvailable, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                }
            }
            Text("표시할 일정이 없어요", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(
                "새 일정을 추가하거나 필터를 변경해보세요.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium,
            )
            Button(onClick = onAddSchedule) {
                Icon(Icons.Outlined.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.size(8.dp))
                Text("새 일정 추가")
            }
        }
    }
}

@Composable
private fun StateCard(title: String, message: String, actionLabel: String?, onAction: () -> Unit) {
    GleaumStateCard(title, message, kind = if (actionLabel == null) StateKind.LOADING else StateKind.ERROR, actionLabel = actionLabel, onAction = onAction)
}

private data class ScheduleFilter(val key: String, val label: String)

private fun typeLabel(type: String): String = when (type) {
    "shared" -> "공유일정"
    "child" -> "자녀일정"
    "expense" -> "지출"
    else -> "개인일정"
}

private fun statusLabel(status: String): String = when (status) {
    "completed" -> "완료"
    "in_progress" -> "진행중"
    "missed" -> "미완료"
    else -> "예정"
}

@Composable
private fun typeColor(type: String): Color = when (type) {
    "shared" -> MaterialTheme.colorScheme.primary
    "child" -> MaterialTheme.colorScheme.tertiary
    "expense" -> MaterialTheme.colorScheme.expense
    else -> MaterialTheme.colorScheme.secondary
}

@Composable
private fun typeContainer(type: String): Color = when (type) {
    "shared" -> MaterialTheme.colorScheme.primaryContainer
    "child" -> MaterialTheme.colorScheme.tertiaryContainer
    "expense" -> MaterialTheme.colorScheme.expenseContainer
    else -> MaterialTheme.colorScheme.secondaryContainer
}

private fun dateTitle(iso: String): String = parseIso(iso)?.let {
    SimpleDateFormat("M월 d일 (E)", Locale.KOREA).format(it)
} ?: "날짜 미정"

private fun dateKey(iso: String): String = parseIso(iso)?.let {
    SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(it)
} ?: iso.take(10)

private fun dateKey(ms: Long): String = SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(Date(ms))

private fun timeText(iso: String): String = parseIso(iso)?.let {
    SimpleDateFormat("HH:mm", Locale.KOREA).format(it)
} ?: "--:--"

private fun parseIso(iso: String): Date? = runCatching {
    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.parse(iso)
}.getOrNull() ?: runCatching {
    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.parse(iso)
}.getOrNull()
