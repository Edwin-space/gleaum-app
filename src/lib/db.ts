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
  SpaceRole,
  SpaceMember,
  Space,
} from '@/types';

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
  if (!user) return null;

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
