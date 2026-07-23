package com.gleaum.app

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ArrowBack
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.ListItemDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.gleaum.app.ui.components.FeedbackKind
import com.gleaum.app.ui.components.GleaumFeedbackBanner
import com.gleaum.app.ui.theme.GleaumTheme
import org.json.JSONObject
import java.text.DateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private data class CalendarImportCandidate(
    val event: NativeDeviceCalendarEvent,
    val duplicate: Boolean,
)

class NativeCalendarImportActivity : AppCompatActivity() {
    private var loading = true
    private var importing = false
    private var candidates: List<CalendarImportCandidate> = emptyList()
    private var selectedIds: Set<String> = emptySet()
    private var message: String? = null
    private var messageKind = FeedbackKind.INFO

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        render()
        loadCandidates()
    }

    override fun onResume() {
        super.onResume()
        NativeTheme.applySystemBars(window, this)
    }

    private fun loadCandidates() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CALENDAR) != PackageManager.PERMISSION_GRANTED) {
            loading = false
            message = "캘린더 설정에서 기기 캘린더 권한을 먼저 허용해 주세요."
            messageKind = FeedbackKind.WARNING
            render()
            return
        }
        val calendarId = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(SELECTED_CALENDAR_KEY, null)
        if (calendarId.isNullOrBlank()) {
            loading = false
            message = "가져올 기기 캘린더를 먼저 선택해 주세요."
            messageKind = FeedbackKind.WARNING
            render()
            return
        }

        loading = true
        message = null
        render()
        Thread {
            try {
                val now = System.currentTimeMillis()
                val events = NativeDeviceCalendarRepository.listImportableEvents(
                    context = this,
                    calendarId = calendarId,
                    rangeStart = now - DAY_MILLIS,
                    rangeEnd = now + IMPORT_RANGE_DAYS * DAY_MILLIS,
                )
                val schedules = NativeScheduleApi.list(this)
                    .filter { it.type == "personal" && it.visibility == "private" }
                val loaded = events.map { event ->
                    CalendarImportCandidate(event, schedules.any { schedule -> isDuplicate(schedule, event) })
                }
                runOnUiThread {
                    candidates = loaded
                    selectedIds = loaded.filterNot { it.duplicate }.map { it.event.importId }.toSet()
                    loading = false
                    message = if (loaded.isEmpty()) "가져올 새 기기 일정이 없어요." else null
                    messageKind = FeedbackKind.INFO
                    render()
                }
            } catch (error: Exception) {
                runOnUiThread {
                    loading = false
                    message = friendlyError(error.message)
                    messageKind = FeedbackKind.ERROR
                    render()
                }
            }
        }.start()
    }

    private fun toggle(importId: String) {
        selectedIds = selectedIds.toMutableSet().apply {
            if (!add(importId)) remove(importId)
        }
        render()
    }

    private fun importSelected() {
        val targets = candidates.filter { !it.duplicate && selectedIds.contains(it.event.importId) }
        if (targets.isEmpty()) {
            message = "가져올 일정을 선택해 주세요."
            messageKind = FeedbackKind.WARNING
            render()
            return
        }
        importing = true
        message = null
        render()
        Thread {
            var imported = 0
            try {
                val existing = NativeScheduleApi.list(this)
                    .filter { it.type == "personal" && it.visibility == "private" }
                    .toMutableList()
                targets.forEach { candidate ->
                    val event = candidate.event
                    if (existing.any { isDuplicate(it, event) }) return@forEach
                    val created = NativeScheduleApi.create(this, event.toSchedulePayload())
                    existing.add(created)
                    imported += 1
                }
                NativeAppDataCache.invalidateSchedules()
                runOnUiThread {
                    importing = false
                    message = "${imported}개 일정을 개인 일정으로 가져왔어요."
                    messageKind = FeedbackKind.SUCCESS
                    candidates = candidates.map { candidate ->
                        if (selectedIds.contains(candidate.event.importId)) candidate.copy(duplicate = true) else candidate
                    }
                    selectedIds = emptySet()
                    render()
                }
            } catch (error: Exception) {
                runOnUiThread {
                    importing = false
                    message = if (imported > 0) {
                        "${imported}개는 가져왔지만 일부 일정은 저장하지 못했어요."
                    } else {
                        friendlyError(error.message)
                    }
                    messageKind = FeedbackKind.ERROR
                    render()
                }
            }
        }.start()
    }

    private fun render() {
        setContent {
            GleaumTheme {
                CalendarImportScreen(
                    loading = loading,
                    importing = importing,
                    candidates = candidates,
                    selectedIds = selectedIds,
                    message = message,
                    messageKind = messageKind,
                    onBack = { finish() },
                    onRefresh = { loadCandidates() },
                    onToggle = ::toggle,
                    onImport = ::importSelected,
                )
            }
        }
    }

    private fun isDuplicate(schedule: NativeAppSchedule, event: NativeDeviceCalendarEvent): Boolean {
        val sameTitle = schedule.title.trim().lowercase(Locale.KOREA) == event.title.trim().lowercase(Locale.KOREA)
        val scheduleStart = NativeDateTime.parseIsoMillis(schedule.startTime) ?: return false
        return sameTitle && kotlin.math.abs(scheduleStart - event.startTime) < 60_000L
    }

    private fun NativeDeviceCalendarEvent.toSchedulePayload(): JSONObject {
        val start = Calendar.getInstance().apply { timeInMillis = startTime }
        val end = endTime?.let { millis -> Calendar.getInstance().apply { timeInMillis = millis } }
        val sourceMemo = buildList {
            description.trim().takeIf { it.isNotBlank() }?.let(::add)
            location.trim().takeIf { it.isNotBlank() }?.let { add("장소: $it") }
            add("기기 캘린더에서 가져온 일정")
        }.joinToString("\n")
        return JSONObject().apply {
            put("title", title.trim())
            put("type", "personal")
            put("visibility", "private")
            put("startTime", NativeScheduleApi.toIsoUtc(start))
            end?.let { put("endTime", NativeScheduleApi.toIsoUtc(it)) }
            put("allDay", allDay)
            put("reminder", 0)
            put("repeat", "none")
            put("memo", sourceMemo)
        }
    }

    private fun friendlyError(code: String?): String = when (code) {
        "calendar_permission_required" -> "기기 캘린더 권한이 필요해요."
        "session_required" -> "로그인 세션을 확인하지 못했어요. 다시 로그인해 주세요."
        "space_required" -> "개인 공간을 준비한 뒤 다시 시도해 주세요."
        else -> "기기 일정을 확인하지 못했어요. 잠시 후 다시 시도해 주세요."
    }

    companion object {
        private const val PREFS_NAME = "CapacitorStorage"
        private const val SELECTED_CALENDAR_KEY = "gleaum:calendar-sync-calendar-id"
        private const val IMPORT_RANGE_DAYS = 30L
        private const val DAY_MILLIS = 24L * 60L * 60L * 1000L
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CalendarImportScreen(
    loading: Boolean,
    importing: Boolean,
    candidates: List<CalendarImportCandidate>,
    selectedIds: Set<String>,
    message: String?,
    messageKind: FeedbackKind,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onToggle: (String) -> Unit,
    onImport: () -> Unit,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("기기 일정 가져오기", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Outlined.ArrowBack, contentDescription = "뒤로가기")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        },
        bottomBar = {
            if (!loading && candidates.isNotEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(horizontal = 20.dp, vertical = 12.dp),
                ) {
                    Button(
                        onClick = onImport,
                        enabled = !importing && selectedIds.isNotEmpty(),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (importing) "가져오는 중..." else "선택한 ${selectedIds.size}개 가져오기")
                    }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 96.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(18.dp),
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(Icons.Outlined.CalendarMonth, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text("개인 일정으로 안전하게 가져와요", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text(
                                "선택한 캘린더의 어제부터 30일 뒤 일정만 확인하며, 같은 제목과 시작 시간의 일정은 제외합니다.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                            )
                        }
                    }
                }
            }
            message?.let { text ->
                item { GleaumFeedbackBanner(message = text, kind = messageKind) }
            }
            if (loading) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 48.dp),
                        horizontalArrangement = Arrangement.Center,
                    ) { CircularProgressIndicator() }
                }
            } else if (candidates.isEmpty()) {
                item {
                    Button(onClick = onRefresh, modifier = Modifier.fillMaxWidth()) { Text("다시 확인") }
                }
            } else {
                item {
                    val available = candidates.count { !it.duplicate }
                    Text(
                        "확인된 일정 ${candidates.size}개 · 가져오기 가능 ${available}개",
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                items(candidates, key = { it.event.importId }) { candidate ->
                    val selected = selectedIds.contains(candidate.event.importId)
                    ListItem(
                        headlineContent = {
                            Text(candidate.event.title, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        },
                        supportingContent = {
                            Column {
                                Text(formatEventTime(candidate.event), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                if (candidate.duplicate) {
                                    Text("이미 같은 개인 일정이 있어 제외됨", color = MaterialTheme.colorScheme.tertiary)
                                }
                            }
                        },
                        leadingContent = {
                            Checkbox(
                                checked = selected,
                                enabled = !candidate.duplicate && !importing,
                                onCheckedChange = null,
                            )
                        },
                        colors = ListItemDefaults.colors(
                            containerColor = if (candidate.duplicate) MaterialTheme.colorScheme.surfaceContainer else MaterialTheme.colorScheme.surface,
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(enabled = !candidate.duplicate && !importing) { onToggle(candidate.event.importId) },
                    )
                }
            }
        }
    }
}

private fun formatEventTime(event: NativeDeviceCalendarEvent): String {
    val formatter = if (event.allDay) {
        DateFormat.getDateInstance(DateFormat.MEDIUM, Locale.KOREA)
    } else {
        DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT, Locale.KOREA)
    }
    return formatter.format(Date(event.startTime))
}
