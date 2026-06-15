'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getLedgerEntries,
  createLedgerEntry,
  updateLedgerEntry,
  updateLedgerStatus,
  deleteLedgerEntry,
  type CreateLedgerInput,
} from '@/lib/db';
import type { LedgerEntry, LedgerStatus, LedgerScope } from '@/types';

export interface LedgerState {
  entries: LedgerEntry[];
  loading: boolean;
  refresh: () => Promise<void>;
  create: (input: CreateLedgerInput) => Promise<LedgerEntry | null>;
  update: (id: string, updates: Partial<CreateLedgerInput>) => Promise<boolean>;
  setStatus: (id: string, status: LedgerStatus) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/**
 * 가계부 원장 훅 — 특정 공간(scope)의 수입·지출 항목을 관리.
 * scope='personal' → 개인 가계부, scope='space' → 공간 공동 수입/지출.
 */
export function useLedger(spaceId: string | null, scope: LedgerScope): LedgerState {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!spaceId) { setEntries([]); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getLedgerEntries(spaceId);
      setEntries(data.filter((e) => e.scope === scope));
    } finally {
      setLoading(false);
    }
  }, [spaceId, scope]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const create = useCallback(async (input: CreateLedgerInput): Promise<LedgerEntry | null> => {
    const entry = await createLedgerEntry(input);
    if (entry) setEntries((prev) => [...prev, entry].sort((a, b) => +a.occurredAt - +b.occurredAt));
    return entry;
  }, []);

  const update = useCallback(async (id: string, updates: Partial<CreateLedgerInput>): Promise<boolean> => {
    const ok = await updateLedgerEntry(id, updates);
    if (ok) {
      setEntries((prev) => prev.map((e) => {
        if (e.id !== id) return e;
        return {
          ...e,
          ...(updates.title      !== undefined && { title:      updates.title }),
          ...(updates.amount     !== undefined && { amount:     updates.amount }),
          ...(updates.category   !== undefined && { category:   updates.category }),
          ...(updates.method     !== undefined && { method:     updates.method }),
          ...(updates.occurredAt !== undefined && { occurredAt: updates.occurredAt }),
          ...(updates.status     !== undefined && { status:     updates.status }),
          ...(updates.recurFreq  !== undefined && { recurFreq:  updates.recurFreq }),
        };
      }));
    }
    return ok;
  }, []);

  const setStatus = useCallback(async (id: string, status: LedgerStatus) => {
    await updateLedgerStatus(id, status);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteLedgerEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, loading, refresh: load, create, update, setStatus, remove };
}
