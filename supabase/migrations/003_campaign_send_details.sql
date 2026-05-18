-- ============================================================
-- Migration 003: 캠페인 발송 건별 상세 기록
--
-- 목적:
--   campaign_logs 가 집계(sent/failed 합계) 만 저장하는 반면,
--   campaign_send_details 는 각 FCM 토큰별 성공·실패 원인을 저장하여
--   실패 원인 분석, 플랫폼별 통계, 비활성 토큰 감지에 활용한다.
--
-- 실행 방법:
--   Supabase 대시보드 > SQL Editor > 이 파일 내용 붙여넣기 후 실행
-- ============================================================

CREATE TABLE IF NOT EXISTS campaign_send_details (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  campaign_id     uuid        NOT NULL REFERENCES campaign_logs(id) ON DELETE CASCADE,
  user_id         uuid,                        -- 대상 유저 (profiles.id)
  token_prefix    text,                        -- FCM 토큰 앞 20자 (디버깅용)
  success         boolean     NOT NULL,
  error_code      text,                        -- FCM 에러 코드 (UNREGISTERED, INVALID_ARGUMENT 등)
  error_message   text                         -- FCM 에러 상세 메시지
);

COMMENT ON TABLE  campaign_send_details              IS '캠페인 FCM 발송 건별 성공/실패 상세';
COMMENT ON COLUMN campaign_send_details.token_prefix IS 'FCM 토큰 앞 20자 — 개인정보 최소화';
COMMENT ON COLUMN campaign_send_details.error_code   IS 'FCM v1 에러 status (UNREGISTERED, INVALID_ARGUMENT, QUOTA_EXCEEDED, INTERNAL 등)';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_csd_campaign_id ON campaign_send_details (campaign_id);
CREATE INDEX IF NOT EXISTS idx_csd_success     ON campaign_send_details (campaign_id, success);
CREATE INDEX IF NOT EXISTS idx_csd_error_code  ON campaign_send_details (error_code) WHERE error_code IS NOT NULL;

-- RLS
ALTER TABLE campaign_send_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON campaign_send_details;
CREATE POLICY "service_role_all" ON campaign_send_details
  USING (true) WITH CHECK (true);
