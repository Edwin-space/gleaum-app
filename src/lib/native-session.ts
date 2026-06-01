/**
 * NativeSession — Capacitor 브리지 플러그인 인터페이스
 *
 * Android 네이티브 로그인(LoginActivity)에서 저장한 Supabase 세션을
 * WebView(JavaScript) 에서 읽고 삭제하는 데 사용합니다.
 */
import { registerPlugin } from '@capacitor/core';

export interface NativeSessionPlugin {
  /** 저장된 세션 JSON 반환. 없거나 만료됐으면 session = null */
  getSession(): Promise<{ session: string | null }>;
  /** 세션 삭제만 (내부 용도) */
  clearSession(): Promise<void>;
  /**
   * 로그아웃 — 세션 삭제 + LoginActivity 로 전환
   * 웹앱에서 supabase.auth.signOut() 후 호출
   */
  logout(): Promise<void>;
}

export const NativeSession = registerPlugin<NativeSessionPlugin>('NativeSession', {
  web: () => ({
    async getSession()   { return { session: null }; },
    async clearSession() {},
    async logout()       {},
  }),
});
