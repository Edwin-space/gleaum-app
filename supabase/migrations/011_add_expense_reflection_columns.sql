-- 011_add_expense_reflection_columns.sql
-- 공간 지출과 개인 가계부 반영 기록을 연결하기 위한 중기 모델 컬럼 추가
-- 실행 위치: Supabase Dashboard → SQL Editor → New Query → 전체 붙여넣기 → Run

ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS source_space_expense_id uuid REFERENCES schedules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_space_id uuid REFERENCES family_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expense_reflection_type text CHECK (expense_reflection_type IN ('actual_paid','final_share','manual')),
  ADD COLUMN IF NOT EXISTS expense_reflected_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_schedules_source_space_expense_id
  ON schedules(source_space_expense_id)
  WHERE source_space_expense_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_schedules_source_space_id
  ON schedules(source_space_id)
  WHERE source_space_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schedules_unique_expense_reflection_per_user
  ON schedules(source_space_expense_id, created_by)
  WHERE source_space_expense_id IS NOT NULL
    AND visibility = 'private';

COMMENT ON COLUMN schedules.source_space_expense_id IS '개인 가계부에 반영된 경우 원본 공간 지출 schedules.id';
COMMENT ON COLUMN schedules.source_space_id IS '개인 가계부 반영 원본 공간 ID';
COMMENT ON COLUMN schedules.expense_reflection_type IS '공간 지출을 개인 가계부에 반영한 기준: actual_paid/final_share/manual';
COMMENT ON COLUMN schedules.expense_reflected_at IS '공간 지출을 개인 가계부에 반영한 시각';

-- 적용 확인
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'schedules'
  AND column_name IN (
    'source_space_expense_id',
    'source_space_id',
    'expense_reflection_type',
    'expense_reflected_at'
  )
ORDER BY column_name;
