BEGIN;

-- Events are accepted only by the validated Next.js route, which writes with
-- service_role after checking request shape and the referenced active ad.
DROP POLICY IF EXISTS "ad_events: 이벤트 기록" ON public.ad_events;
DROP POLICY IF EXISTS "ad_events: 이벤트 기록 (인증 사용자)" ON public.ad_events;

REVOKE INSERT ON TABLE public.ad_events
  FROM PUBLIC, anon, authenticated;

REVOKE USAGE, SELECT ON SEQUENCE public.ad_events_id_seq
  FROM PUBLIC, anon, authenticated;

GRANT INSERT ON TABLE public.ad_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ad_events_id_seq TO service_role;

COMMIT;
