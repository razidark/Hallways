
-- ============================================================================
-- !! SUPERSEDED — DO NOT APPLY !!
-- This file contains the VULNERABLE username-based admin bypass
-- (profiles.username = 'r4zi3ld4rk'). It has already been applied to the live
-- database and has since been replaced by supabase_hardening_v3.sql.
-- Applying this file again would REINTRODUCE the bypass.
-- Use: supabase_hardening_v3.sql
-- ============================================================================

-- ============================================================================
-- Hallways — Supabase hardening + cleanup  (v2, TRANSACTION-PROOF)
-- Supabase Dashboard > SQL Editor > New query > Run.  ONE TIME.
--
-- v1 did not land: the SQL editor runs a multi-statement script in ONE
-- transaction, so a single failing statement rolled everything back.
-- In this version every step lives inside its own exception-guarded DO
-- block, so nothing can abort the rest.
--
-- Order matters: security fixes first, cleanup second, report last.
-- The LAST statement returns one row per check — every row must read 'PASS'.
-- ============================================================================


-- ============================================================================
-- PART 1 — SECURITY
-- ============================================================================

-- 1.1  Admin helper (SECURITY DEFINER -> bypasses RLS on profiles, so using
--      it inside an RLS policy does NOT cause "infinite recursion").
DO $$
BEGIN
  BEGIN
    CREATE OR REPLACE FUNCTION public.is_admin()
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $fn$
      SELECT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND (p.role = 'admin' OR p.username = 'r4zi3ld4rk')
      );
    $fn$;

    RAISE NOTICE 'OK  1.1 is_admin() helper created';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL 1.1 helper: %', SQLERRM;
  END;
END $$;


-- 1.2  Privilege-escalation guard on profiles.role -------------------------
--      "Users and admins can update profiles" has a USING clause but nothing
--      constrains the NEW role value, so any signed-in user could set their
--      own profiles.role to 'admin' (and then delete anyone's posts).
--      This BEFORE UPDATE trigger allows a role change only for an admin.
--      auth.uid() IS NULL  =>  service_role / SQL Editor session (trusted).
DO $$
BEGIN
  BEGIN
    CREATE OR REPLACE FUNCTION public.guard_profile_role()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $fn$
    BEGIN
      IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF auth.uid() IS NULL THEN
          RETURN NEW;                       -- trusted backend / SQL editor
        END IF;
        IF NOT public.is_admin() THEN
          RAISE EXCEPTION 'Only an admin can change a profile role'
            USING ERRCODE = '42501';
        END IF;
      END IF;
      RETURN NEW;
    END;
    $fn$;

    DROP TRIGGER IF EXISTS profiles_guard_role ON public.profiles;
    CREATE TRIGGER profiles_guard_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.guard_profile_role();

    RAISE NOTICE 'OK  1.2 profiles_guard_role trigger installed';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL 1.2 trigger: %', SQLERRM;
  END;
END $$;


-- 1.3  profiles policies: restrict INSERT, and add WITH CHECK to UPDATE ----
--      Note: the real policy names in this project are
--      "Profiles: Owner insert" / "Profiles: Owner edit" /
--      "Users and admins can update profiles" — all three are replaced.
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Profiles: Owner insert" ON public.profiles;
    DROP POLICY IF EXISTS "Profiles: Owner edit" ON public.profiles;
    DROP POLICY IF EXISTS "Users and admins can update profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

    -- A new account may never be inserted with a role other than 'user'.
    CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id AND (role = 'user' OR role IS NULL));

    -- Owner edit: may change everything except escalate their own role.
    CREATE POLICY "Profiles: Owner edit"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
      auth.uid() = id
      AND (role = 'user' OR role IS NULL OR public.is_admin())
    );

    -- Admin edit: may set any role on any profile.
    CREATE POLICY "Users and admins can update profiles"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (
      public.is_admin() OR role = 'user' OR role IS NULL
    );

    RAISE NOTICE 'OK  1.3 profiles policies rewritten';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL 1.3 profiles policies: %', SQLERRM;
  END;
