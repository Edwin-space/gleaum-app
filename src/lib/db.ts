/**
 * 글리움 (Gleaum) — Supabase Database Operations
 * 모든 DB 접근은 이 파일을 통해 처리합니다
 */

import { createClient } from '@/lib/supabase/client';
import type {
  Schedule,
  ScheduleType,
  ScheduleStatus,
  RepeatType,
  ExpenseCategory,
  PaymentMethod,
  User,
  FamilyGroup,
  Notification,
} from '@/types';

// ── Row types (DB → TypeScript 변환용) ─────────────────────

export interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: 'parent' | 'child' | 'guest';
  family_group_id: string | null;
  google_id: string | null;
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
  };
}

export function rowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name ?? '이름 없음',
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
export async function updateMyProfile(updates: Partial<Pick<ProfileRow, 'name' | 'avatar' | 'role'>>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) throw new Error(error.message);
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

/** 초대 코드로 가족 합류 */
export async function joinFamilyByCode(inviteCode: string): Promise<{ success: boolean; alreadyMember?: boolean; familyName?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  // 이미 가족 그룹이 있는지 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('family_group_id')
    .eq('id', user.id)
    .single();

  // 초대 코드로 그룹 찾기
  const { data: group, error: groupError } = await supabase
    .from('family_groups')
    .select('id, name')
    .eq('invite_code', inviteCode)
    .single();

  if (groupError || !group) return { success: false };

  // 이미 같은 가족 그룹 멤버인 경우
  if (profile?.family_group_id === group.id) {
    return { success: true, alreadyMember: true, familyName: group.name };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ family_group_id: group.id })
    .eq('id', user.id);

  return { success: !error, familyName: group.name };
}

/** 신규 가족 그룹 생성 + 프로필에 연결 */
export async function createFamilyGroup(name: string): Promise<string | null> {
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
    console.error('가족 그룹 생성 오류:', groupError?.message);
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

  // 가족 그룹 없으면 자동 생성
  if (!profile.family_group_id) {
    const userName = profile.name ?? '사용자';
    const familyName = `${userName.charAt(0)}씨 가족`;
    const groupId = await createFamilyGroup(familyName);
    if (groupId) {
      profile.family_group_id = groupId;
    }
  }

  return profile;
}

// ── 일정 ─────────────────────────────────────────────────

/** 가족 일정 전체 조회 */
export async function getSchedules(familyGroupId: string): Promise<Schedule[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      schedule_participants (user_id)
    `)
    .eq('family_group_id', familyGroupId)
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

/** 일정 생성 */
export interface CreateScheduleInput {
  title: string;
  type: ScheduleType;
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
  if (!user) return null;

  const { data: schedule, error } = await supabase
    .from('schedules')
    .insert({
      title:            input.title,
      type:             input.type,
      start_time:       input.startTime.toISOString(),
      end_time:         input.endTime?.toISOString() ?? null,
      all_day:          input.allDay ?? false,
      status:           input.status ?? 'pending',
      location_address: input.locationAddress ?? null,
      location_lat:     input.locationLat ?? null,
      location_lng:     input.locationLng ?? null,
      reference_url:    input.referenceUrl ?? null,
      reminder:         input.reminder ?? 0,
      repeat:           input.repeat ?? 'none',
      repeat_end_date:  input.repeatEndDate?.toISOString() ?? null,
      memo:             input.memo ?? null,
      family_group_id:  familyGroupId,
      created_by:       user.id,
      amount:           input.amount ?? null,
      expense_category: input.expenseCategory ?? null,
      payment_method:   input.paymentMethod ?? null,
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
  if (updates.title !== undefined)          dbUpdates.title            = updates.title;
  if (updates.startTime !== undefined)      dbUpdates.start_time       = updates.startTime.toISOString();
  if (updates.endTime !== undefined)        dbUpdates.end_time         = updates.endTime.toISOString();
  if (updates.status !== undefined)         dbUpdates.status           = updates.status;
  if (updates.locationAddress !== undefined) dbUpdates.location_address = updates.locationAddress;
  if (updates.memo !== undefined)           dbUpdates.memo             = updates.memo;
  if (updates.reminder !== undefined)       dbUpdates.reminder         = updates.reminder;
  if (updates.repeat !== undefined)         dbUpdates.repeat           = updates.repeat;
  if (updates.amount !== undefined)         dbUpdates.amount           = updates.amount;

  const { error } = await supabase.from('schedules').update(dbUpdates).eq('id', id);
  return !error;
}

/** 일정 삭제 */
export async function deleteSchedule(id: string): Promise<boolean> {
  const supabase = createClient();
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
