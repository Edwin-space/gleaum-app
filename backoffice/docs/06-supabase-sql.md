# 06. Supabase SQL 실행 가이드

> **⚠️ 중요 규칙**: 코드를 배포해도 Supabase 스키마 변경은 자동으로 반영되지 않습니다.  
> 아래 SQL은 반드시 **Supabase 대시보드 → SQL Editor → New Query**에서 직접 실행해야 합니다.

---

## ✅ 실행 완료 현황 (2026-06-01 기준)

| 항목 | 상태 |
|------|------|
| `013_ad_system.sql` | ✅ 실행 완료 |
| `014_ad_platforms.sql` | ✅ 실행 완료 |
| `is_admin = true` 관리자 설정 | ✅ 완료 |
| `ad-images` Storage 버킷 + 정책 | ✅ 완료 |
| `schedules.expense_category` CHECK 확장 | ✅ 완료 |
| `ad_slots` RLS 정책 재생성 | ✅ 완료 |
| `save-prompt` 슬롯 추가 | ✅ 완료 |

---

## 🚀 빠른 시작 — 처음 설정하는 경우

아래 순서대로 SQL Editor에 붙여넣고 **Run** 버튼을 클릭하세요.

```
① 013_ad_system.sql      (광고 시스템 테이블/함수/RLS 생성)
② 014_ad_platforms.sql   (platforms 컬럼 + RPC 파라미터 보정)
③ 관리자 계정 is_admin 설정  (백오피스 로그인 계정에 권한 부여)
④ expense_category CHECK 확장 (food/daily 등 추가)
```

## ④ expense_category CHECK 확장 (신규)

지출 카테고리 추가로 기존 CHECK 제약이 위반되는 문제 수정:

```sql
ALTER TABLE schedules
DROP CONSTRAINT IF EXISTS schedules_expense_category_check;

ALTER TABLE schedules
ADD CONSTRAINT schedules_expense_category_check
CHECK (expense_category IN (
  'education', 'housing', 'utility', 'insurance', 'subscription',
  'food', 'daily', 'fashion', 'transport', 'culture', 'medical', 'social',
  'other'
));
```

---

## ① Migration 013 — 광고 시스템 (`013_ad_system.sql`)

> **실행 조건**: `ad_slots`, `ads`, `ad_events` 테이블이 없을 때 실행

