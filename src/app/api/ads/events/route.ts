/**
 * POST /api/ads/events
 * 광고 노출·클릭 이벤트 수집 (비인증 포함)
 */
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAccountSessionContext } from '@/lib/db';

const AD_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_EVENTS = new Set(['impression', 'click']);
const ALLOWED_PLATFORMS = new Set(['web', 'android', 'ios']);
const MAX_BODY_BYTES = 2_048;

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: '요청이 너무 큽니다' }, { status: 413 });
  }

  const origin = req.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.get('host')) {
        return NextResponse.json({ error: '허용되지 않은 요청' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: '허용되지 않은 요청' }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => null);
  const { adId, event, platform } = body ?? {};
  const normalizedPlatform = typeof platform === 'string' ? platform : 'web';

  if (
    typeof adId !== 'string'
    || !AD_ID_PATTERN.test(adId)
    || typeof event !== 'string'
    || !ALLOWED_EVENTS.has(event)
    || !ALLOWED_PLATFORMS.has(normalizedPlatform)
  ) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const sessionContext = await getAccountSessionContext(supabase);
    if (!sessionContext?.capabilities.canShowAds) {
      return new NextResponse(null, { status: 204 });
    }
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const now = new Date().toISOString();
  const { data: activeAd, error: adError } = await admin
    .from('ads')
    .select('id')
    .eq('id', adId)
    .eq('is_active', true)
    .lte('starts_at', now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .contains('platforms', [normalizedPlatform])
    .maybeSingle();

  if (adError) {
    console.error('[ad_events] 광고 검증 실패:', adError);
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 });
  }

  if (!activeAd) {
    return NextResponse.json({ error: '활성 광고가 아닙니다' }, { status: 404 });
  }

  const { error } = await admin
    .from('ad_events')
    .insert({
      ad_id: adId,
      event,
      platform: normalizedPlatform,
      user_id: user?.id ?? null,
    });

  if (error) {
    console.error('[ad_events] 기록 실패:', error);
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
