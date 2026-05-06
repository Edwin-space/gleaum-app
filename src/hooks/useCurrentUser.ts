'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ensureUserSetup, type ProfileRow } from '@/lib/db';
import type { User } from '@/types';

// ── [전역 캐시] 앱 실행 동안 유지되는 싱글톤 사용자 데이터 ──
let cachedProfile: ProfileRow | null = null;
let isFirstLoad = true;

export interface CurrentUserState {
  user: User | null;
  profile: ProfileRow | null;
  familyGroupId: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useCurrentUser(): CurrentUserState {
  const [profile, setProfile] = useState<ProfileRow | null>(cachedProfile);
  const [loading, setLoading]   = useState(isFirstLoad && !cachedProfile);

  const load = useCallback(async (force = false) => {
    // 이미 데이터가 있고 강제 새로고침이 아니면 즉시 종료 (속도 최적화)
    if (!force && cachedProfile) {
      setProfile(cachedProfile);
      setLoading(false);
      return;
    }

    if (force) setLoading(true);

    try {
      // getSession으로 로컬 세션 먼저 확인 (getUser보다 훨씬 빠름)
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        cachedProfile = null;
        setProfile(null);
        return;
      }

      // 실제 데이터 싱크 (서버 통신)
      const p = await ensureUserSetup();
      cachedProfile = p;
      setProfile(p);
    } catch (e) {
      console.error('useCurrentUser 오류:', e);
    } finally {
      setLoading(false);
      isFirstLoad = false;
    }
  }, []);

  useEffect(() => {
    // 초기 로드
    void load();

    // 세션 변경 시(로그인/로그아웃) 캐시 무효화 및 재로드
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        cachedProfile = null;
        setProfile(null);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        void load(true); // 중요한 변경 시에만 서버 데이터 강제 동기화
      }
    });

    return () => subscription.unsubscribe();
  }, [load]);

  const user: User | null = profile
    ? {
        id:            profile.id,
        name:          profile.display_name ?? profile.name ?? '사용자',
        displayName:   profile.display_name ?? profile.name ?? undefined,
        realName:      profile.real_name ?? undefined,
        nameDisplayMode: profile.name_display_mode ?? 'nickname',
        email:         profile.email ?? '',
        avatar:        profile.avatar ?? '👤',
        role:          profile.role,
        familyGroupId: profile.family_group_id ?? undefined,
        googleId:      profile.google_id ?? undefined,
      }
    : null;

  return {
    user,
    profile,
    familyGroupId: profile?.family_group_id ?? null,
    loading,
    refresh: () => load(true),
  };
}

