/**
 * GET /api/invite/info?code=GLEAUM-XXXXXXXX
 *
 * 인증 불필요 — 초대 랜딩 페이지에서 공간 정보를 미리 보여주기 위한 공개 엔드포인트.
 * 민감 정보(멤버 목록 등)는 반환하지 않고 공간 이름/목적/멤버 수만 반환.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: '코드가 필요합니다.' }, { status: 400 });
  }

  const normalizedCode = code.toUpperCase().trim();

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 공간 기본 정보 조회 (invite_code 매칭)
  const { data: group, error } = await admin
    .from('family_groups')
    .select('id, name, purpose, invite_code_expires_at')
    .eq('invite_code', normalizedCode)
    .single();

  if (error || !group) {
    return NextResponse.json({ error: '유효하지 않은 초대 코드입니다.' }, { status: 404 });
  }

  // 만료 검증
  if (group.invite_code_expires_at && new Date(group.invite_code_expires_at) < new Date()) {
    return NextResponse.json({ error: '만료된 초대 코드입니다.' }, { status: 410 });
  }

  // 멤버 수 조회 (이름 등 개인정보 제외)
  const { count: memberCount } = await admin
    .from('space_members')
    .select('*', { count: 'exact', head: true })
    .eq('space_id', group.id);

  return NextResponse.json({
    spaceName: group.name,
    purpose: group.purpose ?? null,
    memberCount: memberCount ?? 0,
  });
}
