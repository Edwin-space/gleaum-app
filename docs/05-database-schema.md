# 05. 데이터베이스 스키마

## Supabase 프로젝트

- **프로젝트 ID**: `tyvjdsescukaeorcuaga`
- **URL**: `https://tyvjdsescukaeorcuaga.supabase.co`
- **스키마 파일**: `supabase/schema.sql` (루트에 있음)

> ⚠️ 신규 환경 세팅 시 `supabase/schema.sql` 전체를 Supabase SQL Editor에서 실행해야 합니다.

---

## 테이블 구조

### `family_groups` — 가족 그룹
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        text NOT NULL                    -- "김씨 가족"
invite_code text UNIQUE                      -- "GLEAUM-AB12"
created_by  uuid REFERENCES auth.users(id)
created_at  timestamptz DEFAULT now()
```

### `profiles` — 사용자 프로필 (auth.users 확장)
```sql
id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
name            text                         -- 구글 계정 이름
display_name    text                         -- 앱 기본 표시 이름 / 닉네임
real_name       text                         -- 선택 입력 실명
name_display_mode text DEFAULT 'nickname'    -- 'nickname' | 'real_name'
email           text
avatar          text DEFAULT '👤'
role            text DEFAULT 'parent'        -- 'parent' | 'child' | 'guest'
family_group_id uuid REFERENCES family_groups(id)
google_id       text
fcm_token       text                         -- FCM 웹 푸시 등록 토큰
onboarding_completed_at timestamptz          -- 최초 개인화 온보딩 완료 시각
timezone        text DEFAULT 'Asia/Seoul'
locale          text DEFAULT 'ko-KR'
preferences     jsonb DEFAULT '{}'           -- 홈 구성/사용 목적/Space 의도
notification_settings jsonb DEFAULT '{}'     -- 알림 기본값
updated_at      timestamptz DEFAULT now()
```

### 온보딩 / 개인화 확장 SQL

운영 DB에는 `supabase/onboarding-personalization.sql` 실행이 완료되어 위 개인화 컬럼과 신규 회원 트리거가 반영되었습니다. (2026-05-04 확인)
앱 코드는 컬럼이 아직 없는 로컬/신규 환경에서도 기존 홈이 깨지지 않도록 방어하지만, `/onboarding` 저장은 이 SQL 적용 후 정상 동작합니다.

### `schedules` — 일정
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
title            text NOT NULL
type             text NOT NULL               -- 'shared' | 'personal' | 'child' | 'expense'
start_time       timestamptz NOT NULL
end_time         timestamptz
all_day          boolean DEFAULT false
status           text DEFAULT 'pending'      -- 'pending' | 'in_progress' | 'completed' | 'missed'
location_address text
location_lat     float
location_lng     float
reference_url    text
reminder         int DEFAULT 0              -- 분 단위 (0=없음, 30=30분전)
repeat           text DEFAULT 'none'        -- 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
repeat_end_date  timestamptz
memo             text
family_group_id  uuid REFERENCES family_groups(id) NOT NULL
created_by       uuid REFERENCES auth.users(id) NOT NULL
-- 지출 전용
amount           int
expense_category text                       -- 'education' | 'housing' | 'utility' | 'insurance' | 'subscription' | 'other'
payment_method   text                       -- 'auto' | 'card' | 'cash' | 'other'
google_event_id  text                       -- Google Calendar 이벤트 ID
created_at       timestamptz DEFAULT now()
updated_at       timestamptz DEFAULT now()
```

> 가계부 운영 규칙: `type='expense' AND repeat='none'`은 이미 발생한 일회성 지출이므로 애플리케이션 레이어에서 `status='completed'`, `automation_policy='reminder_only'`로 생성한다. `repeat!='none'`인 정기 지출만 `payment_due`/결제 예정 상태를 사용한다.

### `schedule_participants` — 일정 참여자 (N:M)
```sql
schedule_id uuid REFERENCES schedules(id) ON DELETE CASCADE
user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE
PRIMARY KEY (schedule_id, user_id)
```

