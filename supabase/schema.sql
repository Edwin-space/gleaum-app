-- ============================================================
-- 글리움 (Gleaum) — Supabase Database Schema (전체 재생성용)
--
-- 순서대로 실행 가능한 전체 스키마
-- Supabase > SQL Editor 에 붙여넣고 실행하세요
--
-- 마지막 업데이트: Migration 001 (space_members 적용)
-- ============================================================


-- ── 1. family_groups (= 공간/Space) ──────────────────────
--    내부 테이블명은 family_groups 유지 (FK 호환)
--    코드/UI 에서는 "공간(Space)" 으로 표시
CREATE TABLE IF NOT EXISTS family_groups (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  invite_code text        UNIQUE,
  created_by  uuid        REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE family_groups IS '공간(Space) — 공유 일정·가계부 단위. 내부명 family_groups 유지';


-- ── 2. profiles (auth.users 확장) ────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                      uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                    text,
  display_name            text,
  real_name               text,
  name_display_mode       text        CHECK (name_display_mode IN ('nickname','real_name')) DEFAULT 'nickname',
  email                   text,
  avatar                  text        DEFAULT '👤',
  -- role: 레거시 컬럼. 신규 권한 관리는 space_members.role 사용
  role                    text        CHECK (role IN ('parent','child','guest','admin','editor','viewer')) DEFAULT 'editor',
  family_group_id         uuid        REFERENCES family_groups(id),   -- 주 소속 공간 (레거시, backward-compat)
  google_id               text,
  fcm_token               text,
  onboarding_completed_at timestamptz,
  timezone                text        DEFAULT 'Asia/Seoul',
  locale                  text        DEFAULT 'ko-KR',
  preferences             jsonb       DEFAULT '{}'::jsonb,
  notification_settings   jsonb       DEFAULT '{}'::jsonb,
  updated_at              timestamptz DEFAULT now()
);

COMMENT ON COLUMN profiles.family_group_id IS '레거시: 주 소속 공간 ID. 멤버십 권한은 space_members 참조';
COMMENT ON COLUMN profiles.role            IS '레거시: 전역 역할. 공간별 역할은 space_members.role 참조';


-- ── 3. space_members (공간 멤버십 + 역할) ─────────────────
--    공간별 역할의 단일 소스 오브 트루스 (Migration 001 신설)
CREATE TABLE IF NOT EXISTS space_members (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id  uuid        NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id   uuid        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  role      text        NOT NULL DEFAULT 'editor'
                        CHECK (role IN ('admin', 'editor', 'viewer')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (space_id, user_id)
);

COMMENT ON TABLE  space_members         IS '공간 멤버십 및 역할 (admin/editor/viewer)';
COMMENT ON COLUMN space_members.role    IS 'admin=공간 지기, editor=공간 운영자, viewer=공간 멤버';


-- ── 4. schedules ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedules (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text        NOT NULL,
  type             text        NOT NULL CHECK (type IN ('shared','personal','child','expense')),
  start_time       timestamptz NOT NULL,
  end_time         timestamptz,
  all_day          boolean     DEFAULT false,
  status           text        CHECK (status IN ('pending','in_progress','completed','missed')) DEFAULT 'pending',
  location_address text,
  location_lat     float,
  location_lng     float,
  reference_url    text,
  reminder         int         DEFAULT 0,
  repeat           text        CHECK (repeat IN ('none','daily','weekly','monthly','yearly')) DEFAULT 'none',
  repeat_end_date  timestamptz,
  memo             text,
  family_group_id  uuid        NOT NULL REFERENCES family_groups(id),
  created_by       uuid        NOT NULL REFERENCES auth.users(id),
  -- 정기지출 전용 컬럼 (Phase 2: 가계부 분리 예정)
  amount           int,
  expense_category text        CHECK (expense_category IN ('education','housing','utility','insurance','subscription','other')),
  payment_method   text        CHECK (payment_method IN ('auto','card','cash','other')),
  source_space_expense_id uuid REFERENCES schedules(id) ON DELETE SET NULL,
  source_space_id uuid REFERENCES family_groups(id) ON DELETE SET NULL,
  expense_reflection_type text CHECK (expense_reflection_type IN ('actual_paid','final_share','manual')),
  expense_reflected_at timestamptz,
  google_event_id  text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);


-- ── 5. schedule_participants ──────────────────────────────
CREATE TABLE IF NOT EXISTS schedule_participants (
  schedule_id uuid REFERENCES schedules(id)  ON DELETE CASCADE,
  user_id     uuid REFERENCES profiles(id)   ON DELETE CASCADE,
  PRIMARY KEY (schedule_id, user_id)
);


-- ── 6. notifications ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  schedule_id uuid        REFERENCES schedules(id) ON DELETE SET NULL,
  title       text        NOT NULL,
  body        text        NOT NULL,
  type        text        CHECK (type IN ('reminder','re_notify','completion','invite','system')) DEFAULT 'reminder',
  read        boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now()
);


