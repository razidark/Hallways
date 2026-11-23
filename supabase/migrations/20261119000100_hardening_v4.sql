-- ============================================================================
-- Hallways — migration v4
-- Date: 2026-11-19
-- Purpose:
--   1. profiles.is_verified  — the column the client already reads in 6 files
--                             but which never existed in the database.
--   2. Maintain posts_count / followers_count with triggers (both columns
--      existed but were never kept in sync — every user read 0).
--   3. created_at on follows + likes (both tables lacked it; ordering by it
--      returned HTTP 400).
--   4. Restrict is_verified so only an admin can grant/revoke it.
--   5. Recompute the drifted counters from the actual rows.
--
-- Safety: every statement is idempotent. Re-running is a no-op.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. is_verified column
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN is_verified boolean NOT NULL DEFAULT false;
    RAISE NOTICE 'OK  1.1 profiles.is_verified added';
  ELSE
    RAISE NOTICE 'SKIP 1.1 profiles.is_verified already exists';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. created_at on follows + likes
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'follows' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.follows
      ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
    RAISE NOTICE 'OK  2.1 follows.created_at added';
  ELSE
    RAISE NOTICE 'SKIP 2.1 follows.created_at already exists';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'likes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.likes
      ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
    RAISE NOTICE 'OK  2.2 likes.created_at added';
  ELSE
    RAISE NOTICE 'SKIP 2.2 likes.created_at already exists';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Counter maintenance triggers
--    posts_count    = number of posts owned by the profile
--    followers_count= number of profiles following this profile
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_posts_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  target uuid;
BEGIN
  target := COALESCE(NEW.user_id, OLD.user_id);
  UPDATE public.profiles
     SET posts_count = (SELECT count(*) FROM public.posts WHERE user_id = target)
   WHERE id = target;
  RETURN COALESCE(NEW, OLD);
END;
$fn$;

DROP TRIGGER IF EXISTS trg_sync_posts_count ON public.posts;
CREATE TRIGGER trg_sync_posts_count
  AFTER INSERT OR UPDATE OF user_id OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.sync_posts_count();

CREATE OR REPLACE FUNCTION public.sync_followers_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  target uuid;
BEGIN
  target := COALESCE(NEW.following_id, OLD.following_id);
  UPDATE public.profiles
     SET followers_count = (SELECT count(*) FROM public.follows WHERE following_id = target)
   WHERE id = target;
  RETURN COALESCE(NEW, OLD);
END;
$fn$;

DROP TRIGGER IF EXISTS trg_sync_followers_count ON public.follows;
CREATE TRIGGER trg_sync_followers_count
  AFTER INSERT OR UPDATE OF following_id OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.sync_followers_count();

-- ---------------------------------------------------------------------------
-- 4. Only an admin may grant or revoke the verified badge.
--
--    IMPORTANT: this is enforced in the guard trigger, NOT in an RLS policy.
--    A `WITH CHECK` subquery on the same table observes the NEW row, so
--    `is_verified = (select is_verified from profiles where id = auth.uid())`
--    always compares the new value against itself and evaluates to true --
--    which let a normal user self-verify. The BEFORE UPDATE trigger sees
--    OLD.row and compares correctly.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  -- 1. role may only be changed by an admin
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only an administrator can change the profile role'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- 2. is_verified may only be changed by an admin
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only an administrator can change the verified status'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

-- Owner-edit policy stays simple: the trigger handles the field-level rules.
DROP POLICY IF EXISTS "Profiles: Owner edit" ON public.profiles;
CREATE POLICY "Profiles: Owner edit"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (role = 'user'::text OR role IS NULL OR public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- 5. Recompute the drifted counters from the actual rows.
-- ---------------------------------------------------------------------------
UPDATE public.profiles p
   SET posts_count = (
         SELECT count(*) FROM public.posts po WHERE po.user_id = p.id
       ),
       followers_count = (
         SELECT count(*) FROM public.follows f WHERE f.following_id = p.id
       );

-- ---------------------------------------------------------------------------
-- Report
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  chk text;
BEGIN
  RAISE NOTICE '---- v4 report ----';

  SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END INTO chk
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='profiles' AND column_name='is_verified';
  RAISE NOTICE '%  profiles.is_verified exists', chk;

  SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END INTO chk
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='follows' AND column_name='created_at';
  RAISE NOTICE '%  follows.created_at exists', chk;

  SELECT CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END INTO chk
    FROM information_schema.columns
   WHERE table_schema='public' AND table_name='likes' AND column_name='created_at';
  RAISE NOTICE '%  likes.created_at exists', chk;

  SELECT CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END INTO chk
    FROM pg_trigger WHERE tgname IN ('trg_sync_posts_count','trg_sync_followers_count');
  RAISE NOTICE '%  counter triggers installed', chk;

  SELECT CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END INTO chk
    FROM public.profiles WHERE posts_count <> (SELECT count(*) FROM public.posts po WHERE po.user_id = public.profiles.id);
  RAISE NOTICE '%  posts_count accurate for every profile', chk;

  SELECT CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END INTO chk
    FROM public.profiles WHERE followers_count <> (SELECT count(*) FROM public.follows f WHERE f.following_id = public.profiles.id);
  RAISE NOTICE '%  followers_count accurate for every profile', chk;

  SELECT CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END INTO chk
    FROM public.profiles WHERE role = 'admin' AND is_verified;
  RAISE NOTICE '%  no admin row auto-verified', chk;

  RAISE NOTICE '---- end v4 report ----';
END $$;
