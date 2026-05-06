'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getSchedules,
  createSchedule,
  updateScheduleStatus,
  deleteSchedule,
  type CreateScheduleInput,
} from '@/lib/db';
import type { Schedule, ScheduleStatus } from '@/types';

export interface SchedulesState {
  schedules: Schedule[];
  loading: boolean;
  refresh: () => Promise<void>;
  create:  (input: CreateScheduleInput) => Promise<Schedule | null>;
  updateStatus: (id: string, status: ScheduleStatus) => Promise<void>;
  remove:  (id: string) => Promise<void>;
}

export function useSchedules(familyGroupId: string | null): SchedulesState {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    if (!familyGroupId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getSchedules(familyGroupId);
      setSchedules(data);
    } finally {
      setLoading(false);
    }
  }, [familyGroupId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const create = useCallback(async (input: CreateScheduleInput): Promise<Schedule | null> => {
    if (!familyGroupId) return null;
    const schedule = await createSchedule(familyGroupId, input);
    if (schedule) setSchedules((prev) => [...prev, schedule].sort((a, b) => +a.startTime - +b.startTime));
    return schedule;
  }, [familyGroupId]);

  const updateStatus = useCallback(async (id: string, status: ScheduleStatus) => {
    await updateScheduleStatus(id, status);
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteSchedule(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { schedules, loading, refresh: load, create, updateStatus, remove };
}
