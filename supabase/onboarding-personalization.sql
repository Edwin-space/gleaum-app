-- ============================================================
-- 글리움 — 개인 중심 온보딩/개인화 1차 확장
-- Supabase SQL Editor에서 실행하세요.
-- 기존 데이터와 호환되도록 IF NOT EXISTS만 사용합니다.
-- ============================================================

alter table profiles
  add column if not exists display_name text,
  add column if not exists real_name text,
  add column if not exists name_display_mode text check (name_display_mode in ('nickname','real_name')) default 'nickname',
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists timezone text default 'Asia/Seoul',
  add column if not exists locale text default 'ko-KR',
  add column if not exists preferences jsonb default '{}'::jsonb,
  add column if not exists notification_settings jsonb default '{}'::jsonb;

-- 기존 사용자는 name을 기본 display_name으로 채워 앱 표시명을 안정화합니다.
update profiles
set display_name = coalesce(display_name, name, split_part(email, '@', 1), '사용자')
where display_name is null;

-- handle_new_user 트리거도 신규 컬럼을 채우도록 갱신합니다.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, display_name, email, avatar, role, timezone, locale, preferences, notification_settings)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), '사용자'),
    new.email,
    '👤',
    'parent',
    'Asia/Seoul',
    'ko-KR',
    '{}'::jsonb,
    '{}'::jsonb
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- 확인
select column_name, data_type
from information_schema.columns
where table_name = 'profiles'
  and column_name in (
    'display_name', 'real_name', 'name_display_mode', 'onboarding_completed_at',
    'timezone', 'locale', 'preferences', 'notification_settings'
  )
order by column_name;
