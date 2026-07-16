package com.gleaum.app.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteItem
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import com.gleaum.app.R
import com.gleaum.app.ui.theme.isDark
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Menu
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Add

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GleaumScaffold(
    title: String,
    selectedDestination: GleaumDestination,
    onDestinationSelected: (GleaumDestination) -> Unit,
    onNotificationClick: () -> Unit = {},
    onFabClick: (() -> Unit)? = null,
    bottomContent: (@Composable () -> Unit)? = null,
    content: @Composable (PaddingValues) -> Unit,
) {
    NavigationSuiteScaffold(
        navigationItems = {
            GleaumDestination.entries.forEach { destination ->
                NavigationSuiteItem(
                    selected = selectedDestination == destination,
                    onClick = { onDestinationSelected(destination) },
                    icon = { Icon(destination.icon, contentDescription = destination.label) },
                    label = { Text(destination.label, style = MaterialTheme.typography.labelMedium) },
                )
            }
        },
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        if (selectedDestination == GleaumDestination.HOME) {
                            Image(
                                painter = painterResource(R.drawable.gleaum_bi_native),
                                contentDescription = "gleaum",
                                modifier = Modifier.width(88.dp).height(22.dp),
                                colorFilter = if (MaterialTheme.colorScheme.isDark) {
                                    ColorFilter.tint(MaterialTheme.colorScheme.onBackground)
                                } else {
                                    null
                                },
                            )
                        } else {
                            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        }
                    },
                    actions = {
                        androidx.compose.material3.IconButton(onClick = onNotificationClick) {
                            Icon(Icons.Outlined.Notifications, contentDescription = "알림")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.background,
                        titleContentColor = MaterialTheme.colorScheme.onBackground,
                        actionIconContentColor = MaterialTheme.colorScheme.onBackground,
                    ),
                )
            },
            bottomBar = {
                if (bottomContent != null) {
                    Column { bottomContent() }
                }
            },
            floatingActionButton = {
                if (onFabClick != null) {
                    FloatingActionButton(onClick = onFabClick) {
                        Icon(Icons.Outlined.Add, contentDescription = "추가")
                    }
                }
            },
            content = { innerPadding ->
                GleaumAdaptiveContent { content(innerPadding) }
            },
        )
    }
}

enum class GleaumDestination(
    val label: String,
    val icon: ImageVector,
) {
    HOME("홈", Icons.Outlined.Home),
    SCHEDULES("일정", Icons.Outlined.CalendarMonth),
    SPACE("공간", Icons.Outlined.Groups),
    BUDGET("가계부", Icons.Outlined.CreditCard),
    MENU("전체", Icons.Outlined.Menu),
}
