-- ============================================================
-- 022 — 비용 최적화형 보호자 이메일 확인·최종 승인 흐름
-- ============================================================
-- 임시 운영 모델:
--   보호자 이메일 확인 -> 항목별 동의 -> 자녀 직접 초대 공유
--   -> 자녀 가입/연결 요청 -> 보호자 최종 승인 -> 공간 접근 허용
--
-- 중요:
--   SMS/PASS 본인확인을 대체하는 영구 모델이 아니다. 이용자 규모,
--   민원·분쟁 위험 또는 위치 기능 도입 시 외부 본인확인으로 전환한다.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ── 1. 자녀 연결 승인 대기 상태 ───────────────────────────

ALTER TABLE public.family_dependents
  DROP CONSTRAINT IF EXISTS family_dependents_status_check;

ALTER TABLE public.family_dependents
  ADD CONSTRAINT family_dependents_status_check
  CHECK (status IN (
    'consent_pending',
    'ready',
    'invited',
    'approval_pending',
    'linked',
    'suspended',
    'unlinked'
  ));


-- ── 2. 보호자 이메일 소유 확인 증적 ───────────────────────

CREATE TABLE IF NOT EXISTS public.guardian_email_verifications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_id     uuid NOT NULL REFERENCES public.family_dependents(id) ON DELETE CASCADE,
  guardian_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash       text NOT NULL UNIQUE,
  email_hash       text NOT NULL,
  status           text NOT NULL DEFAULT 'pending',
  expires_at       timestamptz NOT NULL,
  verified_at      timestamptz,
  consumed_at      timestamptz,
  revoked_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guardian_email_verifications_status_check
    CHECK (status IN ('pending', 'verified', 'consumed', 'expired', 'revoked'))
);

