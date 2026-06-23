/**
 * 글리움 (Gleaum) — Supabase Database Operations
 * 모든 DB 접근은 이 파일을 통해 처리합니다
 */

import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
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
  ExpenseReflectionType,
  User,
  Notification,
  NameDisplayMode,
  OnboardingPreferences,
  NotificationSettings,
  SpaceRole,
  SpaceMember,
  Space,
  SpacePost,
  SpacePostType,
  SpaceDues,
  SpaceVote,
  LedgerEntry,
  LedgerKind,
  LedgerScope,
  LedgerStatus,
  LedgerCategory,
  RecurFreq,
} from '@/types';

type RouteSupabaseClient = SupabaseClient<any, any, any>;

// [전역 상태] 세션 내 무한 루프 방지용
let hasTriedAutoCreateGroup = false;

/** 로그인 시 공간 자동 생성 플래그 초기화 (재시도 허용) */
export function resetAutoCreateFlag() {
  hasTriedAutoCreateGroup = false;
}

// ── Row types (DB → TypeScript 변환용) ─────────────────────

export interface ProfileRow {
  id: string;
  name: string | null;
  display_name?: string | null;
  real_name?: string | null;
  name_display_mode?: NameDisplayMode | null;
  email: string | null;
  avatar: string | null;
  /** @deprecated profiles.role 레거시. 권한 관리는 space_members.role 사용 */
  role: string | null;
  family_group_id: string | null;
  google_id: string | null;
  onboarding_completed_at?: string | null;
  timezone?: string | null;
  locale?: string | null;
  preferences?: Partial<OnboardingPreferences> | null;
  notification_settings?: Partial<NotificationSettings> | null;
  updated_at: string;
}

/** family_groups 테이블 Row (내부명 유지, UI에서는 Space 로 표시) */
export interface FamilyGroupRow {
  id: string;
  name: string;
  invite_code: string | null;
  created_by: string;
  created_at: string;
}
export type SpaceRow = FamilyGroupRow; // alias

/** space_members 테이블 Row */
export interface SpaceMemberRow {
  id:        string;
  space_id:  string;
  user_id:   string;
  role:      SpaceRole;
  joined_at: string;
  nickname?: string | null;
  // join 시 포함될 수 있는 profiles 데이터
  profiles?: ProfileRow | null;
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
  source_space_expense_id: string | null;
  source_space_id: string | null;
  expense_reflection_type: ExpenseReflectionType | null;
  expense_reflected_at: string | null;
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
  const spaceId = row.family_group_id;
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
    familyGroupId: spaceId,   // 하위 호환
    spaceId,                  // 신규 코드에서 사용
    createdBy: row.created_by,
    amount: row.amount ?? undefined,
    expenseCategory: row.expense_category ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    sourceSpaceExpenseId: row.source_space_expense_id ?? undefined,
    sourceSpaceId: row.source_space_id ?? undefined,
    expenseReflectionType: row.expense_reflection_type ?? undefined,
    expenseReflectedAt: row.expense_reflected_at ? new Date(row.expense_reflected_at) : undefined,
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
    familyGroupId: row.family_group_id ?? undefined,  // 하위 호환
    spaceId: row.family_group_id ?? undefined,         // 신규 코드에서 사용
    googleId: row.google_id ?? undefined,
  };
}

export function rowToSpaceMember(row: SpaceMemberRow): SpaceMember {
  return {
    id:       row.id,
    spaceId:  row.space_id,
    userId:   row.user_id,
    role:     row.role,
    joinedAt: new Date(row.joined_at),
    nickname: row.nickname ?? undefined,
    user:     row.profiles ? rowToUser(row.profiles) : undefined,
  };
}

function mergeMemberProfiles(rows: SpaceMemberRow[], profiles: ProfileRow[] | null | undefined): SpaceMemberRow[] {
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return rows.map((row) => ({
    ...row,
    profiles: row.profiles ?? profileMap.get(row.user_id) ?? null,
  }));
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

/** 온보딩 이후 preferences 일부 항목만 업데이트 (기존 값 보존) */
export async function updatePreferences(patch: Partial<OnboardingPreferences>): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: existing } = await supabase.from('profiles').select('preferences').eq('id', user.id).single();
  const merged = { ...(existing?.preferences as object ?? {}), ...patch };
  const { error } = await supabase.from('profiles').update({ preferences: merged }).eq('id', user.id);
  return !error;
}

/** 최초 온보딩 완료 및 개인화 기본값 저장 */
export async function completeOnboarding(input: CompleteOnboardingInput): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const displayName = input.displayName.trim();
  if (!displayName) return false;

  // 기존 preferences 보존 (personalSpaceId 등 온보딩 외 값 유지)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single();
  const existingPrefs = (existingProfile?.preferences as object) ?? {};

  const preferences = {
    ...existingPrefs,          // personalSpaceId 등 기존 값 보존
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

// ── 공간(Space) ───────────────────────────────────────────

/** 공간 정보 + space_members 기반 멤버 목록 조회
 *  마이그레이션 이전(Phase 1 이전) 공간 생성자가 space_members에 없는 경우를 자동 보정.
 */
export async function getSpaceWithMembers(spaceId: string): Promise<Space | null> {
  const supabase = createClient();

  const { data: group, error: groupError } = await supabase
    .from('family_groups')
    .select('*')
    .eq('id', spaceId)
    .single();

  if (groupError || !group) return null;

  const { data: memberRows, error: membersError } = await supabase
    .from('space_members')
    .select('*')
    .eq('space_id', spaceId);

  if (membersError) {
    console.error('[getSpaceWithMembers] 멤버 조회 오류:', membersError.message);
  }

  const rows = (memberRows ?? []) as SpaceMemberRow[];

  // ── 마이그레이션 보정: 공간 생성자가 space_members에 없으면 admin으로 자동 등록 ──
  const creatorInMembers = rows.some((r) => r.user_id === group.created_by);
  if (!creatorInMembers && group.created_by) {
    // space_members에 backfill (이미 존재하면 무시)
    await supabase
      .from('space_members')
      .upsert(
        { space_id: spaceId, user_id: group.created_by, role: 'admin' },
        { onConflict: 'space_id,user_id', ignoreDuplicates: true },
      );

    // 생성자 프로필 조회하여 반환 목록에 추가
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', group.created_by)
      .single();

    if (creatorProfile) {
      rows.push({
        id:         `backfill-${group.created_by}`,
        space_id:   spaceId,
        user_id:    group.created_by,
        role:       'admin',
        joined_at:  group.created_at,
        profiles:   creatorProfile,
      } as unknown as SpaceMemberRow);
    }
  }

  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('*').in('id', userIds)
    : { data: [] as ProfileRow[] };
  const rowsWithProfiles = mergeMemberProfiles(rows, profiles as ProfileRow[]);

  return {
    id:             group.id,
    name:           group.name,
    inviteCode:     group.invite_code ?? undefined,
    inviteCodeExpiresAt: (group as any).invite_code_expires_at
      ? new Date((group as any).invite_code_expires_at)
      : undefined,
    createdBy:      group.created_by,
    createdAt:      new Date(group.created_at),
    members:        rowsWithProfiles.map(rowToSpaceMember),
    // cover_url 컬럼이 있을 때만 값이 채워짐 (DB 마이그레이션 후 활성화)
    coverImageUrl:  (group as any).cover_url ?? undefined,
    timezone:       (group as any).timezone ?? 'Asia/Seoul',
  };
}

/** 공간 멤버 목록만 조회 */
export async function getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('space_members')
    .select('*')
    .eq('space_id', spaceId);

  if (error || !data) return [];
  const rows = data as SpaceMemberRow[];
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('*').in('id', userIds)
    : { data: [] as ProfileRow[] };
  return mergeMemberProfiles(rows, profiles as ProfileRow[]).map(rowToSpaceMember);
}

/** 현재 사용자가 특정 공간에서 가진 역할 조회
 *  Phase 1 이전 생성자는 space_members에 없을 수 있으므로 created_by 폴백 적용.
 */
export async function getMyRoleInSpace(spaceId: string): Promise<SpaceRole | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1차: space_members 조회
  const { data, error } = await supabase
    .from('space_members')
    .select('role')
    .eq('space_id', spaceId)
    .eq('user_id', user.id)
    .single();

  if (!error && data) return data.role as SpaceRole;

  // 2차 폴백: 공간 생성자인지 확인 (마이그레이션 이전 사용자 대응)
  const { data: group } = await supabase
    .from('family_groups')
    .select('created_by')
    .eq('id', spaceId)
    .single();

  if (group?.created_by === user.id) {
    // space_members에 admin으로 자동 등록 (backfill)
    await supabase
      .from('space_members')
      .upsert(
        { space_id: spaceId, user_id: user.id, role: 'admin' },
        { onConflict: 'space_id,user_id', ignoreDuplicates: true },
      );
    return 'admin';
  }

  return null;
}

/** 현재 사용자가 속한 모든 공간 목록 */
export async function getMySpaces(): Promise<Space[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships, error } = await supabase
    .from('space_members')
    .select('space_id, role, joined_at')
    .eq('user_id', user.id);

  if (error || !memberships) return [];

  const spaceIds = [...new Set(memberships.map((row) => row.space_id))];
  if (spaceIds.length === 0) return [];

  const { data: groups, error: groupsError } = await supabase
    .from('family_groups')
    .select('*')
    .in('id', spaceIds);

  if (groupsError || !groups) return [];

  const orderMap = new Map(spaceIds.map((id, index) => [id, index]));
  return groups
    .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
    .map((group) => ({
      id:         group.id,
      name:       group.name,
      inviteCode: group.invite_code ?? undefined,
      inviteCodeExpiresAt: group.invite_code_expires_at
        ? new Date(group.invite_code_expires_at)
        : undefined,
      createdBy:  group.created_by,
      createdAt:  new Date(group.created_at),
      timezone:   group.timezone ?? 'Asia/Seoul',
      members:    [],  // 필요 시 별도 조회
    }));
}

/** 멤버 역할 변경 (admin 전용) */
export async function updateSpaceMemberRole(
  spaceId: string,
  userId: string,
  role: SpaceRole,
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('space_members')
    .update({ role })
    .eq('space_id', spaceId)
    .eq('user_id', userId);
  return !error;
}

/** 멤버 추방 (admin) 또는 본인 탈퇴 */
export async function removeSpaceMember(spaceId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('space_members')
    .delete()
    .eq('space_id', spaceId)
    .eq('user_id', userId);
  return !error;
}

/** 공간 폐쇄 (admin 전용) — 관련 데이터 즉시 삭제
 *  삭제 순서: space_settings → schedules → space_members → family_groups
 */
export async function deleteSpace(spaceId: string): Promise<boolean> {
  const supabase = createClient();

  // 1. space_settings
  await supabase.from('space_settings').delete().eq('space_id', spaceId);

  // 2. schedules (현재 스키마는 family_group_id 기준)
  await supabase.from('schedules').delete().eq('family_group_id', spaceId);

  // 3. space_members
  await supabase.from('space_members').delete().eq('space_id', spaceId);

  // 4. family_groups (공간 본체)
  const { error } = await supabase.from('family_groups').delete().eq('id', spaceId);
  return !error;
}

/** 공간 이름 수정 (admin 전용) */
export async function updateSpaceName(spaceId: string, name: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('family_groups')
    .update({ name })
    .eq('id', spaceId);
  return !error;
}

/** 프로필 아바타 이미지 업로드 → 공개 URL 반환 후 profiles.avatar 저장
 *  Bucket: profile-avatars (public 읽기 권한 필요)
 *  권장: 300×300 JPEG 0.85 — 호출 전 canvas로 리사이즈 후 전달
 */
