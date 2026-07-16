-- ============================================================
-- 020 — 가족 공간 자녀 계정 기반
-- ============================================================
-- 실행 위치:
--   Supabase Dashboard -> SQL Editor -> New query
--
-- 실행 방식:
--   이 파일 전체 내용을 복사해서 실행합니다.
--
-- 핵심 원칙:
--   1. 자녀는 space_members.role이 아니라 가족 관계다.
--   2. 가입 전 자녀 프로필은 접근 권한이 없는 pending 상태다.
--   3. 이메일만으로 연결하지 않고 일회성 초대 + 검증 이메일을 함께 확인한다.
--   4. 만 14세 미만은 검증된 보호자 관계와 필수 동의 없이는 초대할 수 없다.
--   5. 연령 상태는 생년월일과 서버 날짜로 계산한다.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ── 1. 공간 종류 정규화 ────────────────────────────────────

ALTER TABLE public.family_groups
  ADD COLUMN IF NOT EXISTS space_type text NOT NULL DEFAULT 'general';

ALTER TABLE public.family_groups
  DROP CONSTRAINT IF EXISTS family_groups_space_type_check;

ALTER TABLE public.family_groups
  ADD CONSTRAINT family_groups_space_type_check
  CHECK (space_type IN ('personal', 'general', 'family'));

-- 기존 settings.purpose가 family인 공유 공간을 가족 공간으로 분류한다.
UPDATE public.family_groups
SET space_type = 'family'
WHERE COALESCE(settings->>'purpose', '') = 'family'
  AND space_type <> 'personal';

-- preferences.personalSpaceId가 가리키는 공간은 목적보다 개인 공간 판정을 우선한다.
UPDATE public.family_groups fg
SET space_type = 'personal'
WHERE EXISTS (
  SELECT 1
  FROM public.profiles p
  WHERE p.preferences->>'personalSpaceId' = fg.id::text
);

COMMENT ON COLUMN public.family_groups.space_type IS
  'personal=개인 공간, general=일반 공유 공간, family=가족 관계 기능 활성 공간';


-- ── 2. 가입 전 자녀 프로필 ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.family_dependents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id          uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  display_name      text NOT NULL,
  birth_date        date NOT NULL,
  gender            text,
  expected_email    text NOT NULL,
  expected_provider text NOT NULL DEFAULT 'google',
  linked_user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status            text NOT NULL DEFAULT 'consent_pending',
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  linked_at         timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_dependents_display_name_check
    CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 40),
  CONSTRAINT family_dependents_birth_date_check
    CHECK (birth_date >= DATE '1900-01-01'),
  CONSTRAINT family_dependents_gender_check
    CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'undisclosed')),
  CONSTRAINT family_dependents_provider_check
    CHECK (expected_provider IN ('google')),
  CONSTRAINT family_dependents_status_check
    CHECK (status IN ('consent_pending', 'ready', 'invited', 'linked', 'suspended', 'unlinked')),
  CONSTRAINT family_dependents_email_normalized_check
    CHECK (expected_email = lower(btrim(expected_email))),
  UNIQUE (space_id, expected_email)
);

CREATE UNIQUE INDEX IF NOT EXISTS family_dependents_space_linked_user_uq
  ON public.family_dependents(space_id, linked_user_id)
  WHERE linked_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS family_dependents_linked_user_idx
  ON public.family_dependents(linked_user_id)
  WHERE linked_user_id IS NOT NULL;

COMMENT ON TABLE public.family_dependents IS
  '가족 공간에 보호자가 미리 등록하는 자녀 프로필. linked 이전에는 공간 접근 권한이 없다.';


-- ── 3. 보호자-자녀 관계 ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.family_relationships (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id            uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  guardian_user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dependent_id        uuid NOT NULL REFERENCES public.family_dependents(id) ON DELETE CASCADE,
  child_user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  relationship_type   text NOT NULL DEFAULT 'guardian',
  verification_status text NOT NULL DEFAULT 'pending',
  verification_method text,
  verified_at         timestamptz,
  revoked_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_relationships_type_check
    CHECK (relationship_type IN ('parent', 'guardian')),
  CONSTRAINT family_relationships_verification_check
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'revoked')),
  UNIQUE (guardian_user_id, dependent_id)
);

