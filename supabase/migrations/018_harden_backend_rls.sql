-- ============================================================
-- 018 — 백엔드 RLS/함수 보안 하드닝
-- ============================================================
-- 실행 위치:
--   Supabase Dashboard -> SQL Editor -> New query
--
-- 실행 방식:
--   이 파일 전체 내용을 복사해서 실행합니다.
--
-- 목적:
--   1. 초대코드 검증 없는 space_members 자가 참여 차단
--   2. notifications 직접 삽입 범위 축소
--   3. 캠페인 로그/상세 테이블을 service_role 전용으로 제한
--   4. SECURITY DEFINER 함수 search_path/execute 권한 하드닝
--   5. 일정/참여자 UPDATE/INSERT 정책의 WITH CHECK 보강
-- ============================================================

BEGIN;

-- ── 1. SECURITY DEFINER 함수 하드닝 ─────────────────────────
-- public schema의 SECURITY DEFINER 함수는 search_path를 고정하고,
-- 직접 호출 권한은 필요한 role에만 부여합니다.
-- PostgreSQL은 ALTER FUNCTION IF EXISTS를 지원하지 않으므로 to_regprocedure로 존재 여부를 확인합니다.

DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    to_regprocedure('public.handle_new_user()'),
    to_regprocedure('public.my_family_group_id()'),
    to_regprocedure('public.my_space_ids()'),
    to_regprocedure('public.my_role_in_space(uuid)'),
    to_regprocedure('public.is_space_admin(uuid)'),
    to_regprocedure('public.can_edit_in_space(uuid)'),
    to_regprocedure('public.get_active_ad(text)'),
    to_regprocedure('public.get_active_ad(text,text)')
  ]
  LOOP
    IF fn IS NOT NULL THEN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    to_regprocedure('public.handle_new_user()'),
    to_regprocedure('public.my_family_group_id()'),
    to_regprocedure('public.my_space_ids()'),
    to_regprocedure('public.my_role_in_space(uuid)'),
    to_regprocedure('public.is_space_admin(uuid)'),
    to_regprocedure('public.can_edit_in_space(uuid)')
  ]
  LOOP
    IF fn IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    to_regprocedure('public.my_family_group_id()'),
    to_regprocedure('public.my_space_ids()'),
    to_regprocedure('public.my_role_in_space(uuid)'),
    to_regprocedure('public.is_space_admin(uuid)'),
    to_regprocedure('public.can_edit_in_space(uuid)')
  ]
  LOOP
    IF fn IS NOT NULL THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
    END IF;
  END LOOP;
END $$;

-- 광고 조회 RPC는 공개 광고 조회 API에서 anon/authenticated 키로 호출합니다.
DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    to_regprocedure('public.get_active_ad(text)'),
    to_regprocedure('public.get_active_ad(text,text)')
  ]
  LOOP
    IF fn IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', fn);
    END IF;
  END LOOP;
END $$;


-- ── 2. space_members: 초대코드 없는 자가 참여 차단 ─────────
-- 초대코드 검증은 /api/invite/join 서버 라우트(service_role)에서만 수행합니다.

DROP POLICY IF EXISTS "space_members: 멤버 추가 (admin 또는 본인 자가참여)" ON public.space_members;
DROP POLICY IF EXISTS "space_members: 멤버 추가 (admin 전용)" ON public.space_members;

CREATE POLICY "space_members: 멤버 추가 (admin 전용)"
  ON public.space_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_space_admin(space_id)
  );

DROP POLICY IF EXISTS "space_members: 역할 변경 (admin 전용)" ON public.space_members;

CREATE POLICY "space_members: 역할 변경 (admin 전용)"
  ON public.space_members
  FOR UPDATE
  TO authenticated
  USING (
    public.is_space_admin(space_id)
  )
  WITH CHECK (
    public.is_space_admin(space_id)
  );


-- ── 3. schedules: UPDATE WITH CHECK 보강 ───────────────────
-- UPDATE 이후에도 동일한 접근 규칙을 만족해야 합니다.

DROP POLICY IF EXISTS "schedules: 일정 수정 (editor 이상 또는 본인)" ON public.schedules;

CREATE POLICY "schedules: 일정 수정 (editor 이상 또는 본인)"
  ON public.schedules
  FOR UPDATE
  TO authenticated
  USING (
    family_group_id IN (SELECT public.my_space_ids())
    AND (
      (visibility = 'private' AND created_by = auth.uid())
      OR (
        (visibility IS NULL OR visibility <> 'private')
        AND (
          created_by = auth.uid()
          OR public.can_edit_in_space(family_group_id)
        )
      )
    )
  )
  WITH CHECK (
    family_group_id IN (SELECT public.my_space_ids())
    AND (
      (visibility = 'private' AND created_by = auth.uid())
      OR (
        (visibility IS NULL OR visibility <> 'private')
        AND (
          created_by = auth.uid()
          OR public.can_edit_in_space(family_group_id)
        )
      )
    )
  );


-- ── 4. schedule_participants: 같은 공간 멤버만 참여자로 추가 ─
-- editor 이상이더라도 해당 공간에 속하지 않은 사용자를 참여자로 넣지 못하게 합니다.

DROP POLICY IF EXISTS "schedule_participants: 참여자 추가 (editor 이상)" ON public.schedule_participants;

CREATE POLICY "schedule_participants: 참여자 추가 (editor 이상)"
  ON public.schedule_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.schedules s
      WHERE s.id = schedule_id
        AND public.can_edit_in_space(s.family_group_id)
        AND EXISTS (
          SELECT 1
          FROM public.space_members sm
          WHERE sm.space_id = s.family_group_id
            AND sm.user_id = schedule_participants.user_id
        )
    )
  );


-- ── 5. notifications: 일반 클라이언트 직접 삽입 범위 축소 ───
-- 서버(service_role)는 RLS를 우회하므로 크론/알림 API 발송 기록은 유지됩니다.
-- 클라이언트 직접 insert는 본인 알림만 허용합니다.

DROP POLICY IF EXISTS "notifications: 알림 생성" ON public.notifications;

CREATE POLICY "notifications: 알림 생성"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "notifications: 내 알림 수정" ON public.notifications;

CREATE POLICY "notifications: 내 알림 수정"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );


-- ── 6. campaign_*: service_role 전용 정책으로 교체 ─────────
-- public API는 서버 라우트에서 service_role로 기록하므로 일반 클라이언트 접근은 닫습니다.

REVOKE ALL ON TABLE public.campaign_logs FROM anon, authenticated;
REVOKE ALL ON TABLE public.campaign_clicks FROM anon, authenticated;
REVOKE ALL ON TABLE public.campaign_send_details FROM anon, authenticated;

DROP POLICY IF EXISTS "service_role_all" ON public.campaign_logs;
DROP POLICY IF EXISTS "service_role_all" ON public.campaign_clicks;
DROP POLICY IF EXISTS "service_role_all" ON public.campaign_send_details;

CREATE POLICY "campaign_logs: service_role only"
  ON public.campaign_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "campaign_clicks: service_role only"
  ON public.campaign_clicks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "campaign_send_details: service_role only"
  ON public.campaign_send_details
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;


-- ── 실행 후 확인용 ─────────────────────────────────────────
-- 아래 결과에서 정책명이 새 이름으로 보이면 정상입니다.
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'space_members',
    'schedules',
    'schedule_participants',
    'notifications',
    'campaign_logs',
    'campaign_clicks',
    'campaign_send_details'
  )
ORDER BY tablename, policyname;
