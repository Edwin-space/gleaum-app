/**
 * 글리움 — 관리자 FCM 브로드캐스트 API
 *
 * POST /api/admin/fcm
 *
 * Body:
 *   title   : 알림 제목
 *   body    : 알림 내용
 *   url     : 클릭 시 이동할 경로 (선택, 예: /home)
 *   userIds : 특정 사용자 ID 배열 (선택, 없으면 전체 발송)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/admin-auth';
import { sendFCMToMultiple } from '@/lib/fcm';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  return withAdminAuth(req, async (adminEmail) => {
    try {
      const body = await req.json() as {
        title: string;
        body:  string;
        url?:  string;
        userIds?: string[];
      };

      const { title, url, userIds } = body;
      const msgBody = body.body;

      if (!title?.trim() || !msgBody?.trim()) {
        return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 });
      }

      const supabase = getSupabaseAdmin();

      // FCM 토큰 조회
      let query = supabase
        .from('profiles')
        .select('id, fcm_token')
        .not('fcm_token', 'is', null);

      if (userIds && userIds.length > 0) {
        query = query.in('id', userIds);
      }

      const { data: profiles, error } = await query;

      if (error) {
        console.error('[AdminFCM] 프로필 조회 실패:', error.message);
        return NextResponse.json({ error: 'DB 조회 실패' }, { status: 500 });
      }

      const tokens = (profiles ?? [])
        .map((p: { fcm_token: string | null }) => p.fcm_token)
        .filter((t): t is string => !!t);

      if (tokens.length === 0) {
        return NextResponse.json({ ok: true, sent: 0, total: 0 });
      }

      const successCount = await sendFCMToMultiple(tokens, title, msgBody, url);

      console.info(
        `[AdminFCM] 브로드캐스트 완료 | admin: ${adminEmail} | ${successCount}/${tokens.length} 성공`
      );

      return NextResponse.json({
        ok:    true,
        sent:  successCount,
        total: tokens.length,
        failed: tokens.length - successCount,
      });
    } catch (e) {
      console.error('[AdminFCM] 오류:', e);
      return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
  });
}
