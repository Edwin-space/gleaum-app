-- ============================================================
-- 017 — 수입·지출 통합 원장(ledger_entries) 도입
-- ============================================================
-- Supabase 대시보드 → SQL Editor → New Query 에서 실행하세요.
--
-- 가계부를 "지출만" → "수입·지출·순액"으로 확장하기 위한 통합 원장.
-- 개인(scope='personal') / 공간(scope='space') 공용, 수입(income)/지출(expense) 공용.
-- 기존 schedules의 지출은 아래 백필로 복사하며, 원본은 보존(롤백 안전).
--
-- ⚠️ 이 마이그레이션을 먼저 실행해야 가계부 수입 기능 배포본이 정상 동작합니다.
-- ============================================================

-- ── 1) 테이블 ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ledger_entries (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            text        NOT NULL CHECK (kind IN ('income','expense')),
  scope           text        NOT NULL CHECK (scope IN ('personal','space')),
  space_id        uuid        NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  owner_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  amount          bigint      NOT NULL DEFAULT 0 CHECK (amount >= 0),
  category        text        NOT NULL,                      -- 앱 enum(income_*/expense_*)로 검증
  method          text,                                      -- 지출: 결제수단 / 수입: 입금수단(선택)
  occurred_at     timestamptz NOT NULL,                      -- 발생일
  status          text        NOT NULL DEFAULT 'completed'
                  CHECK (status IN ('pending','completed','skipped')),
  recur_freq      text        NOT NULL DEFAULT 'none'
                  CHECK (recur_freq IN ('none','weekly','monthly','yearly')),
  recur_until     date,
  recur_rule_id   uuid,                                      -- 정기 시리즈 묶음(향후 사용)
  source_entry_id uuid        REFERENCES ledger_entries(id) ON DELETE SET NULL, -- 공간→개인 반영 원본
  memo            text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_space_occurred ON ledger_entries(space_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_ledger_owner          ON ledger_entries(owner_id);
CREATE INDEX IF NOT EXISTS idx_ledger_recur_rule     ON ledger_entries(recur_rule_id) WHERE recur_rule_id IS NOT NULL;
-- 공간 지출/수입을 개인 가계부에 반영한 항목은 (원본,소유자)당 1건만
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_unique_reflection
  ON ledger_entries(source_entry_id, owner_id)
  WHERE source_entry_id IS NOT NULL AND scope = 'personal';

-- ── 2) RLS (기존 my_space_ids() 패턴) ────────────────────────
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- 공간 멤버는 공간 항목 조회, 개인(personal) 항목은 본인만
DROP POLICY IF EXISTS "ledger_select" ON ledger_entries;
CREATE POLICY "ledger_select" ON ledger_entries FOR SELECT
  USING (
    space_id IN (SELECT my_space_ids())
    AND (scope <> 'personal' OR owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "ledger_insert" ON ledger_entries;
CREATE POLICY "ledger_insert" ON ledger_entries FOR INSERT
  WITH CHECK (owner_id = auth.uid() AND space_id IN (SELECT my_space_ids()));

DROP POLICY IF EXISTS "ledger_update" ON ledger_entries;
CREATE POLICY "ledger_update" ON ledger_entries FOR UPDATE
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "ledger_delete" ON ledger_entries;
CREATE POLICY "ledger_delete" ON ledger_entries FOR DELETE
  USING (owner_id = auth.uid());

-- ── 3) 백필: 기존 schedules의 지출 → ledger_entries (원본 보존) ──
-- 멱등성: ledger_entries가 비어 있을 때만 1회 복사.
DO $backfill$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ledger_entries LIMIT 1) THEN
    INSERT INTO ledger_entries
      (kind, scope, space_id, owner_id, title, amount, category, method,
       occurred_at, status, recur_freq, recur_until, memo, created_at, updated_at)
    SELECT
      'expense',
      CASE WHEN s.visibility = 'private' THEN 'personal' ELSE 'space' END,
      s.family_group_id,
      s.created_by,
      s.title,
      COALESCE(s.amount, 0),
      COALESCE(s.expense_category, 'other'),
      s.payment_method,
      s.start_time,
      CASE WHEN s.status = 'completed' THEN 'completed' ELSE 'pending' END,
      CASE WHEN COALESCE(s.repeat,'none') IN ('weekly','monthly','yearly') THEN s.repeat ELSE 'none' END,
      s.repeat_end_date::date,
      s.memo,
      s.created_at,
      s.updated_at
    FROM schedules s
    WHERE s.type = 'expense';

    RAISE NOTICE '✅ ledger_entries 백필 완료 (schedules 지출 복사)';
  ELSE
    RAISE NOTICE 'ℹ️ ledger_entries에 이미 데이터가 있어 백필을 건너뜀';
  END IF;
END;
$backfill$;

-- ── 확인 ────────────────────────────────────────────────────
-- SELECT kind, scope, count(*), sum(amount) FROM ledger_entries GROUP BY 1,2 ORDER BY 1,2;