-- ── 7. Triggers: updated_at 자동 갱신 ─────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS schedules_updated_at ON schedules;
CREATE TRIGGER schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── 8. Trigger: 신규 회원 프로필 자동 생성 ───────────────
--    role 은 space_members 가 관리하므로 프로필 생성 시 설정 안 함
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (
    id, name, display_name, email, avatar,
    timezone, locale, preferences, notification_settings
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), '사용자'),
    new.email,
    '👤',
    'Asia/Seoul',
    'ko-KR',
    '{}'::jsonb,
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ── 9. Helper Functions ────────────────────────────────────

-- 현재 사용자의 주 소속 공간 ID (레거시 호환용)
CREATE OR REPLACE FUNCTION my_family_group_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT family_group_id FROM profiles WHERE id = auth.uid()
$$;

-- 현재 사용자가 속한 모든 공간 ID 목록
CREATE OR REPLACE FUNCTION my_space_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT space_id FROM space_members WHERE user_id = auth.uid()
$$;

-- 특정 공간에서 현재 사용자의 역할 (없으면 NULL)
CREATE OR REPLACE FUNCTION my_role_in_space(p_space_id uuid)
RETURNS text
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM space_members
  WHERE  user_id = auth.uid() AND space_id = p_space_id
$$;

-- 현재 사용자가 특정 공간의 admin 인지
CREATE OR REPLACE FUNCTION is_space_admin(p_space_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM space_members
    WHERE  user_id = auth.uid() AND space_id = p_space_id AND role = 'admin'
  )
$$;

-- 현재 사용자가 특정 공간에서 편집 가능한지 (admin 또는 editor)
CREATE OR REPLACE FUNCTION can_edit_in_space(p_space_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM space_members
    WHERE  user_id = auth.uid() AND space_id = p_space_id AND role IN ('admin','editor')
  )
$$;


-- ── 10. RLS 활성화 ────────────────────────────────────────
ALTER TABLE family_groups         ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;


-- ── 11. RLS Policies: family_groups ───────────────────────
DROP POLICY IF EXISTS "가족 그룹 조회"               ON family_groups;
DROP POLICY IF EXISTS "가족 그룹 생성"               ON family_groups;
DROP POLICY IF EXISTS "가족 그룹 수정"               ON family_groups;
DROP POLICY IF EXISTS "family_groups: 내가 속한 공간 조회" ON family_groups;

CREATE POLICY "family_groups: 내가 속한 공간 조회"
  ON family_groups FOR SELECT
  USING (
    id IN (SELECT my_space_ids())
    OR created_by = auth.uid()
  );

CREATE POLICY "family_groups: 공간 생성"
  ON family_groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "family_groups: 공간 수정 (admin 전용)"
  ON family_groups FOR UPDATE
  USING (is_space_admin(id));

CREATE POLICY "family_groups: 공간 삭제 (admin 전용)"
  ON family_groups FOR DELETE
  USING (is_space_admin(id));


-- ── 12. RLS Policies: space_members ───────────────────────
DROP POLICY IF EXISTS "space_members: 공간 멤버 목록 조회"             ON space_members;
DROP POLICY IF EXISTS "space_members: 멤버 추가 (admin 또는 본인 자가참여)" ON space_members;
DROP POLICY IF EXISTS "space_members: 역할 변경 (admin 전용)"           ON space_members;
DROP POLICY IF EXISTS "space_members: 멤버 제거 (admin 또는 본인 탈퇴)" ON space_members;

CREATE POLICY "space_members: 공간 멤버 목록 조회"
  ON space_members FOR SELECT
  USING (space_id IN (SELECT my_space_ids()));

CREATE POLICY "space_members: 멤버 추가 (admin 또는 본인 자가참여)"
  ON space_members FOR INSERT
  WITH CHECK (
    is_space_admin(space_id)
    OR user_id = auth.uid()
  );

CREATE POLICY "space_members: 역할 변경 (admin 전용)"
  ON space_members FOR UPDATE
  USING (is_space_admin(space_id));

