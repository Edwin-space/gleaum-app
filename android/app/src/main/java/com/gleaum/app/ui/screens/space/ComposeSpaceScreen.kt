package com.gleaum.app.ui.screens.space

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Login
import androidx.compose.material.icons.automirrored.outlined.SpeakerNotes
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.AddHome
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.FamilyRestroom
import androidx.compose.material.icons.outlined.GroupAdd
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.PushPin
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.gleaum.app.NativeAppSchedule
import com.gleaum.app.NativeSpaceItem
import com.gleaum.app.NativeSpaceMember
import com.gleaum.app.NativeSpacePost
import com.gleaum.app.NativeSpaceSummary
import com.gleaum.app.ui.components.GleaumLabelBadge
import com.gleaum.app.ui.components.GleaumStateCard
import com.gleaum.app.ui.components.StateKind

enum class SpaceManageAction { JOIN, CREATE, RENAME, REGENERATE_INVITE, CONVERT_TO_FAMILY, DELETE, ADVANCED }

private enum class SpaceSection(val label: String) {
    FEED("소식"),
    SCHEDULES("일정"),
    MEMBERS("멤버"),
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComposeSpaceScreen(
    innerPadding: PaddingValues,
    summary: NativeSpaceSummary?,
    canManageSpaces: Boolean,
    canInviteMembers: Boolean,
    loading: Boolean,
    errorMessage: String?,
    onRetry: () -> Unit,
    onCopyInviteCode: (String) -> Unit,
    onShareInviteCode: (String) -> Unit,
    onInviteChild: () -> Unit,
    onSpaceClick: (NativeSpaceItem) -> Unit,
    onMemberClick: (NativeSpaceMember) -> Unit,
    onManageAction: (SpaceManageAction) -> Unit,
    onCreatePost: (String) -> Unit,
    onCreateSchedule: () -> Unit,
    onOpenSchedule: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var sectionName by rememberSaveable { mutableStateOf(SpaceSection.FEED.name) }
    var showSpacePicker by rememberSaveable { mutableStateOf(false) }
    var showManagement by rememberSaveable { mutableStateOf(false) }
    var showInvite by rememberSaveable { mutableStateOf(false) }
    var showFamilyMemberInvite by rememberSaveable { mutableStateOf(false) }
    var showPostComposer by rememberSaveable { mutableStateOf(false) }
    var postContent by rememberSaveable { mutableStateOf("") }
    val section = runCatching { SpaceSection.valueOf(sectionName) }.getOrDefault(SpaceSection.FEED)

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            start = 20.dp,
            top = innerPadding.calculateTopPadding() + 8.dp,
            end = 20.dp,
            bottom = innerPadding.calculateBottomPadding() + 24.dp,
        ),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        when {
            loading -> item { StateCard("공간 정보를 불러오는 중이에요", "공간의 최신 소식과 일정을 확인하고 있어요.", null, onRetry) }
            errorMessage != null -> item { StateCard("공간을 불러오지 못했어요", errorMessage, "다시 시도", onRetry) }
            summary != null -> {
                item {
                    CurrentSpaceCard(
                        active = summary.activeSpace,
                        onSwitch = { showSpacePicker = true },
                        onSettings = if (
                            canManageSpaces &&
                            summary.activeSpace?.role == "admin" &&
                            summary.activeSpace?.isPersonal == false
                        ) ({ showManagement = true }) else null,
                    )
                }
                item { SectionTabs(section) { sectionName = it.name } }
                when (section) {
                    SpaceSection.FEED -> {
                        item { PostComposerCard { showPostComposer = true } }
                        if (summary.recentPosts.isEmpty()) {
                            item { CommunityEmptyCard { showPostComposer = true } }
                        } else {
                            summary.recentPosts.forEach { post ->
                                item(key = "post-${post.id}") { PostCard(post) }
                            }
                        }
                    }
                    SpaceSection.SCHEDULES -> {
                        item { ScheduleSectionHeader(onCreateSchedule) }
                        if (summary.upcomingSchedules.isEmpty()) {
                            item { EmptyCard("예정된 공간 일정이 없어요", "함께 알아야 할 일정을 이 공간에 등록해보세요.", "일정 추가", onCreateSchedule) }
                        } else {
                            summary.upcomingSchedules.forEach { schedule ->
                                item(key = "schedule-${schedule.id}") { ScheduleCard(schedule) { onOpenSchedule(schedule.id) } }
                            }
                        }
                    }
                    SpaceSection.MEMBERS -> {
                        item {
                            MemberSectionHeader(
                                summary.members.size,
                                canInviteMembers &&
                                    summary.activeSpace?.role == "admin" &&
                                    summary.activeSpace?.isPersonal != true,
                            ) {
                                showFamilyMemberInvite = false
                                showInvite = true
                            }
                        }
                        if (summary.members.isEmpty()) {
                            item { EmptyCard("표시할 멤버가 없어요", "아직 이 공간에 함께하는 멤버가 없어요.") }
                        } else {
                            summary.members.forEach { member ->
                                item(key = "member-${member.id}") {
                                    MemberItemCard(
                                        member = member,
                                        canManage = summary.activeSpace?.role == "admin" &&
                                            summary.activeSpace?.isPersonal == false &&
                                            (!member.isMe || summary.activeSpace?.spaceKind == "family"),
                                        isFamily = summary.activeSpace?.spaceKind == "family",
                                        onClick = { onMemberClick(member) },
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showPostComposer) {
        AlertDialog(
            onDismissRequest = { showPostComposer = false },
            icon = { Icon(Icons.AutoMirrored.Outlined.SpeakerNotes, contentDescription = null) },
            title = { Text("공간에 소식 남기기") },
            text = {
                OutlinedTextField(
                    value = postContent,
                    onValueChange = { if (it.length <= 2000) postContent = it },
                    label = { Text("함께 공유할 내용") },
                    minLines = 4,
                    maxLines = 8,
                    modifier = Modifier.fillMaxWidth(),
                )
            },
            confirmButton = {
                Button(
                    enabled = postContent.isNotBlank(),
                    onClick = {
                        onCreatePost(postContent.trim())
                        postContent = ""
                        showPostComposer = false
                    },
                ) { Text("게시") }
            },
            dismissButton = { TextButton(onClick = { showPostComposer = false }) { Text("취소") } },
        )
    }

    if (showSpacePicker && summary != null) {
        ModalBottomSheet(onDismissRequest = { showSpacePicker = false }) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(start = 20.dp, end = 20.dp, bottom = 28.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text("공간 전환", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text("보고 싶은 커뮤니티를 선택하세요.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                summary.spaces.forEach { space ->
                    SpacePickerRow(space) {
                        if (!space.isActive) onSpaceClick(space)
                        showSpacePicker = false
                    }
                }
                if (canManageSpaces || canInviteMembers) Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (canInviteMembers) {
                    OutlinedButton(onClick = { showSpacePicker = false; onManageAction(SpaceManageAction.JOIN) }, modifier = Modifier.weight(1f)) {
                        Icon(Icons.AutoMirrored.Outlined.Login, contentDescription = null, modifier = Modifier.size(18.dp))
                        Text("코드로 참여", Modifier.padding(start = 6.dp))
                    }
                    }
                    if (canManageSpaces) {
                    FilledTonalButton(onClick = { showSpacePicker = false; onManageAction(SpaceManageAction.CREATE) }, modifier = Modifier.weight(1f)) {
                        Icon(Icons.Outlined.AddHome, contentDescription = null, modifier = Modifier.size(18.dp))
                        Text("새 공간", Modifier.padding(start = 6.dp))
                    }
                    }
                }
            }
        }
    }

    if (showManagement && summary != null) {
        ModalBottomSheet(onDismissRequest = { showManagement = false }) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(start = 20.dp, end = 20.dp, bottom = 28.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text("공간 설정", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text("공간 이름과 운영 상태를 관리합니다. 멤버 초대는 멤버 탭에서 진행하세요.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                ManageCard(summary.activeSpace, canManageSpaces) {
                    showManagement = false
                    onManageAction(it)
                }
            }
        }
    }

    if (showInvite && summary?.activeSpace != null) {
        val active = summary.activeSpace
        val familyChoiceRequired = active.spaceKind == "family" && !showFamilyMemberInvite
        ModalBottomSheet(
            onDismissRequest = {
                showInvite = false
                showFamilyMemberInvite = false
            },
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(start = 20.dp, end = 20.dp, bottom = 28.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(
                    if (familyChoiceRequired) "가족 초대" else if (active.spaceKind == "family") "가족 구성원 초대" else "멤버 초대",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                )
                if (familyChoiceRequired) {
                    Text(
                        "초대할 가족 유형을 먼저 선택해 주세요. 자녀는 보호자 확인과 동의가 포함된 별도 절차로 연결됩니다.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    InviteTypeCard(
                        icon = Icons.Outlined.Person,
                        title = "일반 가족 구성원",
                        description = "아빠, 엄마, 조부모, 배우자 등 성인 가족을 초대합니다.",
                    ) { showFamilyMemberInvite = true }
                    InviteTypeCard(
                        icon = Icons.Outlined.FamilyRestroom,
                        title = "자녀",
                        description = "자녀 정보 등록, 보호자 확인·동의, 일회성 초대 순서로 안전하게 연결합니다.",
                    ) {
                        showInvite = false
                        onInviteChild()
                    }
                } else {
                    Text(
                        if (active.spaceKind == "family") {
                            "가족에게 아래 코드나 초대 링크를 보내세요. 참여 후 멤버 목록에서 가족 관계를 지정할 수 있습니다."
                        } else {
                            "함께할 사람에게 아래 코드나 초대 링크를 보내세요."
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    active.inviteCode?.let {
                        InviteCodeCard(it, onCopyInviteCode, onShareInviteCode)
                    } ?: GleaumStateCard(
                        title = "초대 코드가 필요해요",
                        message = "새 초대 코드를 만든 뒤 공유할 수 있습니다.",
                        kind = StateKind.EMPTY,
                        actionLabel = "코드 만들기",
                        onAction = {
                            showInvite = false
                            onManageAction(SpaceManageAction.REGENERATE_INVITE)
                        },
                    )
                    TextButton(
                        onClick = {
                            showInvite = false
                            onManageAction(SpaceManageAction.REGENERATE_INVITE)
                        },
                    ) {
                        Icon(Icons.Outlined.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                        Text("초대 코드 새로 만들기", Modifier.padding(start = 6.dp))
                    }
                    if (active.spaceKind == "family") {
                        OutlinedButton(onClick = { showFamilyMemberInvite = false }, modifier = Modifier.fillMaxWidth()) {
                            Text("가족 유형 다시 선택")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CurrentSpaceCard(active: NativeSpaceItem?, onSwitch: () -> Unit, onSettings: (() -> Unit)?) {
    ElevatedCard(modifier = Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.fillMaxWidth().padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
            Row(
                modifier = Modifier.weight(1f).clickable(onClick = onSwitch).padding(4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                SpaceIcon(active?.isPersonal == true)
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(active?.name ?: "공간 선택", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(
                        when {
                            active?.isPersonal == true -> "나만의 공간"
                            active?.spaceKind == "family" -> "가족 공간 · ${familyRoleLabel(active.familyRole)}"
                            else -> "함께하는 공간"
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Icon(Icons.Outlined.KeyboardArrowDown, contentDescription = "공간 전환", tint = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            if (onSettings != null) IconButton(onClick = onSettings) { Icon(Icons.Outlined.Settings, contentDescription = "공간 설정") }
        }
    }
}

@Composable
private fun SectionTabs(selected: SpaceSection, onSelect: (SpaceSection) -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        SpaceSection.entries.forEach { section ->
            FilterChip(
                selected = selected == section,
                onClick = { onSelect(section) },
                label = { Text(section.label) },
                leadingIcon = if (selected == section) ({ Icon(Icons.Outlined.Check, contentDescription = null, modifier = Modifier.size(16.dp)) }) else null,
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun PostComposerCard(onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer),
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.size(40.dp)) {
                Box(contentAlignment = Alignment.Center) { Icon(Icons.Outlined.Edit, contentDescription = null, tint = MaterialTheme.colorScheme.onPrimaryContainer) }
            }
            Column(Modifier.weight(1f)) {
                Text("공간에 소식 남기기", fontWeight = FontWeight.SemiBold)
                Text("일상, 공지, 함께 알아야 할 내용을 공유하세요.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun PostCard(post: NativeSpacePost) {
    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                InitialAvatar(post.authorName.take(1).ifBlank { "?" })
                Column(Modifier.weight(1f)) {
                    Text(post.authorName, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                    Text(formatFeedTime(post.createdAt), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                if (post.pinned) {
                    GleaumLabelBadge("고정")
                }
            }
            Text(post.content.ifBlank { "공유된 내용이 없습니다." }, style = MaterialTheme.typography.bodyLarge)
            if (post.commentCount > 0) {
                Text("댓글 ${post.commentCount}개", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            }
        }
    }
}

@Composable
private fun CommunityEmptyCard(onCreatePost: () -> Unit) {
    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(Icons.AutoMirrored.Outlined.SpeakerNotes, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Text("아직 공유된 소식이 없어요", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("이 공간의 첫 소식을 남겨보세요. 멤버 모두가 같은 내용을 확인할 수 있어요.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            TextButton(onClick = onCreatePost) { Text("첫 소식 작성") }
        }
    }
}

@Composable
private fun ScheduleSectionHeader(onCreateSchedule: () -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text("다가오는 일정", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("이 공간에서 함께 보는 일정", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        FilledTonalButton(onClick = onCreateSchedule) {
            Icon(Icons.Outlined.Add, contentDescription = null, modifier = Modifier.size(18.dp))
            Text("일정 추가", Modifier.padding(start = 4.dp))
        }
    }
}

@Composable
private fun ScheduleCard(schedule: NativeAppSchedule, onClick: () -> Unit) {
    OutlinedCard(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        ListItem(
            headlineContent = { Text(schedule.title, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis) },
            supportingContent = { Text(formatScheduleTime(schedule), maxLines = 1, overflow = TextOverflow.Ellipsis) },
            leadingContent = {
                Surface(shape = MaterialTheme.shapes.medium, color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.size(44.dp)) {
                    Box(contentAlignment = Alignment.Center) { Icon(Icons.Outlined.CalendarMonth, contentDescription = null, tint = MaterialTheme.colorScheme.onPrimaryContainer) }
                }
            },
        )
    }
}

@Composable
private fun MemberSectionHeader(count: Int, canInvite: Boolean, onSettings: () -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text("함께하는 멤버", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("${count}명이 이 공간을 함께 사용 중", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        if (canInvite) TextButton(onClick = onSettings) { Icon(Icons.Outlined.GroupAdd, contentDescription = null, modifier = Modifier.size(18.dp)); Text("초대") }
    }
}

@Composable
private fun InviteCodeCard(
    code: String,
    onCopyInviteCode: (String) -> Unit,
    onShareInviteCode: ((String) -> Unit)? = null,
) {
    Surface(shape = MaterialTheme.shapes.medium, color = MaterialTheme.colorScheme.secondaryContainer) {
        Row(Modifier.padding(start = 14.dp, top = 10.dp, end = 6.dp, bottom = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("초대 코드", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.72f))
                Text(code, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSecondaryContainer)
            }
            IconButton(onClick = { onCopyInviteCode(code) }) { Icon(Icons.Outlined.ContentCopy, contentDescription = "초대 코드 복사") }
            if (onShareInviteCode != null) {
                IconButton(onClick = { onShareInviteCode(code) }) {
                    Icon(Icons.Outlined.GroupAdd, contentDescription = "초대 링크 공유")
                }
            }
        }
    }
}

@Composable
private fun InviteTypeCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    description: String,
    onClick: () -> Unit,
) {
    OutlinedCard(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        ListItem(
            headlineContent = { Text(title, fontWeight = FontWeight.SemiBold) },
            supportingContent = { Text(description) },
            leadingContent = {
                Surface(
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.primaryContainer,
                    modifier = Modifier.size(44.dp),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.onPrimaryContainer)
                    }
                }
            },
        )
    }
}

@Composable
private fun SpacePickerRow(space: NativeSpaceItem, onClick: () -> Unit) {
    OutlinedCard(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        ListItem(
            headlineContent = { Text(space.name, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis) },
            supportingContent = {
                Text(
                    if (space.isPersonal) "개인 공간"
                    else if (space.spaceKind == "family") {
                        "가족 공간 · ${familyRoleLabel(space.familyRole)} · ${space.memberCount}명"
                    } else {
                        "${space.memberCount}명 · ${roleLabel(space.role)}"
                    },
                )
            },
            leadingContent = { SpaceIcon(space.isPersonal) },
            trailingContent = { if (space.isActive) Icon(Icons.Outlined.Check, contentDescription = "현재 공간", tint = MaterialTheme.colorScheme.primary) },
        )
    }
}

@Composable
private fun MemberItemCard(member: NativeSpaceMember, canManage: Boolean, isFamily: Boolean, onClick: () -> Unit) {
    OutlinedCard(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (canManage) Modifier.clickable(onClick = onClick) else Modifier),
    ) {
        ListItem(
            headlineContent = { Text(member.displayName + if (member.isMe) " (나)" else "", maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.SemiBold) },
            supportingContent = {
                Text(
                    if (isFamily) "${member.email.ifBlank { "이메일 정보 없음" }} · ${roleLabel(member.role)}"
                    else member.email.ifBlank { roleLabel(member.role) },
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            },
            leadingContent = { InitialAvatar(member.displayName.take(1).ifBlank { "?" }) },
            trailingContent = { GleaumLabelBadge(if (isFamily) familyRoleLabel(member.familyRole) else roleLabel(member.role)) },
        )
    }
}

@Composable
private fun ManageCard(active: NativeSpaceItem?, canManageSpaces: Boolean, onManageAction: (SpaceManageAction) -> Unit) {
    val canManage = active?.role == "admin"
    val isShared = active?.isPersonal == false
    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        if (canManageSpaces) {
        ManageRow(Icons.Outlined.Edit, "공간 이름 변경", if (canManage) "현재 공간의 이름을 수정합니다" else "공간 지기만 수정할 수 있어요") { onManageAction(SpaceManageAction.RENAME) }
        if (canManage && isShared && active?.spaceKind != "family") {
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            ManageRow(Icons.Outlined.FamilyRestroom, "가족 공간으로 전환", "현재 멤버·일정·소식을 유지하고 가족 기능을 활성화합니다") { onManageAction(SpaceManageAction.CONVERT_TO_FAMILY) }
        }
        if (canManage && isShared) {
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            ManageRow(
                Icons.Outlined.DeleteOutline,
                "공간 삭제",
                if ((active?.memberCount ?: 0) > 1) "다른 멤버를 모두 내보낸 뒤 삭제할 수 있어요" else "일정·소식·공간 데이터가 영구 삭제됩니다",
                enabled = (active?.memberCount ?: 0) <= 1,
                danger = true,
            ) { onManageAction(SpaceManageAction.DELETE) }
        }
        }
    }
}

@Composable
private fun ManageRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    enabled: Boolean = true,
    danger: Boolean = false,
    onClick: () -> Unit,
) {
    val contentColor = when {
        !enabled -> MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.48f)
        danger -> MaterialTheme.colorScheme.error
        else -> MaterialTheme.colorScheme.primary
    }
    ListItem(
        modifier = Modifier.fillMaxWidth().then(if (enabled) Modifier.clickable(onClick = onClick) else Modifier),
        headlineContent = { Text(title, fontWeight = FontWeight.SemiBold, color = contentColor) },
        supportingContent = { Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = if (enabled) 1f else 0.48f)) },
        leadingContent = { Icon(icon, contentDescription = null, tint = contentColor) },
    )
}

@Composable
private fun EmptyCard(title: String, body: String, actionLabel: String? = null, onClick: (() -> Unit)? = null) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(body, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (actionLabel != null && onClick != null) Button(onClick = onClick) { Text(actionLabel) }
        }
    }
}

@Composable
private fun StateCard(title: String, body: String, actionLabel: String?, onAction: () -> Unit) {
    GleaumStateCard(title, body, kind = if (actionLabel == null) StateKind.LOADING else StateKind.ERROR, actionLabel = actionLabel, onAction = onAction)
}

@Composable
private fun SpaceIcon(personal: Boolean) {
    Surface(shape = CircleShape, color = if (personal) MaterialTheme.colorScheme.secondaryContainer else MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.size(44.dp)) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                if (personal) Icons.Outlined.Person else Icons.Outlined.Home,
                contentDescription = null,
                tint = if (personal) MaterialTheme.colorScheme.onSecondaryContainer else MaterialTheme.colorScheme.onPrimaryContainer,
            )
        }
    }
}

@Composable
private fun InitialAvatar(initial: String) {
    Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.size(40.dp)) {
        Box(contentAlignment = Alignment.Center) { Text(initial, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimaryContainer) }
    }
}

private fun formatFeedTime(value: String): String {
    if (value.length < 10) return "방금 전"
    return "${value.substring(5, 7).toIntOrNull() ?: ""}월 ${value.substring(8, 10).toIntOrNull() ?: ""}일"
}

private fun formatScheduleTime(schedule: NativeAppSchedule): String {
    val value = schedule.startTime
    if (value.length < 10) return if (schedule.allDay) "하루 종일" else "예정된 일정"
    val date = "${value.substring(5, 7).toIntOrNull() ?: ""}월 ${value.substring(8, 10).toIntOrNull() ?: ""}일"
    if (schedule.allDay || value.length < 16) return "$date · 하루 종일"
    return "$date · ${value.substring(11, 16)}"
}

private fun roleLabel(role: String?): String = when (role) {
    "admin" -> "공간 지기"
    "editor" -> "공간 운영자"
    else -> "공간 멤버"
}

private fun familyRoleLabel(role: String?): String = when (role) {
    "father" -> "아빠"
    "mother" -> "엄마"
    "grandfather" -> "할아버지"
    "grandmother" -> "할머니"
    "spouse" -> "배우자"
    "son" -> "아들"
    "daughter" -> "딸"
    "sibling" -> "형제·자매"
    "guardian" -> "보호자"
    "other" -> "기타 가족"
    else -> "가족 구성원"
}
