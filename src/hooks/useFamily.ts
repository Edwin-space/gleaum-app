'use client';

/**
 * @deprecated useSpace 를 사용하세요.
 * 하위 호환을 위해 유지됩니다.
 */

import { useSpace } from './useSpace';
import type { FamilyGroup } from '@/types';

export interface FamilyState {
  group: FamilyGroup | null;
  members: FamilyGroup['members'];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useFamily(familyGroupId: string | null): FamilyState {
  const { space, loading, refresh } = useSpace(familyGroupId);

  const group: FamilyGroup | null = space
    ? {
        id:         space.id,
        name:       space.name,
        members:    space.members.map((m) => m.user!).filter(Boolean),
        inviteCode: space.inviteCode,
        createdBy:  space.createdBy,
        createdAt:  space.createdAt,
      }
    : null;

  return {
    group,
    members: group?.members ?? [],
    loading,
    refresh,
  };
}
