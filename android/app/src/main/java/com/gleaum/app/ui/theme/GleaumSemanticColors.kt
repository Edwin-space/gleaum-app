package com.gleaum.app.ui.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance

object GleaumSemanticColors {
    val Expense = Color(0xFFF59E0B)
    val ExpenseContainerLight = Color(0xFFFFF4D6)
    val OnExpenseContainerLight = Color(0xFF5F3B00)
    val ExpenseContainerDark = Color(0xFF3D2B08)
    val OnExpenseContainerDark = Color(0xFFFFD68A)

    val Pending = Color(0xFF8E8E93)
    val Missed = Color(0xFFEF4444)
}

val ColorScheme.isDark: Boolean
    get() = background.luminance() < 0.35f

val ColorScheme.expense: Color
    get() = GleaumSemanticColors.Expense

val ColorScheme.expenseContainer: Color
    get() = if (isDark) GleaumSemanticColors.ExpenseContainerDark else GleaumSemanticColors.ExpenseContainerLight

val ColorScheme.onExpenseContainer: Color
    get() = if (isDark) GleaumSemanticColors.OnExpenseContainerDark else GleaumSemanticColors.OnExpenseContainerLight

val ColorScheme.successContainer: Color
    get() = tertiaryContainer

val ColorScheme.onSuccessContainer: Color
    get() = onTertiaryContainer

val ColorScheme.infoContainer: Color
    get() = primaryContainer

val ColorScheme.onInfoContainer: Color
    get() = onPrimaryContainer
