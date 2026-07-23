-- FAM-001 — account_age_profiles 기반 공통 capability를 Data API/RLS에 강제한다.
-- UI 숨김이나 Route Handler 검증을 우회해도 미성년 관리 계정은
-- 가계부와 공간 관리·초대 쓰기를 수행할 수 없어야 한다.

CREATE OR REPLACE FUNCTION public.has_account_capability(p_capability text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH current_mode AS (
    SELECT COALESCE((
      SELECT aap.account_mode
      FROM public.account_age_profiles AS aap
      WHERE aap.user_id = (SELECT auth.uid())
      LIMIT 1
    ), 'unknown') AS account_mode
  )
  SELECT CASE p_capability
    WHEN 'canManageSpaces' THEN account_mode NOT IN (
      'pending_guardian_consent',
      'child_managed',
      'teen_consent_pending',
      'teen'
    )
    WHEN 'canInviteMembers' THEN account_mode NOT IN (
      'pending_guardian_consent',
      'child_managed',
      'teen_consent_pending',
      'teen'
    )
    WHEN 'canViewHouseholdBudget' THEN account_mode NOT IN (
      'pending_guardian_consent',
      'child_managed',
      'teen_consent_pending',
      'teen'
    )
    WHEN 'canCompleteRoutine' THEN true
    WHEN 'canUseCheckIn' THEN account_mode IN ('child_managed', 'teen')
    WHEN 'canRequestLocationPermission' THEN false
    WHEN 'canShowAds' THEN account_mode = 'adult'
    ELSE false
  END
  FROM current_mode;
$$;

COMMENT ON FUNCTION public.has_account_capability(text) IS
  '현재 auth.uid()의 서버 관리 account_mode를 capability boolean으로 변환한다.';

REVOKE ALL ON FUNCTION public.has_account_capability(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_account_capability(text) TO authenticated, service_role;

-- 가계부는 읽기와 쓰기 모두 동일한 capability로 제한한다.
DROP POLICY IF EXISTS "ledger_entries: account capability" ON public.ledger_entries;
CREATE POLICY "ledger_entries: account capability"
  ON public.ledger_entries
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT public.has_account_capability('canViewHouseholdBudget')))
  WITH CHECK ((SELECT public.has_account_capability('canViewHouseholdBudget')));

-- 공간 조회·개인 닉네임 수정·본인 탈퇴는 유지하되 생성/관리/초대를 제한한다.
DROP POLICY IF EXISTS "family_groups: account capability insert" ON public.family_groups;
CREATE POLICY "family_groups: account capability insert"
  ON public.family_groups
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.has_account_capability('canManageSpaces')));

DROP POLICY IF EXISTS "family_groups: account capability update" ON public.family_groups;
CREATE POLICY "family_groups: account capability update"
  ON public.family_groups
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.has_account_capability('canManageSpaces')))
  WITH CHECK ((SELECT public.has_account_capability('canManageSpaces')));

DROP POLICY IF EXISTS "family_groups: account capability delete" ON public.family_groups;
CREATE POLICY "family_groups: account capability delete"
  ON public.family_groups
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING ((SELECT public.has_account_capability('canManageSpaces')));

DROP POLICY IF EXISTS "space_members: account capability insert" ON public.space_members;
CREATE POLICY "space_members: account capability insert"
  ON public.space_members
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.has_account_capability('canInviteMembers')));

DROP POLICY IF EXISTS "space_members: account capability update" ON public.space_members;
CREATE POLICY "space_members: account capability update"
  ON public.space_members
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.has_account_capability('canManageSpaces'))
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR (SELECT public.has_account_capability('canManageSpaces'))
  );

DROP POLICY IF EXISTS "space_members: account capability delete" ON public.space_members;
CREATE POLICY "space_members: account capability delete"
  ON public.space_members
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.has_account_capability('canManageSpaces'))
  );
