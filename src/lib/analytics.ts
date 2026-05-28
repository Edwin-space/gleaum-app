/**
 * 글리움 통합 Analytics 유틸리티
 *
 * ▸ 네이티브 앱 (iOS / Android):
 *     @capacitor-firebase/analytics → Firebase Analytics SDK → GA4 연동
 * ▸ 웹 브라우저:
 *     window.gtag → GA4 Measurement Protocol
 *
 * ── 이벤트 카테고리 ─────────────────────────────────────────
 * [퍼널]     login / sign_up / onboarding_complete
 * [일정]     schedule_create / schedule_view / schedule_complete
 *            schedule_edit / schedule_delete
 * [가계부]   budget_entry_add / budget_view
 * [Space]   space_create / space_join / space_invite_send
 * [알림]     notification_view / notification_click / fcm_permission_grant
 * [PWA]     pwa_banner_show / pwa_install_accept / pwa_install_dismiss / pwa_installed
 * [UI]      calendar_toggle / quick_action_click / navigation_click
 * ────────────────────────────────────────────────────────────
 */

import { isNativeApp } from '@/lib/native';

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config?: Record<string, any>
    ) => void;
    dataLayer: unknown[];
  }
}

// ── 이벤트 파라미터 타입 정의 ──────────────────────────────────

export type GleaumEventParams = {
  // 퍼널
  login:                { method: 'google' | 'email' };
  sign_up:              { method: 'google' | 'email' };
  onboarding_complete:  { goal: string; space_intent: string; space_setup?: string };

  // 일정
  schedule_create: {
    schedule_type: 'shared' | 'personal' | 'child' | 'expense';
    has_participants: boolean;
    has_reminder: boolean;
    has_repeat: boolean;
    has_expense: boolean;
  };
  schedule_view:     { schedule_type: string; status: string };
  schedule_complete: { schedule_type: string };
  schedule_edit:     { schedule_type: string };
  schedule_delete:   { schedule_type: string };

  // 가계부
  budget_entry_add: { category: string; payment_method: string };
  budget_view:      Record<string, never>;

  // Space / 가족
  space_create:      { space_intent: string };
  space_join:        Record<string, never>;
  space_invite_send: Record<string, never>;

  // 알림
  notification_view:    Record<string, never>;
  notification_click:   { notification_type: string };
  fcm_permission_grant: Record<string, never>;

  // PWA
  pwa_banner_show:    { platform: 'ios' | 'android' };
  pwa_install_accept: { platform: 'ios' | 'android' };
  pwa_install_dismiss:{ platform: 'ios' | 'android' };
  pwa_installed:      { platform: 'ios' | 'android' };

  // UI
  calendar_toggle:    { action: 'open' | 'close' };
  quick_action_click: { action: string };
  navigation_click:   { destination: string };
};

// ── GA4 핵심 전환 이벤트 목록 (Key Event 등록 권장) ───────────
export const KEY_EVENTS: (keyof GleaumEventParams)[] = [
  'login',
  'sign_up',
  'onboarding_complete',
  'schedule_create',
  'space_create',
  'space_join',
  'pwa_installed',
];

// ── GA4 Measurement ID ────────────────────────────────────────
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

// ─────────────────────────────────────────────────────────────
//  내부 헬퍼
// ─────────────────────────────────────────────────────────────

/** params 객체를 Firebase Analytics용 파라미터 배열로 변환 */
function toFirebaseParams(
  params: Record<string, unknown>
): Array<{ key: string; value: string }> {
  return Object.entries(params).map(([key, value]) => ({
    key,
    value: String(value),
  }));
}

// ─────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────

/**
 * 화면(스크린) 추적 — 네이티브 앱 전용
 * SPA 라우트 전환 시 호출해 Firebase Analytics에 screen_view 이벤트 전송
 */
export async function trackScreen(screenName: string): Promise<void> {
  if (typeof window === 'undefined') return;

  if (isNativeApp()) {
    try {
      const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
      await FirebaseAnalytics.setCurrentScreen({ screenName });
    } catch (err) {
      console.warn('[Analytics] trackScreen 실패:', err);
    }
    return;
  }

  // 웹: gtag page_view
  if (GA_ID && window.gtag) {
    window.gtag('event', 'screen_view', {
      firebase_screen: screenName,
      firebase_screen_class: screenName,
    });
  }
}

/**
 * 페이지뷰 수동 전송 (웹 SPA 라우트 전환 시 호출)
 * 네이티브에서는 trackScreen 을 사용하세요.
 */
export function trackPageView(url: string): void {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', GA_ID, { page_path: url });
}

/**
 * 커스텀 이벤트 트래킹 — 네이티브 / 웹 통합
 */
export async function trackEvent<K extends keyof GleaumEventParams>(
  event: K,
  params: GleaumEventParams[K]
): Promise<void> {
  if (typeof window === 'undefined') return;

  const paramObj = params as Record<string, unknown>;

  // ── 네이티브 앱: Firebase Analytics SDK ──────────────────────
  if (isNativeApp()) {
    try {
      const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
      await FirebaseAnalytics.logEvent({
        name: event,
        params: toFirebaseParams(paramObj),
      });
    } catch (err) {
      console.warn('[Analytics] logEvent 실패:', event, err);
    }
    return;
  }

  // ── 웹 브라우저: GA4 gtag ─────────────────────────────────────
  if (GA_ID && window.gtag) {
    window.gtag('event', event, paramObj);
  }
}

/**
 * Firebase Analytics 사용자 ID 설정 (로그인 후 호출)
 * 네이티브: FirebaseAnalytics.setUserId
 * 웹: gtag set user_id
 */
export async function setAnalyticsUserId(userId: string | null): Promise<void> {
  if (typeof window === 'undefined') return;

  if (isNativeApp()) {
    try {
      const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
      await FirebaseAnalytics.setUserId({ userId: userId ?? '' });
    } catch (err) {
      console.warn('[Analytics] setUserId 실패:', err);
    }
    return;
  }

  if (GA_ID && window.gtag) {
    window.gtag('set', 'user_id', { user_id: userId ?? undefined });
  }
}

/**
 * Firebase Analytics 사용자 속성 설정
 * 예: setUserProperty('subscription_type', 'premium')
 */
export async function setUserProperty(name: string, value: string): Promise<void> {
  if (typeof window === 'undefined') return;

  if (isNativeApp()) {
    try {
      const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
      await FirebaseAnalytics.setUserProperty({ key: name, value });
    } catch (err) {
      console.warn('[Analytics] setUserProperty 실패:', err);
    }
    return;
  }

  if (GA_ID && window.gtag) {
    window.gtag('set', 'user_properties', { [name]: value });
  }
}
