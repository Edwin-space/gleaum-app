/**
 * 글리움 — 관리자 App Distribution API
 *
 * GET    /api/admin/distribution          최신 릴리즈 목록 조회
 * POST   /api/admin/distribution          테스터 추가
 * DELETE /api/admin/distribution          테스터 제거
 *
 * Firebase App Distribution REST API v1 사용
 * 참고: https://firebase.google.com/docs/reference/app-distribution/rest
 *
 * Android App ID: 1:913127709928:android:c4334b982b98b282febd5d
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, getGoogleAccessToken } from '@/lib/admin-auth';

const APP_ID   = '1:913127709928:android:c4334b982b98b282febd5d';
const PROJECT  = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gleaum-firebase';
const APP_BASE = `https://firebaseappdistribution.googleapis.com/v1/projects/${PROJECT}/apps/${APP_ID}`;
const SCOPE    = 'https://www.googleapis.com/auth/cloud-platform';

/** 최신 릴리즈 목록 + 테스터 수 조회 */
export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const token = await getGoogleAccessToken(SCOPE);

      // 최신 릴리즈 목록 (최대 10개)
      const relRes = await fetch(`${APP_BASE}/releases?pageSize=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const releases = relRes.ok ? (await relRes.json()).releases ?? [] : [];

      // 테스터 그룹 목록 (internal-testers)
      const grpRes = await fetch(
        `https://firebaseappdistribution.googleapis.com/v1/projects/${PROJECT}/groups?pageSize=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const groups = grpRes.ok ? (await grpRes.json()).groups ?? [] : [];

      // internal-testers 그룹 상세 (테스터 목록)
      const internalGroup = groups.find(
        (g: { name: string; displayName?: string }) =>
          g.name.endsWith('/internal-testers') || g.displayName === 'internal-testers'
      );

      let testers: { name: string; displayName?: string; emails?: string[] }[] = [];
      if (internalGroup?.name) {
        const tRes = await fetch(
          `https://firebaseappdistribution.googleapis.com/v1/${internalGroup.name}?view=FULL`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (tRes.ok) {
          const tData = await tRes.json();
          testers = tData.testers ?? [];
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
          name:           r.name,
          version:        r.displayVersion ?? '—',
          buildNumber:    r.buildVersion ?? '—',
          releaseNotes:   r.releaseNotes?.text ?? '',
          createdAt:      r.createTime ?? '',
          consoleUrl:     r.firebaseConsoleUri ?? '',
        })),
        testers: testers.map((t: {
          name: string;
          displayName?: string;
          emails?: string[];
        }) => ({
          name:      t.name,
          email:     t.displayName ?? t.name,
          groups:    t.emails ?? [],
        })),
        testerCount: testers.length,
        groupName:   internalGroup?.name ?? '',
      });
    } catch (e) {
      console.error('[AdminDist] 조회 오류:', e);
      return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
  });
}

/** 테스터 추가 */
export async function POST(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { emails, groupName } = await req.json() as {
        emails: string[];
        groupName: string;
      };

      if (!emails?.length || !groupName) {
        return NextResponse.json({ error: '이메일과 그룹명이 필요합니다.' }, { status: 400 });
      }

      const token = await getGoogleAccessToken(SCOPE);

      const res = await fetch(
        `https://firebaseappdistribution.googleapis.com/v1/${groupName}:batchJoin`,
        {
          method: 'POST',
          headers: {
            Authorization:  `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ emails }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        console.error('[AdminDist] 테스터 추가 실패:', err);
        return NextResponse.json({ error: '테스터 추가 실패' }, { status: 500 });
      }

      return NextResponse.json({ ok: true, added: emails });
    } catch (e) {
      console.error('[AdminDist] 오류:', e);
      return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
  });
}

/** 테스터 제거 */
export async function DELETE(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { emails, groupName } = await req.json() as {
        emails: string[];
        groupName: string;
      };

      if (!emails?.length || !groupName) {
        return NextResponse.json({ error: '이메일과 그룹명이 필요합니다.' }, { status: 400 });
      }

      const token = await getGoogleAccessToken(SCOPE);

      const res = await fetch(
        `https://firebaseappdistribution.googleapis.com/v1/${groupName}:batchLeave`,
        {
          method: 'POST',
          headers: {
            Authorization:  `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ emails }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        console.error('[AdminDist] 테스터 제거 실패:', err);
        return NextResponse.json({ error: '테스터 제거 실패' }, { status: 500 });
      }

      return NextResponse.json({ ok: true, removed: emails });
    } catch (e) {
      console.error('[AdminDist] 오류:', e);
      return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
  });
}
