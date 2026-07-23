import { NextRequest, NextResponse } from 'next/server';
import { getAccountSessionContext, getNativeHomeSummary } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [summary, account] = await Promise.all([
      getNativeHomeSummary(auth.supabase, auth.user.id),
      getAccountSessionContext(auth.supabase),
    ]);
    if (!account) {
      return NextResponse.json({ error: 'account_context_unavailable' }, { status: 403 });
    }
    return NextResponse.json({ ...summary, account }, {
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
