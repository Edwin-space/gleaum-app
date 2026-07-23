/**
 * 백오피스 — Firebase Remote Config API
 *
 * GET  /api/remote-config    현재 설정값 조회
 * POST /api/remote-config    설정값 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { getFirebaseAccessToken, RC_BASE, RC_SCOPE } from '@/lib/firebase-admin';

// 허용된 키 목록 (gleaum 앱의 DEFAULT_CONFIG와 동일)
const ALLOWED_KEYS = new Set([
  'weekly_digest_enabled',
  'overdue_badge_enabled',
  'budget_dday_enabled',
  'onboarding_new_flow',
  'max_expense_categories',
  'maintenance_mode',
  'maintenance_message',
]);

const DEFAULT_VALUES: Record<string, string> = {
  weekly_digest_enabled:  'true',
  overdue_badge_enabled:  'true',
  budget_dday_enabled:    'true',
  onboarding_new_flow:    'false',
  max_expense_categories: '7',
  maintenance_mode:       'false',
  maintenance_message:    '서비스 점검 중입니다. 잠시 후 다시 시도해 주세요.',
};

export async function GET() {
  const denial = await requireAdminApi();
  if (denial) return denial;

  try {
    const token = await getFirebaseAccessToken(RC_SCOPE);
    const res = await fetch(RC_BASE, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Remote Config 조회 실패' }, { status: 500 });
    }

    const data = await res.json();
    const parameters = data.parameters ?? {};

    const config: Record<string, { value: string; source: 'remote' | 'default' }> = {};
    for (const key of Array.from(ALLOWED_KEYS)) {
      const remote = parameters[key]?.defaultValue?.value;
      config[key] = {
        value:  remote ?? DEFAULT_VALUES[key] ?? '',
        source: remote !== undefined ? 'remote' : 'default',
      };
    }

    return NextResponse.json({ config, version: data.version ?? null });
  } catch (e) {
    console.error('[RemoteConfig API] GET 오류:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denial = await requireAdminApi();
  if (denial) return denial;

  try {
    const { updates } = await req.json() as { updates: Record<string, string> };
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
    }

    // 허용된 키만 필터
    const filtered: Record<string, string> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (ALLOWED_KEYS.has(k)) filtered[k] = v;
    }
    if (!Object.keys(filtered).length) {
      return NextResponse.json({ error: '유효한 키 없음' }, { status: 400 });
    }

    const token = await getFirebaseAccessToken(RC_SCOPE);

    // 현재 config 가져오기 (etag + parameters 보존)
    const getRes = await fetch(RC_BASE, { headers: { Authorization: `Bearer ${token}` } });
    if (!getRes.ok) return NextResponse.json({ error: 'Remote Config 조회 실패' }, { status: 500 });

    const current    = await getRes.json();
    const etag       = getRes.headers.get('etag') ?? '*';
    const parameters = current.parameters ?? {};

    for (const [key, value] of Object.entries(filtered)) {
      parameters[key] = { defaultValue: { value } };
    }

    const putRes = await fetch(RC_BASE, {
      method: 'PUT',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json; UTF-8',
        'If-Match':     etag,
      },
      body: JSON.stringify({ parameters }),
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      console.error('[RemoteConfig API] 업데이트 실패:', err);
      return NextResponse.json({ error: 'Remote Config 업데이트 실패' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, updated: filtered });
  } catch (e) {
    console.error('[RemoteConfig API] POST 오류:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
