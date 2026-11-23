-- ============================================================================
-- Hallways — Supabase storage-policy fix + test-data cleanup
-- Run ONCE in Supabase Dashboard > SQL Editor > New query > Run.
-- Safe to re-run (every step is guarded/idempotent).
--
-- WHY: the existing storage.objects policies allow any authenticated user to
-- upload/overwrite inside ANY user's folder, and provide no DELETE policy at
-- all (so deleting a post leaves its media orphaned in storage).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Remove existing policies for our four buckets, then recreate them scoped
--    to the owner's folder. Buckets are public (read), writes are owner-only.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  b text;
  p record;
BEGIN
  FOREACH b IN ARRAY ARRAY['posts', 'messages', 'avatars', 'stories'] LOOP
    -- drop every existing policy that mentions this bucket
    FOR p IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'storage' AND tablename = 'objects'
        AND (qual LIKE '%' || b || '%' OR with_check LIKE '%' || b || '%')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
    END LOOP;

    -- public read (the app serves media through getPublicUrl)
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR SELECT USING (bucket_id = %L)',
      b || ' storage is publicly readable', b);

    -- owner-only write. Layout: <user_id>/<file> for posts/messages/stories,
    -- <user_id>_<ts>_<name> (flat) for avatars.
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L AND ((storage.foldername(name))[1] = auth.uid()::text OR name LIKE auth.uid()::text || ''%%''))',
      'Users can upload own ' || b, b);

    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR UPDATE USING (bucket_id = %L AND ((storage.foldername(name))[1] = auth.uid()::text OR name LIKE auth.uid()::text || ''%%''))',
      'Users can update own ' || b, b);

    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR DELETE USING (bucket_id = %L AND ((storage.foldername(name))[1] = auth.uid()::text OR name LIKE auth.uid()::text || ''%%''))',
      'Users can delete own ' || b, b);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Realtime for live DMs + notifications (idempotent)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['messages', 'notifications']) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

ALTER TABLE messages      REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- ---------------------------------------------------------------------------
-- 3. Clean up test artifacts created during verification
-- ---------------------------------------------------------------------------
DELETE FROM likes      WHERE user_id IN (SELECT id FROM profiles WHERE username LIKE 'hwtest%');
DELETE FROM messages   WHERE content LIKE 'rt probe%' OR content = 'realtime probe' OR content = 'selftest';
DELETE FROM notifications WHERE actor_id IN (SELECT id FROM profiles WHERE username LIKE 'hwtest%');
DELETE FROM profiles   WHERE username LIKE 'hwtest%';
DELETE FROM auth.users  WHERE email LIKE 'hallways.test.%@example.com';

-- remove ONLY the probe files uploaded during verification.
-- Exact folder paths (the trailing '/' makes these folder prefixes, not wildcards).
-- NOTE: '_' is a single-char wildcard in LIKE, so equality/prefix matching on the
-- flat 'avatars' bucket must use LIKE ... ESCAPE, or the pattern would match other
-- user ids by accident. Those three avatar probes are deleted by exact name instead.
DELETE FROM storage.objects
WHERE (bucket_id = 'posts'    AND name LIKE 'hwtest7phb/%')
   OR (bucket_id = 'messages' AND name LIKE 'hwtest7phb/%')
   OR (bucket_id = 'stories'  AND name LIKE 'hwtest7phb/%')
   OR (bucket_id = 'posts'    AND name LIKE 'e1ac927f-c4cf-48f6-b0b4-e01f79951938/%')
   OR (bucket_id = 'posts'    AND name = '60446c47-10a3-4b80-be17-cf539df8/hack.png')
   OR (bucket_id = 'avatars'  AND name = 'e1ac927f-c4cf-48f6-b0b4-e01f79951938_999_own.png')
   OR (bucket_id = 'avatars'  AND name = '60446c47-10a3-4b80-be17-cf539df8_999_hack.png')
   OR (bucket_id = 'avatars'  AND name = 'hwtest7phb_1_t.png')
   OR (bucket_id = 'posts'    AND name LIKE 'anonprobe/%');

-- ---------------------------------------------------------------------------
-- Verify:
--   SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects';
--   SELECT count(*) FROM profiles WHERE username LIKE 'hwtest%';   -- expect 0
-- ---------------------------------------------------------------------------
