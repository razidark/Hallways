-- ============================================================================
-- HALLWAYS - canonical schema
-- ============================================================================
-- Project ref : qdxpjvtxtnaxlqauznql
-- Postgres    : 17.6
-- Regenerated  : 2026-11-19 from the LIVE database (not hand-written).
--
-- WHY THIS FILE WAS REWRITTEN
-- --------------------------
-- The previous schema.sql described a database that does not exist. It
-- declared `profiles.created_at` (the live table has `updated_at`), and it
-- was missing `profiles.role`, `profiles.is_verified`, `posts_count`,
-- `followers_count`, `storage_used`, the `is_admin()` helper, the
-- `guard_profile_role` trigger, the counter triggers and every hardened
-- RLS policy.
--
-- Rebuilding from the old file produced a database WITHOUT the role guard --
-- i.e. it silently reinstated the admin-bypass vulnerability. This file is
-- the rebuild source of truth from now on.
-- The previous version is kept at: schema.sql.bak-2026-11-19
--
-- HOW TO USE
-- ----------
--   psql "$DATABASE_URL" -f schema.sql          # rebuild a fresh database
--   supabase db push --remote                   # apply migrations only
--
-- Migrations live in supabase/migrations/. Apply them in order after this
-- file if you are rebuilding from scratch.
--
-- Related migration files:
--   supabase_hardening_v3.sql   (role-only is_admin(), posts DELETE policy)
--   supabase/migrations/20261119000100_hardening_v4.sql
--     (is_verified column, counter triggers, follows/likes created_at)
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
create extension if not exists pgcrypto with schema public;
create extension if not exists "uuid-ossp" with schema public;

-- ============================================================================
-- TABLES
-- ============================================================================

create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text not null unique,
  full_name       text,
  avatar_url      text,
  banner_url      text,
  bio             text,
  status          text default 'Exploring the Hallway',
  status_title    text default '',
  profile_aura    text default 'none',
  border_style    text default 'normal',
  avatar_shape    text default 'hexagon',
  name_effect     text default 'none',
  bio_font        text default 'default',
  profile_accent  text default 'default',
  website         text,
  storage_used    bigint default 0,
  posts_count     integer default 0,
  followers_count integer default 0,
  updated_at      timestamptz default timezone('utc', now()),
  -- Authoritative privilege flag. NEVER derive admin from a username or
  -- email literal -- usernames are user-controlled at signup.
  role            text default 'user',
  -- Verified badge. Only an admin may change this (see guard_profile_role).
  is_verified     boolean not null default false
);

create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  image_url    text not null,
  caption      text,
  filter_class text default '',
  music        text default 'Original Audio',
  music_url    text,
  is_reel      boolean default false,
  is_pinned    boolean default false,
  repost_id    uuid references public.posts(id) on delete set null,
  created_at   timestamptz default timezone('utc', now())
);

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  media_url   text,
  media_type  text,
  created_at  timestamptz default timezone('utc', now())
);

create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.profiles(id) on delete cascade,
  actor_id   uuid references public.profiles(id) on delete cascade,
  type       text not null,
  target_id  uuid,
  is_read    boolean default false,
  created_at timestamptz default timezone('utc', now())
);

create table if not exists public.stories (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  media_url    text not null,
  media_type   text default 'image',
  caption      text default '',
  filter_class text default '',
  created_at   timestamptz default now(),
  expires_at   timestamptz default now() + interval '24 hours'
);

create table if not exists public.follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (follower_id, following_id)
);

create table if not exists public.likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.saves (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id    uuid references public.profiles(id) on delete cascade,
  post_id    uuid references public.posts(id) on delete cascade,
  unique (user_id, post_id)
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz default timezone('utc', now()),
  parent_id  uuid references public.comments(id) on delete cascade
);

