package com.gleaum.app

import android.content.Intent
import android.os.Bundle
import android.view.WindowInsetsController
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * LoginActivity — 네이티브 로그인/회원가입 화면
 *
 * 진입 조건:
 *  - 앱 최초 실행 (세션 없음)
 *  - 로그아웃 후 재진입
 *
 * 로그인 방식:
 *  1. Google로 계속하기 (Credential Manager API)
 *  2. 이메일 주소로 사용하기 (기존 계정 OTP 로그인)
 *
 * 로그인 성공 → SessionManager 저장 → MainActivity 시작 → finish()
 */
class LoginActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 이미 유효한 세션이 있으면 바로 메인으로
        if (SessionManager.hasValid(this)) {
            goToMain()
            return
        }

        enableEdgeToEdge()

        // 상태바 아이콘 흰색 (검정 배경)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            window.insetsController?.setSystemBarsAppearance(
                0, WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
            )
        }
        window.statusBarColor     = android.graphics.Color.BLACK
        window.navigationBarColor = android.graphics.Color.BLACK

        setContent {
            GleaumLoginTheme {
                LoginScreen(
                    onGoogleSignIn    = { handleGoogleSignIn() },
                    onEmailSignIn     = { email -> handleEmailOtp(email) },
                    onVerifyOtp       = { email, otp -> handleVerifyOtp(email, otp) },
                )
            }
        }
    }

    // ── Google Sign-In ──────────────────────────────────────────────────────

    private fun handleGoogleSignIn() {
        val credentialManager = CredentialManager.create(this)
        val googleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)   // 새 계정도 포함
            .setServerClientId(getString(R.string.google_web_client_id))
            .setAutoSelectEnabled(false)
            .build()
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result = credentialManager.getCredential(this@LoginActivity, request)
                val idToken = GoogleIdTokenCredential.createFrom(result.credential.data).idToken
                val sessionJson = exchangeGoogleToken(idToken)
                if (sessionJson != null) {
                    SessionManager.save(this@LoginActivity, sessionJson)
                    goToMain()
                } else {
                    showToast("로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.")
                }
            } catch (_: GetCredentialCancellationException) {
                // 사용자 취소 — 무시
            } catch (e: GetCredentialException) {
                showToast("Google 로그인 오류: ${e.message}")
            }
        }
    }

    // ── 이메일 OTP 발송 ─────────────────────────────────────────────────────

    fun handleEmailOtp(email: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url  = URL("${getString(R.string.supabase_url)}/auth/v1/otp")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("apikey", getString(R.string.supabase_anon_key))
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true

                val body = JSONObject().apply {
                    put("email", email)
                    put("create_user", false)   // 기존 계정만 허용
                }.toString()
                OutputStreamWriter(conn.outputStream).use { it.write(body) }

                val code = conn.responseCode
                withContext(Dispatchers.Main) {
                    if (code == 200) {
                        // 성공 — UI에서 OTP 입력 화면으로 전환됨
                    } else {
                        showToast("이메일을 확인할 수 없습니다. Google 로그인을 먼저 이용해 주세요.")
                    }
                }
            } catch (_: Exception) {
                withContext(Dispatchers.Main) {
                    showToast("네트워크 오류가 발생했습니다.")
                }
            }
        }
    }

    // ── OTP 검증 ────────────────────────────────────────────────────────────

    fun handleVerifyOtp(email: String, otp: String) {
        CoroutineScope(Dispatchers.Main).launch {
            val sessionJson = withContext(Dispatchers.IO) {
                try {
                    val url  = URL("${getString(R.string.supabase_url)}/auth/v1/verify")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.setRequestProperty("apikey", getString(R.string.supabase_anon_key))
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.doOutput = true

                    val body = JSONObject().apply {
                        put("type", "email")
                        put("token", otp)
                        put("email", email)
                    }.toString()
                    OutputStreamWriter(conn.outputStream).use { it.write(body) }

                    if (conn.responseCode == 200) {
                        val resp = conn.inputStream.bufferedReader().readText()
                        addExpiresAt(resp)
                    } else null
                } catch (_: Exception) { null }
            }

            if (sessionJson != null) {
                SessionManager.save(this@LoginActivity, sessionJson)
                goToMain()
            } else {
                showToast("인증 코드가 올바르지 않습니다.")
            }
        }
    }

    // ── 유틸 ────────────────────────────────────────────────────────────────

    private suspend fun exchangeGoogleToken(idToken: String): String? =
        withContext(Dispatchers.IO) {
            try {
                val url  = URL("${getString(R.string.supabase_url)}/auth/v1/token?grant_type=id_token")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("apikey", getString(R.string.supabase_anon_key))
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true

                val body = JSONObject().apply {
                    put("provider", "google")
                    put("id_token", idToken)
                }.toString()
                OutputStreamWriter(conn.outputStream).use { it.write(body) }

                if (conn.responseCode == 200) {
                    addExpiresAt(conn.inputStream.bufferedReader().readText())
                } else null
            } catch (_: Exception) { null }
        }

    /** expires_in → expires_at(epoch seconds) 필드 추가 */
    private fun addExpiresAt(json: String): String {
        return try {
            val obj = JSONObject(json)
            val expiresIn = obj.optLong("expires_in", 3600L)
            obj.put("expires_at", System.currentTimeMillis() / 1000L + expiresIn)
            obj.toString()
        } catch (_: Exception) { json }
    }

    private fun showToast(msg: String) {
        android.widget.Toast.makeText(this, msg, android.widget.Toast.LENGTH_LONG).show()
    }

    private fun goToMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}

