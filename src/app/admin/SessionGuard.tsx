'use client';

/**
 * SessionGuard — 백오피스 비활성 세션 타임아웃
 *
 * - 마지막 활동 시각을 localStorage에 기록
 * - TIMEOUT_MS 동안 아무 활동 없으면 자동 로그아웃
 * - 활동 감지: mousemove, keydown, click, touchstart, scroll
 */

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

const TIMEOUT_MS  = 30 * 60 * 1000; // 30분
const STORAGE_KEY = 'gleaum_admin_last_active';
const CHECK_INTERVAL_MS = 60 * 1000; // 1분마다 체크

export function SessionGuard() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // 마지막 활동 시각 갱신
    const updateActivity = () => {
      try { localStorage.setItem(STORAGE_KEY, Date.now().toString()); } catch {}
    };

    // 세션 만료 체크 + 로그아웃
    const checkExpiry = async () => {
      try {
        const last = Number(localStorage.getItem(STORAGE_KEY) ?? '0');
        if (last && Date.now() - last > TIMEOUT_MS) {
          const supabase = createClient();
          await supabase.auth.signOut();
          window.location.href = '/login?next=/admin/ads';
        }
      } catch {}
    };

    // 초기 활동 시각 기록
    updateActivity();

    // 활동 이벤트 리스너
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'] as const;
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }));

    // 주기적 만료 체크
    timerRef.current = setInterval(() => { void checkExpiry(); }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return null; // UI 없음
}
