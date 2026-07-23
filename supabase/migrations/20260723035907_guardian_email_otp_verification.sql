BEGIN;

-- Supabase Auth OTP 검증이 성공한 뒤에만 보호자 확인 도전을 승인한다.
-- 원문 OTP는 Supabase Auth가 검증하며 애플리케이션 DB에는 저장하지 않는다.
CREATE OR REPLACE FUNCTION public.confirm_guardian_email_verification(
  p_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_verification public.guardian_email_verifications%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF p_token !~ '^gev_[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'invalid_verification_token' USING ERRCODE = '22023';
  END IF;

  SELECT lower(btrim(COALESCE(au.email, '')))
  INTO v_email
  FROM auth.users au
  WHERE au.id = v_user_id;

  SELECT gev.*
  INTO v_verification
  FROM public.guardian_email_verifications gev
  WHERE gev.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  FOR UPDATE;

  IF NOT FOUND
     OR v_verification.guardian_user_id <> v_user_id
     OR v_verification.email_hash <> encode(extensions.digest(v_email, 'sha256'), 'hex') THEN
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

  UPDATE public.guardian_email_verifications
  SET verified_at = COALESCE(verified_at, now())
  WHERE id = v_verification.id;
END;
$$;


-- 필수 동의는 위 OTP 확인 증적이 있는 도전에 대해서만 기록한다.
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

  IF v_verification.verified_at IS NULL THEN
    RAISE EXCEPTION 'email_otp_verification_required' USING ERRCODE = '42501';
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
      consumed_at = now()
  WHERE id = v_verification.id;

  UPDATE public.family_relationships
  SET verification_status = 'verified',
      verification_method = 'email_otp',
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
      'email_otp',
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

REVOKE ALL ON FUNCTION public.confirm_guardian_email_verification(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_guardian_email_verification(text)
  TO authenticated;

COMMIT;

SELECT
  p.proname,
  p.prosecdef AS security_definer,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'confirm_guardian_email_verification',
    'complete_guardian_email_consent'
  )
ORDER BY p.proname;