// ════════════════════════════════════════════════════════════════════
// Compose UI
// ════════════════════════════════════════════════════════════════════

@Composable
private fun GleaumLoginTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            background = Color.Black,
            surface    = Color(0xFF111111),
        ),
        content = content
    )
}

@Composable
private fun LoginScreen(
    onGoogleSignIn: () -> Unit,
    onEmailSignIn:  (String) -> Unit,
    onVerifyOtp:    (String, String) -> Unit,
) {
    // 화면 상태: main | email_input | otp_input
    var screen     by remember { mutableStateOf("main") }
    var email      by remember { mutableStateOf("") }
    var otp        by remember { mutableStateOf("") }
    var loading    by remember { mutableStateOf(false) }
    val focusManager = LocalFocusManager.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .systemBarsPadding()
    ) {
        when (screen) {

            // ── 메인 로그인 화면 ───────────────────────────────────────────
            "main" -> Column(
                modifier         = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                // ── 상단 브랜딩 영역 ──────────────────────────────────────
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(Color(0xFF0F1A2E), Color.Black)
                            )
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                    ) {
                        // 앱 아이콘
                        Image(
                            painter            = painterResource(R.mipmap.ic_launcher_foreground),
                            contentDescription = "글리움 로고",
                            modifier           = Modifier.size(80.dp),
                        )
                        // 서비스명
                        Text(
                            text       = "gleaum",
                            fontSize   = 34.sp,
                            fontWeight = FontWeight.Black,
                            color      = Color.White,
                            letterSpacing = 1.5.sp,
                        )
                        // 서비스 소개
                        Text(
                            text      = "나, 그리고 연인/가족의\n일상 네트워크",
                            fontSize  = 16.sp,
                            color     = Color(0xFF8E8E93),
                            textAlign = TextAlign.Center,
                            lineHeight = 24.sp,
                        )
                    }
                }

                // ── 하단 로그인 버튼 영역 ─────────────────────────────────
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 40.dp),
                    verticalArrangement    = Arrangement.spacedBy(16.dp),
                    horizontalAlignment    = Alignment.CenterHorizontally,
                ) {
                    // Google 로그인 버튼
                    GoogleSignInButton(
                        onClick  = onGoogleSignIn,
                        loading  = loading,
                        modifier = Modifier.fillMaxWidth(),
                    )

                    // 이메일 로그인 링크
                    Text(
                        text             = "이메일 주소로 사용하기",
                        fontSize         = 13.sp,
                        color            = Color(0xFF8E8E93),
                        textDecoration   = TextDecoration.Underline,
                        modifier         = Modifier.clickable { screen = "email_input" },
                    )

                    Spacer(Modifier.height(8.dp))

                    // 약관 안내
                    Text(
                        text      = "로그인 시 이용약관 및 개인정보처리방침에\n동의하는 것으로 간주됩니다.",
                        fontSize  = 11.sp,
                        color     = Color(0xFF48484A),
                        textAlign = TextAlign.Center,
                        lineHeight = 17.sp,
                    )
                }
            }

            // ── 이메일 입력 화면 ──────────────────────────────────────────
            "email_input" -> AnimatedVisibility(
                visible = true,
                enter   = fadeIn() + slideInVertically { it / 4 },
                exit    = fadeOut(),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 24.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    IconButton(
                        onClick  = { screen = "main" },
                        modifier = Modifier.align(Alignment.Start),
                    ) {
                        Text("←", fontSize = 22.sp, color = Color.White)
                    }
                    Spacer(Modifier.height(24.dp))
                    Text("이메일로 로그인", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "이전에 Google로 가입한 이메일 주소를 입력하세요.\n6자리 인증 코드를 보내드립니다.",
                        fontSize = 13.sp, color = Color(0xFF8E8E93), textAlign = TextAlign.Center, lineHeight = 19.sp,
                    )
                    Spacer(Modifier.height(32.dp))
                    OutlinedTextField(
                        value          = email,
                        onValueChange  = { email = it },
                        label          = { Text("이메일 주소") },
                        singleLine     = true,
                        modifier       = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Email,
                            imeAction    = ImeAction.Done,
                        ),
                        keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() }),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor   = Color(0xFF0084CC),
                            unfocusedBorderColor = Color(0xFF3A3A3C),
                            focusedLabelColor    = Color(0xFF0084CC),
                            unfocusedLabelColor  = Color(0xFF8E8E93),
                            focusedTextColor     = Color.White,
                            unfocusedTextColor   = Color.White,
                            cursorColor          = Color(0xFF0084CC),
                        ),
                    )
                    Spacer(Modifier.height(20.dp))
                    Button(
                        onClick  = {
                            if (email.isNotBlank()) {
                                onEmailSignIn(email.trim())
                                screen = "otp_input"
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape    = RoundedCornerShape(14.dp),
                        colors   = ButtonDefaults.buttonColors(containerColor = Color(0xFF0084CC)),
                        enabled  = email.isNotBlank(),
                    ) {
                        Text("인증 코드 발송", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            // ── OTP 입력 화면 ─────────────────────────────────────────────
            "otp_input" -> Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 24.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                IconButton(
                    onClick  = { screen = "email_input" },
                    modifier = Modifier.align(Alignment.Start),
                ) {
                    Text("←", fontSize = 22.sp, color = Color.White)
                }
                Spacer(Modifier.height(24.dp))
                Text("인증 코드 입력", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Spacer(Modifier.height(8.dp))
                Text(
                    "${email}으로\n6자리 코드를 보냈습니다.",
                    fontSize = 13.sp, color = Color(0xFF8E8E93), textAlign = TextAlign.Center, lineHeight = 19.sp,
                )
                Spacer(Modifier.height(32.dp))
                OutlinedTextField(
                    value          = otp,
                    onValueChange  = { if (it.length <= 6) otp = it },
                    label          = { Text("6자리 코드") },
                    singleLine     = true,
                    modifier       = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.NumberPassword,
                        imeAction    = ImeAction.Done,
                    ),
                    keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() }),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor   = Color(0xFF0084CC),
                        unfocusedBorderColor = Color(0xFF3A3A3C),
                        focusedLabelColor    = Color(0xFF0084CC),
                        unfocusedLabelColor  = Color(0xFF8E8E93),
                        focusedTextColor     = Color.White,
                        unfocusedTextColor   = Color.White,
                        cursorColor          = Color(0xFF0084CC),
                    ),
                )
                Spacer(Modifier.height(20.dp))
                Button(
                    onClick  = {
                        if (otp.length == 6) onVerifyOtp(email.trim(), otp)
                    },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape    = RoundedCornerShape(14.dp),
                    colors   = ButtonDefaults.buttonColors(containerColor = Color(0xFF0084CC)),
                    enabled  = otp.length == 6,
                ) {
                    Text("확인", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                }
                Spacer(Modifier.height(16.dp))
                Text(
                    text           = "코드를 다시 받기",
                    fontSize       = 13.sp,
                    color          = Color(0xFF8E8E93),
                    textDecoration = TextDecoration.Underline,
                    modifier       = Modifier.clickable { onEmailSignIn(email.trim()) },
                )
            }
        }
    }
}

@Composable
private fun GoogleSignInButton(
    onClick:  () -> Unit,
    loading:  Boolean,
    modifier: Modifier = Modifier,
) {
    Button(
        onClick  = onClick,
        modifier = modifier.height(54.dp),
        shape    = RoundedCornerShape(14.dp),
        enabled  = !loading,
        colors   = ButtonDefaults.buttonColors(
            containerColor = Color.White,
            contentColor   = Color(0xFF1A1B2E),
        ),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp),
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier  = Modifier.size(20.dp),
                color     = Color(0xFF1A1B2E),
                strokeWidth = 2.dp,
            )
        } else {
            Row(
                verticalAlignment    = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
            ) {
                Image(
                    painter            = painterResource(R.drawable.ic_google),
                    contentDescription = "Google",
                    modifier           = Modifier.size(20.dp),
                )
                Spacer(Modifier.width(10.dp))
                Text(
                    text       = "Google로 계속하기",
                    fontSize   = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color      = Color(0xFF1A1B2E),
                )
            }
        }
    }
}
