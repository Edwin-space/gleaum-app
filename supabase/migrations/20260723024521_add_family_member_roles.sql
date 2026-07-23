-- 가족 공간에서 운영 권한(admin/editor/viewer)과 가족 관계를 분리한다.
-- 운영 권한은 데이터 접근 제어에만 사용하고 family_role은 표시·개인화 용도다.

ALTER TABLE public.space_members
  ADD COLUMN IF NOT EXISTS family_role text;

ALTER TABLE public.space_members
  DROP CONSTRAINT IF EXISTS space_members_family_role_check;

ALTER TABLE public.space_members
  ADD CONSTRAINT space_members_family_role_check
  CHECK (
    family_role IS NULL OR family_role IN (
      'father',
      'mother',
      'grandfather',
      'grandmother',
      'spouse',
      'son',
      'daughter',
      'sibling',
      'guardian',
      'family',
      'other'
    )
  );

COMMENT ON COLUMN public.space_members.family_role IS
  '가족 공간 표시용 관계 역할. admin/editor/viewer 운영 권한과 분리되며 일반·개인 공간에서는 사용하지 않는다.';

CREATE OR REPLACE FUNCTION public.convert_space_to_family(p_space_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_space_type text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF NOT public.has_account_capability('canManageSpaces') THEN
    RAISE EXCEPTION 'account_capability_required' USING ERRCODE = '42501';
  END IF;

  SELECT fg.space_type
  INTO v_space_type
  FROM public.family_groups fg
  WHERE fg.id = p_space_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'space_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_space_type = 'personal' OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE NULLIF(p.preferences->>'personalSpaceId', '') = p_space_id::text
  ) THEN
    RAISE EXCEPTION 'personal_space_locked' USING ERRCODE = '22023';
  END IF;

  IF NOT public.is_space_admin(p_space_id) THEN
    RAISE EXCEPTION 'space_admin_required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.family_groups
  SET space_type = 'family',
      settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object('purpose', 'family')
  WHERE id = p_space_id;

  UPDATE public.space_members
  SET family_role = COALESCE(family_role, 'family')
  WHERE space_id = p_space_id;
END;
$$;

REVOKE ALL ON FUNCTION public.convert_space_to_family(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.convert_space_to_family(uuid) TO authenticated, service_role;
