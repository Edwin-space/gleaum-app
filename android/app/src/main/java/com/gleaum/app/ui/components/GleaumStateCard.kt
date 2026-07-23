package com.gleaum.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material.icons.outlined.HourglassTop
import androidx.compose.material.icons.outlined.Inbox
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

enum class StateKind { LOADING, EMPTY, ERROR }

@Composable
fun GleaumStateCard(
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    kind: StateKind = StateKind.EMPTY,
    actionLabel: String? = null,
    onAction: () -> Unit = {},
) {
    val icon = when (kind) {
        StateKind.LOADING -> Icons.Outlined.HourglassTop
        StateKind.EMPTY -> Icons.Outlined.Inbox
        StateKind.ERROR -> Icons.Outlined.ErrorOutline
    }
    val iconColor = when (kind) {
        StateKind.ERROR -> MaterialTheme.colorScheme.error
        StateKind.LOADING -> MaterialTheme.colorScheme.secondary
        StateKind.EMPTY -> MaterialTheme.colorScheme.primary
    }

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerLow),
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(icon, contentDescription = null, tint = iconColor)
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(message, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (actionLabel != null) {
                Button(onClick = onAction, modifier = Modifier.padding(top = 4.dp)) {
                    Text(actionLabel)
                }
            }
        }
    }
}
