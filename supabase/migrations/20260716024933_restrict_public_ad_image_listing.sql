BEGIN;

-- Public buckets serve known object URLs without a storage.objects SELECT
-- policy. Removing this broad policy prevents anonymous bucket enumeration
-- while keeping existing public image URLs available.
DROP POLICY IF EXISTS "ad-images: 공개 읽기" ON storage.objects;

COMMIT;
