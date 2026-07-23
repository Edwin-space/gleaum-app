package com.gleaum.app.ui.screens.budget

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import com.gleaum.app.ui.components.FeedbackKind
import com.gleaum.app.ui.components.GleaumFeedbackBanner
import com.gleaum.app.ui.components.GleaumAdaptiveContent

private val expenseCategories = listOf("food" to "식비", "daily" to "생활", "transport" to "교통", "culture" to "문화", "medical" to "의료", "social" to "경조사", "housing" to "주거", "subscription" to "구독", "other" to "기타")
private val incomeCategories = listOf("salary" to "급여", "business" to "사업", "investment" to "투자", "bonus" to "상여", "refund" to "환급", "gift" to "용돈", "other_income" to "기타")
private val paymentMethods = listOf("card" to "카드", "auto" to "자동이체", "cash" to "현금", "other" to "기타")
private val recurOptions = listOf("weekly" to "매주", "monthly" to "매월", "yearly" to "매년")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComposeBudgetEntryFormScreen(
    isEdit: Boolean,
    kind: String,
    entryMode: String,
    recurFreq: String,
    category: String,
    paymentMethod: String,
    title: String,
    amount: String,
    memo: String,
    dateText: String,
    saving: Boolean,
    message: String?,
    onBack: () -> Unit,
    onKindChange: (String) -> Unit,
    onEntryModeChange: (String) -> Unit,
    onRecurFreqChange: (String) -> Unit,
    onCategoryChange: (String) -> Unit,
    onPaymentMethodChange: (String) -> Unit,
    onTitleChange: (String) -> Unit,
    onAmountChange: (String) -> Unit,
    onMemoChange: (String) -> Unit,
    onPickDate: () -> Unit,
    onSave: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var titleValue by remember(title) { mutableStateOf(title) }
    var amountValue by remember(amount) { mutableStateOf(amount) }
    var memoValue by remember(memo) { mutableStateOf(memo) }
    val titleText = if (isEdit) "항목 수정" else if (kind == "income") "수입 추가" else "지출 추가"

    Scaffold(
        modifier = modifier,
        topBar = {
            TopAppBar(
                title = { Text(titleText) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "뒤로") } },
                actions = { TextButton(enabled = !saving, onClick = onSave) { Text(if (isEdit) "저장" else "등록") } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        },
    ) { innerPadding ->
        GleaumAdaptiveContent {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(PaddingValues(start = 20.dp, top = innerPadding.calculateTopPadding() + 12.dp, end = 20.dp, bottom = 28.dp)),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
            HeroCard(kind = kind, isEdit = isEdit)
            if (message != null) {
                GleaumFeedbackBanner(message = message, kind = FeedbackKind.ERROR)
            }
            ChipGroupCard("구분", listOf("expense" to "지출", "income" to "수입"), kind, onKindChange)
            ChipGroupCard("입력 방식", listOf("onetime" to "일회", "recurring" to "정기"), entryMode, onEntryModeChange)
            FormCard(
                kind = kind,
                entryMode = entryMode,
                recurFreq = recurFreq,
                category = category,
                paymentMethod = paymentMethod,
                title = titleValue,
                amount = amountValue,
                memo = memoValue,
                dateText = dateText,
                onTitleChange = { value -> titleValue = value; onTitleChange(value) },
                onAmountChange = { value -> amountValue = value.filter { it.isDigit() }; onAmountChange(value.filter { it.isDigit() }) },
                onMemoChange = { value -> memoValue = value; onMemoChange(value) },
                onPickDate = onPickDate,
                onRecurFreqChange = onRecurFreqChange,
                onCategoryChange = onCategoryChange,
                onPaymentMethodChange = onPaymentMethodChange,
            )
                Button(enabled = !saving, onClick = onSave, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Outlined.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.size(8.dp))
                    Text(if (saving) "저장 중..." else if (isEdit) "수정 완료" else if (kind == "income") "수입 등록" else "지출 등록")
                }
            }
        }
    }
}

@Composable
private fun HeroCard(kind: String, isEdit: Boolean) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
        Column(Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Surface(color = MaterialTheme.colorScheme.surfaceContainerLowest, shape = CircleShape, modifier = Modifier.size(46.dp)) {
                Box(contentAlignment = Alignment.Center) { Icon(Icons.Outlined.Payments, contentDescription = null, tint = MaterialTheme.colorScheme.primary) }
            }
            Text(if (isEdit) "항목을 수정해요" else if (kind == "income") "수입을 기록해요" else "지출을 기록해요", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.onPrimaryContainer)
            Text("개인 가계부에만 저장되며, 공간 지출과 섞이지 않습니다.", color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.72f), style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun ChipGroupCard(title: String, items: List<Pair<String, String>>, selected: String, onSelect: (String) -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            FlowChips(items = items, selected = selected, onSelect = onSelect)
        }
    }
}

@Composable
private fun FormCard(
    kind: String,
    entryMode: String,
    recurFreq: String,
    category: String,
    paymentMethod: String,
    title: String,
    amount: String,
    memo: String,
    dateText: String,
    onTitleChange: (String) -> Unit,
    onAmountChange: (String) -> Unit,
    onMemoChange: (String) -> Unit,
    onPickDate: () -> Unit,
    onRecurFreqChange: (String) -> Unit,
    onCategoryChange: (String) -> Unit,
    onPaymentMethodChange: (String) -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            OutlinedTextField(value = title, onValueChange = onTitleChange, modifier = Modifier.fillMaxWidth(), label = { Text("항목명") }, placeholder = { Text(if (kind == "income") "예: 급여, 환급" else "예: 외식, 마트, 주유") }, singleLine = true)
            OutlinedTextField(value = amount, onValueChange = onAmountChange, modifier = Modifier.fillMaxWidth(), label = { Text("금액") }, placeholder = { Text("0") }, leadingIcon = { Icon(Icons.Outlined.Payments, contentDescription = null) }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true)
            Card(onClick = onPickDate, colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant), modifier = Modifier.fillMaxWidth()) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.CalendarMonth, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.size(12.dp))
                    Column { Text("날짜", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelMedium); Text(dateText, fontWeight = FontWeight.Bold) }
                }
            }
            if (entryMode == "recurring") {
                Text("반복 주기", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                FlowChips(recurOptions, recurFreq, onRecurFreqChange)
                Text("정기 항목은 중지하기 전까지 예정 항목으로 자동 준비됩니다.", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
            }
            Text("카테고리", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            FlowChips(if (kind == "income") incomeCategories else expenseCategories, category, onCategoryChange)
            if (kind == "expense") {
                Text("결제 방법", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                FlowChips(paymentMethods, paymentMethod, onPaymentMethodChange)
            }
            OutlinedTextField(value = memo, onValueChange = onMemoChange, modifier = Modifier.fillMaxWidth().heightIn(min = 104.dp), label = { Text("메모") }, placeholder = { Text("메모를 입력해 주세요") }, leadingIcon = { Icon(Icons.Outlined.Description, contentDescription = null) }, minLines = 3)
        }
    }
}

@Composable
private fun FlowChips(items: List<Pair<String, String>>, selected: String, onSelect: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        items.chunked(3).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { (key, label) ->
                    FilterChip(selected = selected == key, onClick = { onSelect(key) }, label = { Text(label) }, modifier = Modifier.weight(1f))
                }
                repeat(3 - row.size) { Spacer(Modifier.weight(1f)) }
            }
        }
    }
}
