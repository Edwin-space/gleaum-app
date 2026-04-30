'use client';

import { cn } from '@/lib/utils';
import { type HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'parchment' | 'gradient-border';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', className, children, ...props }, ref) => {
    const variants = {
      default:          'bg-white border border-[var(--color-hairline)]',
      dark:             'bg-[var(--color-surface-dark)] text-white',
      parchment:        'bg-[var(--color-canvas-parchment)] border border-[var(--color-hairline)]',
      'gradient-border': 'bg-white border border-transparent',
    };

    const paddings = {
      none: '',
      sm:   'p-3',
      md:   'p-4',
      lg:   'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-2xl overflow-hidden', variants[variant], paddings[padding], className)}
        style={variant === 'gradient-border' ? {
          backgroundClip: 'padding-box',
          boxShadow: '0 0 0 1px rgba(46,232,149,0.3)',
        } : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// ── 일정 카드 ──
import type { Schedule } from '@/types';
import { SCHEDULE_TYPE_LABELS, SCHEDULE_STATUS_LABELS } from '@/types';
import { formatTime, getScheduleTypeColor } from '@/lib/utils';
import { StatusBadge } from './Badge';

interface ScheduleCardProps {
  schedule: Schedule;
  onClick?: () => void;
  compact?: boolean;
}

export function ScheduleCard({ schedule, onClick, compact = false }: ScheduleCardProps) {
  const typeColor = getScheduleTypeColor(schedule.type);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden flex cursor-pointer active:scale-[0.98] transition-transform"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      {/* 좌측 컬러 바 */}
      <div className="w-1 flex-shrink-0" style={{ background: typeColor }} />

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[15px] text-[var(--color-ink)] leading-snug truncate">
              {schedule.title}
            </p>
            {!compact && (
              <p className="text-[13px] text-[var(--color-ink-muted-48)] mt-0.5">
                {formatTime(schedule.startTime)}
                {schedule.endTime && ` ~ ${formatTime(schedule.endTime)}`}
              </p>
            )}
            {schedule.location && !compact && (
              <p className="text-[12px] text-[var(--color-ink-muted-48)] mt-0.5 flex items-center gap-1">
                <span>📍</span>
                <span className="truncate">{schedule.location.address}</span>
              </p>
            )}
            {schedule.amount !== undefined && (
              <p className="text-[13px] font-semibold mt-1" style={{ color: 'var(--color-schedule-expense)' }}>
                {schedule.amount.toLocaleString('ko-KR')}원
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {schedule.type === 'child' && (
              <StatusBadge status={schedule.status} />
            )}
            {compact && (
              <span className="text-[11px] text-[var(--color-ink-muted-48)]">
                {formatTime(schedule.startTime)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
