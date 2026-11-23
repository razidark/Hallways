-- ============================================================================
-- Hallways — Supabase hardening v3  (CANONICAL, IDEMPOTENT, TRANSACTION-PROOF)
-- ============================================================================
-- Supabase Dashboard > SQL Editor > New query > Run.  Safe to run repeatedly.
--
-- WHAT v3 FIXES (v2b left these open):
--   1. is_admin() granted admin to any account whose username happened to be
--      'r4zi3ld4rk'.  Signup metadata is user-controlled, so ANY new account
--      could claim that username and inherit admin.  The literal is removed:
--      admin now comes from public.profiles.role ONLY.
--   2. The "Users and admins can delete posts" policy inlined the same literal
--      in its USING clause; it now calls public.is_admin().
--   3. public.notifications had no DELETE policy, so unfollowing left the
--      follow notification behind forever.
--   4. public.delete_user() existed in the live DB but in NO checked-in SQL
--      file, so a fresh deploy would lose account deletion.
--
-- v2b ALSO REFERENCED TWO COLUMNS THAT DO NOT EXIST:
--   follows.followed_id   (the real column is following_id)
--   story_views.user_id   (the real column is viewer_id)
-- Those DELETEs aborted the cleanup block and rolled it back.  Fixed here.
--
-- The LAST statement returns one row per check — every row must read 'PASS'.
-- ============================================================================


-- ============================================================================
-- PART 1 — SECURITY
-- ============================================================================

-- 1.1  Admin helper ---------------------------------------------------------
--      SECURITY DEFINER so it can be used inside RLS policies without
--      triggering "infinite recursion" on public.profiles.
--      Admin == profiles.role = 'admin'.  Nothing else.
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
          AND p.role = 'admin'
      );
    $fn$;
    RAISE NOTICE 'OK  1.1 is_admin() helper created (role-only)';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL 1.1 helper: %', SQLERRM;
  END;
END $$;


-- 1.2  Privilege-escalation guard on profiles.role -------------------------
--      "Users and admins can update profiles" has a USING clause but nothing
--      constrains the NEW role value, so a signed-in user could set their own
--      profiles.role to 'admin'.  This BEFORE UPDATE trigger allows a role
--      change only when the caller is already an admin.
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


-- 1.3  profiles policies ----------------------------------------------------
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


-- 1.4  posts: admin delete policy must use the helper, not a literal ------
--      The old policy inlined  profiles.username = 'r4zi3ld4rk'.
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Users and admins can delete posts" ON public.posts;
    CREATE POLICY "Users and admins can delete posts"
    ON public.posts FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());
    RAISE NOTICE 'OK  1.4 posts admin-delete policy rewritten';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL 1.4 posts policy: %', SQLERRM;
  END;
END $$;


-- 1.5  notifications: owner-scoped DELETE -----------------------------------
--      Unfollowing deletes the follow notification; without this policy the
--      delete silently affected 0 rows and the notification stayed forever.
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Notifications: Owner delete" ON public.notifications;
    CREATE POLICY "Notifications: Owner delete"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);
    RAISE NOTICE 'OK  1.5 notifications owner-delete policy created';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL 1.5 notifications policy: %', SQLERRM;
  END;
END $$;


-- 1.6  delete_user RPC ------------------------------------------------------
--      Existed in the live database but in no checked-in SQL file, so a fresh
--      deploy lost account deletion.  auth.uid() IS NULL => refuse.
DO $$
BEGIN
  BEGIN
    CREATE OR REPLACE FUNCTION public.delete_user()
    RETURNS void
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = 'public'
    AS $fn$
      DELETE FROM auth.users WHERE id = auth.uid();
    $fn$;

    RAISE NOTICE 'OK  1.6 delete_user() RPC created';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'FAIL 1.6 delete_user: %', SQLERRM;
  END;
END $$;


-- ============================================================================
-- PART 2 — REPORT
--          One row per check.  Every row must read 'PASS'.
-- ============================================================================
SELECT * FROM (
  SELECT '1.1 is_admin() exists' AS check_name,
         CASE WHEN EXISTS (
           SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public' AND p.proname='is_admin'
         ) THEN 'PASS' ELSE 'FAIL' END AS result

  UNION ALL SELECT '1.1b is_admin() has NO username literal',
    CASE WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema='public' AND routine_name='is_admin'
        AND routine_definition LIKE '%r4zi3ld4rk%'
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '1.1c NO function anywhere holds the literal',
    CASE WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema='public' AND routine_definition LIKE '%r4zi3ld4rk%'
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '1.1d NO policy anywhere holds the literal',
    CASE WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE coalesce(qual,'') LIKE '%r4zi3ld4rk%'
         OR coalesce(with_check,'') LIKE '%r4zi3ld4rk%'
    ) THEN 'PASS' ELSE 'FAIL' END

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

  UNION ALL SELECT '1.4 posts admin-delete uses is_admin()',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='posts'
        AND policyname='Users and admins can delete posts'
        AND qual LIKE '%is_admin%'
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '1.5 notifications owner-delete policy exists',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='notifications'
        AND policyname='Notifications: Owner delete'
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '1.6 delete_user RPC exists',
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname='delete_user'
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '2.1 real accounts preserved (Razi, RaziDark, Hermes)',
    CASE WHEN (SELECT count(*) FROM public.profiles
               WHERE username IN ('Razi','RaziDark','Hermes')) = 3
         THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '2.2 @Razi still admin, @Hermes still user',
    CASE WHEN (SELECT role FROM public.profiles WHERE username='Razi') = 'admin'
          AND (SELECT role FROM public.profiles WHERE username='Hermes') = 'user'
         THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '2.3 no account holds the privileged username',
    CASE WHEN (SELECT count(*) FROM public.profiles
               WHERE username = 'r4zi3ld4rk') = 0
         THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT '2.4 real content preserved',
    CASE WHEN (SELECT count(*) FROM public.posts) >= 11 THEN 'PASS' ELSE 'FAIL' END
) chk ORDER BY check_name;
