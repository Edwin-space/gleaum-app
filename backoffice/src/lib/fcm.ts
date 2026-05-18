/**
 * 백오피스 — FCM HTTP v1 헬퍼 (서버 전용)
 * 메인 앱의 src/lib/fcm.ts와 동일 구현체
 */

import { GoogleAuth } from 'google-auth-library';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gleaum-firebase';
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

async function getFCMAccessToken(): Promise<string> {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 환경변수 미설정');
  const credentials = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) throw new Error('FCM 액세스 토큰 발급 실패');
  return tokenResponse.token;
}

export interface FCMMessage {
  token: string;
  title: string;
  body: string;
  url?: string;
}

export async function sendFCMNotification(msg: FCMMessage): Promise<boolean> {
  try {
    const accessToken = await getFCMAccessToken();
    const payload = {
      message: {
        token: msg.token,
        notification: { title: msg.title, body: msg.body },
        webpush: {
          notification: {
            title: msg.title,
            body: msg.body,
            icon: '/icon-192.png',
          },
          fcm_options: { link: msg.url ?? '/home' },
        },
        data: { url: msg.url ?? '/home' },
      },
    };
    const res = await fetch(FCM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('[FCM] 발송 실패:', JSON.stringify(err));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[FCM] 오류:', err);
    return false;
  }
}

/** 여러 토큰에 동시 발송 */
export async function sendFCMBatch(
  tokens: string[],
  title: string,
  body: string,
  url?: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  // FCM 배치: 병렬 처리 (최대 50개씩)
  const CHUNK = 50;
  for (let i = 0; i < tokens.length; i += CHUNK) {
    const chunk = tokens.slice(i, i + CHUNK);
    const results = await Promise.allSettled(
      chunk.map((token) => sendFCMNotification({ token, title, body, url }))
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) sent++;
      else failed++;
    }
  }
  return { sent, failed };
}