CREATE INDEX IF NOT EXISTS family_relationships_child_user_idx
  ON public.family_relationships(child_user_id)
  WHERE child_user_id IS NOT NULL;

COMMENT ON TABLE public.family_relationships IS
  '공간 운영 권한과 분리된 보호자-자녀 관계 및 보호자 검증 상태';


-- ── 4. 법정대리인 동의 증적 ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.guardian_consents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_id        uuid NOT NULL REFERENCES public.family_dependents(id) ON DELETE CASCADE,
  guardian_user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type        text NOT NULL,
  policy_version      text NOT NULL,
  status              text NOT NULL DEFAULT 'pending',
  verification_method text,
  evidence_ref        text,
  consented_at        timestamptz,
  verified_at         timestamptz,
  revoked_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guardian_consents_type_check
    CHECK (consent_type IN (
      'service_registration',
      'personal_data_processing',
      'family_data_sharing',
      'location_collection',
      'location_sharing',
      'push_notifications',
      'marketing'
    )),
  CONSTRAINT guardian_consents_status_check
    CHECK (status IN ('pending', 'granted', 'revoked', 'expired')),
  UNIQUE (dependent_id, guardian_user_id, consent_type, policy_version)
);

COMMENT ON TABLE public.guardian_consents IS
  '만 14세 미만 자녀의 항목별 법정대리인 동의와 검증 증적. 마케팅은 필수 동의가 아니다.';


-- ── 5. 일회성 자녀 초대 ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.space_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id        uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  dependent_id    uuid NOT NULL REFERENCES public.family_dependents(id) ON DELETE CASCADE,
  invitation_type text NOT NULL DEFAULT 'child',
  expected_email  text NOT NULL,
  token_hash      text NOT NULL UNIQUE,
  token_hint      text NOT NULL,
  invited_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'ready',
  expires_at      timestamptz NOT NULL,
  consumed_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  consumed_at     timestamptz,
  revoked_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT space_invitations_type_check
    CHECK (invitation_type IN ('child')),
  CONSTRAINT space_invitations_status_check
    CHECK (status IN ('ready', 'consumed', 'revoked', 'expired')),
  CONSTRAINT space_invitations_email_normalized_check
    CHECK (expected_email = lower(btrim(expected_email)))
);

CREATE INDEX IF NOT EXISTS space_invitations_dependent_status_idx
  ON public.space_invitations(dependent_id, status, expires_at DESC);

COMMENT ON TABLE public.space_invitations IS
  '공용 공간 초대 코드와 분리된 자녀 계정 연결용 일회성 초대';


