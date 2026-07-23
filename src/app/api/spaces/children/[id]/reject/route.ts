import { NextResponse } from 'next/server';
import { rejectFamilyChildLink } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'dependent_id_required' }, { status: 400 });

  try {
    const result = await rejectFamilyChildLink(id, supabase);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    console.error('[family/dependents/reject]', error);
    if (message.includes('dependent_not_found_or_forbidden')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    if (message.includes('child_link_not_pending')) {
      return NextResponse.json({ error: 'child_link_not_pending' }, { status: 409 });
    }
    return NextResponse.json({ error: 'child_link_rejection_failed' }, { status: 500 });
  }
}
