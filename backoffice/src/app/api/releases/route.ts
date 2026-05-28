/**
 * 백오피스 — App Distribution API
 *
 * GET    /api/releases          최신 릴리즈 목록 + 테스터 목록 조회
 * POST   /api/releases          테스터 추가
 * DELETE /api/releases          테스터 제거
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getFirebaseAccessToken,
  ANDROID_APP_ID,
  DIST_BASE,
  DIST_SCOPE,
  PROJECT_ID,
} from '@/lib/firebase-admin';

/** GET — 릴리즈 목록 + internal-testers 그룹 테스터 조회 */
export async function GET() {
  try {
    const token = await getFirebaseAccessToken(DIST_SCOPE);

    // 최신 릴리즈 10개
    const [relRes, grpRes] = await Promise.all([
      fetch(`${DIST_BASE}/projects/${PROJECT_ID}/apps/${ANDROID_APP_ID}/releases?pageSize=10`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${DIST_BASE}/projects/${PROJECT_ID}/groups?pageSize=20`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const releases = relRes.ok ? ((await relRes.json()).releases ?? []) : [];
    const groups   = grpRes.ok ? ((await grpRes.json()).groups   ?? []) : [];

    // internal-testers 그룹 찾기
    const internalGroup = groups.find(
      (g: { name: string; displayName?: string }) =>
        g.name.includes('internal-testers') || g.displayName === 'internal-testers'
    );

    let testers: { name: string; displayName?: string }[] = [];
    if (internalGroup?.name) {
      const tRes = await fetch(
        `${DIST_BASE}/${internalGroup.name}?view=FULL`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (tRes.ok) {
        testers = (await tRes.json()).testers ?? [];
      }
    }

    return NextResponse.json({
      releases: releases.map((r: {
        name: string;
        displayVersion?: string;
        buildVersion?: string;
        releaseNotes?: { text?: string };
        createTime?: string;
        firebaseConsoleUri?: string;
      }) => ({
        name:         r.name,
        version:      r.displayVersion  ?? '—',
        buildNumber:  r.buildVersion    ?? '—',
        releaseNotes: r.releaseNotes?.text ?? '',
        createdAt:    r.createTime      ?? '',
        consoleUrl:   r.firebaseConsoleUri ?? '',
      })),
      testers: testers.map((t) => ({
        name:  t.name,
        email: t.displayName ?? t.name.split('/').pop() ?? t.name,
      })),
      groupName: internalGroup?.name ?? '',
    });
  } catch (e) {
    console.error('[Releases API] GET 오류:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/** POST — 테스터 추가 */
export async function POST(req: NextRequest) {
  try {
    const { emails, groupName } = await req.json() as { emails: string[]; groupName: string };
    if (!emails?.length || !groupName) {
      return NextResponse.json({ error: '이메일과 그룹명이 필요합니다.' }, { status: 400 });
    }

    const token = await getFirebaseAccessToken(DIST_SCOPE);
    const res = await fetch(`${DIST_BASE}/${groupName}:batchJoin`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Releases API] 테스터 추가 실패:', err);
      return NextResponse.json({ error: '테스터 추가 실패' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, added: emails });
  } catch (e) {
    console.error('[Releases API] POST 오류:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/** DELETE — 테스터 제거 */
export async function DELETE(req: NextRequest) {
  try {
    const { emails, groupName } = await req.json() as { emails: string[]; groupName: string };
    if (!emails?.length || !groupName) {
      return NextResponse.json({ error: '이메일과 그룹명이 필요합니다.' }, { status: 400 });
    }

    const token = await getFirebaseAccessToken(DIST_SCOPE);
    const res = await fetch(`${DIST_BASE}/${groupName}:batchLeave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Releases API] 테스터 제거 실패:', err);
      return NextResponse.json({ error: '테스터 제거 실패' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, removed: emails });
  } catch (e) {
    console.error('[Releases API] DELETE 오류:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
