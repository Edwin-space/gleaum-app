package com.gleaum.app.ui.screens.family

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.Send
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ChildCare
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.HowToReg
import androidx.compose.material.icons.outlined.Link
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Security
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.gleaum.app.NativeFamilyDependent
import com.gleaum.app.NativeGuardianChallenge
import com.gleaum.app.ui.components.GleaumAdaptiveContent
import com.gleaum.app.ui.components.GleaumLabelBadge
import com.gleaum.app.ui.components.GleaumStateCard
import com.gleaum.app.ui.components.StateKind

enum class ChildAccountMode {
    MANAGE,
    CLAIM,
    CONSENT,
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComposeChildAccountScreen(
    mode: ChildAccountMode,
    signedInEmail: String?,
    dependents: List<NativeFamilyDependent>,
    loading: Boolean,
    busy: Boolean,
    message: String?,
    guardianChallenge: NativeGuardianChallenge?,
    consentToken: String?,
    claimCompleted: Boolean,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onCreateDependent: (String, String, String?, String) -> Unit,
    onStartVerification: (NativeFamilyDependent) -> Unit,
    onVerifyOtp: (String, String) -> Unit,
    onDismissChallenge: () -> Unit,
    onCompleteConsent: (String) -> Unit,
    onDismissConsent: () -> Unit,
    onCreateInvitation: (NativeFamilyDependent) -> Unit,
    onApprove: (NativeFamilyDependent) -> Unit,
    onReject: (NativeFamilyDependent) -> Unit,
    onClaimInvitation: () -> Unit,
) {
    var showRegistration by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        when (mode) {
                            ChildAccountMode.MANAGE -> "자녀 계정 연결"
                            ChildAccountMode.CLAIM -> "가족 공간 초대"
                            ChildAccountMode.CONSENT -> "보호자 확인"
                        },
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "뒤로")
                    }
                },
                actions = {
                    if (mode == ChildAccountMode.MANAGE) {
                        IconButton(onClick = onRefresh, enabled = !busy) {
                            Icon(Icons.Outlined.Refresh, contentDescription = "새로고침")
                        }
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
            when (mode) {
                ChildAccountMode.MANAGE -> ManageContent(
                    innerPadding = innerPadding,
                    dependents = dependents,
                    loading = loading,
                    busy = busy,
                    message = message,
                    onRefresh = onRefresh,
                    onRegister = { showRegistration = true },
                    onStartVerification = onStartVerification,
                    onCreateInvitation = onCreateInvitation,
                    onApprove = onApprove,
                    onReject = onReject,
                )

                ChildAccountMode.CLAIM -> ClaimContent(
                    innerPadding = innerPadding,
                    signedInEmail = signedInEmail,
                    busy = busy,
                    message = message,
                    completed = claimCompleted,
                    onClaim = onClaimInvitation,
                )

                ChildAccountMode.CONSENT -> ConsentEntryContent(
                    innerPadding = innerPadding,
                    busy = busy,
                    message = message,
                    token = consentToken,
                    onComplete = onCompleteConsent,
                )
            }
        }
    }

    if (showRegistration) {
        RegistrationDialog(
            busy = busy,
            onDismiss = { if (!busy) showRegistration = false },
            onSubmit = { name, birthDate, email, relationship ->
                onCreateDependent(name, birthDate, email, relationship)
                showRegistration = false
            },
        )
    }

    if (guardianChallenge != null) {
        GuardianOtpDialog(
            challenge = guardianChallenge,
            busy = busy,
            onDismiss = onDismissChallenge,
            onSubmit = onVerifyOtp,
        )
    }

    if (consentToken != null && mode != ChildAccountMode.CONSENT) {
        GuardianConsentDialog(
            token = consentToken,
            busy = busy,
            onDismiss = onDismissConsent,
            onComplete = onCompleteConsent,
        )
    }
}

