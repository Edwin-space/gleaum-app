-- ============================================================
-- 016 — 정기지출(고정지출) 이월 크론잡 등록
-- ============================================================
-- Supabase 대시보드 → SQL Editor → New Query 에서 실행하세요.
--
-- '매월/매주/매년' 반복 지출의 이번 달 인스턴스를 매일 자동 생성합니다.
-- (가계부 페이지를 열지 않아도 결제일 알림을 받을 수 있도록 서버에서 선제 생성)
--
-- 필요 확장: pg_cron, pg_net (012에서 이미 활성화됨)
--
-- ★ 실행 전 아래 변수를 환경에 맞게 수정하세요:
--   app_url     : 배포된 Next.js 앱 URL
--   cron_secret : 환경변수 CRON_SECRET 값
-- ============================================================

DO $$
DECLARE
  app_url     TEXT := 'https://www.gleaum.com';   -- ← 배포 URL로 교체
  cron_secret TEXT := 'your-cron-secret-here';    -- ← CRON_SECRET 값으로 교체
BEGIN

  -- 매일 15:10 UTC = 00:10 KST (자정 직후, overdue-expenses 크론보다 먼저 실행)
  PERFORM cron.schedule(
    'gleaum-recurring-expenses',
    '10 15 * * *',
    format(
      $$
      SELECT net.http_post(
        url     := %L,
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || %L
        ),
        body    := '{}'::jsonb
      );
      $$,
      app_url || '/api/cron/recurring-expenses',
      cron_secret
    )
  );

  RAISE NOTICE '✅ 크론잡 등록 완료: gleaum-recurring-expenses (매일 00:10 KST)';
END;
$$;

-- ── 등록 확인 ────────────────────────────────────────────────
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'gleaum-recurring-expenses';

-- ── 재등록이 필요한 경우 ─────────────────────────────────────
-- SELECT cron.unschedule('gleaum-recurring-expenses');
