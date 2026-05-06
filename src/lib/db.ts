/**
 * 글리움 (Gleaum) — Supabase Database Operations
 * 모든 DB 접근은 이 파일을 통해 처리합니다
 */

import { createClient } from '@/lib/supabase/client';
import type {
  Schedule,
  ScheduleType,
  ScheduleCategory,
  ScheduleVisibility,
  AutomationPolicy,
  ScheduleStatus,
  RepeatType,
  ExpenseCategory,
  PaymentMethod,
  User,
  Notification,
  NameDisplayMode,
  OnboardingPreferences,
  NotificationSettings,
} from '@/types';
import { createGoogleEvent, updateGoogleEvent, deleteGoogleEvent } from './googleCalendar';

// [전역 상태] 세션 내 무한 루프 방지용
let hasTriedAutoCreateGroup = false;

// ── Row types (DB → TypeScript 변환용) ─────────────────────

export interface ProfileRow {
  id: string;
  name: string | null;
  display_name?: string | null;
  real_name?: string | null;
  name_display_mode?: NameDisplayMode | null;
  email: string | null;
  avatar: string | null;
  role: 'parent' | 'child' | 'guest';
  family_group_id: string | null;
  google_id: string | null;
  onboarding_completed_at?: string | null;
  timezone?: string | null;
  locale?: string | null;
  preferences?: Partial<OnboardingPreferences> | null;
  notification_settings?: Partial<NotificationSettings> | null;
  updated_at: string;
}

export interface FamilyGroupRow {
  id: string;
  name: string;
  invite_code: string | null;
  created_by: string;
  created_at: string;
}

export interface ScheduleRow {
  id: string;
  title: string;
  type: ScheduleType;
  // Phase 2: 다축 분류
  category: ScheduleCategory | null;
  visibility: ScheduleVisibility | null;
  automation_policy: AutomationPolicy | null;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  status: ScheduleStatus;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  reference_url: string | null;
  reminder: number;
  repeat: RepeatType;
  repeat_end_date: string | null;
  memo: string | null;
  family_group_id: string;
  created_by: string;
  amount: number | null;
  expense_category: ExpenseCategory | null;
  payment_method: PaymentMethod | null;
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
  schedule_participants?: { user_id: string }[];
}

export interface NotificationRow {
  id: string;
  user_id: string;
  schedule_id: string | null;
  title: string;
  body: string;
  type: 'reminder' | 're_notify' | 'completion' | 'invite' | 'system';
  read: boolean;
  created_at: string;
}

// ── 변환 함수 ──────────────────────────────────────────────

export function rowToSchedule(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    category: row.category ?? undefined,
    visibility: row.visibility ?? undefined,
    automationPolicy: row.automation_policy ?? undefined,
    startTime: new Date(row.start_time),
    endTime: row.end_time ? new Date(row.end_time) : undefined,
    allDay: row.all_day,
    status: row.status,
    participants: row.schedule_participants?.map((p) => p.user_id) ?? [],
    location: row.location_address
      ? {
          address: row.location_address,
          lat: row.location_lat ?? undefined,
          lng: row.location_lng ?? undefined,
        }
      : undefined,
    referenceUrl: row.reference_url ?? undefined,
    reminder: row.reminder,
    repeat: row.repeat,
    repeatEndDate: row.repeat_end_date ? new Date(row.repeat_end_date) : undefined,
    memo: row.memo ?? undefined,
    familyGroupId: row.family_group_id,
    createdBy: row.created_by,
    amount: row.amount ?? undefined,
    expenseCategory: row.expense_category ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    googleEventId: row.google_event_id ?? undefined,
  };
}

export function rowToUser(row: ProfileRow): User {
  const displayName = row.display_name ?? row.name ?? '사용자';
  return {
    id: row.id,
    name: displayName,
    displayName,
    realName: row.real_name ?? undefined,
    nameDisplayMode: row.name_display_mode ?? 'nickname',
    email: row.email ?? '',
    avatar: row.avatar ?? '👤',
    role: row.role,
    familyGroupId: row.family_group_id ?? undefined,
    googleId: row.google_id ?? undefined,
  };
}

export function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    scheduleId: row.schedule_id ?? undefined,
    title: row.title,
    body: row.body,
    type: row.type,
    read: row.read,
    createdAt: new Date(row.created_at),
  };
}

