'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getSpaceWithMembers, getMyRoleInSpace } from '@/lib/db';
import type { Space, SpaceMember, User, SpaceRole } from '@/types';

export interface SpaceState {
  space:       Space | null;
  members:     SpaceMember[];
  /** @deprecated 하위 호환용. 새 코드에서는 members(SpaceMember[]) 사용 권장 */
  memberUsers: User[];
  /** 현재 로그인 사용자의 공간 내 역할 */
  myRole:      SpaceRole | null;
  loading:     boolean;
  refresh:     () => Promise<void>;
}

/**
 * 특정 공간(Space)의 정보와 멤버 목록을 관리하는 훅
 */
export function useSpace(spaceId: string | null): SpaceState {
  const [space,   setSpace]   = useState<Space | null>(null);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [myRole,  setMyRole]  = useState<SpaceRole | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!spaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [result, role] = await Promise.all([
        getSpaceWithMembers(spaceId),
        getMyRoleInSpace(spaceId),
      ]);
      if (result) {
        setSpace(result);
        setMembers(result.members);
      }
      setMyRole(role);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const memberUsers = useMemo<User[]>(
    () => members.map((m) => m.user).filter((u): u is User => !!u),
    [members],
  );

  return { space, members, memberUsers, myRole, loading, refresh: load };
}
