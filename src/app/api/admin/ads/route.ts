/**
 * 관리자 전용 광고 CRUD API
 * GET    /api/admin/ads           — 전체 목록 (성과 통계 포함)
 * POST   /api/admin/ads           — 광고 생성
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  return profile?.is_admin ? user : null;
}

export async function GET() {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: '관리자 권한 필요' }, { status: 403 });

  const { data, error } = await supabase
    .from('ad_stats')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: '관리자 권한 필요' }, { status: 403 });

  const body = await req.json();
  const { data, error } = await supabase
    .from('ads')
    .insert({ ...body, created_by: admin.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
