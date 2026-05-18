-- ============================================================
-- Migration 002: 캠페인 발송 이력 & 클릭 추적 테이블
--
-- 목적:
--   - campaign_logs   : 백오피스에서 발송한 캠페인 기록
--   - campaign_clicks : 유저가 알림을 탭하여 유입된 기록
--
-- 실행 방법:
--   Supabase 대시보드 > SQL Editor > 이 파일 내용 붙여넣기 후 실행
-- ============================================================


-- ── 1. campaign_logs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_logs (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz DEFAULT now() NOT NULL,
  channel        text        NOT NULL,                    -- 'app_push' | 'sms' | 'email'
  segment        text        NOT NULL,                    -- 'all' | 'no_onboarding' | 'space_member'
  title          text        NOT NULL,
  body           text        NOT NULL,
  url            text,                                    -- 원본 랜딩 URL
  target_count   int         DEFAULT 0,
  sent_count     int         DEFAULT 0,
  failed_count   int         DEFAULT 0,
  status         text        DEFAULT 'completed'
    CHECK (status IN ('completed', 'partial', 'failed'))
);

COMMENT ON TABLE  campaign_logs             IS '백오피스 캠페인 발송 이력';
COMMENT ON COLUMN campaign_logs.channel     IS '발송 채널 (app_push, sms, email)';
COMMENT ON COLUMN campaign_logs.segment     IS '타겟 세그먼트';
COMMENT ON COLUMN campaign_logs.url         IS '원본 랜딩 URL (추적 URL 래핑 전)';
COMMENT ON COLUMN campaign_logs.status      IS 'completed=전원 성공, partial=일부 실패, failed=전원 실패';


-- ── 2. campaign_clicks ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_clicks (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz DEFAULT now() NOT NULL,
  campaign_id    uuid        NOT NULL REFERENCES campaign_logs(id) ON DELETE CASCADE,
  user_agent     text,                                    -- 브라우저/앱 정보
  platform       text                                    -- 'ios' | 'android' | 'web'
);

COMMENT ON TABLE  campaign_clicks             IS '캠페인 알림 탭(클릭) 유입 기록';
COMMENT ON COLUMN campaign_clicks.campaign_id IS '연결된 캠페인 ID';
COMMENT ON COLUMN campaign_clicks.platform    IS '유입 플랫폼 (user-agent 기반 추론)';


-- ── 3. 인덱스 ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_campaign_logs_created_at
  ON campaign_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_clicks_campaign_id
  ON campaign_clicks (campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_clicks_created_at
  ON campaign_clicks (created_at DESC);


-- ── 4. RLS ──────────────────────────────────────────────────
ALTER TABLE campaign_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_clicks ENABLE ROW LEVEL SECURITY;

-- 백오피스/서버(service_role)만 쓰기 허용, anon 읽기 차단
DROP POLICY IF EXISTS "service_role_all" ON campaign_logs;
CREATE POLICY "service_role_all" ON campaign_logs
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all" ON campaign_clicks;
CREATE POLICY "service_role_all" ON campaign_clicks
  USING (true) WITH CHECK (true);
