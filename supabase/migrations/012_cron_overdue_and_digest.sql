-- ============================================================
-- 012 — 고정지출 연체 알림 + 주간 소비 다이제스트 크론잡 등록
-- ============================================================
-- Supabase 대시보드 → SQL Editor → New Query 에서 실행하세요.
--
-- 필요 확장:
--   pg_cron  — 크론 스케줄 관리
--   pg_net   — HTTP 요청 발송
--
-- ★ 실행 전: 아래 SQL의 `<CRON_SECRET>` 부분을 Vercel 환경변수 CRON_SECRET 값으로
--   모두 치환하세요 (찾기-바꾸기 권장). app_url(www.gleaum.com)은 그대로 두면 됩니다.
--
-- ⚠️ 도크쿼팅($$) 중첩 주의: DO 블록 안에서 format($$ ... $$)처럼 같은 $$ 태그를
--    중첩하면 "syntax error at or near SELECT" 오류가 난다. 그래서 아래는 DO/format
--    없이 cron.schedule(name, schedule, '명령문 평문') 형태로 작성했다.
--    (명령문 안의 작은따옴표는 ''로 이스케이프)
-- ============================================================

-- ── 1) 고정지출 연체 알림 크론 ────────────────────────────────
--    매일 00:00 UTC = 09:00 KST / D+0·D+3·D+7 미결제 알림 발송
SELECT cron.schedule(
  'gleaum-overdue-expenses',
  '0 0 * * *',
  'SELECT net.http_post(url:=''https://www.gleaum.com/api/cron/overdue-expenses'', headers:=''{"Content-Type":"application/json","Authorization":"Bearer <CRON_SECRET>"}''::jsonb, body:=''{}''::jsonb);'
);

-- ── 2) 주간 소비 다이제스트 크론 ──────────────────────────────
--    매주 월요일 00:00 UTC = 월요일 09:00 KST / 지난 7일 개인 지출 집계 알림
SELECT cron.schedule(
  'gleaum-weekly-digest',
  '0 0 * * 1',
  'SELECT net.http_post(url:=''https://www.gleaum.com/api/cron/weekly-digest'', headers:=''{"Content-Type":"application/json","Authorization":"Bearer <CRON_SECRET>"}''::jsonb, body:=''{}''::jsonb);'
);

-- ── 등록 확인 ────────────────────────────────────────────────
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE 'gleaum-%';

-- ── 재등록(제거 후 재실행)이 필요한 경우 ─────────────────────
-- SELECT cron.unschedule('gleaum-overdue-expenses');
-- SELECT cron.unschedule('gleaum-weekly-digest');
