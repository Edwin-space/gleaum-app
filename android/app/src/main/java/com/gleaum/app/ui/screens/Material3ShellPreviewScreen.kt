package com.gleaum.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.gleaum.app.ui.components.GleaumLabelBadge
import com.gleaum.app.ui.components.GleaumExpandableSection

@Composable
fun Material3ShellPreviewScreen(padding: PaddingValues) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        ElevatedCard {
            Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Material 3 전환 베이스", style = MaterialTheme.typography.headlineSmall)
                Text(
                    "Scaffold, NavigationBar, Card, Expand motion을 Compose Material 3 기준으로 구성했습니다.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                GleaumLabelBadge("Material 3")
            }
        }

        GleaumExpandableSection(
            title = "상위 메뉴",
            subtitle = "탭하면 하위 메뉴가 자연스럽게 펼쳐집니다.",
        ) {
            Text("하위 메뉴 1", color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("하위 메뉴 2", color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("하위 메뉴 3", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
