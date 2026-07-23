/**
 * 백오피스 — App Distribution API
 *
 * GET    /api/releases          최신 릴리즈 목록 + 테스터 목록 조회
 * POST   /api/releases          테스터 추가
 * DELETE /api/releases          테스터 제거
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import {
  getFirebaseAccessToken,
  ANDROID_APP_ID,
  DIST_BASE,
  DIST_SCOPE,
  PROJECT_NUMBER,
} from '@/lib/firebase-admin';

const DEFAULT_GROUP_ALIAS = process.env.FIREBASE_APP_DISTRIBUTION_GROUP_ALIAS || 'internal-testers';
const PROJECT_PARENT = `projects/${PROJECT_NUMBER}`;
const APP_PARENT = `${PROJECT_PARENT}/apps/${ANDROID_APP_ID}`;

type FirebaseGroup = {
  name: string;
  displayName?: string;
  testerCount?: number;
  releaseCount?: number;
};

type FirebaseTester = {
  name: string;
  displayName?: string;
  groups?: string[];
  lastActivityTime?: string;
};

type FirebaseRelease = {
  name: string;
  displayVersion?: string;
  buildVersion?: string;
  releaseNotes?: { text?: string };
  createTime?: string;
  firebaseConsoleUri?: string;
};

async function readFirebaseJson<T>(res: Response, label: string): Promise<T> {
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const message = body?.error?.message ?? text ?? `${label} 요청 실패`;
    console.error(`[Releases API] ${label} 실패:`, res.status, message);
    throw new Error(`${label} 실패 (${res.status}): ${message}`);
  }

  return body as T;
}

function getEmailFromTesterName(name: string): string {
  const raw = name.split('/').pop() ?? name;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function listAllTesters(token: string): Promise<FirebaseTester[]> {
  const testers: FirebaseTester[] = [];
  let pageToken = '';

  do {
    const qs = new URLSearchParams({ pageSize: '1000' });
    if (pageToken) qs.set('pageToken', pageToken);

    const res = await fetch(`${DIST_BASE}/${PROJECT_PARENT}/testers?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await readFirebaseJson<{ testers?: FirebaseTester[]; nextPageToken?: string }>(
      res,
      '테스터 목록 조회'
    );

    testers.push(...(data.testers ?? []));
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);

  return testers;
}

function findTargetGroup(groups: FirebaseGroup[]): FirebaseGroup | undefined {
  return groups.find((group) => {
    const alias = group.name.split('/').pop();
    return alias === DEFAULT_GROUP_ALIAS || group.displayName === DEFAULT_GROUP_ALIAS;
  });
}

/** GET — 릴리즈 목록 + internal-testers 그룹 테스터 조회 */
export async function GET() {
  const denial = await requireAdminApi();
  if (denial) return denial;

  try {
    const token = await getFirebaseAccessToken(DIST_SCOPE);

    const [relRes, grpRes] = await Promise.all([
      fetch(`${DIST_BASE}/${APP_PARENT}/releases?pageSize=10`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${DIST_BASE}/${PROJECT_PARENT}/groups?pageSize=100`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const relData = await readFirebaseJson<{ releases?: FirebaseRelease[] }>(relRes, '릴리즈 목록 조회');
    const grpData = await readFirebaseJson<{ groups?: FirebaseGroup[] }>(grpRes, '그룹 목록 조회');
    const releases = relData.releases ?? [];
    const groups = grpData.groups ?? [];
    const internalGroup = findTargetGroup(groups);

    const allTesters = internalGroup?.name ? await listAllTesters(token) : [];
    const testers = internalGroup?.name
      ? allTesters.filter((tester) => tester.groups?.includes(internalGroup.name))
      : [];

    return NextResponse.json({
      releases: releases.map((release) => ({
        name: release.name,
        version: release.displayVersion ?? '—',
        buildNumber: release.buildVersion ?? '—',
        releaseNotes: release.releaseNotes?.text ?? '',
        createdAt: release.createTime ?? '',
        consoleUrl: release.firebaseConsoleUri ?? '',
      })),
      testers: testers.map((tester) => ({
        name: tester.name,
        email: getEmailFromTesterName(tester.name),
        displayName: tester.displayName ?? '',
        lastActivityTime: tester.lastActivityTime ?? '',
      })),
      groups: groups.map((group) => ({
        name: group.name,
        alias: group.name.split('/').pop() ?? group.name,
        displayName: group.displayName ?? '',
        testerCount: group.testerCount ?? 0,
        releaseCount: group.releaseCount ?? 0,
      })),
      groupName: internalGroup?.name ?? '',
      groupAlias: DEFAULT_GROUP_ALIAS,
      projectNumber: PROJECT_NUMBER,
      appId: ANDROID_APP_ID,
    });
  } catch (e) {
    console.error('[Releases API] GET 오류:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

/** POST — 테스터 추가 */
export async function POST(req: NextRequest) {
  const denial = await requireAdminApi();
  if (denial) return denial;

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

    await readFirebaseJson(res, '테스터 추가');
    return NextResponse.json({ ok: true, added: emails });
  } catch (e) {
    console.error('[Releases API] POST 오류:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

/** DELETE — 테스터 제거 */
export async function DELETE(req: NextRequest) {
  const denial = await requireAdminApi();
  if (denial) return denial;

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

    await readFirebaseJson(res, '테스터 제거');
    return NextResponse.json({ ok: true, removed: emails });
  } catch (e) {
    console.error('[Releases API] DELETE 오류:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
