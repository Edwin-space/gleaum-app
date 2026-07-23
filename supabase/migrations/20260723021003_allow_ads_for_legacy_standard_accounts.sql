-- 기존 일반 계정은 가족/자녀 계정 모델 도입 전에 생성되어
-- account_age_profiles 행이 없으며 account_mode가 unknown으로 계산된다.
-- 자녀/청소년 제한 계정은 항상 명시적인 managed mode를 가지므로,
-- unknown은 기존 일반 계정으로 취급해 광고를 허용한다.

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
    WHEN 'canShowAds' THEN account_mode NOT IN (
      'pending_guardian_consent',
      'child_managed',
      'teen_consent_pending',
      'teen'
    )
    ELSE false
  END
  FROM current_mode;
$$;

COMMENT ON FUNCTION public.has_account_capability(text) IS
  '현재 auth.uid()의 서버 관리 account_mode를 capability boolean으로 변환한다. unknown은 가족 계정 도입 전 일반 계정이다.';

REVOKE ALL ON FUNCTION public.has_account_capability(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_account_capability(text) TO authenticated, service_role;

SELECT public.has_account_capability('canShowAds') AS current_user_can_show_ads;
