-- ============================================================
-- 자녀 초대: 이메일 필수 제거 + 1회성 토큰 계정 연결
-- ============================================================
-- 보호자는 자녀 이름/생년월일만으로 등록할 수 있다.
-- 선택 이메일을 입력한 기존 흐름은 해당 이메일로 연결 계정을 제한한다.
-- 이메일이 없으면 72시간 1회성 초대 토큰을 보유한, 이메일 확인이 끝난
-- 로그인 계정이 연결을 요청하고 보호자가 최종 승인해야 공간 권한이 생긴다.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ── 1. 선택 계정 힌트와 연결 후보 스냅샷 ──────────────────

ALTER TABLE public.family_dependents
  ALTER COLUMN expected_email DROP NOT NULL,
  ALTER COLUMN expected_provider DROP NOT NULL,
  ALTER COLUMN expected_provider DROP DEFAULT;

ALTER TABLE public.space_invitations
  ALTER COLUMN expected_email DROP NOT NULL;

ALTER TABLE public.family_dependents
  ADD COLUMN IF NOT EXISTS candidate_email text,
  ADD COLUMN IF NOT EXISTS candidate_provider text,
  ADD COLUMN IF NOT EXISTS candidate_claimed_at timestamptz;

ALTER TABLE public.family_dependents
  DROP CONSTRAINT IF EXISTS family_dependents_space_id_expected_email_key,
  DROP CONSTRAINT IF EXISTS family_dependents_email_normalized_check,
  DROP CONSTRAINT IF EXISTS family_dependents_provider_check;

ALTER TABLE public.family_dependents
  ADD CONSTRAINT family_dependents_email_normalized_check
    CHECK (
      expected_email IS NULL
      OR expected_email = lower(btrim(expected_email))
    ),
  ADD CONSTRAINT family_dependents_provider_check
    CHECK (
      expected_provider IS NULL
      OR expected_provider IN ('email', 'google')
    ),
  ADD CONSTRAINT family_dependents_candidate_email_normalized_check
    CHECK (
      candidate_email IS NULL
      OR candidate_email = lower(btrim(candidate_email))
    );

ALTER TABLE public.space_invitations
  DROP CONSTRAINT IF EXISTS space_invitations_email_normalized_check;

ALTER TABLE public.space_invitations
  ADD CONSTRAINT space_invitations_email_normalized_check
    CHECK (
      expected_email IS NULL
      OR expected_email = lower(btrim(expected_email))
    );

CREATE UNIQUE INDEX IF NOT EXISTS family_dependents_space_expected_email_uq
  ON public.family_dependents(space_id, expected_email)
  WHERE expected_email IS NOT NULL;

COMMENT ON COLUMN public.family_dependents.expected_email IS
  '선택 입력. 값이 있으면 초대 토큰을 이 이메일 계정으로만 제한한다.';
COMMENT ON COLUMN public.family_dependents.candidate_email IS
  '초대 토큰을 사용해 연결을 요청한 이메일 확인 완료 계정의 보호자 확인용 스냅샷';
COMMENT ON COLUMN public.family_dependents.candidate_provider IS
  '연결 요청 계정의 Supabase 인증 provider 스냅샷';
COMMENT ON COLUMN public.family_dependents.candidate_claimed_at IS
  '연결 후보 계정이 일회성 초대를 사용한 시각';


-- ── 2. 자녀 프로필 초안: 이메일은 선택 ────────────────────

