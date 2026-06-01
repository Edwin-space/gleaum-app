package com.gleaum.app

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * NativeSessionPlugin — Capacitor 브리지 플러그인
 */
@CapacitorPlugin(name = "NativeSession")
class NativeSessionPlugin : Plugin() {

    /** 저장된 세션 JSON 반환. 없거나 만료됐으면 session = null */
    @PluginMethod
    fun getSession(call: PluginCall) {
        val sessionJson = SessionManager.get(activity)
        val result = JSObject()
        result.put("session", sessionJson)
        call.resolve(result)
    }

    /** 세션 삭제만 (내부 용도) */
    @PluginMethod
    fun clearSession(call: PluginCall) {
        SessionManager.clear(activity)
        call.resolve()
    }

    /**
     * 로그아웃 — 세션 삭제 후 LoginActivity 로 전환
     *
     * 웹앱에서 supabase.auth.signOut() 호출 시 invoke 됨.
     * WebView 의 /login 페이지로 가는 대신 네이티브 LoginActivity 를 표시.
     */
    @PluginMethod
    fun logout(call: PluginCall) {
        SessionManager.clear(activity)
        call.resolve()

        // UI 조작은 메인 스레드에서
        activity.runOnUiThread {
            val intent = Intent(activity, LoginActivity::class.java).apply {
                // 기존 액티비티 스택 전부 제거 후 LoginActivity 를 루트로
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            activity.startActivity(intent)
        }
    }
}
