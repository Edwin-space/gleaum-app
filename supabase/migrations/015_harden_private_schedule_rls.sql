-- 015_harden_private_schedule_rls.sql
-- 목적: 개인 일정/개인 가계부(private visibility)가 공유 공간 멤버에게 노출될 수 있는 RLS 틈을 차단한다.
-- 실행 위치: Supabase SQL Editor
-- 실행 방식: 이 파일 전체를 복사해서 실행

BEGIN;

-- 기존 정책 제거
DROP POLICY IF EXISTS "schedules: 공간 일정 조회" ON schedules;
DROP POLICY IF EXISTS "schedules: 일정 수정 (editor 이상 또는 본인)" ON schedules;
DROP POLICY IF EXISTS "schedules: 일정 삭제 (본인 또는 admin)" ON schedules;
DROP POLICY IF EXISTS "schedule_participants: 참여자 조회" ON schedule_participants;

-- private 일정/지출은 생성자 본인에게만 조회 허용.
-- space/shared/null visibility 데이터는 기존처럼 같은 공간 멤버에게 조회 허용.
CREATE POLICY "schedules: 공간 일정 조회"
  ON schedules FOR SELECT
  USING (
    family_group_id IN (SELECT my_space_ids())
    AND (
      visibility IS NULL
      OR visibility <> 'private'
      OR created_by = auth.uid()
    )
  );

-- private 일정/지출은 생성자 본인만 수정 가능.
-- 공유 일정/공간 지출은 기존처럼 생성자 또는 editor 이상 수정 가능.
CREATE POLICY "schedules: 일정 수정 (editor 이상 또는 본인)"
  ON schedules FOR UPDATE
  USING (
    family_group_id IN (SELECT my_space_ids())
    AND (
      (visibility = 'private' AND created_by = auth.uid())
      OR (
        (visibility IS NULL OR visibility <> 'private')
        AND (
          created_by = auth.uid()
          OR can_edit_in_space(family_group_id)
        )
      )
    )
  );

-- private 일정/지출은 생성자 본인만 삭제 가능.
-- 공유 일정/공간 지출은 생성자 또는 공간 지기(admin) 삭제 가능.
CREATE POLICY "schedules: 일정 삭제 (본인 또는 admin)"
  ON schedules FOR DELETE
  USING (
    family_group_id IN (SELECT my_space_ids())
    AND (
      (visibility = 'private' AND created_by = auth.uid())
      OR (
        (visibility IS NULL OR visibility <> 'private')
        AND (
          created_by = auth.uid()
          OR is_space_admin(family_group_id)
        )
      )
    )
  );

-- private 일정의 참여자 정보도 생성자 본인에게만 조회 허용.
CREATE POLICY "schedule_participants: 참여자 조회"
  ON schedule_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_id
        AND s.family_group_id IN (SELECT my_space_ids())
        AND (
          s.visibility IS NULL
          OR s.visibility <> 'private'
          OR s.created_by = auth.uid()
        )
    )
  );

COMMIT;

-- 실행 후 확인용: 아래 4개 정책명이 보이면 정상입니다.
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('schedules', 'schedule_participants')
  AND policyname IN (
    'schedules: 공간 일정 조회',
    'schedules: 일정 수정 (editor 이상 또는 본인)',
    'schedules: 일정 삭제 (본인 또는 admin)',
    'schedule_participants: 참여자 조회'
  )
ORDER BY tablename, policyname;
