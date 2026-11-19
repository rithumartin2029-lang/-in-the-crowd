-- ============================================================================
-- In the Crowd — Supabase schema + Row Level Security
-- ============================================================================
-- HOW TO USE:
--   1. Create a free project at https://supabase.com
--   2. Open the SQL Editor (left sidebar → SQL Editor → New query)
--   3. Paste this entire file and click Run
--   4. Take your Project URL and anon public key from
--      Settings → API → "Project URL" and "anon public"
--   5. Add them as env vars on Vercel (or in .env locally):
--        NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
--        NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
--   6. Redeploy / restart — the site automatically switches from local-only
--      mode to live multi-user mode.
--
-- This schema creates every table the app needs, plus a `profiles` table that
-- extends Supabase's built-in `auth.users`, plus Row Level Security policies
-- so each user can only see / edit what they're supposed to.
-- ============================================================================

-- Extensions
create extension if not exists "pgcrypto";  -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- PROFILES  (1 row per auth.users, holds app-specific fields)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null,
  bio             text default '',
  avatar_seed     int default 0,
  fav_artists     text[] default '{}',
  fav_songs       text[] default '{}',
  buddy_mode      boolean default false,
  pledge_accepted_at timestamptz,
  role            text default 'user' check (role in ('user','admin')),
  created_at      timestamptz default now()
);

-- Auto-create a profile row whenever a new auth.users row is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, pledge_accepted_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- CONCERTS  (the "spaces" people start)
-- ----------------------------------------------------------------------------
create table if not exists public.concerts (
  id                  uuid primary key default gen_random_uuid(),
  artist              text not null,
  tour                text not null,
  date                timestamptz,           -- null = unscheduled
  venue               text default '',
  city                text default '',
  notes               text default '',
  cover_index         int default 1,
  unverified          boolean default true,  -- user-added = "Added by a fan"
  past                boolean default false,
  library_count       jsonb default '{"photos":0,"videos":0,"songWise":0}'::jsonb,
  visibility          text default 'public' check (visibility in ('public','connections','private')),
  created_by          uuid references public.profiles(id) on delete set null,
  created_by_username text,
  created_at          timestamptz default now()
);

create index if not exists concerts_created_by_idx on public.concerts(created_by);
create index if not exists concerts_artist_idx on public.concerts(artist);
create index if not exists concerts_past_idx on public.concerts(past);

-- ----------------------------------------------------------------------------
-- ARTISTS  (auto-created when a concert uses a new artist name)
-- ----------------------------------------------------------------------------
create table if not exists public.artists (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  genre       text default '',
  cover_index int default 1,
  members     int default 1,
  created_at  timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- MEMORIES  (photo/video uploads tied to a concert)
-- ----------------------------------------------------------------------------
create table if not exists public.memories (
  id                uuid primary key default gen_random_uuid(),
  concert_id        uuid references public.concerts(id) on delete cascade,
  user_id           uuid references public.profiles(id) on delete cascade,
  username          text,
  type              text check (type in ('photo','video')),
  url               text default '',         -- Supabase Storage public URL
  storage_path      text default '',         -- bucket path for cleanup
  caption           text default '',
  song_name         text,
  category          text default 'photos',
  visibility        text default 'public' check (visibility in ('public','connections','private')),
  contains_spoilers boolean default false,
  approved          boolean default false,
  created_at        timestamptz default now()
);

create index if not exists memories_concert_id_idx on public.memories(concert_id);
create index if not exists memories_user_id_idx on public.memories(user_id);

-- ----------------------------------------------------------------------------
-- FOMO POSTS + COMMENTS
-- ----------------------------------------------------------------------------
create table if not exists public.fomo_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  username    text,
  body        text not null,
  concert_id  uuid references public.concerts(id) on delete set null,
  artist_id   uuid references public.artists(id) on delete set null,
  reactions   jsonb default '{"heart":0,"relatable":0,"cry":0}'::jsonb,
  created_at  timestamptz default now()
);

create table if not exists public.fomo_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references public.fomo_posts(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  username    text,
  body        text not null,
  created_at  timestamptz default now()
);

create index if not exists fomo_comments_post_id_idx on public.fomo_comments(post_id);

