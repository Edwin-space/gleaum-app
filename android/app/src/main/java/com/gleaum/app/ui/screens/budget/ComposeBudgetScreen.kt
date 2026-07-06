package com.gleaum.app.ui.screens.budget

import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.EventRepeat
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Savings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Badge
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.gleaum.app.NativeBudgetEntry
import com.gleaum.app.NativeBudgetSummary
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

@Composable
fun ComposeBudgetScreen(
    innerPadding: PaddingValues,
    summary: NativeBudgetSummary?,
    loading: Boolean,
    errorMessage: String?,
    onRetry: () -> Unit,
    onAddEntry: () -> Unit,
    onEditEntry: (String) -> Unit,
    onToggleStatus: (NativeBudgetEntry) -> Unit,
    onDeleteEntry: (NativeBudgetEntry) -> Unit,
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
        when {
            loading -> item {
                StateCard("가계부를 불러오는 중이에요", "이번 달 수입과 지출을 정리하고 있어요.", null, onRetry)
            }
            errorMessage != null -> item {
                StateCard("가계부를 불러오지 못했어요", errorMessage, "다시 시도", onRetry)
            }
            summary != null -> {
                item { BudgetHero(summary) }
                item { BudgetStatGrid(summary) }
                item { CashFlowCard(summary) }
                item { SectionHeader("반복 예정", summary.recurringEntries.size) }
                if (summary.recurringEntries.isEmpty()) {
                    item { EmptyCard("등록된 정기 수입/지출이 없어요", "월세, 구독료, 급여처럼 반복되는 흐름을 추가해보세요.", onAddEntry) }
                } else {
                    summary.recurringEntries.take(6).forEach { entry ->
                        item(key = "recurring-${entry.id}") {
                            BudgetEntryCard(entry = entry, recurring = true, onEditEntry = onEditEntry, onToggleStatus = onToggleStatus, onDeleteEntry = onDeleteEntry)
                        }
                    }
                }
                item { SectionHeader("최근 항목", summary.recentEntries.size) }
                if (summary.recentEntries.isEmpty()) {
                    item { EmptyCard("등록된 수입/지출이 없어요", "첫 수입이나 지출을 기록해보세요.", onAddEntry) }
                } else {
                    summary.recentEntries.forEach { entry ->
                        item(key = "recent-${entry.id}") {
                            BudgetEntryCard(entry = entry, recurring = false, onEditEntry = onEditEntry, onToggleStatus = onToggleStatus, onDeleteEntry = onDeleteEntry)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BudgetHero(summary: NativeBudgetSummary) {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(22.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("이번 달 순액", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                Text(
                    text = "${if (summary.net >= 0) "+" else "-"}${money(kotlin.math.abs(summary.net))}",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistChip(onClick = {}, label = { Text("저축률 ${summary.savingsRate}%") })
                    AssistChip(onClick = {}, label = { Text("개인 가계부") })
                }
            }
        }
    }
}

@Composable
private fun BudgetStatGrid(summary: NativeBudgetSummary) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
        StatCard("수입", money(summary.incomeTotal), MaterialTheme.colorScheme.tertiary, Icons.Outlined.Savings, Modifier.weight(1f))
        StatCard("지출", money(summary.expenseTotal), MaterialTheme.colorScheme.primary, Icons.Outlined.CreditCard, Modifier.weight(1f))
    }
}

@Composable
private fun StatCard(label: String, value: String, accent: Color, icon: androidx.compose.ui.graphics.vector.ImageVector, modifier: Modifier = Modifier) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(icon, contentDescription = null, tint = accent)
            Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
            Text(value, color = accent, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
private fun CashFlowCard(summary: NativeBudgetSummary) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("현금 흐름 구성", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
            MetricRow("고정 지출", money(summary.fixedExpenseTotal), "예정 ${summary.pendingExpenseCount}건")
            MetricRow("변동 지출", money(summary.variableExpenseTotal), "완료 ${summary.completedExpenseCount}건")
            MetricRow("정기 수입", money(summary.recurringIncomeTotal), "예정 ${summary.pendingIncomeCount}건")
            MetricRow("일회 수입", money(summary.onceIncomeTotal), "수령 ${summary.completedIncomeCount}건")
        }
    }
}

@Composable
private fun MetricRow(label: String, amount: String, meta: String) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(label, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
        Column(horizontalAlignment = Alignment.End) {
            Text(amount, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
            Text(meta, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
private fun SectionHeader(title: String, count: Int) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(title, modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
        Badge(containerColor = MaterialTheme.colorScheme.surfaceVariant, contentColor = MaterialTheme.colorScheme.onSurfaceVariant) { Text(count.toString()) }
    }
}

@Composable
private fun BudgetEntryCard(
    entry: NativeBudgetEntry,
    recurring: Boolean,
    onEditEntry: (String) -> Unit,
    onToggleStatus: (NativeBudgetEntry) -> Unit,
    onDeleteEntry: (NativeBudgetEntry) -> Unit,
) {
    var confirmDelete by remember { mutableStateOf(false) }
    val income = entry.kind == "income"
    OutlinedCard(modifier = Modifier.fillMaxWidth().clickable { onEditEntry(entry.id) }) {
        ListItem(
            leadingContent = {
                Surface(color = if (income) MaterialTheme.colorScheme.tertiaryContainer else MaterialTheme.colorScheme.primaryContainer, shape = RoundedCornerShape(16.dp)) {
                    Box(Modifier.size(58.dp), contentAlignment = Alignment.Center) {
                        Icon(if (income) Icons.Outlined.Savings else Icons.Outlined.Payments, contentDescription = null, tint = if (income) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.primary)
                    }
                }
            },
            headlineContent = { Text(entry.title, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Bold) },
            supportingContent = {
                Text(if (recurring) "${recurLabel(entry.recurFreq)} · 다음 예정 ${nextOccurrenceText(entry)}" else "${dayText(entry.occurredAt)} · ${recurLabel(entry.recurFreq)}")
            },
            trailingContent = {
                Column(horizontalAlignment = Alignment.End) {
                    Text("${if (income) "+" else "-"}${money(entry.amount)}", fontWeight = FontWeight.ExtraBold, color = if (income) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.onSurface)
                    Row(horizontalArrangement = Arrangement.End) {
                        if (entry.recurFreq != "none") {
                            TextButton(onClick = { onToggleStatus(entry) }) { Text(if (entry.status == "completed") "완료" else "예정") }
                        }
                        IconButton(onClick = { confirmDelete = true }) { Icon(Icons.Outlined.Delete, contentDescription = "삭제", tint = MaterialTheme.colorScheme.error) }
                    }
                }
            },
        )
    }
    if (confirmDelete) {
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            title = { Text("항목을 삭제할까요?") },
            text = { Text("삭제한 수입/지출 항목은 복구할 수 없어요.") },
            confirmButton = { TextButton(onClick = { confirmDelete = false; onDeleteEntry(entry) }) { Text("삭제") } },
            dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text("취소") } },
        )
    }
}

@Composable
private fun EmptyCard(title: String, message: String, onAddEntry: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Surface(color = MaterialTheme.colorScheme.primaryContainer, shape = CircleShape, modifier = Modifier.size(58.dp)) {
                Box(contentAlignment = Alignment.Center) { Icon(Icons.Outlined.Add, contentDescription = null, tint = MaterialTheme.colorScheme.primary) }
            }
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(message, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
            Button(onClick = onAddEntry) { Text("항목 추가") }
        }
    }
}

@Composable
private fun StateCard(title: String, message: String, actionLabel: String?, onAction: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(Icons.Outlined.Refresh, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(message, color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (actionLabel != null) Button(onClick = onAction) { Text(actionLabel) }
        }
    }
}

private fun money(value: Long): String = NumberFormat.getNumberInstance(Locale.KOREA).format(value) + "원"
private fun recurLabel(value: String): String = when (value) { "weekly" -> "매주"; "monthly" -> "매월"; "yearly" -> "매년"; else -> "일회" }
private fun dayText(iso: String): String = parseIso(iso)?.let { SimpleDateFormat("M월 d일", Locale.KOREA).format(it) } ?: iso.take(10)
private fun parseIso(iso: String): Date? = runCatching { SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.parse(iso) }.getOrNull()
    ?: runCatching { SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.parse(iso) }.getOrNull()
private fun nextOccurrenceText(entry: NativeBudgetEntry): String {
    val base = parseIso(entry.occurredAt) ?: return dayText(entry.occurredAt)
    val cal = Calendar.getInstance().apply { time = base }
    val now = Calendar.getInstance()
    while (cal.before(now)) {
        when (entry.recurFreq) {
            "weekly" -> cal.add(Calendar.WEEK_OF_YEAR, 1)
            "yearly" -> cal.add(Calendar.YEAR, 1)
            else -> cal.add(Calendar.MONTH, 1)
        }
    }
    return SimpleDateFormat("M월 d일", Locale.KOREA).format(cal.time)
}
