/**
 * POST /api/campaigns/send
 * 세그먼트 조건에 맞는 유저들에게 캠페인 메시지 발송
 * - campaign_logs    : 집계 기록 (sent / failed / status)
 * - campaign_send_details : 건별 성공·실패 원인 기록
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendFCMBatch } from '@/lib/fcm';

const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://www.gleaum.com';

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

  // ── 2. 대상 유저 + FCM 토큰 수집 ─────────────────────────
  let query = supabase
    .from('profiles')
    .select('id, fcm_token')
    .not('fcm_token', 'is', null);

  if (segment === 'no_onboarding') {
    query = query.is('onboarding_completed_at', null);
  } else if (segment === 'space_member') {
    if (!spaceId) return NextResponse.json({ error: 'spaceId가 필요합니다.' }, { status: 400 });
    query = query.eq('family_group_id', spaceId);
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

  const targets = profiles
    .filter((p: { id: string; fcm_token: string | null }) => !!p.fcm_token)
    .map((p: { id: string; fcm_token: string }) => ({ userId: p.id, token: p.fcm_token }));

  // ── 3. 클릭 추적 URL 생성 ─────────────────────────────────
  const landingUrl = url || '/home';
  const trackingUrl = campaignId
    ? `${MAIN_APP_URL}/api/campaign/click?id=${campaignId}&to=${encodeURIComponent(landingUrl)}`
    : landingUrl;

  // ── 4. FCM 배치 발송 ──────────────────────────────────────
  const { sent, failed, details } = await sendFCMBatch(targets, title, body, trackingUrl);

  // ── 5. 집계 로그 업데이트 ─────────────────────────────────
  const status = failed === 0 ? 'completed' : sent === 0 ? 'failed' : 'partial';
  await updateLog(campaignId, targets.length, sent, failed, status);

  // ── 6. 건별 상세 기록 (campaign_send_details) ─────────────
  if (campaignId && details.length > 0) {
    const detailRows = details.map((d) => ({
      campaign_id:   campaignId,
      user_id:       d.userId || null,
      token_prefix:  d.tokenPrefix || null,
      success:       d.success,
      error_code:    d.errorCode    ?? null,
      error_message: d.errorMessage ?? null,
    }));

    // 500건씩 분할 insert (Supabase 단건 한도 대응)
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
