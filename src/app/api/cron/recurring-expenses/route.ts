/**
 * 글리움 — 정기지출(고정지출) 이월 크론잡
 * GET/POST /api/cron/recurring-expenses
 *
 * Supabase pg_cron에서 매일 15:10 UTC (= 00:10 KST)에 호출됩니다.
 * '매월/매주/매년' 반복 지출의 이번 달(KST 기준) 인스턴스가 없으면 생성합니다.
 * 클라이언트(가계부 페이지 진입 시)에서도 같은 로직이 lazy하게 동작하지만,
 * 앱을 열지 않는 사용자도 결제일 D-day 알림(overdue-expenses 크론)을 받을 수 있도록
 * 서버에서 선제적으로 생성합니다.
 *
 * 시리즈 식별: created_by + family_group_id + title + repeat 의 최신 인스턴스 기준.
 * 멱등성: 같은 시리즈가 같은 달(주간은 같은 날짜)에 이미 있으면 생성하지 않습니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) { return GET(req); }

interface ExpenseRow {
  id: string;
  title: string;
  start_time: string;
  repeat: string;
  repeat_end_date: string | null;
  all_day: boolean;
  reminder: number | null;
  memo: string | null;
  family_group_id: string;
  created_by: string;
  amount: number | null;
  expense_category: string | null;
  payment_method: string | null;
  visibility: string | null;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // KST 기준 현재 연/월 및 이번 달 경계(실시간 기준)
  const nowKst = new Date(Date.now() + KST_OFFSET_MS);
  const year  = nowKst.getUTCFullYear();
  const month = nowKst.getUTCMonth();
  const monthStart = new Date(Date.UTC(year, month, 1) - KST_OFFSET_MS);
  const monthEnd   = new Date(Date.UTC(year, month + 1, 1) - KST_OFFSET_MS - 1);
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  // 반복 지출 전체 조회 (개인 가계부: private)
  const { data, error } = await supabase
    .from('schedules')
    .select('id, title, start_time, repeat, repeat_end_date, all_day, reminder, memo, family_group_id, created_by, amount, expense_category, payment_method, visibility')
    .eq('type', 'expense')
    .eq('visibility', 'private')
    .neq('repeat', 'none')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('[recurring-expenses] 조회 오류:', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!data?.length) {
    return NextResponse.json({ ok: true, created: 0 });
  }

  // 시리즈 그룹핑 (start_time 오름차순 → 마지막 요소가 최신)
  const series = new Map<string, ExpenseRow[]>();
  for (const row of data as ExpenseRow[]) {
    const key = `${row.created_by}__${row.family_group_id}__${row.title}__${row.repeat}`;
    const list = series.get(key) ?? [];
    list.push(row);
    series.set(key, list);
  }

  let created = 0;
  const errors: string[] = [];

  for (const instances of series.values()) {
    const latest = instances[instances.length - 1];
    const latestDate = new Date(latest.start_time);
    const repeatEnd  = latest.repeat_end_date ? new Date(latest.repeat_end_date) : null;

    // 이번 달에 생성할 결제일 목록 (UTC 정오 — 모든 타임존에서 같은 달력 날짜)
    const targets: Date[] = [];

    if (latest.repeat === 'monthly') {
      if (latestDate >= monthStart) continue;
      const kstLatest = new Date(latestDate.getTime() + KST_OFFSET_MS);
      const day = Math.min(kstLatest.getUTCDate(), lastDayOfMonth);
      targets.push(new Date(Date.UTC(year, month, day, 12)));
    } else if (latest.repeat === 'yearly') {
      if (latestDate >= monthStart) continue;
      const kstLatest = new Date(latestDate.getTime() + KST_OFFSET_MS);
      if (kstLatest.getUTCMonth() !== month) continue;
      const day = Math.min(kstLatest.getUTCDate(), lastDayOfMonth);
      targets.push(new Date(Date.UTC(year, month, day, 12)));
    } else if (latest.repeat === 'weekly') {
      const cursor = new Date(latestDate);
      for (let i = 0; i < 60; i++) {
        cursor.setTime(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (cursor > monthEnd) break;
        if (cursor >= monthStart) {
          const kstCursor = new Date(cursor.getTime() + KST_OFFSET_MS);
          targets.push(new Date(Date.UTC(kstCursor.getUTCFullYear(), kstCursor.getUTCMonth(), kstCursor.getUTCDate(), 12)));
        }
      }
    } else {
      continue;
    }

    for (const target of targets) {
      if (repeatEnd && target > repeatEnd) continue;

      // 중복 방지: 같은 시리즈가 같은 달(주간은 같은 KST 날짜)에 이미 존재하면 스킵
      const targetKst = new Date(target.getTime() + KST_OFFSET_MS);
      const dup = instances.some((inst) => {
        const dKst = new Date(new Date(inst.start_time).getTime() + KST_OFFSET_MS);
        const sameMonth = dKst.getUTCFullYear() === targetKst.getUTCFullYear() && dKst.getUTCMonth() === targetKst.getUTCMonth();
        return latest.repeat === 'weekly' ? sameMonth && dKst.getUTCDate() === targetKst.getUTCDate() : sameMonth;
      });
      if (dup) continue;

      const { error: insertError } = await supabase.from('schedules').insert({
        title:             latest.title,
        type:              'expense',
        category:          'expense',
        visibility:        'private',
        automation_policy: 'reminder_only',
        start_time:        target.toISOString(),
        end_time:          null, // 정기지출은 end_time 미설정 — automations 크론 missed 전환 방지
        all_day:           latest.all_day,
        status:            'pending',
        reminder:          latest.reminder ?? 0,
        repeat:            latest.repeat,
        repeat_end_date:   latest.repeat_end_date,
        memo:              latest.memo,
        family_group_id:   latest.family_group_id,
        created_by:        latest.created_by,
        amount:            latest.amount,
        expense_category:  latest.expense_category,
        payment_method:    latest.payment_method,
      });
      if (insertError) {
        errors.push(`${latest.title}: ${insertError.message}`);
      } else {
        created++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    processed_at: new Date().toISOString(),
    series: series.size,
    created,
    ...(errors.length > 0 && { errors: errors.slice(0, 10) }),
  });
}
