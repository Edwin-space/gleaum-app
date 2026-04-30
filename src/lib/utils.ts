import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isTomorrow, isYesterday, differenceInMinutes } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { ScheduleType, ScheduleStatus, ExpenseCategory } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── 날짜 포맷 (한국어) ──
export function formatDate(date: Date): string {
  return format(date, 'yyyy년 MM월 dd일', { locale: ko });
}

export function formatDateShort(date: Date): string {
  if (isToday(date)) return '오늘';
  if (isTomorrow(date)) return '내일';
  if (isYesterday(date)) return '어제';
  return format(date, 'MM월 dd일 (eee)', { locale: ko });
}

export function formatTime(date: Date): string {
  return format(date, 'a hh:mm', { locale: ko });
}

export function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start)} ~ ${formatTime(end)}`;
}

export function formatRelativeTime(date: Date): string {
  const diff = differenceInMinutes(new Date(), date);
  if (diff < 1)   return '방금 전';
  if (diff < 60)  return `${diff}분 전`;
  if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
  return formatDateShort(date);
}

export function formatAmount(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

export function formatMonthYear(date: Date): string {
  return format(date, 'yyyy년 MM월', { locale: ko });
}

// ── 일정 유형 컬러 ──
export function getScheduleTypeColor(type: ScheduleType): string {
  const colors: Record<ScheduleType, string> = {
    shared:   'var(--color-schedule-shared)',
    personal: 'var(--color-schedule-personal)',
    child:    'var(--color-schedule-child)',
    expense:  'var(--color-schedule-expense)',
  };
  return colors[type];
}

export function getScheduleTypeClass(type: ScheduleType): string {
  const classes: Record<ScheduleType, string> = {
    shared:   'type-bar-shared',
    personal: 'type-bar-personal',
    child:    'type-bar-child',
    expense:  'type-bar-expense',
  };
  return classes[type];
}

// ── 상태 배지 ──
export function getStatusBadgeClass(status: ScheduleStatus): string {
  const classes: Record<ScheduleStatus, string> = {
    pending:     'badge-pending',
    in_progress: 'badge-progress',
    completed:   'badge-done',
    missed:      'badge-missed',
  };
  return classes[status];
}

// ── 카테고리 컬러 (가계부) ──
export function getCategoryColor(category: ExpenseCategory): string {
  const colors: Record<ExpenseCategory, string> = {
    education:    '#0084CC',
    housing:      '#0CC9B5',
    utility:      '#2EE895',
    insurance:    '#8B5CF6',
    subscription: '#F59E0B',
    other:        '#AEAEA8',
  };
  return colors[category];
}

// ── 월 날짜 계산 ──
export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  // 앞 패딩 (월요일 시작)
  const startDow = (firstDay.getDay() + 6) % 7; // 0=월요일
  for (let i = 0; i < startDow; i++) {
    days.push(new Date(year, month, -startDow + i + 1));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  // 뒤 패딩
  const remain = 42 - days.length;
  for (let i = 1; i <= remain; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}
