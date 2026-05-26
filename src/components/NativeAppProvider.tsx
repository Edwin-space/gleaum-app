'use client';

/**
 * NativeAppProvider
 *
 * 앱 마운트 시 네이티브 초기화 작업:
 * 1. 스플래시 스크린 숨기기
 * 2. 상태바 스타일 설정
 * 3. Android 뒤로가기 버튼 처리
 * 4. gleaum:// 딥링크 수신 → OAuth 콜백 처리 (핵심)
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
 * OAuth 콜백 URL 수신 즉시 알림 — 로그인 페이지의 browserFinished 타임아웃을 취소시켜
 * exchangeCodeForSession 완료 전에 리스너가 제거되는 타이밍 버그를 방지.
 */
function dispatchAuthProcessing() {
  window.dispatchEvent(new CustomEvent('gleaum:auth-processing'));
}

export function NativeAppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;

    // 1. 스플래시 숨기기
    const splashTimer = setTimeout(async () => {
      await hideSplash();
    }, 300);

    // 2. 상태바 설정
    setStatusBarDark();

    // 3. 딥링크 처리 — gleaum://auth/callback (OAuth 콜백)
    //
    // ⚠️ 두 가지 진입 경로를 모두 처리해야 함:
    //   A) appUrlOpen  — 앱이 이미 실행 중일 때 딥링크 수신 (가장 일반적)
    //   B) getLaunchUrl — Android가 앱 프로세스를 종료한 뒤 딥링크로 재시작될 때
    //      (Chrome Custom Tab 사용 중 메모리 부족 등으로 앱이 kill된 경우)
    //      → 이 경로를 누락하면 OAuth code가 유실되어 로그인 화면으로 돌아옴
    //
    // ⚠️ 콜드 스타트 이중 처리 방지:
    //   일부 Android 기기에서는 getLaunchUrl AND appUrlOpen이 동일 URL로 모두 발화됨.
    //   code를 두 번 교환하면 두 번째 교환이 "code already used" 오류를 반환하여
    //   gleaum:auth-error가 발생 → 로그인 화면으로 돌아가는 버그 발생.
    //   lastProcessedUrl로 중복 처리를 차단.
    let removeUrlListener: (() => void) | undefined;
    let lastProcessedUrl: string | null = null;

    // OAuth 콜백 URL 처리 공통 함수
    async function handleOAuthCallback(url: string) {
      // 중복 처리 방지: 동일 URL은 한 번만 처리
      if (lastProcessedUrl === url) {
        console.log('[NativeApp] 이미 처리된 URL, 건너뜀:', url);
        return;
      }
      lastProcessedUrl = url;
      console.log('[NativeApp] OAuth 콜백 처리:', url);

      // 로그인 페이지에 "처리 중" 알림 → browserFinished 타임아웃 취소
      dispatchAuthProcessing();

      // 인앱 브라우저 닫기 (이미 닫혀 있어도 안전하게 호출 가능)
      await closeBrowser();

      try {
        const parsedUrl = new URL(url);
        const code        = parsedUrl.searchParams.get('code');
        const accessToken = parsedUrl.searchParams.get('access_token');
        const refreshToken = parsedUrl.searchParams.get('refresh_token');

        const supabase = createClient();

        if (code) {
          // PKCE 방식: code → session 교환
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('[NativeApp] 세션 교환 오류:', error.message);
            dispatchAuthEvent('gleaum:auth-error', error.message);
          } else if (data.session) {
            console.log('[NativeApp] 로그인 성공 (PKCE)');
            dispatchAuthEvent('gleaum:auth-success');
            router.replace('/home');
          } else {
            dispatchAuthEvent('gleaum:auth-error', '세션을 가져올 수 없습니다');
          }
        } else if (accessToken) {
          // Implicit 방식: 토큰 직접 설정 (fallback)
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? '',
          });
          if (error) {
            console.error('[NativeApp] 세션 설정 오류:', error.message);
            dispatchAuthEvent('gleaum:auth-error', error.message);
          } else {
            console.log('[NativeApp] 로그인 성공 (Implicit)');
            dispatchAuthEvent('gleaum:auth-success');
            router.replace('/home');
          }
        } else {
          console.warn('[NativeApp] 콜백 URL에 인증 파라미터 없음:', url);
          dispatchAuthEvent('gleaum:auth-error', '인증 정보를 받지 못했습니다');
        }
      } catch (err) {
        console.error('[NativeApp] 딥링크 처리 오류:', err);
        dispatchAuthEvent('gleaum:auth-error', '알 수 없는 오류가 발생했습니다');
      }
    }

    (async () => {
      const { App } = await import('@capacitor/app');

      // ── 경로 B: getLaunchUrl ──────────────────────────────────────────────
      // 앱이 gleaum:// 딥링크로 콜드 스타트된 경우 (프로세스가 종료됐다 재시작)
      const launchResult = await App.getLaunchUrl();
      if (launchResult?.url?.startsWith('gleaum://auth/')) {
        console.log('[NativeApp] 콜드 스타트 딥링크:', launchResult.url);
        await handleOAuthCallback(launchResult.url);
      }

      // ── 경로 A: appUrlOpen ───────────────────────────────────────────────
      // 앱이 이미 실행 중일 때 딥링크 수신
      const handle = await App.addListener('appUrlOpen', async ({ url }) => {
        if (!url.startsWith('gleaum://')) return;
        await handleOAuthCallback(url);
      });

      removeUrlListener = () => handle.remove();
    })();

    // 4. Android 뒤로가기 버튼
    let removeBackButton: (() => void) | undefined;
    onAndroidBackButton(() => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/home');
      }
    }).then((remove) => {
      removeBackButton = remove;
    });

    return () => {
      clearTimeout(splashTimer);
      removeUrlListener?.();
      removeBackButton?.();
    };
  }, [router]);

  return <>{children}</>;
}