-- ----------------------------------------------------------------------------
-- TOGETHER MESSAGES  (text chat per concert room)
-- ----------------------------------------------------------------------------
create table if not exists public.together_messages (
  id          uuid primary key default gen_random_uuid(),
  concert_id  uuid references public.concerts(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  username    text,
  text        text not null,
  type        text default 'chat' check (type in ('chat','song-update','pulse')),
  created_at  timestamptz default now()
);

create index if not exists together_messages_concert_id_idx on public.together_messages(concert_id);
create index if not exists together_messages_created_at_idx on public.together_messages(created_at);

-- Enable realtime for together_messages so chat is live across users
-- (Supabase needs explicit realtime publication membership)
alter publication supabase_realtime add table public.together_messages;
alter publication supabase_realtime add table public.concerts;
alter publication supabase_realtime add table public.memories;
alter publication supabase_realtime add table public.fomo_posts;
alter publication supabase_realtime add table public.notifications;

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS  (per-user inbox)
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade,
  type         text default 'system',
  title        text,
  body         text,
  read         boolean default false,
  spoiler_safe boolean default true,
  created_at   timestamptz default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);

-- ----------------------------------------------------------------------------
-- PERSONAL TABLES  (only the owner can read/write)
-- ----------------------------------------------------------------------------
create table if not exists public.bucket_list (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  artist      text, concert text, tour text,
  date        timestamptz, venue text, city text, notes text,
  attended    boolean default false,
  created_at  timestamptz default now()
);

create table if not exists public.countdowns (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  artist      text, concert text,
  date        timestamptz not null,
  venue       text, city text, notes text,
  image_url   text,
  variant     text default 'minimal',
  shared_with uuid[] not null default '{}',
  created_at  timestamptz default now()
);
alter table public.countdowns add column if not exists shared_with uuid[] not null default '{}';

create table if not exists public.diary (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  title       text, body text,
  date        timestamptz default now(),
  image_urls  text[] default '{}'
);

create table if not exists public.dream_setlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  artist      text,
  opening     text,
  favorites   text[] default '{}',
  special     text,
  closing     text,
  moment      text
);

create table if not exists public.someday_concerts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  artist      text, concert text,
  fulfilled   boolean default false
);

create table if not exists public.song_made_night (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  song        text, why text
);

create table if not exists public.fund_contributions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  amount      int default 0,
  label       text,
  date        timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- CONNECTIONS  (FOMO matches + concert buddies)
-- ----------------------------------------------------------------------------
create table if not exists public.connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid references public.profiles(id) on delete cascade,
  target_id     uuid references public.profiles(id) on delete cascade,
  kind          text check (kind in ('fomo','buddy')),
  label         text,
  status        text default 'pending' check (status in ('pending','accepted','declined')),
  created_at    timestamptz default now(),
  unique (requester_id, target_id, kind)
);

-- ----------------------------------------------------------------------------
-- REPORTS
-- ----------------------------------------------------------------------------
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid references public.profiles(id) on delete set null,
  target_type   text,
  target_id     text,
  reason        text,
  status        text default 'pending' check (status in ('pending','reviewing','resolved')),
  created_at    timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- USER SETTINGS + WELLBEING (spoiler shields, gentle mode, etc.)
-- ----------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id              uuid primary key references public.profiles(id) on delete cascade,
  profile_visible      boolean default true,
  show_attended        boolean default true,
  show_bucket_list     boolean default true,
  show_memories        boolean default true,
  email_notifications  boolean default true,
  push_notifications   boolean default false,
  quiet_hours_start    text default '22:00',
  quiet_hours_end      text default '07:00',
  custom_mute_list     text[] default '{}',
  theme                text default 'dark',
  gentle_mode          boolean default false,
  gentle_until         timestamptz,
  spoiler_shields      uuid[] default '{}',
  gentle_muted_artists text[] default '{}'
);

-- Auto-create default settings when a profile is created
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();

-- ----------------------------------------------------------------------------
-- STORAGE BUCKET for memory uploads
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)
on conflict (id) do nothing;
update storage.buckets set public = false where id = 'memories';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Principle: "Privacy by default. Sharing by choice. Connection without
-- pressure." (from the spec). Public data is visible to everyone; private
-- data is visible only to the owner; admin role can see everything.
-- ============================================================================

alter table public.profiles              enable row level security;
alter table public.concerts              enable row level security;
alter table public.artists               enable row level security;
alter table public.memories              enable row level security;
alter table public.fomo_posts            enable row level security;
alter table public.fomo_comments         enable row level security;
alter table public.together_messages     enable row level security;
alter table public.notifications         enable row level security;
alter table public.bucket_list           enable row level security;
alter table public.countdowns            enable row level security;
alter table public.diary                 enable row level security;
alter table public.dream_setlists        enable row level security;
alter table public.someday_concerts      enable row level security;
alter table public.song_made_night       enable row level security;
alter table public.fund_contributions    enable row level security;
alter table public.connections           enable row level security;
alter table public.reports               enable row level security;
alter table public.user_settings         enable row level security;

-- Helper: is the current user an admin?
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
grant execute on function private.is_admin() to anon, authenticated;