export async function uploadProfileAvatar(file: Blob, ext = 'jpg'): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const path = `${user.id}/avatar.${ext}`;

  // profile-avatars 버킷 사용 (없으면 schedule-attachments 폴백)
  let bucket = 'profile-avatars';
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, cacheControl: '3600', contentType: `image/${ext}` });

  if (uploadError) {
    // 폴백: schedule-attachments 버킷
    bucket = 'schedule-attachments';
    const { error: fallbackError } = await supabase.storage
      .from(bucket)
      .upload(`profile-avatars/${path}`, file, { upsert: true, cacheControl: '3600', contentType: `image/${ext}` });
    if (fallbackError) { console.error('[uploadProfileAvatar]', fallbackError); return null; }
  }

  const finalPath = bucket === 'profile-avatars' ? path : `profile-avatars/${path}`;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(finalPath);
  const url = urlData?.publicUrl ?? null;
  if (!url) return null;

  // profiles.avatar 업데이트
  await supabase.from('profiles').update({ avatar: url }).eq('id', user.id);
  return url;
}

/** 공간 커버 이미지 업로드 & URL 저장 (admin 전용)
 *  저장 위치: schedule-attachments 버킷 → space-covers/{spaceId}/
 *  DB: family_groups.cover_url TEXT
 */
