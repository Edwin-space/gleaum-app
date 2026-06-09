import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

if (process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL ?? 'mailto:admin@gleaum.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(req: NextRequest) {
  const { spaceId, title, body, url, excludeUserId } = await req.json() as {
    spaceId: string;
    title: string;
    body: string;
    url?: string;
    excludeUserId?: string;
  };

  if (!process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ ok: false, reason: 'no vapid' });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  // 해당 공간 멤버의 push subscription 조회 (자신 제외)
  const membersQuery = supabase
    .from('space_members')
    .select('user_id')
    .eq('space_id', spaceId);
  if (excludeUserId) membersQuery.neq('user_id', excludeUserId);

  const { data: members } = await membersQuery;
  if (!members?.length) return NextResponse.json({ ok: true, sent: 0 });

  const userIds = members.map((m: { user_id: string }) => m.user_id);
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', userIds);

  const payload = JSON.stringify({ title, body, url: url ?? '/space', tag: spaceId });
  let sent = 0;

  // Web-push 전송
  if (subs?.length) {
    await Promise.allSettled(
      subs.map(async (sub: { id: string; endpoint: string; p256dh: string; auth_key: string }) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
            payload
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
    await sendFcmMulticast(tokens, title, body, url ?? '/space');
  }

  return NextResponse.json({ ok: true, sent });
}

async function sendFcmMulticast(tokens: string[], title: string, body: string, url: string) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) return;
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
    ) as Record<string, string>;
    const accessToken = await getFirebaseAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;
    await Promise.allSettled(tokens.map(token =>
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
  } catch (e) { console.error('[FCM]', e); }
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
