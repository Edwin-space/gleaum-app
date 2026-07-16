package com.gleaum.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.gleaum.app.ui.theme.expenseContainer
import com.gleaum.app.ui.theme.infoContainer
import com.gleaum.app.ui.theme.onExpenseContainer
import com.gleaum.app.ui.theme.onInfoContainer
import com.gleaum.app.ui.theme.onSuccessContainer
import com.gleaum.app.ui.theme.successContainer

enum class FeedbackKind { INFO, SUCCESS, WARNING, ERROR }

@Composable
fun GleaumFeedbackBanner(
    message: String,
    kind: FeedbackKind,
    modifier: Modifier = Modifier,
) {
    val colors = feedbackColors(kind)
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = colors.container, contentColor = colors.content),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Icon(colors.icon, contentDescription = null)
            Text(message, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
        }
    }
}

private data class FeedbackColors(val container: Color, val content: Color, val icon: ImageVector)

@Composable
private fun feedbackColors(kind: FeedbackKind): FeedbackColors = when (kind) {
    FeedbackKind.INFO -> FeedbackColors(MaterialTheme.colorScheme.infoContainer, MaterialTheme.colorScheme.onInfoContainer, Icons.Outlined.Info)
    FeedbackKind.SUCCESS -> FeedbackColors(MaterialTheme.colorScheme.successContainer, MaterialTheme.colorScheme.onSuccessContainer, Icons.Outlined.CheckCircle)
    FeedbackKind.WARNING -> FeedbackColors(MaterialTheme.colorScheme.expenseContainer, MaterialTheme.colorScheme.onExpenseContainer, Icons.Outlined.WarningAmber)
    FeedbackKind.ERROR -> FeedbackColors(MaterialTheme.colorScheme.errorContainer, MaterialTheme.colorScheme.onErrorContainer, Icons.Outlined.ErrorOutline)
}
