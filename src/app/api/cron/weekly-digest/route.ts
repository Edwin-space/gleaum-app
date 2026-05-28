/**
 * 글리움 — 주간 소비 다이제스트 크론잡
 * GET/POST /api/cron/weekly-digest
 *
 * Supabase pg_cron에서 매주 월요일 00:00 UTC (= 월요일 09:00 KST)에 호출됩니다.
 * 각 사용자의 지난 7일(월~일) 개인 지출을 집계하고 FCM + in-app 알림을 발송합니다.
 *
 * 패턴 3 — 행동 유도형:
 *   📊 이번 주 소비 패턴 (5/19 ~ 5/25)
 *   총 178,000원 | 일평균 25,400원
 *   이 페이스라면 이번 달 예상 지출 762,000원
 *   지난주 대비 +8% 속도 🔴
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFCMToMultiple } from '@/lib/fcm';

export async function POST(req: NextRequest) { return GET(req); }

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // 이번 주 기간: 지난 7일 (월 09:00 KST ~ 일 23:59 KST = 월 00:00 UTC ~ 일 14:59 UTC)
  // 크론이 월요일 00:00 UTC에 실행되므로 지난 7일 = 지난주 월 ~ 일
  const weekEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); // 월 00:00 UTC
  const weekStart = new Date(weekEnd.getTime() - 7 * MS_PER_DAY); // 전주 월 00:00 UTC
  // 지지난 주 (비교용)
  const prevWeekStart = new Date(weekStart.getTime() - 7 * MS_PER_DAY);
  const prevWeekEnd   = weekStart;

  // KST 날짜 표시 (UTC+9)
  const KST_OFFSET = 9 * 60 * 60 * 1000;
  const toKSTDate = (date: Date): string => {
    const d = new Date(date.getTime() + KST_OFFSET);
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    return `${m}/${day}`;
  };
  const weekStartLabel = toKSTDate(weekStart);
  const weekEndLabel   = toKSTDate(new Date(weekEnd.getTime() - 1)); // 일요일 23:59

  // ── 이번 주 개인 지출 전체 조회 ──
  const { data: thisWeekExpenses, error } = await supabase
    .from('schedules')
    .select('id, created_by, amount, expense_category, start_time')
    .eq('type', 'expense')
    .eq('visibility', 'private')
    .gte('start_time', weekStart.toISOString())
    .lt('start_time', weekEnd.toISOString());

  if (error) {
    console.error('[weekly-digest] 이번 주 조회 오류:', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // ── 지난 주 개인 지출 전체 조회 ──
  const { data: prevWeekExpenses } = await supabase
    .from('schedules')
    .select('id, created_by, amount, start_time')
    .eq('type', 'expense')
    .eq('visibility', 'private')
    .gte('start_time', prevWeekStart.toISOString())
    .lt('start_time', prevWeekEnd.toISOString());

  // ── 사용자별 그룹화 ──
  type ExpenseRow = { id: string; created_by: string; amount: number | null; expense_category: string | null; start_time: string };
  const userMap = new Map<string, { thisWeek: ExpenseRow[]; prevWeek: { amount: number | null }[] }>();

  (thisWeekExpenses ?? []).forEach((e: ExpenseRow) => {
    if (!userMap.has(e.created_by)) userMap.set(e.created_by, { thisWeek: [], prevWeek: [] });
    userMap.get(e.created_by)!.thisWeek.push(e);
  });
  (prevWeekExpenses ?? []).forEach((e: { created_by: string; amount: number | null }) => {
    if (!userMap.has(e.created_by)) return; // 이번 주 지출이 있는 사용자만
    userMap.get(e.created_by)!.prevWeek.push(e);
  });

  if (userMap.size === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  // ── FCM 토큰 + 알림 수신 동의 조회 ──
  const userIds = Array.from(userMap.keys());
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, fcm_token')
    .in('id', userIds)
    .not('fcm_token', 'is', null);

  const profileMap = new Map((profiles ?? []).map((p: { id: string; fcm_token: string }) => [p.id, p]));

  // ── 이번 달 현재까지 일수 계산 (월별 예상 지출용) ──
  // 크론 실행 시각 기준 이번 달 경과 일수
  const kstNow = new Date(now.getTime() + KST_OFFSET);
  const dayOfMonth = kstNow.getUTCDate(); // KST 기준 오늘이 몇 일인지

  let sent = 0;

  for (const [userId, data] of userMap) {
    const profile = profileMap.get(userId);
    const thisTotal  = data.thisWeek.reduce((s, e) => s + (e.amount ?? 0), 0);
    const prevTotal  = data.prevWeek.reduce((s, e) => s + (e.amount ?? 0), 0);

    if (thisTotal === 0) continue; // 지출 없으면 스킵

    // 일평균 & 이번 달 예상
    const dailyAvg     = Math.round(thisTotal / 7);
    const daysInMonth  = new Date(kstNow.getUTCFullYear(), kstNow.getUTCMonth() + 1, 0).getUTCDate();
    const projectedAmt = Math.round(dailyAvg * daysInMonth);

    // 지난주 대비 증감률
    const diffPct = prevTotal > 0
      ? Math.round(((thisTotal - prevTotal) / prevTotal) * 100)
      : null;
    const trendEmoji = diffPct === null ? '' : diffPct > 0 ? '🔴' : diffPct < 0 ? '🟢' : '➡️';
    const trendText  = diffPct === null
      ? '지난주 데이터 없음'
      : diffPct > 0
        ? `지난주 대비 +${diffPct}% 속도 ${trendEmoji}`
        : diffPct < 0
          ? `지난주 대비 ${diffPct}% 절감 ${trendEmoji}`
          : `지난주와 동일한 속도 ${trendEmoji}`;

    // 가장 많이 소비한 카테고리
    const catTotals = new Map<string, number>();
    data.thisWeek.forEach((e) => {
      if (!e.expense_category) return;
      catTotals.set(e.expense_category, (catTotals.get(e.expense_category) ?? 0) + (e.amount ?? 0));
    });
    let topCat = '';
    let topAmt = 0;
    catTotals.forEach((amt, cat) => { if (amt > topAmt) { topAmt = amt; topCat = cat; } });

    // FCM 메시지 (패턴 3: 행동 유도형)
    const fcmTitle = `📊 이번 주 소비 패턴 (${weekStartLabel} ~ ${weekEndLabel})`;
    const fcmBody  = [
      `총 ${thisTotal.toLocaleString('ko-KR')}원 | 일평균 ${dailyAvg.toLocaleString('ko-KR')}원`,
      `이 페이스라면 이번 달 예상 지출 ${projectedAmt.toLocaleString('ko-KR')}원`,
      trendText,
    ].join('\n');
    const url = '/budget';

    if (profile?.fcm_token) {
      await sendFCMToMultiple([profile.fcm_token], fcmTitle, fcmBody, url);
    }

    // ── in-app 알림 기록 ──
    // 이번 주 중복 발송 방지 확인
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('title', fcmTitle)
      .gte('created_at', weekStart.toISOString())
      .limit(1);

    if (!existing?.length) {
      // 상세 정보를 body에 포함한 in-app 알림
      const inAppBody = [
        `총 ${thisTotal.toLocaleString('ko-KR')}원 | 일평균 ${dailyAvg.toLocaleString('ko-KR')}원`,
        `이달 예상: ${projectedAmt.toLocaleString('ko-KR')}원`,
        topCat ? `최다 지출: ${topCat}` : '',
        trendText,
      ].filter(Boolean).join(' · ');

      await supabase.from('notifications').insert({
        user_id:    userId,
        title:      fcmTitle,
        body:       inAppBody,
        type:       'system',
        created_at: now.toISOString(),
      });
      sent++;
    }
  }

  return NextResponse.json({
    ok: true,
    processed_at: now.toISOString(),
    week: `${weekStartLabel} ~ ${weekEndLabel}`,
    users_with_expenses: userMap.size,
    sent,
  });
}
