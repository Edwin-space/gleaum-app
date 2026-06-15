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
-- ★ 실행 전: 아래 `<CRON_SECRET>`를 Vercel 환경변수 CRON_SECRET 값으로 치환하세요.
--
-- ⚠️ 도크쿼팅($$) 중첩 주의: DO 블록 안 format($$ ... $$)는 "syntax error" 오류를
--    유발하므로, cron.schedule(name, schedule, '명령문 평문') 형태로 작성했다.
-- ============================================================

-- 매일 15:10 UTC = 00:10 KST (자정 직후, overdue-expenses(09:00 KST)보다 먼저 실행)
SELECT cron.schedule(
  'gleaum-recurring-expenses',
  '10 15 * * *',
  'SELECT net.http_post(url:=''https://www.gleaum.com/api/cron/recurring-expenses'', headers:=''{"Content-Type":"application/json","Authorization":"Bearer <CRON_SECRET>"}''::jsonb, body:=''{}''::jsonb);'
);

-- ── 등록 확인 ────────────────────────────────────────────────
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'gleaum-recurring-expenses';

-- ── 재등록(제거 후 재실행)이 필요한 경우 ─────────────────────
-- SELECT cron.unschedule('gleaum-recurring-expenses');
