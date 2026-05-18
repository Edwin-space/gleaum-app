/**
 * 글리움 — FCM HTTP v1 API 헬퍼 (서버 전용)
 * 서비스 계정으로 OAuth 토큰을 발급받아 FCM v1 엔드포인트에 알림을 발송합니다.
 */

import { GoogleAuth } from 'google-auth-library';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gleaum-firebase';
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

/** 서비스 계정 JSON(base64)으로 FCM OAuth 액세스 토큰 발급 */
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
  token: string;       // 수신 기기의 FCM 등록 토큰
  title: string;
  body: string;
  url?: string;        // 클릭 시 이동할 경로 (예: /schedules/123)
}

/**
 * FCM v1 API로 단일 기기에 알림 발송
 * 반환: 성공 여부
 */
export async function sendFCMNotification(msg: FCMMessage): Promise<boolean> {
  try {
    const accessToken = await getFCMAccessToken();

    // 절대 URL 보장
    const absoluteUrl = msg.url?.startsWith('http')
      ? msg.url
      : `https://www.gleaum.com${msg.url ?? '/home'}`;

    const payload = {
      message: {
        token: msg.token,
        // ── 공통 알림 ──────────────────────────────────────────────────────
        notification: {
          title: msg.title,
          body:  msg.body,
        },

        // ── Android: 채널 ID + 높은 우선순위 ─────────────────────────────
        android: {
          priority: 'HIGH',
          notification: {
            channel_id: 'gleaum_notifications',
            sound:       'default',
            title:       msg.title,
            body:        msg.body,
          },
        },

        // ── iOS (APNs) ────────────────────────────────────────────────────
        apns: {
          headers: {
            'apns-priority':  '10',
            'apns-push-type': 'alert',
          },
          payload: {
            aps: {
              alert: { title: msg.title, body: msg.body },
              badge:             1,
              sound:             'default',
              'mutable-content': 1,
            },
          },
        },

        // ── Web Push ─────────────────────────────────────────────────────
        webpush: {
          notification: {
            title: msg.title,
            body:  msg.body,
            icon:  '/icon-192.png',
            badge: '/icon-72.png',
          },
          fcm_options: {
            link: absoluteUrl,
          },
        },

        // ── 공통 데이터 (앱 내 URL 이동용) ───────────────────────────────
        data: {
          url: absoluteUrl,
        },
      },
    };

    const res = await fetch(FCM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('[FCM v1] 발송 실패:', JSON.stringify(err));
      return false;
    }

    return true;
  } catch (err) {
    console.error('[FCM v1] 오류:', err);
    return false;
  }
}

/**
 * 여러 기기에 동시 발송 (순차 처리)
 * 반환: 성공 건수
 */
export async function sendFCMToMultiple(
  tokens: string[],
  title: string,
  body: string,
  url?: string
): Promise<number> {
  let successCount = 0;
  for (const token of tokens) {
    const ok = await sendFCMNotification({ token, title, body, url });
    if (ok) successCount++;
  }
  return successCount;
}
