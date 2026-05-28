// ============================================================
// 글리움 (Gleaum) — 공통 타입 정의
// ============================================================

// ── 역할 ──────────────────────────────────────────────────

/**
 * 공간(Space) 내 역할 — Migration 001 이후 표준
 * admin  : 공간 설정, 초대/추방, 모든 일정 관리
 * editor : 일정 등록/수정/삭제
 * viewer : 일정 조회만
 */
export type SpaceRole = 'admin' | 'editor' | 'viewer';

/**
 * @deprecated profiles.role 레거시 값 (space_members.role 로 대체됨)
 * DB 트리거 호환 목적으로만 유지
 */
export type UserRole = 'parent' | 'child' | 'guest' | SpaceRole;

export type NameDisplayMode = 'nickname' | 'real_name';

// ── 온보딩 ─────────────────────────────────────────────────

export type OnboardingPrimaryGoal =
  | 'personal_schedule'
  | 'routine'
  | 'expense'
  | 'couple'
  | 'friends'
  | 'group';            // 'family' → 'group' 로 통일

export type HomeLayoutPreference =
  | 'balanced'
  | 'calendar_first'
  | 'routine_first'
  | 'expense_first'
  | 'space_first';

/** 공간 성격 (온보딩 선택) */
export type SpaceIntent = 'solo' | 'friends' | 'couple' | 'group';

/** 온보딩 공간 진입 모드 */
export type SpaceOnboardingMode = 'create' | 'join' | 'skip';

export interface OnboardingPreferences {
  primaryGoal:            OnboardingPrimaryGoal;
  homeLayout:             HomeLayoutPreference;
  enabledModules:         Array<'calendar' | 'routine' | 'expense' | 'spaces'>;
  defaultReminderMinutes: number;
  spaceIntent:            SpaceIntent[];
  /** 자동 생성된 개인 공간 ID — 공유 공간 여부 판별용 */
  personalSpaceId?:       string;
}

export interface NotificationSettings {
  scheduleReminders: boolean;
  routineReminders:  boolean;
  expenseReminders:  boolean;
  spaceUpdates:      boolean;
}

// ── 사용자 ─────────────────────────────────────────────────

export interface User {
  id:              string;
  name:            string;
  displayName?:    string;
  realName?:       string;
  nameDisplayMode?: NameDisplayMode;
  email:           string;
  avatar?:         string;
  /** @deprecated profiles.role 레거시. 공간별 역할은 SpaceMember.role 사용 */
  role?:           UserRole;
  /** @deprecated familyGroupId → spaceId 로 대체됨 (하위 호환 유지) */
  familyGroupId?:  string;
  /** 주 소속 공간 ID (familyGroupId 와 동일 값, 신규 코드에서 사용) */
  spaceId?:        string;
  googleId?:       string;
}

// ── 공간(Space) ─────────────────────────────────────────────

/** 공간 멤버 (space_members 테이블 + 사용자 정보 join) */
export interface SpaceMember {
  id:       string;
  spaceId:  string;
  userId:   string;
  role:     SpaceRole;
  joinedAt: Date;
  user?:    User;       // join 시 포함
}

/** 공간 목적 */
export type SpacePurpose = 'family' | 'couple' | 'friends' | 'work' | 'other';

/** 공간(Space) 정보 */
export interface Space {
  id:             string;
  name:           string;
  members:        SpaceMember[];
  inviteCode?:    string;
  /** 초대 코드 만료일 (없으면 무제한) */
  inviteCodeExpiresAt?: Date;
  createdBy:      string;
  createdAt:      Date;
  /** 커버 이미지 URL (family_groups.cover_url) */
  coverImageUrl?: string;
  /** 공간 목적 (settings.purpose) */
  purpose?:       SpacePurpose;
  /** 공간 일정 유형 목록 (settings.scheduleTypes) */
  scheduleTypes?: string[];
  /** 공간 기준 시각대 (IANA timezone, 예: 'Asia/Seoul') */
  timezone?: string;
}

/**
 * @deprecated FamilyGroup → Space 로 대체됨 (하위 호환 유지)
 */
export type FamilyGroup = Omit<Space, 'members'> & {
  members: User[];
};

/** 공간 유형 (설정/표시 목적) */
export type SpaceType = 'friend' | 'couple' | 'group' | 'custom';

// ── 일정 ──────────────────────────────────────────────────

export type ScheduleType   = 'shared' | 'personal' | 'child' | 'expense';
export type ScheduleCategory = 'event' | 'task' | 'care' | 'expense' | 'anniversary' | 'routine';
export type ScheduleVisibility = 'private' | 'space' | 'selected';

export type AutomationPolicy =
  | 'reminder_only'
  | 'time_window'
  | 'completion_required'
  | 'payment_due'
  | 'confirmation_required';

