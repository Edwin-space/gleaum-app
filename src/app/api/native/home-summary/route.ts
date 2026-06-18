import { NextRequest, NextResponse } from 'next/server';
import { getNativeHomeSummary } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await getNativeHomeSummary(auth.supabase, auth.user.id);
    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Gleaum-Auth-Mode': auth.mode,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'home_summary_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