```sql
-- ============================================================
-- Migration 013: 광고 시스템 (자체 광고 + AdSense 폴백)
-- ============================================================

-- ── 0. 관리자 권한 컬럼 ────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN profiles.is_admin IS '글리움 서비스 관리자 여부 — 백오피스 접근 권한';


-- ── 1. 광고 슬롯 정의 ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_slots (
  id          text PRIMARY KEY,
  description text NOT NULL,
  width       int  NOT NULL DEFAULT 320,
  height      int  NOT NULL DEFAULT 60,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  ad_slots        IS '광고 노출 위치 정의';
COMMENT ON COLUMN ad_slots.id     IS '프론트엔드 data-ad-slot 값과 일치';

INSERT INTO ad_slots (id, description, width, height) VALUES
  ('home-feed-inline',    '홈피드 인라인 (인사 카드 하단)',      320, 60),
  ('schedule-list-top',   '일정 목록 상단',                     320, 60),
  ('budget-list-top',     '가계부 목록 상단',                   320, 60)
ON CONFLICT (id) DO NOTHING;


-- ── 2. 광고 소재 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id     text NOT NULL REFERENCES ad_slots(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  image_url   text,
  link_url    text NOT NULL,
  cta_text    text DEFAULT '자세히 보기',
  is_active   boolean      NOT NULL DEFAULT true,
  priority    int          NOT NULL DEFAULT 0,
  starts_at   timestamptz  NOT NULL DEFAULT now(),
  ends_at     timestamptz,
  budget_type    text CHECK (budget_type IN ('cpc','cpm','flat')),
  budget_amount  numeric(12,2),
  advertiser  text,
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  ads              IS '광고 소재';
COMMENT ON COLUMN ads.priority     IS '같은 슬롯 내 복수 광고 시 높은 값이 우선';
COMMENT ON COLUMN ads.ends_at      IS 'NULL 이면 무기한 노출';

CREATE OR REPLACE FUNCTION ads_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS ads_updated_at ON ads;
CREATE TRIGGER ads_updated_at
  BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION ads_set_updated_at();


-- ── 3. 광고 이벤트 (노출·클릭) ────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_events (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ad_id      uuid NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  event      text NOT NULL CHECK (event IN ('impression','click')),
  user_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  platform   text CHECK (platform IN ('web','android','ios')),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE ad_events IS '광고 노출·클릭 이벤트 로그';

CREATE INDEX IF NOT EXISTS ad_events_ad_id_event_idx ON ad_events(ad_id, event);
CREATE INDEX IF NOT EXISTS ad_events_created_at_idx  ON ad_events(created_at DESC);


-- ── 4. 광고 성과 집계 뷰 ──────────────────────────────────────
CREATE OR REPLACE VIEW ad_stats AS
SELECT
  a.id,
  a.title,
  a.slot_id,
  a.is_active,
  a.starts_at,
  a.ends_at,
  COUNT(*) FILTER (WHERE e.event = 'impression') AS impressions,
  COUNT(*) FILTER (WHERE e.event = 'click')      AS clicks,
  CASE
    WHEN COUNT(*) FILTER (WHERE e.event = 'impression') > 0
    THEN ROUND(
      COUNT(*) FILTER (WHERE e.event = 'click')::numeric /
      COUNT(*) FILTER (WHERE e.event = 'impression') * 100, 2
    )
    ELSE 0
  END AS ctr_pct
FROM ads a
LEFT JOIN ad_events e ON e.ad_id = a.id
GROUP BY a.id;

COMMENT ON VIEW ad_stats IS '광고별 노출·클릭·CTR 집계 뷰';


-- ── 5. RLS 정책 ───────────────────────────────────────────────
ALTER TABLE ad_slots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;

-- ad_slots
CREATE POLICY "ad_slots: 공개 읽기"
  ON ad_slots FOR SELECT USING (true);

CREATE POLICY "ad_slots: 관리자 쓰기"
  ON ad_slots FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ads
CREATE POLICY "ads: 활성 광고 공개 읽기"
  ON ads FOR SELECT
  USING (
    is_active = true
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at > now())
  );

CREATE POLICY "ads: 관리자 전체 접근"
  ON ads FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ad_events
CREATE POLICY "ad_events: 이벤트 기록"
  ON ad_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR auth.uid() IS NULL);

CREATE POLICY "ad_events: 관리자 읽기"
  ON ad_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));


-- ── 6. 활성 광고 조회 함수 (임시 — 014에서 교체됨) ───────────
-- ⚠️ 이 함수는 014_ad_platforms.sql 실행 후 자동으로 교체됩니다.
--    013 단독 실행 후 바로 014를 이어 실행하세요.
CREATE OR REPLACE FUNCTION get_active_ad(p_slot_id text)
RETURNS TABLE (
  id         uuid,
  title      text,
  description text,
  image_url  text,
  link_url   text,
  cta_text   text
)
LANGUAGE sql SECURITY DEFINER
STABLE
AS $$
  SELECT id, title, description, image_url, link_url, cta_text
  FROM   ads
  WHERE  slot_id  = p_slot_id
    AND  is_active = true
    AND  starts_at <= now()
    AND  (ends_at IS NULL OR ends_at > now())
  ORDER BY priority DESC, random()
  LIMIT 1;
$$;
```

**실행 후 확인:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('ad_slots', 'ads', 'ad_events');
-- 결과: 3개 행이 모두 보이면 성공
```

---

## ② Migration 014 — platforms 컬럼 + RPC 보정 (`014_ad_platforms.sql`)

> **실행 조건**: 013 실행 후 반드시 연이어 실행 (광고 등록이 되려면 필수)

```sql
-- ============================================================
-- Migration 014: 광고 플랫폼 타겟팅 컬럼 추가 + RPC 업데이트
-- ============================================================

-- ── 1. platforms 컬럼 추가 ────────────────────────────────────
ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS platforms text[] NOT NULL DEFAULT ARRAY['web','android','ios'];

COMMENT ON COLUMN ads.platforms IS '노출 플랫폼 목록 (web / android / ios)';

-- 기존 행 기본값 보정
UPDATE ads SET platforms = ARRAY['web','android','ios'] WHERE platforms IS NULL;


