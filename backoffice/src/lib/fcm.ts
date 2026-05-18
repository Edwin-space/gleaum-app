/**
 * 백오피스 — FCM HTTP v1 헬퍼 (서버 전용)
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

/** 단일 토큰 발송 결과 */
export interface FCMSendResult {
  success: boolean;
  errorCode?: string;    // FCM v1 error.status (UNREGISTERED, INVALID_ARGUMENT 등)
  errorMessage?: string; // FCM v1 error.message
}

/** 배치 발송 단건 결과 (user_id + token 연계) */
export interface FCMBatchDetail {
  userId: string;
  tokenPrefix: string;   // 토큰 앞 20자
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * FCM v1 단일 기기 발송
 * - 성공 여부와 에러 코드를 함께 반환
 */
export async function sendFCMNotification(
  msg: FCMMessage,
  accessToken: string
): Promise<FCMSendResult> {
  // 절대 URL 보장 (webpush link / apns fcm_options 는 절대 URL 필요)
  const absoluteUrl = msg.url?.startsWith('http')
    ? msg.url
    : `https://www.gleaum.com${msg.url ?? '/home'}`;

  const payload = {
    message: {
      token: msg.token,
      // ── 공통 알림 (플랫폼별 섹션이 없을 때 fallback) ──────────────────────
      notification: { title: msg.title, body: msg.body },

      // ── Android: 채널 ID + 높은 우선순위 ──────────────────────────────────
      android: {
        priority: 'HIGH',
        notification: {
          channel_id: 'gleaum_notifications',
          sound:       'default',
          title:       msg.title,
          body:        msg.body,
          click_action: 'OPEN_ACTIVITY_1',
        },
      },

      // ── iOS (APNs): alert + sound + badge ─────────────────────────────────
      apns: {
        headers: {
          'apns-priority':   '10',
          'apns-push-type':  'alert',
        },
        payload: {
          aps: {
            alert: { title: msg.title, body: msg.body },
            badge:            1,
            sound:            'default',
            'mutable-content': 1,
          },
        },
        fcm_options: { analytics_label: 'campaign' },
      },

      // ── Web Push ───────────────────────────────────────────────────────────
      webpush: {
        notification: {
          title: msg.title,
          body:  msg.body,
          icon:  '/icon-192.png',
        },
        fcm_options: { link: absoluteUrl },
      },

      // ── 공통 데이터 (앱에서 URL 처리용) ─────────────────────────────────
      data: { url: absoluteUrl },
    },
  };

  try {
    const res = await fetch(FCM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) return { success: true };

    // FCM v1 에러 파싱
    let errorCode   = `HTTP_${res.status}`;
    let errorMessage = res.statusText;

    try {
      const errBody = await res.json() as {
        error?: { status?: string; message?: string };
      };
      errorCode    = errBody.error?.status   ?? errorCode;
      errorMessage = errBody.error?.message  ?? errorMessage;
    } catch {
      // JSON 파싱 실패 — HTTP 상태코드만 사용
    }

    return { success: false, errorCode, errorMessage };
  } catch (err) {
    const msg2 = err instanceof Error ? err.message : String(err);
    return { success: false, errorCode: 'EXCEPTION', errorMessage: msg2 };
  }
}

/**
 * 여러 유저·토큰에 배치 발송 (50개씩 병렬)
 *
 * targets 각 항목에 title/body 가 있으면 개인화된 값을 사용,
 * 없으면 url 파라미터만 공통으로 사용 (하위 호환을 위해 url 단독 파라미터 유지).
 *
 * - 집계: sent / failed
 * - 상세: 토큰별 성공·에러 코드
 */
export async function sendFCMBatch(
  targets: Array<{ userId: string; token: string; title?: string; body?: string }>,
  url?: string
): Promise<{ sent: number; failed: number; details: FCMBatchDetail[] }> {
  let sent = 0;
  let failed = 0;
  const details: FCMBatchDetail[] = [];

  // 액세스 토큰은 배치 전체에서 재사용 (1회 발급)
  let accessToken: string;
  try {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!;
    const credentials = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
    const client = await auth.getClient();
    const t = await client.getAccessToken();
    if (!t.token) throw new Error('토큰 발급 실패');
    accessToken = t.token;
  } catch (err) {
    const msg2 = err instanceof Error ? err.message : String(err);
    return {
      sent: 0,
      failed: targets.length,
      details: targets.map((t) => ({
        userId:       t.userId,
        tokenPrefix:  t.token.slice(0, 20),
        success:      false,
        errorCode:    'ACCESS_TOKEN_ERROR',
        errorMessage: msg2,
      })),
    };
  }

  const CHUNK = 50;
  for (let i = 0; i < targets.length; i += CHUNK) {
    const chunk = targets.slice(i, i + CHUNK);
    const results = await Promise.allSettled(
      chunk.map((t) =>
        sendFCMNotification(
          { token: t.token, title: t.title ?? '', body: t.body ?? '', url },
          accessToken
        ).then((r) => ({ ...r, userId: t.userId, tokenPrefix: t.token.slice(0, 20) }))
      )
    );

    for (const r of results) {
      if (r.status === 'fulfilled') {
        const { userId, tokenPrefix, success, errorCode, errorMessage } = r.value;
        details.push({ userId, tokenPrefix, success, errorCode, errorMessage });
        if (success) sent++;
        else failed++;
      } else {
        details.push({
          userId: '',
          tokenPrefix: '',
          success: false,
          errorCode: 'PROMISE_REJECTED',
          errorMessage: String(r.reason),
        });
        failed++;
      }
    }
  }

  return { sent, failed, details };
}
