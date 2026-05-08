'use client';

/**
 * NativeAppProvider
 *
 * 앱 마운트 시 네이티브 초기화 작업:
 * 1. 스플래시 스크린 숨기기
 * 2. 상태바 스타일 설정
 * 3. Android 뒤로가기 버튼 처리
 * 4. gleaum:// 딥링크 수신 → OAuth 콜백 처리 (핵심)
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

    // 3. 딥링크 리스너 — gleaum://auth/callback 처리
    //    Google OAuth 완료 후 Supabase가 gleaum://auth/callback?code=xxx 로 리다이렉트
    let removeUrlListener: (() => void) | undefined;

    (async () => {
      const { App } = await import('@capacitor/app');

      const handle = await App.addListener('appUrlOpen', async ({ url }) => {
        console.log('[NativeApp] Deep link received:', url);

        if (!url.startsWith('gleaum://')) return;

        // 인앱 브라우저 닫기
        await closeBrowser();

        try {
          const parsedUrl = new URL(url);
          const code = parsedUrl.searchParams.get('code');
          const accessToken = parsedUrl.searchParams.get('access_token');
          const refreshToken = parsedUrl.searchParams.get('refresh_token');

          const supabase = createClient();

          if (code) {
            // PKCE 방식: code → session 교환
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('[NativeApp] 세션 교환 오류:', error.message);
            } else if (data.session) {
              console.log('[NativeApp] 로그인 성공 (PKCE)');
              router.replace('/home');
            }
          } else if (accessToken) {
            // Implicit 방식: 토큰 직접 설정 (fallback)
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken ?? '',
            });
            if (error) {
              console.error('[NativeApp] 세션 설정 오류:', error.message);
            } else {
              console.log('[NativeApp] 로그인 성공 (Implicit)');
              router.replace('/home');
            }
          }
        } catch (err) {
          console.error('[NativeApp] 딥링크 처리 오류:', err);
        }
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
