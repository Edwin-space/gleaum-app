-- ============================================================
-- 019 — space_members UPDATE 정책 정리 및 권한 상승 방지
-- ============================================================
-- 실행 위치:
--   Supabase Dashboard -> SQL Editor -> New query
--
-- 실행 방식:
--   이 파일 전체 내용을 복사해서 실행합니다.
--
-- 목적:
--   1. 중복된 닉네임 수정 정책 정리
--   2. 본인 닉네임 수정 정책이 role 변경 우회로 쓰이지 않도록 DB 트리거로 차단
--   3. 기존 public 정책을 authenticated 대상으로 좁혀 명확화
-- ============================================================

BEGIN;

-- ── 1. space_members UPDATE 방어 트리거 ─────────────────────
-- RLS 정책은 컬럼 단위 제한이 아니므로, 본인 닉네임 수정 정책만으로는
-- 악의적 클라이언트의 role 변경 시도를 완전히 막기 어렵습니다.
-- role/user_id/space_id 변경은 반드시 기존 공간 admin만 가능하게 트리거로 강제합니다.

ALTER TABLE public.space_members
  ADD COLUMN IF NOT EXISTS nickname text;

CREATE OR REPLACE FUNCTION public.guard_space_member_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_is_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required'
      USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.space_members sm
    WHERE sm.space_id = OLD.space_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'admin'
  )
  INTO actor_is_admin;

  IF (
    OLD.space_id IS DISTINCT FROM NEW.space_id
    OR OLD.user_id IS DISTINCT FROM NEW.user_id
    OR OLD.role IS DISTINCT FROM NEW.role
    OR OLD.joined_at IS DISTINCT FROM NEW.joined_at
  ) AND NOT actor_is_admin THEN
    RAISE EXCEPTION 'space_member_privilege_update_requires_admin'
      USING ERRCODE = '42501';
  END IF;

  IF OLD.nickname IS DISTINCT FROM NEW.nickname
     AND NEW.user_id <> auth.uid()
     AND NOT actor_is_admin THEN
    RAISE EXCEPTION 'space_member_nickname_update_forbidden'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_space_member_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_space_member_update ON public.space_members;
CREATE TRIGGER guard_space_member_update
  BEFORE UPDATE ON public.space_members
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_space_member_update();


-- ── 2. space_members 정책 정리 ──────────────────────────────

DROP POLICY IF EXISTS "space_members: 공간 멤버 목록 조회" ON public.space_members;
CREATE POLICY "space_members: 공간 멤버 목록 조회"
  ON public.space_members
  FOR SELECT
  TO authenticated
  USING (space_id IN (SELECT public.my_space_ids()));

DROP POLICY IF EXISTS "space_members: 멤버 제거 (admin 또는 본인 탈퇴)" ON public.space_members;
CREATE POLICY "space_members: 멤버 제거 (admin 또는 본인 탈퇴)"
  ON public.space_members
  FOR DELETE
  TO authenticated
  USING (
    public.is_space_admin(space_id)
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "space_members: 본인 닉네임 수정" ON public.space_members;
DROP POLICY IF EXISTS "space_members_nickname_update" ON public.space_members;

CREATE POLICY "space_members: 본인 닉네임 수정"
  ON public.space_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ── 3. schedules 정책 role 명확화 ──────────────────────────

DROP POLICY IF EXISTS "schedules: 공간 일정 조회" ON public.schedules;
CREATE POLICY "schedules: 공간 일정 조회"
  ON public.schedules
  FOR SELECT
  TO authenticated
  USING (
    family_group_id IN (SELECT public.my_space_ids())
    AND (
      visibility IS NULL
      OR visibility <> 'private'
      OR created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "schedules: 일정 생성 (editor 이상)" ON public.schedules;
CREATE POLICY "schedules: 일정 생성 (editor 이상)"
  ON public.schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_group_id IN (SELECT public.my_space_ids())
    AND public.can_edit_in_space(family_group_id)
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "schedules: 일정 삭제 (본인 또는 admin)" ON public.schedules;
CREATE POLICY "schedules: 일정 삭제 (본인 또는 admin)"
  ON public.schedules
  FOR DELETE
  TO authenticated
  USING (
    family_group_id IN (SELECT public.my_space_ids())
    AND (
      (visibility = 'private' AND created_by = auth.uid())
      OR (
        (visibility IS NULL OR visibility <> 'private')
        AND (
          created_by = auth.uid()
          OR public.is_space_admin(family_group_id)
        )
      )
    )
  );


-- ── 4. schedule_participants 정책 role 명확화 ──────────────

DROP POLICY IF EXISTS "schedule_participants: 참여자 조회" ON public.schedule_participants;
CREATE POLICY "schedule_participants: 참여자 조회"
  ON public.schedule_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.schedules s
      WHERE s.id = schedule_id
        AND s.family_group_id IN (SELECT public.my_space_ids())
        AND (
          s.visibility IS NULL
          OR s.visibility <> 'private'
          OR s.created_by = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "schedule_participants: 참여자 삭제 (editor 이상)" ON public.schedule_participants;
CREATE POLICY "schedule_participants: 참여자 삭제 (editor 이상)"
  ON public.schedule_participants
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.schedules s
      WHERE s.id = schedule_id
        AND public.can_edit_in_space(s.family_group_id)
    )
  );

COMMIT;


-- ── 실행 후 확인용 ─────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('space_members', 'schedules', 'schedule_participants')
ORDER BY tablename, policyname;

