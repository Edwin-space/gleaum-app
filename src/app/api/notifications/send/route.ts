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
import { getAuthUser, isCronRequest, isInternalRequest } from '@/lib/supabase/route-auth';

export async function POST(req: NextRequest) {
  // ── 인증 검증 ──────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');

  const isServer = isCronRequest(authHeader) || isInternalRequest(authHeader);
  if (!isServer) {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // ── 요청 처리 ─────────────────────────────────────────────
  const { fcmToken, title, body, url } = await req.json() as {
    fcmToken: string;
    title: string;
    body: string;
    url?: string;
  };

  if (!fcmToken || !title) {
    return NextResponse.json({ error: '필수 파라미터 누락 (fcmToken, title)' }, { status: 400 });
  }

  const ok = await sendFCMNotification({ token: fcmToken, title, body: body ?? '', url });

  if (!ok) {
    return NextResponse.json({ error: 'FCM 발송 실패' }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
