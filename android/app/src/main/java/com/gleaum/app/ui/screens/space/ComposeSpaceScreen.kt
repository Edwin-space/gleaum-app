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
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.GroupAdd
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Badge
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.gleaum.app.NativeSpaceItem
import com.gleaum.app.NativeSpaceMember
import com.gleaum.app.NativeSpaceSummary

enum class SpaceManageAction {
    JOIN,
    CREATE,
    RENAME,
    REGENERATE_INVITE,
    ADVANCED,
}

@Composable
fun ComposeSpaceScreen(
    innerPadding: PaddingValues,
    summary: NativeSpaceSummary?,
    loading: Boolean,
    errorMessage: String?,
    onRetry: () -> Unit,
    onCopyInviteCode: (String) -> Unit,
    onSpaceClick: (NativeSpaceItem) -> Unit,
    onMemberClick: (NativeSpaceMember) -> Unit,
    onManageAction: (SpaceManageAction) -> Unit,
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
            loading -> item { StateCard("공간 정보를 불러오는 중이에요", "연결된 공간과 멤버를 정리하고 있어요.", null, onRetry) }
            errorMessage != null -> item { StateCard("공간을 불러오지 못했어요", errorMessage, "다시 시도", onRetry) }
            summary != null -> {
                item { SpaceHero(summary = summary, onCopyInviteCode = onCopyInviteCode) }
                item { SectionHeader("내 공간", summary.spaces.size) }
                if (summary.spaces.isEmpty()) {
                    item { EmptyCard("아직 연결된 공간이 없어요", "새 공간을 만들거나 초대 코드로 참여해보세요.", onClick = { onManageAction(SpaceManageAction.CREATE) }) }
                } else {
                    summary.spaces.forEach { space ->
                        item(key = "space-${space.id}") { SpaceItemCard(space = space, onClick = { onSpaceClick(space) }) }
                    }
                }
                item { SectionHeader("공간 멤버", summary.members.size) }
                if (summary.members.isEmpty()) {
                    item { EmptyCard("표시할 멤버가 없어요", "공유 공간에 초대하면 함께하는 멤버가 여기에 표시됩니다.", onClick = { onManageAction(SpaceManageAction.JOIN) }) }
                } else {
                    summary.members.forEach { member ->
                        item(key = "member-${member.id}") { MemberItemCard(member = member, canManage = summary.activeSpace?.role == "admin" && summary.activeSpace.isPersonal.not() && !member.isMe, onClick = { onMemberClick(member) }) }
                    }
                }
                item { SectionHeader("공간 관리", null) }
                item { ManageCard(active = summary.activeSpace, onManageAction = onManageAction) }
            }
        }
    }
}

