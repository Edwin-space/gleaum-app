package com.gleaum.app

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.compose.setContent
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.gleaum.app.ui.screens.family.ChildAccountMode
import com.gleaum.app.ui.screens.family.ComposeChildAccountScreen
import com.gleaum.app.ui.theme.GleaumTheme
import org.json.JSONObject

class NativeChildAccountActivity : AppCompatActivity() {
    private val spaceId by lazy { intent.getStringExtra(EXTRA_SPACE_ID).orEmpty() }
    private val invitationToken by lazy { intent.getStringExtra(EXTRA_INVITATION_TOKEN).orEmpty() }
    private val initialConsentToken by lazy { intent.getStringExtra(EXTRA_CONSENT_TOKEN).orEmpty() }

    private val mode: ChildAccountMode by lazy {
        when {
            invitationToken.isNotBlank() -> ChildAccountMode.CLAIM
            initialConsentToken.isNotBlank() -> ChildAccountMode.CONSENT
            else -> ChildAccountMode.MANAGE
        }
    }

    private var dependents by mutableStateOf<List<NativeFamilyDependent>>(emptyList())
    private var loading by mutableStateOf(false)
    private var busy by mutableStateOf(false)
    private var message by mutableStateOf<String?>(null)
    private var guardianChallenge by mutableStateOf<NativeGuardianChallenge?>(null)
    private var consentToken by mutableStateOf<String?>(null)
    private var claimCompleted by mutableStateOf(false)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        NativeTheme.applySystemBars(window, this)
        consentToken = initialConsentToken.takeIf { it.isNotBlank() }
        setContent {
            GleaumTheme {
                ComposeChildAccountScreen(
                    mode = mode,
                    signedInEmail = signedInEmail(),
                    dependents = dependents,
                    loading = loading,
                    busy = busy,
                    message = message,
                    guardianChallenge = guardianChallenge,
                    consentToken = consentToken,
                    claimCompleted = claimCompleted,
                    onBack = { finish() },
                    onRefresh = { loadDependents() },
                    onCreateDependent = ::createDependent,
                    onStartVerification = ::startGuardianVerification,
                    onVerifyOtp = ::verifyGuardianOtp,
                    onDismissChallenge = { if (!busy) guardianChallenge = null },
                    onCompleteConsent = ::completeGuardianConsent,
                    onDismissConsent = { if (!busy) consentToken = null },
                    onCreateInvitation = ::createInvitation,
                    onApprove = ::confirmApprove,
                    onReject = ::confirmReject,
                    onClaimInvitation = ::claimInvitation,
                )
            }
        }