END $$;


-- 1.4a Storage owner helper ------------------------------------------------
--      Layout the app uses:
--        posts, messages, stories -> "<user_id>/<file>"
--        avatars                   -> "<user_id>_<timestamp>_<name>" (flat)
--      The check is bucket-specific so neither shape can be abused to
--      impersonate the other.
DO $$
BEGIN
  BEGIN
    CREATE OR REPLACE FUNCTION public.owner_or_self(p_bucket text, p_objname text)
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $fn$
      SELECT CASE
        WHEN p_bucket IN ('posts', 'messages', 'stories')
          THEN split_part(p_objname, '/', 1) = auth.uid()::text
        WHEN p_bucket = 'avatars'
          THEN split_part(p_objname, '_', 1) = auth.uid()::text
        ELSE false
      END;
    $fn$;
    RAISE NOTICE 'OK  1.4a owner_or_self() helper created';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL 1.4a helper: %', SQLERRM;
  END;
END $$;


-- 1.4b Storage policies ----------------------------------------------------
--      Public read (the app serves media via getPublicUrl()).
--      Owner-only INSERT / UPDATE / DELETE.
DO $$
DECLARE
  b text;
  p record;
BEGIN
  -- Drop every existing storage.objects policy so no loose
  -- "any authenticated user may write anywhere" rule survives.
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  (could not drop policy %: %)', p.policyname, SQLERRM;
    END;
  END LOOP;

  FOREACH b IN ARRAY ARRAY['posts', 'messages', 'avatars', 'stories'] LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR SELECT USING (bucket_id = %L)',
        b || ' media is publicly readable', b);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  (select policy for % failed: %)', b, SQLERRM;
    END;

    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L AND public.owner_or_self(bucket_id, name))',
        'Users can upload own ' || b, b);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  (insert policy for % failed: %)', b, SQLERRM;
    END;

    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR UPDATE USING (bucket_id = %L AND public.owner_or_self(bucket_id, name)) WITH CHECK (bucket_id = %L AND public.owner_or_self(bucket_id, name))',
        'Users can update own ' || b, b, b);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  (update policy for % failed: %)', b, SQLERRM;
    END;

    -- Owner-only delete. This one was missing entirely, so deleting a post
    -- could never free its media from the bucket.
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR DELETE USING (bucket_id = %L AND public.owner_or_self(bucket_id, name))',
        'Users can delete own ' || b, b);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  (delete policy for % failed: %)', b, SQLERRM;
    END;
  END LOOP;

  -- Keep read access working for any other bucket that may exist.
  BEGIN
    EXECUTE 'CREATE POLICY "Other media is publicly readable" ON storage.objects FOR SELECT USING (bucket_id NOT IN (''posts'',''messages'',''avatars'',''stories''))';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '  (catch-all select policy failed: %)', SQLERRM;
  END;

  RAISE NOTICE 'OK  1.4b storage policies rewritten (public read, owner-scoped write/update/delete)';
END $$;


-- 1.5  Realtime for live DMs + notifications --------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['messages', 'notifications'] LOOP
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public' AND tablename = t
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  (realtime for % failed: %)', t, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'OK  1.5 realtime enabled for messages + notifications';
END $$;


-- ============================================================================
-- PART 2 — CLEANUP (verification artifacts only)
--          Keeps @Razi, @RaziDark, @Hermes and all 12 real posts.
--          Test uid = e1ac927f-c4cf-48f6-b0b4-e01f79951938  (@hwtest7phb)
-- ============================================================================