// ── 프로필 & 가족 ─────────────────────────────────────────

/** 현재 로그인 사용자 프로필 조회 */
export async function getMyProfile(): Promise<ProfileRow | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('프로필 조회 오류:', error.message);
    return null;
  }
  return data;
}

/** 프로필 업데이트 */
export async function updateMyProfile(updates: Partial<Pick<ProfileRow, 'name' | 'display_name' | 'avatar' | 'role' | 'notification_settings'>>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) throw new Error(error.message);
}

/** 알림 설정 업데이트 */
export async function updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ notification_settings: settings })
    .eq('id', user.id);

  return !error;
}


export interface CompleteOnboardingInput {
  displayName: string;
  realName?: string;
  nameDisplayMode: NameDisplayMode;
  primaryGoal: OnboardingPreferences['primaryGoal'];
  homeLayout: OnboardingPreferences['homeLayout'];
  enabledModules: OnboardingPreferences['enabledModules'];
  defaultReminderMinutes: number;
  spaceIntent: OnboardingPreferences['spaceIntent'];
  notificationSettings: NotificationSettings;
  timezone?: string;
  locale?: string;
}

/** 최초 온보딩 완료 및 개인화 기본값 저장 */
export async function completeOnboarding(input: CompleteOnboardingInput): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const displayName = input.displayName.trim();
  if (!displayName) return false;

  const preferences: OnboardingPreferences = {
    primaryGoal: input.primaryGoal,
    homeLayout: input.homeLayout,
    enabledModules: input.enabledModules,
    defaultReminderMinutes: input.defaultReminderMinutes,
    spaceIntent: input.spaceIntent,
  };

  const { error } = await supabase
    .from('profiles')
    .update({
      name: displayName,
      display_name: displayName,
      real_name: input.realName?.trim() || null,
      name_display_mode: input.nameDisplayMode,
      onboarding_completed_at: new Date().toISOString(),
      timezone: input.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Asia/Seoul',
      locale: input.locale ?? navigator.language ?? 'ko-KR',
      preferences,
      notification_settings: input.notificationSettings,
    })
    .eq('id', user.id);

  if (error) {
    console.error('온보딩 저장 오류:', error.message);
    return false;
  }

  return true;
}

/** 가족 그룹 및 멤버 조회 */
export async function getFamilyWithMembers(familyGroupId: string): Promise<{
  group: FamilyGroupRow;
  members: ProfileRow[];
} | null> {
  const supabase = createClient();

  const [groupRes, membersRes] = await Promise.all([
    supabase.from('family_groups').select('*').eq('id', familyGroupId).single(),
    supabase.from('profiles').select('*').eq('family_group_id', familyGroupId),
  ]);

  if (groupRes.error || !groupRes.data) return null;
  return {
    group: groupRes.data,
    members: membersRes.data ?? [],
  };
}

/** 초대 코드로 가족 그룹 정보 조회 (미가입자도 조회 가능하도록 anon key 사용) */
export async function getFamilyByCode(inviteCode: string): Promise<{ id: string; name: string } | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('family_groups')
    .select('id, name')
    .eq('invite_code', inviteCode)
    .single();

  if (error || !data) return null;
  return { id: data.id, name: data.name };
}

/** 초대 코드로 스페이스 합류 */
export async function joinSpaceByCode(inviteCode: string): Promise<{ success: boolean; alreadyMember?: boolean; spaceName?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  // 이미 스페이스가 있는지 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('family_group_id')
    .eq('id', user.id)
    .single();

  // 초대 코드로 스페이스 찾기
  const { data: group, error: groupError } = await supabase
    .from('family_groups')
    .select('id, name')
    .eq('invite_code', inviteCode)
    .single();

  if (groupError || !group) return { success: false };

  // 이미 같은 스페이스 멤버인 경우
  if (profile?.family_group_id === group.id) {
    return { success: true, alreadyMember: true, spaceName: group.name };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ family_group_id: group.id })
    .eq('id', user.id);

  return { success: !error, spaceName: group.name };
}


