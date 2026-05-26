-- ============================================================
-- Migration 007: 프로필 자동생성 트리거 통합 정리
--
-- 문제: 프로필 생성이 3곳에 분산
--   1. SQL 트리거 handle_new_user (avatar='👤' 하드코딩)
--   2. auth/callback 라우트 (SNS 이미지 적용 로직 중복)
--   3. ensureUserSetup (공간 생성만 담당 — 실제 프로필 생성 아님)
--
-- 해결: 트리거를 단일 진실의 원천으로 강화
--   - SNS 아바타(avatar_url/picture)를 트리거에서 직접 적용
--   - auth/callback은 트리거를 신뢰하고 avatar 보완만 수행
--
-- 실행 방법:
--   Supabase 대시보드 > SQL Editor > 실행
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (
    id,
    name,
    display_name,
    email,
    avatar,
    timezone,
    locale,
    preferences,
    notification_settings
  )
  VALUES (
    new.id,
    -- 이름: Google full_name → name → 이메일 앞부분
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      '사용자'
    ),
    -- display_name: 동일 (별칭)
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      '사용자'
    ),
    new.email,
    -- 아바타: SNS 이미지 우선, 없으면 기본 이모지
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      '👤'
    ),
    'Asia/Seoul',
    'ko-KR',
    '{}'::jsonb,
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 트리거 재등록 (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 007 완료: handle_new_user 트리거 강화 (SNS 아바타 적용)';
END $$;
