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

  if (!subs?.length) return NextResponse.json({ ok: true, sent: 0 });

  const payload = JSON.stringify({ title, body, url: url ?? '/space', tag: spaceId });
  let sent = 0;

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

  return NextResponse.json({ ok: true, sent });
}
