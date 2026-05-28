/**
 * 글리움 — 관리자 Remote Config API
 *
 * GET  /api/admin/remote-config      현재 Firebase Remote Config 값 조회
 * POST /api/admin/remote-config      Remote Config 값 업데이트
 *
 * Firebase Remote Config REST API v1 사용
 * 참고: https://firebase.google.com/docs/remote-config/automate-rc
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, getGoogleAccessToken } from '@/lib/admin-auth';
import { DEFAULT_CONFIG } from '@/lib/remote-config';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gleaum-firebase';
const RC_BASE = `https://firebaseremoteconfig.googleapis.com/v1/projects/${PROJECT_ID}/remoteConfig`;
const SCOPE = 'https://www.googleapis.com/auth/firebase.remoteconfig';

/** 현재 Remote Config 조회 */
export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const token = await getGoogleAccessToken(SCOPE);
      const res = await fetch(RC_BASE, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('[AdminRC] 조회 실패:', err);
        return NextResponse.json({ error: 'Remote Config 조회 실패' }, { status: 500 });
      }

      const data = await res.json();
      const parameters = data.parameters ?? {};

      // 기본값과 병합하여 모든 키 포함
      const result: Record<string, { value: string; source: 'remote' | 'default' }> = {};

      for (const [key, defaultVal] of Object.entries(DEFAULT_CONFIG)) {
        const param = parameters[key];
        const remoteValue = param?.defaultValue?.value;
        result[key] = {
          value: remoteValue !== undefined ? remoteValue : String(defaultVal),
          source: remoteValue !== undefined ? 'remote' : 'default',
        };
      }

      return NextResponse.json({
        config: result,
        etag: res.headers.get('etag') ?? '',
        version: data.version ?? null,
      });
    } catch (e) {
      console.error('[AdminRC] 오류:', e);
      return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
  });
}

/** Remote Config 업데이트 */
export async function POST(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { updates } = await req.json() as {
        updates: Record<string, string>;
      };

      if (!updates || typeof updates !== 'object') {
        return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
      }

      // 허용된 키만 업데이트 (알 수 없는 키 방어)
      const allowedKeys = new Set(Object.keys(DEFAULT_CONFIG));
      const filtered: Record<string, string> = {};
      for (const [k, v] of Object.entries(updates)) {
        if (allowedKeys.has(k)) filtered[k] = v;
      }

      if (Object.keys(filtered).length === 0) {
        return NextResponse.json({ error: '업데이트할 유효한 키 없음' }, { status: 400 });
      }

      const token = await getGoogleAccessToken(SCOPE);

      // 현재 config 가져오기 (etag + 기존 parameters 보존)
      const getRes = await fetch(RC_BASE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!getRes.ok) {
        return NextResponse.json({ error: 'Remote Config 조회 실패' }, { status: 500 });
      }

      const current = await getRes.json();
      const etag = getRes.headers.get('etag') ?? '*';
      const parameters = current.parameters ?? {};

      // 기존 parameters에 변경값 병합
      for (const [key, value] of Object.entries(filtered)) {
        parameters[key] = { defaultValue: { value } };
      }

      // PUT으로 전체 config 덮어쓰기
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
        console.error('[AdminRC] 업데이트 실패:', err);
        return NextResponse.json({ error: 'Remote Config 업데이트 실패' }, { status: 500 });
      }

      console.info('[AdminRC] 업데이트 완료:', filtered);
      return NextResponse.json({ ok: true, updated: filtered });
    } catch (e) {
      console.error('[AdminRC] 오류:', e);
      return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
  });
}
