package com.gleaum.app.ui.screens.onboarding

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.SpaceDashboard
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.gleaum.app.NativeOnboardingActivity

@Composable
fun ComposeOnboardingScreen(
    step: Int,
    saving: Boolean,
    displayName: String,
    realName: String,
    nameMode: String,
    primaryGoal: String,
    homeLayout: String,
    spaceIntent: String,
    spaceSetupMode: String,
    newSpaceName: String,
    joinCode: String,
    biometricLock: Boolean,
    biometricAvailable: Boolean,
    scheduleReminders: Boolean,
    expenseReminders: Boolean,
    spaceUpdates: Boolean,
    goals: List<NativeOnboardingActivity.Option>,
    layouts: List<NativeOnboardingActivity.Option>,
    spaces: List<NativeOnboardingActivity.Option>,
    onDisplayNameChange: (String) -> Unit,
    onRealNameChange: (String) -> Unit,
    onNameModeChange: (String) -> Unit,
    onGoalSelected: (NativeOnboardingActivity.Option) -> Unit,
    onLayoutSelected: (NativeOnboardingActivity.Option) -> Unit,
    onSpaceIntentSelected: (NativeOnboardingActivity.Option) -> Unit,
    onSpaceSetupModeChange: (String) -> Unit,
    onNewSpaceNameChange: (String) -> Unit,
    onJoinCodeChange: (String) -> Unit,
    onScheduleRemindersChange: (Boolean) -> Unit,
    onExpenseRemindersChange: (Boolean) -> Unit,
    onSpaceUpdatesChange: (Boolean) -> Unit,
    onBiometricLockChange: (Boolean) -> Unit,
    onPrevious: () -> Unit,
    onNext: () -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, top = 24.dp, end = 20.dp, bottom = 28.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        item { OnboardingHero(step = step) }
        item {
            when (step) {
                0 -> NameStep(displayName, realName, nameMode, onDisplayNameChange, onRealNameChange, onNameModeChange)
                1 -> OptionStep(options = goals, selected = primaryGoal, onSelect = onGoalSelected)
                2 -> OptionStep(options = layouts, selected = homeLayout, onSelect = onLayoutSelected)
                3 -> SpaceStep(
                    spaces = spaces,
                    spaceIntent = spaceIntent,
                    spaceSetupMode = spaceSetupMode,
                    newSpaceName = newSpaceName,
                    joinCode = joinCode,
                    onSpaceIntentSelected = onSpaceIntentSelected,
                    onSpaceSetupModeChange = onSpaceSetupModeChange,
                    onNewSpaceNameChange = onNewSpaceNameChange,
                    onJoinCodeChange = onJoinCodeChange,
                )
                else -> FinalStep(
                    scheduleReminders = scheduleReminders,
                    expenseReminders = expenseReminders,
                    spaceUpdates = spaceUpdates,
                    biometricLock = biometricLock,
                    biometricAvailable = biometricAvailable,
                    onScheduleRemindersChange = onScheduleRemindersChange,
                    onExpenseRemindersChange = onExpenseRemindersChange,
                    onSpaceUpdatesChange = onSpaceUpdatesChange,
                    onBiometricLockChange = onBiometricLockChange,
                )
            }
        }
        item { Actions(step = step, saving = saving, onPrevious = onPrevious, onNext = onNext) }
    }
}

@Composable
private fun OnboardingHero(step: Int) {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
    ) {
        Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            AssistChip(onClick = {}, label = { Text("GLEAUM SETUP ${step + 1}/5") })
            LinearProgressIndicator(progress = { (step + 1) / 5f }, modifier = Modifier.fillMaxWidth())
            Text(
                text = when (step) {
                    0 -> "어떻게 불러드릴까요?"
                    1 -> "무엇을 중심으로 쓸까요?"
                    2 -> "홈 화면을 고를게요"
                    3 -> "공간을 바로 준비할까요?"
                    else -> "알림과 보안을 맞춰요"
                },
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
            )
            Text("처음 화면과 기본 설정을 사용자에게 맞게 구성합니다.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.72f))
        }
    }
}