/** 신규 스페이스 생성 + 프로필에 연결 */
export async function createSpace(name: string): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const inviteCode = `GLEAUM-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const { data: group, error: groupError } = await supabase
    .from('family_groups')
    .insert({ name, invite_code: inviteCode, created_by: user.id })
    .select()
    .single();

  if (groupError || !group) {
    console.error('Space creation error:', groupError?.message);
    return null;
  }

  await supabase
    .from('profiles')
    .update({ family_group_id: group.id })
    .eq('id', user.id);

  return group.id;
}


/** 로그인 후 프로필 초기화 (가족 그룹 없으면 자동 생성) */
export async function ensureUserSetup(): Promise<ProfileRow | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 프로필 조회
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 프로필 없으면 생성
  if (!profile) {
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '사용자',
        email: user.email ?? '',
        avatar: '👤',
        role: 'parent',
      })
      .select()
      .single();

    if (error) {
      console.error('프로필 생성 오류:', error.message);
      return null;
    }
    profile = newProfile;
  }

  // 스페이스 정보가 없으면 자동 생성 시도
  if (!profile.family_group_id && !hasTriedAutoCreateGroup) {
    hasTriedAutoCreateGroup = true; 
    const spaceName = `${profile.name || '나'}의 공간`;
    try {
      const spaceId = await createSpace(spaceName);
      if (spaceId) {
        profile.family_group_id = spaceId;
      }
    } catch (err) {
      console.warn('Space auto-creation skipped:', err);
    }
  }


  return profile;
}

// ── 일정 ─────────────────────────────────────────────────

/** 스페이스 일정 전체 조회 */
export async function getSchedules(spaceId: string): Promise<Schedule[]> {

  const supabase = createClient();

  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      schedule_participants (user_id)
    `)
    .eq('family_group_id', spaceId)

    .order('start_time', { ascending: true });

  if (error) {
    console.error('일정 조회 오류:', error.message);
    return [];
  }

  return (data as ScheduleRow[]).map(rowToSchedule);
}

