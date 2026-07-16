package com.gleaum.app.ui.screens.home

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
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
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.EventAvailable
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material3.Badge
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.gleaum.app.NativeHomePortCalendarDay
import com.gleaum.app.NativeHomePortSchedule
import com.gleaum.app.NativeHomePortSummary
import com.gleaum.app.ui.components.GleaumStatusBadge
import com.gleaum.app.ui.components.GleaumLabelBadge
import com.gleaum.app.ui.components.GleaumStateCard
import com.gleaum.app.ui.components.StateKind
import com.gleaum.app.ui.theme.expense
import com.gleaum.app.ui.theme.expenseContainer
import java.text.NumberFormat
import java.util.Locale

@Composable
fun ComposeHomeScreen(
    innerPadding: PaddingValues,
    summary: NativeHomePortSummary?,
    loading: Boolean,
    errorMessage: String?,
    selectedDateKey: String?,
    onRetry: () -> Unit,
    onSelectDate: (String) -> Unit,
    onAddSchedule: () -> Unit,
    onOpenSchedule: (String) -> Unit,
    onOpenSchedules: () -> Unit,
    onOpenBudget: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var calendarExpanded by remember { mutableStateOf(true) }
    var calendarMode by remember { mutableStateOf(CalendarMode.Week) }
    val selected = selectedDateKey ?: summary?.selectedDate
    val selectedSchedules = remember(summary, selected) {
        summary?.range.orEmpty()
            .filter { scheduleDateKey(it.startTime) == selected }
            .sortedBy { it.startTime }
    }
    val contentPadding = PaddingValues(
        start = 20.dp,
        top = innerPadding.calculateTopPadding() + 12.dp,
        end = 20.dp,
        bottom = innerPadding.calculateBottomPadding() + 24.dp,
    )

    if (errorMessage != null || (loading && summary == null)) {
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background),
            contentPadding = contentPadding,
        ) {
            item {
                StateCard(
                    title = if (errorMessage != null) "홈을 불러오지 못했어요" else "홈을 정리하는 중이에요",
                    message = errorMessage ?: "일정과 가계부 정보를 가져오고 있어요.",
                    actionLabel = if (errorMessage != null) "다시 시도" else null,
                    onAction = onRetry,
                )
            }
        }
        return
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = contentPadding,
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            HeroCard(summary = summary)
        }

        if (isManagedAccount(summary?.account?.accountMode)) {
            item { ManagedAccountCard(summary?.account?.accountMode.orEmpty()) }
        }

        item {
            TodayCalendarToggle(
                selectedDate = selected,
                isToday = selected == summary?.selectedDate,
                expanded = calendarExpanded,
                onToggle = { calendarExpanded = !calendarExpanded },
            )
        }

        item {
            AnimatedVisibility(visible = calendarExpanded) {
                CalendarPanel(
                    mode = calendarMode,
                    onModeChange = { calendarMode = it },
                    selectedDate = selected,
                    summary = summary,
                    selectedSchedules = selectedSchedules,
                    onSelectDate = onSelectDate,
                    onOpenSchedule = onOpenSchedule,
                )
            }
        }

        item {
            SectionHeader(
                title = "${formatDateTitle(selected)} 일정",
                count = "${selectedSchedules.size}개",
                action = "+ 새 일정",
                onAction = onAddSchedule,
            )
        }

        if (selectedSchedules.isEmpty()) {
            item { EmptyScheduleCard(onAddSchedule = onAddSchedule) }
        } else {
            selectedSchedules.take(3).forEach { schedule ->
                item(key = "selected-${schedule.id}") {
                    ScheduleCard(schedule = schedule, onOpen = onOpenSchedule)
                }
            }
        }

        if (summary?.account?.capabilities?.canViewHouseholdBudget == true) {
            item {
                BudgetCard(summary = summary, onOpenBudget = onOpenBudget)
            }
        }

        item {
            SectionHeader(
                title = "다가오는 일정",
                count = "${summary?.upcomingCount ?: 0}개",
                action = "전체보기",
                onAction = onOpenSchedules,
            )
        }

        val upcoming = summary?.upcoming.orEmpty()
        if (upcoming.isEmpty()) {
            item {
                OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "앞으로 예정된 일정이 없어요",
                        modifier = Modifier.padding(22.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
        } else {
            upcoming.take(3).forEach { schedule ->
                item(key = "upcoming-${schedule.id}") {
                    UpcomingScheduleRow(schedule = schedule, onOpen = onOpenSchedule)
                }
            }
        }
    }
}

