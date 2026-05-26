-- ============================================================
-- Migration 008: family_groups 에 timezone 컬럼 추가
--
-- 배경:
--   - profiles.timezone: 사용자 개인 설정 (이미 존재)
--   - family_groups.timezone: 공간(그룹) 단위 기준 시각대 (신규)
--
-- 활용처:
--   - 서버 크론잡(리마인더) 알림 시각 포맷
--   - 향후 다국가 사용자 그룹 지원 (UTC, JST 등)
--
-- 기본값: 'Asia/Seoul' (현재 타겟 사용자 100% 한국)
-- ============================================================

ALTER TABLE family_groups
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Seoul';

-- 기존 rows 도 기본값 적용 확인 (DEFAULT 가 자동으로 채움)
-- 필요 시 특정 그룹 수동 변경: UPDATE family_groups SET timezone = 'UTC' WHERE id = '...';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 008 완료: family_groups.timezone 컬럼 추가 (기본값: Asia/Seoul)';
END $$;
