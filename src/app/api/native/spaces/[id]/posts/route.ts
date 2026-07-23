import { NextRequest, NextResponse } from 'next/server';
import { createNativeSpacePost } from '@/lib/db';
import { createNativeRouteAuth } from '@/lib/supabase/native-route';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await createNativeRouteAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [{ id }, body] = await Promise.all([
      context.params,
      req.json() as Promise<{ content?: string }>,
    ]);
    const summary = await createNativeSpacePost(auth.supabase, auth.user.id, id, body.content ?? '');
    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Gleaum-Auth-Mode': auth.mode,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'space_post_create_failed';
    const status = message === 'content_required' || message === 'content_too_long' ? 400 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
