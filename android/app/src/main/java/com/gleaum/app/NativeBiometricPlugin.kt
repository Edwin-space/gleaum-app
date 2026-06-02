package com.gleaum.app

import android.app.KeyguardManager
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.biometrics.BiometricManager
import android.hardware.biometrics.BiometricPrompt
import android.os.Build
import android.os.CancellationSignal
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * NativeBiometricPlugin — Android 앱 잠금용 생체/기기 인증 브리지.
 *
 * Android 10+ 에서는 지문과 기기 잠금을 함께 허용하고,
 * Android 9 에서는 framework BiometricPrompt 로 지문 인증을 처리한다.
 */
@CapacitorPlugin(name = "NativeBiometric")
class NativeBiometricPlugin : Plugin() {

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val result = JSObject()
        val keyguard = activity.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            result.put("available", false)
            result.put("biometryType", "none")
            result.put("reason", "unsupported_android_version")
            call.resolve(result)
            return
        }

        val hasFingerprint = activity.packageManager.hasSystemFeature(PackageManager.FEATURE_FINGERPRINT)
        val isDeviceSecure = keyguard.isDeviceSecure

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val manager = activity.getSystemService(BiometricManager::class.java)
            val canAuthenticate = manager?.canAuthenticate() == BiometricManager.BIOMETRIC_SUCCESS
            val available = canAuthenticate || isDeviceSecure
            result.put("available", available)
            result.put("biometryType", if (canAuthenticate) "fingerprint" else if (isDeviceSecure) "deviceCredential" else "none")
            if (!available) result.put("reason", "biometric_or_device_lock_not_enrolled")
            call.resolve(result)
            return
        }

        val available = hasFingerprint && isDeviceSecure
        result.put("available", available)
        result.put("biometryType", if (available) "fingerprint" else "none")
        if (!available) result.put("reason", "fingerprint_not_enrolled")
        call.resolve(result)
    }

    @PluginMethod
    fun authenticate(call: PluginCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            call.reject("unsupported_android_version")
            return
        }

        val title = call.getString("title") ?: "글리움 잠금 해제"
        val subtitle = call.getString("subtitle") ?: "지문 또는 기기 잠금으로 인증해 주세요."
        val signal = CancellationSignal()

        val builder = BiometricPrompt.Builder(activity)
            .setTitle(title)
            .setSubtitle(subtitle)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            builder.setDeviceCredentialAllowed(true)
        } else {
            builder.setNegativeButton("취소", activity.mainExecutor) { _, _ ->
                call.reject("user_cancelled")
            }
        }

        val prompt = builder.build()
        prompt.authenticate(signal, activity.mainExecutor, object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult?) {
                val response = JSObject()
                response.put("success", true)
                call.resolve(response)
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence?) {
                call.reject(errString?.toString() ?: "authentication_error")
            }

            override fun onAuthenticationFailed() {
                // 지문 1회 실패는 프롬프트를 닫지 않고 네이티브 UI에서 재시도하게 둔다.
            }
        })
    }
}
