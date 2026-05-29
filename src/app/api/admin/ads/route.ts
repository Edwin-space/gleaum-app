/**
 * 관리자 전용 광고 CRUD API
 * GET    /api/admin/ads?period=today|7d|30d|all  — 전체 목록 (기간별 성과 통계 포함)
 * POST   /api/admin/ads                           — 광고 생성
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  return data?.is_admin ? user : null;
}

function getPeriodFrom(period: string | null): string | null {
  const now = new Date();
  if (period === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }
  if (period === '7d')  { now.setDate(now.getDate() - 7);  return now.toISOString(); }
  if (period === '30d') { now.setDate(now.getDate() - 30); return now.toISOString(); }
  return null; // 'all'
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const admin    = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: '관리자 권한 필요' }, { status: 403 });

  const period  = req.nextUrl.searchParams.get('period') ?? 'all';
  const fromISO = getPeriodFrom(period);

  // 광고 전체
  const { data: ads, error } = await supabase
    .from('ads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 기간별 이벤트 집계
  let eventsQuery = supabase.from('ad_events').select('ad_id, event');
  if (fromISO) eventsQuery = eventsQuery.gte('created_at', fromISO);
  const { data: events } = await eventsQuery;

  const statsMap = new Map<string, { impressions: number; clicks: number }>();
  for (const e of events ?? []) {
    const s = statsMap.get(e.ad_id) ?? { impressions: 0, clicks: 0 };
    if (e.event === 'impression') s.impressions++;
    if (e.event === 'click')      s.clicks++;
    statsMap.set(e.ad_id, s);
  }

  const result = (ads ?? []).map(ad => {
    const s       = statsMap.get(ad.id) ?? { impressions: 0, clicks: 0 };
    const ctr_pct = s.impressions > 0
      ? Math.round((s.clicks / s.impressions) * 10000) / 100
      : 0;
    return { ...ad, ...s, ctr_pct };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const admin    = await requireAdmin(supabase);
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
