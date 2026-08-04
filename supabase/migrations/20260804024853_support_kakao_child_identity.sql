-- ============================================================
-- 자녀 초대: 카카오를 포함한 검증된 소셜 계정 연결 지원
-- ============================================================
-- 초대에 이메일 제한을 지정한 경우에는 기존처럼 확인된 이메일 일치를
-- 강제한다. 이메일 제한이 없는 초대는 Supabase auth.identities에 존재하는
-- Apple/Google/Kakao 계정으로 claim할 수 있으며 보호자 최종 승인 전에는
-- 공간 멤버십이나 account capability를 부여하지 않는다.
-- ============================================================

BEGIN;

ALTER TABLE public.family_dependents
  DROP CONSTRAINT IF EXISTS family_dependents_provider_check;

ALTER TABLE public.family_dependents
  ADD CONSTRAINT family_dependents_provider_check
    CHECK (
      expected_provider IS NULL
      OR expected_provider IN ('email', 'google', 'apple', 'kakao')
    );

COMMENT ON COLUMN public.family_dependents.candidate_email IS
  '연결 요청 계정의 확인된 이메일 스냅샷. 이메일을 제공하지 않는 소셜 계정은 NULL일 수 있다.';
COMMENT ON COLUMN public.family_dependents.candidate_provider IS
  '연결 요청 시 auth.identities에서 검증한 인증 provider 스냅샷';