### `notifications` — 알림
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL
schedule_id uuid REFERENCES schedules(id) ON DELETE SET NULL
title       text NOT NULL
body        text NOT NULL
type        text DEFAULT 'reminder'  -- 'reminder' | 're_notify' | 'completion' | 'invite' | 'system'
read        boolean DEFAULT false
created_at  timestamptz DEFAULT now()
```

---

## RLS (Row Level Security) 정책

모든 테이블에 RLS 활성화됨. **가족 그룹 단위**로 데이터 격리.

### 핵심 helper 함수
```sql
-- 현재 사용자의 family_group_id 반환
CREATE FUNCTION my_family_group_id() RETURNS uuid
  AS $$ SELECT family_group_id FROM profiles WHERE id = auth.uid() $$
  LANGUAGE sql SECURITY DEFINER STABLE;
```

### 정책 요약
| 테이블 | 읽기 | 쓰기 |
|--------|------|------|
| `family_groups` | 내 가족 그룹만 | 생성자만 수정 |
| `profiles` | 같은 가족 그룹 | 본인만 수정 |
| `schedules` | 같은 가족 그룹 | 같은 가족 그룹 |
| `schedule_participants` | 가족 그룹의 일정만 | 가족 그룹의 일정만 |
| `notifications` | 본인 것만 | 본인만 수정 |

---

## 트리거

### `on_auth_user_created` — 신규 회원 프로필 자동 생성
```sql
-- auth.users에 INSERT 시 자동으로 profiles에도 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### `schedules_updated_at` — 수정 시각 자동 갱신
```sql
CREATE TRIGGER schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Supabase Cron / pg_net

리마인더 발송은 Vercel Cron이 아니라 Supabase `pg_cron` + `pg_net`에서 처리합니다.
Vercel Hobby 플랜의 Cron 제한 때문에 `vercel.json`에는 cron 설정을 두지 않습니다.

### 필요한 확장
```sql
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;
```

### 등록된 잡 (2026-06-15 기준, 6종 — 전부 `https://www.gleaum.com`)
| jobname | schedule | target |
|---------|----------|--------|
| `gleaum-recurring-expenses` | `10 15 * * *` | `/api/cron/recurring-expenses` |
| `gleaum-overdue-expenses` | `0 0 * * *` | `/api/cron/overdue-expenses` |
| `gleaum-weekly-digest` | `0 0 * * 1` | `/api/cron/weekly-digest` |
| `gleaum-reminders` | `*/5 * * * *` | `/api/cron/reminders` |
| `gleaum-automations` | `*/5 * * * *` | `/api/cron/automations` |
| `cleanup-withdrawals-daily` | `0 18 * * *` | `/api/cron/cleanup-withdrawals` |

요청 헤더에는 `Authorization: Bearer <CRON_SECRET>`이 포함되어야 하며,
Vercel 환경변수 `CRON_SECRET`(현재 `gleaum-cron-2026`)과 Supabase cron SQL의 Bearer 값이 반드시 같아야 합니다.

> ⚠️ 등록 SQL은 `DO/format($$...$$)` 중첩 금지(syntax error). `cron.schedule(name, schedule, '명령문 평문')` 형태로 작성. 상세: `docs/09-deployment.md`.

### 확인 쿼리
```sql
SELECT jobname, schedule, active,
       substring(command from 'url[^'']*''([^'']+)') AS target_url
FROM cron.job ORDER BY jobname;
```

---

## 첫 로그인 흐름 (`auth/callback/route.ts`)

```
구글 로그인 완료
  → /auth/callback 서버 라우트 실행
  → supabase.auth.exchangeCodeForSession(code)
  → profiles 테이블 확인
  → 프로필 없으면 → profiles INSERT
  → family_group_id 없으면
    → family_groups INSERT (이름: "X씨 가족", 초대코드 자동생성)
    → profiles UPDATE (family_group_id 연결)
  → /home 리다이렉트
```

---

## 데이터 변환 함수 (`src/lib/db.ts`)

DB Row → TypeScript 타입 변환:
```typescript
rowToSchedule(row: ScheduleRow): Schedule  // snake_case → camelCase, string→Date
rowToUser(row: ProfileRow): User
rowToNotification(row: NotificationRow): Notification
```
