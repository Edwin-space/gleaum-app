/**
 * 글리움 — FCM 단일 알림 발송 API (FCM v1)
 * POST /api/notifications/send
 *
 * Body: { fcmToken: string, title: string, body: string, url?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendFCMNotification } from '@/lib/fcm';

export async function POST(req: NextRequest) {
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
