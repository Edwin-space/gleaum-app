'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getSpaceWithMembers } from '@/lib/db';
import type { Space, SpaceMember, User } from '@/types';

export interface SpaceState {
  space:       Space | null;
  members:     SpaceMember[];
  /** @deprecated 하위 호환용. 새 코드에서는 members(SpaceMember[]) 사용 권장 */
  memberUsers: User[];
  loading:     boolean;
  refresh:     () => Promise<void>;
}

/**
 * 특정 공간(Space)의 정보와 멤버 목록을 관리하는 훅
 */
export function useSpace(spaceId: string | null): SpaceState {
  const [space,   setSpace]   = useState<Space | null>(null);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!spaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await getSpaceWithMembers(spaceId);
      if (result) {
        setSpace(result);
        setMembers(result.members);
      }
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

  return { space, members, memberUsers, loading, refresh: load };
}
