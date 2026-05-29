-- ============================================================
-- Migration 014: 광고 플랫폼 타겟팅 컬럼 추가 + RPC 업데이트
--
-- 문제:
--   013_ad_system.sql 에 platforms 컬럼이 누락되어
--   백오피스 광고 등록/수정 시 INSERT/UPDATE 오류 발생.
--   get_active_ad() RPC 도 p_platform 인자 없이 정의되어
--   API 호출 시 500 에러 반환.
--
-- 수정:
--   1. ads 테이블에 platforms 컬럼 추가 (기본값: 전 플랫폼)
--   2. get_active_ad() RPC 에 p_platform 필터 추가
-- ============================================================


-- ── 1. platforms 컬럼 추가 ────────────────────────────────────
ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS platforms text[] NOT NULL DEFAULT ARRAY['web','android','ios'];

COMMENT ON COLUMN ads.platforms IS '노출 플랫폼 목록 (web / android / ios)';

-- 기존 행 기본값 보정 (NULL → 전 플랫폼)
UPDATE ads SET platforms = ARRAY['web','android','ios'] WHERE platforms IS NULL;


-- ── 2. get_active_ad() — p_platform 필터 추가 ─────────────────
CREATE OR REPLACE FUNCTION get_active_ad(
  p_slot_id  text,
  p_platform text DEFAULT 'web'
)
RETURNS TABLE (
  id          uuid,
  title       text,
  description text,
  image_url   text,
  link_url    text,
  cta_text    text
)
LANGUAGE sql SECURITY DEFINER
STABLE
AS $$
  SELECT id, title, description, image_url, link_url, cta_text
  FROM   ads
  WHERE  slot_id   = p_slot_id
    AND  is_active = true
    AND  starts_at <= now()
    AND  (ends_at IS NULL OR ends_at > now())
    AND  (platforms @> ARRAY[p_platform]   -- 지정 플랫폼 포함
       OR platforms = ARRAY[]::text[])     -- 빈 배열은 전체 허용 (안전망)
  ORDER BY priority DESC, random()
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_active_ad IS '슬롯 + 플랫폼 기준 활성 광고 1개 조회 (우선순위 + 랜덤)';