export async function updateSpaceCoverImage(spaceId: string, file: File): Promise<string | null> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `space-covers/${spaceId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('schedule-attachments')
    .upload(path, file, { upsert: true, cacheControl: '3600' });

  if (uploadError) { console.error('[updateSpaceCoverImage]', uploadError); return null; }

  const { data: urlData } = supabase.storage.from('schedule-attachments').getPublicUrl(path);
  const url = urlData?.publicUrl ?? null;
  if (!url) return null;

  await supabase.from('family_groups').update({ cover_url: url } as any).eq('id', spaceId);
  return url;
}

/** 공간 설정 업데이트 (purpose, scheduleTypes 등)
 *  DB: family_groups.settings JSONB DEFAULT '{}'
 */
export async function updateSpaceSettings(
  spaceId: string,
  settings: { purpose?: string; scheduleTypes?: string[] },
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('family_groups')
    .update({ settings } as any)
    .eq('id', spaceId);
  if (error) console.error('[updateSpaceSettings]', error);
  return !error;
}

/** 공간 설정 조회 */
export async function getSpaceSettings(
  spaceId: string,
): Promise<{ purpose?: string; scheduleTypes?: string[] }> {
  const supabase = createClient();
  const { data } = await supabase
    .from('family_groups')
    .select('settings, cover_url')
    .eq('id', spaceId)
    .single();
  return (data as any)?.settings ?? {};
}

/** 초대 코드로 공간 정보 조회 */
export async function getSpaceByCode(inviteCode: string): Promise<{ id: string; name: string } | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('family_groups')
    .select('id, name')
    .eq('invite_code', inviteCode)
    .single();

  if (error || !data) return null;
  return { id: data.id, name: data.name };
}

/** @deprecated getSpaceByCode 사용 권장 */
export const getFamilyByCode = getSpaceByCode;

/** 초대 코드로 공간 합류 → space_members INSERT + profiles 업데이트 */
export async function joinSpaceByCode(inviteCode: string): Promise<{
  success: boolean;
  alreadyMember?: boolean;
  spaceName?: string;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  // 초대 코드로 공간 찾기
  const space = await getSpaceByCode(inviteCode);
  if (!space) return { success: false };

  // 이미 멤버인지 확인
  const existingRole = await getMyRoleInSpace(space.id);
  if (existingRole) {
    return { success: true, alreadyMember: true, spaceName: space.name };
  }

  // space_members INSERT (role: viewer — 초대로 참여한 사용자 기본 권한)
  const { error: memberError } = await supabase
    .from('space_members')
    .insert({ space_id: space.id, user_id: user.id, role: 'viewer' });

  if (memberError) {
    console.error('공간 합류 오류:', memberError.message);
    return { success: false };
  }

  // profiles.family_group_id 업데이트 (하위 호환)
  await supabase
    .from('profiles')
    .update({ family_group_id: space.id })
    .eq('id', user.id);

  return { success: true, spaceName: space.name };
}

/**
 * 8자리 영숫자 초대 코드 생성
 * - 모호한 문자(O/0/I/1) 제외, 대문자+숫자 조합
 * - 32^8 ≈ 1조 가지 조합 (기존 4자리 대비 약 100만배 강화)
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `GLEAUM-${code}`;
}

/** 초대 코드 재발급 (admin 전용) — 영구 유효
 *
 * `.select()` 로 DB에 실제 반영됐는지 검증.
 * RLS가 차단한 경우(data === null) → space_members backfill 후 재시도.
 * Silent fail 방지: 이전에는 error 없이 0 rows 갱신돼도 newCode 를 반환하는 버그가 있었음.
 */
export async function regenerateInviteCode(spaceId: string): Promise<string | null> {
  const supabase = createClient();
  const newCode = generateInviteCode();

  const { data, error } = await supabase
    .from('family_groups')
    .update({ invite_code: newCode, invite_code_expires_at: null })
    .eq('id', spaceId)
    .select('invite_code')
    .single();

  if (!error && data?.invite_code) return data.invite_code;

  if (error) console.error('[regenerateInviteCode] 오류:', error.message);

  // RLS 차단(data null) → 공간 생성자를 space_members 에 admin으로 backfill 후 재시도
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  await supabase
    .from('space_members')
    .upsert(
      { space_id: spaceId, user_id: user.id, role: 'admin' },
      { onConflict: 'space_id,user_id', ignoreDuplicates: true },
    );

  const { data: retry, error: retryErr } = await supabase
    .from('family_groups')
    .update({ invite_code: newCode, invite_code_expires_at: null })
    .eq('id', spaceId)
    .select('invite_code')
    .single();

  if (retryErr || !retry?.invite_code) {
    console.error('[regenerateInviteCode] 재시도 실패:', retryErr?.message ?? 'no data');
    return null;
  }
  return retry.invite_code;
}

/** 신규 공간 생성 → space_members admin 등록 + 필요 시 profiles.family_group_id 업데이트 */
export async function createSpace(
  name: string,
  options: { setAsCurrent?: boolean } = {},
): Promise<{ id: string; inviteCode: string; error?: never } | { id: null; inviteCode?: never; error: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { id: null, error: '로그인이 필요합니다' };

  const inviteCode = generateInviteCode();
  const setAsCurrent = options.setAsCurrent ?? true;

  // 1. family_groups 생성
  const { data: group, error: groupError } = await supabase
    .from('family_groups')
    .insert({ name, invite_code: inviteCode, created_by: user.id })
    .select()
    .single();

  if (groupError || !group) {
    const msg = groupError?.message ?? '알 수 없는 오류';
    console.error('공간 생성 오류:', groupError);
    return { id: null, error: `DB 오류: ${msg} (code: ${(groupError as any)?.code ?? '-'})` };
  }

  // 2. space_members에 admin으로 등록
  const { error: memberError } = await supabase
    .from('space_members')
    .insert({ space_id: group.id, user_id: user.id, role: 'admin' });

  if (memberError) {
    console.error('공간 멤버 등록 오류:', memberError);
    // 공간은 생성됐으므로 계속 진행
  }

  // 3. profiles.family_group_id 업데이트 (하위 호환)
  // 개인 공간을 뒤늦게 생성하는 경우에는 현재 공유 공간을 덮어쓰지 않는다.
  if (setAsCurrent) {
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ family_group_id: group.id })
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error('[createSpace] profiles 업데이트 실패:', profileUpdateError.message, '| spaceId:', group.id);
    } else {
      console.info('[createSpace] 공간 생성 완료:', group.id, '| user:', user.id);
    }
  } else {
    console.info('[createSpace] 공간 생성 완료(현재 공간 유지):', group.id, '| user:', user.id);
  }

  return { id: group.id, inviteCode };
}

/**
 * 개인 공간 자동 생성 — 사용자에게 노출되지 않는 개인 전용 공간
 * preferences.personalSpaceId 에 저장하여 공유 공간과 구분함
 */
export async function createPersonalSpace(displayName: string): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('family_group_id, preferences')
    .eq('id', user.id)
    .single();

  const currentSpaceId = currentProfile?.family_group_id ?? null;
  const spaceName = displayName?.trim() ? `${displayName.trim()}의 공간` : '나의 공간';
  const result = await createSpace(spaceName, { setAsCurrent: !currentSpaceId });
  if (!result.id) return null;
  const spaceId = result.id;

  // preferences.personalSpaceId 에 저장 (공유 공간 여부 판별 용도)
  const existingPrefs = (currentProfile?.preferences as object) ?? {};
  await supabase
    .from('profiles')
    .update({ preferences: { ...existingPrefs, personalSpaceId: spaceId } })
    .eq('id', user.id);

  return spaceId;
}

/**
 * 로그인 후 프로필 보장.
 * 온보딩을 완료했으나 공간이 없는 기존 사용자를 위해
 * 개인 공간을 자동 생성합니다 (무한 루프 방지용 전역 플래그 사용).
 */
export async function ensureUserSetup(): Promise<ProfileRow | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 프로필 조회
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error('프로필 조회 오류:', error?.message);
    return null;
  }

  const personalSpaceId = (profile.preferences as { personalSpaceId?: string } | null)?.personalSpaceId ?? null;

  // 온보딩 완료 후 개인 공간이 없으면 자동 생성.
  // 이미 공유 공간에 들어간 사용자라면 현재 공간은 유지하고 personalSpaceId만 별도로 만든다.
  if (!personalSpaceId && !hasTriedAutoCreateGroup && profile.onboarding_completed_at) {
    hasTriedAutoCreateGroup = true;
    const displayName = profile.display_name ?? profile.name ?? '나';
    const newSpaceId = await createPersonalSpace(displayName);

    if (newSpaceId) {
      // 업데이트된 프로필 재조회 후 반환
      const { data: updated } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return updated ?? profile;
    }
  }

  return profile;
}

// ── 일정 ─────────────────────────────────────────────────

/** 스페이스 일정 전체 조회 */
export async function getSchedules(spaceId: string): Promise<Schedule[]> {
  const supabase = createClient();

  // 현재 사용자 확인 — private 일정은 생성자 본인만 조회 가능
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? '';

  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      schedule_participants (user_id)
    `)
    .eq('family_group_id', spaceId)
    // visibility가 'private'인 일정은 생성자(created_by)만 볼 수 있음
    // visibility가 null이거나 'space'/'selected'인 경우는 전체 공개
    .or(`visibility.neq.private,visibility.is.null,created_by.eq.${userId}`)
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      schedule_participants (user_id)
    `)
    .eq('id', id)
    // RLS 강화 전/후 모두 안전하게 private 일정은 생성자 본인에게만 노출한다.
    .or(`visibility.neq.private,visibility.is.null,created_by.eq.${user.id}`)
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
  sourceSpaceExpenseId?: string;
  sourceSpaceId?: string;
  expenseReflectionType?: ExpenseReflectionType;
  expenseReflectedAt?: Date;
}

export async function createSchedule(
  familyGroupId: string,
  input: CreateScheduleInput
): Promise<Schedule | null> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) {
    console.error('[createSchedule] 인증 없음:', authError?.message);
    throw new Error(`인증 오류: ${authError?.message ?? '로그인이 필요합니다'}`);
  }

  // Phase 2: type → category/visibility/automation_policy 자동 매핑
  const autoCategory = input.category ?? inferCategory(input.type);
  const autoVisibility = input.visibility ?? inferVisibility(input.type);
  const autoRepeat = input.repeat ?? 'none';
  const isOneTimeExpense = input.type === 'expense' && autoRepeat === 'none';

  // ★ expense 유형 automation_policy 결정:
  //   - 정기지출(repeat !== 'none'): payment_due  → 결제 기한 초과 알림 활성
  //   - 일회성 지출(repeat === 'none'): completed + reminder_only → 이미 발생한 돈의 흐름
  //   이렇게 하지 않으면 일반 소비 기록이 "결제 예정" 일정처럼 보이거나 크론 대상이 될 수 있음.
  const autoPolicy = input.automationPolicy ?? (
    isOneTimeExpense ? 'reminder_only' : inferAutomationPolicy(input.type)
  );
  const autoStatus = input.status ?? (isOneTimeExpense ? 'completed' : 'pending');

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
      status:            autoStatus,
      location_address:  input.locationAddress ?? null,
      location_lat:      input.locationLat ?? null,
      location_lng:      input.locationLng ?? null,
      reference_url:     input.referenceUrl ?? null,
      reminder:          input.reminder ?? 0,
      repeat:            autoRepeat,
      repeat_end_date:   input.repeatEndDate?.toISOString() ?? null,
      memo:              input.memo ?? null,
      family_group_id:   familyGroupId,
      created_by:        user.id,
      amount:            input.amount ?? null,
      expense_category:  input.expenseCategory ?? null,
      payment_method:    input.paymentMethod ?? null,
      source_space_expense_id: input.sourceSpaceExpenseId ?? null,
      source_space_id: input.sourceSpaceId ?? null,
      expense_reflection_type: input.expenseReflectionType ?? null,
      expense_reflected_at: input.expenseReflectedAt?.toISOString() ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[createSchedule] DB 오류:', error.message, '| code:', error.code, '| spaceId:', familyGroupId);
    throw new Error(`DB 오류 [${error.code}]: ${error.message}`);
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

/** 정기지출(고정지출) 이월 — 이번 달에 누락된 반복 인스턴스를 생성한다.
 *
 *  '매월/매주/매년' 지출은 등록된 달의 단일 레코드일 뿐, 다음 주기 레코드를
 *  만들어주는 서버 크론이 없다. 가계부 페이지 로드 시 이 함수를 호출해
 *  현재 달에 빠진 인스턴스를 lazy하게 생성한다(과거 공백 달은 소급 생성하지 않음).
 *
 *  시리즈 식별: 같은 제목 + 같은 반복 주기(title + repeat)의 최신 인스턴스 기준.
 *  생성된 레코드 수를 반환한다.
 */
export async function materializeRecurringExpenses(spaceId: string): Promise<number> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('family_group_id', spaceId)
    .eq('type', 'expense')
    .eq('visibility', 'private')
    .eq('created_by', user.id)
    .neq('repeat', 'none')
    .order('start_time', { ascending: true });

  if (error || !data?.length) return 0;
  const rows = data as ScheduleRow[];

  // 시리즈 그룹핑 (start_time 오름차순이므로 마지막 요소가 최신 인스턴스)
  const series = new Map<string, ScheduleRow[]>();
  for (const row of rows) {
    const key = `${row.title}__${row.repeat}`;
    const list = series.get(key) ?? [];
    list.push(row);
    series.set(key, list);
  }

  let created = 0;

  for (const instances of series.values()) {
    const latest = instances[instances.length - 1];
    const latestDate = new Date(latest.start_time);
    const repeatEnd  = latest.repeat_end_date ? new Date(latest.repeat_end_date) : null;

    // 이번 달에 생성할 결제일 목록 (UTC 자정 = KST 오전 9시 — 일정 뷰 시간 표시가 자연스럽고 연체 크론의 UTC 날짜와 일치)
    const targets: Date[] = [];
    const lastDayOfMonth = monthEnd.getDate();

    if (latest.repeat === 'monthly') {
      if (latestDate >= monthStart) continue; // 이미 이번 달(또는 미래) 인스턴스 존재
      const day = Math.min(latestDate.getDate(), lastDayOfMonth);
      targets.push(new Date(Date.UTC(now.getFullYear(), now.getMonth(), day)));
    } else if (latest.repeat === 'yearly') {
      if (latestDate >= monthStart) continue;
      if (latestDate.getMonth() !== now.getMonth()) continue; // 결제 월이 아님
      const day = Math.min(latestDate.getDate(), lastDayOfMonth);
      targets.push(new Date(Date.UTC(now.getFullYear(), now.getMonth(), day)));
    } else if (latest.repeat === 'weekly') {
      const cursor = new Date(latestDate);
      for (let i = 0; i < 60; i++) { // 안전 상한 (약 1년)
        cursor.setDate(cursor.getDate() + 7);
        if (cursor > monthEnd) break;
        if (cursor >= monthStart) {
          targets.push(new Date(Date.UTC(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())));
        }
      }
    } else {
      continue; // daily 등 가계부 UI에서 제공하지 않는 주기는 미지원
    }

    for (const target of targets) {
      if (repeatEnd && target > repeatEnd) continue;

      // 중복 방지: 같은 시리즈가 주간은 같은 날짜, 월간·연간은 같은 달에 이미 있으면 스킵
      const dup = instances.some((inst) => {
        const d = new Date(inst.start_time);
        const sameMonth = d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
        return latest.repeat === 'weekly' ? sameMonth && d.getDate() === target.getDate() : sameMonth;
      });
      if (dup) continue;

      const { error: insertError } = await supabase.from('schedules').insert({
        title:             latest.title,
        type:              'expense',
        category:          'expense',
        visibility:        'private',
        automation_policy: 'reminder_only',
        start_time:        target.toISOString(),
        end_time:          null, // 정기지출은 end_time 미설정 — 크론 missed 전환 방지
        all_day:           latest.all_day,
        status:            'pending',
        reminder:          latest.reminder ?? 0,
        repeat:            latest.repeat,
        repeat_end_date:   latest.repeat_end_date,
        memo:              latest.memo,
        family_group_id:   spaceId,
        created_by:        user.id,
        amount:            latest.amount,
        expense_category:  latest.expense_category,
        payment_method:    latest.payment_method,
      });
      if (insertError) {
        console.error('[materializeRecurringExpenses]', insertError.message);
      } else {
        created++;
      }
    }
  }

  return created;
}

export async function reflectSpaceExpenseToPersonalBudget(
  sourceExpense: Schedule,
  options: {
    amount?: number;
    reflectionType?: ExpenseReflectionType;
  } = {}
): Promise<Schedule | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  if (sourceExpense.type !== 'expense' || sourceExpense.visibility === 'private') {
    console.error('개인 가계부 반영 오류: 공간 지출만 반영할 수 있습니다.');
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single();

  const personalSpaceId = (profile?.preferences as { personalSpaceId?: string } | null)?.personalSpaceId;
  if (!personalSpaceId) {
    console.error('개인 가계부 반영 오류: personalSpaceId가 없습니다.');
    return null;
  }

  const { data: existing } = await supabase
    .from('schedules')
    .select(`
      *,
      schedule_participants (user_id)
    `)
    .eq('source_space_expense_id', sourceExpense.id)
    .eq('created_by', user.id)
    .maybeSingle();

  if (existing) return rowToSchedule(existing as ScheduleRow);

  const reflectedAmount = options.amount ?? sourceExpense.amount ?? 0;
  const reflectedAt = new Date();

  return createSchedule(personalSpaceId, {
    title: sourceExpense.title,
    type: 'expense',
    category: 'expense',
    visibility: 'private',
    automationPolicy: 'reminder_only',
    startTime: sourceExpense.startTime,
    endTime: sourceExpense.endTime ?? sourceExpense.startTime,
    status: 'completed',
    reminder: 0,
    repeat: 'none',
    amount: reflectedAmount,
    expenseCategory: sourceExpense.expenseCategory ?? 'other',
    paymentMethod: sourceExpense.paymentMethod ?? 'card',
    memo: sourceExpense.memo
      ? `${sourceExpense.memo}\n\n공간 지출에서 개인 가계부로 반영됨`
      : '공간 지출에서 개인 가계부로 반영됨',
    participantIds: [user.id],
    sourceSpaceExpenseId: sourceExpense.id,
    sourceSpaceId: sourceExpense.spaceId ?? sourceExpense.familyGroupId,
    expenseReflectionType: options.reflectionType ?? 'actual_paid',
    expenseReflectedAt: reflectedAt,
  });
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
  if (updates.sourceSpaceExpenseId !== undefined) dbUpdates.source_space_expense_id = updates.sourceSpaceExpenseId ?? null;
  if (updates.sourceSpaceId !== undefined)        dbUpdates.source_space_id = updates.sourceSpaceId ?? null;
  if (updates.expenseReflectionType !== undefined) dbUpdates.expense_reflection_type = updates.expenseReflectionType ?? null;
  if (updates.expenseReflectedAt !== undefined)   dbUpdates.expense_reflected_at = updates.expenseReflectedAt?.toISOString() ?? null;

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
  const { error } = await supabase.from('schedules').delete().eq('id', id);
  return !error;
}

// ── 가계부 원장 (Ledger: 수입·지출 통합) ─────────────────────
//   migration 017_ledger_entries.sql 필요. scope='personal'은 개인 가계부,
//   scope='space'는 공간 공동 수입/지출. RLS가 본인/공간 멤버 범위를 강제.

export interface LedgerRow {
  id: string;
  kind: LedgerKind;
  scope: LedgerScope;
  space_id: string;
  owner_id: string;
  title: string;
  amount: number;
  category: string;
  method: string | null;
  occurred_at: string;
  status: LedgerStatus;
  recur_freq: RecurFreq;
  recur_until: string | null;
  recur_rule_id: string | null;
  source_entry_id: string | null;
  memo: string | null;
}

export function rowToLedger(row: LedgerRow): LedgerEntry {
  return {
    id:            row.id,
    kind:          row.kind,
    scope:         row.scope,
    spaceId:       row.space_id,
    ownerId:       row.owner_id,
    title:         row.title,
    amount:        row.amount ?? 0,
    category:      row.category as LedgerCategory,
    method:        row.method ?? undefined,
    occurredAt:    new Date(row.occurred_at),
    status:        row.status,
    recurFreq:     row.recur_freq,
    recurUntil:    row.recur_until ? new Date(row.recur_until) : undefined,
    recurRuleId:   row.recur_rule_id ?? undefined,
    sourceEntryId: row.source_entry_id ?? undefined,
    memo:          row.memo ?? undefined,
  };
}

export interface CreateLedgerInput {
  kind:         LedgerKind;
  scope:        LedgerScope;
  spaceId:      string;
  title:        string;
  amount:       number;
  category:     LedgerCategory;
  method?:      string;
  occurredAt:   Date;
  status?:      LedgerStatus;
  recurFreq?:   RecurFreq;
  recurUntil?:  Date;
  recurRuleId?: string;
  sourceEntryId?: string;
  memo?:        string;
}

/** 공간(개인 공간 포함)의 원장 항목 조회. kind 미지정 시 수입+지출 모두. */
export async function getLedgerEntries(
  spaceId: string,
  opts: { kind?: LedgerKind } = {},
): Promise<LedgerEntry[]> {
  const supabase = createClient();
  let query = supabase
    .from('ledger_entries')
    .select('*')
    .eq('space_id', spaceId)
    .order('occurred_at', { ascending: true });
  if (opts.kind) query = query.eq('kind', opts.kind);

  const { data, error } = await query;
  if (error) {
    console.error('[getLedgerEntries] 조회 오류:', error.message);
    return [];
  }
  return (data as LedgerRow[]).map(rowToLedger);
}

export async function createLedgerEntry(input: CreateLedgerInput): Promise<LedgerEntry | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const { data, error } = await supabase
    .from('ledger_entries')
    .insert({
      kind:            input.kind,
      scope:           input.scope,
      space_id:        input.spaceId,
      owner_id:        user.id,
      title:           input.title,
      amount:          Math.max(0, Math.round(input.amount)),
      category:        input.category,
      method:          input.method ?? null,
      occurred_at:     input.occurredAt.toISOString(),
      status:          input.status ?? 'completed',
      recur_freq:      input.recurFreq ?? 'none',
      recur_until:     input.recurUntil ? input.recurUntil.toISOString().slice(0, 10) : null,
      recur_rule_id:   input.recurRuleId ?? null,
      source_entry_id: input.sourceEntryId ?? null,
      memo:            input.memo ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[createLedgerEntry] DB 오류:', error.message, '| code:', error.code);
    throw new Error(`DB 오류 [${error.code}]: ${error.message}`);
  }
  return rowToLedger(data as LedgerRow);
}

export async function updateLedgerEntry(
  id: string,
  updates: Partial<CreateLedgerInput>,
): Promise<boolean> {
  const supabase = createClient();
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title       !== undefined) dbUpdates.title       = updates.title;
  if (updates.amount      !== undefined) dbUpdates.amount      = Math.max(0, Math.round(updates.amount));
  if (updates.category    !== undefined) dbUpdates.category    = updates.category;
  if (updates.method      !== undefined) dbUpdates.method      = updates.method ?? null;
  if (updates.occurredAt  !== undefined) dbUpdates.occurred_at = updates.occurredAt.toISOString();
  if (updates.status      !== undefined) dbUpdates.status      = updates.status;
  if (updates.recurFreq   !== undefined) dbUpdates.recur_freq  = updates.recurFreq;
  if (updates.recurUntil  !== undefined) dbUpdates.recur_until = updates.recurUntil ? updates.recurUntil.toISOString().slice(0, 10) : null;
  if (updates.memo        !== undefined) dbUpdates.memo        = updates.memo ?? null;

  const { error } = await supabase.from('ledger_entries').update(dbUpdates).eq('id', id);
  if (error) { console.error('[updateLedgerEntry]', error.message); return false; }
  return true;
}

export async function updateLedgerStatus(id: string, status: LedgerStatus): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('ledger_entries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  return !error;
}

export async function deleteLedgerEntry(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('ledger_entries').delete().eq('id', id);
  return !error;
}

// ── Native API contracts (iOS/Android 네이티브 화면용 BFF) ────────────────
// Route Handler가 인증/HTTP만 담당하고, 실제 Supabase 쿼리는 이 파일에 모은다.

export interface NativeScheduleItem {
  id: string;
  title: string;
  type: ScheduleType;
  category?: ScheduleCategory;
  visibility?: ScheduleVisibility;
  automationPolicy?: AutomationPolicy;
  startTime: string;
  endTime?: string;
  allDay: boolean;
  status: ScheduleStatus;
  repeat: RepeatType;
  reminder: number;
  memo?: string;
  spaceId: string;
  createdBy: string;
  participantIds: string[];
}

export interface NativeLedgerItem {
  id: string;
  kind: LedgerKind;
  title: string;
  amount: number;
  category: LedgerCategory;
  method?: string;
  occurredAt: string;
  status: LedgerStatus;
  recurFreq: RecurFreq;
  memo?: string;
}


export interface NativeBudgetSummary {
  serverTime: string;
  month: string;
  personalSpaceId: string | null;
  incomeTotal: number;
  expenseTotal: number;
  net: number;
  savingsRate: number;
  fixedExpenseTotal: number;
  variableExpenseTotal: number;
  recurringIncomeTotal: number;
  onceIncomeTotal: number;
  pendingExpenseCount: number;
  pendingIncomeCount: number;
  completedExpenseCount: number;
  completedIncomeCount: number;
  recentEntries: NativeLedgerItem[];
  recurringEntries: NativeLedgerItem[];
  categoryTotals: Array<{ category: LedgerCategory; kind: LedgerKind; amount: number }>;
}

export interface NativeSpaceListItem {
  id: string;
  name: string;
  role: SpaceRole;
  memberCount: number;
  inviteCode?: string;
  isPersonal: boolean;
  isActive: boolean;
}

export interface NativeSpaceMemberItem {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  avatar?: string;
  role: SpaceRole;
  isMe: boolean;
}

export interface NativeSpaceSummary {
  serverTime: string;
  personalSpaceId: string | null;
  activeSpaceId: string | null;
  activeSpace: NativeSpaceListItem | null;
  spaces: NativeSpaceListItem[];
  members: NativeSpaceMemberItem[];
}

export interface NativeProfileSummary {
  id: string;
  email: string;
  name: string;
  displayName: string;
  realName: string | null;
  nameDisplayMode: NameDisplayMode;
  avatar: string | null;
  timezone: string;
  locale: string;
}

export interface NativeProfileUpdateInput {
  displayName?: string;
  realName?: string | null;
  nameDisplayMode?: NameDisplayMode;
}

export interface NativeCreateLedgerInput {
  kind: LedgerKind;
  title: string;
  amount: number;
  category: LedgerCategory;
  method?: string;
  occurredAt: string;
  recurFreq?: RecurFreq;
  memo?: string;
}

export interface NativeCalendarDay {
  date: string;
  day: number;
  count: number;
  types: ScheduleType[];
  completedCount: number;
  pendingCount: number;
  isToday: boolean;
}

export interface NativeHomeSummary {
  serverTime: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    avatar?: string;
    onboardingCompleted: boolean;
    timezone: string;
  };
  spaces: {
    activeSpaceId: string | null;
    activeSpaceName: string | null;
    personalSpaceId: string | null;
    sharedSpaceId: string | null;
    hasSharedSpace: boolean;
    activeRole: SpaceRole | null;
    memberCount: number;
  };
  schedules: {
    today: NativeScheduleItem[];
    upcoming: NativeScheduleItem[];
    range: NativeScheduleItem[];
    todayCount: number;
    completedCount: number;
    pendingCount: number;
    upcomingCount: number;
  };
  calendar: {
    selectedDate: string;
    month: string;
    week: NativeCalendarDay[];
    days: NativeCalendarDay[];
  };
  ledger: {
    month: string;
    incomeTotal: number;
    expenseTotal: number;
    net: number;
    recentEntries: NativeLedgerItem[];
  };
}

export interface NativeCreateScheduleInput {
  title: string;
  type?: ScheduleType;
  spaceId?: string;
  startTime: string;
  endTime?: string;
  allDay?: boolean;
  reminder?: number;
  repeat?: RepeatType;
  memo?: string;
  participantIds?: string[];
  visibility?: ScheduleVisibility;
}


export interface NativeUpdateScheduleInput {
  title?: string;
  type?: ScheduleType;
  startTime?: string;
  endTime?: string | null;
  allDay?: boolean;
  reminder?: number;
  repeat?: RepeatType;
  memo?: string | null;
  status?: ScheduleStatus;
  participantIds?: string[];
  visibility?: ScheduleVisibility;
}

function nativeScheduleItemFromRow(row: ScheduleRow): NativeScheduleItem {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    category: row.category ?? undefined,
    visibility: row.visibility ?? undefined,
    automationPolicy: row.automation_policy ?? undefined,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    allDay: row.all_day,
    status: row.status,
    repeat: row.repeat,
    reminder: row.reminder,
    memo: row.memo ?? undefined,
    spaceId: row.family_group_id,
    createdBy: row.created_by,
    participantIds: row.schedule_participants?.map((p) => p.user_id) ?? [],
  };
}

function nativeLedgerItemFromRow(row: LedgerRow): NativeLedgerItem {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    amount: row.amount ?? 0,
    category: row.category as LedgerCategory,
    method: row.method ?? undefined,
    occurredAt: row.occurred_at,
    status: row.status,
    recurFreq: row.recur_freq,
    memo: row.memo ?? undefined,
  };
}

function nativeProfileSummaryFromRow(row: ProfileRow): NativeProfileSummary {
  const displayName = row.display_name ?? row.name ?? '사용자';
  return {
    id: row.id,
    email: row.email ?? '',
    name: row.name ?? displayName,
    displayName,
    realName: row.real_name ?? null,
    nameDisplayMode: row.name_display_mode ?? 'nickname',
    avatar: row.avatar,
    timezone: row.timezone ?? 'Asia/Seoul',
    locale: row.locale ?? 'ko-KR',
  };
}

export async function getNativeProfileSummary(
  supabase: RouteSupabaseClient,
  userId: string,
): Promise<NativeProfileSummary> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,display_name,real_name,name_display_mode,email,avatar,timezone,locale')
    .eq('id', userId)
    .single();

  if (error || !data) throw new Error(error?.message ?? 'profile_not_found');
  return nativeProfileSummaryFromRow(data as ProfileRow);
}

export async function updateNativeProfile(
  supabase: RouteSupabaseClient,
  userId: string,
  input: NativeProfileUpdateInput,
): Promise<NativeProfileSummary> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.displayName !== undefined) {
    const displayName = input.displayName.trim();
    if (!displayName) throw new Error('display_name_required');
    if (displayName.length > 24) throw new Error('display_name_too_long');
    updates.display_name = displayName;
    updates.name = displayName;
  }

  if (input.realName !== undefined) {
    const realName = input.realName?.trim() ?? '';
    updates.real_name = realName || null;
  }

  if (input.nameDisplayMode !== undefined) {
    if (input.nameDisplayMode !== 'nickname' && input.nameDisplayMode !== 'real_name') {
      throw new Error('invalid_name_display_mode');
    }
    updates.name_display_mode = input.nameDisplayMode;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('id,name,display_name,real_name,name_display_mode,email,avatar,timezone,locale')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'profile_update_failed');
  return nativeProfileSummaryFromRow(data as ProfileRow);
}

function monthRange(date = new Date()) {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).toISOString(),
    label: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
  };
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function startOfWeek(date = new Date()): Date {
  const day = (date.getDay() + 6) % 7; // Monday = 0
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - day);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function dayRange(date = new Date()) {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString(),
    end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).toISOString(),
  };
}

function nativeCalendarDayFromDate(date: Date, schedules: NativeScheduleItem[], todayKey: string): NativeCalendarDay {
  const key = dateKey(date);
  const daySchedules = schedules.filter((item) => dateKey(new Date(item.startTime)) === key);
  const types = Array.from(new Set(daySchedules.map((item) => item.type))).slice(0, 3);

  return {
    date: key,
    day: date.getDate(),
    count: daySchedules.length,
    types,
    completedCount: daySchedules.filter((item) => item.status === 'completed').length,
    pendingCount: daySchedules.filter((item) => item.status !== 'completed').length,
    isToday: key === todayKey,
  };
}

function nativeCalendarMonthDays(baseDate: Date, schedules: NativeScheduleItem[], todayKey: string): NativeCalendarDay[] {
  const lastDay = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
  return Array.from({ length: lastDay }, (_, index) =>
    nativeCalendarDayFromDate(new Date(baseDate.getFullYear(), baseDate.getMonth(), index + 1), schedules, todayKey)
  );
}

function nativeCalendarWeekDays(baseDate: Date, schedules: NativeScheduleItem[], todayKey: string): NativeCalendarDay[] {
  const start = startOfWeek(baseDate);
  return Array.from({ length: 7 }, (_, index) =>
    nativeCalendarDayFromDate(addDays(start, index), schedules, todayKey)
  );
}

function futureRange(days: number, date = new Date()) {
  return {
    start: date.toISOString(),
    end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 23, 59, 59, 999).toISOString(),
  };
}

async function materializeNativeRecurringLedger(
  supabase: RouteSupabaseClient,
  userId: string,
  spaceId: string,
  scope: LedgerScope,
): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const lastDayOfMonth = monthEnd.getDate();

  const { data, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('space_id', spaceId)
    .eq('scope', scope)
    .eq('owner_id', userId)
    .neq('recur_freq', 'none')
    .order('occurred_at', { ascending: true });

  if (error || !data?.length) return 0;
  const rows = data as LedgerRow[];
  const series = new Map<string, LedgerRow[]>();

  for (const row of rows) {
    const key = `${row.kind}__${row.category}__${row.title}__${row.recur_freq}`;
    const list = series.get(key) ?? [];
    list.push(row);
    series.set(key, list);
  }

  let created = 0;

  for (const instances of series.values()) {
    const latest = instances[instances.length - 1];
    const latestDate = new Date(latest.occurred_at);
    const recurUntil = latest.recur_until ? new Date(latest.recur_until) : null;
    const targets: Date[] = [];

    if (latest.recur_freq === 'monthly') {
      if (latestDate >= monthStart) continue;
      const day = Math.min(latestDate.getDate(), lastDayOfMonth);
      targets.push(new Date(Date.UTC(now.getFullYear(), now.getMonth(), day)));
    } else if (latest.recur_freq === 'yearly') {
      if (latestDate >= monthStart) continue;
      if (latestDate.getMonth() !== now.getMonth()) continue;
      const day = Math.min(latestDate.getDate(), lastDayOfMonth);
      targets.push(new Date(Date.UTC(now.getFullYear(), now.getMonth(), day)));
    } else if (latest.recur_freq === 'weekly') {
      const cursor = new Date(latestDate);
      for (let index = 0; index < 60; index += 1) {
        cursor.setDate(cursor.getDate() + 7);
        if (cursor > monthEnd) break;
        if (cursor >= monthStart) {
          targets.push(new Date(Date.UTC(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())));
        }
      }
    }

    for (const target of targets) {
      if (recurUntil && target > recurUntil) continue;
      const duplicated = instances.some((instance) => {
        const date = new Date(instance.occurred_at);
        const sameMonth = date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth();
        return latest.recur_freq === 'weekly' ? sameMonth && date.getDate() === target.getDate() : sameMonth;
      });
      if (duplicated) continue;

      const { error: insertError } = await supabase.from('ledger_entries').insert({
        kind: latest.kind,
        scope: latest.scope,
        space_id: spaceId,
        owner_id: userId,
        title: latest.title,
        amount: latest.amount,
        category: latest.category,
        method: latest.method,
        occurred_at: target.toISOString(),
        status: 'pending',
        recur_freq: latest.recur_freq,
        recur_until: latest.recur_until,
        recur_rule_id: latest.recur_rule_id,
        memo: latest.memo,
      });

      if (!insertError) created += 1;
    }
  }

  return created;
}

async function getNativePersonalLedgerRow(
  supabase: RouteSupabaseClient,
  userId: string,
  id: string,
): Promise<LedgerRow> {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('id', id)
    .eq('owner_id', userId)
    .eq('scope', 'personal')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('ledger_entry_not_found');
  return data as LedgerRow;
}

export async function getNativeLedgerEntryById(
  supabase: RouteSupabaseClient,
  userId: string,
  id: string,
): Promise<NativeLedgerItem> {
  return nativeLedgerItemFromRow(await getNativePersonalLedgerRow(supabase, userId, id));
}

export async function updateNativeLedgerEntry(
  supabase: RouteSupabaseClient,
  userId: string,
  id: string,
  input: Partial<NativeCreateLedgerInput> & { status?: LedgerStatus },
): Promise<NativeLedgerItem> {
  const current = await getNativePersonalLedgerRow(supabase, userId, id);

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.kind !== undefined) updates.kind = input.kind;
  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) throw new Error('title_required');
    updates.title = title;
  }
  if (input.amount !== undefined) {
    const amount = Math.max(0, Math.round(Number(input.amount ?? 0)));
    if (!amount) throw new Error('amount_required');
    updates.amount = amount;
  }
  if (input.category !== undefined) updates.category = input.category;
  const nextKind = input.kind ?? current.kind;
  if (nextKind === 'income') {
    updates.method = null;
  } else if (input.method !== undefined) {
    updates.method = input.method ?? null;
  }
  if (input.occurredAt !== undefined) {
    const occurredAt = new Date(input.occurredAt);
    if (Number.isNaN(occurredAt.getTime())) throw new Error('invalid_occurred_at');
    updates.occurred_at = occurredAt.toISOString();
  }
  if (input.recurFreq !== undefined) updates.recur_freq = input.recurFreq;
  if (input.status !== undefined) updates.status = input.status;
  if (input.memo !== undefined) updates.memo = input.memo?.trim() || null;

  const { data, error } = await supabase
    .from('ledger_entries')
    .update(updates)
    .eq('id', id)
    .eq('owner_id', userId)
    .eq('scope', 'personal')
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? 'ledger_update_failed');
  return nativeLedgerItemFromRow(data as LedgerRow);
}

export async function deleteNativeLedgerEntry(
  supabase: RouteSupabaseClient,
  userId: string,
  id: string,
): Promise<boolean> {
  await getNativePersonalLedgerRow(supabase, userId, id);
  const { error } = await supabase
    .from('ledger_entries')
    .delete()
    .eq('id', id)
    .eq('owner_id', userId)
    .eq('scope', 'personal');
  if (error) throw new Error(error.message);
  return true;
}

export async function createNativeLedgerEntry(
  supabase: RouteSupabaseClient,
  userId: string,
  input: NativeCreateLedgerInput,
): Promise<NativeLedgerItem> {
  const { personalSpaceId, activeSpaceId, sharedSpaceId } = await getNativeProfileContext(supabase, userId);
  const personalBudgetSpaceId = personalSpaceId ?? (sharedSpaceId ? null : activeSpaceId);
  if (!personalBudgetSpaceId) throw new Error('personal_space_required');

  const title = input.title?.trim();
  if (!title) throw new Error('title_required');
  const amount = Math.max(0, Math.round(Number(input.amount ?? 0)));
  if (!amount) throw new Error('amount_required');
  const occurredAt = new Date(input.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) throw new Error('invalid_occurred_at');

  const recurFreq = input.recurFreq ?? 'none';
  const status: LedgerStatus = recurFreq === 'none' ? 'completed' : 'pending';

  const { data, error } = await supabase
    .from('ledger_entries')
    .insert({
      kind: input.kind,
      scope: 'personal',
      space_id: personalBudgetSpaceId,
      owner_id: userId,
      title,
      amount,
      category: input.category,
      method: input.kind === 'expense' ? input.method ?? null : null,
      occurred_at: occurredAt.toISOString(),
      status,
      recur_freq: recurFreq,
      memo: input.memo?.trim() || null,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? 'ledger_create_failed');
  return nativeLedgerItemFromRow(data as LedgerRow);
}

export async function getNativeBudgetSummary(
  supabase: RouteSupabaseClient,
  userId: string,
  options: { month?: string } = {},
): Promise<NativeBudgetSummary> {
  const { personalSpaceId, activeSpaceId, sharedSpaceId } = await getNativeProfileContext(supabase, userId);
  const personalBudgetSpaceId = personalSpaceId ?? (sharedSpaceId ? null : activeSpaceId);
  const base = options.month && /^\d{4}-\d{2}$/.test(options.month)
    ? new Date(`${options.month}-01T00:00:00.000Z`)
    : new Date();
  const range = monthRange(base);

  if (!personalBudgetSpaceId) {
    return {
      serverTime: new Date().toISOString(),
      month: range.label,
      personalSpaceId: null,
      incomeTotal: 0,
      expenseTotal: 0,
      net: 0,
      savingsRate: 0,
      fixedExpenseTotal: 0,
      variableExpenseTotal: 0,
      recurringIncomeTotal: 0,
      onceIncomeTotal: 0,
      pendingExpenseCount: 0,
      pendingIncomeCount: 0,
      completedExpenseCount: 0,
      completedIncomeCount: 0,
      recentEntries: [],
      recurringEntries: [],
      categoryTotals: [],
    };
  }

  await materializeNativeRecurringLedger(supabase, userId, personalBudgetSpaceId, 'personal');

  const { data, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('space_id', personalBudgetSpaceId)
    .eq('scope', 'personal')
    .gte('occurred_at', range.start)
    .lte('occurred_at', range.end)
    .order('occurred_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as LedgerRow[];
  const incomeRows = rows.filter((row) => row.kind === 'income');
  const expenseRows = rows.filter((row) => row.kind === 'expense');
  const incomeTotal = incomeRows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const expenseTotal = expenseRows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const net = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? Math.max(0, Math.min(100, Math.round((net / incomeTotal) * 100))) : 0;

  const categoryMap = new Map<string, { category: LedgerCategory; kind: LedgerKind; amount: number }>();
  for (const row of rows) {
    const category = row.category as LedgerCategory;
    const key = `${row.kind}:${category}`;
    const current = categoryMap.get(key) ?? { category, kind: row.kind, amount: 0 };
    current.amount += row.amount ?? 0;
    categoryMap.set(key, current);
  }

  return {
    serverTime: new Date().toISOString(),
    month: range.label,
    personalSpaceId: personalBudgetSpaceId,
    incomeTotal,
    expenseTotal,
    net,
    savingsRate,
    fixedExpenseTotal: expenseRows.filter((row) => row.recur_freq !== 'none').reduce((sum, row) => sum + (row.amount ?? 0), 0),
    variableExpenseTotal: expenseRows.filter((row) => row.recur_freq === 'none').reduce((sum, row) => sum + (row.amount ?? 0), 0),
    recurringIncomeTotal: incomeRows.filter((row) => row.recur_freq !== 'none').reduce((sum, row) => sum + (row.amount ?? 0), 0),
    onceIncomeTotal: incomeRows.filter((row) => row.recur_freq === 'none').reduce((sum, row) => sum + (row.amount ?? 0), 0),
    pendingExpenseCount: expenseRows.filter((row) => row.status !== 'completed').length,
    pendingIncomeCount: incomeRows.filter((row) => row.status !== 'completed').length,
    completedExpenseCount: expenseRows.filter((row) => row.status === 'completed').length,
    completedIncomeCount: incomeRows.filter((row) => row.status === 'completed').length,
    recentEntries: rows.slice(0, 12).map(nativeLedgerItemFromRow),
    recurringEntries: rows
      .filter((row) => row.recur_freq !== 'none')
      .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
      .slice(0, 12)
      .map(nativeLedgerItemFromRow),
    categoryTotals: Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount),
  };
}

export async function getNativeSpaceSummary(
  supabase: RouteSupabaseClient,
  userId: string,
): Promise<NativeSpaceSummary> {
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('family_group_id,preferences')
    .eq('id', userId)
    .single();

  if (profileError || !profileData) throw new Error(profileError?.message ?? 'profile_not_found');

  const profile = profileData as Pick<ProfileRow, 'family_group_id' | 'preferences'>;
  const preferences = (profile.preferences ?? {}) as Partial<OnboardingPreferences>;
  const personalSpaceId = preferences.personalSpaceId ?? null;

  const { data: membershipRows, error: membershipError } = await supabase
    .from('space_members')
    .select('space_id, role, joined_at')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true });

  if (membershipError) throw new Error(membershipError.message);

  const memberships = (membershipRows ?? []) as Array<Pick<SpaceMemberRow, 'space_id' | 'role' | 'joined_at'>>;
  const membershipSpaceIds = memberships.map((row) => row.space_id);
  const activeSpaceId = profile.family_group_id ?? personalSpaceId ?? membershipSpaceIds[0] ?? null;
  const requestedSpaceIds = [...new Set([
    ...membershipSpaceIds,
    ...(activeSpaceId ? [activeSpaceId] : []),
    ...(personalSpaceId ? [personalSpaceId] : []),
  ])];

  if (requestedSpaceIds.length === 0) {
    return {
      serverTime: new Date().toISOString(),
      personalSpaceId,
      activeSpaceId,
      activeSpace: null,
      spaces: [],
      members: [],
    };
  }

  const [{ data: groupRows, error: groupsError }, { data: memberCountRows, error: countsError }] = await Promise.all([
    supabase
      .from('family_groups')
      .select('id,name,invite_code,created_by,created_at')
      .in('id', requestedSpaceIds),
    supabase
      .from('space_members')
      .select('space_id')
      .in('space_id', requestedSpaceIds),
  ]);

  if (groupsError) throw new Error(groupsError.message);
  if (countsError) throw new Error(countsError.message);

  const roleMap = new Map(memberships.map((row) => [row.space_id, row.role]));
  const countMap = new Map<string, number>();
  for (const row of (memberCountRows ?? []) as Array<{ space_id: string }>) {
    countMap.set(row.space_id, (countMap.get(row.space_id) ?? 0) + 1);
  }

  const orderMap = new Map(requestedSpaceIds.map((id, index) => [id, index]));
  const spaces = ((groupRows ?? []) as Array<FamilyGroupRow & { created_by: string }>)
    .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
    .map((group): NativeSpaceListItem => {
      const isPersonal = group.id === personalSpaceId;
      const fallbackRole: SpaceRole = group.created_by === userId ? 'admin' : 'viewer';
      return {
        id: group.id,
        name: group.name,
        role: roleMap.get(group.id) ?? fallbackRole,
        memberCount: countMap.get(group.id) ?? (isPersonal ? 1 : 0),
        inviteCode: isPersonal ? undefined : group.invite_code ?? undefined,
        isPersonal,
        isActive: group.id === activeSpaceId,
      };
    });

  const activeSpace = spaces.find((space) => space.id === activeSpaceId) ?? spaces[0] ?? null;
  let members: NativeSpaceMemberItem[] = [];

  if (activeSpace) {
    const { data: activeMemberRows, error: activeMembersError } = await supabase
      .from('space_members')
      .select('*')
      .eq('space_id', activeSpace.id)
      .order('joined_at', { ascending: true });

    if (activeMembersError) throw new Error(activeMembersError.message);

    const rows = (activeMemberRows ?? []) as SpaceMemberRow[];
    const userIds = [...new Set(rows.map((row) => row.user_id))];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from('profiles').select('*').in('id', userIds)
      : { data: [] as ProfileRow[] };
    const rowsWithProfiles = mergeMemberProfiles(rows, profiles as ProfileRow[]);

    members = rowsWithProfiles.map((row) => {
      const profile = row.profiles;
      const displayName = row.nickname ?? profile?.display_name ?? profile?.name ?? '사용자';
      return {
        id: row.id,
        userId: row.user_id,
        displayName,
        email: profile?.email ?? '',
        avatar: profile?.avatar ?? undefined,
        role: row.role,
        isMe: row.user_id === userId,
      };
    });
  }

  return {
    serverTime: new Date().toISOString(),
    personalSpaceId,
    activeSpaceId: activeSpace?.id ?? activeSpaceId,
    activeSpace,
    spaces,
    members,
  };
}

async function getNativeSharedSpaceCount(
  supabase: RouteSupabaseClient,
  userId: string,
): Promise<number> {
  const { personalSpaceId } = await getNativeProfileContext(supabase, userId);
  const { data, error } = await supabase
    .from('space_members')
    .select('space_id')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return [...new Set(((data ?? []) as Array<{ space_id: string }>).map((row) => row.space_id))]
    .filter((spaceId) => spaceId !== personalSpaceId)
    .length;
}

export async function createNativeSpace(
  supabase: RouteSupabaseClient,
  userId: string,
  name: string,
): Promise<NativeSpaceSummary> {
  const nextName = name.trim();
  if (!nextName) throw new Error('space_name_required');
  if (nextName.length > 40) throw new Error('space_name_too_long');

  const sharedCount = await getNativeSharedSpaceCount(supabase, userId);
  if (sharedCount >= 2) throw new Error('shared_space_limit_reached');

  const inviteCode = generateInviteCode();
  const { data: group, error: groupError } = await supabase
    .from('family_groups')
    .insert({ name: nextName, invite_code: inviteCode, created_by: userId })
    .select('id')
    .single();

  if (groupError || !group) throw new Error(groupError?.message ?? 'space_create_failed');

  const spaceId = (group as { id: string }).id;
  const { error: memberError } = await supabase
    .from('space_members')
    .insert({ space_id: spaceId, user_id: userId, role: 'admin' });

  if (memberError) throw new Error(memberError.message);

  await supabase
    .from('profiles')
    .update({ family_group_id: spaceId })
    .eq('id', userId);

  return getNativeSpaceSummary(supabase, userId);
}

export async function joinNativeSpaceByCode(
  admin: RouteSupabaseClient,
  userSupabase: RouteSupabaseClient,
  userId: string,
  code: string,
): Promise<NativeSpaceSummary> {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) throw new Error('invite_code_required');

  const sharedCount = await getNativeSharedSpaceCount(userSupabase, userId);
  if (sharedCount >= 2) throw new Error('shared_space_limit_reached');

  const { data: group, error: groupError } = await admin
    .from('family_groups')
    .select('id,name,invite_code_expires_at')
    .eq('invite_code', normalizedCode)
    .single();

  if (groupError || !group) throw new Error('invalid_code');
  if (
    (group as { invite_code_expires_at?: string | null }).invite_code_expires_at &&
    new Date((group as { invite_code_expires_at: string }).invite_code_expires_at) < new Date()
  ) {
    throw new Error('expired_code');
  }

  const spaceId = (group as { id: string }).id;
  const { data: existing } = await admin
    .from('space_members')
    .select('id')
    .eq('space_id', spaceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    const { error: memberError } = await admin
      .from('space_members')
      .insert({ space_id: spaceId, user_id: userId, role: 'viewer' });

    if (memberError) throw new Error(memberError.message);
  }

  await admin
    .from('profiles')
    .update({ family_group_id: spaceId })
    .eq('id', userId);

  return getNativeSpaceSummary(userSupabase, userId);
}

async function requireNativeSpaceAdmin(
  supabase: RouteSupabaseClient,
  userId: string,
  spaceId: string,
): Promise<void> {
  const { data: member } = await supabase
    .from('space_members')
    .select('role')
    .eq('space_id', spaceId)
    .eq('user_id', userId)
    .maybeSingle();

  if ((member as { role?: SpaceRole } | null)?.role === 'admin') return;

  const { data: group } = await supabase
    .from('family_groups')
    .select('created_by')
    .eq('id', spaceId)
    .maybeSingle();

  if ((group as { created_by?: string } | null)?.created_by === userId) return;
  throw new Error('space_admin_required');
}

async function assertNativeSpaceIsNotPersonal(
  supabase: RouteSupabaseClient,
  userId: string,
  spaceId: string,
): Promise<void> {
  const { personalSpaceId } = await getNativeProfileContext(supabase, userId);
  if (personalSpaceId === spaceId) throw new Error('personal_space_locked');
}

export async function updateNativeSpaceName(
  supabase: RouteSupabaseClient,
  userId: string,
  spaceId: string,
  name: string,
): Promise<NativeSpaceSummary> {
  await requireNativeSpaceAdmin(supabase, userId, spaceId);
  const nextName = name.trim();
  if (!nextName) throw new Error('space_name_required');
  if (nextName.length > 40) throw new Error('space_name_too_long');

  const { error } = await supabase
    .from('family_groups')
    .update({ name: nextName })
    .eq('id', spaceId);

  if (error) throw new Error(error.message);
  return getNativeSpaceSummary(supabase, userId);
}

export async function regenerateNativeSpaceInviteCode(
  supabase: RouteSupabaseClient,
  userId: string,
  spaceId: string,
): Promise<NativeSpaceSummary> {
  await requireNativeSpaceAdmin(supabase, userId, spaceId);
  await assertNativeSpaceIsNotPersonal(supabase, userId, spaceId);

  const { error } = await supabase
    .from('family_groups')
    .update({ invite_code: generateInviteCode(), invite_code_expires_at: null })
    .eq('id', spaceId);

  if (error) throw new Error(error.message);
  return getNativeSpaceSummary(supabase, userId);
}

export async function updateNativeSpaceMemberRole(
  supabase: RouteSupabaseClient,
  userId: string,
  spaceId: string,
  memberUserId: string,
  role: SpaceRole,
): Promise<NativeSpaceSummary> {
  await requireNativeSpaceAdmin(supabase, userId, spaceId);
  await assertNativeSpaceIsNotPersonal(supabase, userId, spaceId);
  if (!['admin', 'editor', 'viewer'].includes(role)) throw new Error('invalid_role');

  const { error } = await supabase
    .from('space_members')
    .update({ role })
    .eq('space_id', spaceId)
    .eq('user_id', memberUserId);

  if (error) throw new Error(error.message);
  return getNativeSpaceSummary(supabase, userId);
}

export async function removeNativeSpaceMember(
  supabase: RouteSupabaseClient,
  userId: string,
  spaceId: string,
  memberUserId: string,
): Promise<NativeSpaceSummary> {
  await requireNativeSpaceAdmin(supabase, userId, spaceId);
  await assertNativeSpaceIsNotPersonal(supabase, userId, spaceId);
  if (memberUserId === userId) throw new Error('cannot_remove_self');

  const { error } = await supabase
    .from('space_members')
    .delete()
    .eq('space_id', spaceId)
    .eq('user_id', memberUserId);

  if (error) throw new Error(error.message);
  return getNativeSpaceSummary(supabase, userId);
}

export async function getNativeHomeSummary(
  supabase: RouteSupabaseClient,
  userId: string,
): Promise<NativeHomeSummary> {
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id,name,display_name,email,avatar,family_group_id,onboarding_completed_at,timezone,preferences')
    .eq('id', userId)
    .single();

  if (profileError || !profileData) {
    throw new Error(profileError?.message ?? 'profile_not_found');
  }

  const profile = profileData as Pick<ProfileRow,
    'id' | 'name' | 'display_name' | 'email' | 'avatar' | 'family_group_id' |
    'onboarding_completed_at' | 'timezone' | 'preferences'
  >;
  const preferences = (profile.preferences ?? {}) as Partial<OnboardingPreferences>;
  const personalSpaceId = preferences.personalSpaceId ?? null;
  const activeSpaceId = profile.family_group_id ?? personalSpaceId ?? null;
  const sharedSpaceId = activeSpaceId && activeSpaceId !== personalSpaceId ? activeSpaceId : null;
  const hasSharedSpace = !!sharedSpaceId;

  let activeSpaceName: string | null = null;
  let memberCount = 0;
  let activeRole: SpaceRole | null = null;

  if (activeSpaceId) {
    const [{ data: space }, { count }, { data: member }] = await Promise.all([
      supabase.from('family_groups').select('name').eq('id', activeSpaceId).maybeSingle(),
      supabase.from('space_members').select('*', { count: 'exact', head: true }).eq('space_id', activeSpaceId),
      supabase.from('space_members').select('role').eq('space_id', activeSpaceId).eq('user_id', userId).maybeSingle(),
    ]);
    activeSpaceName = (space as { name?: string } | null)?.name ?? null;
    memberCount = count ?? 0;
    activeRole = ((member as { role?: SpaceRole } | null)?.role ?? null);
  }

  const now = new Date();
  const today = dayRange(now);
  const todayKey = dateKey(now);
  const month = monthRange(now);
  const nextTwoWeeks = futureRange(14, now);
  const weekStart = startOfWeek(now);
  const scheduleWindowStart = new Date(Math.min(new Date(month.start).getTime(), weekStart.getTime()));
  const scheduleWindowEnd = new Date(Math.max(
    new Date(month.end).getTime(),
    new Date(nextTwoWeeks.end).getTime(),
    endOfDay(addDays(weekStart, 6)).getTime(),
  ));
  let todaySchedules: NativeScheduleItem[] = [];
  let upcomingSchedules: NativeScheduleItem[] = [];
  let calendarSchedules: NativeScheduleItem[] = [];

  if (activeSpaceId) {
    const { data: scheduleRows, error: schedulesError } = await supabase
      .from('schedules')
      .select('*, schedule_participants (user_id)')
      .eq('family_group_id', activeSpaceId)
      .or(`visibility.neq.private,visibility.is.null,created_by.eq.${userId}`)
      .gte('start_time', scheduleWindowStart.toISOString())
      .lte('start_time', scheduleWindowEnd.toISOString())
      .order('start_time', { ascending: true });

    if (schedulesError) throw new Error(schedulesError.message);

    const scheduleItems = ((scheduleRows ?? []) as ScheduleRow[])
      .filter((row) => !(row.type === 'expense' && row.repeat === 'none'))
      .map(nativeScheduleItemFromRow);

    calendarSchedules = scheduleItems;
    todaySchedules = scheduleItems.filter((item) => item.startTime >= today.start && item.startTime <= today.end);
    upcomingSchedules = scheduleItems.filter((item) => item.startTime > today.end && item.startTime <= nextTwoWeeks.end);
  }

  const personalBudgetSpaceId = personalSpaceId ?? (hasSharedSpace ? null : activeSpaceId);
  let ledgerRows: LedgerRow[] = [];

  if (personalBudgetSpaceId) {
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('space_id', personalBudgetSpaceId)
      .eq('scope', 'personal')
      .gte('occurred_at', month.start)
      .lte('occurred_at', month.end)
      .order('occurred_at', { ascending: false });

    if (error) throw new Error(error.message);
    ledgerRows = (data ?? []) as LedgerRow[];
  }

  const incomeTotal = ledgerRows
    .filter((row) => row.kind === 'income')
    .reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const expenseTotal = ledgerRows
    .filter((row) => row.kind === 'expense')
    .reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const completedCount = todaySchedules.filter((item) => item.status === 'completed').length;
  const pendingCount = todaySchedules.filter((item) => item.status !== 'completed').length;

  return {
    serverTime: new Date().toISOString(),
    user: {
      id: profile.id,
      displayName: profile.display_name ?? profile.name ?? '사용자',
      email: profile.email ?? '',
      avatar: profile.avatar ?? undefined,
      onboardingCompleted: !!profile.onboarding_completed_at,
      timezone: profile.timezone ?? 'Asia/Seoul',
    },
    spaces: {
      activeSpaceId,
      activeSpaceName,
      personalSpaceId,
      sharedSpaceId,
      hasSharedSpace,
      activeRole,
      memberCount,
    },
    schedules: {
      today: todaySchedules,
      upcoming: upcomingSchedules.slice(0, 10),
      range: calendarSchedules,
      todayCount: todaySchedules.length,
      completedCount,
      pendingCount,
      upcomingCount: upcomingSchedules.length,
    },
    calendar: {
      selectedDate: todayKey,
      month: month.label,
      week: nativeCalendarWeekDays(now, calendarSchedules, todayKey),
      days: nativeCalendarMonthDays(now, calendarSchedules, todayKey),
    },
    ledger: {
      month: month.label,
      incomeTotal,
      expenseTotal,
      net: incomeTotal - expenseTotal,
      recentEntries: ledgerRows.slice(0, 8).map(nativeLedgerItemFromRow),
    },
  };
}


async function getNativeProfileContext(supabase: RouteSupabaseClient, userId: string) {
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('family_group_id,preferences')
    .eq('id', userId)
    .single();

  if (profileError || !profileData) throw new Error(profileError?.message ?? 'profile_not_found');

  const profile = profileData as Pick<ProfileRow, 'family_group_id' | 'preferences'>;
  const preferences = (profile.preferences ?? {}) as Partial<OnboardingPreferences>;
  const personalSpaceId = preferences.personalSpaceId ?? null;
  const activeSpaceId = profile.family_group_id ?? personalSpaceId ?? null;
  const sharedSpaceId = activeSpaceId && activeSpaceId !== personalSpaceId ? activeSpaceId : null;

  return { personalSpaceId, activeSpaceId, sharedSpaceId };
}

async function assertNativeScheduleWritable(
  supabase: RouteSupabaseClient,
  userId: string,
  schedule: Pick<ScheduleRow, 'created_by' | 'family_group_id' | 'visibility'>,
) {
  if (schedule.created_by === userId && schedule.visibility === 'private') return;
  const { data: member } = await supabase
    .from('space_members')
    .select('role')
    .eq('space_id', schedule.family_group_id)
    .eq('user_id', userId)
    .maybeSingle();
  const role = (member as { role?: SpaceRole } | null)?.role;
  if (role !== 'admin' && role !== 'editor') throw new Error('space_editor_required');
}

export async function createNativeSchedule(
  supabase: RouteSupabaseClient,
  userId: string,
  input: NativeCreateScheduleInput,
): Promise<NativeScheduleItem> {
  const title = input.title?.trim();
  if (!title) throw new Error('title_required');

  const type = input.type ?? 'personal';
  const startTime = new Date(input.startTime);
  if (Number.isNaN(startTime.getTime())) throw new Error('invalid_start_time');
  const endTime = input.endTime ? new Date(input.endTime) : undefined;
  if (endTime && Number.isNaN(endTime.getTime())) throw new Error('invalid_end_time');

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('family_group_id,preferences')
    .eq('id', userId)
    .single();

  if (profileError || !profileData) throw new Error(profileError?.message ?? 'profile_not_found');

  const profile = profileData as Pick<ProfileRow, 'family_group_id' | 'preferences'>;
  const preferences = (profile.preferences ?? {}) as Partial<OnboardingPreferences>;
  const personalSpaceId = preferences.personalSpaceId ?? null;
  const activeSpaceId = profile.family_group_id ?? null;
  const sharedSpaceId = activeSpaceId && activeSpaceId !== personalSpaceId ? activeSpaceId : null;
  const visibility = input.visibility ?? inferVisibility(type);
  const isPrivateTarget = type === 'personal' || visibility === 'private';
  const targetSpaceId = isPrivateTarget
    ? (personalSpaceId ?? (sharedSpaceId ? null : activeSpaceId))
    : (input.spaceId ?? sharedSpaceId);

  if (!targetSpaceId) throw new Error('space_required');

  if (targetSpaceId !== personalSpaceId && visibility !== 'private') {
    const { data: member } = await supabase
      .from('space_members')
      .select('role')
      .eq('space_id', targetSpaceId)
      .eq('user_id', userId)
      .maybeSingle();
    const role = (member as { role?: SpaceRole } | null)?.role;
    if (role !== 'admin' && role !== 'editor') throw new Error('space_editor_required');
  }

  const repeat = input.repeat ?? 'none';
  const category = inferCategory(type);
  const automationPolicy = type === 'expense' && repeat === 'none'
    ? 'reminder_only'
    : inferAutomationPolicy(type);
  const status: ScheduleStatus = type === 'expense' && repeat === 'none' ? 'completed' : 'pending';
  const participantIds = targetSpaceId === personalSpaceId
    ? [userId]
    : (input.participantIds?.length ? input.participantIds : [userId]);

  const { data: schedule, error } = await supabase
    .from('schedules')
    .insert({
      title,
      type,
      category,
      visibility,
      automation_policy: automationPolicy,
      start_time: startTime.toISOString(),
      end_time: endTime?.toISOString() ?? null,
      all_day: input.allDay ?? false,
      status,
      reminder: input.reminder ?? 15,
      repeat,
      memo: input.memo?.trim() || null,
      family_group_id: targetSpaceId,
      created_by: userId,
    })
    .select()
    .single();

  if (error || !schedule) throw new Error(error?.message ?? 'schedule_create_failed');

  if (participantIds.length > 0) {
    const { error: participantError } = await supabase.from('schedule_participants').insert(
      participantIds.map((participantId) => ({ schedule_id: schedule.id, user_id: participantId })),
    );
    if (participantError) throw new Error(participantError.message);
  }

  return nativeScheduleItemFromRow({
    ...(schedule as ScheduleRow),
    schedule_participants: participantIds.map((participantId) => ({ user_id: participantId })),
  });
}


export async function getNativeSchedules(
  supabase: RouteSupabaseClient,
  userId: string,
  options: { from?: string; to?: string; filter?: ScheduleType | 'all'; search?: string } = {},
): Promise<NativeScheduleItem[]> {
  const { activeSpaceId } = await getNativeProfileContext(supabase, userId);
  if (!activeSpaceId) return [];

  const now = new Date();
  const from = options.from ? new Date(options.from) : addDays(now, -30);
  const to = options.to ? new Date(options.to) : addDays(now, 365);
  if (Number.isNaN(from.getTime())) throw new Error('invalid_from');
  if (Number.isNaN(to.getTime())) throw new Error('invalid_to');

  let query = supabase
    .from('schedules')
    .select('*, schedule_participants (user_id)')
    .eq('family_group_id', activeSpaceId)
    .or(`visibility.neq.private,visibility.is.null,created_by.eq.${userId}`)
    .gte('start_time', from.toISOString())
    .lte('start_time', to.toISOString())
    .order('start_time', { ascending: true });

  if (options.filter && options.filter !== 'all') query = query.eq('type', options.filter);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const search = options.search?.trim().toLowerCase();
  return ((data ?? []) as ScheduleRow[])
    .filter((row) => !(row.type === 'expense' && row.repeat === 'none'))
    .filter((row) => !search || row.title.toLowerCase().includes(search) || (row.memo ?? '').toLowerCase().includes(search))
    .map(nativeScheduleItemFromRow);
}

export async function getNativeScheduleById(
  supabase: RouteSupabaseClient,
  userId: string,
  id: string,
): Promise<NativeScheduleItem | null> {
  const { data, error } = await supabase
    .from('schedules')
    .select('*, schedule_participants (user_id)')
    .eq('id', id)
    .or(`visibility.neq.private,visibility.is.null,created_by.eq.${userId}`)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return nativeScheduleItemFromRow(data as ScheduleRow);
}

export async function updateNativeSchedule(
  supabase: RouteSupabaseClient,
  userId: string,
  id: string,
  input: NativeUpdateScheduleInput,
): Promise<NativeScheduleItem> {
  const { data: existing, error: findError } = await supabase
    .from('schedules')
    .select('*, schedule_participants (user_id)')
    .eq('id', id)
    .or(`visibility.neq.private,visibility.is.null,created_by.eq.${userId}`)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (!existing) throw new Error('schedule_not_found');

  const current = existing as ScheduleRow;
  await assertNativeScheduleWritable(supabase, userId, current);

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) throw new Error('title_required');
    updates.title = title;
  }
  if (input.type !== undefined) {
    updates.type = input.type;
    updates.category = inferCategory(input.type);
    updates.automation_policy = inferAutomationPolicy(input.type);
    updates.visibility = input.visibility ?? inferVisibility(input.type);
  } else if (input.visibility !== undefined) {
    updates.visibility = input.visibility;
  }
  if (input.startTime !== undefined) {
    const startTime = new Date(input.startTime);
    if (Number.isNaN(startTime.getTime())) throw new Error('invalid_start_time');
    updates.start_time = startTime.toISOString();
  }
  if (input.endTime !== undefined) {
    if (input.endTime === null || input.endTime === '') {
      updates.end_time = null;
    } else {
      const endTime = new Date(input.endTime);
      if (Number.isNaN(endTime.getTime())) throw new Error('invalid_end_time');
      updates.end_time = endTime.toISOString();
    }
  }
  if (input.allDay !== undefined) updates.all_day = input.allDay;
  if (input.status !== undefined) updates.status = input.status;
  if (input.reminder !== undefined) updates.reminder = input.reminder;
  if (input.repeat !== undefined) updates.repeat = input.repeat;
  if (input.memo !== undefined) updates.memo = input.memo?.trim() || null;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('schedules').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
  }

  if (input.participantIds !== undefined) {
    await supabase.from('schedule_participants').delete().eq('schedule_id', id);
    const participantIds = input.participantIds.length ? input.participantIds : [userId];
    const { error } = await supabase.from('schedule_participants').insert(
      participantIds.map((participantId) => ({ schedule_id: id, user_id: participantId })),
    );
    if (error) throw new Error(error.message);
  }

  const updated = await getNativeScheduleById(supabase, userId, id);
  if (!updated) throw new Error('schedule_not_found');
  return updated;
}

export async function deleteNativeSchedule(
  supabase: RouteSupabaseClient,
  userId: string,
  id: string,
): Promise<boolean> {
  const { data: existing, error: findError } = await supabase
    .from('schedules')
    .select('id,created_by,family_group_id,visibility')
    .eq('id', id)
    .or(`visibility.neq.private,visibility.is.null,created_by.eq.${userId}`)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (!existing) throw new Error('schedule_not_found');
  await assertNativeScheduleWritable(supabase, userId, existing as Pick<ScheduleRow, 'created_by' | 'family_group_id' | 'visibility'>);

  const { error } = await supabase.from('schedules').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

/**
 * 정기(매월/매주/매년) 수입·지출 이월 — 이번 달에 누락된 반복 인스턴스를 생성.
 * `materializeRecurringExpenses`의 원장 버전(수입·지출 공용, scope 지정).
 * 시리즈 식별: kind + category + title + recur_freq 의 최신 인스턴스.
 */
export async function materializeRecurringLedger(
  spaceId: string,
  scope: LedgerScope,
): Promise<number> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const lastDayOfMonth = monthEnd.getDate();

  let query = supabase
    .from('ledger_entries')
    .select('*')
    .eq('space_id', spaceId)
    .eq('scope', scope)
    .neq('recur_freq', 'none')
    .order('occurred_at', { ascending: true });
  // 개인 항목은 본인 것만 이월 (공간 항목은 작성자 본인 것만 — RLS와 일관)
  query = query.eq('owner_id', user.id);

  const { data, error } = await query;
  if (error || !data?.length) return 0;
  const rows = data as LedgerRow[];

  const series = new Map<string, LedgerRow[]>();
  for (const row of rows) {
    const key = `${row.kind}__${row.category}__${row.title}__${row.recur_freq}`;
    const list = series.get(key) ?? [];
    list.push(row);
    series.set(key, list);
  }

  let created = 0;

  for (const instances of series.values()) {
    const latest = instances[instances.length - 1];
    const latestDate = new Date(latest.occurred_at);
    const recurUntil = latest.recur_until ? new Date(latest.recur_until) : null;
    const targets: Date[] = [];

    if (latest.recur_freq === 'monthly') {
      if (latestDate >= monthStart) continue;
      const day = Math.min(latestDate.getDate(), lastDayOfMonth);
      targets.push(new Date(Date.UTC(now.getFullYear(), now.getMonth(), day)));
    } else if (latest.recur_freq === 'yearly') {
      if (latestDate >= monthStart) continue;
      if (latestDate.getMonth() !== now.getMonth()) continue;
      const day = Math.min(latestDate.getDate(), lastDayOfMonth);
      targets.push(new Date(Date.UTC(now.getFullYear(), now.getMonth(), day)));
    } else if (latest.recur_freq === 'weekly') {
      const cursor = new Date(latestDate);
      for (let i = 0; i < 60; i++) {
        cursor.setDate(cursor.getDate() + 7);
        if (cursor > monthEnd) break;
        if (cursor >= monthStart) {
          targets.push(new Date(Date.UTC(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())));
        }
      }
    } else {
      continue;
    }

    for (const target of targets) {
      if (recurUntil && target > recurUntil) continue;
      const dup = instances.some((inst) => {
        const d = new Date(inst.occurred_at);
        const sameMonth = d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
        return latest.recur_freq === 'weekly' ? sameMonth && d.getDate() === target.getDate() : sameMonth;
      });
      if (dup) continue;

      const { error: insertError } = await supabase.from('ledger_entries').insert({
        kind:          latest.kind,
        scope:         latest.scope,
        space_id:      spaceId,
        owner_id:      user.id,
        title:         latest.title,
        amount:        latest.amount,
        category:      latest.category,
        method:        latest.method,
        occurred_at:   target.toISOString(),
        // 정기 지출은 pending(결제예정), 정기 수입은 pending(수령예정)으로 시작
        status:        'pending',
        recur_freq:    latest.recur_freq,
        recur_until:   latest.recur_until,
        recur_rule_id: latest.recur_rule_id,
        memo:          latest.memo,
      });
      if (insertError) console.error('[materializeRecurringLedger]', insertError.message);
      else created++;
    }
  }

  return created;
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

export async function getNativeNotifications(
  supabase: RouteSupabaseClient,
  userId: string,
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message || 'notifications_fetch_failed');
  return (data as NotificationRow[]).map(rowToNotification);
}

export async function markNativeNotificationRead(
  supabase: RouteSupabaseClient,
  userId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message || 'notification_mark_failed');
}

export async function markAllNativeNotificationsRead(
  supabase: RouteSupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw new Error(error.message || 'notifications_mark_all_failed');
}

// ── FCM ─────────────────────────────────────────────────────

/** FCM 토큰을 현재 사용자 프로필에 저장 */
export async function saveFCMToken(token: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('profiles')
    .update({ fcm_token: token })
    .eq('id', user.id);

  if (error) {
    console.error('[FCM] 토큰 저장 실패 — userId:', user.id, '| error:', error.message);
  } else {
    console.info('[FCM] 토큰 저장 완료 — prefix:', token.slice(0, 20));
  }
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

// ── 일정 참여자 구독 (알림 추가/제거) ────────────────────────

/** 현재 사용자를 일정 참여자(알림 구독)로 추가 */
export async function addScheduleParticipant(scheduleId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('schedule_participants')
    .upsert({ schedule_id: scheduleId, user_id: user.id }, { onConflict: 'schedule_id,user_id' });

  return !error;
}

/** 현재 사용자를 일정 참여자(알림 구독)에서 제거 */
export async function removeScheduleParticipant(scheduleId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('schedule_participants')
    .delete()
    .eq('schedule_id', scheduleId)
    .eq('user_id', user.id);

  return !error;
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
export async function getMyPageInsights(spaceId: string | undefined) {
  const familyGroupId = spaceId; // 하위 호환
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

  // ── [공간 수] 사용자가 속한 공간 수 ──
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { count: spaceCount } = await supabase
    .from('space_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', authUser?.id ?? '');

  return {
    totalExpense,
    upcomingCount:  upcomingCount || 0,
    memberCount:    memberCount || 0,
    spaceCount:     spaceCount || 0,
    month:          now.getMonth() + 1,
  };
}

// ── 공간 멤버 닉네임 ──────────────────────────────────
export async function updateSpaceMemberNickname(spaceId: string, nickname: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from('space_members')
    .update({ nickname: nickname.trim() || null })
    .eq('space_id', spaceId)
    .eq('user_id', user.id);
  return !error;
}

// ── 공간 게시물 ────────────────────────────────────────
export interface CreateSpacePostInput {
  type: SpacePostType;
  content?: string;
  pinned?: boolean;
  scheduleId?: string;
  dues?: { totalAmount: number; perPerson?: number; dueDate?: string };
  vote?: { title: string; multipleChoice: boolean; endsAt?: string; options: string[] };
}

export async function getSpacePosts(spaceId: string): Promise<SpacePost[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('space_posts')
    .select(`
      *,
      space_post_comments(count),
      space_dues(*, space_dues_payments(*)),
      space_votes(*, space_vote_options(*, space_vote_results(user_id)))
    `)
    .eq('space_id', spaceId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) { console.error('[getSpacePosts]', error.message); return []; }
  return (data ?? []).map(mapSpacePost);
}

export async function createSpacePost(spaceId: string, input: CreateSpacePostInput): Promise<SpacePost | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: postData, error: postError } = await supabase
    .from('space_posts')
    .insert({
      space_id: spaceId,
      author_id: user.id,
      type: input.type,
      content: input.content ?? null,
      pinned: input.pinned ?? false,
      schedule_id: input.scheduleId ?? null,
    })
    .select()
    .single();
  if (postError || !postData) { console.error('[createSpacePost]', postError?.message); return null; }
  // 회비 생성
  if (input.dues && input.type === 'dues') {
    const { error: duesError } = await supabase.from('space_dues').insert({
      post_id: postData.id,
      title: input.content ?? '회비 요청',
      total_amount: input.dues.totalAmount,
      per_person: input.dues.perPerson ?? null,
      due_date: input.dues.dueDate ?? null,
    });
    if (duesError) console.error('[createSpacePost dues]', duesError.message);
  }
  // 투표 생성
  if (input.vote && input.type === 'vote') {
    const { data: voteData, error: voteError } = await supabase.from('space_votes').insert({
      post_id: postData.id,
      title: input.vote.title,
      multiple_choice: input.vote.multipleChoice,
      ends_at: input.vote.endsAt ?? null,
    }).select().single();
    if (voteError) console.error('[createSpacePost vote]', voteError.message);
    if (voteData && input.vote.options.length > 0) {
      const { error: optError } = await supabase.from('space_vote_options').insert(
        input.vote.options.map((label, i) => ({ vote_id: voteData.id, label, sort_order: i }))
      );
      if (optError) console.error('[createSpacePost vote options]', optError.message);
    }
  }
  // 최소 SpacePost 반환 (즉시 UI에 추가 가능, 실제 dues/vote 데이터는 refresh로 반영)
  return {
    id: postData.id as string,
    spaceId: postData.space_id as string,
    authorId: postData.author_id as string,
    type: postData.type as SpacePostType,
    content: postData.content as string | null,
    pinned: postData.pinned as boolean,
    scheduleId: postData.schedule_id as string | null,
    createdAt: new Date(postData.created_at as string),
    commentCount: 0,
  };
}

export async function deleteSpacePost(postId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('space_posts').delete().eq('id', postId);
  return !error;
}

export async function getPostComments(postId: string): Promise<import('@/types').SpacePostComment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('space_post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) { console.error('[getPostComments]', error.message); return []; }
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    postId: row.post_id as string,
    authorId: row.author_id as string,
    content: row.content as string,
    createdAt: new Date(row.created_at as string),
  }));
}

export async function addComment(postId: string, content: string): Promise<import('@/types').SpacePostComment | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !content.trim()) return null;
  const { data, error } = await supabase
    .from('space_post_comments')
    .insert({ post_id: postId, author_id: user.id, content: content.trim() })
    .select('*')
    .single();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    postId: row.post_id as string,
    authorId: row.author_id as string,
    content: row.content as string,
    createdAt: new Date(row.created_at as string),
  };
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('space_post_comments').delete().eq('id', commentId);
  return !error;
}

export async function toggleDuesPayment(duesId: string, paid: boolean): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase.from('space_dues_payments').upsert({
    dues_id: duesId, user_id: user.id,
    paid, paid_at: paid ? new Date().toISOString() : null,
  }, { onConflict: 'dues_id,user_id' });
  return !error;
}

export async function castVote(optionId: string, isSelected: boolean): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (isSelected) {
    const { error } = await supabase.from('space_vote_results').insert({ option_id: optionId, user_id: user.id });
    return !error;
  } else {
    const { error } = await supabase.from('space_vote_results').delete()
      .eq('option_id', optionId).eq('user_id', user.id);
    return !error;
  }
}

// ── 매핑 헬퍼 (private) ───────────────────────────────────
function mapSpacePost(row: Record<string, unknown>): SpacePost {
  const commentCountArr = row.space_post_comments as { count: number }[] | null;
  const duesArr = row.space_dues as Record<string, unknown>[] | null;
  const voteArr = row.space_votes as Record<string, unknown>[] | null;
  const dues = duesArr?.[0];
  const vote = voteArr?.[0];
  return {
    id: row.id as string,
    spaceId: row.space_id as string,
    authorId: row.author_id as string,
    type: row.type as SpacePostType,
    content: row.content as string | null,
    pinned: row.pinned as boolean,
    scheduleId: row.schedule_id as string | null,
    createdAt: new Date(row.created_at as string),
    commentCount: Array.isArray(commentCountArr) ? (commentCountArr[0]?.count ?? 0) : 0,
    dues: dues ? mapDues(dues) : undefined,
    vote: vote ? mapVote(vote) : undefined,
  };
}

function mapDues(row: Record<string, unknown>): SpaceDues {
  const paymentsArr = row.space_dues_payments as Record<string, unknown>[] | null;
  return {
    id: row.id as string,
    postId: row.post_id as string,
    title: row.title as string,
    totalAmount: row.total_amount as number,
    perPerson: row.per_person as number | null,
    dueDate: row.due_date as string | null,
    payments: paymentsArr?.map(p => ({
      duesId: p.dues_id as string,
      userId: p.user_id as string,
      paid: p.paid as boolean,
      paidAt: p.paid_at ? new Date(p.paid_at as string) : null,
    })),
  };
}

function mapVote(row: Record<string, unknown>): SpaceVote {
  const optionsArr = row.space_vote_options as Record<string, unknown>[] | null;
  return {
    id: row.id as string,
    postId: row.post_id as string,
    title: row.title as string,
    multipleChoice: row.multiple_choice as boolean,
    endsAt: row.ends_at ? new Date(row.ends_at as string) : null,
    options: optionsArr?.map(o => ({
      id: o.id as string,
      voteId: o.vote_id as string,
      label: o.label as string,
      sortOrder: o.sort_order as number,
      voters: ((o.space_vote_results as { user_id: string }[] | null) ?? []).map(v => v.user_id),
    })),
  };
}
