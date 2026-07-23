-- FAM-008 — 기존 공유 공간을 데이터 손실 없이 가족 공간으로 승격하고,
-- 단독 관리자 공유 공간을 원자적으로 삭제한다.
--
-- 개인 공간은 어떤 경우에도 삭제/승격할 수 없다. 가족 자녀·동의 이력이
-- 연결된 공간도 법적/운영 이력 보존을 위해 일반 삭제 경로에서 차단한다.

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
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_space_safely(p_space_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_space_type text;
  v_member_count integer;
  v_fallback_space_id uuid;
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

  SELECT count(*)::integer
  INTO v_member_count
  FROM public.space_members sm
  WHERE sm.space_id = p_space_id;

  IF v_member_count > 1 THEN
    RAISE EXCEPTION 'space_has_other_members' USING ERRCODE = '23503';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.family_dependents fd
    WHERE fd.space_id = p_space_id
  ) THEN
    RAISE EXCEPTION 'family_space_has_dependents' USING ERRCODE = '23503';
  END IF;

  SELECT COALESCE(
    (
      SELECT personal.id
      FROM public.profiles p
      JOIN public.family_groups personal
        ON personal.id::text = NULLIF(p.preferences->>'personalSpaceId', '')
      WHERE p.id = v_user_id
        AND personal.id <> p_space_id
      LIMIT 1
    ),
    (
      SELECT sm.space_id
      FROM public.space_members sm
      WHERE sm.user_id = v_user_id
        AND sm.space_id <> p_space_id
      ORDER BY sm.joined_at ASC
      LIMIT 1
    )
  )
  INTO v_fallback_space_id;

  -- 레거시 profiles.family_group_id가 삭제 공간을 가리키면 각 사용자의 개인 공간,
  -- 다른 멤버십, NULL 순서로 복구한다. 현재 정책상 단독 멤버지만 과거의 stale
  -- profile 참조까지 함께 정리해 FK NO ACTION 실패를 방지한다.
  UPDATE public.profiles p
  SET family_group_id = COALESCE(
    (
      SELECT personal.id
      FROM public.family_groups personal
      WHERE personal.id::text = NULLIF(p.preferences->>'personalSpaceId', '')
        AND personal.id <> p_space_id
      LIMIT 1
    ),
    (
      SELECT sm.space_id
      FROM public.space_members sm
      WHERE sm.user_id = p.id
        AND sm.space_id <> p_space_id
      ORDER BY sm.joined_at ASC
      LIMIT 1
    )
  )
  WHERE p.family_group_id = p_space_id;

  -- schedules.family_group_id는 NO ACTION FK이므로 공간 본체보다 먼저 삭제한다.
  -- 참가자는 CASCADE, 알림·공간 소식의 일정 링크는 SET NULL로 안전하게 정리된다.
  DELETE FROM public.schedules
  WHERE family_group_id = p_space_id;

  -- space_members, space_posts, ledger_entries와 가족 초대 계열은 FK CASCADE.
  DELETE FROM public.family_groups
  WHERE id = p_space_id;

  RETURN v_fallback_space_id;
END;
$$;

COMMENT ON FUNCTION public.convert_space_to_family(uuid) IS
  '관리자가 기존 공유 공간의 ID와 데이터를 유지한 채 가족 공간으로 승격한다.';
COMMENT ON FUNCTION public.delete_space_safely(uuid) IS
  '단독 관리자 공유 공간을 삭제하고 레거시 활성 공간 참조를 안전하게 복구한다.';

REVOKE ALL ON FUNCTION public.convert_space_to_family(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_space_safely(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_space_to_family(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_space_safely(uuid) TO authenticated, service_role;