@Composable
private fun ManageContent(
    innerPadding: PaddingValues,
    dependents: List<NativeFamilyDependent>,
    loading: Boolean,
    busy: Boolean,
    message: String?,
    onRefresh: () -> Unit,
    onRegister: () -> Unit,
    onStartVerification: (NativeFamilyDependent) -> Unit,
    onCreateInvitation: (NativeFamilyDependent) -> Unit,
    onApprove: (NativeFamilyDependent) -> Unit,
    onReject: (NativeFamilyDependent) -> Unit,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            start = 20.dp,
            top = innerPadding.calculateTopPadding() + 12.dp,
            end = 20.dp,
            bottom = innerPadding.calculateBottomPadding() + 32.dp,
        ),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            ElevatedCard(
                colors = CardDefaults.elevatedCardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                ),
            ) {
                Column(
                    Modifier.padding(22.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    GleaumLabelBadge("보호자 전용")
                    Text(
                        "승인 전에는 공간 권한을 열지 않습니다",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                    )
                    Text(
                        "자녀 정보 등록, 보호자 확인, 일회성 초대, 연결 계정 검토를 순서대로 진행합니다.",
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.76f),
                    )
                    Button(onClick = onRegister, enabled = !busy) {
                        Icon(Icons.Outlined.Add, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("자녀 등록")
                    }
                }
            }
        }

        item {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                StepTile(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Outlined.Email,
                    label = "보호자 확인",
                )
                StepTile(
                    modifier = Modifier.weight(1f),
                    icon = Icons.AutoMirrored.Outlined.Send,
                    label = "초대 공유",
                )
                StepTile(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Outlined.HowToReg,
                    label = "최종 승인",
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text(
                        "등록된 자녀",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        "${dependents.size}명",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                FilledTonalButton(onClick = onRefresh, enabled = !busy) {
                    Icon(Icons.Outlined.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("새로고침")
                }
            }
        }

        when {
            loading -> item {
                GleaumStateCard(
                    title = "자녀 정보를 확인하고 있어요",
                    message = "가족 공간의 연결 상태를 안전하게 불러옵니다.",
                    kind = StateKind.LOADING,
                )
            }

            !message.isNullOrBlank() -> item {
                GleaumStateCard(
                    title = "자녀 정보를 불러오지 못했어요",
                    message = message,
                    kind = StateKind.ERROR,
                    actionLabel = "다시 시도",
                    onAction = onRefresh,
                )
            }

            dependents.isEmpty() -> item {
                GleaumStateCard(
                    title = "등록된 자녀가 없습니다",
                    message = "이름과 생년월일을 먼저 등록한 뒤 보호자 확인을 진행해 주세요.",
                    kind = StateKind.EMPTY,
                    actionLabel = "자녀 등록",
                    onAction = onRegister,
                )
            }

            else -> items(dependents, key = { it.id }) { dependent ->
                DependentCard(
                    dependent = dependent,
                    busy = busy,
                    onStartVerification = onStartVerification,
                    onCreateInvitation = onCreateInvitation,
                    onApprove = onApprove,
                    onReject = onReject,
                )
            }
        }

        item {
            Surface(
                color = MaterialTheme.colorScheme.secondaryContainer,
                shape = MaterialTheme.shapes.large,
            ) {
                Row(
                    Modifier.padding(18.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.Top,
                ) {
                    Icon(
                        Icons.Outlined.Security,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSecondaryContainer,
                    )
                    Text(
                        "위치 수집·공유는 이 절차에 포함되지 않습니다. 별도 동의와 보호 체계를 갖춘 뒤에만 제공합니다.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                    )
                }
            }
        }
    }
}

@Composable
private fun StepTile(modifier: Modifier, icon: ImageVector, label: String) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.surfaceContainer,
        shape = MaterialTheme.shapes.large,
    ) {
        Column(
            Modifier.padding(horizontal = 10.dp, vertical = 14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Text(
                label,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun DependentCard(
    dependent: NativeFamilyDependent,
    busy: Boolean,
    onStartVerification: (NativeFamilyDependent) -> Unit,
    onCreateInvitation: (NativeFamilyDependent) -> Unit,
    onApprove: (NativeFamilyDependent) -> Unit,
    onReject: (NativeFamilyDependent) -> Unit,
) {
    val status = statusMeta(dependent.status)
    OutlinedCard(Modifier.fillMaxWidth()) {
        Column(
            Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Row(verticalAlignment = Alignment.Top) {
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = MaterialTheme.shapes.medium,
                ) {
                    Icon(
                        Icons.Outlined.ChildCare,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(11.dp).size(24.dp),
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(
                        dependent.displayName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        dependent.candidateEmail
                            ?: dependent.expectedEmail
                            ?: "초대 수락 후 연결 계정 확인",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                GleaumLabelBadge(status.first)
            }

            Text(
                status.second,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            HorizontalDivider()

            when (dependent.status) {
                "consent_pending" -> Button(
                    onClick = { onStartVerification(dependent) },
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Icon(Icons.Outlined.Email, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("내 이메일로 보호자 확인")
                }

                "ready", "invited" -> Button(
                    onClick = { onCreateInvitation(dependent) },
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Icon(Icons.Outlined.Link, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("일회성 초대 링크 공유")
                }

                "approval_pending" -> Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    OutlinedButton(
                        onClick = { onReject(dependent) },
                        enabled = !busy,
                        modifier = Modifier.weight(1f),
                    ) {
                        Icon(Icons.Outlined.Close, contentDescription = null)
                        Spacer(Modifier.width(6.dp))
                        Text("거절")
                    }
                    Button(
                        onClick = { onApprove(dependent) },
                        enabled = !busy,
                        modifier = Modifier.weight(1f),
                    ) {
                        Icon(Icons.Outlined.CheckCircle, contentDescription = null)
                        Spacer(Modifier.width(6.dp))
                        Text("최종 승인")
                    }
                }

                "linked" -> Row(
                    Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(
                        Icons.Outlined.CheckCircle,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.tertiary,
                    )
                    Text(
                        "자녀 계정 연결이 완료되었습니다",
                        color = MaterialTheme.colorScheme.tertiary,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
        }
    }
}

@Composable
private fun ClaimContent(
    innerPadding: PaddingValues,
    signedInEmail: String?,
    busy: Boolean,
    message: String?,
    completed: Boolean,
    onClaim: () -> Unit,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            start = 20.dp,
            top = innerPadding.calculateTopPadding() + 20.dp,
            end = 20.dp,
            bottom = innerPadding.calculateBottomPadding() + 32.dp,
        ),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            ElevatedCard(
                colors = CardDefaults.elevatedCardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                ),
            ) {
                Column(
                    Modifier.padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Icon(
                        if (completed) Icons.Outlined.CheckCircle else Icons.Outlined.ChildCare,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(34.dp),
                    )
                    Text(
                        if (completed) "보호자 승인을 기다리고 있어요" else "가족 공간 초대가 도착했어요",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        if (completed) {
                            "연결 요청이 보호자에게 전달되었습니다. 보호자가 계정을 확인하고 승인하면 가족 공간을 사용할 수 있습니다."
                        } else {
                            "현재 로그인한 계정으로 연결을 요청합니다. 보호자가 최종 승인하기 전에는 가족 공간 정보에 접근할 수 없습니다."
                        },
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.76f),
                    )
                }
            }
        }

        if (!signedInEmail.isNullOrBlank()) {
            item {
                OutlinedCard {
                    Column(
                        Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Text("연결할 계정", style = MaterialTheme.typography.labelMedium)
                        Text(signedInEmail, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        if (!message.isNullOrBlank()) {
            item {
                GleaumStateCard(
                    title = "연결 요청을 완료하지 못했어요",
                    message = message,
                    kind = StateKind.ERROR,
                )
            }
        }

        if (!completed) {
            item {
                Button(
                    onClick = onClaim,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Icon(Icons.Outlined.HowToReg, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text(if (busy) "연결 요청 중..." else "이 계정으로 연결 요청")
                }
            }
        }
    }
}

@Composable
private fun ConsentEntryContent(
    innerPadding: PaddingValues,
    busy: Boolean,
    message: String?,
    token: String?,
    onComplete: (String) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(innerPadding)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        if (token.isNullOrBlank()) {
            GleaumStateCard(
                title = "유효하지 않은 보호자 확인입니다",
                message = "자녀 관리 화면에서 새 확인 코드를 요청해 주세요.",
                kind = StateKind.ERROR,
            )
        } else {
            GuardianConsentCard(
                token = token,
                busy = busy,
                message = message,
                onComplete = onComplete,
            )
        }
    }
}

@Composable
private fun RegistrationDialog(
    busy: Boolean,
    onDismiss: () -> Unit,
    onSubmit: (String, String, String?, String) -> Unit,
) {
    var name by remember { mutableStateOf("") }
    var birthDate by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var relationship by remember { mutableStateOf("parent") }
    val validDate = Regex("^\\d{4}-\\d{2}-\\d{2}$").matches(birthDate)
    val canSubmit = name.isNotBlank() && validDate && !busy

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("자녀 정보 등록") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    "계정 이메일은 선택 사항입니다. 모르면 비워 두고 초대 수락 후 확인할 수 있습니다.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it.take(40) },
                    label = { Text("자녀 이름") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = birthDate,
                    onValueChange = { birthDate = it.filter { char -> char.isDigit() || char == '-' }.take(10) },
                    label = { Text("생년월일") },
                    placeholder = { Text("2015-03-18") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it.trim().take(120) },
                    label = { Text("연결 허용 이메일 (선택)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilledTonalButton(
                        onClick = { relationship = "parent" },
                        enabled = relationship != "parent",
                    ) { Text("부모") }
                    FilledTonalButton(
                        onClick = { relationship = "guardian" },
                        enabled = relationship != "guardian",
                    ) { Text("법정대리인") }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSubmit(
                        name.trim(),
                        birthDate,
                        email.takeIf { it.isNotBlank() },
                        relationship,
                    )
                },
                enabled = canSubmit,
            ) {
                Text("등록")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss, enabled = !busy) { Text("취소") } },
    )
}

@Composable
private fun GuardianOtpDialog(
    challenge: NativeGuardianChallenge,
    busy: Boolean,
    onDismiss: () -> Unit,
    onSubmit: (String, String) -> Unit,
) {
    var code by remember(challenge.challengeToken) { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = { Icon(Icons.Outlined.Email, contentDescription = null) },
        title = { Text("보호자 이메일 확인") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("${challenge.email}로 보낸 8자리 확인 코드를 입력해 주세요.")
                OutlinedTextField(
                    value = code,
                    onValueChange = { code = it.filter(Char::isDigit).take(8) },
                    label = { Text("확인 코드") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onSubmit(challenge.challengeToken, code) },
                enabled = code.length == 8 && !busy,
            ) {
                Text(if (busy) "확인 중..." else "코드 확인")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss, enabled = !busy) { Text("취소") } },
    )
}

@Composable
private fun GuardianConsentDialog(
    token: String,
    busy: Boolean,
    onDismiss: () -> Unit,
    onComplete: (String) -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("보호자 필수 동의") },
        text = {
            GuardianConsentChecklist(
                busy = busy,
                onComplete = { onComplete(token) },
            )
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss, enabled = !busy) { Text("나중에") } },
    )
}

@Composable
private fun GuardianConsentCard(
    token: String,
    busy: Boolean,
    message: String?,
    onComplete: (String) -> Unit,
) {
    ElevatedCard(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text(
                "보호자 확인 및 동의",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
            )
            Text(
                "이메일 확인을 마친 보호자가 각 필수 항목을 직접 확인합니다.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (!message.isNullOrBlank()) {
                Text(message, color = MaterialTheme.colorScheme.error)
            }
            GuardianConsentChecklist(
                busy = busy,
                onComplete = { onComplete(token) },
            )
        }
    }
}

@Composable
private fun GuardianConsentChecklist(
    busy: Boolean,
    onComplete: () -> Unit,
) {
    var service by remember { mutableStateOf(false) }
    var privacy by remember { mutableStateOf(false) }
    var sharing by remember { mutableStateOf(false) }
    val allChecked = service && privacy && sharing

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        ConsentRow(
            checked = service,
            title = "서비스 가입 및 이용",
            description = "자녀 계정 생성과 연령 기반 기능 제한에 동의합니다.",
            onCheckedChange = { service = it },
        )
        ConsentRow(
            checked = privacy,
            title = "개인정보 처리",
            description = "자녀 정보와 연결 계정 식별정보 처리에 동의합니다.",
            onCheckedChange = { privacy = it },
        )
        ConsentRow(
            checked = sharing,
            title = "가족 공간 정보 공유",
            description = "허용된 일정과 활동 정보를 가족 구성원에게 공유하는 데 동의합니다.",
            onCheckedChange = { sharing = it },
        )
        Button(
            onClick = onComplete,
            enabled = allChecked && !busy,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Icon(Icons.Outlined.Security, contentDescription = null)
            Spacer(Modifier.width(8.dp))
            Text(if (busy) "처리 중..." else "동의하고 계속")
        }
    }
}

@Composable
private fun ConsentRow(
    checked: Boolean,
    title: String,
    description: String,
    onCheckedChange: (Boolean) -> Unit,
) {
    Surface(
        color = MaterialTheme.colorScheme.surfaceContainer,
        shape = MaterialTheme.shapes.medium,
        onClick = { onCheckedChange(!checked) },
    ) {
        Row(
            Modifier.padding(12.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Checkbox(checked = checked, onCheckedChange = onCheckedChange)
            Column(Modifier.padding(start = 6.dp, top = 4.dp)) {
                Text(title, fontWeight = FontWeight.SemiBold)
                Text(
                    description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

private fun statusMeta(status: String): Pair<String, String> = when (status) {
    "consent_pending" -> "보호자 확인 필요" to "이메일 코드 확인과 필수 동의를 진행해 주세요."
    "ready" -> "초대 준비 완료" to "자녀에게 보낼 72시간 일회성 초대를 만들 수 있습니다."
    "invited" -> "초대 발급됨" to "필요하면 기존 링크를 폐기하고 새 링크를 공유할 수 있습니다."
    "approval_pending" -> "최종 승인 대기" to "연결 요청 계정을 확인한 뒤 승인하거나 거절해 주세요."
    "linked" -> "연결 완료" to "가족 공간 멤버로 안전하게 연결되었습니다."
    "suspended" -> "이용 중지" to "자녀 계정 이용이 일시 중지되었습니다."
    else -> "연결 해제" to "자녀 계정 연결이 해제되었습니다."
}
