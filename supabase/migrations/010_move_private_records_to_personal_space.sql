-- 010_move_private_records_to_personal_space.sql
-- 개인/private 기록이 공유 공간에 저장된 기존 데이터를 개인 공간으로 이동한다.
-- 원인: profiles.family_group_id가 공유 공간을 가리키는 상태에서 개인 지출/개인 일정 생성 시
--       target space를 personalSpaceId가 아닌 현재 공간으로 사용하던 클라이언트 버그.

UPDATE schedules AS s
SET
  family_group_id = (p.preferences->>'personalSpaceId')::uuid,
  updated_at = now()
FROM profiles AS p
WHERE s.created_by = p.id
  AND s.visibility = 'private'
  AND p.preferences ? 'personalSpaceId'
  AND p.preferences->>'personalSpaceId' IS NOT NULL
  AND p.preferences->>'personalSpaceId' <> ''
  AND s.family_group_id IS DISTINCT FROM (p.preferences->>'personalSpaceId')::uuid
  AND EXISTS (
    SELECT 1
    FROM space_members AS sm
    WHERE sm.space_id = (p.preferences->>'personalSpaceId')::uuid
      AND sm.user_id = p.id
  );

-- 적용 확인: 개인 공간 밖에 남은 private 기록 수
SELECT
  count(*) AS remaining_private_records_outside_personal_space
FROM schedules AS s
JOIN profiles AS p ON p.id = s.created_by
WHERE s.visibility = 'private'
  AND p.preferences ? 'personalSpaceId'
  AND p.preferences->>'personalSpaceId' IS NOT NULL
  AND p.preferences->>'personalSpaceId' <> ''
  AND s.family_group_id IS DISTINCT FROM (p.preferences->>'personalSpaceId')::uuid;
