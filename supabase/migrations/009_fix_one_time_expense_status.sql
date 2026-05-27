-- 009_fix_one_time_expense_status.sql
-- 일회성 지출은 이미 발생한 소비 기록이므로 결제 예정 상태로 남기지 않는다.
-- 정기 지출(repeat != 'none')만 payment_due / pending 상태를 사용한다.

UPDATE schedules
SET
  status = 'completed',
  automation_policy = 'reminder_only',
  updated_at = now()
WHERE type = 'expense'
  AND COALESCE(repeat, 'none') = 'none'
  AND (
    status <> 'completed'
    OR automation_policy IS DISTINCT FROM 'reminder_only'
  );

-- 적용 확인
SELECT
  count(*) AS remaining_pending_one_time_expenses
FROM schedules
WHERE type = 'expense'
  AND COALESCE(repeat, 'none') = 'none'
  AND status <> 'completed';
