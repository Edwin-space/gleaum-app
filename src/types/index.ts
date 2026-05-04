// ============================================================
// 글리움 (Gleaum) — 공통 타입 정의
// ============================================================

export type UserRole = 'parent' | 'child' | 'guest';

export type NameDisplayMode = 'nickname' | 'real_name';

export type OnboardingPrimaryGoal =
  | 'personal_schedule'
  | 'routine'
  | 'expense'
  | 'couple'
  | 'friends'
  | 'family';

export type HomeLayoutPreference =
  | 'balanced'
  | 'calendar_first'
  | 'routine_first'
  | 'expense_first'
  | 'space_first';

export type SpaceIntent = 'solo' | 'friends' | 'couple' | 'family';

export interface OnboardingPreferences {
  primaryGoal: OnboardingPrimaryGoal;
  homeLayout: HomeLayoutPreference;
  enabledModules: Array<'calendar' | 'routine' | 'expense' | 'spaces'>;
  defaultReminderMinutes: number;
  spaceIntent: SpaceIntent[];
}

export interface NotificationSettings {
  scheduleReminders: boolean;
  routineReminders: boolean;
  expenseReminders: boolean;
  spaceUpdates: boolean;
}

export interface User {
  id: string;
  name: string;
  displayName?: string;
  realName?: string;
  nameDisplayMode?: NameDisplayMode;
  email: string;
  avatar?: string;
  role: UserRole;
  familyGroupId?: string;
  googleId?: string;
}

export type ScheduleType = 'shared' | 'personal' | 'child' | 'expense';

export type ScheduleCategory = 'event' | 'task' | 'care' | 'expense' | 'anniversary' | 'routine';

export type ScheduleVisibility = 'private' | 'space' | 'selected';

export type AutomationPolicy =
  | 'reminder_only'          // 상태 자동 변경 없음, 시작 전 리마인더만
  | 'time_window'            // pending → in_progress → completed/ended (시간 기반)
  | 'completion_required'    // pending → in_progress → missed (완료 확인 필요)
  | 'payment_due'            // pending → due → overdue/paid (결제 기한)
  | 'confirmation_required'; // 응답 대기 → 확인 완료/미응답

export type ScheduleStatus = 'pending' | 'in_progress' | 'completed' | 'missed';

export type SpaceType = 'friend' | 'couple' | 'family' | 'group' | 'custom';

export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ExpenseCategory =
  | 'education'   // 교육비
  | 'housing'     // 주거비
  | 'utility'     // 공과금
  | 'insurance'   // 보험료
  | 'subscription' // 구독서비스
  | 'other';      // 기타

export type PaymentMethod = 'auto' | 'card' | 'cash' | 'other';

export interface Location {
  address: string;
  lat?: number;
  lng?: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
  source: 'local' | 'google_drive';
}

export interface Schedule {
  id: string;
  title: string;
  type: ScheduleType;
  // Phase 2: 다축 분류 (type은 하위 호환용 유지)
  category?: ScheduleCategory;
  visibility?: ScheduleVisibility;
  automationPolicy?: AutomationPolicy;
  startTime: Date;
  endTime?: Date;
  allDay?: boolean;
  status: ScheduleStatus;
  participants: string[];        // user ids
  location?: Location;
  referenceUrl?: string;
  reminder?: number;             // 분 단위 (0 = 없음)
  repeat: RepeatType;
  repeatEndDate?: Date;
  memo?: string;
  attachments?: Attachment[];
  familyGroupId: string;
  createdBy: string;
  // 정기지출 전용
  amount?: number;
  expenseCategory?: ExpenseCategory;
  paymentMethod?: PaymentMethod;
  // 구글 캘린더 연동
  googleEventId?: string;
}

export interface FamilyGroup {
  id: string;
  name: string;
  members: User[];
  inviteCode?: string;
  createdBy: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  scheduleId?: string;
  title: string;
  body: string;
  type: 'reminder' | 're_notify' | 'completion' | 'invite' | 'system';
  read: boolean;
  createdAt: Date;
}

// UI 전용
export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  shared:   '공유일정',
  personal: '개인일정',
  child:    '자녀일정',
  expense:  '정기지출',
};

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  pending:     '대기중',
  in_progress: '진행중',
  completed:   '완료',
  missed:      '미완료',
};

export const SCHEDULE_CATEGORY_LABELS: Record<ScheduleCategory, string> = {
  event:       '일정',
  task:        '할 일',
  care:        '케어',
  expense:     '지출',
  anniversary: '기념일',
  routine:     '루틴',
};

export const AUTOMATION_POLICY_LABELS: Record<AutomationPolicy, string> = {
  reminder_only:          '리마인더만',
  time_window:            '시간 기반 자동',
  completion_required:    '완료 확인 필요',
  payment_due:            '결제 기한',
  confirmation_required:  '확인 필요',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  education:    '교육비',
  housing:      '주거비',
  utility:      '공과금',
  insurance:    '보험료',
  subscription: '구독서비스',
  other:        '기타',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  auto:  '자동이체',
  card:  '카드',
  cash:  '현금',
  other: '기타',
};

export const REPEAT_LABELS: Record<RepeatType, string> = {
  none:    '반복 안함',
  daily:   '매일',
  weekly:  '매주',
  monthly: '매월',
  yearly:  '매년',
};

export const REMINDER_OPTIONS = [
  { value: 0,    label: '없음' },
  { value: 10,   label: '10분 전' },
  { value: 30,   label: '30분 전' },
  { value: 60,   label: '1시간 전' },
  { value: 1440, label: '하루 전' },
  { value: 4320, label: '3일 전' },
];

export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  education:    '📚',
  housing:      '🏠',
  utility:      '💡',
  insurance:    '🛡️',
  subscription: '📱',
  other:        '💳',
};