CREATE OR REPLACE FUNCTION public.create_family_dependent_draft(
  p_space_id uuid,
  p_display_name text,
  p_birth_date date,
  p_expected_email text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_relationship_type text DEFAULT 'guardian'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_dependent_id uuid;
  v_email text := NULLIF(lower(btrim(COALESCE(p_expected_email, ''))), '');
  v_actor_email text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_space_admin(p_space_id) THEN
    RAISE EXCEPTION 'family_space_admin_required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.family_groups fg
    WHERE fg.id = p_space_id
      AND fg.space_type = 'family'
  ) THEN
    RAISE EXCEPTION 'family_space_required' USING ERRCODE = '22023';
  END IF;

  IF p_birth_date IS NULL OR p_birth_date > current_date THEN
    RAISE EXCEPTION 'invalid_birth_date' USING ERRCODE = '22023';
  END IF;

  IF char_length(btrim(COALESCE(p_display_name, ''))) NOT BETWEEN 1 AND 40 THEN
    RAISE EXCEPTION 'invalid_dependent_name' USING ERRCODE = '22023';
  END IF;

  IF p_gender IS NOT NULL
     AND p_gender NOT IN ('male', 'female', 'other', 'undisclosed') THEN
    RAISE EXCEPTION 'invalid_dependent_gender' USING ERRCODE = '22023';
  END IF;

  IF p_relationship_type NOT IN ('parent', 'guardian') THEN
    RAISE EXCEPTION 'invalid_guardian_relationship' USING ERRCODE = '22023';
  END IF;

  IF v_email IS NOT NULL
     AND v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'invalid_expected_email' USING ERRCODE = '22023';
  END IF;

  IF v_email IS NOT NULL THEN
    SELECT lower(COALESCE(au.email, ''))
    INTO v_actor_email
    FROM auth.users au
    WHERE au.id = v_user_id;

    IF v_actor_email = v_email THEN
      RAISE EXCEPTION 'guardian_email_cannot_be_child_email' USING ERRCODE = '22023';
    END IF;
  END IF;

  INSERT INTO public.family_dependents (
    space_id,
    display_name,
    birth_date,
    gender,
    expected_email,
    expected_provider,
    created_by
  ) VALUES (
    p_space_id,
    btrim(p_display_name),
    p_birth_date,
    p_gender,
    v_email,
    CASE WHEN v_email IS NULL THEN NULL ELSE 'email' END,
    v_user_id
  )
  RETURNING id INTO v_dependent_id;

  INSERT INTO public.family_relationships (
    space_id,
    guardian_user_id,
    dependent_id,
    relationship_type
  ) VALUES (
    p_space_id,
    v_user_id,
    v_dependent_id,
    p_relationship_type
  );

  RETURN v_dependent_id;
END;
$$;


-- ── 3. 보호자 확인 완료 후 72시간 1회성 초대 발급 ────────

