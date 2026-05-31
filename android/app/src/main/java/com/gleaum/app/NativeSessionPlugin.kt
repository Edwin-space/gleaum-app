package com.gleaum.app

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * NativeSessionPlugin — Capacitor 브리지 플러그인
 *
 * 네이티브(Android) 로그인 후 저장된 Supabase 세션을
 * WebView(JavaScript) 에서 사용할 수 있도록 노출합니다.
 *
 * JS 사용 예:
 *   import { NativeSession } from '@/lib/native-session';
 *   const { session } = await NativeSession.getSession();
 */
@CapacitorPlugin(name = "NativeSession")
class NativeSessionPlugin : Plugin() {

    /** 저장된 세션 JSON 반환. 없거나 만료됐으면 session = null */
    @PluginMethod
    fun getSession(call: PluginCall) {
        val sessionJson = SessionManager.get(activity)
        val result = JSObject()
        result.put("session", sessionJson)   // null 이면 JS 에서 null 로 수신
        call.resolve(result)
    }

    /** 세션 삭제 (웹 앱 로그아웃 시 호출) */
    @PluginMethod
    fun clearSession(call: PluginCall) {
        SessionManager.clear(activity)
        call.resolve()
    }
}