DO $$
BEGIN
  DELETE FROM public.likes         WHERE user_id     = 'e1ac927f-c4cf-48f6-b0b4-e01f79951938';
  DELETE FROM public.comments      WHERE user_id     = 'e1ac927f-c4cf-48f6-b0b4-e01f79951938';
  DELETE FROM public.saves         WHERE user_id     = 'e1ac927f-c4cf-48f6-b0b4-e01f79951938';
  DELETE FROM public.follows       WHERE follower_id = 'e1ac927f-c4cf-48f6-b0b4-e01f79951938'
                                   OR followed_id  = 'e1ac927f-c4cf-48f6-b0b4-e01f79951938';
  DELETE FROM public.messages      WHERE sender_id   = 'e1ac927f-c4cf-48f6-b0b4-e01f79951938'
                                   OR receiver_id = 'e1ac927f-c4cf-48f6-b0b4-e01f79951938';
  DELETE FROM public.notifications WHERE actor_id   = 'e1ac927f-c4cf-48f6-b0b4-e01f79951938'
                                   OR user_id     = 'e1ac927f-c4cf-48f6-b0b4-e01f79951938';
  DELETE FROM public.stories       WHERE user_id     = 'e1ac927f-c4cf-48f6-b0b4-e01f79951938';
  DELETE FROM public.story_views   WHERE user_id     = 'e1ac927f-c4cf-48f6-b0b4-e01f79951938';
  DELETE FROM public.profiles      WHERE id         = 'e1ac927f-c4cf-48f6-b0b4-e01f79951938';
  RAISE NOTICE 'OK  2.1 test rows removed from app tables';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL 2.1 test rows: %', SQLERRM;
END $$;

-- The auth user last: it cascades into profiles, so do it after the rows.
DO $$
BEGIN
  DELETE FROM auth.users WHERE id = 'e1ac927f-c4cf-48f6-b0b4-e01f79951938';
  RAISE NOTICE 'OK  2.2 test auth user deleted';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL 2.2 auth user: %', SQLERRM;
END $$;

-- Probe files uploaded during verification (exact names, no wildcards).
DO $$
BEGIN
  DELETE FROM storage.objects
  WHERE (bucket_id = 'posts'    AND name IN (
           'e1ac927f-c4cf-48f6-b0b4-e01f79951938/own.png',
           'e1ac927f-c4cf-48f6-b0b4-e01f79951938/own2.png',
           'e1ac927f-c4cf-48f6-b0b4-e01f79951938/p1.png',
           'e1ac927f-c4cf-48f6-b0b4-e01f79951938/mine.png',
           'e1ac927f-c4cf-48f6-b0b4-e01f79951938/dtest.png',
           'hwtest7phb/t.png',
           '60446c47-10a3-4b80-be17-cf539df8/hack.png',
           '60446c47-10a3-4b80-be17-cf539df8/own2.png',
           '60446c47-10a3-4b80-be17-cf539df8/p2.png',
           '60446c47-10a3-4b80-be17-cf539df0caf8/hacker.png'
         ))
     OR (bucket_id = 'messages' AND name IN (
           'e1ac927f-c4cf-48f6-b0b4-e01f79951938/t.png',
           'e1ac927f-c4cf-48f6-b0b4-e01f79951938/mine.png',
           'hwtest7phb/t.png'
         ))
     OR (bucket_id = 'stories'  AND name IN (
           'e1ac927f-c4cf-48f6-b0b4-e01f79951938/t.png',
           'hwtest7phb/t.png'
         ))
     OR (bucket_id = 'avatars'  AND name IN (
           'e1ac927f-c4cf-48f6-b0b4-e01f79951938_999_own.png',
           'hwtest7phb_1_t.png',
           '60446c47-10a3-4b80-be17-cf539df8_999_hack.png'
         ));
  RAISE NOTICE 'OK  2.3 probe files removed from storage';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'FAIL 2.3 probe files: %', SQLERRM;
END $$;


