'use client';

import { useEffect, useState, useCallback } from 'react';
import { getFamilyWithMembers, type ProfileRow, type FamilyGroupRow } from '@/lib/db';
import type { User, FamilyGroup } from '@/types';

export interface FamilyState {
  group: FamilyGroup | null;
  members: User[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useFamily(familyGroupId: string | null): FamilyState {
  const [group, setGroup]     = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!familyGroupId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await getFamilyWithMembers(familyGroupId);
      if (result) {
        setGroup(rowsToFamilyGroup(result.group, result.members));
        setMembers(result.members.map(rowToUser));
      }
    } finally {
      setLoading(false);
    }
  }, [familyGroupId]);

  useEffect(() => {
    load();
  }, [load]);

  return { group, members, loading, refresh: load };
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

function rowsToFamilyGroup(group: FamilyGroupRow, members: ProfileRow[]): FamilyGroup {
  return {
    id:         group.id,
    name:       group.name,
    members:    members.map(rowToUser),
    inviteCode: group.invite_code ?? undefined,
    createdBy:  group.created_by,
    createdAt:  new Date(group.created_at),
  };
}
