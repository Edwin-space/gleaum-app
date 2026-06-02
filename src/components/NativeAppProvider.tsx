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

function clearOAuthInProgress() {
  try { sessionStorage.removeItem('gleaum_oauth_in_progress'); } catch {}
}

function hasOAuthInProgress(): boolean {
  try { return sessionStorage.getItem('gleaum_oauth_in_progress') === '1'; } catch {}
  return false;
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

async function saveNativeSession(session: {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
}) {
  try {
    const { NativeSession } = await import('@/lib/native-session');
    await NativeSession.saveSession({
      session: JSON.stringify({
        access_token:  session.access_token,
        refresh_token: session.refresh_token,
        expires_in:    session.expires_in ?? 3600,
        expires_at:    session.expires_at ?? (Math.floor(Date.now() / 1000) + 3600),
      }),
    });
  } catch {
    // 웹 브라우저 환경에서는 NativeSession 플러그인이 없으므로 무시한다.
  }
}

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
    // Capacitor 설정의 launchShowDuration(3초)과 맞춘다.
    // iOS에서 너무 빨리 숨기면 WebView /login이 네이티브 LoginVC 전에 잠깐 노출된다.
    const splashTimer = setTimeout(async () => {
      await hideSplash();
    }, 3000);

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
      // iOS에서 Browser.close()를 await하면 사용자가 닫기를 누를 때까지
      // 세션 교환이 지연될 수 있다. 닫기는 fire-and-forget으로 처리한다.
      void closeBrowser();

      try {
        const parsedUrl    = new URL(url);

        // implicit flow: 파라미터가 fragment(#) 뒤에 위치
        // PKCE flow: 파라미터가 query(?) 뒤에 위치
        // 둘 다 지원
        const fragmentParams = new URLSearchParams(
          parsedUrl.hash.startsWith('#') ? parsedUrl.hash.slice(1) : parsedUrl.hash
        );
        const code         = parsedUrl.searchParams.get('code')
                          || fragmentParams.get('code');
        const accessToken  = parsedUrl.searchParams.get('access_token')
                          || fragmentParams.get('access_token');
        const refreshToken = parsedUrl.searchParams.get('refresh_token')
                          || fragmentParams.get('refresh_token');
        const supabase     = createClient();

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            clearOAuthInProgress();
            dispatchAuthEvent('gleaum:auth-error', `PKCE오류|${error.message}|url=${url}`);
          } else if (data.session) {
            // 네이티브 SessionManager 에도 저장 (LoginActivity.onResume() / 다음 앱 실행 확인용)
            await saveNativeSession(data.session);

            clearOAuthInProgress();
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
            clearOAuthInProgress();
            dispatchAuthEvent('gleaum:auth-error', '세션을 가져올 수 없습니다');
          }
        } else if (accessToken) {
          const { data: sessionData, error } = await supabase.auth.setSession({
            access_token:  accessToken,
            refresh_token: refreshToken ?? '',
          });
          if (error) {
            clearOAuthInProgress();
            dispatchAuthEvent('gleaum:auth-error', error.message);
          } else {
            if (sessionData.session) {
              await saveNativeSession(sessionData.session);
            }
            clearOAuthInProgress();
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
          clearOAuthInProgress();
          dispatchAuthEvent('gleaum:auth-error', `파라미터없음|url=${url}`);
        }
      } catch (err) {
        console.error('[NativeApp] 딥링크 처리 오류:', err);
        clearOAuthInProgress();
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

      const urlHandle = await App.addListener('appUrlOpen', async ({ url }) => {
        await handleIncomingUrl(url);
      });

      // iOS SFSafariViewController가 URL 이벤트를 브라우저 dismiss 뒤에 안정적으로
      // 전달하는 케이스가 있어, 앱 재활성화 시 마지막 launch URL을 한 번 더 확인한다.
      const activeHandle = await App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) return;
        if (!hasOAuthInProgress()) return;
        window.setTimeout(() => {
          void App.getLaunchUrl().then((result) => {
            if (result?.url) void handleIncomingUrl(result.url);
          });
        }, 150);
      });

      removeUrlListener = () => {
        urlHandle.remove();
        activeHandle.remove();
      };
    })();

    // ── 4. Android 뒤로가기 버튼 ────────────────────────────────────
    let removeBackButton: (() => void) | undefined;
    onAndroidBackButton(() => {
      if (window.history.length > 1) router.back();
      else router.push('/home');
    }).then((remove) => { removeBackButton = remove; });

    // ── 5. 로그아웃 시 네이티브 로그인 화면으로 전환 ────────────────
    // SIGNED_OUT → NativeSession.logout() 시도
    // 실패(플러그인 미등록) 시 → gleaum://logout 딥링크로 iOS AppDelegate 직접 호출
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        import('@/lib/native-session')
          .then(({ NativeSession }) => NativeSession.logout())
          .catch(() => {
            // iOS 폴백: AppDelegate가 gleaum://logout 을 처리
            try { window.location.href = 'gleaum://logout'; } catch {}
          });
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
