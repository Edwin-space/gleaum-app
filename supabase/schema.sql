-- ============================================================
-- 글리움 (Gleaum) — Supabase Database Schema
-- Supabase > SQL Editor 에 붙여넣고 실행하세요
-- ============================================================

-- ── 1. family_groups ──────────────────────────────────────
create table if not exists family_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);

-- ── 2. profiles (auth.users 확장) ────────────────────────
create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  name            text,
  email           text,
  avatar          text default '👤',
  role            text check (role in ('parent', 'child', 'guest')) default 'parent',
  family_group_id uuid references family_groups(id),
  google_id       text,
  fcm_token       text,
  updated_at      timestamptz default now()
);

-- ── 3. schedules ─────────────────────────────────────────
create table if not exists schedules (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  type             text check (type in ('shared', 'personal', 'child', 'expense')) not null,
  start_time       timestamptz not null,
  end_time         timestamptz,
  all_day          boolean default false,
  status           text check (status in ('pending', 'in_progress', 'completed', 'missed')) default 'pending',
  location_address text,
  location_lat     float,
  location_lng     float,
  reference_url    text,
  reminder         int default 0,
  repeat           text check (repeat in ('none', 'daily', 'weekly', 'monthly', 'yearly')) default 'none',
  repeat_end_date  timestamptz,
  memo             text,
  family_group_id  uuid references family_groups(id) not null,
  created_by       uuid references auth.users(id) not null,
  -- 정기지출 전용
  amount           int,
  expense_category text check (expense_category in ('education','housing','utility','insurance','subscription','other')),
  payment_method   text check (payment_method in ('auto','card','cash','other')),
  google_event_id  text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ── 4. schedule_participants ──────────────────────────────
create table if not exists schedule_participants (
  schedule_id uuid references schedules(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  primary key (schedule_id, user_id)
);

-- ── 5. notifications ──────────────────────────────────────
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  schedule_id uuid references schedules(id) on delete set null,
  title       text not null,
  body        text not null,
  type        text check (type in ('reminder','re_notify','completion','invite','system')) default 'reminder',
  read        boolean default false,
  created_at  timestamptz default now()
);

-- ── 6. Updated_at 자동 갱신 트리거 ───────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger schedules_updated_at
  before update on schedules
  for each row execute function update_updated_at();

create or replace trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ── 7. 신규 회원 프로필 자동 생성 트리거 ─────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, email, avatar, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    '👤',
    'parent'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── 8. RLS (Row Level Security) ───────────────────────────
alter table family_groups         enable row level security;
alter table profiles              enable row level security;
alter table schedules             enable row level security;
alter table schedule_participants enable row level security;
alter table notifications         enable row level security;

-- helper: 현재 사용자의 family_group_id
create or replace function my_family_group_id()
returns uuid as $$
  select family_group_id from profiles where id = auth.uid()
$$ language sql security definer stable;

-- family_groups policies
create policy "가족 그룹 조회"
  on family_groups for select
  using (id = my_family_group_id());

create policy "가족 그룹 생성"
  on family_groups for insert
  with check (created_by = auth.uid());

create policy "가족 그룹 수정"
  on family_groups for update
  using (created_by = auth.uid());

-- profiles policies
create policy "내 프로필 전체 접근"
  on profiles for all
  using (id = auth.uid());

create policy "같은 가족 프로필 조회"
  on profiles for select
  using (family_group_id = my_family_group_id() and my_family_group_id() is not null);

-- schedules policies
create policy "가족 일정 조회"
  on schedules for select
  using (family_group_id = my_family_group_id());

create policy "가족 일정 생성"
  on schedules for insert
  with check (family_group_id = my_family_group_id() and created_by = auth.uid());

create policy "가족 일정 수정"
  on schedules for update
  using (family_group_id = my_family_group_id());

create policy "가족 일정 삭제"
  on schedules for delete
  using (family_group_id = my_family_group_id());

-- schedule_participants policies
create policy "참여자 조회"
  on schedule_participants for select
  using (
    exists (
      select 1 from schedules s
      where s.id = schedule_id and s.family_group_id = my_family_group_id()
    )
  );

create policy "참여자 추가"
  on schedule_participants for insert
  with check (
    exists (
      select 1 from schedules s
      where s.id = schedule_id and s.family_group_id = my_family_group_id()
    )
  );

create policy "참여자 삭제"
  on schedule_participants for delete
  using (
    exists (
      select 1 from schedules s
      where s.id = schedule_id and s.family_group_id = my_family_group_id()
    )
  );

-- notifications policies
create policy "내 알림 조회"
  on notifications for select
  using (user_id = auth.uid());

create policy "내 알림 수정"
  on notifications for update
  using (user_id = auth.uid());

create policy "알림 생성"
  on notifications for insert
  with check (true);

-- ── 완료 메시지 ───────────────────────────────────────────
do $$
begin
  raise notice '✅ 글리움 DB 스키마 생성 완료!';
end $$;
