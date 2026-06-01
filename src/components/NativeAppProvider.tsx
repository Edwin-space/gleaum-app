'use client';

/**
 * NativeAppProvider
 *
 * 앱 마운트 시 네이티브 초기화 작업:
 * 1. Android 네이티브 로그인 세션 적용 (LoginActivity → NativeSessionPlugin → setSession)
 * 2. 스플래시 스크린 숨기기
 * 3. 상태바 스타일 설정
 * 4. Android 뒤로가기 버튼 처리
 * 5. gleaum:// 딥링크 수신 → OAuth 콜백 처리
 *
 * 인증 결과 커스텀 이벤트:
 *   'gleaum:auth-success' — 로그인 성공 (로그인 페이지 스피너 해제용)
 *   'gleaum:auth-error'   — 로그인 실패 (로그인 페이지 스피너 해제 + 에러 표시용)
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  hideSplash,
  setStatusBarDark,
  onAndroidBackButton,
  closeBrowser,
  isNativeApp,
} from '@/lib/native';

/** 인증 결과 이벤트 헬퍼 */
function dispatchAuthEvent(type: 'gleaum:auth-success' | 'gleaum:auth-error', detail?: string) {
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

/**
 * 로그인 전 저장해 둔 next 경로를 꺼내 반환 (1회 소비 후 삭제)
 */
function consumePendingRedirect(): string | null {
  try {
    const val = sessionStorage.getItem('gleaum_oauth_next');
    if (val) { sessionStorage.removeItem('gleaum_oauth_next'); return val; }
  } catch {}
  return null;
}

/**
 * OAuth 콜백 URL 수신 즉시 알림 — 로그인 페이지의 browserFinished 타임아웃을 취소
 */
function dispatchAuthProcessing() {
  window.dispatchEvent(new CustomEvent('gleaum:auth-processing'));
}

/**
 * Android 네이티브 로그인(LoginActivity) 세션을 Supabase 에 적용.
 *
 * 흐름:
 *   LoginActivity → SessionManager(SharedPrefs) 저장
 *   → NativeSessionPlugin.getSession() (Capacitor 브리지)
 *   → supabase.auth.setSession()
 *   → /home 이동
 *
 * - 이미 Supabase 세션이 있으면 스킵 (중복 적용 방지)
 * - NativeSession 플러그인이 없는 환경(웹)에서는 session = null → 스킵
 */
async function applyNativeSession(router: ReturnType<typeof useRouter>): Promise<void> {
  try {
    const supabase = createClient();

    // 이미 Supabase 클라이언트 세션이 있으면 처리 불필요
    const { data: { session: existing } } = await supabase.auth.getSession();
    if (existing) return;

    // NativeSessionPlugin 으로 Android 에 저장된 세션 조회
    const { NativeSession } = await import('@/lib/native-session');
    const { session: rawJson } = await NativeSession.getSession();
    if (!rawJson) return;

    const parsed = JSON.parse(rawJson) as {
      access_token:  string;
      refresh_token: string;
    };
    if (!parsed.access_token) return;

    const { data, error } = await supabase.auth.setSession({
      access_token:  parsed.access_token,
      refresh_token: parsed.refresh_token,
    });

    if (error) {
      console.warn('[NativeApp] 네이티브 세션 적용 실패:', error.message);
      return;
    }

    if (data.session) {
      console.log('[NativeApp] 네이티브 세션 적용 완료 → /home');
      // 온보딩 완료 여부 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed_at')
        .eq('id', data.session.user.id)
        .single();
      router.replace(
        profile && !profile.onboarding_completed_at ? '/onboarding' : '/home'
      );
    }
  } catch (e) {
    // NativeSessionPlugin 미설치 환경 또는 파싱 오류 — 무시
    console.debug('[NativeApp] applyNativeSession 스킵:', e);
  }
}

export function NativeAppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;

    // ── 0. Android 네이티브 로그인 세션 적용 ─────────────────────────
    void applyNativeSession(router);

    // ── 1. 스플래시 숨기기 ───────────────────────────────────────────
    const splashTimer = setTimeout(async () => {
      await hideSplash();
    }, 300);

    // ── 2. 상태바 설정 ───────────────────────────────────────────────
    setStatusBarDark();

    // ── 3. 딥링크 처리 ───────────────────────────────────────────────
    let removeUrlListener: (() => void) | undefined;
    let lastProcessedUrl: string | null = null;

    async function handleOAuthCallback(url: string) {
      if (lastProcessedUrl === url) {
        console.log('[NativeApp] 이미 처리된 URL, 건너뜀:', url);
        return;
      }
      lastProcessedUrl = url;
      console.log('[NativeApp] OAuth 콜백 처리:', url);

      dispatchAuthProcessing();
      await closeBrowser();

      try {
        const parsedUrl    = new URL(url);
        const code         = parsedUrl.searchParams.get('code');
        const accessToken  = parsedUrl.searchParams.get('access_token');
        const refreshToken = parsedUrl.searchParams.get('refresh_token');
        const supabase     = createClient();

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            dispatchAuthEvent('gleaum:auth-error', `PKCE오류|${error.message}|url=${url}`);
          } else if (data.session) {
            dispatchAuthEvent('gleaum:auth-success');
            const pending = consumePendingRedirect();
            if (pending) {
              router.replace(pending);
            } else {
              const { data: profile } = await supabase
                .from('profiles').select('onboarding_completed_at')
                .eq('id', data.session.user.id).single();
              router.replace(
                profile && !profile.onboarding_completed_at ? '/onboarding' : '/home'
              );
            }
          } else {
            dispatchAuthEvent('gleaum:auth-error', '세션을 가져올 수 없습니다');
          }
        } else if (accessToken) {
          const { data: sessionData, error } = await supabase.auth.setSession({
            access_token:  accessToken,
            refresh_token: refreshToken ?? '',
          });
          if (error) {
            dispatchAuthEvent('gleaum:auth-error', error.message);
          } else {
            dispatchAuthEvent('gleaum:auth-success');
            const pending = consumePendingRedirect();
            if (pending) {
              router.replace(pending);
            } else {
              const { data: profile } = await supabase
                .from('profiles').select('onboarding_completed_at')
                .eq('id', sessionData.session?.user.id ?? '').single();
              router.replace(
                profile && !profile.onboarding_completed_at ? '/onboarding' : '/home'
              );
            }
          }
        } else {
          dispatchAuthEvent('gleaum:auth-error', `파라미터없음|url=${url}`);
        }
      } catch (err) {
        console.error('[NativeApp] 딥링크 처리 오류:', err);
        dispatchAuthEvent('gleaum:auth-error', '알 수 없는 오류가 발생했습니다');
      }
    }

    (async () => {
      const { App } = await import('@capacitor/app');

      async function handleIncomingUrl(url: string) {
        if (url.startsWith('gleaum://auth/')) {
          await handleOAuthCallback(url);
          return;
        }
        const isUniversalLink =
          url.startsWith('https://gleaum.com/') ||
          url.startsWith('https://www.gleaum.com/');
        if (isUniversalLink) {
          try {
            const parsed = new URL(url);
            router.push(parsed.pathname + parsed.search);
          } catch (e) {
            console.warn('[NativeApp] Universal Link 파싱 오류:', url, e);
          }
          return;
        }
        if (url.startsWith('gleaum://')) {
          try {
            const parsed = new URL(url);
            router.push('/' + parsed.hostname + parsed.pathname + parsed.search);
          } catch (e) {
            console.warn('[NativeApp] 커스텀 스킴 파싱 오류:', url, e);
          }
        }
      }

      const launchResult = await App.getLaunchUrl();
      if (launchResult?.url) {
        await handleIncomingUrl(launchResult.url);
      }

      const handle = await App.addListener('appUrlOpen', async ({ url }) => {
        await handleIncomingUrl(url);
      });
      removeUrlListener = () => handle.remove();
    })();

    // ── 4. Android 뒤로가기 버튼 ────────────────────────────────────
    let removeBackButton: (() => void) | undefined;
    onAndroidBackButton(() => {
      if (window.history.length > 1) router.back();
      else router.push('/home');
    }).then((remove) => { removeBackButton = remove; });

    // ── 5. 로그아웃 시 네이티브 LoginActivity 로 전환 ──────────────
    // Supabase SIGNED_OUT → NativeSession.logout() → LoginActivity 표시
    // (웹 /login 페이지가 아닌 네이티브 로그인 화면으로 이동)
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        import('@/lib/native-session')
          .then(({ NativeSession }) => NativeSession.logout())
          .catch(() => {});
      }
    });

    return () => {
      clearTimeout(splashTimer);
      removeUrlListener?.();
      removeBackButton?.();
      subscription.unsubscribe();
    };
  }, [router]);

  return <>{children}</>;
}
