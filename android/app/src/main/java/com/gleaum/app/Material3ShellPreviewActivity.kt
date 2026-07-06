package com.gleaum.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.gleaum.app.ui.components.GleaumDestination
import com.gleaum.app.ui.components.GleaumScaffold
import com.gleaum.app.ui.screens.Material3ShellPreviewScreen
import com.gleaum.app.ui.theme.GleaumTheme

/**
 * Phase 0 Material 3 Compose shell preview.
 *
 * This is not connected to production navigation yet. It exists to validate
 * Compose Material 3 dependencies, theme roles, NavigationBar and expandable
 * motion before porting real screens.
 */
class Material3ShellPreviewActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (!BuildConfig.DEBUG) {
            finish()
            return
        }
        setContent {
            GleaumTheme {
                var selected by remember { mutableStateOf(GleaumDestination.HOME) }
                GleaumScaffold(
                    title = "글리움",
                    selectedDestination = selected,
                    onDestinationSelected = { selected = it },
                    onFabClick = {},
                ) { padding ->
                    Material3ShellPreviewScreen(padding)
                }
            }
        }
    }
}
