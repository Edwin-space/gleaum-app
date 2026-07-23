import { NextRequest, NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const profile = await getSessionProfile(auth.supabase, auth.user.id);
    return NextResponse.json({ profile }, {
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Gleaum-Auth-Mode': auth.mode,
      },
    });
  } catch (error) {
    console.error('[session/profile]', error);
    return NextResponse.json({ error: 'profile_fetch_failed' }, { status: 500 });
  }
}
