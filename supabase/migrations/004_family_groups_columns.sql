-- ============================================================
-- Migration 004: family_groups 컬럼 추가 + RLS INSERT 정책 보완
--
-- 목적:
--   1. family_groups.settings  JSONB  — 공간 설정 (목적, 일정 유형 등)
--   2. family_groups.cover_url  TEXT  — 커버 이미지 URL
--   3. INSERT RLS 정책 누락 방어 — "family_groups: 공간 생성" 보장
--
-- 실행 방법:
--   Supabase 대시보드 > SQL Editor > 이 파일 내용 붙여넣기 후 실행
-- ============================================================


-- ── 1. settings 컬럼 추가 (없을 때만) ───────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'family_groups' AND column_name = 'settings'
  ) THEN
    ALTER TABLE family_groups ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
    RAISE NOTICE 'family_groups.settings 컬럼 추가됨';
  ELSE
    RAISE NOTICE 'family_groups.settings 이미 존재';
  END IF;
END $$;


-- ── 2. cover_url 컬럼 추가 (없을 때만) ──────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'family_groups' AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE family_groups ADD COLUMN cover_url text;
    RAISE NOTICE 'family_groups.cover_url 컬럼 추가됨';
  ELSE
    RAISE NOTICE 'family_groups.cover_url 이미 존재';
  END IF;
END $$;


-- ── 3. family_groups INSERT RLS 정책 보장 ────────────────────
--    이미 존재하면 DROP하고 재생성 (idempotent)
DROP POLICY IF EXISTS "family_groups: 공간 생성" ON family_groups;
DROP POLICY IF EXISTS "가족 그룹 생성"           ON family_groups;

CREATE POLICY "family_groups: 공간 생성"
  ON family_groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

RAISE NOTICE '✅ family_groups INSERT 정책 재설정 완료';


-- ── 4. family_groups UPDATE RLS 정책 보장 ───────────────────
DROP POLICY IF EXISTS "family_groups: 공간 수정 (admin 전용)" ON family_groups;
DROP POLICY IF EXISTS "가족 그룹 수정"                       ON family_groups;

CREATE POLICY "family_groups: 공간 수정 (admin 전용)"
  ON family_groups FOR UPDATE
  USING (is_space_admin(id));


-- ── 완료 메시지 ───────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 004 완료: family_groups.settings, cover_url 추가, RLS 정책 재설정';
END $$;