export type ScheduleStatus = 'pending' | 'in_progress' | 'completed' | 'missed';
export type RepeatType     = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ExpenseCategory =
  // ── 고정 지출 ─────────────────────────────────────────────
  | 'housing'       // 주거 / 통신
  | 'insurance'     // 보험 / 세금
  | 'subscription'  // 구독 / 정기결제
  | 'education'     // 교육 / 육아
  // ── 변동 지출 ─────────────────────────────────────────────
  | 'food'          // 식비
  | 'daily'         // 생활 / 마트
  | 'fashion'       // 패션 / 잡화
  | 'transport'     // 교통 / 차량
  | 'culture'       // 문화 / 여가
  | 'medical'       // 의료 / 건강
  | 'social'        // 경조사 / 선물
  // ── 레거시 (하위 호환) ─────────────────────────────────────
  | 'utility'       // @deprecated → housing 으로 통합
  | 'other';        // @deprecated → 용도에 맞는 카테고리로 이전

export type PaymentMethod = 'auto' | 'card' | 'cash' | 'other';
export type ExpenseReflectionType = 'actual_paid' | 'final_share' | 'manual';

export interface Location {
  address: string;
  lat?:    number;
  lng?:    number;
}

export interface Attachment {
  id:     string;
  name:   string;
  url:    string;
  type:   'image' | 'file';
  source: 'local';
}

export interface Schedule {
  id:        string;
  title:     string;
  type:      ScheduleType;
  category?: ScheduleCategory;
  visibility?: ScheduleVisibility;
  automationPolicy?: AutomationPolicy;
  startTime:      Date;
  endTime?:       Date;
  allDay?:        boolean;
  status:         ScheduleStatus;
  participants:   string[];
  location?:      Location;
  referenceUrl?:  string;
  reminder?:      number;
  repeat:         RepeatType;
  repeatEndDate?: Date;
  memo?:          string;
  attachments?:   Attachment[];
  /** @deprecated familyGroupId → spaceId 로 대체됨 (하위 호환 유지) */
  familyGroupId:  string;
  /** 소속 공간 ID (familyGroupId 와 동일 값, 신규 코드에서 사용) */
  spaceId?:       string;
  createdBy:      string;
  // 정기지출 전용
  amount?:          number;
  expenseCategory?: ExpenseCategory;
  paymentMethod?:   PaymentMethod;
  /** 개인 가계부에 반영된 경우 원본 공간 지출 ID */
  sourceSpaceExpenseId?: string;
  /** 개인 가계부에 반영된 경우 원본 공간 ID */
  sourceSpaceId?: string;
  /** 공간 지출을 개인 가계부에 반영한 기준 */
  expenseReflectionType?: ExpenseReflectionType;
  /** 공간 지출을 개인 가계부에 반영한 시각 */
  expenseReflectedAt?: Date;
  googleEventId?:   string;
}

// ── 알림 ──────────────────────────────────────────────────

export interface Notification {
  id:          string;
  userId:      string;
  scheduleId?: string;
  title:       string;
  body:        string;
  type:        'reminder' | 're_notify' | 'completion' | 'invite' | 'system';
  read:        boolean;
  createdAt:   Date;
}

// ── UI 상수 레이블 ─────────────────────────────────────────

export const SPACE_ROLE_LABELS: Record<SpaceRole, string> = {
  admin:  '공간 지기',
  editor: '공간 운영자',
  viewer: '공간 멤버',
};

export const SPACE_ROLE_DESCRIPTIONS: Record<SpaceRole, string> = {
  admin:  '공간 설정, 초대/추방, 모든 일정 관리',
  editor: '일정 등록·수정·삭제',
  viewer: '일정 조회만 가능',
};

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
  reminder_only:         '리마인더만',
  time_window:           '시간 기반 자동',
  completion_required:   '완료 확인 필요',
  payment_due:           '결제 기한',
  confirmation_required: '확인 필요',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  // 고정
  housing:      '주거/통신',
  insurance:    '보험/세금',
  subscription: '구독/정기결제',
  education:    '교육/육아',
  // 변동
  food:         '식비',
  daily:        '생활/마트',
  fashion:      '패션/잡화',
  transport:    '교통/차량',
  culture:      '문화/여가',
  medical:      '의료/건강',
  social:       '경조사/선물',
  // 레거시
  utility:      '공과금',
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
  // 고정
  housing:      '🏠',
  insurance:    '🛡️',
  subscription: '📱',
  education:    '📚',
  // 변동
  food:         '🍽️',
  daily:        '🛒',
  fashion:      '👗',
  transport:    '🚗',
  culture:      '🎬',
  medical:      '💊',
  social:       '🎁',
  // 레거시
  utility:      '💡',
  other:        '💳',
};

/** 고정 지출 카테고리 (반복 지출에 주로 사용) */
export const FIXED_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'housing', 'insurance', 'subscription', 'education',
];

/** 변동 지출 카테고리 (일회성 지출에 주로 사용) */
export const VARIABLE_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'food', 'daily', 'fashion', 'transport', 'culture', 'medical', 'social',
];
