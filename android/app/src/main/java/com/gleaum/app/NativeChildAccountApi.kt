package com.gleaum.app

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URLEncoder
import java.net.URL

data class NativeFamilyDependent(
    val id: String,
    val spaceId: String,
    val displayName: String,
    val birthDate: String,
    val expectedEmail: String?,
    val candidateEmail: String?,
    val candidateProvider: String?,
    val status: String,
) {
    companion object {
        fun fromJson(json: JSONObject) = NativeFamilyDependent(
            id = json.optString("id"),
            spaceId = json.optString("spaceId"),
            displayName = json.optString("displayName", "자녀"),
            birthDate = json.optString("birthDate"),
            expectedEmail = json.optNullableString("expectedEmail"),
            candidateEmail = json.optNullableString("candidateEmail"),
            candidateProvider = json.optNullableString("candidateProvider"),
            status = json.optString("status", "consent_pending"),
        )

        fun listFrom(array: JSONArray): List<NativeFamilyDependent> = buildList {
            for (index in 0 until array.length()) {
                array.optJSONObject(index)?.let { add(fromJson(it)) }
            }
        }
    }
}

data class NativeGuardianChallenge(
    val dependentId: String,
    val displayName: String,
    val email: String,
    val challengeToken: String,
    val expiresAt: String,
)

data class NativeChildInvitation(
    val inviteUrl: String,
    val expiresAt: String,
)

object NativeChildAccountApi {
    private const val BASE_URL = "https://www.gleaum.com/api/spaces/children"

    fun list(context: Context, spaceId: String): List<NativeFamilyDependent> {
        val encoded = URLEncoder.encode(spaceId, Charsets.UTF_8.name())
        val json = request(context, "GET", "$BASE_URL?spaceId=$encoded")
        return NativeFamilyDependent.listFrom(json.optJSONArray("dependents") ?: JSONArray())
    }

    fun create(
        context: Context,
        spaceId: String,
        displayName: String,
        birthDate: String,
        expectedEmail: String?,
        relationshipType: String,
    ): String {
        val body = JSONObject()
            .put("spaceId", spaceId)
            .put("displayName", displayName)
            .put("birthDate", birthDate)
            .put("relationshipType", relationshipType)
        expectedEmail?.takeIf { it.isNotBlank() }?.let { body.put("expectedEmail", it) }
        return request(context, "POST", BASE_URL, body).optString("dependentId")
    }

    fun startGuardianVerification(
        context: Context,
        dependent: NativeFamilyDependent,
    ): NativeGuardianChallenge {
        val json = request(
            context,
            "POST",
            "$BASE_URL/${dependent.id}/guardian-verification/start",
        )
        return NativeGuardianChallenge(
            dependentId = dependent.id,
            displayName = dependent.displayName,
            email = json.optString("email"),
            challengeToken = json.optString("challengeToken"),
            expiresAt = json.optString("expiresAt"),
        )
    }

    fun verifyGuardianOtp(context: Context, challengeToken: String, code: String) {
        request(
            context,
            "POST",
            "$BASE_URL/guardian-verification/verify-otp",
            JSONObject()
                .put("challengeToken", challengeToken)
                .put("code", code),
        )
    }

    fun completeGuardianConsent(context: Context, challengeToken: String) {
        request(
            context,
            "POST",
            "$BASE_URL/guardian-verification/complete",
            JSONObject()
                .put("token", challengeToken)
                .put(
                    "consentTypes",
                    JSONArray(
                        listOf(
                            "service_registration",
                            "personal_data_processing",
                            "family_data_sharing",
                        ),
                    ),
                ),
        )
    }

    fun createInvitation(context: Context, dependentId: String): NativeChildInvitation {
        val json = request(context, "POST", "$BASE_URL/$dependentId/invite")
        return NativeChildInvitation(
            inviteUrl = json.optString("inviteUrl"),
            expiresAt = json.optString("expiresAt"),
        )
    }

    fun approve(context: Context, dependentId: String) {
        request(context, "POST", "$BASE_URL/$dependentId/approve")
    }

    fun reject(context: Context, dependentId: String) {
        request(context, "POST", "$BASE_URL/$dependentId/reject")
    }

    fun claim(context: Context, invitationToken: String) {
        request(
            context,
            "POST",
            "$BASE_URL/invitations/claim",
            JSONObject().put("token", invitationToken),
        )
    }

    private fun request(
        context: Context,
        method: String,
        url: String,
        body: JSONObject? = null,
    ): JSONObject {
        val session = SessionManager.get(context) ?: throw IllegalStateException("session_required")
        val token = JSONObject(session).optString("access_token").takeIf { it.isNotBlank() }
            ?: throw IllegalStateException("session_required")
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 15_000
            readTimeout = 20_000
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("X-Gleaum-Native-Preview", "android-child-account")
            if (body != null) {
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }
        }
        if (body != null) {
            connection.outputStream.writer(Charsets.UTF_8).use { it.write(body.toString()) }
        }

        val text = readResponse(connection)
        val json = if (text.isBlank()) JSONObject() else JSONObject(text)
        if (connection.responseCode == HttpURLConnection.HTTP_UNAUTHORIZED) {
            throw IllegalStateException("session_required")
        }
        if (connection.responseCode !in 200..299) {
            val code = json.optString("error").ifBlank {
                "child_account_request_failed_${connection.responseCode}"
            }
            Log.e("GleaumChildApi", "$method $url failed (${connection.responseCode}): $text")
            throw IllegalStateException(code)
        }
        return json
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) {
            connection.inputStream
        } else {
            connection.errorStream
        }
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }
}

private fun JSONObject.optNullableString(key: String): String? =
    optString(key).takeIf { it.isNotBlank() && it != "null" }
