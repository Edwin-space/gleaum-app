-- ============================================================
-- Migration 001: space_members 테이블 신설 + 역할 기반 권한 강화
--
-- 목적:
--   - 기존 profiles.role (전역 역할) → 공간별 역할로 분리
--   - space_members 테이블이 공간 멤버십과 역할의 단일 소스 오브 트루스
--   - 역할: admin(관리자) | editor(편집자) | viewer(뷰어)
--
-- 역할 매핑 (기존 → 신규):
--   parent → admin
--   child  → editor
--   guest  → viewer
--
-- 실행 방법:
--   Supabase 대시보드 > SQL Editor > 이 파일 내용 붙여넣기 후 실행
-- ============================================================


-- ── 1. space_members 테이블 생성 ───────────────────────────
CREATE TABLE IF NOT EXISTS space_members (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id  uuid        NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id   uuid        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  role      text        NOT NULL DEFAULT 'editor'
                        CHECK (role IN ('admin', 'editor', 'viewer')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (space_id, user_id)
);

COMMENT ON TABLE  space_members            IS '공간(space) 멤버십 및 역할 관리';
COMMENT ON COLUMN space_members.role       IS 'admin=관리자, editor=편집자, viewer=조회자';
COMMENT ON COLUMN space_members.space_id   IS 'family_groups.id 참조 (내부 테이블명 유지)';


-- ── 2. 기존 profiles 데이터 → space_members 이전 ──────────
--    family_group_id 가 있는 사용자 전원 이전
INSERT INTO space_members (space_id, user_id, role)
SELECT
  p.family_group_id,
  p.id,
  CASE p.role
    WHEN 'parent' THEN 'admin'
    WHEN 'child'  THEN 'editor'
    WHEN 'guest'  THEN 'viewer'
    ELSE                'editor'
  END
FROM profiles p
WHERE p.family_group_id IS NOT NULL
ON CONFLICT (space_id, user_id) DO NOTHING;


-- ── 3. 공간 생성자(created_by) 를 반드시 admin 으로 보정 ──
UPDATE space_members sm
SET    role = 'admin'
FROM   family_groups fg
WHERE  sm.space_id = fg.id
  AND  sm.user_id  = fg.created_by
  AND  sm.role    != 'admin';


-- ── 4. Helper Functions ────────────────────────────────────

-- 현재 사용자가 속한 모든 공간 ID 목록
CREATE OR REPLACE FUNCTION my_space_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT space_id
  FROM   space_members
  WHERE  user_id = auth.uid()
$$;

-- 특정 공간에서 현재 사용자의 역할 (없으면 NULL)
CREATE OR REPLACE FUNCTION my_role_in_space(p_space_id uuid)
RETURNS text
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role
  FROM   space_members
  WHERE  user_id  = auth.uid()
    AND  space_id = p_space_id
$$;

-- 현재 사용자가 특정 공간의 admin 인지
CREATE OR REPLACE FUNCTION is_space_admin(p_space_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   space_members
    WHERE  user_id  = auth.uid()
      AND  space_id = p_space_id
      AND  role     = 'admin'
  )
$$;

-- 현재 사용자가 특정 공간에서 편집 권한이 있는지 (admin 또는 editor)
CREATE OR REPLACE FUNCTION can_edit_in_space(p_space_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   space_members
    WHERE  user_id  = auth.uid()
      AND  space_id = p_space_id
      AND  role     IN ('admin', 'editor')
  )
$$;


-- ── 5. RLS: space_members 테이블 ──────────────────────────
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;

-- 같은 공간 멤버라면 멤버 목록 조회 가능
CREATE POLICY "space_members: 공간 멤버 목록 조회"
  ON space_members FOR SELECT
  USING (space_id IN (SELECT my_space_ids()));

-- admin 만 새 멤버 추가 가능, 단 초대코드로 본인 참여는 허용
CREATE POLICY "space_members: 멤버 추가 (admin 또는 본인 자가참여)"
  ON space_members FOR INSERT
  WITH CHECK (
    is_space_admin(space_id)       -- admin 이 초대
    OR user_id = auth.uid()        -- 본인 자가 참여 (초대코드 플로우)
  );

-- 역할 변경은 admin 만
CREATE POLICY "space_members: 역할 변경 (admin 전용)"
  ON space_members FOR UPDATE
  USING (is_space_admin(space_id));

-- 추방: admin 이 제거하거나, 본인이 탈퇴
CREATE POLICY "space_members: 멤버 제거 (admin 또는 본인 탈퇴)"
  ON space_members FOR DELETE
  USING (
    is_space_admin(space_id)
    OR user_id = auth.uid()
  );


-- ── 6. schedules RLS 강화: 역할 기반으로 교체 ────────────
-- 기존 정책 제거 (INSERT/UPDATE/DELETE 만 교체, SELECT 는 유지)
DROP POLICY IF EXISTS "가족 일정 생성" ON schedules;
DROP POLICY IF EXISTS "가족 일정 수정" ON schedules;
DROP POLICY IF EXISTS "가족 일정 삭제" ON schedules;

-- 일정 생성: editor 이상만 가능
CREATE POLICY "schedules: 일정 생성 (editor 이상)"
  ON schedules FOR INSERT
  WITH CHECK (
    family_group_id IN (SELECT my_space_ids())
    AND can_edit_in_space(family_group_id)
    AND created_by = auth.uid()
  );

-- 일정 수정: 작성자 본인 OR editor 이상
CREATE POLICY "schedules: 일정 수정 (editor 이상 또는 본인)"
  ON schedules FOR UPDATE
  USING (
    family_group_id IN (SELECT my_space_ids())
    AND (
      created_by = auth.uid()           -- 본인 작성 일정
      OR can_edit_in_space(family_group_id)  -- editor+ 권한
    )
  );

-- 일정 삭제: 본인 작성 OR admin
CREATE POLICY "schedules: 일정 삭제 (본인 또는 admin)"
  ON schedules FOR DELETE
  USING (
    created_by = auth.uid()
    OR is_space_admin(family_group_id)
  );


-- ── 7. profiles RLS: 공간 범위로 조회 확장 ───────────────
DROP POLICY IF EXISTS "같은 가족 프로필 조회" ON profiles;

-- 같은 공간에 속한 멤버라면 프로필 조회 가능
CREATE POLICY "profiles: 같은 공간 멤버 프로필 조회"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR id IN (
      SELECT sm.user_id
      FROM   space_members sm
      WHERE  sm.space_id IN (SELECT my_space_ids())
    )
  );