-- ── 2. get_active_ad() — p_platform 파라미터 추가 ─────────────
CREATE OR REPLACE FUNCTION get_active_ad(
  p_slot_id  text,
  p_platform text DEFAULT 'web'
)
RETURNS TABLE (
  id          uuid,
  title       text,
  description text,
  image_url   text,
  link_url    text,
  cta_text    text
)
LANGUAGE sql SECURITY DEFINER
STABLE
AS $$
  SELECT id, title, description, image_url, link_url, cta_text
  FROM   ads
  WHERE  slot_id   = p_slot_id
    AND  is_active = true
    AND  starts_at <= now()
    AND  (ends_at IS NULL OR ends_at > now())
    AND  (platforms @> ARRAY[p_platform]
       OR platforms = ARRAY[]::text[])
  ORDER BY priority DESC, random()
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_active_ad IS '슬롯 + 플랫폼 기준 활성 광고 1개 조회 (우선순위 + 랜덤)';
```

**실행 후 확인:**
```sql
-- platforms 컬럼 존재 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'ads' AND column_name = 'platforms';
-- 결과: 1개 행, data_type = 'ARRAY' 이면 성공

-- RPC 파라미터 확인
SELECT proname, pronargs, proargnames
FROM pg_proc WHERE proname = 'get_active_ad';
-- 결과: pronargs = 2, proargnames = '{p_slot_id,p_platform}' 이면 성공
```

---

## ③ 관리자 계정 권한 설정

> **실행 조건**: 백오피스에서 광고/통계 관리를 위해 반드시 설정

```sql
-- ⚠️ 아래 이메일을 실제 관리자 계정으로 변경하세요
UPDATE profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'devianne.tsyoo@gmail.com'  -- ← 실제 관리자 이메일로 교체
);

-- 결과 확인
SELECT id, email, is_admin
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_admin = true;
```

---

## ④ Supabase Storage — ad-images 버킷 생성

> **실행 조건**: 백오피스에서 광고 이미지 업로드 기능을 쓰려면 필수  
> SQL이 아닌 **Supabase 대시보드 UI**에서 설정합니다.

```
Supabase 대시보드 → Storage → New Bucket
  - Name: ad-images
  - Public bucket: ✅ ON (공개 접근 필요)
  - File size limit: 5MB
  - Allowed MIME types: image/webp, image/jpeg, image/png, image/gif
```

버킷 생성 후 Storage 정책을 SQL로 추가:

```sql
-- ad-images 버킷: 공개 읽기 + 관리자만 업로드
CREATE POLICY "ad-images: 공개 읽기"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ad-images');

CREATE POLICY "ad-images: 관리자 업로드"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ad-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "ad-images: 관리자 삭제"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ad-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

---

## ⑤ 기타 대기 중인 마이그레이션

> 아직 실행 여부가 불확실한 마이그레이션. 필요에 따라 실행.

| 파일 | 내용 | 실행 여부 |
|------|------|-----------|
| `009_fix_one_time_expense_status.sql` | 일회성 지출 상태 보정 | ⬜ 확인 필요 |
| `010_move_private_records_to_personal_space.sql` | private 일정/지출 개인 공간으로 이전 | ⬜ 확인 필요 |
| `011_add_expense_reflection_columns.sql` | 공간 지출 → 개인 가계부 반영 컬럼 추가 | ⬜ 확인 필요 |
| `012_cron_overdue_and_digest.sql` | 연체 알림 + 주간 다이제스트 크론잡 | ⬜ **실행 전 app_url·cron_secret 수정 필수** |
| `015_harden_private_schedule_rls.sql` | 개인(private) 일정 RLS 정책 강화 | ⬜ 확인 필요 |

각 파일의 내용은 `supabase/migrations/` 폴더에서 확인하세요.

---

## ⑥ 전체 실행 완료 체크리스트

```
□ 013_ad_system.sql    실행 완료
□ 014_ad_platforms.sql 실행 완료
□ is_admin 설정        완료  (백오피스 관리자 계정)
□ ad-images 버킷       생성 완료 (Storage UI에서)
□ ad-images Storage 정책 SQL 실행 완료
```

---

## 💡 AI 에이전트 작업 지침

> 다음 에이전트가 SQL 관련 작업 시 반드시 준수:

1. **새 테이블/컬럼/함수 추가 시** → `supabase/migrations/NNN_설명.sql` 파일 생성 후 이 문서 ⑥ 체크리스트 업데이트
2. **기존 함수 변경 시** → `CREATE OR REPLACE FUNCTION` 사용 (DROP 후 CREATE 금지)
3. **RLS 정책 추가 시** → `CREATE POLICY ... IF NOT EXISTS` 불가 → `DROP POLICY IF EXISTS` 후 `CREATE POLICY`
4. **코드 배포 ≠ DB 반영** → SQL 실행 없이 코드만 배포하면 기능 오작동. 반드시 사용자에게 SQL 실행 안내
5. **마이그레이션 파일에 정확한 SQL 포함** → 이 문서 최신 상태로 유지
