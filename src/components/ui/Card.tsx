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
      default:          'bg-white',
      dark:             'bg-[var(--color-surface-dark)] text-white',
      parchment:        'bg-[var(--color-canvas-parchment)]',
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
        className={cn('rounded-[24px] overflow-hidden shadow-card', variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// ── 일정 카드 (Figma 리뉴얼) ──
import type { Schedule } from '@/types';
import { formatTime } from '@/lib/utils';
import { StatusBadge } from './Badge';

interface ScheduleCardProps {
  schedule: Schedule;
  onClick?: () => void;
  compact?: boolean;
}

// 일정 유형별 아이콘 + 배경색
const TYPE_ICON_CONFIG = {
  shared: {
    bg: 'rgba(0,132,204,0.10)',
    color: '#0084CC',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  personal: {
    bg: 'rgba(12,201,181,0.10)',
    color: '#0CC9B5',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  child: {
    bg: 'rgba(46,232,149,0.10)',
    color: '#2EE895',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z"/>
        <path d="M12 14c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z"/>
      </svg>
    ),
  },
  expense: {
    bg: 'rgba(245,158,11,0.10)',
    color: '#F59E0B',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2"/>
        <line x1="2" x2="22" y1="10" y2="10"/>
      </svg>
    ),
  },
};

export function ScheduleCard({ schedule, onClick, compact = false }: ScheduleCardProps) {
  const cfg = TYPE_ICON_CONFIG[schedule.type];

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[24px] p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform shadow-card"
    >
      {/* 아이콘 원형 */}
      <div
        className="w-[48px] h-[48px] rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        {cfg.icon}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <h4
          className="font-bold text-[16px] leading-snug truncate mb-0.5"
          style={{ color: 'var(--color-ink)' }}
        >
          {schedule.title}
        </h4>
        {!compact && (
          <p className="text-[13px] font-semibold" style={{ color: '#8E8E93' }}>
            {formatTime(schedule.startTime)}
            {schedule.endTime && ` ~ ${formatTime(schedule.endTime)}`}
          </p>
        )}
        {schedule.location && !compact && (
          <p className="text-[12px] flex items-center gap-1 mt-0.5" style={{ color: '#8E8E93' }}>
            <span>📍</span>
            <span className="truncate">{schedule.location.address}</span>
          </p>
        )}
        {schedule.amount !== undefined && (
          <p className="text-[13px] font-bold mt-0.5" style={{ color: cfg.color }}>
            {schedule.amount.toLocaleString('ko-KR')}원
          </p>
        )}
      </div>

      {/* 우측 배지 */}
      {schedule.type === 'child' && (
        <div className="flex-shrink-0">
          <StatusBadge status={schedule.status} />
        </div>
      )}
      {compact && (
        <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: '#8E8E93' }}>
          {formatTime(schedule.startTime)}
        </span>
      )}
    </div>
  );
}
