-- ============================================================
-- Migration 013: 광고 시스템 (자체 광고 + AdSense 폴백)
--
-- 목적:
--   - 백오피스에서 직접 광고 소재를 등록·관리
--   - 등록된 광고가 없는 슬롯은 AdSense 로 자동 폴백
--   - 노출·클릭 이벤트 집계
--
-- 실행 방법:
--   Supabase 대시보드 > SQL Editor > 이 파일 내용 붙여넣기 후 Run
-- ============================================================


-- ── 0. 관리자 권한 컬럼 ────────────────────────────────────────
-- profiles 에 is_admin 추가 (없으면 추가, 있으면 무시)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN profiles.is_admin IS '글리움 서비스 관리자 여부 — 백오피스 접근 권한';


-- ── 1. 광고 슬롯 정의 ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_slots (
  id          text PRIMARY KEY,              -- 'home-feed-inline', 'schedule-list-top' 등
  description text NOT NULL,
  width       int  NOT NULL DEFAULT 320,
  height      int  NOT NULL DEFAULT 60,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  ad_slots        IS '광고 노출 위치 정의';
COMMENT ON COLUMN ad_slots.id     IS '프론트엔드 data-ad-slot 값과 일치';

-- 기본 슬롯 삽입
INSERT INTO ad_slots (id, description, width, height) VALUES
  ('home-feed-inline',    '홈피드 인라인 (인사 카드 하단)',      320, 60),
  ('schedule-list-top',   '일정 목록 상단',                     320, 60),
  ('budget-list-top',     '가계부 목록 상단',                   320, 60)
ON CONFLICT (id) DO NOTHING;


-- ── 2. 광고 소재 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id     text NOT NULL REFERENCES ad_slots(id) ON DELETE CASCADE,

  -- 소재
  title       text NOT NULL,
  description text,
  image_url   text,                  -- Supabase Storage URL
  link_url    text NOT NULL,
  cta_text    text DEFAULT '자세히 보기',

  -- 노출 제어
  is_active   boolean      NOT NULL DEFAULT true,
  priority    int          NOT NULL DEFAULT 0,   -- 높을수록 우선 노출
  starts_at   timestamptz  NOT NULL DEFAULT now(),
  ends_at     timestamptz,                       -- NULL = 무기한

  -- 예산 (선택)
  budget_type    text CHECK (budget_type IN ('cpc','cpm','flat')),
  budget_amount  numeric(12,2),

  -- 메타
  advertiser  text,
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  ads              IS '광고 소재';
COMMENT ON COLUMN ads.priority     IS '같은 슬롯 내 복수 광고 시 높은 값이 우선';
COMMENT ON COLUMN ads.ends_at      IS 'NULL 이면 무기한 노출';

-- updated_at 자동 갱신
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

-- 집계 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS ad_events_ad_id_event_idx ON ad_events(ad_id, event);
CREATE INDEX IF NOT EXISTS ad_events_created_at_idx  ON ad_events(created_at DESC);


-- ── 4. 편의 뷰: 광고별 성과 집계 ──────────────────────────────
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

-- ad_slots: 누구나 읽기, 관리자만 쓰기
CREATE POLICY "ad_slots: 공개 읽기"
  ON ad_slots FOR SELECT USING (true);

CREATE POLICY "ad_slots: 관리자 쓰기"
  ON ad_slots FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ads: 공개 활성 광고 읽기, 관리자 전체 접근
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

-- ad_events: 로그인 사용자 삽입, 관리자 읽기
CREATE POLICY "ad_events: 이벤트 기록 (인증 사용자)"
  ON ad_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR auth.uid() IS NULL); -- 비로그인도 허용 (user_id = NULL)

CREATE POLICY "ad_events: 관리자 읽기"
  ON ad_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));


-- ── 6. 활성 광고 조회 함수 ────────────────────────────────────
-- API 라우트에서 anon key 로 호출 가능
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

COMMENT ON FUNCTION get_active_ad IS '슬롯 ID 로 활성 광고 1개 조회 (우선순위 + 랜덤)';
