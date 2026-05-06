'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ensureUserSetup, type ProfileRow } from '@/lib/db';
import type { User } from '@/types';

export interface CurrentUserState {
  user: User | null;
  profile: ProfileRow | null;
  familyGroupId: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useCurrentUser(): CurrentUserState {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await ensureUserSetup();
      setProfile(p);
    } catch (e) {
      console.error('useCurrentUser 오류:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);

    // 세션 변경 시 재로드
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
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
    refresh: load,
  };
}
