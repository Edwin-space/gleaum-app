-- ============================================================
-- 012 — 고정지출 연체 알림 + 주간 소비 다이제스트 크론잡 등록
-- ============================================================
-- Supabase 대시보드 → SQL Editor → New Query 에서 실행하세요.
--
-- 필요 확장:
--   pg_cron  — 크론 스케줄 관리
--   pg_net   — HTTP 요청 발송
--
-- ★ 실행 전 아래 변수를 환경에 맞게 수정하세요:
--   app_url  : 배포된 Next.js 앱 URL (예: https://www.gleaum.com)
--   cron_secret : 환경변수 CRON_SECRET 값
-- ============================================================

-- ── 변수 설정 ──────────────────────────────────────────────
-- 아래 두 값을 실제 환경 값으로 교체하세요.
DO $$
DECLARE
  app_url     TEXT := 'https://www.gleaum.com';   -- ← 배포 URL로 교체
  cron_secret TEXT := 'your-cron-secret-here';    -- ← CRON_SECRET 값으로 교체
BEGIN

  -- ── 1) 고정지출 연체 알림 크론 ────────────────────────────
  -- 매일 00:00 UTC = 09:00 KST
  -- D+0(당일), D+3(3일 경과), D+7(7일 경과) 시점에 미결제 알림 발송
  PERFORM cron.schedule(
    'gleaum-overdue-expenses',        -- 크론 이름 (고유해야 함)
    '0 0 * * *',                      -- 매일 00:00 UTC
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
      app_url || '/api/cron/overdue-expenses',
      cron_secret
    )
  );

  -- ── 2) 주간 소비 다이제스트 크론 ──────────────────────────
  -- 매주 월요일 00:00 UTC = 월요일 09:00 KST
  -- 지난 7일 개인 지출 집계 후 FCM + in-app 알림 발송
  PERFORM cron.schedule(
    'gleaum-weekly-digest',           -- 크론 이름 (고유해야 함)
    '0 0 * * 1',                      -- 매주 월요일 00:00 UTC
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
      app_url || '/api/cron/weekly-digest',
      cron_secret
    )
  );

  RAISE NOTICE '✅ 크론잡 등록 완료: gleaum-overdue-expenses (매일 09:00 KST), gleaum-weekly-digest (매주 월요일 09:00 KST)';
END;
$$;

-- ── 등록 확인 ────────────────────────────────────────────────
-- 아래 쿼리로 등록 결과를 확인할 수 있습니다:
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE 'gleaum-%';

-- ── 크론 재등록이 필요한 경우 (기존 제거 후 재실행) ────────────
-- SELECT cron.unschedule('gleaum-overdue-expenses');
-- SELECT cron.unschedule('gleaum-weekly-digest');