@Composable
private fun NameStep(
    displayName: String,
    realName: String,
    nameMode: String,
    onDisplayNameChange: (String) -> Unit,
    onRealNameChange: (String) -> Unit,
    onNameModeChange: (String) -> Unit,
) {
    var localDisplayName by remember { mutableStateOf(displayName) }
    var localRealName by remember { mutableStateOf(realName) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        OutlinedTextField(
            value = localDisplayName,
            onValueChange = { localDisplayName = it; onDisplayNameChange(it) },
            label = { Text("닉네임 / 표시 이름") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = localRealName,
            onValueChange = { localRealName = it; onRealNameChange(it) },
            label = { Text("실명 (선택)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        ChoiceCard("nickname", "닉네임으로 표시", "서비스 안에서 닉네임을 기본으로 사용", nameMode == "nickname") { onNameModeChange("nickname") }
        ChoiceCard("real_name", "실명으로 표시", "내 이름을 그대로 사용", nameMode == "real_name") { onNameModeChange("real_name") }
    }
}

@Composable
private fun OptionStep(options: List<NativeOnboardingActivity.Option>, selected: String, onSelect: (NativeOnboardingActivity.Option) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        options.forEach { option ->
            ChoiceCard(option.key, option.title, option.desc, option.key == selected) { onSelect(option) }
        }
    }
}

@Composable
private fun SpaceStep(
    spaces: List<NativeOnboardingActivity.Option>,
    spaceIntent: String,
    spaceSetupMode: String,
    newSpaceName: String,
    joinCode: String,
    onSpaceIntentSelected: (NativeOnboardingActivity.Option) -> Unit,
    onSpaceSetupModeChange: (String) -> Unit,
    onNewSpaceNameChange: (String) -> Unit,
    onJoinCodeChange: (String) -> Unit,
) {
    var localSpaceName by remember { mutableStateOf(newSpaceName) }
    var localJoinCode by remember { mutableStateOf(joinCode) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        SectionLabel("공간 사용 방식")
        spaces.forEach { option -> ChoiceCard(option.key, option.title, option.desc, option.key == spaceIntent) { onSpaceIntentSelected(option) } }
        SectionLabel("공간 설정")
        ChoiceCard("skip", "나중에 설정", "먼저 개인 공간으로 시작", spaceSetupMode == "skip") { onSpaceSetupModeChange("skip") }
        ChoiceCard("create", "새 공유 공간 만들기", "연인, 친구, 가족과 함께 쓸 공간 생성", spaceSetupMode == "create") { onSpaceSetupModeChange("create") }
        if (spaceSetupMode == "create") {
            OutlinedTextField(
                value = localSpaceName,
                onValueChange = { localSpaceName = it; onNewSpaceNameChange(it) },
                label = { Text("공간 이름") },
                placeholder = { Text("예: 우리집, 데이트 캘린더") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
        }
        ChoiceCard("join", "초대 코드로 참여", "받은 GLEAUM 코드로 공간 입장", spaceSetupMode == "join") { onSpaceSetupModeChange("join") }
        if (spaceSetupMode == "join") {
            OutlinedTextField(
                value = localJoinCode,
                onValueChange = { localJoinCode = it; onJoinCodeChange(it) },
                label = { Text("초대 코드") },
                placeholder = { Text("GLEAUM-XXXXXXX") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun FinalStep(
    scheduleReminders: Boolean,
    expenseReminders: Boolean,
    spaceUpdates: Boolean,
    biometricLock: Boolean,
    biometricAvailable: Boolean,
    onScheduleRemindersChange: (Boolean) -> Unit,
    onExpenseRemindersChange: (Boolean) -> Unit,
    onSpaceUpdatesChange: (Boolean) -> Unit,
    onBiometricLockChange: (Boolean) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        SectionLabel("알림")
        SwitchRow("일정 리마인더", "일정 시작 전 알림", scheduleReminders, onScheduleRemindersChange)
        SwitchRow("가계부 알림", "정기 지출 D-1 알림", expenseReminders, onExpenseRemindersChange)
        SwitchRow("공간 업데이트", "초대/멤버/공간 소식", spaceUpdates, onSpaceUpdatesChange)
        SectionLabel("앱 잠금")
        SwitchRow(
            title = "생체인증 앱 잠금",
            description = if (biometricAvailable) "앱을 열 때 지문 또는 기기 잠금으로 보호" else "기기 보안 설정 후 사용할 수 있어요",
            checked = biometricLock && biometricAvailable,
            onCheckedChange = { if (biometricAvailable) onBiometricLockChange(it) },
        )
    }
}

@Composable
private fun ChoiceCard(key: String, title: String, desc: String, selected: Boolean, onClick: () -> Unit) {
    OutlinedCard(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        ListItem(
            headlineContent = { Text(title, fontWeight = FontWeight.SemiBold) },
            supportingContent = { Text(desc) },
            leadingContent = { RadioButton(selected = selected, onClick = onClick) },
        )
    }
}

@Composable
private fun SwitchRow(title: String, description: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        ListItem(
            headlineContent = { Text(title, fontWeight = FontWeight.SemiBold) },
            supportingContent = { Text(description) },
            trailingContent = { Switch(checked = checked, onCheckedChange = onCheckedChange) },
            modifier = Modifier.clickable { onCheckedChange(!checked) },
        )
    }
}

@Composable
private fun SectionLabel(title: String) {
    Text(title, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
}

@Composable
private fun Actions(step: Int, saving: Boolean, onPrevious: () -> Unit, onNext: () -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
        if (step > 0) {
            TextButton(onClick = onPrevious, modifier = Modifier.weight(1f), enabled = !saving) { Text("이전") }
        }
        Button(onClick = onNext, modifier = Modifier.weight(1f), enabled = !saving) { Text(if (saving && step == 4) "저장 중..." else if (step == 4) "시작하기" else "다음") }
    }
}
