-- ============================================================
-- 021 — 가족 자녀 기반 인덱스/RLS 성능 보강
-- ============================================================
-- 020 적용 후 Supabase Advisor에서 확인된 신규 테이블의
-- 외래키 인덱스와 auth.uid() initplan 경고를 정리한다.
-- ============================================================

BEGIN;

-- ── 1. 외래키/조회 인덱스 ──────────────────────────────────

CREATE INDEX IF NOT EXISTS family_dependents_created_by_idx
  ON public.family_dependents(created_by)
  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS family_relationships_dependent_id_idx
  ON public.family_relationships(dependent_id);

CREATE INDEX IF NOT EXISTS family_relationships_space_id_idx
  ON public.family_relationships(space_id);

CREATE INDEX IF NOT EXISTS guardian_consents_guardian_user_id_idx
  ON public.guardian_consents(guardian_user_id);

CREATE INDEX IF NOT EXISTS space_invitations_space_id_idx
  ON public.space_invitations(space_id);

CREATE INDEX IF NOT EXISTS space_invitations_invited_by_idx
  ON public.space_invitations(invited_by)
  WHERE invited_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS space_invitations_consumed_by_idx
  ON public.space_invitations(consumed_by)
  WHERE consumed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS account_age_profiles_source_dependent_id_idx
  ON public.account_age_profiles(source_dependent_id)
  WHERE source_dependent_id IS NOT NULL;


-- ── 2. RLS auth.uid() initplan 최적화 ───────────────────────

DROP POLICY IF EXISTS "family_dependents: 관계자 조회" ON public.family_dependents;
CREATE POLICY "family_dependents: 관계자 조회"
  ON public.family_dependents
  FOR SELECT
  TO authenticated
  USING (
    linked_user_id = (SELECT auth.uid())
    OR public.is_space_admin(space_id)
    OR EXISTS (
      SELECT 1
      FROM public.family_relationships fr
      WHERE fr.dependent_id = family_dependents.id
        AND fr.guardian_user_id = (SELECT auth.uid())
        AND fr.verification_status IN ('pending', 'verified')
    )
  );

DROP POLICY IF EXISTS "family_relationships: 관계자 조회" ON public.family_relationships;
CREATE POLICY "family_relationships: 관계자 조회"
  ON public.family_relationships
  FOR SELECT
  TO authenticated
  USING (
    guardian_user_id = (SELECT auth.uid())
    OR child_user_id = (SELECT auth.uid())
    OR public.is_space_admin(space_id)
  );

DROP POLICY IF EXISTS "guardian_consents: 관계자 조회" ON public.guardian_consents;
CREATE POLICY "guardian_consents: 관계자 조회"
  ON public.guardian_consents
  FOR SELECT
  TO authenticated
  USING (
    guardian_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.family_dependents fd
      WHERE fd.id = guardian_consents.dependent_id
        AND fd.linked_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "space_invitations: 발급자 조회" ON public.space_invitations;
CREATE POLICY "space_invitations: 발급자 조회"
  ON public.space_invitations
  FOR SELECT
  TO authenticated
  USING (
    invited_by = (SELECT auth.uid())
    AND public.is_space_admin(space_id)
  );

DROP POLICY IF EXISTS "account_age_profiles: 본인 조회" ON public.account_age_profiles;
CREATE POLICY "account_age_profiles: 본인 조회"
  ON public.account_age_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

COMMIT;

SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'family_dependents',
    'family_relationships',
    'guardian_consents',
    'space_invitations',
    'account_age_profiles'
  )
ORDER BY tablename, policyname;
