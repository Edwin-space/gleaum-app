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
    // 고정
    housing:      '#0CC9B5',
    insurance:    '#8B5CF6',
    subscription: '#F59E0B',
    education:    '#0084CC',
    // 변동
    food:         '#EF4444',
    daily:        '#10B981',
    fashion:      '#EC4899',
    transport:    '#6366F1',
    culture:      '#F97316',
    medical:      '#14B8A6',
    social:       '#A855F7',
    // 레거시
    utility:      '#2EE895',
    other:        '#AEAEA8',
  };
  return colors[category] ?? '#AEAEA8';
}

// ── 타임존 안전 포맷 (서버/크론잡 사용) ──
// 브라우저의 로컬 타임존에 의존하지 않고 명시적 timezone을 사용합니다.
// 서버(Vercel)는 UTC로 실행되므로 한국 시각을 표시할 때 반드시 사용하세요.

const DEFAULT_TZ = 'Asia/Seoul';

/** 시각만 포맷 (예: "오전 10:30") — 서버 사이드 안전 */
export function formatTimeTZ(date: Date, timezone = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat('ko-KR', {
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   true,
    timeZone: timezone,
  }).format(date);
}

/** 날짜만 포맷 (예: "2024년 12월 25일 수요일") — 서버 사이드 안전 */
export function formatDateTZ(date: Date, timezone = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year:     'numeric',
    month:    'long',
    day:      'numeric',
    weekday:  'long',
    timeZone: timezone,
  }).format(date);
}

/** 날짜+시각 포맷 (예: "12월 25일 오전 10:30") — 서버 사이드 안전 */
export function formatDateTimeTZ(date: Date, timezone = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month:    'long',
    day:      'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   true,
    timeZone: timezone,
  }).format(date);
}

/**
 * 날짜 문자열(YYYY-MM-DD)과 시간 문자열(HH:mm)을 주어진 타임존 기준으로 파싱합니다.
 * 브라우저 로컬 타임존이 아닌 명시적 타임존으로 해석합니다.
 * 주로 서버 사이드(API Routes, 크론잡)에서 사용합니다.
 *
 * @example
 * // 서울 기준 2024-12-25 10:00 → UTC "2024-12-25T01:00:00.000Z"
 * parseDateTimeInTZ('2024-12-25', '10:00', 'Asia/Seoul')
 */
export function parseDateTimeInTZ(dateStr: string, timeStr: string, timezone = DEFAULT_TZ): Date {
  // Step 1: 입력을 UTC로 취급하여 임시 Date 생성
  const naiveUTC = new Date(`${dateStr}T${timeStr}:00Z`);

  // Step 2: 해당 타임존에서 naiveUTC가 어떻게 표시되는지 구함
  const parts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: timezone,
  }).formatToParts(naiveUTC);

  const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value ?? '0', 10);
  const tzDisplayMs = Date.UTC(
    get('year'), get('month') - 1, get('day'),
    get('hour') === 24 ? 0 : get('hour'), get('minute'), get('second'),
  );

  // Step 3: 해당 타임존에서 입력 시각을 표시하는 실제 UTC = 2 * naiveUTC - tzDisplay
  // 예: naiveUTC=10:00Z, Seoul에서 표시=19:00 → result = 20:00 - 19:00 = 01:00Z ✓
  return new Date(2 * naiveUTC.getTime() - tzDisplayMs);
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
