import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/supabase/route-auth';
import { isUuid, sanitizeInternalUrl, trimText } from '@/lib/api/request-guards';

if (process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL ?? 'mailto:admin@gleaum.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await req.json().catch(() => null) as {
    spaceId: string;
    title: string;
    body: string;
    url?: string;
    excludeUserId?: string;
  } | null;

  const spaceId = trimText(payload?.spaceId, 80);
  const title   = trimText(payload?.title, 120);
  const body    = trimText(payload?.body, 500);
  const url     = sanitizeInternalUrl(payload?.url, '/space');

  if (!isUuid(spaceId) || !title) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 요청자는 해당 공간 멤버여야 합니다. 토큰 조회는 검증 후 service_role로만 수행합니다.
  const { data: requesterMembership } = await supabase
    .from('space_members')
    .select('user_id')
    .eq('space_id', spaceId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!requesterMembership) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  // 해당 공간 멤버의 push subscription 조회 (자신 제외)
  const membersQuery = supabase
    .from('space_members')
    .select('user_id')
    .eq('space_id', spaceId);
  membersQuery.neq('user_id', user.id);

  const { data: members } = await membersQuery;
  if (!members?.length) return NextResponse.json({ ok: true, sent: 0 });

  const userIds = members.map((m: { user_id: string }) => m.user_id);
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', userIds);

  const notificationPayload = JSON.stringify({ title, body, url, tag: spaceId });
  let sent = 0;

  // Web-push 전송
  if (process.env.VAPID_PRIVATE_KEY && subs?.length) {
    await Promise.allSettled(
      subs.map(async (sub: { id: string; endpoint: string; p256dh: string; auth_key: string }) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
            notificationPayload
          );
          sent++;
        } catch (err: unknown) {
          // 만료된 구독 삭제
          if ((err as { statusCode?: number }).statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      })
    );
  }

  // FCM 전송 (네이티브 앱)
  const { data: fcmTokenRows } = await supabase
    .from('fcm_tokens')
    .select('token')
    .in('user_id', userIds);

  if (fcmTokenRows?.length) {
    const tokens = fcmTokenRows.map((r: { token: string }) => r.token);
    sent += await sendFcmMulticast(tokens, title, body, url);
  }

  return NextResponse.json({ ok: true, sent });
}

async function sendFcmMulticast(tokens: string[], title: string, body: string, url: string): Promise<number> {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) return 0;
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
    ) as Record<string, string>;
    const accessToken = await getFirebaseAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;
    const results = await Promise.allSettled(tokens.map(token =>
      fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            data: { url },
            android: { priority: 'high' },
            apns: { payload: { aps: { sound: 'default' } } },
          },
        }),
      })
    ));
    return results.filter((result) => result.status === 'fulfilled').length;
  } catch (e) {
    console.error('[FCM]', e);
    return 0;
  }
}

async function getFirebaseAccessToken(serviceAccount: Record<string, string>): Promise<string> {
  const { SignJWT, importPKCS8 } = await import('jose');
  const now = Math.floor(Date.now() / 1000);
  const privateKey = await importPKCS8(serviceAccount.private_key, 'RS256');
  const jwt = await new SignJWT({
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  }).setProtectedHeader({ alg: 'RS256' }).sign(privateKey);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json() as { access_token: string };
  return data.access_token;
}
