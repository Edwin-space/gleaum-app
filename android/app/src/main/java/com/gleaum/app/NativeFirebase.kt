package com.gleaum.app

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.util.Base64
import android.util.Log
import com.google.firebase.FirebaseApp
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.crashlytics.FirebaseCrashlytics
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.remoteconfig.FirebaseRemoteConfig
import com.google.firebase.remoteconfig.FirebaseRemoteConfigSettings
import org.json.JSONObject
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

/** Native Android Firebase 운영 계측/토큰 등록 허브. */
object NativeFirebase {
    private const val TAG = "GleaumFirebase"
    private var bootstrapped = false
    private var lastTokenSyncKey: String? = null

    fun bootstrap(context: Context) {
        if (bootstrapped) return
        bootstrapped = true
        try {
            FirebaseApp.initializeApp(context)
            FirebaseAnalytics.getInstance(context).setAnalyticsCollectionEnabled(true)
            FirebaseCrashlytics.getInstance().setCrashlyticsCollectionEnabled(true)
            FirebaseRemoteConfig.getInstance().setConfigSettingsAsync(
                FirebaseRemoteConfigSettings.Builder()
                    .setMinimumFetchIntervalInSeconds(if (BuildConfig.DEBUG) 0L else 3600L)
                    .build()
            )
            FirebaseRemoteConfig.getInstance().fetchAndActivate()
            syncSession(context, "bootstrap")
        } catch (e: Exception) {
            Log.w(TAG, "Firebase bootstrap failed", e)
        }
    }

    fun syncSession(context: Context, source: String) {
        val session = SessionManager.get(context) ?: return
        val userId = userIdFromSession(session) ?: return
        FirebaseCrashlytics.getInstance().setUserId(userId)
        FirebaseCrashlytics.getInstance().setCustomKey("session_source", source)
        FirebaseAnalytics.getInstance(context).setUserId(userId)
        FirebaseAnalytics.getInstance(context).setUserProperty("native_platform", "android")

        FirebaseMessaging.getInstance().token
            .addOnSuccessListener { token -> registerFcmToken(context, token, userId) }
            .addOnFailureListener { error -> recordException(error, "fcm_token_fetch_failed") }
    }

    fun onNewFcmToken(context: Context, token: String) {
        val session = SessionManager.get(context) ?: return
        val userId = userIdFromSession(session) ?: return
        registerFcmToken(context, token, userId)
    }

    fun screen(activity: Activity, screenName: String) {
        FirebaseAnalytics.getInstance(activity).logEvent(FirebaseAnalytics.Event.SCREEN_VIEW, Bundle().apply {
            putString(FirebaseAnalytics.Param.SCREEN_NAME, screenName)
            putString(FirebaseAnalytics.Param.SCREEN_CLASS, activity.javaClass.simpleName)
        })
        FirebaseCrashlytics.getInstance().setCustomKey("last_screen", screenName)
    }

    fun event(context: Context, name: String, params: Bundle = Bundle.EMPTY) {
        FirebaseAnalytics.getInstance(context).logEvent(name, params)
    }

    fun recordException(error: Throwable, reason: String) {
        FirebaseCrashlytics.getInstance().setCustomKey("last_error_reason", reason)
        FirebaseCrashlytics.getInstance().recordException(error)
    }

    private fun registerFcmToken(context: Context, token: String, userId: String) {
        val syncKey = "$userId:${token.takeLast(16)}"
        if (syncKey == lastTokenSyncKey) return
        lastTokenSyncKey = syncKey

        Thread {
            try {
                val session = SessionManager.get(context) ?: return@Thread
                val accessToken = JSONObject(session).optString("access_token").takeIf { it.isNotBlank() } ?: return@Thread
                val supabaseUrl = context.getString(R.string.supabase_url).trimEnd('/')
                val anonKey = context.getString(R.string.supabase_anon_key)
                val encodedUserId = URLEncoder.encode(userId, Charsets.UTF_8.name())
                val connection = (URL("$supabaseUrl/rest/v1/profiles?id=eq.$encodedUserId").openConnection() as HttpURLConnection).apply {
                    requestMethod = "PATCH"
                    connectTimeout = 15000
                    readTimeout = 20000
                    doOutput = true
                    setRequestProperty("apikey", anonKey)
                    setRequestProperty("Authorization", "Bearer $accessToken")
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("Prefer", "return=minimal")
                }
                OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use {
                    it.write(JSONObject().put("fcm_token", token).toString())
                }
                val code = connection.responseCode
                if (code !in 200..299) {
                    val body = readResponse(connection)
                    throw IllegalStateException("fcm_token_register_failed:$code:$body")
                }
                Log.i(TAG, "FCM token synced for user=$userId prefix=${token.take(12)}")
            } catch (e: Exception) {
                lastTokenSyncKey = null
                recordException(e, "fcm_token_register_failed")
            }
        }.start()
    }

    private fun userIdFromSession(session: String): String? {
        return try {
            val token = JSONObject(session).optString("access_token")
            val payload = token.split('.').getOrNull(1) ?: return null
            val padded = payload.padEnd(payload.length + (4 - payload.length % 4) % 4, '=')
            val json = String(Base64.decode(padded, Base64.URL_SAFE or Base64.NO_WRAP), Charsets.UTF_8)
            JSONObject(json).optString("sub").takeIf { it.isNotBlank() }
        } catch (_: Exception) {
            null
        }
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader(Charsets.UTF_8)?.use(BufferedReader::readText).orEmpty()
    }
}
