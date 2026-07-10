/**
 * POST /api/campaigns/send
 * 세그먼트 조건에 맞는 유저들에게 캠페인 메시지 발송
 * - campaign_logs         : 집계 기록 (sent / failed / status)
 * - campaign_send_details : 건별 성공·실패 원인 기록
 *
 * 지원 템플릿 변수 (제목/본문에 자동 치환):
 *   {{user_name}}   → 수신자 표시 이름
 *   {{space_name}}  → 수신자 스페이스 이름
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendFCMBatch } from '@/lib/fcm';

const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://www.gleaum.com';

/** 템플릿 변수를 실제 값으로 치환 */
function resolveTemplate(
  template: string,
  vars: { user_name?: string; space_name?: string }
): string {
  return template
    .replace(/\{\{user_name\}\}/g,  vars.user_name  ?? '사용자')
    .replace(/\{\{space_name\}\}/g, vars.space_name ?? '내 공간');
}

export async function POST(req: NextRequest) {
  const { segment, spaceId, channel, title, body, url } = await req.json() as {
    segment: string;
    spaceId?: string;
    channel: string;
    title: string;
    body: string;
    url?: string;
  };

  if (!title || !body) {
    return NextResponse.json({ error: '제목과 본문은 필수입니다.' }, { status: 400 });
  }
  if (channel !== 'app_push') {
    return NextResponse.json(
      { error: `'${channel}' 채널은 아직 지원되지 않습니다.` },
      { status: 400 }
    );
  }

  // ── 1. campaign_logs 선등록 (발송 전 ID 확보) ─────────────
  const { data: logRow, error: logInsertError } = await supabase
    .from('campaign_logs')
    .insert({ channel, segment, title, body, url: url || null, status: 'completed' })
    .select('id')
    .single();

  if (logInsertError || !logRow) {
    console.error('[캠페인] 로그 생성 실패:', logInsertError?.message);
  }
  const campaignId: string | null = logRow?.id ?? null;

  // ── 2. 대상 유저 + FCM 토큰 + 이름 수집 ──────────────────
  //    display_name / name : 템플릿 {{user_name}} 치환용
  //    space_member 세그먼트는 profiles.family_group_id가 아니라 space_members 기준으로 조회한다.
  let targetUserIds: string[] | null = null;

  if (segment === 'space_member') {
    if (!spaceId) return NextResponse.json({ error: 'spaceId가 필요합니다.' }, { status: 400 });

    const { data: members, error: memberError } = await supabase
      .from('space_members')
      .select('user_id')
      .eq('space_id', spaceId);

    if (memberError) {
      await updateLog(campaignId, 0, 0, 0, 'failed');
      return NextResponse.json({ error: `멤버 조회 실패: ${memberError.message}` }, { status: 500 });
    }

    targetUserIds = Array.from(new Set((members ?? []).map((member) => member.user_id).filter(Boolean)));
    if (targetUserIds.length === 0) {
      await updateLog(campaignId, 0, 0, 0, 'failed');
      return NextResponse.json({ sent: 0, failed: 0, total: 0, message: '발송 대상 없음', campaignId });
    }
  }

  let query = supabase
    .from('profiles')
    .select('id, fcm_token, display_name, name, family_group_id')
    .not('fcm_token', 'is', null);

  if (segment === 'no_onboarding') {
    query = query.is('onboarding_completed_at', null);
  } else if (targetUserIds) {
    query = query.in('id', targetUserIds);
  }

  const { data: profiles, error: dbError } = await query;

  if (dbError) {
    await updateLog(campaignId, 0, 0, 0, 'failed');
    return NextResponse.json({ error: `DB 조회 실패: ${dbError.message}` }, { status: 500 });
  }
  if (!profiles || profiles.length === 0) {
    await updateLog(campaignId, 0, 0, 0, 'failed');
    return NextResponse.json({ sent: 0, failed: 0, total: 0, message: '발송 대상 없음', campaignId });
  }

  // ── 3. {{space_name}} 치환을 위한 스페이스 이름 일괄 조회 ─
  //    unique family_group_id 만 조회하여 N+1 방지
  const needsSpaceName = title.includes('{{space_name}}') || body.includes('{{space_name}}');
  const spaceNameMap: Record<string, string> = {};

  if (needsSpaceName) {
    const uniqueSpaceIds = Array.from(new Set(
      [
        ...(spaceId ? [spaceId] : []),
        ...profiles.map((p: { family_group_id: string | null }) => p.family_group_id).filter(Boolean),
      ] as string[]
    ));

    if (uniqueSpaceIds.length > 0) {
      const { data: spaces } = await supabase
        .from('family_groups')
        .select('id, name')
        .in('id', uniqueSpaceIds);

      (spaces ?? []).forEach((s: { id: string; name: string }) => {
        spaceNameMap[s.id] = s.name;
      });
    }
  }

  // ── 4. 토큰 필터 + 템플릿 변수 치환 ─────────────────────
  type ProfileRow = {
    id: string;
    fcm_token: string | null;
    display_name: string | null;
    name: string | null;
    family_group_id: string | null;
  };

  const targets = profiles
    .filter((p: ProfileRow) => !!p.fcm_token)
    .map((p: ProfileRow) => {
      const userName  = p.display_name ?? p.name ?? '사용자';
      const effectiveSpaceId = segment === 'space_member' ? spaceId : p.family_group_id;
      const spaceName = effectiveSpaceId ? (spaceNameMap[effectiveSpaceId] ?? '내 공간') : '내 공간';
      const vars = { user_name: userName, space_name: spaceName };

      return {
        userId: p.id,
        token:  p.fcm_token as string,
        title:  resolveTemplate(title, vars),
        body:   resolveTemplate(body,  vars),
      };
    });

  // ── 5. 클릭 추적 URL 생성 ─────────────────────────────────
  const landingUrl = url || '/home';
  const trackingUrl = campaignId
    ? `${MAIN_APP_URL}/api/campaign/click?id=${campaignId}&to=${encodeURIComponent(landingUrl)}`
    : landingUrl;

  // ── 6. FCM 배치 발송 (타겟별 개인화 title/body) ───────────
  const { sent, failed, details } = await sendFCMBatch(targets, trackingUrl);

  // ── 7. 집계 로그 업데이트 ─────────────────────────────────
  const status = failed === 0 ? 'completed' : sent === 0 ? 'failed' : 'partial';
  await updateLog(campaignId, targets.length, sent, failed, status);

  // ── 8. 건별 상세 기록 (campaign_send_details) ─────────────
  if (campaignId && details.length > 0) {
    const detailRows = details.map((d) => ({
      campaign_id:   campaignId,
      user_id:       d.userId || null,
      token_prefix:  d.tokenPrefix || null,
      success:       d.success,
      error_code:    d.errorCode    ?? null,
      error_message: d.errorMessage ?? null,
    }));

    const INSERT_CHUNK = 500;
    for (let i = 0; i < detailRows.length; i += INSERT_CHUNK) {
      const { error: detailErr } = await supabase
        .from('campaign_send_details')
        .insert(detailRows.slice(i, i + INSERT_CHUNK));
      if (detailErr) {
        console.error('[캠페인] 상세 기록 실패:', detailErr.message);
      }
    }
  }

  console.log(`[캠페인] 완료 — ID: ${campaignId}, 전송: ${sent}, 실패: ${failed}`);

  return NextResponse.json({
    sent,
    failed,
    total: targets.length,
    campaignId,
    message: `총 ${targets.length}명 중 ${sent}명에게 성공적으로 발송되었습니다.`,
  });
}

async function updateLog(
  id: string | null,
  targetCount: number,
  sentCount: number,
  failedCount: number,
  status: string
) {
  if (!id) return;
  await supabase
    .from('campaign_logs')
    .update({ target_count: targetCount, sent_count: sentCount, failed_count: failedCount, status })
    .eq('id', id);
}
