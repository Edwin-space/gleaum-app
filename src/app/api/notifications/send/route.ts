/**
 * 글리움 — FCM 알림 발송 API
 * POST /api/notifications/send
 *
 * Body: { fcmToken: string, title: string, body: string, url?: string }
 *
 * - 재알림 버튼, 일정 완료 알림, 크론잡에서 호출
 * - FCM Legacy HTTP API 사용 (서버 키 필요)
 */

import { NextRequest, NextResponse } from 'next/server';

const FCM_ENDPOINT = 'https://fcm.googleapis.com/fcm/send';

export async function POST(req: NextRequest) {
  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey || serverKey === '여기에_서버키_붙여넣기') {
    return NextResponse.json(
      { error: 'FCM_SERVER_KEY가 설정되지 않았습니다. .env.local을 확인하세요.' },
      { status: 500 }
    );
  }

  const body = await req.json() as {
    fcmToken: string;
    title: string;
    body: string;
    url?: string;
  };

  if (!body.fcmToken || !body.title) {
    return NextResponse.json({ error: '필수 파라미터 누락 (fcmToken, title)' }, { status: 400 });
  }

  const fcmPayload = {
    to: body.fcmToken,
    notification: {
      title: body.title,
      body:  body.body ?? '',
      icon:  '/icon-192.png',
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    },
    data: {
      url: body.url ?? '/home',
    },
    android: {
      notification: { sound: 'default', priority: 'HIGH' },
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
  };

  try {
    const res = await fetch(FCM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `key=${serverKey}`,
      },
      body: JSON.stringify(fcmPayload),
    });

    const result = await res.json();

    if (result.failure > 0) {
      console.error('[FCM] 발송 실패:', result);
      return NextResponse.json({ error: 'FCM 발송 실패', detail: result }, { status: 502 });
    }

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('[FCM] 요청 오류:', err);
    return NextResponse.json({ error: 'FCM 요청 오류' }, { status: 500 });
  }
}
