-- family_role은 표시값이지만 보호자·자녀 UX와 연결되므로 멤버가 직접 바꾸면 안 된다.
-- 기존 nickname 본인 수정은 유지하고 권한·가족 관계 변경은 공간 admin만 허용한다.

CREATE OR REPLACE FUNCTION public.guard_space_member_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
    OR OLD.family_role IS DISTINCT FROM NEW.family_role
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
