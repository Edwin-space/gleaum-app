/**
 * NativeSession — Capacitor 브리지 플러그인 인터페이스
 *
 * Android 네이티브 로그인(LoginActivity)에서 저장한 Supabase 세션을
 * WebView(JavaScript) 에서 읽고 삭제하는 데 사용합니다.
 *
 * 네이티브 구현: android/.../NativeSessionPlugin.kt
 * 웹 폴백: session 항상 null (웹 브라우저에서는 동작하지 않음)
 */
import { registerPlugin } from '@capacitor/core';

export interface NativeSessionPlugin {
  /** 저장된 세션 JSON 반환. 없거나 만료됐으면 session = null */
  getSession(): Promise<{ session: string | null }>;
  /** 세션 삭제 (웹 앱 로그아웃 시 호출) */
  clearSession(): Promise<void>;
}

export const NativeSession = registerPlugin<NativeSessionPlugin>('NativeSession', {
  // 웹 환경 폴백 — 항상 null 반환
  web: () => ({
    async getSession()    { return { session: null }; },
    async clearSession()  {},
  }),
});