-- ============================================================================
-- PART 3 — REPORT
--          One row per check.  Every row must read 'PASS'.
-- ============================================================================
SELECT * FROM (
  SELECT '1.1 is_admin() helper exists' AS check_name,
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public' AND p.proname='is_admin'
         ) THEN 'PASS' ELSE 'FAIL' END AS result

  UNION ALL SELECT '1.2 role-guard trigger installed',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'profiles'
        AND t.tgname = 'profiles_guard_role' AND NOT t.tgisinternal
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '1.3 profiles INSERT restricted to role=user',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='profiles'
        AND policyname='Users can insert own profile' AND with_check LIKE '%role%'
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '1.3b profiles UPDATE policies have WITH CHECK',
    CASE WHEN (
      SELECT count(*) FROM pg_policies
      WHERE schemaname='public' AND tablename='profiles'
        AND cmd='UPDATE' AND with_check IS NOT NULL AND with_check <> ''
    ) >= 2 THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '1.4a owner_or_self() helper exists',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname='owner_or_self'
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '1.4b owner-scoped DELETE for all 4 buckets',
    CASE WHEN (
      SELECT count(DISTINCT regexp_replace(policyname, '^Users can delete own ', ''))
      FROM pg_policies
      WHERE schemaname='storage' AND tablename='objects'
        AND policyname LIKE 'Users can delete own %'
    ) = 4 THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '1.4c owner-scoped INSERT for all 4 buckets',
    CASE WHEN (
      SELECT count(DISTINCT regexp_replace(policyname, '^Users can upload own ', ''))
      FROM pg_policies
      WHERE schemaname='storage' AND tablename='objects'
        AND policyname LIKE 'Users can upload own %'
    ) = 4 THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '1.4d no blanket cross-user write policy left',
    CASE WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='storage' AND tablename='objects'
        AND cmd IN ('INSERT','UPDATE','DELETE')
        AND policyname NOT IN (
          'Users can upload own posts','Users can upload own messages',
          'Users can upload own avatars','Users can upload own stories',
          'Users can update own posts','Users can update own messages',
          'Users can update own avatars','Users can update own stories',
          'Users can delete own posts','Users can delete own messages',
          'Users can delete own avatars','Users can delete own stories')
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '1.5 realtime: messages + notifications published',
    CASE WHEN (
      SELECT count(DISTINCT tablename) FROM pg_publication_tables
      WHERE pubname='supabase_realtime' AND schemaname='public'
        AND tablename IN ('messages','notifications')
    ) = 2 THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '2.1 test account removed from profiles',
    CASE WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id='e1ac927f-c4cf-48f6-b0b4-e01f79951938'
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '2.2 test auth user removed',
    CASE WHEN NOT EXISTS (
      SELECT 1 FROM auth.users WHERE id='e1ac927f-c4cf-48f6-b0b4-e01f79951938'
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '2.3 no stray probe files in storage',
    CASE WHEN NOT EXISTS (
      SELECT 1 FROM storage.objects
      WHERE name LIKE 'e1ac927f-c4cf-48f6-b0b4-e01f79951938/%'
         OR name LIKE 'hwtest7phb/%'
         OR name LIKE '%_999_own.png'
         OR name LIKE '%_999_hack.png'
         OR name LIKE '60446c47-10a3-4b80-be17-cf539df8/%'
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '3.1 real content preserved (12 posts)',
    CASE WHEN (SELECT count(*) FROM public.posts) = 12 THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '3.2 real accounts preserved (Razi, RaziDark, Hermes)',
    CASE WHEN (SELECT count(*) FROM public.profiles
               WHERE username IN ('Razi','RaziDark','Hermes')) = 3
         THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '3.3 @Razi still admin, @Hermes still user',
    CASE WHEN (SELECT role FROM public.profiles WHERE username='Razi') = 'admin'
          AND (SELECT role FROM public.profiles WHERE username='Hermes') = 'user'
         THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '3.4 real media preserved (>=10 Razi/RaziDark files)',
    CASE WHEN (
      SELECT count(*) FROM storage.objects
      WHERE name LIKE '60446c47-10a3-4b80-be17-cf539df0caf8/%'
         OR name LIKE '3d9ad606-%'
    ) >= 10 THEN 'PASS' ELSE 'FAIL' END
) report ORDER BY check_name;