CREATE OR REPLACE FUNCTION public.create_family_child_invitation(
  p_dependent_id uuid
)
RETURNS TABLE(token text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_dependent public.family_dependents%ROWTYPE;
  v_token text;
  v_expires_at timestamptz := now() + interval '72 hours';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT fd.*
  INTO v_dependent
  FROM public.family_dependents fd
  WHERE fd.id = p_dependent_id
  FOR UPDATE;

  IF NOT FOUND OR NOT public.is_space_admin(v_dependent.space_id) THEN
    RAISE EXCEPTION 'dependent_not_found_or_forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_dependent.linked_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'dependent_already_linked' USING ERRCODE = '23505';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.family_relationships fr
    WHERE fr.dependent_id = v_dependent.id
      AND fr.guardian_user_id = v_user_id
      AND fr.verification_status = 'verified'
      AND fr.verified_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'guardian_verification_required' USING ERRCODE = '42501';
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

  UPDATE public.space_invitations
  SET status = 'revoked',
      revoked_at = now()
  WHERE dependent_id = v_dependent.id
    AND status = 'ready';

  v_token := 'gfc_' || encode(extensions.gen_random_bytes(24), 'hex');

  INSERT INTO public.space_invitations (
    space_id,
    dependent_id,
    expected_email,
    token_hash,
    token_hint,
    invited_by,
    expires_at
  ) VALUES (
    v_dependent.space_id,
    v_dependent.id,
    v_dependent.expected_email,
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    right(v_token, 6),
    v_user_id,
    v_expires_at
  );

  UPDATE public.family_dependents
  SET status = 'invited',
      candidate_email = NULL,
      candidate_provider = NULL,
      candidate_claimed_at = NULL
  WHERE id = v_dependent.id;

  RETURN QUERY SELECT v_token, v_expires_at;
END;
$$;


-- ── 4. 초대 토큰으로 계정 연결 요청 ───────────────────────

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
  v_invitation public.space_invitations%ROWTYPE;
  v_dependent public.family_dependents%ROWTYPE;
  v_invitation_id uuid;
  v_existing_birth_date date;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'verified_login_required' USING ERRCODE = '42501';
  END IF;

  SELECT
    lower(btrim(COALESCE(au.email, ''))),
    au.email_confirmed_at,
    lower(COALESCE(au.raw_app_meta_data->>'provider', 'email'))
  INTO v_email, v_email_confirmed_at, v_provider
  FROM auth.users au
  WHERE au.id = v_user_id;

  IF v_email = '' OR v_email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'verified_email_required' USING ERRCODE = '42501';
  END IF;

  SELECT i.id
  INTO v_invitation_id
  FROM public.space_invitations i
  WHERE i.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');

  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION 'invalid_or_used_invitation' USING ERRCODE = '22023';
  END IF;

  -- 초대 발급 함수와 동일하게 dependent -> invitation 순서로 잠근다.
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
     AND v_invitation.expected_email <> v_email THEN
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
      candidate_email = v_email,
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


-- ── 5. 보호자 최종 승인 후 계정 모드와 공간 권한 부여 ─────

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
     OR v_dependent.candidate_email IS NULL THEN
    RAISE EXCEPTION 'child_link_not_pending' USING ERRCODE = '22023';
  END IF;

  SELECT lower(btrim(COALESCE(au.email, ''))), au.email_confirmed_at
  INTO v_current_email, v_email_confirmed_at
  FROM auth.users au
  WHERE au.id = v_dependent.linked_user_id;

  IF v_current_email = ''
     OR v_email_confirmed_at IS NULL
     OR v_current_email <> v_dependent.candidate_email THEN
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


-- ── 6. 잘못 연결된 후보 거절 ──────────────────────────────

CREATE OR REPLACE FUNCTION public.reject_family_child_link(
  p_dependent_id uuid
)
RETURNS TABLE(dependent_id uuid, space_id uuid, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_dependent public.family_dependents%ROWTYPE;
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
         AND fr.verification_status = 'verified'
     ) THEN
    RAISE EXCEPTION 'dependent_not_found_or_forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_dependent.status <> 'approval_pending'
     OR v_dependent.linked_user_id IS NULL THEN
    RAISE EXCEPTION 'child_link_not_pending' USING ERRCODE = '22023';
  END IF;

  -- 이전 버전에서 승인 전에 만든 제한 프로필이 남아 있다면 함께 제거한다.
  DELETE FROM public.account_age_profiles
  WHERE user_id = v_dependent.linked_user_id
    AND source_dependent_id = v_dependent.id
    AND account_mode = 'pending_guardian_consent';

  UPDATE public.family_relationships
  SET child_user_id = NULL
  WHERE dependent_id = v_dependent.id
    AND child_user_id = v_dependent.linked_user_id;

  UPDATE public.family_dependents
  SET linked_user_id = NULL,
      linked_at = NULL,
      status = 'ready',
      candidate_email = NULL,
      candidate_provider = NULL,
      candidate_claimed_at = NULL
  WHERE id = v_dependent.id;

  RETURN QUERY
  SELECT v_dependent.id, v_dependent.space_id, 'ready'::text;
END;
$$;


-- ── 7. 함수 권한 ───────────────────────────────────────────

REVOKE ALL ON FUNCTION public.create_family_dependent_draft(
  uuid, text, date, text, text, text
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_family_child_invitation(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_family_child_invitation(text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.approve_family_child_link(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_family_child_link(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_family_dependent_draft(
  uuid, text, date, text, text, text
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_family_child_invitation(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_family_child_invitation(text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_family_child_link(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_family_child_link(uuid)
  TO authenticated;

COMMIT;