-- ── 8. family_groups RLS: 공간 조회 범위 확장 ────────────
DROP POLICY IF EXISTS "가족 그룹 조회" ON family_groups;

-- space_members 기반으로 내가 속한 공간들 조회 가능
CREATE POLICY "family_groups: 내가 속한 공간 조회"
  ON family_groups FOR SELECT
  USING (
    id IN (SELECT my_space_ids())
    OR created_by = auth.uid()  -- 내가 만든 공간
  );


-- ── 9. profiles.role CHECK 제약 완화 ─────────────────────
--    기존: 'parent'|'child'|'guest' 만 허용
--    이후 role 컬럼은 레거시로 남기고 space_members.role 이 기준
--    새 사용자 기본값을 NULL 허용으로 전환 (트리거도 변경)
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD  CONSTRAINT profiles_role_check
  CHECK (role IN ('parent', 'child', 'guest', 'admin', 'editor', 'viewer'));

-- 신규 회원 생성 트리거: role 기본값 제거 (space_members 가 담당)
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


-- ── 완료 메시지 ───────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 001 완료: space_members 생성, 데이터 이전, RLS 강화';
  RAISE NOTICE '   - space_members 테이블 생성됨';
  RAISE NOTICE '   - 기존 profiles 멤버십 데이터 이전됨';
  RAISE NOTICE '   - 역할 기반 RLS 정책 적용됨 (admin/editor/viewer)';
END $$;
