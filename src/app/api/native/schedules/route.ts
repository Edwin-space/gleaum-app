import { NextRequest, NextResponse } from 'next/server';
import { createNativeSchedule, type NativeCreateScheduleInput } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let input: NativeCreateScheduleInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  try {
    const schedule = await createNativeSchedule(auth.supabase, auth.user.id, input);
    return NextResponse.json({ schedule }, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store',
        'X-Gleaum-Auth-Mode': auth.mode,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'schedule_create_failed';
    const status = message === 'space_editor_required'
      ? 403
      : message.endsWith('_required') || message.startsWith('invalid_')
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
