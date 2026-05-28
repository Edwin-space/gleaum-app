'use client';

/**
 * 글리움 — Firebase 서비스 통합 초기화 Provider
 *
 * 앱 마운트 시 Firebase 기능들을 순차적으로 초기화합니다:
 *   1. App Check  — 앱 무결성 검증 (모든 Firebase 호출 보호)
 *   2. Remote Config — 기능 플래그 및 서버 설정값 로드
 *   3. Crashlytics — 로그인 사용자 ID 연결 (네이티브 전용)
 *
 * Performance Monitoring은 별도 초기화 없이 SDK가 자동 수집합니다.
 * withTrace() / startTrace() 헬퍼로 커스텀 트레이스만 추가하세요.
 *
 * RootLayout의 NativeAppProvider 안쪽에 배치되어야 합니다.
 */

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { initAppCheck } from '@/lib/app-check';
import { initRemoteConfig } from '@/lib/remote-config';
import { setUserId, setCrashlyticsEnabled } from '@/lib/crashlytics';
import { setAnalyticsUserId } from '@/lib/analytics';

export function FirebaseServicesProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // ── 1. App Check 초기화 (최우선 — Firebase 호출 전에 완료되어야 함) ──
    void initAppCheck();

    // ── 2. Remote Config 초기화 (기능 플래그 로드) ──
    void initRemoteConfig();

    // ── 3. Crashlytics 사용자 ID 연동 ──
    // 로그인 상태 변화를 감지하여 Crashlytics에 사용자 ID를 연결/해제합니다.
    // 크래시 보고서에서 특정 사용자의 이슈를 추적할 수 있습니다.
    const supabase = createClient();

    // 현재 세션 확인 (앱 재시작 시 이미 로그인된 경우 처리)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        void setUserId(session.user.id);
        void setCrashlyticsEnabled(true);
        void setAnalyticsUserId(session.user.id);
      }
    });

    // 세션 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.id) {
        void setUserId(session.user.id);
        void setCrashlyticsEnabled(true);
        void setAnalyticsUserId(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        // 로그아웃 시 Crashlytics 수집 비활성화 (개인정보 보호)
        void setCrashlyticsEnabled(false);
        void setAnalyticsUserId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
