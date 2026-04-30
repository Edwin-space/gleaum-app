'use client';

import { cn } from '@/lib/utils';
import type { ScheduleStatus, ScheduleType } from '@/types';
import { SCHEDULE_STATUS_LABELS, SCHEDULE_TYPE_LABELS } from '@/types';

interface StatusBadgeProps {
  status: ScheduleStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles: Record<ScheduleStatus, { bg: string; text: string }> = {
    pending:     { bg: 'var(--color-status-pending)',  text: '#fff' },
    in_progress: { bg: 'var(--color-status-progress)', text: '#fff' },
    completed:   { bg: 'var(--color-status-done)',     text: 'var(--brand-black)' },
    missed:      { bg: 'var(--color-status-missed)',   text: '#fff' },
  };

  const icons: Record<ScheduleStatus, string> = {
    pending:     '⏳',
    in_progress: '▶',
    completed:   '✓',
    missed:      '!',
  };

  const { bg, text } = styles[status];

  return (
    <span
      className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold', className)}
      style={{ background: bg, color: text }}
    >
      <span>{icons[status]}</span>
      {SCHEDULE_STATUS_LABELS[status]}
    </span>
  );
}

interface TypeBadgeProps {
  type: ScheduleType;
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const colors: Record<ScheduleType, { bg: string; text: string }> = {
    shared:   { bg: 'rgba(0,132,204,0.12)',   text: 'var(--color-schedule-shared)' },
    personal: { bg: 'rgba(12,201,181,0.12)',  text: 'var(--color-schedule-personal)' },
    child:    { bg: 'rgba(46,232,149,0.15)',  text: '#0A9E5C' },
    expense:  { bg: 'rgba(245,158,11,0.12)', text: '#B45309' },
  };

  const { bg, text } = colors[type];

  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold', className)}
      style={{ background: bg, color: text }}
    >
      {SCHEDULE_TYPE_LABELS[type]}
    </span>
  );
}