@Composable
private fun StateCard(title: String, message: String, actionLabel: String?, onAction: () -> Unit) {
    GleaumStateCard(title, message, kind = if (actionLabel == null) StateKind.LOADING else StateKind.ERROR, actionLabel = actionLabel, onAction = onAction)
}

@Composable
private fun HeroCard(summary: NativeHomePortSummary?) {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(22.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Text(
                        text = greetingText(),
                        color = MaterialTheme.colorScheme.secondary,
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = "${summary?.displayName ?: "글리움"}님",
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.ExtraBold,
                    )
                    Text(
                        text = if (isManagedAccount(summary?.account?.accountMode)) {
                            "오늘 할 일과 가까운 일정을 하나씩 확인해 보세요."
                        } else {
                            summary?.activeSpaceName?.let { "$it 공간의 일정과 자금 흐름을 확인하세요." }
                                ?: "오늘 필요한 일정과 자금 흐름을 확인하세요."
                        },
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.72f),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    HeroMetric("오늘", "${summary?.todayCount ?: 0}", Modifier.weight(1f))
                    HeroMetric("완료", "${summary?.completedCount ?: 0}", Modifier.weight(1f))
                    HeroMetric("남은 일정", "${summary?.pendingCount ?: 0}", Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun ManagedAccountCard(accountMode: String) {
    val pendingConsent = accountMode == "teen_consent_pending" || accountMode == "pending_guardian_consent"
    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            GleaumLabelBadge(if (pendingConsent) "동의 확인 필요" else "보호자 관리 계정")
            Text(
                text = if (pendingConsent) "동의 상태를 확인하고 있어요"
                    else "일정과 루틴에 집중하는 홈이에요",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = "가계부·공간 관리·멤버 초대·광고는 나이와 동의 상태에 맞게 제한됩니다.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

private fun isManagedAccount(accountMode: String?): Boolean = accountMode in setOf(
    "pending_guardian_consent",
    "child_managed",
    "teen_consent_pending",
    "teen",
)

@Composable
private fun HeroMetric(label: String, value: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.surfaceContainerLowest,
        shape = MaterialTheme.shapes.medium,
    ) {
        Column(
            modifier = Modifier.padding(vertical = 14.dp, horizontal = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(value, color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
private fun TodayCalendarToggle(selectedDate: String?, isToday: Boolean, expanded: Boolean, onToggle: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onToggle)
            .animateContentSize(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        ListItem(
            leadingContent = { Icon(Icons.Outlined.CalendarMonth, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
            headlineContent = { Text(formatDateTitle(selectedDate), fontWeight = FontWeight.Bold) },
            supportingContent = { Text(if (expanded) "캘린더 접기" else "캘린더 펼치기") },
            trailingContent = {
                if (isToday) GleaumLabelBadge("TODAY")
            },
        )
    }
}

@Composable
private fun CalendarPanel(
    mode: CalendarMode,
    onModeChange: (CalendarMode) -> Unit,
    selectedDate: String?,
    summary: NativeHomePortSummary?,
    selectedSchedules: List<NativeHomePortSchedule>,
    onSelectDate: (String) -> Unit,
    onOpenSchedule: (String) -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                CalendarMode.entries.forEach { item ->
                    FilterChip(
                        selected = mode == item,
                        onClick = { onModeChange(item) },
                        label = { Text(item.label) },
                    )
                }
            }

            AnimatedContent(targetState = mode, label = "calendar-mode") { target ->
                when (target) {
                    CalendarMode.Week -> WeekStrip(summary?.calendarWeek.orEmpty(), selectedDate, onSelectDate)
                    CalendarMode.Month -> MonthGrid(summary?.calendarDays.orEmpty(), selectedDate, onSelectDate)
                    CalendarMode.Day -> DayPreview(selectedDate, selectedSchedules, onOpenSchedule)
                }
            }
        }
    }
}

@Composable
private fun WeekStrip(days: List<NativeHomePortCalendarDay>, selectedDate: String?, onSelectDate: (String) -> Unit) {
    if (days.isEmpty()) {
        Text("캘린더 데이터를 준비하는 중이에요", color = MaterialTheme.colorScheme.onSurfaceVariant)
        return
    }
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
        days.forEachIndexed { index, day ->
            DayPill(
                label = listOf("월", "화", "수", "목", "금", "토", "일").getOrElse(index) { "" },
                day = day,
                selected = day.date == selectedDate,
                modifier = Modifier.weight(1f),
                onClick = { onSelectDate(day.date) },
            )
        }
    }
}

@Composable
private fun MonthGrid(days: List<NativeHomePortCalendarDay>, selectedDate: String?, onSelectDate: (String) -> Unit) {
    if (days.isEmpty()) {
        Text("월간 캘린더 데이터를 준비하는 중이에요", color = MaterialTheme.colorScheme.onSurfaceVariant)
        return
    }
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        days.chunked(7).take(6).forEach { week ->
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                week.forEach { day ->
                    DayPill(
                        label = "",
                        day = day,
                        selected = day.date == selectedDate,
                        compact = true,
                        modifier = Modifier.weight(1f),
                        onClick = { onSelectDate(day.date) },
                    )
                }
                repeat(7 - week.size) { Spacer(Modifier.weight(1f)) }
            }
        }
    }
}

@Composable
private fun DayPill(
    label: String,
    day: NativeHomePortCalendarDay,
    selected: Boolean,
    modifier: Modifier = Modifier,
    compact: Boolean = false,
    onClick: () -> Unit,
) {
    val container = when {
        selected -> MaterialTheme.colorScheme.primary
        day.isToday -> MaterialTheme.colorScheme.primaryContainer
        else -> MaterialTheme.colorScheme.surfaceVariant
    }
    val content = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
    Surface(
        modifier = modifier.clickable(onClick = onClick),
        color = container,
        contentColor = content,
        shape = RoundedCornerShape(if (compact) 14.dp else 18.dp),
    ) {
        Column(
            modifier = Modifier.padding(vertical = if (compact) 9.dp else 11.dp, horizontal = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(3.dp),
        ) {
            if (label.isNotBlank()) Text(label, style = MaterialTheme.typography.labelSmall)
            Text(day.day.toString(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            if (day.count > 0) Badge(containerColor = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.primary) { Text(day.count.toString()) }
        }
    }
}

@Composable
private fun DayPreview(selectedDate: String?, schedules: List<NativeHomePortSchedule>, onOpenSchedule: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("${formatDateTitle(selectedDate)} 상세", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        if (schedules.isEmpty()) {
            Text("선택한 날짜에 등록된 일정이 없어요", color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else {
            schedules.take(2).forEach { ScheduleCard(schedule = it, onOpen = onOpenSchedule) }
        }
    }
}

@Composable
private fun SectionHeader(title: String, count: String, action: String, onAction: () -> Unit) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            Text(count, color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
        }
        TextButton(onClick = onAction) { Text(action) }
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
                .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Surface(color = MaterialTheme.colorScheme.primaryContainer, shape = CircleShape, modifier = Modifier.size(58.dp)) {
                Box(contentAlignment = Alignment.Center) { Icon(Icons.Outlined.EventAvailable, contentDescription = null, tint = MaterialTheme.colorScheme.primary) }
            }
            Text("등록된 일정이 없어요", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Button(onClick = onAddSchedule) {
                Icon(Icons.Outlined.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.size(8.dp))
                Text("새 일정 추가")
            }
        }
    }
}

@Composable
private fun ScheduleCard(schedule: NativeHomePortSchedule, onOpen: (String) -> Unit) {
    OutlinedCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = schedule.id.isNotBlank()) { onOpen(schedule.id) },
    ) {
        ListItem(
            leadingContent = { TimeBlock(schedule) },
            headlineContent = { Text(schedule.title, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Bold) },
            supportingContent = { Text("${typeLabel(schedule.type)} · ${timeText(schedule.startTime)}") },
            trailingContent = { GleaumStatusBadge(schedule.status) },
        )
    }
}

@Composable
private fun TimeBlock(schedule: NativeHomePortSchedule) {
    Surface(color = typeContainer(schedule.type), shape = RoundedCornerShape(16.dp)) {
        Column(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(timeText(schedule.startTime), color = typeColor(schedule.type), style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
            Text(typeLabel(schedule.type), color = typeColor(schedule.type), style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
private fun AdPlaceholder() {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height(58.dp),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
    ) {
        Box(contentAlignment = Alignment.CenterEnd, modifier = Modifier.padding(horizontal = 14.dp)) {
            Text("AD", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun BudgetCard(summary: NativeHomePortSummary?, onOpenBudget: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onOpenBudget),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.CreditCard, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.size(10.dp))
                Column(Modifier.weight(1f)) {
                    Text("이번 달 개인 가계부", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
                    Text("수입과 지출, 이번 달 순흐름", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                BudgetMetric("수입", money(summary?.incomeTotal ?: 0L), Modifier.weight(1f))
                BudgetMetric("지출", money(summary?.expenseTotal ?: 0L), Modifier.weight(1f))
                BudgetMetric("순흐름", money(summary?.net ?: 0L), Modifier.weight(1f))
            }
            HorizontalDivider()
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.Groups, contentDescription = null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(18.dp))
                Spacer(Modifier.size(8.dp))
                Text("개인 공간 기준", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                Text("가계부 보기", color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun BudgetMetric(label: String, value: String, modifier: Modifier = Modifier) {
    Surface(modifier = modifier, color = MaterialTheme.colorScheme.surfaceVariant, shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelMedium)
            Text(value, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
private fun UpcomingScheduleRow(schedule: NativeHomePortSchedule, onOpen: (String) -> Unit) {
    OutlinedCard(modifier = Modifier.fillMaxWidth().clickable(enabled = schedule.id.isNotBlank()) { onOpen(schedule.id) }) {
        ListItem(
            leadingContent = {
                Surface(color = typeContainer(schedule.type), shape = RoundedCornerShape(12.dp)) {
                    Text(formatDateTitle(scheduleDateKey(schedule.startTime)), modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp), color = typeColor(schedule.type), fontWeight = FontWeight.Bold)
                }
            },
            headlineContent = { Text(schedule.title, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Bold) },
            supportingContent = { Text(timeText(schedule.startTime)) },
        )
    }
}

private enum class CalendarMode(val label: String) {
    Week("주간"),
    Month("월간"),
    Day("일간"),
}

private fun scheduleDateKey(raw: String): String = raw.take(10)

private fun formatDateTitle(dateKey: String?): String {
    if (dateKey.isNullOrBlank() || dateKey.length < 10) return "오늘"
    val parts = dateKey.split("-")
    if (parts.size != 3) return "오늘"
    return "${parts[1].toIntOrNull() ?: parts[1]}월 ${parts[2].toIntOrNull() ?: parts[2]}일"
}

private fun timeText(raw: String): String {
    val tIndex = raw.indexOf('T')
    return if (tIndex >= 0 && raw.length >= tIndex + 6) raw.substring(tIndex + 1, tIndex + 6) else raw.take(5)
}

private fun money(value: Long): String = NumberFormat.getNumberInstance(Locale.KOREA).format(value) + "원"

private fun greetingText(): String {
    val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
    return when (hour) {
        in 5..10 -> "좋은 아침이에요"
        in 11..16 -> "좋은 오후예요"
        else -> "좋은 저녁이에요"
    }
}

private fun typeLabel(type: String): String = when (type) {
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
