-- ============================================================
-- Migration 006: 회원탈퇴 / GDPR / 정보통신망법 대응
--
-- 설계 원칙:
--   1. 소프트 딜리트 — 탈퇴 신청 후 30일간 복구 가능
--   2. 30일 경과 후 PII(개인식별정보) 완전 삭제
--   3. 익명화된 통계는 영구 보관 (관리자 대시보드용)
--   4. 정보통신망법 / 통신비밀보호법 의무 보관 항목 처리
--
-- 법적 근거:
--   - 개인정보보호법 제21조: 목적 달성 시 즉시 파기
--   - 통신비밀보호법 제15조의2: 접속 로그 3개월 보관
--   - 전자상거래법 제6조: 금융 거래 기록 5년 (글리움은 결제 없음 → 미해당)
--
-- 실행 방법:
--   Supabase 대시보드 > SQL Editor > 이 파일 내용 붙여넣기 후 실행
-- ============================================================


-- ── 1. profiles 테이블 탈퇴 관련 컬럼 추가 ───────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'withdrawal_requested_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN withdrawal_requested_at timestamptz;
    RAISE NOTICE 'profiles.withdrawal_requested_at 추가됨';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_withdrawn'
  ) THEN
    -- 탈퇴 완료 후 PII 삭제된 상태 표시 (FK 참조 무결성 유지용 행 잔류)
    ALTER TABLE profiles ADD COLUMN is_withdrawn boolean DEFAULT false NOT NULL;
    RAISE NOTICE 'profiles.is_withdrawn 추가됨';
  END IF;
END $$;


-- ── 2. withdrawal_archive 테이블 (익명 통계 + 법적 보관) ─────
--    PII 없음. 가입월·탈퇴월만 기록 → 관리자 연간 통계용
CREATE TABLE IF NOT EXISTS withdrawal_archive (
  id                         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  -- 통계용 (월 단위 집계, PII 없음)
  signup_year_month          text        NOT NULL,   -- 예: '2026-03'
  withdrawal_requested_month text        NOT NULL,   -- 예: '2026-05'
  withdrawn_month            text,                   -- 실제 삭제 처리 월
  -- 법적 최소 보관: 개인정보보호법상 파기 기록 (이름/이메일 없음)
  withdrawal_requested_at    timestamptz NOT NULL,
  withdrawn_at               timestamptz,
  -- 선택: 탈퇴 사유 (앱에서 수집할 경우)
  reason                     text,
  created_at                 timestamptz DEFAULT now() NOT NULL
);

-- 관리자 통계 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_withdrawal_archive_months
  ON withdrawal_archive (signup_year_month, withdrawal_requested_month);

-- 서비스 롤만 접근 (RLS 활성화, 정책 없음)
ALTER TABLE withdrawal_archive ENABLE ROW LEVEL SECURITY;


-- ── 3. access_logs 테이블 (통신비밀보호법 — 접속 로그 3개월) ──
--    법적 근거: 통신비밀보호법 제15조의2
--    보관 기간: 3개월 → cron으로 자동 정리
CREATE TABLE IF NOT EXISTS access_logs (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  path       text,
  logged_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_access_logs_user_logged
  ON access_logs (user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_logged
  ON access_logs (logged_at);

-- 서비스 롤만 접근
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;


-- ── 4. 탈퇴 신청 중 계정 접근 차단 RLS 정책 ─────────────────
--    탈퇴 신청 사용자는 자신의 프로필 조회 가능하되
--    탈퇴 완료(is_withdrawn=true) 계정은 스스로 조회 불가
DROP POLICY IF EXISTS "profiles: 본인 조회" ON profiles;
CREATE POLICY "profiles: 본인 조회"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    AND is_withdrawn = false
  );


-- ── 완료 메시지 ───────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 006 완료: 회원탈퇴 컬럼, withdrawal_archive, access_logs 생성';
END $$;
