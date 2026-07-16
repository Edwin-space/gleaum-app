/**
 * 글리움 — 초대 코드 합류 API (서버사이드)
 * POST /api/invite/join
 *
 * Body: { code: string }
 *
 * 보안:
 *   - IP 기반 Rate Limit: 10분간 최대 10회 시도
 *   - 코드 만료 검증 (invite_code_expires_at)
 *   - 인증 사용자 전용 (Supabase 쿠키 세션)
 *
 * Response:
 *   200 { success: true, spaceName, spaceId, alreadyMember? }
 *   400 코드 누락
 *   401 미인증
 *   404 유효하지 않은 코드
 *   410 만료된 코드
 *   429 Rate Limit 초과
 *   500 서버 오류
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getAccountSessionContext } from '@/lib/db';

// 10분간 최대 10회 시도
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

/** 요청 IP 추출 (Vercel: x-forwarded-for 헤더) */
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { code } = body;
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: '초대 코드가 필요합니다.' }, { status: 400 });
  }

  const normalizedCode = code.toUpperCase().trim();
  const ip = getClientIp(req);

  // 서비스 롤 클라이언트 (Rate Limit 기록, 공간 조회용)
  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ── 1. Rate Limit 체크 ────────────────────────────────────
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count } = await admin
    .from('invite_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', windowStart);

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: '너무 많은 시도입니다. 10분 후 다시 시도해주세요.' },
      {
        status: 429,
        headers: { 'Retry-After': '600' },
      }
    );
  }

  // ── 2. 시도 기록 ─────────────────────────────────────────
  await admin.from('invite_attempts').insert({ ip });

  // ── 3. 코드 유효성 + 만료 검증 ───────────────────────────
  const { data: group, error: groupError } = await admin
    .from('family_groups')
    .select('id, name, invite_code_expires_at')
    .eq('invite_code', normalizedCode)
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 404 });
  }

  if (
    group.invite_code_expires_at &&
    new Date(group.invite_code_expires_at) < new Date()
  ) {
    return NextResponse.json({ error: 'expired_code' }, { status: 410 });
  }

  // ── 4. 인증 사용자 확인 ───────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const sessionContext = await getAccountSessionContext(supabase);
  if (!sessionContext?.capabilities.canInviteMembers) {
    return NextResponse.json({ error: 'capability_canInviteMembers_required' }, { status: 403 });
  }

  // ── 5. 이미 멤버 확인 ────────────────────────────────────
  const { data: existing } = await admin
    .from('space_members')
    .select('id')
    .eq('space_id', group.id)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return NextResponse.json({
      success: true,
      alreadyMember: true,
      spaceName: group.name,
      spaceId: group.id,
    });
  }

  // ── 6. 공간 합류 ─────────────────────────────────────────
  const { error: memberError } = await admin
    .from('space_members')
    .insert({ space_id: group.id, user_id: user.id, role: 'viewer' });

  if (memberError) {
    console.error('[invite/join] 공간 합류 오류:', memberError.message);
    return NextResponse.json({ error: 'join_failed' }, { status: 500 });
  }

  // profiles.family_group_id 하위 호환 업데이트
  await admin
    .from('profiles')
    .update({ family_group_id: group.id })
    .eq('id', user.id);

  return NextResponse.json({
    success: true,
    spaceName: group.name,
    spaceId: group.id,
  });
}
