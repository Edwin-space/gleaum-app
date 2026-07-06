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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.EditCalendar
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

private val scheduleTypes = listOf(
    "personal" to "개인",
    "shared" to "공유",
    "child" to "자녀",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComposeScheduleFormScreen(
    isEdit: Boolean,
    selectedType: String,
    title: String,
    memo: String,
    dateText: String,
    startTimeText: String,
    endTimeText: String,
    saving: Boolean,
    message: String?,
    onBack: () -> Unit,
    onTypeChange: (String) -> Unit,
    onTitleChange: (String) -> Unit,
    onMemoChange: (String) -> Unit,
    onPickDate: () -> Unit,
    onPickStartTime: () -> Unit,
    onPickEndTime: () -> Unit,
    onSave: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var titleValue by remember(title) { mutableStateOf(title) }
    var memoValue by remember(memo) { mutableStateOf(memo) }

    Scaffold(
        modifier = modifier,
        topBar = {
            TopAppBar(
                title = { Text(if (isEdit) "일정 수정" else "새 일정") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "뒤로") } },
                actions = { TextButton(enabled = !saving, onClick = onSave) { Text(if (isEdit) "저장" else "등록") } },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground,
                    navigationIconContentColor = MaterialTheme.colorScheme.onBackground,
                    actionIconContentColor = MaterialTheme.colorScheme.primary,
                ),
            )
        },
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(rememberScrollState())
                .padding(PaddingValues(start = 20.dp, top = innerPadding.calculateTopPadding() + 12.dp, end = 20.dp, bottom = 28.dp)),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            FormHero(isEdit = isEdit)
            if (message != null) MessageCard(message)
            TypeSelector(selectedType = selectedType, onTypeChange = onTypeChange)
            FormFields(
                title = titleValue,
                memo = memoValue,
                dateText = dateText,
                startTimeText = startTimeText,
                endTimeText = endTimeText,
                onTitleChange = { value ->
                    titleValue = value
                    onTitleChange(value)
                },
                onMemoChange = { value ->
                    memoValue = value
                    onMemoChange(value)
                },
                onPickDate = onPickDate,
                onPickStartTime = onPickStartTime,
                onPickEndTime = onPickEndTime,
            )
            Button(enabled = !saving, onClick = onSave, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Outlined.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.size(8.dp))
                Text(if (saving) if (isEdit) "저장 중..." else "등록 중..." else if (isEdit) "수정 완료" else "일정 등록")
            }
        }
    }
}

@Composable
private fun FormHero(isEdit: Boolean) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.linearGradient(listOf(MaterialTheme.colorScheme.primaryContainer, MaterialTheme.colorScheme.secondaryContainer)))
                .padding(22.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Surface(color = MaterialTheme.colorScheme.surface.copy(alpha = 0.7f), shape = CircleShape, modifier = Modifier.size(46.dp)) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Outlined.EditCalendar, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    }
                }
                Text(
                    text = if (isEdit) "일정을 수정해요" else "새 일정을 등록해요",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                )
                Text(
                    text = "개인 일정은 개인 공간에, 공유 일정은 연결된 공간에 저장됩니다.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.72f),
                )
            }
        }
    }
}

@Composable
private fun MessageCard(message: String) {
    val isSuccess = message.contains("완료")
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isSuccess) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.errorContainer,
        ),
    ) {
        Text(
            text = message,
            modifier = Modifier.padding(16.dp),
            color = if (isSuccess) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onErrorContainer,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun TypeSelector(selectedType: String, onTypeChange: (String) -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("일정 유형", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                scheduleTypes.forEach { (key, label) ->
                    FilterChip(
                        selected = selectedType == key,
                        onClick = { onTypeChange(key) },
                        label = { Text(label) },
                    )
                }
            }
        }
    }
}

@Composable
private fun FormFields(
    title: String,
    memo: String,
    dateText: String,
    startTimeText: String,
    endTimeText: String,
    onTitleChange: (String) -> Unit,
    onMemoChange: (String) -> Unit,
    onPickDate: () -> Unit,
    onPickStartTime: () -> Unit,
    onPickEndTime: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            OutlinedTextField(
                value = title,
                onValueChange = onTitleChange,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("일정 제목") },
                placeholder = { Text("예: 병원, 회의, 가족 식사") },
                leadingIcon = { Icon(Icons.Outlined.EditCalendar, contentDescription = null) },
                singleLine = true,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                PickerItem("날짜", dateText, Modifier.weight(1f), onPickDate, Icons.Outlined.CalendarMonth)
                PickerItem("시작", startTimeText, Modifier.weight(1f), onPickStartTime, Icons.Outlined.Schedule)
                PickerItem("종료", endTimeText, Modifier.weight(1f), onPickEndTime, Icons.Outlined.Schedule)
            }
            OutlinedTextField(
                value = memo,
                onValueChange = onMemoChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 112.dp),
                label = { Text("메모") },
                placeholder = { Text("필요한 내용을 적어주세요") },
                leadingIcon = { Icon(Icons.Outlined.Description, contentDescription = null) },
                minLines = 3,
            )
        }
    }
}

@Composable
private fun PickerItem(
    label: String,
    value: String,
    modifier: Modifier,
    onClick: () -> Unit,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
) {
    Card(
        onClick = onClick,
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    ) {
        ListItem(
            headlineContent = { Text(value, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Bold) },
            supportingContent = { Text(label) },
            leadingContent = { Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
        )
    }
}
