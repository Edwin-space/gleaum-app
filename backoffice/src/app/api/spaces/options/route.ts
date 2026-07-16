import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { getAdminSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denial = await requireAdminApi();
  if (denial) return denial;

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('family_groups')
    .select('id, name, invite_code, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message, spaces: [] }, { status: 500 });
  }

  return NextResponse.json({
    spaces: (data ?? []).map((space) => ({
      id: space.id,
      name: space.name,
      inviteCode: space.invite_code,
      createdAt: space.created_at,
    })),
  });
}