/** 단일 일정 조회 */
export async function getScheduleById(id: string): Promise<Schedule | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      schedule_participants (user_id)
    `)
    .eq('id', id)
    .single();

  if (error) return null;
  return rowToSchedule(data as ScheduleRow);
}

// ── Phase 2: type → 다축 자동 매핑 헬퍼 ────────────────────

function inferCategory(type: ScheduleType): ScheduleCategory {
  switch (type) {
    case 'child':    return 'care';
    case 'expense':  return 'expense';
    case 'personal':
    case 'shared':
    default:         return 'event';
  }
}

function inferVisibility(type: ScheduleType): ScheduleVisibility {
  return type === 'personal' ? 'private' : 'space';
}

function inferAutomationPolicy(type: ScheduleType): AutomationPolicy {
  switch (type) {
    case 'child':   return 'completion_required';
    case 'expense': return 'payment_due';
    default:        return 'reminder_only';
  }
}

/** 일정 생성 */
export interface CreateScheduleInput {
  title: string;
  type: ScheduleType;
  // Phase 2: 다축 분류
  category?: ScheduleCategory;
  visibility?: ScheduleVisibility;
  automationPolicy?: AutomationPolicy;
  startTime: Date;
  endTime?: Date;
  allDay?: boolean;
  status?: ScheduleStatus;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
  referenceUrl?: string;
  reminder?: number;
  repeat?: RepeatType;
  repeatEndDate?: Date;
  memo?: string;
  participantIds?: string[];
  amount?: number;
  expenseCategory?: ExpenseCategory;
  paymentMethod?: PaymentMethod;
}

export async function createSchedule(
  familyGroupId: string,
  input: CreateScheduleInput
): Promise<Schedule | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();
  if (!user) return null;

  let googleEventId: string | null = null;

  if (session?.provider_token) {
    const tempSchedule: Schedule = {
      id: 'temp',
      title: input.title,
      type: input.type,
      startTime: input.startTime,
      endTime: input.endTime,
      allDay: input.allDay,
      status: input.status ?? 'pending',
      participants: input.participantIds ?? [user.id],
      familyGroupId,
      createdBy: user.id,
      repeat: input.repeat ?? 'none',
      repeatEndDate: input.repeatEndDate,
      memo: input.memo,
      location: input.locationAddress ? { address: input.locationAddress } : undefined,
    };
    try {
      const gEvent = await createGoogleEvent(session.provider_token, tempSchedule);
      if (gEvent && gEvent.id) {
        googleEventId = gEvent.id;
      }
    } catch (err) {
      console.error('Google 캘린더 생성 실패:', err);
    }
  }

  // Phase 2: type → category/visibility/automation_policy 자동 매핑
  const autoCategory = input.category ?? inferCategory(input.type);
  const autoVisibility = input.visibility ?? inferVisibility(input.type);
  const autoPolicy = input.automationPolicy ?? inferAutomationPolicy(input.type);

  const { data: schedule, error } = await supabase
    .from('schedules')
    .insert({
      title:             input.title,
      type:              input.type,
      category:          autoCategory,
      visibility:        autoVisibility,
      automation_policy: autoPolicy,
      start_time:        input.startTime.toISOString(),
      end_time:          input.endTime?.toISOString() ?? null,
      all_day:           input.allDay ?? false,
      status:            input.status ?? 'pending',
      location_address:  input.locationAddress ?? null,
      location_lat:      input.locationLat ?? null,
      location_lng:      input.locationLng ?? null,
      reference_url:     input.referenceUrl ?? null,
      reminder:          input.reminder ?? 0,
      repeat:            input.repeat ?? 'none',
      repeat_end_date:   input.repeatEndDate?.toISOString() ?? null,
      memo:              input.memo ?? null,
      family_group_id:   familyGroupId,
      created_by:        user.id,
      amount:            input.amount ?? null,
      expense_category:  input.expenseCategory ?? null,
      payment_method:    input.paymentMethod ?? null,
      google_event_id:   googleEventId,
    })
    .select()
    .single();

  if (error) {
    console.error('일정 생성 오류:', error.message);
    return null;
  }

  // 참여자 등록
  const participants = input.participantIds ?? [user.id];
  if (participants.length > 0) {
    await supabase.from('schedule_participants').insert(
      participants.map((uid) => ({ schedule_id: schedule.id, user_id: uid }))
    );
  }

  return rowToSchedule({ ...schedule, schedule_participants: participants.map((uid) => ({ user_id: uid })) });
}

/** 일정 상태 업데이트 */
export async function updateScheduleStatus(id: string, status: ScheduleStatus): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('schedules')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('상태 업데이트 오류:', error.message);
    return false;
  }
  return true;
}

/** 일정 수정 */
export async function updateSchedule(
  id: string,
  updates: Partial<CreateScheduleInput>
): Promise<boolean> {
  const supabase = createClient();

  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined)             dbUpdates.title             = updates.title;
  if (updates.type !== undefined)              dbUpdates.type              = updates.type;
  if (updates.category !== undefined)          dbUpdates.category          = updates.category;
  if (updates.visibility !== undefined)        dbUpdates.visibility        = updates.visibility;
  if (updates.automationPolicy !== undefined)  dbUpdates.automation_policy = updates.automationPolicy;
  if (updates.startTime !== undefined)         dbUpdates.start_time        = updates.startTime.toISOString();
  if (updates.endTime !== undefined)           dbUpdates.end_time          = updates.endTime?.toISOString() ?? null;
  if (updates.allDay !== undefined)            dbUpdates.all_day           = updates.allDay;
  if (updates.status !== undefined)            dbUpdates.status            = updates.status;
  if (updates.locationAddress !== undefined)   dbUpdates.location_address  = updates.locationAddress ?? null;
  if (updates.locationLat !== undefined)       dbUpdates.location_lat      = updates.locationLat ?? null;
  if (updates.locationLng !== undefined)       dbUpdates.location_lng      = updates.locationLng ?? null;
  if (updates.referenceUrl !== undefined)      dbUpdates.reference_url     = updates.referenceUrl ?? null;
  if (updates.reminder !== undefined)          dbUpdates.reminder          = updates.reminder;
  if (updates.repeat !== undefined)            dbUpdates.repeat            = updates.repeat;
  if (updates.repeatEndDate !== undefined)     dbUpdates.repeat_end_date   = updates.repeatEndDate?.toISOString() ?? null;
  if (updates.memo !== undefined)              dbUpdates.memo              = updates.memo ?? null;
  if (updates.amount !== undefined)            dbUpdates.amount            = updates.amount ?? null;
  if (updates.expenseCategory !== undefined)   dbUpdates.expense_category  = updates.expenseCategory ?? null;
  if (updates.paymentMethod !== undefined)     dbUpdates.payment_method    = updates.paymentMethod ?? null;

  const { data: existing, error: fetchErr } = await supabase.from('schedules').select('*').eq('id', id).single();

  if (!fetchErr && existing && existing.google_event_id) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.provider_token) {
      const tempSchedule = rowToSchedule({ ...existing, ...dbUpdates } as ScheduleRow);
      try {
        await updateGoogleEvent(session.provider_token, existing.google_event_id, tempSchedule);
      } catch (err) {
        console.error('Google 캘린더 수정 실패:', err);
      }
    }
  }

  const { error } = await supabase.from('schedules').update(dbUpdates).eq('id', id);
  if (error) return false;

  // 참여자 업데이트 (participantIds가 전달된 경우)
  if (updates.participantIds !== undefined) {
    await supabase.from('schedule_participants').delete().eq('schedule_id', id);
    if (updates.participantIds.length > 0) {
      await supabase.from('schedule_participants').insert(
        updates.participantIds.map((uid) => ({ schedule_id: id, user_id: uid }))
      );
    }
  }

  return true;
}

/** 일정 삭제 */
export async function deleteSchedule(id: string): Promise<boolean> {
  const supabase = createClient();
  const { data: existing } = await supabase.from('schedules').select('google_event_id').eq('id', id).single();

  if (existing?.google_event_id) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.provider_token) {
      try {
        await deleteGoogleEvent(session.provider_token, existing.google_event_id);
      } catch (err) {
        console.error('Google 캘린더 삭제 실패:', err);
      }
    }
  }

  const { error } = await supabase.from('schedules').delete().eq('id', id);
  return !error;
}

// ── 알림 ─────────────────────────────────────────────────

/** 내 알림 조회 */
export async function getNotifications(): Promise<Notification[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return [];
  return (data as NotificationRow[]).map(rowToNotification);
}

/** 알림 읽음 처리 */
export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

/** 모든 알림 읽음 처리 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
}

// ── FCM ─────────────────────────────────────────────────────

/** FCM 토큰을 현재 사용자 프로필에 저장 */
export async function saveFCMToken(token: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('profiles')
    .update({ fcm_token: token })
    .eq('id', user.id);
}

/** 알림 레코드 생성 (DB 기록용) */
export async function createNotification(params: {
  userId: string;
  scheduleId?: string;
  title: string;
  body: string;
  type: Notification['type'];
}): Promise<void> {
  const supabase = createClient();
  await supabase.from('notifications').insert({
    user_id:     params.userId,
    schedule_id: params.scheduleId ?? null,
    title:       params.title,
    body:        params.body,
    type:        params.type,
  });
}

// ── 파일 첨부 ──────────────────────────────────────────────

/** 일정 첨부 파일 업로드 → 공개 URL 반환 */
export async function uploadScheduleAttachment(file: File): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 고유 파일명 생성: userId/timestamp_originalName
  const ext = file.name.split('.').pop() ?? 'bin';
  const fileName = `${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('schedule-attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('파일 업로드 오류:', error.message);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('schedule-attachments')
    .getPublicUrl(fileName);

  return urlData?.publicUrl ?? null;
}

/** 마이페이지 대시보드용 인사이트 데이터 추출 */
export async function getMyPageInsights(familyGroupId: string | undefined) {
  if (!familyGroupId) return null;
  const supabase = createClient();
  const now = new Date();
  
  // 1. 이번 달 시작일/종료일
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // 2. 이번 주(향후 7일) 종료일
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7);
  const endOfWeekIso = endOfWeek.toISOString();

  // ── [지출 요약] 이번 달 총 지출 ──
  const { data: expenses } = await supabase
    .from('schedules')
    .select('amount')
    .eq('family_group_id', familyGroupId)
    .eq('type', 'expense')
    .gte('start_time', startOfMonth)
    .lte('start_time', endOfMonth);

  const totalExpense = expenses?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

  // ── [일정 요약] 향후 7일간 일정 개수 ──
  const { count: upcomingCount } = await supabase
    .from('schedules')
    .select('*', { count: 'exact', head: true })
    .eq('family_group_id', familyGroupId)
    .neq('type', 'expense') // 지출 제외 순수 일정
    .gte('start_time', now.toISOString())
    .lte('start_time', endOfWeekIso);

  // ── [가족 요약] 멤버 수 ──
  const { count: memberCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('family_group_id', familyGroupId);

  return {
    totalExpense,
    upcomingCount: upcomingCount || 0,
    memberCount: memberCount || 0,
    month: now.getMonth() + 1
  };
}