        if (mode == ChildAccountMode.MANAGE) {
            loadDependents()
        }
    }

    override fun onResume() {
        super.onResume()
        NativeTheme.applySystemBars(window, this)
    }

    private fun loadDependents() {
        if (spaceId.isBlank()) {
            message = "가족 공간을 찾을 수 없습니다."
            return
        }
        loading = true
        message = null
        Thread {
            runCatching { NativeChildAccountApi.list(this, spaceId) }
                .onSuccess { loaded ->
                    runOnUiThread {
                        dependents = loaded
                        loading = false
                    }
                }
                .onFailure { error ->
                    runOnUiThread {
                        loading = false
                        message = friendlyError(error.message)
                    }
                }
        }.start()
    }

    private fun createDependent(
        name: String,
        birthDate: String,
        expectedEmail: String?,
        relationship: String,
    ) {
        mutate(
            action = {
                NativeChildAccountApi.create(
                    context = this,
                    spaceId = spaceId,
                    displayName = name,
                    birthDate = birthDate,
                    expectedEmail = expectedEmail,
                    relationshipType = relationship,
                )
            },
            successMessage = "자녀 정보가 등록되었습니다.",
            onSuccess = { loadDependents() },
        )
    }

    private fun startGuardianVerification(dependent: NativeFamilyDependent) {
        mutate(
            action = { NativeChildAccountApi.startGuardianVerification(this, dependent) },
            successMessage = "보호자 이메일로 8자리 확인 코드를 보냈습니다.",
            onSuccess = { challenge -> guardianChallenge = challenge },
        )
    }

    private fun verifyGuardianOtp(token: String, code: String) {
        mutate(
            action = { NativeChildAccountApi.verifyGuardianOtp(this, token, code) },
            successMessage = "보호자 이메일이 확인되었습니다.",
            onSuccess = {
                guardianChallenge = null
                consentToken = token
            },
        )
    }

    private fun completeGuardianConsent(token: String) {
        mutate(
            action = { NativeChildAccountApi.completeGuardianConsent(this, token) },
            successMessage = "보호자 확인과 필수 동의가 완료되었습니다.",
            onSuccess = {
                consentToken = null
                if (mode == ChildAccountMode.CONSENT) {
                    finish()
                } else {
                    loadDependents()
                }
            },
        )
    }

    private fun createInvitation(dependent: NativeFamilyDependent) {
        mutate(
            action = { NativeChildAccountApi.createInvitation(this, dependent.id) },
            successMessage = null,
            onSuccess = { invitation ->
                shareInvitation(dependent.displayName, invitation)
                loadDependents()
            },
        )
    }

    private fun confirmApprove(dependent: NativeFamilyDependent) {
        AlertDialog.Builder(this)
            .setTitle("자녀 계정 연결 승인")
            .setMessage("${dependent.candidateEmail ?: dependent.displayName} 계정을 확인하고 가족 공간 연결을 승인할까요?")
            .setNegativeButton("취소", null)
            .setPositiveButton("승인") { _, _ ->
                mutate(
                    action = { NativeChildAccountApi.approve(this, dependent.id) },
                    successMessage = "자녀 계정 연결을 승인했습니다.",
                    onSuccess = { loadDependents() },
                )
            }
            .show()
    }

    private fun confirmReject(dependent: NativeFamilyDependent) {
        AlertDialog.Builder(this)
            .setTitle("연결 요청 거절")
            .setMessage("이 계정의 연결 요청을 거절할까요? 이후 새 초대 링크를 다시 보낼 수 있습니다.")
            .setNegativeButton("취소", null)
            .setPositiveButton("거절") { _, _ ->
                mutate(
                    action = { NativeChildAccountApi.reject(this, dependent.id) },
                    successMessage = "연결 요청을 거절했습니다.",
                    onSuccess = { loadDependents() },
                )
            }
            .show()
    }

    private fun claimInvitation() {
        if (invitationToken.isBlank()) {
            message = "유효하지 않은 초대 링크입니다."
            return
        }
        mutate(
            action = { NativeChildAccountApi.claim(this, invitationToken) },
            successMessage = "보호자에게 연결 요청을 보냈습니다.",
            onSuccess = { claimCompleted = true },
        )
    }

    private fun shareInvitation(
        displayName: String,
        invitation: NativeChildInvitation,
    ) {
        val shareText = """
            글리움 가족 공간에 초대합니다.

            $displayName 님이 사용할 계정으로 아래 링크를 열어 연결을 요청해 주세요.
            ${invitation.inviteUrl}

            이 링크는 72시간 동안 한 번만 사용할 수 있으며 보호자 최종 승인 전에는 공간 정보가 공개되지 않습니다.
        """.trimIndent()
        startActivity(
            Intent.createChooser(
                Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_SUBJECT, "글리움 자녀 계정 연결")
                    putExtra(Intent.EXTRA_TEXT, shareText)
                },
                "초대 링크 공유",
            ),
        )
    }

    private fun signedInEmail(): String? {
        val session = SessionManager.get(this) ?: return null
        return runCatching {
            JSONObject(session)
                .optJSONObject("user")
                ?.optString("email")
                ?.takeIf { it.isNotBlank() }
        }.getOrNull()
    }

    private fun <T> mutate(
        action: () -> T,
        successMessage: String?,
        onSuccess: (T) -> Unit,
    ) {
        if (busy) return
        busy = true
        message = null
        Thread {
            runCatching(action)
                .onSuccess { result ->
                    runOnUiThread {
                        busy = false
                        successMessage?.let(::toast)
                        onSuccess(result)
                    }
                }
                .onFailure { error ->
                    runOnUiThread {
                        busy = false
                        val friendly = friendlyError(error.message)
                        message = friendly
                        toast(friendly)
                    }
                }
        }.start()
    }

    private fun friendlyError(code: String?): String = when (code) {
        "session_required" -> "로그인 세션이 만료되었습니다. 다시 로그인해 주세요."
        "family_space_required" -> "가족 공간에서만 자녀 계정을 연결할 수 있습니다."
        "forbidden", "account_capability_required" -> "이 작업을 수행할 보호자 권한이 없습니다."
        "guardian_email_cannot_be_child_email" -> "보호자 이메일은 자녀 계정 제한값으로 사용할 수 없습니다."
        "expected_email_already_registered" -> "이미 등록된 자녀 이메일입니다."
        "verification_rate_limited" -> "1분 후 확인 코드를 다시 요청해 주세요."
        "verified_guardian_email_required" -> "이메일 확인이 완료된 보호자 계정이 필요합니다."
        "invalid_verification_code" -> "확인 코드가 올바르지 않습니다."
        "verification_expired" -> "확인 코드가 만료되었습니다. 새 코드를 받아 주세요."
        "guardian_verification_required", "verified_guardian_consent_required" ->
            "보호자 이메일 확인과 필수 동의를 먼저 완료해 주세요."
        "invited_email_mismatch" -> "초대에 지정된 이메일과 현재 로그인 계정이 다릅니다."
        "guardian_account_cannot_claim_child_invitation" ->
            "보호자 계정으로는 자녀 초대를 수락할 수 없습니다."
        "expired_invitation" -> "초대 링크가 만료되었습니다. 보호자에게 새 링크를 요청해 주세요."
        "invalid_or_used_invitation" -> "이미 사용되었거나 유효하지 않은 초대 링크입니다."
        "existing_space_member_requires_conversion" -> "이미 공간 멤버인 계정은 자녀 계정으로 바로 전환할 수 없습니다."
        "child_link_not_pending" -> "현재 승인 대기 중인 연결 요청이 없습니다."
        else -> "요청을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요."
    }

    private fun toast(message: String) =
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()

    companion object {
        const val EXTRA_SPACE_ID = "space_id"
        const val EXTRA_INVITATION_TOKEN = "invitation_token"
        const val EXTRA_CONSENT_TOKEN = "consent_token"
    }
}