CREATE POLICY "space_members: 멤버 제거 (admin 또는 본인 탈퇴)"
  ON space_members FOR DELETE
  USING (
    is_space_admin(space_id)
    OR user_id = auth.uid()
  );


-- ── 13. RLS Policies: profiles ────────────────────────────
DROP POLICY IF EXISTS "내 프로필 전체 접근"                 ON profiles;
DROP POLICY IF EXISTS "같은 가족 프로필 조회"               ON profiles;
DROP POLICY IF EXISTS "profiles: 같은 공간 멤버 프로필 조회" ON profiles;

CREATE POLICY "profiles: 내 프로필 전체 접근"
  ON profiles FOR ALL
  USING (id = auth.uid());

CREATE POLICY "profiles: 같은 공간 멤버 프로필 조회"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR id IN (
      SELECT sm.user_id FROM space_members sm
      WHERE  sm.space_id IN (SELECT my_space_ids())
    )
  );


-- ── 14. RLS Policies: schedules ───────────────────────────
DROP POLICY IF EXISTS "가족 일정 조회"                        ON schedules;
DROP POLICY IF EXISTS "가족 일정 생성"                        ON schedules;
DROP POLICY IF EXISTS "가족 일정 수정"                        ON schedules;
DROP POLICY IF EXISTS "가족 일정 삭제"                        ON schedules;
DROP POLICY IF EXISTS "schedules: 일정 생성 (editor 이상)"     ON schedules;
DROP POLICY IF EXISTS "schedules: 일정 수정 (editor 이상 또는 본인)" ON schedules;
DROP POLICY IF EXISTS "schedules: 일정 삭제 (본인 또는 admin)" ON schedules;

CREATE POLICY "schedules: 공간 일정 조회"
  ON schedules FOR SELECT
  USING (
    family_group_id IN (SELECT my_space_ids())
    AND (
      visibility IS NULL
      OR visibility <> 'private'
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "schedules: 일정 생성 (editor 이상)"
  ON schedules FOR INSERT
  WITH CHECK (
    family_group_id IN (SELECT my_space_ids())
    AND can_edit_in_space(family_group_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "schedules: 일정 수정 (editor 이상 또는 본인)"
  ON schedules FOR UPDATE
  USING (
    family_group_id IN (SELECT my_space_ids())
    AND (
      (visibility = 'private' AND created_by = auth.uid())
      OR (
        (visibility IS NULL OR visibility <> 'private')
        AND (
          created_by = auth.uid()
          OR can_edit_in_space(family_group_id)
        )
      )
    )
  );

CREATE POLICY "schedules: 일정 삭제 (본인 또는 admin)"
  ON schedules FOR DELETE
  USING (
    family_group_id IN (SELECT my_space_ids())
    AND (
      (visibility = 'private' AND created_by = auth.uid())
      OR (
        (visibility IS NULL OR visibility <> 'private')
        AND (
          created_by = auth.uid()
          OR is_space_admin(family_group_id)
        )
      )
    )
  );


-- ── 15. RLS Policies: schedule_participants ───────────────
DROP POLICY IF EXISTS "참여자 조회" ON schedule_participants;
DROP POLICY IF EXISTS "참여자 추가" ON schedule_participants;
DROP POLICY IF EXISTS "참여자 삭제" ON schedule_participants;

CREATE POLICY "schedule_participants: 참여자 조회"
  ON schedule_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE  s.id = schedule_id
        AND  s.family_group_id IN (SELECT my_space_ids())
        AND  (
          s.visibility IS NULL
          OR s.visibility <> 'private'
          OR s.created_by = auth.uid()
        )
    )
  );

CREATE POLICY "schedule_participants: 참여자 추가 (editor 이상)"
  ON schedule_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE  s.id = schedule_id
        AND  can_edit_in_space(s.family_group_id)
    )
  );

CREATE POLICY "schedule_participants: 참여자 삭제 (editor 이상)"
  ON schedule_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE  s.id = schedule_id
        AND  can_edit_in_space(s.family_group_id)
    )
  );


-- ── 16. RLS Policies: notifications ──────────────────────
DROP POLICY IF EXISTS "내 알림 조회" ON notifications;
DROP POLICY IF EXISTS "내 알림 수정" ON notifications;
DROP POLICY IF EXISTS "알림 생성"   ON notifications;

CREATE POLICY "notifications: 내 알림 조회"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications: 내 알림 수정"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "notifications: 알림 생성"
  ON notifications FOR INSERT
  WITH CHECK (true);


-- ── 완료 메시지 ───────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ 글리움 DB 스키마 (Migration 001 적용) 생성 완료!';
END $$;
