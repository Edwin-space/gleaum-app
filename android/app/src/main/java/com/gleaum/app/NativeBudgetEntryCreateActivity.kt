package com.gleaum.app

import android.app.DatePickerDialog
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatActivity
import com.gleaum.app.ui.screens.budget.ComposeBudgetEntryFormScreen
import com.gleaum.app.ui.components.GleaumAdaptiveContent
import com.gleaum.app.ui.theme.GleaumTheme
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

class NativeBudgetEntryCreateActivity : AppCompatActivity() {
    private var entryId: String? = null
    private var editingEntry: NativeBudgetEntry? = null
    private var kind = "expense"
    private var entryMode = "onetime"
    private var recurFreq = "monthly"
    private var category = "food"
    private var paymentMethod = "card"
    private val date = Calendar.getInstance()
    private var saving = false
    private var message: String? = null
    private lateinit var titleInput: EditText
    private lateinit var amountInput: EditText
    private lateinit var memoInput: EditText
    private var draftTitle = ""
    private var draftAmount = ""
    private var draftMemo = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (!NativeAccountContextStore.capabilities(this).canViewHouseholdBudget) {
            startActivity(Intent(this, NativeHomePortActivity::class.java))
            finish()
            return
        }
        entryId = intent.getStringExtra("entry_id")
        kind = intent.getStringExtra("kind") ?: "expense"
        category = if (kind == "income") "salary" else "food"
        applyLightSystemBars()
        if (entryId != null) loadEntryForEdit() else render()
    }

    private fun applyLightSystemBars() {
        NativeTheme.applySystemBars(window, this)
    }

    override fun onResume() {
        super.onResume()
        applyLightSystemBars()
    }

    private fun render() {
        if (NativePortFlags.ENABLE_COMPOSE_BUDGET_FORM) {
            renderComposeForm()
            return
        }
        setContentView(buildScreen())
    }

    private fun renderComposeForm() {
        setContent {
            GleaumTheme {
                GleaumAdaptiveContent {
                    ComposeBudgetEntryFormScreen(
                    isEdit = entryId != null,
                    kind = kind,
                    entryMode = entryMode,
                    recurFreq = recurFreq,
                    category = category,
                    paymentMethod = paymentMethod,
                    title = draftTitle,
                    amount = draftAmount,
                    memo = draftMemo,
                    dateText = dateText(),
                    saving = saving,
                    message = message,
                    onBack = { finish() },
                    onKindChange = { value -> kind = value; category = if (kind == "income") "salary" else "food"; render() },
                    onEntryModeChange = { value -> entryMode = value; render() },
                    onRecurFreqChange = { value -> recurFreq = value; render() },
                    onCategoryChange = { value -> category = value; render() },
                    onPaymentMethodChange = { value -> paymentMethod = value; render() },
                    onTitleChange = { value -> draftTitle = value },
                    onAmountChange = { value -> draftAmount = value },
                    onMemoChange = { value -> draftMemo = value },
                    onPickDate = { pickDate() },
                    onSave = { save(draftTitle, draftAmount, draftMemo) },
                    )
                }
            }
        }
    }

    private fun loadEntryForEdit() {
        saving = true
        render()
        Thread {
            try {
                val loaded = NativeBudgetApi.detail(this, entryId ?: return@Thread)
                runOnUiThread {
                    editingEntry = loaded
                    kind = loaded.kind
                    entryMode = if (loaded.recurFreq == "none") "onetime" else "recurring"
                    recurFreq = if (loaded.recurFreq == "none") "monthly" else loaded.recurFreq
                    category = loaded.category
                    paymentMethod = loaded.method ?: paymentMethod
                    draftTitle = loaded.title
                    draftAmount = loaded.amount.takeIf { it > 0 }?.toString().orEmpty()
                    draftMemo = loaded.memo.orEmpty()
                    applyIsoToDate(loaded.occurredAt)
                    saving = false
                    render()
                }
            } catch (e: Exception) {
                runOnUiThread { saving = false; message = friendlyError(e.message); render() }
            }
        }.start()
    }

    private fun buildScreen(): FrameLayout = FrameLayout(this).apply {
        setBackgroundColor(color("#FAFAFD"))
        addView(ScrollView(context).apply {
            overScrollMode = View.OVER_SCROLL_NEVER
            addView(LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(NativeAdaptive.pagePaddingDp(this@NativeBudgetEntryCreateActivity)), statusBarHeight() + dp(76), dp(NativeAdaptive.pagePaddingDp(this@NativeBudgetEntryCreateActivity)), dp(36))
                addView(buildHero(), matchWrap())
                message?.let { addView(messageCard(it), matchWrap().apply { topMargin = dp(12) }) }
                addView(buildKindTabs(), matchWrap().apply { topMargin = dp(16) })
                addView(buildModeTabs(), matchWrap().apply { topMargin = dp(10) })
                addView(buildForm(), matchWrap().apply { topMargin = dp(14) })
                addView(saveButton(), matchWrap().apply { topMargin = dp(18) })
            }, NativeAdaptive.scrollChildParams(this@NativeBudgetEntryCreateActivity, compact = true))
        }, FrameLayout.LayoutParams(match(), match()))
        addView(header(), FrameLayout.LayoutParams(match(), statusBarHeight() + dp(64), Gravity.TOP))
    }

    private fun header(): FrameLayout = FrameLayout(this).apply {
        setBackgroundColor(color("#FAFAFD"))
        elevation = dp(2).toFloat()
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            addView(TextView(context).apply {
                text = "‹"
                textSize = 34f
                gravity = Gravity.CENTER
                setTextColor(NativeTheme.text(context))
                background = round("#FFFFFF", 999, "#EEF0F4")
                setOnClickListener { finish() }
            }, LinearLayout.LayoutParams(dp(40), dp(40)))
            addView(TextView(context).apply {
                text = if (entryId == null) { if (kind == "income") "수입 추가" else "지출 추가" } else "항목 수정"
                textSize = 18f
                typeface = bold()
                setTextColor(NativeTheme.text(context))
                gravity = Gravity.CENTER_VERTICAL
            }, LinearLayout.LayoutParams(0, dp(44), 1f).apply { leftMargin = dp(12) })
            addView(ImageView(context).apply { setImageResource(R.drawable.gleaum_logo_native) }, LinearLayout.LayoutParams(dp(32), dp(32)))
        }, NativeAdaptive.headerContentParams(this@NativeBudgetEntryCreateActivity, dp(44), dp(20), dp(10)))
        addView(View(context).apply { setBackgroundColor(color("#EEF0F4")) }, FrameLayout.LayoutParams(match(), dp(1), Gravity.BOTTOM))
    }

    private fun buildHero(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(24), dp(24), dp(24), dp(24))
        background = gradient("#1A1B2E", "#2D2E4A", 28)
        elevation = dp(8).toFloat()
        addView(TextView(context).apply { text = "MONEY FLOW"; textSize = 12f; typeface = bold(); letterSpacing = 0.08f; setTextColor(color("#0CC9B5")) })
        addView(TextView(context).apply { text = if (entryId == null) { if (kind == "income") "수입을 기록해요" else "지출을 기록해요" } else "항목을 수정해요"; textSize = 25f; typeface = bold(); setTextColor(Color.WHITE) }, matchWrap().apply { topMargin = dp(8) })
        addView(TextView(context).apply { text = "개인 가계부에만 저장되며, 공간 지출과 섞이지 않습니다."; textSize = 12f; typeface = medium(); setTextColor(colorWithAlpha("#FFFFFF", 0.56f)) }, matchWrap().apply { topMargin = dp(6) })
    }

    private fun buildKindTabs(): LinearLayout = segmented(listOf("expense" to "지출", "income" to "수입"), kind) { next ->
        kind = next
        category = if (kind == "income") "salary" else "food"
        render()
    }

    private fun buildModeTabs(): LinearLayout = segmented(listOf("onetime" to "일회", "recurring" to "정기"), entryMode) { next ->
        entryMode = next
        render()
    }

    private fun segmented(items: List<Pair<String, String>>, active: String, action: (String) -> Unit): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        setPadding(dp(4), dp(4), dp(4), dp(4))
        background = round("#F7F8FB", 16)
        items.forEach { (key, label) ->
            val selected = key == active
            addView(TextView(context).apply {
                text = label
                textSize = 14f
                typeface = if (selected) bold() else medium()
                gravity = Gravity.CENTER
                setTextColor(if (selected) Color.WHITE else color("#8E8E93"))
                background = if (selected) gradient("#0CC9B5", "#0084CC", 13) else round("#00FFFFFF", 13)
                setOnClickListener { action(key) }
            }, LinearLayout.LayoutParams(0, dp(42), 1f).apply { if (childCount > 0) leftMargin = dp(4) })
        }
    }

    private fun buildForm(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(20), dp(20), dp(20), dp(20))
        background = round("#FFFFFF", 24, "#EEF0F4")
        elevation = dp(2).toFloat()
        titleInput = input(if (kind == "income") "예: 급여, 환급" else "예: 외식, 마트, 주유", false).apply { editingEntry?.title?.let { setText(it) } }
        amountInput = input("금액", false).apply { inputType = android.text.InputType.TYPE_CLASS_NUMBER; editingEntry?.amount?.takeIf { it > 0 }?.let { setText(it.toString()) } }
        memoInput = input("메모를 입력해 주세요", true).apply { editingEntry?.memo?.let { setText(it) } }
        addView(label("항목명")); addView(titleInput, matchWrap().apply { topMargin = dp(8) })
        addView(label("금액"), matchWrap().apply { topMargin = dp(18) }); addView(amountInput, matchWrap().apply { topMargin = dp(8) })
        addView(label("날짜"), matchWrap().apply { topMargin = dp(18) }); addView(pickerBox(dateText()) { pickDate() }, matchWrap().apply { topMargin = dp(8) })
        if (entryMode == "recurring") {
            addView(label("반복 주기"), matchWrap().apply { topMargin = dp(18) })
            addView(recurChips(), matchWrap().apply { topMargin = dp(8) })
            addView(TextView(context).apply {
                text = "정기 항목은 중지하기 전까지 매월/매주/매년 해당 월의 예정 항목으로 자동 준비됩니다."
                textSize = 12f
                typeface = medium()
                setTextColor(NativeTheme.muted(context))
            }, matchWrap().apply { topMargin = dp(8) })
        }
        addView(label("카테고리"), matchWrap().apply { topMargin = dp(18) }); addView(categoryChips(), matchWrap().apply { topMargin = dp(8) })
        if (kind == "expense") { addView(label("결제 방법"), matchWrap().apply { topMargin = dp(18) }); addView(paymentChips(), matchWrap().apply { topMargin = dp(8) }) }
        addView(label("메모"), matchWrap().apply { topMargin = dp(18) }); addView(memoInput, matchWrap().apply { topMargin = dp(8) })
    }

    private fun categoryChips(): LinearLayout = chipWrap(if (kind == "income") incomeCategories() else expenseCategories(), category) { category = it; render() }
    private fun paymentChips(): LinearLayout = chipWrap(listOf("card" to "카드", "auto" to "자동이체", "cash" to "현금", "other" to "기타"), paymentMethod) { paymentMethod = it; render() }
    private fun recurChips(): LinearLayout = chipWrap(listOf("weekly" to "매주", "monthly" to "매월", "yearly" to "매년"), recurFreq) { recurFreq = it; render() }

    private fun chipWrap(items: List<Pair<String, String>>, active: String, action: (String) -> Unit): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        var row: LinearLayout? = null
        items.forEachIndexed { index, item ->
            if (index % 3 == 0) {
                row = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
                addView(row, matchWrap().apply { if (childCount > 0) topMargin = dp(8) })
            }
            val selected = item.first == active
            row?.addView(TextView(context).apply {
                text = item.second
                textSize = 12f
                typeface = bold()
                gravity = Gravity.CENTER
                setTextColor(if (selected) color("#0084CC") else color("#6E6E66"))
                background = round(if (selected) "#F0FAFF" else "#F7F8FB", 999, if (selected) "#0084CC" else null)
                setOnClickListener { action(item.first) }
            }, LinearLayout.LayoutParams(0, dp(38), 1f).apply { if (index % 3 != 0) leftMargin = dp(8) })
        }
    }

    private fun saveButton(): TextView = TextView(this).apply {
        text = if (saving) "저장 중..." else if (entryId == null) { if (kind == "income") "수입 등록" else "지출 등록" } else "수정 완료"
        textSize = 16f
        typeface = bold()
        gravity = Gravity.CENTER
        setTextColor(Color.WHITE)
        minHeight = dp(52)
        alpha = if (saving) 0.7f else 1f
        background = gradient("#0CC9B5", "#0084CC", 999)
        setOnClickListener { if (!saving) save() }
    }

    private fun save() {
        save(titleInput.text?.toString().orEmpty(), amountInput.text?.toString().orEmpty(), memoInput.text?.toString().orEmpty())
    }

    private fun save(rawTitle: String, rawAmount: String, rawMemo: String) {
        val title = rawTitle.trim()
        val amount = rawAmount.trim().toLongOrNull() ?: 0L
        val memo = rawMemo.trim()
        if (title.isBlank()) { message = "항목명을 입력해 주세요."; render(); return }
        if (amount <= 0) { message = "금액을 입력해 주세요."; render(); return }
        saving = true; message = null; render()
        Thread {
            try {
                val payload = JSONObject().apply {
                    put("kind", kind)
                    put("title", title)
                    put("amount", amount)
                    put("category", category)
                    put("occurredAt", toIsoUtc(date))
                    put("recurFreq", if (entryMode == "recurring") recurFreq else "none")
                    if (kind == "expense") put("method", paymentMethod)
                    put("memo", memo)
                }
                val id = entryId
                if (id == null) NativeBudgetApi.create(this, payload) else NativeBudgetApi.update(this, id, payload)
                runOnUiThread { startActivity(Intent(this, NativeBudgetActivity::class.java)); finish() }
            } catch (e: Exception) {
                runOnUiThread { saving = false; message = friendlyError(e.message); render() }
            }
        }.start()
    }

    private fun pickDate() { DatePickerDialog(this, { _, y, m, d -> date.set(y, m, d); render() }, date.get(Calendar.YEAR), date.get(Calendar.MONTH), date.get(Calendar.DAY_OF_MONTH)).show() }
    private fun label(textValue: String): TextView = TextView(this).apply { text = textValue; textSize = 13f; typeface = bold(); setTextColor(NativeTheme.text(context)) }
    private fun input(hintValue: String, multiline: Boolean): EditText = EditText(this).apply { hint = hintValue; textSize = 15f; typeface = medium(); setTextColor(NativeTheme.text(context)); setHintTextColor(NativeTheme.subtle(context)); setPadding(dp(16), dp(12), dp(16), dp(12)); background = round("#F8FAFC", 16, "#EEF0F4"); minHeight = if (multiline) dp(104) else dp(52); if (multiline) { gravity = Gravity.TOP; minLines = 3 } else setSingleLine(true) }
    private fun pickerBox(value: String, action: () -> Unit): TextView = TextView(this).apply { text = value; textSize = 15f; typeface = bold(); gravity = Gravity.CENTER_VERTICAL; setTextColor(NativeTheme.text(context)); setPadding(dp(16), 0, dp(16), 0); minHeight = dp(52); background = round("#F8FAFC", 16, "#EEF0F4"); setOnClickListener { action() } }
    private fun messageCard(textValue: String): TextView = TextView(this).apply { text = textValue; textSize = 13f; typeface = bold(); gravity = Gravity.CENTER; setTextColor(color("#EF4444")); setPadding(dp(16), dp(14), dp(16), dp(14)); background = round("#FFF1F2", 18, "#FECACA") }
    private fun expenseCategories() = listOf("food" to "식비", "daily" to "생활", "transport" to "교통", "culture" to "문화", "medical" to "의료", "social" to "경조사", "housing" to "주거", "subscription" to "구독", "other" to "기타")
    private fun incomeCategories() = listOf("salary" to "급여", "business" to "사업", "investment" to "투자", "bonus" to "상여", "refund" to "환급", "gift" to "용돈", "other_income" to "기타")
    private fun friendlyError(code: String?): String = when (code) { "session_required" -> "로그인 세션을 찾을 수 없어요."; "personal_space_required" -> "개인 공간을 찾을 수 없어요."; else -> "저장에 실패했어요. 잠시 후 다시 시도해 주세요." }
    private fun applyIsoToDate(iso: String) {
        NativeDateTime.parseIsoMillis(iso)?.let { date.timeInMillis = it }
    }

    private fun dateText(): String = "${date.get(Calendar.YEAR)}. ${date.get(Calendar.MONTH) + 1}. ${date.get(Calendar.DAY_OF_MONTH)}."
    private fun toIsoUtc(calendar: Calendar): String = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.format(calendar.time)
    private fun bold(): Typeface = Typeface.create("sans-serif", Typeface.BOLD)
    private fun medium(): Typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
    private fun color(hex: String): Int = NativeTheme.color(this, hex)
    private fun colorWithAlpha(hex: String, alpha: Float): Int = NativeTheme.alpha(hex, alpha)
    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()
    private fun statusBarHeight(): Int { val id = resources.getIdentifier("status_bar_height", "dimen", "android"); return if (id > 0) resources.getDimensionPixelSize(id) else 0 }
    private fun match(): Int = ViewGroup.LayoutParams.MATCH_PARENT
    private fun wrap(): Int = ViewGroup.LayoutParams.WRAP_CONTENT
    private fun matchWrap(): LinearLayout.LayoutParams = LinearLayout.LayoutParams(match(), wrap())
    private fun round(fill: String, radius: Int, stroke: String? = null): GradientDrawable = GradientDrawable().apply { setColor(color(fill)); cornerRadius = dp(radius).toFloat(); if (stroke != null) setStroke(dp(1), color(stroke)) }
    private fun gradient(a: String, b: String, radius: Int): GradientDrawable = GradientDrawable(GradientDrawable.Orientation.TL_BR, intArrayOf(color(a), color(b))).apply { cornerRadius = dp(radius).toFloat() }
    companion object { private const val ENTRY_URL = "https://www.gleaum.com/api/native/budget/entries" }
}