@Composable
private fun SpaceHero(summary: NativeSpaceSummary, onCopyInviteCode: (String) -> Unit) {
    val active = summary.activeSpace
    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
    ) {
        Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            AssistChip(
                onClick = {},
                label = { Text(if (active?.isPersonal == true) "개인 공간" else "공유 공간") },
                leadingIcon = { Icon(if (active?.isPersonal == true) Icons.Outlined.Person else Icons.Outlined.Groups, contentDescription = null, modifier = Modifier.size(18.dp)) },
            )
            Text(
                text = active?.name ?: "나의 공간",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
            )
            Text(
                text = if (active?.isPersonal == true) "개인 일정과 가계부가 안전하게 분리되는 기본 공간입니다." else "함께하는 사람들과 일정과 소식을 나누는 공간입니다.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.72f),
            )
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                StatCard("멤버", "${active?.memberCount ?: 0}명", Modifier.weight(1f))
                StatCard("내 역할", roleLabel(active?.role), Modifier.weight(1f))
            }
            active?.inviteCode?.let { code -> InviteCodeCard(code = code, onCopyInviteCode = onCopyInviteCode) }
        }
    }
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier = Modifier) {
    Surface(modifier = modifier, color = MaterialTheme.colorScheme.surface, shape = MaterialTheme.shapes.medium, tonalElevation = 1.dp) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun InviteCodeCard(code: String, onCopyInviteCode: (String) -> Unit) {
    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Row(Modifier.padding(start = 16.dp, top = 14.dp, end = 10.dp, bottom = 14.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("초대 코드", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(code, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
            }
            IconButton(onClick = { onCopyInviteCode(code) }) { Icon(Icons.Outlined.ContentCopy, contentDescription = "초대 코드 복사") }
        }
    }
}

@Composable
private fun SpaceItemCard(space: NativeSpaceItem, onClick: () -> Unit) {
    OutlinedCard(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        ListItem(
            headlineContent = { Text(space.name, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.SemiBold) },
            supportingContent = { Text("${space.memberCount}명 · ${roleLabel(space.role)}") },
            leadingContent = { AvatarSurface(if (space.isPersonal) "나" else "함께", if (space.isPersonal) Icons.Outlined.Home else Icons.Outlined.Groups) },
            trailingContent = { if (space.isActive) Badge(containerColor = MaterialTheme.colorScheme.primaryContainer) { Text("현재") } },
        )
    }
}

@Composable
private fun MemberItemCard(member: NativeSpaceMember, canManage: Boolean, onClick: () -> Unit) {
    OutlinedCard(onClick = { if (canManage) onClick() }, modifier = Modifier.fillMaxWidth()) {
        ListItem(
            headlineContent = { Text(member.displayName + if (member.isMe) " (나)" else "", maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.SemiBold) },
            supportingContent = { Text(member.email.ifBlank { roleLabel(member.role) }, maxLines = 1, overflow = TextOverflow.Ellipsis) },
            leadingContent = { InitialAvatar(member.displayName.take(1).ifBlank { "?" }) },
            trailingContent = { AssistChip(onClick = {}, label = { Text(roleLabel(member.role)) }) },
        )
    }
}

@Composable
private fun ManageCard(active: NativeSpaceItem?, onManageAction: (SpaceManageAction) -> Unit) {
    val canManage = active?.role == "admin"
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        ManageRow(Icons.Outlined.GroupAdd, "공간 참여하기", "초대 코드로 다른 공간에 입장합니다") { onManageAction(SpaceManageAction.JOIN) }
        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
        ManageRow(Icons.Outlined.Groups, "새 공간 만들기", "친구, 연인, 가족과 함께할 공간을 만듭니다") { onManageAction(SpaceManageAction.CREATE) }
        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
        ManageRow(Icons.Outlined.Edit, "공간 이름 변경", if (canManage) "현재 공간의 이름을 바로 수정합니다" else "공간 지기만 수정할 수 있어요") { onManageAction(SpaceManageAction.RENAME) }
        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
        ManageRow(Icons.Outlined.Refresh, "초대 코드 새로 만들기", if (active?.isPersonal == true) "개인 공간은 초대할 수 없어요" else "기존 코드는 새 코드로 교체됩니다") { onManageAction(SpaceManageAction.REGENERATE_INVITE) }
        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
        ManageRow(Icons.Outlined.Settings, "고급 설정", "공간 관리 상태와 지원 항목을 확인합니다") { onManageAction(SpaceManageAction.ADVANCED) }
    }
}

@Composable
private fun ManageRow(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, subtitle: String, onClick: () -> Unit) {
    ListItem(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        headlineContent = { Text(title, fontWeight = FontWeight.SemiBold) },
        supportingContent = { Text(subtitle) },
        leadingContent = { Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
        trailingContent = { Text("›", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurfaceVariant) },
    )
}

@Composable
private fun SectionHeader(title: String, count: Int?) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
        if (count != null) Badge(containerColor = MaterialTheme.colorScheme.surfaceVariant) { Text(count.toString()) }
    }
}

@Composable
private fun EmptyCard(title: String, body: String, onClick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(body, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Button(onClick = onClick) { Text("시작하기") }
        }
    }
}

@Composable
private fun StateCard(title: String, body: String, actionLabel: String?, onAction: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(body, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (actionLabel != null) Button(onClick = onAction) { Text(actionLabel) }
        }
    }
}

@Composable
private fun AvatarSurface(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Surface(shape = CircleShape, color = MaterialTheme.colorScheme.secondaryContainer, modifier = Modifier.size(44.dp)) {
        Box(contentAlignment = Alignment.Center) { Icon(icon, contentDescription = label, tint = MaterialTheme.colorScheme.onSecondaryContainer) }
    }
}

@Composable
private fun InitialAvatar(initial: String) {
    Surface(shape = CircleShape, color = MaterialTheme.colorScheme.tertiaryContainer, modifier = Modifier.size(44.dp)) {
        Box(contentAlignment = Alignment.Center) { Text(initial, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onTertiaryContainer) }
    }
}

private fun roleLabel(role: String?): String = when (role) {
    "admin" -> "공간 지기"
    "editor" -> "공간 운영자"
    "viewer" -> "공간 멤버"
    else -> "공간 멤버"
}