-- Do not allow users to grant themselves admin or approve their own uploads.
create or replace function public.guard_profile_role_change()
returns trigger language plpgsql set search_path = public, private
as $$
begin
  if new.role is distinct from old.role
     and current_user not in ('postgres','supabase_admin')
     and not private.is_admin() then
    raise exception 'Only an administrator can change profile roles';
  end if;
  return new;
end;
$$;
create trigger guard_profile_role before update on public.profiles
for each row execute function public.guard_profile_role_change();

create or replace function public.guard_memory_approval_change()
returns trigger language plpgsql set search_path = public, private
as $$
begin
  if new.approved is distinct from old.approved
     and current_user not in ('postgres','supabase_admin')
     and not private.is_admin() then
    raise exception 'Only an administrator can approve memories';
  end if;
  return new;
end;
$$;
create trigger guard_memory_approval before update on public.memories
for each row execute function public.guard_memory_approval_change();

-- ----------------------------------------------------------------------------
-- PROFILES policies
-- ----------------------------------------------------------------------------
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users update their own profile"
  on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users delete their own profile"
  on public.profiles for delete using (auth.uid() = id);

-- First registered user becomes admin (set role)
create or replace function public.maybe_promote_first_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (select count(*) from public.profiles) = 1 then
    update public.profiles set role = 'admin' where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_first_profile on public.profiles;
create trigger on_first_profile
  after insert on public.profiles
  for each row execute function public.maybe_promote_first_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_new_profile() from public, anon, authenticated;
revoke all on function public.maybe_promote_first_user() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- CONCERTS policies
-- ----------------------------------------------------------------------------
create policy "Public concerts visible to everyone"
  on public.concerts for select
  using (visibility = 'public' or created_by = auth.uid() or private.is_admin());

create policy "Signed-in users can create concerts"
  on public.concerts for insert
  with check (auth.uid() is not null and created_by = auth.uid());

create policy "Creators (or admins) can update their concerts"
  on public.concerts for update
  using (created_by = auth.uid() or private.is_admin())
  with check (created_by = auth.uid() or private.is_admin());

create policy "Creators (or admins) can delete their concerts"
  on public.concerts for delete
  using (created_by = auth.uid() or private.is_admin());

-- ----------------------------------------------------------------------------
-- ARTISTS policies
-- ----------------------------------------------------------------------------
create policy "Artists visible to everyone"
  on public.artists for select using (true);

create policy "Signed-in users can create artists"
  on public.artists for insert
  with check (auth.uid() is not null);

-- ----------------------------------------------------------------------------
-- MEMORIES policies
-- ----------------------------------------------------------------------------
create policy "Approved public and connection memories visible to authorized users"
  on public.memories for select
  using (
    (visibility = 'public' and approved = true)
    or user_id = auth.uid()
    or private.is_admin()
    or (
      visibility = 'connections' and approved = true and exists (
        select 1 from public.connections c
        where c.kind = 'buddy' and c.status = 'accepted'
          and ((c.requester_id = auth.uid() and c.target_id = memories.user_id)
            or (c.target_id = auth.uid() and c.requester_id = memories.user_id))
      )
    )
  );

create policy "Signed-in users can create memories"
  on public.memories for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "Owners can update their memories"
  on public.memories for update
  using (user_id = auth.uid() or private.is_admin())
  with check (user_id = auth.uid() or private.is_admin());

create policy "Owners can delete their memories"
  on public.memories for delete
  using (user_id = auth.uid() or private.is_admin());

-- ----------------------------------------------------------------------------
-- FOMO POSTS + COMMENTS policies
-- ----------------------------------------------------------------------------
create policy "FOMO posts visible to everyone"
  on public.fomo_posts for select using (true);

create policy "Signed-in users can post FOMO"
  on public.fomo_posts for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "Owners can update/delete their FOMO posts"
  on public.fomo_posts for update
  using (user_id = auth.uid() or private.is_admin())
  with check (user_id = auth.uid() or private.is_admin());
create policy "Owners can delete their FOMO posts"
  on public.fomo_posts for delete using (user_id = auth.uid() or private.is_admin());

create policy "FOMO comments visible to everyone"
  on public.fomo_comments for select using (true);

create policy "Signed-in users can comment"
  on public.fomo_comments for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "Owners can delete their comments"
  on public.fomo_comments for delete using (user_id = auth.uid() or private.is_admin());

-- ----------------------------------------------------------------------------
-- TOGETHER MESSAGES policies
-- ----------------------------------------------------------------------------
create policy "Together messages visible to everyone"
  on public.together_messages for select using (true);

