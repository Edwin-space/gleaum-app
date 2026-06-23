package com.gleaum.app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

data class NativeBudgetEntry(
    val id: String,
    val kind: String,
    val title: String,
    val amount: Long,
    val category: String,
    val occurredAt: String,
    val status: String,
    val recurFreq: String,
) {
    companion object {
        fun fromJson(json: JSONObject): NativeBudgetEntry = NativeBudgetEntry(
            id = json.optString("id"),
            kind = json.optString("kind", "expense"),
            title = json.optString("title", "항목"),
            amount = json.optLong("amount", 0L),
            category = json.optString("category", "other"),
            occurredAt = json.optString("occurredAt"),
            status = json.optString("status", "completed"),
            recurFreq = json.optString("recurFreq", "none"),
        )

        fun listFrom(array: JSONArray): List<NativeBudgetEntry> = buildList {
            for (index in 0 until array.length()) {
                array.optJSONObject(index)?.let { add(fromJson(it)) }
            }
        }
    }
}

data class NativeBudgetCategoryTotal(
    val category: String,
    val kind: String,
    val amount: Long,
) {
    companion object {
        fun listFrom(array: JSONArray): List<NativeBudgetCategoryTotal> = buildList {
            for (index in 0 until array.length()) {
                val item = array.optJSONObject(index) ?: continue
                add(NativeBudgetCategoryTotal(item.optString("category"), item.optString("kind"), item.optLong("amount", 0L)))
            }
        }
    }
}

data class NativeBudgetSummary(
    val month: String,
    val incomeTotal: Long,
    val expenseTotal: Long,
    val net: Long,
    val savingsRate: Int,
    val fixedExpenseTotal: Long,
    val variableExpenseTotal: Long,
    val recurringIncomeTotal: Long,
    val onceIncomeTotal: Long,
    val pendingExpenseCount: Int,
    val pendingIncomeCount: Int,
    val completedExpenseCount: Int,
    val completedIncomeCount: Int,
    val recentEntries: List<NativeBudgetEntry>,
    val categoryTotals: List<NativeBudgetCategoryTotal>,
) {
    companion object {
        fun fromJson(json: JSONObject): NativeBudgetSummary = NativeBudgetSummary(
            month = json.optString("month"),
            incomeTotal = json.optLong("incomeTotal", 0L),
            expenseTotal = json.optLong("expenseTotal", 0L),
            net = json.optLong("net", 0L),
            savingsRate = json.optInt("savingsRate", 0),
            fixedExpenseTotal = json.optLong("fixedExpenseTotal", 0L),
            variableExpenseTotal = json.optLong("variableExpenseTotal", 0L),
            recurringIncomeTotal = json.optLong("recurringIncomeTotal", 0L),
            onceIncomeTotal = json.optLong("onceIncomeTotal", 0L),
            pendingExpenseCount = json.optInt("pendingExpenseCount", 0),
            pendingIncomeCount = json.optInt("pendingIncomeCount", 0),
            completedExpenseCount = json.optInt("completedExpenseCount", 0),
            completedIncomeCount = json.optInt("completedIncomeCount", 0),
            recentEntries = NativeBudgetEntry.listFrom(json.optJSONArray("recentEntries") ?: JSONArray()),
            categoryTotals = NativeBudgetCategoryTotal.listFrom(json.optJSONArray("categoryTotals") ?: JSONArray()),
        )
    }
}

object NativeBudgetApi {
    private const val SUMMARY_URL = "https://www.gleaum.com/api/native/budget/summary"

    fun summary(context: Context, month: String? = null): NativeBudgetSummary {
        val url = if (month.isNullOrBlank()) SUMMARY_URL else "$SUMMARY_URL?month=${URLEncoder.encode(month, Charsets.UTF_8.name())}"
        val json = request(context, url)
        return NativeBudgetSummary.fromJson(json)
    }

    private fun request(context: Context, url: String): JSONObject {
        val session = SessionManager.get(context) ?: throw IllegalStateException("session_required")
        val token = JSONObject(session).optString("access_token").takeIf { it.isNotBlank() }
            ?: throw IllegalStateException("session_required")
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 15000
            readTimeout = 20000
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("Accept", "application/json")
        }
        val text = readResponse(connection)
        val json = if (text.isBlank()) JSONObject() else JSONObject(text)
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException(json.optString("error").ifBlank { "budget_request_failed" })
        }
        return json
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }
}
