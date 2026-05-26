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

// ── 일정 카드 ──────────────────────────────────────────────────────────────
import type { Schedule } from '@/types';
import { formatTime } from '@/lib/utils';

interface ScheduleCardProps {
  schedule: Schedule;
  onClick?: () => void;
  compact?: boolean;
}

const TYPE_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  shared:   { bg: 'rgba(0,132,204,0.10)',   color: '#0084CC', label: '공유일정' },
  personal: { bg: 'rgba(12,201,181,0.10)',  color: '#0CC9B5', label: '개인일정' },
  child:    { bg: 'rgba(46,232,149,0.10)',  color: '#2EE895', label: '자녀일정' },
  expense:  { bg: 'rgba(245,158,11,0.10)', color: '#F59E0B', label: '정기지출' },
};

const STATUS_LABEL: Record<string, string> = {
  pending:     '예정',
  in_progress: '진행 중',
  completed:   '완료',
  missed:      '미완료',
};
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pending:     { bg: 'rgba(142,142,147,0.10)', color: '#8E8E93' },
  in_progress: { bg: 'rgba(0,132,204,0.10)',   color: '#0084CC' },
  completed:   { bg: 'rgba(46,232,149,0.12)',  color: '#2EE895' },
  missed:      { bg: 'rgba(239,68,68,0.10)',   color: '#EF4444' },
};

function fmtHour(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? 'AM' : 'PM';
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { ampm, time: `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}` };
}

export function ScheduleCard({ schedule, onClick, compact = false }: ScheduleCardProps) {
  const cfg = TYPE_CONFIG[schedule.type] ?? TYPE_CONFIG.shared;
  const st  = STATUS_COLOR[schedule.status] ?? STATUS_COLOR.pending;
  const { ampm, time } = fmtHour(new Date(schedule.startTime));

  if (compact) {
    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px', borderRadius: '18px',
          background: 'white',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          cursor: 'pointer',
        }}
      >
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
          background: cfg.color,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1B2E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {schedule.title}
          </p>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#8E8E93', margin: '2px 0 0' }}>
            {formatTime(schedule.startTime)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        background: 'white',
        borderRadius: '20px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.12s, box-shadow 0.12s',
      }}
      onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.985)')}
      onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
    >
      {/* 왼쪽 컬러 바 + 시간 */}
      <div style={{
        width: '68px', flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '16px 8px',
        borderRight: '1px solid rgba(0,0,0,0.04)',
        background: cfg.bg,
        gap: '2px',
      }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: cfg.color, letterSpacing: '0.3px' }}>
          {ampm}
        </span>
        <span style={{ fontSize: '17px', fontWeight: 900, color: '#1A1B2E', letterSpacing: '-0.5px', lineHeight: 1 }}>
          {time}
        </span>
      </div>

      {/* 오른쪽 내용 */}
      <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
        {/* 타입 + 상태 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 800, letterSpacing: '0.3px',
              padding: '2px 8px', borderRadius: '999px',
              background: cfg.bg, color: cfg.color,
            }}>
              {cfg.label}
            </span>
            {schedule.visibility === 'private' && (
              <span style={{
                fontSize: '10px', fontWeight: 700,
                padding: '2px 7px', borderRadius: '999px',
                background: 'rgba(0,0,0,0.05)', color: '#8E8E93',
              }}>
                🔒 나만
              </span>
            )}
          </div>
          <span style={{
            fontSize: '10px', fontWeight: 800,
            padding: '2px 8px', borderRadius: '999px',
            background: st.bg, color: st.color,
          }}>
            {STATUS_LABEL[schedule.status] ?? '예정'}
          </span>
        </div>

        {/* 제목 */}
        <p style={{
          fontSize: '16px', fontWeight: 800, color: '#1A1B2E',
          margin: '0 0 6px', lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {schedule.title}
        </p>

        {/* 시간 범위 + 위치 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93' }}>
              {formatTime(schedule.startTime)}{schedule.endTime ? ` - ${formatTime(schedule.endTime)}` : ''}
            </span>
            {schedule.amount !== undefined && (
              <span style={{
                marginLeft: '6px', fontSize: '11px', fontWeight: 700,
                padding: '1px 7px', borderRadius: '999px',
                background: 'rgba(245,158,11,0.10)', color: '#F59E0B',
              }}>
                ₩{schedule.amount.toLocaleString()}
              </span>
            )}
          </div>
          {schedule.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#8E8E93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {schedule.location.address}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 스켈레톤 카드 (로딩 중 플레이스홀더) ──────────────────────────────────
export function ScheduleCardSkeleton() {
  return (
    <div style={{
      display: 'flex', borderRadius: '20px',
      border: '1px solid rgba(0,0,0,0.06)',
      overflow: 'hidden', background: 'white',
    }}>
      <div style={{ width: '68px', flexShrink: 0, background: 'rgba(0,0,0,0.04)', padding: '16px 8px' }} />
      <div style={{ flex: 1, padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <div style={{ width: '52px', height: '16px', borderRadius: '999px', background: 'rgba(0,0,0,0.06)' }} />
          <div style={{ width: '32px', height: '16px', borderRadius: '999px', background: 'rgba(0,0,0,0.04)', marginLeft: 'auto' }} />
        </div>
        <div style={{ width: '60%', height: '18px', borderRadius: '6px', background: 'rgba(0,0,0,0.07)', marginBottom: '8px' }} />
        <div style={{ width: '80px', height: '13px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)' }} />
      </div>
    </div>
  );
}

