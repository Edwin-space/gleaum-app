BEGIN;

-- Trigger and maintenance functions must not inherit a caller-controlled
-- search_path. Keep public for the referenced application tables/functions
-- and pg_temp last to prevent temporary-object shadowing.
ALTER FUNCTION public.update_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.ads_set_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.cleanup_old_invite_attempts()
  SET search_path = public, pg_temp;

-- This is an internal maintenance function. It must never be callable through
-- the public API roles; backend maintenance can invoke it with service_role.
REVOKE ALL ON FUNCTION public.cleanup_old_invite_attempts()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.cleanup_old_invite_attempts()
  TO service_role;

COMMIT;
