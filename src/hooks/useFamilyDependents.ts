'use client';

import { useCallback, useEffect, useState } from 'react';
import { getFamilyDependents } from '@/lib/db';
import type { FamilyDependent } from '@/types';

export function useFamilyDependents(spaceId: string | null) {
  const [dependents, setDependents] = useState<FamilyDependent[]>([]);
  const [loading, setLoading] = useState(Boolean(spaceId));

  const refresh = useCallback(async () => {
    if (!spaceId) {
      setDependents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setDependents(await getFamilyDependents(spaceId));
    } catch {
      setDependents([]);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  return { dependents, loading, refresh };
}
