package com.gleaum.app

import android.content.Context
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

data class NativeAccountStatus(
    val withdrawalPending: Boolean,
    val isWithdrawn: Boolean,
    val withdrawalRequestedAt: String?,
    val deleteScheduledAt: String?,
    val daysLeft: Int,
) {
    companion object {
        fun fromJson(json: JSONObject): NativeAccountStatus = NativeAccountStatus(
            withdrawalPending = json.optBoolean("withdrawalPending", false),
            isWithdrawn = json.optBoolean("isWithdrawn", false),
            withdrawalRequestedAt = json.optString("withdrawalRequestedAt").takeIf { it.isNotBlank() && it != "null" },
            deleteScheduledAt = json.optString("deleteScheduledAt").takeIf { it.isNotBlank() && it != "null" },
            daysLeft = json.optInt("daysLeft", 0),
        )
    }
}

object NativeAccountApi {
    private const val STATUS_URL = "https://www.gleaum.com/api/account/status"
    private const val WITHDRAW_URL = "https://www.gleaum.com/api/account/withdraw"
    private const val RESTORE_URL = "https://www.gleaum.com/api/account/restore"

    fun status(context: Context): NativeAccountStatus = NativeAccountStatus.fromJson(request(context, "GET", STATUS_URL))

    fun withdraw(context: Context, reason: String?) {
        val body = JSONObject().put("reason", reason?.takeIf { it.isNotBlank() } ?: JSONObject.NULL)
        request(context, "POST", WITHDRAW_URL, body)
    }

    fun restore(context: Context) {
        request(context, "POST", RESTORE_URL)
    }

    private fun request(context: Context, method: String, url: String, body: JSONObject? = null): JSONObject {
        val session = SessionManager.get(context) ?: throw IllegalStateException("session_required")
        val token = JSONObject(session).optString("access_token").takeIf { it.isNotBlank() }
            ?: throw IllegalStateException("session_required")
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 15000
            readTimeout = 20000
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("X-Gleaum-Native-Preview", "android-account")
            if (body != null) {
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }
        }
        if (body != null) {
            java.io.OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { it.write(body.toString()) }
        }
        val text = readResponse(connection)
        val json = if (text.isBlank()) JSONObject() else JSONObject(text)
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException(json.optString("error").ifBlank { "account_request_failed" })
        }
        return json
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }
}
