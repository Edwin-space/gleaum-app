'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { isNativeApp, openBrowser, closeBrowser } from '@/lib/native';

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 초기 세션
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 세션 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async (next?: string) => {
    const supabase = createClient();

    if (isNativeApp()) {
      // ── 네이티브 앱 OAuth 플로우 ──────────────────────────────────────
      // 1. redirectTo를 gleaum:// 딥링크로 설정
      // 2. skipBrowserRedirect: true → URL만 받고 자동 리다이렉트 안 함
      // 3. @capacitor/browser로 OAuth URL 직접 열기
      // ⚠️ Supabase 대시보드 → Authentication → URL Configuration 에서
      //    Redirect URLs 에 gleaum://auth/callback 추가 필요

      // ★ next 파라미터 보존
      //   네이티브 OAuth는 gleaum://auth/callback 고정 URL을 사용해
      //   next 를 redirectTo 에 넣을 수 없음. sessionStorage 로 전달.
      if (next) {
        try { sessionStorage.setItem('gleaum_oauth_next', next); } catch {}
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'gleaum://auth/callback',
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        console.error('Google 로그인 오류:', error.message);
        return;
      }
      if (data?.url) {
        // Capacitor 인앱 브라우저로 열기 (WKWebView 세션 격리 → 보안)
        await openBrowser(data.url);
      }
    } else {
      // ── 웹 브라우저 OAuth 플로우 (기존 방식) ─────────────────────────
      const callbackUrl = next
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
        : `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      });
      if (error) console.error('Google 로그인 오류:', error.message);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });
    if (error) throw error;
  };

  const linkProvider = async (provider: 'google' | 'apple' | 'naver') => {
    const supabase = createClient();
    const { error } = await supabase.auth.linkIdentity({
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    if (isNativeApp()) {
      // 네이티브 앱: NativeAppProvider 의 SIGNED_OUT 이벤트 핸들러가
      // NativeSession.logout() 을 호출해 LoginActivity 로 전환
      // (window.location.href = '/login' 으로 웹 로그인 페이지가 뜨는 것 방지)
    } else {
      window.location.href = '/login';
    }
  };

  // 구글 토큰 (Calendar/Drive API 용)
  const getGoogleToken = () => session?.provider_token ?? null;

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    updatePassword,
    linkProvider,
    signOut,
    getGoogleToken,
  };
}