CREATE OR REPLACE FUNCTION public.claim_family_child_invitation(
  p_token text
)
RETURNS TABLE(dependent_id uuid, space_id uuid, account_mode text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_email_confirmed_at timestamptz;
  v_provider text;
  v_is_anonymous boolean;
  v_invitation public.space_invitations%ROWTYPE;
  v_dependent public.family_dependents%ROWTYPE;
  v_invitation_id uuid;
  v_existing_birth_date date;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'verified_login_required' USING ERRCODE = '42501';
  END IF;

  SELECT
    NULLIF(lower(btrim(COALESCE(au.email, ''))), ''),
    au.email_confirmed_at,
    lower(COALESCE(au.raw_app_meta_data->>'provider', 'email')),
    COALESCE(au.is_anonymous, false)
  INTO v_email, v_email_confirmed_at, v_provider, v_is_anonymous
  FROM auth.users au
  WHERE au.id = v_user_id;

  IF NOT FOUND
     OR v_is_anonymous
     OR v_provider NOT IN ('email', 'google', 'apple', 'kakao') THEN
    RAISE EXCEPTION 'verified_login_required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.identities ai
    WHERE ai.user_id = v_user_id
      AND lower(ai.provider) = v_provider
  ) THEN
    RAISE EXCEPTION 'verified_login_required' USING ERRCODE = '42501';
  END IF;

  IF v_provider = 'email'
     AND (v_email IS NULL OR v_email_confirmed_at IS NULL) THEN
    RAISE EXCEPTION 'verified_email_required' USING ERRCODE = '42501';
  END IF;

  SELECT i.id
  INTO v_invitation_id
  FROM public.space_invitations i
  WHERE i.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');

  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION 'invalid_or_used_invitation' USING ERRCODE = '22023';
  END IF;

  SELECT fd.*
  INTO v_dependent
  FROM public.family_dependents fd
  JOIN public.space_invitations i ON i.dependent_id = fd.id
  WHERE i.id = v_invitation_id
  FOR UPDATE OF fd;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_used_invitation' USING ERRCODE = '22023';
  END IF;

  SELECT i.*
  INTO v_invitation
  FROM public.space_invitations i
  WHERE i.id = v_invitation_id
  FOR UPDATE;

  IF v_invitation.status <> 'ready' THEN
    RAISE EXCEPTION 'invalid_or_used_invitation' USING ERRCODE = '22023';
  END IF;

  IF v_invitation.expires_at <= now() THEN
    UPDATE public.space_invitations
    SET status = 'expired'
    WHERE id = v_invitation.id;
    RAISE EXCEPTION 'expired_invitation' USING ERRCODE = '22023';
  END IF;

  IF v_invitation.expected_email IS NOT NULL
     AND (
       v_email IS NULL
       OR v_email_confirmed_at IS NULL
       OR v_invitation.expected_email <> v_email
     ) THEN
    RAISE EXCEPTION 'invited_email_mismatch' USING ERRCODE = '42501';
  END IF;

  IF v_dependent.linked_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'dependent_already_linked' USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.family_relationships fr
    WHERE fr.dependent_id = v_dependent.id
      AND fr.guardian_user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'guardian_account_cannot_claim_child_invitation' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.family_relationships fr
    WHERE fr.dependent_id = v_dependent.id
      AND fr.verification_status = 'verified'
      AND fr.verified_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'guardian_verification_required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.guardian_consents gc
    JOIN public.family_relationships fr
      ON fr.dependent_id = gc.dependent_id
     AND fr.guardian_user_id = gc.guardian_user_id
     AND fr.verification_status = 'verified'
    WHERE gc.dependent_id = v_dependent.id
      AND gc.consent_type IN (
        'service_registration',
        'personal_data_processing',
        'family_data_sharing'
      )
      AND gc.status = 'granted'
      AND gc.verified_at IS NOT NULL
    GROUP BY gc.dependent_id, gc.guardian_user_id
    HAVING count(DISTINCT gc.consent_type) = 3
  ) THEN
    RAISE EXCEPTION 'verified_guardian_consent_required' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.space_members sm
    WHERE sm.space_id = v_dependent.space_id
      AND sm.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'existing_space_member_requires_conversion' USING ERRCODE = '23505';
  END IF;

  SELECT aap.birth_date
  INTO v_existing_birth_date
  FROM public.account_age_profiles aap
  WHERE aap.user_id = v_user_id;

  IF FOUND AND v_existing_birth_date <> v_dependent.birth_date THEN
    RAISE EXCEPTION 'account_birth_date_conflict' USING ERRCODE = '23514';
  END IF;

  UPDATE public.family_dependents
  SET linked_user_id = v_user_id,
      linked_at = NULL,
      status = 'approval_pending',
      candidate_email = CASE
        WHEN v_email_confirmed_at IS NOT NULL THEN v_email
        ELSE NULL
      END,
      candidate_provider = v_provider,
      candidate_claimed_at = now()
  WHERE id = v_dependent.id;

  UPDATE public.family_relationships
  SET child_user_id = v_user_id
  WHERE dependent_id = v_dependent.id;

  UPDATE public.space_invitations
  SET status = 'consumed',
      consumed_by = v_user_id,
      consumed_at = now()
  WHERE id = v_invitation.id;

  RETURN QUERY
  SELECT v_dependent.id, v_dependent.space_id, 'pending_guardian_consent'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_family_child_link(
  p_dependent_id uuid
)
RETURNS TABLE(child_user_id uuid, space_id uuid, account_mode text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_dependent public.family_dependents%ROWTYPE;
  v_account_mode text;
  v_next_transition date;
  v_age integer;
  v_current_email text;
  v_email_confirmed_at timestamptz;
  v_is_anonymous boolean;
  v_existing_birth_date date;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT fd.*
  INTO v_dependent
  FROM public.family_dependents fd
  WHERE fd.id = p_dependent_id
  FOR UPDATE;

  IF NOT FOUND
     OR NOT public.is_space_admin(v_dependent.space_id)
     OR NOT EXISTS (
       SELECT 1
       FROM public.family_relationships fr
       WHERE fr.dependent_id = v_dependent.id
         AND fr.guardian_user_id = v_user_id
         AND fr.child_user_id = v_dependent.linked_user_id
         AND fr.verification_status = 'verified'
     ) THEN
    RAISE EXCEPTION 'dependent_not_found_or_forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_dependent.status <> 'approval_pending'
     OR v_dependent.linked_user_id IS NULL
     OR v_dependent.candidate_provider IS NULL THEN
    RAISE EXCEPTION 'child_link_not_pending' USING ERRCODE = '22023';
  END IF;

  SELECT
    NULLIF(lower(btrim(COALESCE(au.email, ''))), ''),
    au.email_confirmed_at,
    COALESCE(au.is_anonymous, false)
  INTO v_current_email, v_email_confirmed_at, v_is_anonymous
  FROM auth.users au
  WHERE au.id = v_dependent.linked_user_id;

  IF NOT FOUND
     OR v_is_anonymous
     OR NOT EXISTS (
       SELECT 1
       FROM auth.identities ai
       WHERE ai.user_id = v_dependent.linked_user_id
         AND lower(ai.provider) = v_dependent.candidate_provider
     )
     OR (
       v_dependent.candidate_email IS NOT NULL
       AND (
         v_current_email IS NULL
         OR v_email_confirmed_at IS NULL
         OR v_current_email <> v_dependent.candidate_email
       )
     ) THEN
    RAISE EXCEPTION 'child_candidate_account_changed' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.guardian_consents gc
    WHERE gc.dependent_id = v_dependent.id
      AND gc.guardian_user_id = v_user_id
      AND gc.consent_type IN (
        'service_registration',
        'personal_data_processing',
        'family_data_sharing'
      )
      AND gc.status = 'granted'
      AND gc.verified_at IS NOT NULL
    GROUP BY gc.dependent_id, gc.guardian_user_id
    HAVING count(DISTINCT gc.consent_type) = 3
  ) THEN
    RAISE EXCEPTION 'verified_guardian_consent_required' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.space_members sm
    WHERE sm.space_id = v_dependent.space_id
      AND sm.user_id = v_dependent.linked_user_id
  ) THEN
    RAISE EXCEPTION 'existing_space_member_requires_conversion' USING ERRCODE = '23505';
  END IF;

  SELECT aap.birth_date
  INTO v_existing_birth_date
  FROM public.account_age_profiles aap
  WHERE aap.user_id = v_dependent.linked_user_id;

  IF FOUND AND v_existing_birth_date <> v_dependent.birth_date THEN
    RAISE EXCEPTION 'account_birth_date_conflict' USING ERRCODE = '23514';
  END IF;

  v_age := date_part('year', age(current_date, v_dependent.birth_date));
  IF v_age < 14 THEN
    v_account_mode := 'child_managed';
    v_next_transition := v_dependent.birth_date + interval '14 years';
  ELSIF v_age < 19 THEN
    v_account_mode := 'teen';
    v_next_transition := v_dependent.birth_date + interval '19 years';
  ELSE
    v_account_mode := 'adult';
    v_next_transition := NULL;
  END IF;

  INSERT INTO public.account_age_profiles (
    user_id,
    birth_date,
    account_mode,
    next_transition_at,
    source_dependent_id
  ) VALUES (
    v_dependent.linked_user_id,
    v_dependent.birth_date,
    v_account_mode,
    v_next_transition,
    v_dependent.id
  )
  ON CONFLICT (user_id) DO UPDATE
  SET account_mode = EXCLUDED.account_mode,
      next_transition_at = EXCLUDED.next_transition_at,
      source_dependent_id = EXCLUDED.source_dependent_id,
      updated_at = now()
  WHERE account_age_profiles.birth_date = EXCLUDED.birth_date;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'account_birth_date_conflict' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.space_members (space_id, user_id, role)
  VALUES (v_dependent.space_id, v_dependent.linked_user_id, 'viewer');

  UPDATE public.profiles
  SET family_group_id = COALESCE(family_group_id, v_dependent.space_id)
  WHERE id = v_dependent.linked_user_id;

  UPDATE public.family_dependents
  SET status = 'linked',
      linked_at = now()
  WHERE id = v_dependent.id;

  RETURN QUERY
  SELECT v_dependent.linked_user_id, v_dependent.space_id, v_account_mode;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_family_child_invitation(text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.approve_family_child_link(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_family_child_invitation(text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_family_child_link(uuid)
  TO authenticated;

COMMIT;
