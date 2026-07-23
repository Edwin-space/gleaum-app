'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ensureUserSetup, resetAutoCreateFlag, type ProfileRow } from '@/lib/db';
import type { User } from '@/types';

// ── [전역 캐시] 앱 실행 동안 유지되는 싱글톤 사용자 데이터 ──
let cachedProfile: ProfileRow | null = null;
let isFirstLoad = true;

async function getCookieSessionProfile(): Promise<ProfileRow | null> {
  const response = await fetch('/api/session/profile', {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`session_profile_${response.status}`);

  const payload = await response.json() as { profile?: ProfileRow | null };
  return payload.profile ?? null;
}

export interface CurrentUserState {
  user: User | null;
  profile: ProfileRow | null;
  /** @deprecated Use spaceId instead */
  familyGroupId: string | null;
  spaceId: string | null;
  /** 자동 생성된 개인 전용 공간 ID */
  personalSpaceId: string | null;
  /** 현재 주 소속 공간이 공유 공간일 때의 ID */
  sharedSpaceId: string | null;
  /**
   * 공유 공간 여부 — 자동 생성된 개인 공간(personalSpaceId)이 아닌
   * 명시적으로 만들거나 참여한 공간이 있을 때 true.
   * 가계부 "공간 지출" 탭 활성화 여부 등에 사용.
   */
  hasSharedSpace: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useCurrentUser(): CurrentUserState {
  const [profile, setProfile] = useState<ProfileRow | null>(cachedProfile);
  const [loading, setLoading]   = useState(isFirstLoad && !cachedProfile);

  const load = useCallback(async (force = false) => {
    // 캐시가 있고 공간도 있으면 즉시 반환 (속도 최적화)
    // family_group_id 가 null 이거나 온보딩 완료 후 개인 공간 ID가 없으면 서버 재조회 필요
    const cachedPrefs = cachedProfile?.preferences as { personalSpaceId?: string } | null | undefined;
    const cacheNeedsPersonalSpace = !!cachedProfile?.onboarding_completed_at && !cachedPrefs?.personalSpaceId;
    const cacheValid = !force && !!cachedProfile && !!cachedProfile.family_group_id && !cacheNeedsPersonalSpace;
    if (cacheValid) {
      setProfile(cachedProfile);
      setLoading(false);
      return;
    }

    // null 공간 상태로 캐시되어 있으면 재시도 허용 (플래그 초기화)
    if (!force && cachedProfile && !cachedProfile.family_group_id) {
      resetAutoCreateFlag();
    }

    if (force || !cachedProfile || !cachedProfile.family_group_id) setLoading(true);

    try {
      // getSession으로 로컬 세션 먼저 확인 (getUser보다 훨씬 빠름)
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      // SSR OAuth 직후에는 서버 Cookie 세션이 유효해도 브라우저 SDK의
      // 세션 또는 Data API 프로필 복원이 늦을 수 있다. 둘 중 하나라도
      // 비어 있으면 Cookie 세션 API로 폴백한다.
      const browserProfile = session ? await ensureUserSetup() : null;
      const p = browserProfile ?? await getCookieSessionProfile();
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
    const initialLoad = window.setTimeout(() => void load(), 0);

    // 세션 변경 시(로그인/로그아웃) 캐시 무효화 및 재로드
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        cachedProfile = null;
        setProfile(null);
      } else if (event === 'SIGNED_IN') {
        // 로그인 시 공간 자동 생성 플래그를 초기화하여 재시도 허용
        resetAutoCreateFlag();
        void load(true);
      }
    });

    return () => {
      window.clearTimeout(initialLoad);
      subscription.unsubscribe();
    };
  }, [load]);

  const user: User | null = useMemo(() => (
    profile ? {
      id:            profile.id,
      name:          profile.display_name ?? profile.name ?? '사용자',
      displayName:   profile.display_name ?? profile.name ?? undefined,
      realName:      profile.real_name ?? undefined,
      nameDisplayMode: profile.name_display_mode ?? 'nickname',
      email:         profile.email ?? '',
      avatar:        profile.avatar ?? '👤',
      familyGroupId: profile.family_group_id ?? undefined,
      spaceId:       profile.family_group_id ?? undefined,
      googleId:      profile.google_id ?? undefined,
    } : null
  ), [profile]);

  const spaceId = profile?.family_group_id ?? null;

  // preferences.personalSpaceId 와 비교: 다르면 공유 공간을 갖고 있는 것
  const personalSpaceId = (profile?.preferences as { personalSpaceId?: string } | null)?.personalSpaceId ?? null;
  const hasSharedSpace = !!spaceId && spaceId !== personalSpaceId;
  const sharedSpaceId = hasSharedSpace ? spaceId : null;

  return {
    user,
    profile,
    spaceId,
    familyGroupId: spaceId,
    personalSpaceId,
    sharedSpaceId,
    hasSharedSpace,
    loading,
    refresh: () => load(true),
  };
}