create table if not exists public.story_views (
  id        uuid primary key default gen_random_uuid(),
  story_id  uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz default now(),
  unique (story_id, viewer_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index if not exists idx_posts_user_id    on public.posts(user_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_likes_post_id    on public.likes(post_id);
create index if not exists idx_likes_user_id    on public.likes(user_id);
create index if not exists idx_saves_user_id    on public.saves(user_id);
create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_follows_follower on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);
create index if not exists idx_messages_sender  on public.messages(sender_id);
create index if not exists idx_messages_receiver on public.messages(receiver_id);
create index if not exists idx_messages_conversation on public.messages(sender_id, receiver_id, created_at desc);
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);
create index if not exists idx_stories_user     on public.stories(user_id);
create index if not exists idx_stories_expires  on public.stories(expires_at);
create index if not exists idx_profiles_username on public.profiles(username);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- The ONLY source of admin truth. Role-based, never username-based.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$fn$;

-- Storage ownership check. posts/messages/stories use "<uid>/<file>",
-- avatars use "<uid>_<timestamp>_<name>".
create or replace function public.owner_or_self(p_bucket text, p_objname text)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select case
    when p_bucket in ('posts', 'messages', 'stories')
      then split_part(p_objname, '/', 1) = auth.uid()::text
    when p_bucket = 'avatars'
      then split_part(p_objname, '_', 1) = auth.uid()::text
    else false
  end;
$fn$;

-- Guards `role` and `is_verified` against self-service escalation.
--
-- IMPORTANT: this enforcement lives in the trigger, not in an RLS policy.
-- A `WITH CHECK` subquery on the same table observes the NEW row, so
-- `is_verified = (select is_verified from profiles where id = auth.uid())`
-- compares the new value against itself and always evaluates to true --
-- which allowed a normal user to self-verify. The BEFORE UPDATE trigger
-- sees OLD.row and compares correctly.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.role is distinct from old.role then
    if not public.is_admin() then
      raise exception 'Only an administrator can change the profile role'
        using errcode = '42501';
    end if;
  end if;

  if new.is_verified is distinct from old.is_verified then
    if not public.is_admin() then
      raise exception 'Only an administrator can change the verified status'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$fn$;

-- Auto-create a profile for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'explorer_' || substring(new.id::text, 1, 5)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$fn$;

-- Self-service account deletion.
create or replace function public.delete_user()
returns void
language sql
security definer
set search_path = 'public'
as $fn$
  delete from auth.users where id = auth.uid();
$fn$;

-- Keeps profiles.posts_count accurate.
create or replace function public.sync_posts_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  target uuid;
begin
  target := coalesce(new.user_id, old.user_id);
  update public.profiles
     set posts_count = (select count(*) from public.posts where user_id = target)
   where id = target;
  return coalesce(new, old);
end;
$fn$;

-- Keeps profiles.followers_count accurate.
create or replace function public.sync_followers_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  target uuid;
begin
  target := coalesce(new.following_id, old.following_id);
  update public.profiles
     set followers_count = (select count(*) from public.follows where following_id = target)
   where id = target;
  return coalesce(new, old);
end;
$fn$;

-- Auto-enable RLS on any table created in the public schema.
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  cmd record;
begin
  for cmd in
    select *
    from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table','partitioned table')
  loop
    if cmd.schema_name is not null and cmd.schema_name in ('public')
       and cmd.schema_name not in ('pg_catalog','information_schema')
       and cmd.schema_name not like 'pg_toast%'
       and cmd.schema_name not like 'pg_temp%' then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception when others then
        raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    end if;
  end loop;
end;
$fn$;

-- Fires on ddl_command_end (matches the live 'ensure_rls' event trigger).
-- A 'ddl_command' trigger with a WHEN TAG filter is rejected by Postgres:
-- the WHEN clause on an event trigger only supports WHEN TAG IN (...),
-- which is what the live trigger uses internally via the function.
drop event trigger if exists ensure_rls;
create event trigger ensure_rls
  on ddl_command_end
  execute procedure public.rls_auto_enable();

-- ============================================================================
-- TRIGGERS
-- ============================================================================

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

drop trigger if exists trg_sync_posts_count on public.posts;
create trigger trg_sync_posts_count
  after insert or delete or update of user_id on public.posts
  for each row execute function public.sync_posts_count();

drop trigger if exists trg_sync_followers_count on public.follows;
create trigger trg_sync_followers_count
  after insert or delete or update of following_id on public.follows
  for each row execute function public.sync_followers_count();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles     enable row level security;
alter table public.posts        enable row level security;
alter table public.messages     enable row level security;
alter table public.notifications enable row level security;
alter table public.stories      enable row level security;
alter table public.follows      enable row level security;
alter table public.likes        enable row level security;
alter table public.saves        enable row level security;
alter table public.comments     enable row level security;
alter table public.story_views  enable row level security;

-- ---- profiles -----------------------------------------------------------
drop policy if exists "Profiles: Public view" on public.profiles;
create policy "Profiles: Public view" on public.profiles
  for select to public using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert to public
  with check ((auth.uid() = id) and ((role = 'user') or (role is null)));

-- Owner may edit their own profile, but may not grant themselves admin.
drop policy if exists "Profiles: Owner edit" on public.profiles;
create policy "Profiles: Owner edit" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check ((auth.uid() = id) and ((role = 'user') or (role is null) or public.is_admin()));

-- Admins may edit any profile (including role and is_verified).
drop policy if exists "Users and admins can update profiles" on public.profiles;
create policy "Users and admins can update profiles" on public.profiles
  for update to public
  using ((auth.uid() = id) or public.is_admin())
  with check (public.is_admin() or (role = 'user') or (role is null));

-- ---- posts --------------------------------------------------------------
drop policy if exists "Posts: Public view" on public.posts;
create policy "Posts: Public view" on public.posts
  for select to public using (true);

drop policy if exists "Posts: Owner manage" on public.posts;
create policy "Posts: Owner manage" on public.posts
  for all to public using (auth.uid() = user_id);

-- Admin delete delegates to is_admin() -- never inline a username literal.
drop policy if exists "Users and admins can delete posts" on public.posts;
create policy "Users and admins can delete posts" on public.posts
  for delete to public
  using ((auth.uid() = user_id) or public.is_admin());

-- ---- messages -----------------------------------------------------------
drop policy if exists "Messages: Private view" on public.messages;
create policy "Messages: Private view" on public.messages
  for select to public
  using ((auth.uid() = sender_id) or (auth.uid() = receiver_id));

drop policy if exists "Users can view their own conversations" on public.messages;
create policy "Users can view their own conversations" on public.messages
  for select to authenticated
  using ((auth.uid() = sender_id) or (auth.uid() = receiver_id));

drop policy if exists "Sender insert" on public.messages;
create policy "Sender insert" on public.messages
  for insert to public with check (auth.uid() = sender_id);

drop policy if exists "Users can send messages" on public.messages;
create policy "Users can send messages" on public.messages
  for insert to authenticated with check (auth.uid() = sender_id);

-- ---- notifications ------------------------------------------------------
drop policy if exists "Notifications: Owner view" on public.notifications;
create policy "Notifications: Owner view" on public.notifications
  for select to public using (auth.uid() = user_id);

drop policy if exists "Notifications: Owner delete" on public.notifications;
create policy "Notifications: Owner delete" on public.notifications
  for delete to public using (auth.uid() = user_id);

drop policy if exists "Enable insert for authenticated users" on public.notifications;
create policy "Enable insert for authenticated users" on public.notifications
  for insert to public with check (auth.role() = 'authenticated');

-- ---- stories ------------------------------------------------------------
drop policy if exists "Users can create stories" on public.stories;
create policy "Users can create stories" on public.stories
  for insert to public with check (auth.uid() = user_id);

drop policy if exists "Users can create their own stories" on public.stories;
create policy "Users can create their own stories" on public.stories
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can delete own stories" on public.stories;
create policy "Users can delete own stories" on public.stories
  for delete to public using (auth.uid() = user_id);

drop policy if exists "Users can delete their own stories" on public.stories;
create policy "Users can delete their own stories" on public.stories
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Anyone can view active stories" on public.stories;
create policy "Anyone can view active stories" on public.stories
  for select to public
  using ((auth.role() = 'authenticated') and (expires_at > now()));

drop policy if exists "Stories are viewable by authenticated users" on public.stories;
create policy "Stories are viewable by authenticated users" on public.stories
  for select to authenticated using (true);

-- ---- follows / likes / saves / comments ---------------------------------
drop policy if exists "Follows: Public view" on public.follows;
create policy "Follows: Public view" on public.follows
  for select to public using (true);

drop policy if exists "Follows: Owner manage" on public.follows;
create policy "Follows: Owner manage" on public.follows
  for all to public using (auth.uid() = follower_id);

drop policy if exists "Likes: Public view" on public.likes;
create policy "Likes: Public view" on public.likes
  for select to public using (true);

drop policy if exists "Likes: Owner manage" on public.likes;
create policy "Likes: Owner manage" on public.likes
  for all to public using (auth.uid() = user_id);

drop policy if exists "Saves: Private view" on public.saves;
create policy "Saves: Private view" on public.saves
  for select to public using (auth.uid() = user_id);

drop policy if exists "Saves: Owner manage" on public.saves;
create policy "Saves: Owner manage" on public.saves
  for all to public using (auth.uid() = user_id);

drop policy if exists "Comments: Public view" on public.comments;
create policy "Comments: Public view" on public.comments
  for select to public using (true);

drop policy if exists "Comments: Owner manage" on public.comments;
create policy "Comments: Owner manage" on public.comments
  for all to public using (auth.uid() = user_id);

-- ---- story_views --------------------------------------------------------
drop policy if exists "Anyone can read views" on public.story_views;
create policy "Anyone can read views" on public.story_views
  for select to authenticated using (true);

drop policy if exists "Anyone can view story_views" on public.story_views;
create policy "Anyone can view story_views" on public.story_views
  for select to public using (auth.role() = 'authenticated');

drop policy if exists "Users can insert own views" on public.story_views;
create policy "Users can insert own views" on public.story_views
  for insert to authenticated with check (auth.uid() = viewer_id);

drop policy if exists "Users can mark stories viewed" on public.story_views;
create policy "Users can mark stories viewed" on public.story_views
  for insert to public with check (auth.uid() = viewer_id);

-- ============================================================================
-- STORAGE
-- ============================================================================
insert into storage.buckets (id, name, public)
values
  ('posts',    'posts',    true),
  ('messages', 'messages', true),
  ('avatars',  'avatars',  true),
  ('stories',  'stories',  true)
on conflict (id) do nothing;

-- Public read + owner-scoped write/delete for every media bucket.
do $$
declare
  b text;
  bucket_literal text;
begin
  foreach b in array array['posts','messages','avatars','stories'] loop
    -- Quote the bucket name as a SQL literal for use inside the policy body.
    bucket_literal := quote_literal(b);

    execute format('drop policy if exists %I on storage.objects', b || ' media is publicly readable');
    execute format('create policy %I on storage.objects
                   for select to public using (bucket_id = %s)', b || ' media is publicly readable', bucket_literal);

    execute format('drop policy if exists %I on storage.objects', 'Users can upload own ' || b);
    execute format('create policy %I on storage.objects
                   for insert to public
                   with check ((bucket_id = %s) and public.owner_or_self(bucket_id, name))',
                   'Users can upload own ' || b, bucket_literal);

    execute format('drop policy if exists %I on storage.objects', 'Users can update own ' || b);
    execute format('create policy %I on storage.objects
                   for update to public
                   using ((bucket_id = %s) and public.owner_or_self(bucket_id, name))
                   with check ((bucket_id = %s) and public.owner_or_self(bucket_id, name))',
                   'Users can update own ' || b, bucket_literal, bucket_literal);

    execute format('drop policy if exists %I on storage.objects', 'Users can delete own ' || b);
    execute format('create policy %I on storage.objects
                   for delete to public
                   using ((bucket_id = %s) and public.owner_or_self(bucket_id, name))',
                   'Users can delete own ' || b, bucket_literal);
  end loop;
end $$;

-- ============================================================================
-- MAINTENANCE
-- ============================================================================
-- Expired stories can be cleaned up periodically (pg_cron or an Edge
-- Function). Note: the media object must be removed from the storage
-- bucket too, otherwise the file is orphaned.
--
--   DELETE FROM public.stories WHERE expires_at < now();

-- ============================================================================
-- END
-- ============================================================================