CREATE INDEX IF NOT EXISTS guardian_email_verifications_dependent_idx
  ON public.guardian_email_verifications(dependent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS guardian_email_verifications_guardian_idx
  ON public.guardian_email_verifications(guardian_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS guardian_email_verifications_pending_idx
  ON public.guardian_email_verifications(guardian_user_id, dependent_id, expires_at DESC)
  WHERE status = 'pending';

ALTER TABLE public.guardian_email_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guardian_email_verifications: 본인 조회"
  ON public.guardian_email_verifications;
CREATE POLICY "guardian_email_verifications: 본인 조회"
  ON public.guardian_email_verifications
  FOR SELECT
  TO authenticated
  USING (guardian_user_id = (SELECT auth.uid()));

REVOKE ALL ON TABLE public.guardian_email_verifications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.guardian_email_verifications TO authenticated;

COMMENT ON TABLE public.guardian_email_verifications IS
  '보호자 계정 이메일 소유 확인용 일회성 증적. 원문 이메일과 토큰은 저장하지 않는다.';


-- ── 3. 보호자 이메일 확인 시작 ────────────────────────────

CREATE OR REPLACE FUNCTION public.create_guardian_email_verification(
  p_dependent_id uuid
)
RETURNS TABLE(token text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_email_confirmed_at timestamptz;
  v_dependent public.family_dependents%ROWTYPE;
  v_token text;
  v_expires_at timestamptz := now() + interval '30 minutes';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT lower(btrim(COALESCE(au.email, ''))), au.email_confirmed_at
  INTO v_email, v_email_confirmed_at
  FROM auth.users au
  WHERE au.id = v_user_id;

  IF v_email = '' OR v_email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'verified_guardian_email_required' USING ERRCODE = '42501';
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
         AND fr.verification_status IN ('pending', 'verified')
     ) THEN
    RAISE EXCEPTION 'dependent_not_found_or_forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_dependent.linked_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'dependent_already_linked' USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.guardian_email_verifications gev
    WHERE gev.guardian_user_id = v_user_id
      AND gev.dependent_id = v_dependent.id
      AND gev.created_at > now() - interval '60 seconds'
  ) THEN
    RAISE EXCEPTION 'verification_rate_limited' USING ERRCODE = '55000';
  END IF;

  UPDATE public.guardian_email_verifications
  SET status = 'revoked', revoked_at = now()
  WHERE guardian_user_id = v_user_id
    AND dependent_id = v_dependent.id
    AND status = 'pending';

  v_token := 'gev_' || encode(extensions.gen_random_bytes(32), 'hex');

  INSERT INTO public.guardian_email_verifications (
    dependent_id,
    guardian_user_id,
    token_hash,
    email_hash,
    expires_at
  ) VALUES (
    v_dependent.id,
    v_user_id,
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    encode(extensions.digest(v_email, 'sha256'), 'hex'),
    v_expires_at
  );

  RETURN QUERY SELECT v_token, v_expires_at;
END;
$$;


-- ── 4. 이메일 확인 후 필수 동의 기록 ──────────────────────

CREATE OR REPLACE FUNCTION public.complete_guardian_email_consent(
  p_token text,
  p_policy_version text,
  p_consent_types text[]
)
RETURNS TABLE(dependent_id uuid, space_id uuid, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_verification public.guardian_email_verifications%ROWTYPE;
  v_required_types constant text[] := ARRAY[
    'service_registration',
    'personal_data_processing',
    'family_data_sharing'
  ]::text[];
  v_consent_type text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF p_token !~ '^gev_[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'invalid_verification_token' USING ERRCODE = '22023';
  END IF;

  IF char_length(btrim(COALESCE(p_policy_version, ''))) < 3 THEN
    RAISE EXCEPTION 'policy_version_required' USING ERRCODE = '22023';
  END IF;

  IF NOT v_required_types <@ COALESCE(p_consent_types, ARRAY[]::text[]) THEN
    RAISE EXCEPTION 'required_consents_missing' USING ERRCODE = '22023';
  END IF;

  -- 필수 항목 외 동의를 같은 요청에서 묵시적으로 기록하지 않는다.
  IF EXISTS (
    SELECT 1
    FROM unnest(COALESCE(p_consent_types, ARRAY[]::text[])) AS requested(consent_type)
    WHERE requested.consent_type <> ALL(v_required_types)
  ) THEN
    RAISE EXCEPTION 'unsupported_consent_type' USING ERRCODE = '22023';
  END IF;

  SELECT gev.*
  INTO v_verification
  FROM public.guardian_email_verifications gev
  WHERE gev.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  FOR UPDATE;

  IF NOT FOUND OR v_verification.guardian_user_id <> v_user_id THEN
    RAISE EXCEPTION 'invalid_verification_token' USING ERRCODE = '42501';
  END IF;

  IF v_verification.status <> 'pending' THEN
    RAISE EXCEPTION 'verification_already_used' USING ERRCODE = '22023';
  END IF;

  IF v_verification.expires_at <= now() THEN
    UPDATE public.guardian_email_verifications
    SET status = 'expired'
    WHERE id = v_verification.id;
    RAISE EXCEPTION 'verification_expired' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.family_relationships fr
    WHERE fr.dependent_id = v_verification.dependent_id
      AND fr.guardian_user_id = v_user_id
      AND fr.verification_status IN ('pending', 'verified')
  ) THEN
    RAISE EXCEPTION 'guardian_relationship_not_found' USING ERRCODE = '42501';
  END IF;

  UPDATE public.guardian_email_verifications
  SET status = 'consumed',
      verified_at = now(),
      consumed_at = now()
  WHERE id = v_verification.id;

  UPDATE public.family_relationships
  SET verification_status = 'verified',
      verification_method = 'email_magic_link',
      verified_at = now(),
      revoked_at = NULL
  WHERE dependent_id = v_verification.dependent_id
    AND guardian_user_id = v_user_id;

  FOREACH v_consent_type IN ARRAY v_required_types LOOP
    INSERT INTO public.guardian_consents (
      dependent_id,
      guardian_user_id,
      consent_type,
      policy_version,
      status,
      verification_method,
      evidence_ref,
      consented_at,
      verified_at
    ) VALUES (
      v_verification.dependent_id,
      v_user_id,
      v_consent_type,
      btrim(p_policy_version),
      'granted',
      'email_magic_link',
      v_verification.id::text,
      now(),
      now()
    )
    ON CONFLICT (dependent_id, guardian_user_id, consent_type, policy_version)
    DO UPDATE SET
      status = 'granted',
      verification_method = EXCLUDED.verification_method,
      evidence_ref = EXCLUDED.evidence_ref,
      consented_at = EXCLUDED.consented_at,
      verified_at = EXCLUDED.verified_at,
      revoked_at = NULL;
  END LOOP;

  UPDATE public.family_dependents
  SET status = 'ready'
  WHERE id = v_verification.dependent_id
    AND linked_user_id IS NULL;

  RETURN QUERY
  SELECT fd.id, fd.space_id, 'ready'::text
  FROM public.family_dependents fd
  WHERE fd.id = v_verification.dependent_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.revoke_guardian_email_verification(
  p_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.guardian_email_verifications
  SET status = 'revoked', revoked_at = now()
  WHERE guardian_user_id = auth.uid()
    AND token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    AND status = 'pending';
END;
$$;


-- ── 5. 초대 발급 조건 강화 ────────────────────────────────

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
  SET status = 'revoked', revoked_at = now()
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
  SET status = 'invited'
  WHERE id = v_dependent.id;

  RETURN QUERY SELECT v_token, v_expires_at;
END;
$$;


-- ── 6. 자녀 가입: 연결 요청만 생성, 공간 접근은 보류 ──────

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
  v_invitation public.space_invitations%ROWTYPE;
  v_dependent public.family_dependents%ROWTYPE;
  v_existing_birth_date date;
  v_next_transition date;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'verified_login_required' USING ERRCODE = '42501';
  END IF;

  SELECT lower(btrim(COALESCE(au.email, ''))), au.email_confirmed_at
  INTO v_email, v_email_confirmed_at
  FROM auth.users au
  WHERE au.id = v_user_id;

  IF v_email = '' OR v_email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'verified_email_required' USING ERRCODE = '42501';
  END IF;

  SELECT i.*
  INTO v_invitation
  FROM public.space_invitations i
  WHERE i.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  FOR UPDATE;

  IF NOT FOUND OR v_invitation.status <> 'ready' THEN
    RAISE EXCEPTION 'invalid_or_used_invitation' USING ERRCODE = '22023';
  END IF;

  IF v_invitation.expires_at <= now() THEN
    UPDATE public.space_invitations SET status = 'expired' WHERE id = v_invitation.id;
    RAISE EXCEPTION 'expired_invitation' USING ERRCODE = '22023';
  END IF;

  IF v_invitation.expected_email <> v_email THEN
    RAISE EXCEPTION 'invited_email_mismatch' USING ERRCODE = '42501';
  END IF;

  SELECT fd.*
  INTO v_dependent
  FROM public.family_dependents fd
  WHERE fd.id = v_invitation.dependent_id
  FOR UPDATE;

  IF NOT FOUND OR v_dependent.linked_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'dependent_already_linked' USING ERRCODE = '23505';
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
    SELECT 1 FROM public.space_members sm
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

  IF date_part('year', age(current_date, v_dependent.birth_date)) < 14 THEN
    v_next_transition := v_dependent.birth_date + interval '14 years';
  ELSIF date_part('year', age(current_date, v_dependent.birth_date)) < 19 THEN
    v_next_transition := v_dependent.birth_date + interval '19 years';
  ELSE
    v_next_transition := NULL;
  END IF;

  INSERT INTO public.account_age_profiles (
    user_id,
    birth_date,
    account_mode,
    next_transition_at,
    source_dependent_id
  ) VALUES (
    v_user_id,
    v_dependent.birth_date,
    'pending_guardian_consent',
    v_next_transition,
    v_dependent.id
  )
  ON CONFLICT (user_id) DO UPDATE
  SET account_mode = 'pending_guardian_consent',
      next_transition_at = EXCLUDED.next_transition_at,
      source_dependent_id = COALESCE(account_age_profiles.source_dependent_id, EXCLUDED.source_dependent_id);

  UPDATE public.family_dependents
  SET linked_user_id = v_user_id,
      linked_at = NULL,
      status = 'approval_pending'
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


-- ── 7. 보호자 최종 승인 후 공간 접근 허용 ────────────────

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

  IF v_dependent.status <> 'approval_pending' OR v_dependent.linked_user_id IS NULL THEN
    RAISE EXCEPTION 'child_link_not_pending' USING ERRCODE = '22023';
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

  UPDATE public.account_age_profiles
  SET account_mode = v_account_mode,
      next_transition_at = v_next_transition,
      source_dependent_id = v_dependent.id
  WHERE user_id = v_dependent.linked_user_id
    AND birth_date = v_dependent.birth_date;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'child_age_profile_missing' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.space_members (space_id, user_id, role)
  VALUES (v_dependent.space_id, v_dependent.linked_user_id, 'viewer')
  ON CONFLICT (space_id, user_id) DO NOTHING;

  UPDATE public.profiles
  SET family_group_id = COALESCE(family_group_id, v_dependent.space_id)
  WHERE id = v_dependent.linked_user_id;

  UPDATE public.family_dependents
  SET status = 'linked', linked_at = now()
  WHERE id = v_dependent.id;

  RETURN QUERY
  SELECT v_dependent.linked_user_id, v_dependent.space_id, v_account_mode;
END;
$$;


-- ── 8. 함수 권한 ───────────────────────────────────────────

REVOKE ALL ON FUNCTION public.create_guardian_email_verification(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_guardian_email_consent(text, text, text[])
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revoke_guardian_email_verification(text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_family_child_invitation(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_family_child_invitation(text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.approve_family_child_link(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_guardian_email_verification(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_guardian_email_consent(text, text, text[])
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_guardian_email_verification(text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_family_child_invitation(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_family_child_invitation(text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_family_child_link(uuid)
  TO authenticated;

COMMIT;

SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'guardian_email_verifications';