-- ── 6. 계정 연령 상태 ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.account_age_profiles (
  user_id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_date         date NOT NULL,
  account_mode       text NOT NULL,
  next_transition_at date,
  source_dependent_id uuid REFERENCES public.family_dependents(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT account_age_profiles_mode_check
    CHECK (account_mode IN (
      'pending_guardian_consent',
      'child_managed',
      'teen_consent_pending',
      'teen',
      'adult'
    )),
  CONSTRAINT account_age_profiles_birth_date_check
    CHECK (birth_date >= DATE '1900-01-01')
);

COMMENT ON TABLE public.account_age_profiles IS
  '서버 기준 연령 전환 상태. 현재 나이 숫자는 저장하지 않고 birth_date로 계산한다.';


-- ── 7. updated_at ───────────────────────────────────────────

DROP TRIGGER IF EXISTS family_dependents_updated_at ON public.family_dependents;
CREATE TRIGGER family_dependents_updated_at
  BEFORE UPDATE ON public.family_dependents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS account_age_profiles_updated_at ON public.account_age_profiles;
CREATE TRIGGER account_age_profiles_updated_at
  BEFORE UPDATE ON public.account_age_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ── 8. RLS ──────────────────────────────────────────────────

ALTER TABLE public.family_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_age_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "family_dependents: 관계자 조회" ON public.family_dependents;
CREATE POLICY "family_dependents: 관계자 조회"
  ON public.family_dependents
  FOR SELECT
  TO authenticated
  USING (
    linked_user_id = auth.uid()
    OR public.is_space_admin(space_id)
    OR EXISTS (
      SELECT 1
      FROM public.family_relationships fr
      WHERE fr.dependent_id = family_dependents.id
        AND fr.guardian_user_id = auth.uid()
        AND fr.verification_status IN ('pending', 'verified')
    )
  );

DROP POLICY IF EXISTS "family_relationships: 관계자 조회" ON public.family_relationships;
CREATE POLICY "family_relationships: 관계자 조회"
  ON public.family_relationships
  FOR SELECT
  TO authenticated
  USING (
    guardian_user_id = auth.uid()
    OR child_user_id = auth.uid()
    OR public.is_space_admin(space_id)
  );

DROP POLICY IF EXISTS "guardian_consents: 관계자 조회" ON public.guardian_consents;
CREATE POLICY "guardian_consents: 관계자 조회"
  ON public.guardian_consents
  FOR SELECT
  TO authenticated
  USING (
    guardian_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.family_dependents fd
      WHERE fd.id = guardian_consents.dependent_id
        AND fd.linked_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "space_invitations: 발급자 조회" ON public.space_invitations;
CREATE POLICY "space_invitations: 발급자 조회"
  ON public.space_invitations
  FOR SELECT
  TO authenticated
  USING (invited_by = auth.uid() AND public.is_space_admin(space_id));

DROP POLICY IF EXISTS "account_age_profiles: 본인 조회" ON public.account_age_profiles;
CREATE POLICY "account_age_profiles: 본인 조회"
  ON public.account_age_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 직접 쓰기 정책은 만들지 않는다. 아래 검증 함수 또는 service_role만 변경한다.


-- ── 9. 자녀 프로필 초안 생성 ───────────────────────────────

CREATE OR REPLACE FUNCTION public.create_family_dependent_draft(
  p_space_id uuid,
  p_display_name text,
  p_birth_date date,
  p_expected_email text,
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
  v_email text := lower(btrim(p_expected_email));
  v_actor_email text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_space_admin(p_space_id) THEN
    RAISE EXCEPTION 'family_space_admin_required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.family_groups fg
    WHERE fg.id = p_space_id AND fg.space_type = 'family'
  ) THEN
    RAISE EXCEPTION 'family_space_required' USING ERRCODE = '22023';
  END IF;

  IF p_birth_date IS NULL OR p_birth_date > current_date THEN
    RAISE EXCEPTION 'invalid_birth_date' USING ERRCODE = '22023';
  END IF;

  IF v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'invalid_expected_email' USING ERRCODE = '22023';
  END IF;

  SELECT lower(COALESCE(au.email, ''))
  INTO v_actor_email
  FROM auth.users au
  WHERE au.id = v_user_id;

  IF v_actor_email = v_email THEN
    RAISE EXCEPTION 'guardian_email_cannot_be_child_email' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.family_dependents (
    space_id,
    display_name,
    birth_date,
    gender,
    expected_email,
    created_by
  ) VALUES (
    p_space_id,
    btrim(p_display_name),
    p_birth_date,
    p_gender,
    v_email,
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


-- ── 10. 검증 완료 자녀의 일회성 초대 발급 ─────────────────

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
  v_age integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT *
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

  v_age := date_part('year', age(current_date, v_dependent.birth_date));

  IF v_age < 14 AND NOT EXISTS (
    SELECT 1
    FROM public.guardian_consents gc
    WHERE gc.dependent_id = v_dependent.id
      AND gc.guardian_user_id = v_user_id
      AND gc.consent_type IN ('service_registration', 'personal_data_processing')
      AND gc.status = 'granted'
      AND gc.verified_at IS NOT NULL
    GROUP BY gc.dependent_id, gc.guardian_user_id
    HAVING count(DISTINCT gc.consent_type) = 2
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


-- ── 11. Google 로그인 계정과 자녀 프로필 연결 ──────────────

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
  v_age integer;
  v_account_mode text;
  v_next_transition date;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'verified_login_required' USING ERRCODE = '42501';
  END IF;

  SELECT lower(COALESCE(au.email, '')), au.email_confirmed_at
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
    UPDATE public.space_invitations
    SET status = 'expired'
    WHERE id = v_invitation.id;
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

  v_age := date_part('year', age(current_date, v_dependent.birth_date));

  IF v_age < 14 AND NOT EXISTS (
    SELECT 1
    FROM public.guardian_consents gc
    JOIN public.family_relationships fr
      ON fr.dependent_id = gc.dependent_id
     AND fr.guardian_user_id = gc.guardian_user_id
     AND fr.verification_status = 'verified'
     AND fr.verified_at IS NOT NULL
    WHERE gc.dependent_id = v_dependent.id
      AND gc.consent_type IN ('service_registration', 'personal_data_processing')
      AND gc.status = 'granted'
      AND gc.verified_at IS NOT NULL
    GROUP BY gc.dependent_id, gc.guardian_user_id
    HAVING count(DISTINCT gc.consent_type) = 2
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
    v_user_id,
    v_dependent.birth_date,
    v_account_mode,
    v_next_transition,
    v_dependent.id
  )
  ON CONFLICT (user_id) DO UPDATE
  SET account_mode = EXCLUDED.account_mode,
      next_transition_at = EXCLUDED.next_transition_at,
      source_dependent_id = COALESCE(account_age_profiles.source_dependent_id, EXCLUDED.source_dependent_id);

  UPDATE public.family_dependents
  SET linked_user_id = v_user_id,
      linked_at = now(),
      status = 'linked'
  WHERE id = v_dependent.id;

  UPDATE public.family_relationships fr
  SET child_user_id = v_user_id
  WHERE fr.dependent_id = v_dependent.id;

  INSERT INTO public.space_members (space_id, user_id, role)
  VALUES (v_dependent.space_id, v_user_id, 'viewer')
  ON CONFLICT (space_id, user_id) DO NOTHING;

  -- 레거시 현재 공간 포인터는 비어 있을 때만 채운다.
  UPDATE public.profiles
  SET family_group_id = COALESCE(family_group_id, v_dependent.space_id)
  WHERE id = v_user_id;

  UPDATE public.space_invitations
  SET status = 'consumed',
      consumed_by = v_user_id,
      consumed_at = now()
  WHERE id = v_invitation.id;

  RETURN QUERY
  SELECT v_dependent.id, v_dependent.space_id, v_account_mode;
END;
$$;


-- ── 12. 로그인 시 연령 상태 갱신 ───────────────────────────

CREATE OR REPLACE FUNCTION public.refresh_my_account_age_state()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.account_age_profiles%ROWTYPE;
  v_age integer;
  v_mode text;
  v_next_transition date;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_profile
  FROM public.account_age_profiles aap
  WHERE aap.user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'unknown';
  END IF;

  v_age := date_part('year', age(current_date, v_profile.birth_date));

  IF v_age >= 19 THEN
    v_mode := 'adult';
    v_next_transition := NULL;
  ELSIF v_age >= 14 THEN
    IF v_profile.account_mode = 'child_managed' THEN
      v_mode := 'teen_consent_pending';
    ELSE
      v_mode := v_profile.account_mode;
    END IF;
    v_next_transition := v_profile.birth_date + interval '19 years';
  ELSE
    v_mode := v_profile.account_mode;
    v_next_transition := v_profile.birth_date + interval '14 years';
  END IF;

  UPDATE public.account_age_profiles
  SET account_mode = v_mode,
      next_transition_at = v_next_transition
  WHERE user_id = v_user_id;

  RETURN v_mode;
END;
$$;

REVOKE ALL ON FUNCTION public.create_family_dependent_draft(uuid, text, date, text, text, text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_family_child_invitation(uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_family_child_invitation(text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.refresh_my_account_age_state()
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_family_dependent_draft(uuid, text, date, text, text, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_family_child_invitation(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_family_child_invitation(text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_my_account_age_state()
  TO authenticated;

COMMIT;


-- ── 실행 후 확인용 ─────────────────────────────────────────

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'family_dependents',
    'family_relationships',
    'guardian_consents',
    'space_invitations',
    'account_age_profiles'
  )
ORDER BY table_name;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'family_groups'
  AND column_name = 'space_type';

SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'create_family_dependent_draft',
    'create_family_child_invitation',
    'claim_family_child_invitation',
    'refresh_my_account_age_state'
  )
ORDER BY proname;
