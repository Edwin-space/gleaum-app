-- ============================================================
-- Migration 005: 초대 코드 보안 강화
--
-- 목적:
--   1. family_groups.invite_code_expires_at — 7일 만료 정책
--   2. invite_attempts 테이블 — IP 기반 Rate Limit 기록
--
-- 실행 방법:
--   Supabase 대시보드 > SQL Editor > 이 파일 내용 붙여넣기 후 실행
-- ============================================================

-- ── 1. invite_code_expires_at 컬럼 추가 ──────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'family_groups' AND column_name = 'invite_code_expires_at'
  ) THEN
    ALTER TABLE family_groups ADD COLUMN invite_code_expires_at timestamptz;
    RAISE NOTICE 'family_groups.invite_code_expires_at 컬럼 추가됨';
  ELSE
    RAISE NOTICE 'family_groups.invite_code_expires_at 이미 존재';
  END IF;
END $$;

-- 기존 코드에 30일 만료 설정 (기존 발급 코드 호환성 유지)
UPDATE family_groups
SET invite_code_expires_at = now() + interval '30 days'
WHERE invite_code IS NOT NULL
  AND invite_code_expires_at IS NULL;

-- ── 2. invite_attempts 테이블 생성 (Rate Limit 기록용) ────────
CREATE TABLE IF NOT EXISTS invite_attempts (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ip         text        NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invite_attempts_ip_created
  ON invite_attempts (ip, created_at);

-- 서버 전용 테이블 — RLS 활성화 후 아무 정책도 만들지 않음 (service role만 접근)
ALTER TABLE invite_attempts ENABLE ROW LEVEL SECURITY;

-- ── 3. 오래된 시도 기록 자동 정리 함수 ──────────────────────
CREATE OR REPLACE FUNCTION cleanup_old_invite_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM invite_attempts
  WHERE created_at < now() - interval '24 hours';
END;
$$;

-- ── 완료 메시지 ───────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 005 완료: invite_code_expires_at 추가, invite_attempts 테이블 생성';
END $$;
