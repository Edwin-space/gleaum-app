-- ============================================================
-- 가족·자녀 데이터 Data API 권한을 명시적으로 최소화
-- ============================================================
-- RLS 정책만으로 직접 쓰기를 막는 데 의존하지 않고, authenticated
-- 역할에는 SELECT만 부여한다. 쓰기는 SECURITY DEFINER RPC 또는
-- service_role 경로에서만 수행한다.

BEGIN;

REVOKE ALL ON TABLE
  public.family_dependents,
  public.family_relationships,
  public.guardian_consents,
  public.space_invitations,
  public.account_age_profiles,
  public.guardian_email_verifications
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.family_dependents,
  public.family_relationships,
  public.guardian_consents,
  public.space_invitations,
  public.account_age_profiles,
  public.guardian_email_verifications
TO authenticated;

GRANT ALL ON TABLE
  public.family_dependents,
  public.family_relationships,
  public.guardian_consents,
  public.space_invitations,
  public.account_age_profiles,
  public.guardian_email_verifications
TO service_role;

COMMIT;

-- 실행 후 anon에는 권한이 없고, authenticated에는 SELECT만 있어야 한다.
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'family_dependents',
    'family_relationships',
    'guardian_consents',
    'space_invitations',
    'account_age_profiles',
    'guardian_email_verifications'
  )
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;
