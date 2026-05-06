'use client';

import { useEffect, useState, useCallback } from 'react';
import { getFamilyWithMembers, type ProfileRow, type FamilyGroupRow } from '@/lib/db';
import type { User, FamilyGroup as Space } from '@/types';

export interface SpaceState {
  space: Space | null;
  members: User[];
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * 특정 스페이스(공간)의 정보와 멤버 목록을 관리하는 훅
 */
export function useSpace(spaceId: string | null): SpaceState {
  const [space, setSpace]     = useState<Space | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!spaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // NOTE: DB 함수명은 점진적 교체를 위해 우선 유지
      const result = await getFamilyWithMembers(spaceId);
      if (result) {
        setSpace(rowsToSpace(result.group, result.members));
        setMembers(result.members.map(rowToUser));
      }
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return { space, members, loading, refresh: load };
}

function rowToUser(row: ProfileRow): User {
  return {
    id:            row.id,
    name:          row.name ?? '이름 없음',
    email:         row.email ?? '',
    avatar:        row.avatar ?? '👤',
    role:          row.role,
    familyGroupId: row.family_group_id ?? undefined,
  };
}

function rowsToSpace(group: FamilyGroupRow, members: ProfileRow[]): Space {
  return {
    id:         group.id,
    name:       group.name,
    members:    members.map(rowToUser),
    inviteCode: group.invite_code ?? undefined,
    createdBy:  group.created_by,
    createdAt:  new Date(group.created_at),
  };
}
