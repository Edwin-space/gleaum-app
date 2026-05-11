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
      default:          'glass-card',
      dark:             'bg-[#1A1B2E]/90 backdrop-blur-2xl text-white border border-white/10 shadow-2xl',
      parchment:        'bg-[var(--color-canvas-parchment)]',
      'gradient-border': 'glass-card border-transparent',
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

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="glass-card rounded-[22px] p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all border border-white/40 shadow-sm"
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[14px] text-[#1A1B2E] truncate">{schedule.title}</p>
          <p className="text-[11px] font-semibold text-[#8E8E93]">{formatTime(schedule.startTime)}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group relative glass-card rounded-[30px] p-0 overflow-hidden cursor-pointer active:scale-[0.99] transition-all border border-white/60 shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_rgba(0,132,204,0.12)]"
    >
      {/* 배경 글로우 효과 (유형별 컬러) */}
      <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 pointer-events-none"
        style={{ background: cfg.color }} />

      <div className="flex">
        {/* 왼쪽: 시간 표시부 (타임라인 인디케이터) */}
        <div className="w-[72px] flex flex-col items-center justify-center py-5 border-r border-gray-100/50">
          <p className="text-[11px] font-black text-[#8E8E93] uppercase tracking-tighter mb-1">
            {new Date(schedule.startTime).toLocaleTimeString('ko-KR', { hour: 'numeric', hour12: true }).split(' ')[0]}
          </p>
          <p className="text-[18px] font-black text-[#1A1B2E] leading-none mb-2">
            {new Date(schedule.startTime).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: false }).split(':')[0]}
            <span className="text-[13px] align-top ml-0.5">:</span>
            {new Date(schedule.startTime).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: false }).split(':')[1]}
          </p>
          <div className="w-1 flex-1 rounded-full" style={{ background: `linear-gradient(to bottom, ${cfg.color}, transparent)` }} />
        </div>

        {/* 오른쪽: 상세 내용부 */}
        <div className="flex-1 p-5 pl-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: cfg.bg, color: cfg.color }}>
                {cfg.icon}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                {schedule.type}
              </span>
              {schedule.visibility === 'private' && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                  style={{ background: 'rgba(12,201,181,0.10)', color: '#0CC9B5' }}>
                  🔒 나만
                </span>
              )}
            </div>
            <StatusBadge status={schedule.status} />
          </div>

          <h4 className="text-[17px] font-bold text-[#1A1B2E] leading-tight mb-2 group-hover:text-brand-blue transition-colors">
            {schedule.title}
          </h4>

          <div className="space-y-1.5">
            {schedule.location && (
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#8E8E93]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span className="truncate">{schedule.location.address}</span>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[12px] font-medium text-[#8E8E93]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>{formatTime(schedule.startTime)} - {schedule.endTime ? formatTime(schedule.endTime) : '계속'}</span>
              </div>
              {schedule.amount !== undefined && (
                <div className="px-2 py-0.5 rounded-md bg-[#F59E0B]/10 text-[11px] font-bold text-[#F59E0B]">
                  ₩{schedule.amount.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

