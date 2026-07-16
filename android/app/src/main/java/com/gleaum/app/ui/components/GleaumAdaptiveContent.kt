package com.gleaum.app.ui.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Centres the phone-first product surface on larger Android windows without
 * changing the information hierarchy of the mobile UI.
 */
@Composable
fun GleaumAdaptiveContent(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val density = LocalDensity.current
    val screenWidth = with(density) { LocalWindowInfo.current.containerSize.width.toDp().value }
    val contentMaxWidth = when {
        screenWidth >= 840 -> 840.dp
        screenWidth >= 600 -> 720.dp
        else -> Dp.Unspecified
    }

    Box(modifier = modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = contentMaxWidth)
                .align(Alignment.TopCenter),
        ) {
            content()
        }
    }
}
