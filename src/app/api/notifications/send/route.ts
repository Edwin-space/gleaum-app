/**
 * 글리움 — FCM 단일 알림 발송 API (FCM v1)
 * POST /api/notifications/send
 *
 * 인증: Supabase 세션(쿠키) 또는 CRON_SECRET Bearer 토큰 필수
 *
 * Body: { fcmToken: string, title: string, body: string, url?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendFCMNotification } from '@/lib/fcm';
import { isCronRequest, isInternalRequest } from '@/lib/supabase/route-auth';
import { sanitizeInternalUrl, trimText } from '@/lib/api/request-guards';

export async function POST(req: NextRequest) {
  // ── 인증 검증 ──────────────────────────────────────────────
  // raw FCM token 발송은 클라이언트에 열지 않습니다.
  // 사용자 대상 발송은 schedule/space 권한 검증이 있는 별도 API를 사용해야 합니다.
  const authHeader = req.headers.get('authorization');
  const isServer = isCronRequest(authHeader) || isInternalRequest(authHeader);
  if (!isServer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── 요청 처리 ─────────────────────────────────────────────
  const payload = await req.json().catch(() => null) as {
    fcmToken: string;
    title: string;
    body: string;
    url?: string;
  } | null;

  const fcmToken = trimText(payload?.fcmToken, 4096);
  const title    = trimText(payload?.title, 120);
  const body     = trimText(payload?.body, 500);
  const url      = sanitizeInternalUrl(payload?.url, '/home');

  if (!fcmToken || !title) {
    return NextResponse.json({ error: '필수 파라미터 누락 (fcmToken, title)' }, { status: 400 });
  }

  const ok = await sendFCMNotification({ token: fcmToken, title, body, url });

  if (!ok) {
    return NextResponse.json({ error: 'FCM 발송 실패' }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