create policy "Signed-in users can send messages"
  on public.together_messages for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "Owners can delete their messages"
  on public.together_messages for delete using (user_id = auth.uid() or private.is_admin());

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS policies  (only the recipient can see their notifications)
-- ----------------------------------------------------------------------------
create policy "Users see their own notifications"
  on public.notifications for select using (user_id = auth.uid());

create policy "Users insert their own notifications"
  on public.notifications for insert with check (user_id = auth.uid());

create policy "Users update their own notifications"
  on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users delete their own notifications"
  on public.notifications for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- PERSONAL TABLES  (bucket list, countdowns, diary, etc.)
-- ----------------------------------------------------------------------------
create policy "Bucket list: owner only"
  on public.bucket_list for all using (user_id = auth.uid());

create policy "Countdowns: owner only"
  on public.countdowns for all using (user_id = auth.uid());

create policy "Countdowns shared with me"
  on public.countdowns for select to authenticated
  using ((select auth.uid()) = any(shared_with));

create policy "Diary: owner only"
  on public.diary for all using (user_id = auth.uid());

create policy "Dream setlists: owner only"
  on public.dream_setlists for all using (user_id = auth.uid());

create policy "Someday concerts: owner only"
  on public.someday_concerts for all using (user_id = auth.uid());

create policy "Song made night: owner only"
  on public.song_made_night for all using (user_id = auth.uid());

create policy "Fund contributions: owner only"
  on public.fund_contributions for all using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- CONNECTIONS policies
-- ----------------------------------------------------------------------------
create policy "Users see connections they're part of"
  on public.connections for select
  using (requester_id = auth.uid() or target_id = auth.uid());

create policy "Signed-in users can request connections"
  on public.connections for insert
  with check (auth.uid() is not null and requester_id = auth.uid());

create policy "Addressees can accept or decline pending connections"
  on public.connections for update
  using (target_id = auth.uid() and status = 'pending')
  with check (target_id = auth.uid() and status in ('accepted','declined'));

create policy "Users can delete connections they're part of"
  on public.connections for delete
  using (requester_id = auth.uid() or target_id = auth.uid());

-- Keep connection endpoints immutable after a request is created.
create or replace function public.guard_connection_identity()
returns trigger language plpgsql set search_path = public
as $$
begin
  if new.requester_id is distinct from old.requester_id
     or new.target_id is distinct from old.target_id
     or new.kind is distinct from old.kind then
    raise exception 'Connection participants and type cannot be changed';
  end if;
  return new;
end;
$$;
create trigger guard_connection_identity
  before update on public.connections
  for each row execute function public.guard_connection_identity();

-- ----------------------------------------------------------------------------
-- REPORTS policies
-- ----------------------------------------------------------------------------
create policy "Users see their own reports; admins see all"
  on public.reports for select
  using (reporter_id = auth.uid() or private.is_admin());

create policy "Signed-in users can file their own reports"
  on public.reports for insert
  with check (auth.uid() is not null and reporter_id = auth.uid());

create policy "Admins can update reports"
  on public.reports for update
  using (private.is_admin()) with check (private.is_admin());

-- ----------------------------------------------------------------------------
-- USER SETTINGS policies  (only owner)
-- ----------------------------------------------------------------------------
create policy "Settings: owner only"
  on public.user_settings for all using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- STORAGE policies  (memories bucket)
-- ----------------------------------------------------------------------------
-- Private bucket: owners can read their own files; other users can read only
-- approved public memories or approved memories shared with accepted buddies.
create policy "Memory files readable by owner or approved audience"
  on storage.objects for select
  using (
    bucket_id = 'memories'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.memories m
        where m.storage_path = objects.name and m.approved = true
          and (
            m.visibility = 'public'
            or (m.visibility = 'connections' and exists (
              select 1 from public.connections c
              where c.kind = 'buddy' and c.status = 'accepted'
                and ((c.requester_id = auth.uid() and c.target_id = m.user_id)
                  or (c.target_id = auth.uid() and c.requester_id = m.user_id))
            ))
          )
      )
      or exists (
        select 1 from public.countdowns cd
        where cd.image_url = objects.name
          and (select auth.uid()) = any(cd.shared_with)
      )
    )
  );

-- Signed-in users can upload to a path under their own user id.
create policy "Auth users upload to memories bucket"
  on storage.objects for insert
  with check (
    bucket_id = 'memories'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners update their own uploads"
  on storage.objects for update
  using (bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owners delete their own uploads"
  on storage.objects for delete
  using (
    bucket_id = 'memories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Admins can delete memory uploads"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'memories' and private.is_admin());

-- ============================================================================
-- DONE. The schema is ready. After running this in Supabase SQL editor,
-- add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
-- env vars (Settings → API in Supabase) and the app will go live.
-- ============================================================================
