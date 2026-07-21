-- WatchNote database schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.titles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('movie', 'series', 'anime')),
  status text not null default 'plan_to_watch'
    check (status in ('plan_to_watch', 'watching', 'completed', 'dropped')),
  poster_url text,
  overview text,
  notes text,
  rating smallint check (rating between 1 and 10),
  external_source text check (external_source in ('tmdb', 'jikan', 'anilist')),
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe to re-run on an already-created database (adds new columns introduced later):
alter table public.titles add column if not exists overview text;
alter table public.titles add column if not exists external_source text;
alter table public.titles add column if not exists external_id text;
alter table public.titles drop constraint if exists titles_external_source_check;
alter table public.titles
  add constraint titles_external_source_check
  check (external_source in ('tmdb', 'jikan', 'anilist'));

create index if not exists titles_user_id_idx on public.titles (user_id);
drop index if exists titles_user_external_unique_idx;
create unique index if not exists titles_user_external_type_unique_idx
  on public.titles (user_id, external_source, external_id, type)
  where external_id is not null;

create table if not exists public.episodes (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references public.titles (id) on delete cascade,
  season_number int not null default 1,
  episode_number int not null,
  name text,
  watched boolean not null default false,
  watched_at timestamptz,
  created_at timestamptz not null default now(),
  unique (title_id, season_number, episode_number)
);

create index if not exists episodes_title_id_idx on public.episodes (title_id);

-- ============================================================
-- updated_at trigger for titles
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists titles_set_updated_at on public.titles;
create trigger titles_set_updated_at
  before update on public.titles
  for each row
  execute function public.set_updated_at();

-- keep watched_at in sync with watched flag
create or replace function public.set_watched_at()
returns trigger
language plpgsql
as $$
begin
  if new.watched and not old.watched then
    new.watched_at = now();
  elsif not new.watched then
    new.watched_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists episodes_set_watched_at on public.episodes;
create trigger episodes_set_watched_at
  before update on public.episodes
  for each row
  execute function public.set_watched_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.titles enable row level security;
alter table public.episodes enable row level security;

drop policy if exists "Titles are viewable by owner" on public.titles;
create policy "Titles are viewable by owner"
  on public.titles for select
  using (auth.uid() = user_id);

drop policy if exists "Titles are insertable by owner" on public.titles;
create policy "Titles are insertable by owner"
  on public.titles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Titles are updatable by owner" on public.titles;
create policy "Titles are updatable by owner"
  on public.titles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Titles are deletable by owner" on public.titles;
create policy "Titles are deletable by owner"
  on public.titles for delete
  using (auth.uid() = user_id);

drop policy if exists "Episodes are viewable by owner" on public.episodes;
create policy "Episodes are viewable by owner"
  on public.episodes for select
  using (exists (
    select 1 from public.titles t
    where t.id = episodes.title_id and t.user_id = auth.uid()
  ));

drop policy if exists "Episodes are insertable by owner" on public.episodes;
create policy "Episodes are insertable by owner"
  on public.episodes for insert
  with check (exists (
    select 1 from public.titles t
    where t.id = episodes.title_id and t.user_id = auth.uid()
  ));

drop policy if exists "Episodes are updatable by owner" on public.episodes;
create policy "Episodes are updatable by owner"
  on public.episodes for update
  using (exists (
    select 1 from public.titles t
    where t.id = episodes.title_id and t.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.titles t
    where t.id = episodes.title_id and t.user_id = auth.uid()
  ));

drop policy if exists "Episodes are deletable by owner" on public.episodes;
create policy "Episodes are deletable by owner"
  on public.episodes for delete
  using (exists (
    select 1 from public.titles t
    where t.id = episodes.title_id and t.user_id = auth.uid()
  ));

-- ============================================================
-- Feature requests (self-service user feedback, rate-limited)
-- ============================================================

create table if not exists public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending'
    check (status in ('pending', 'in_review', 'done', 'rejected', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe to re-run: widen the status check to include 'deleted' (admin soft-delete)
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'feature_requests_status_check'
  ) then
    alter table public.feature_requests drop constraint feature_requests_status_check;
  end if;
  alter table public.feature_requests
    add constraint feature_requests_status_check
    check (status in ('pending', 'in_review', 'done', 'rejected', 'deleted'));
end $$;

create index if not exists feature_requests_user_id_idx on public.feature_requests (user_id);

drop trigger if exists feature_requests_set_updated_at on public.feature_requests;
create trigger feature_requests_set_updated_at
  before update on public.feature_requests
  for each row
  execute function public.set_updated_at();

create or replace function public.enforce_feature_request_limit()
returns trigger
language plpgsql
as $$
declare
  today_count int;
begin
  select count(*) into today_count
  from public.feature_requests
  where user_id = new.user_id
    and created_at >= date_trunc('day', now());

  if today_count >= 3 then
    raise exception 'Hai raggiunto il limite di 3 richieste al giorno. Riprova domani.';
  end if;

  return new;
end;
$$;

drop trigger if exists feature_requests_rate_limit on public.feature_requests;
create trigger feature_requests_rate_limit
  before insert on public.feature_requests
  for each row
  execute function public.enforce_feature_request_limit();

alter table public.feature_requests enable row level security;

drop policy if exists "Feature requests are viewable by owner" on public.feature_requests;
create policy "Feature requests are viewable by owner"
  on public.feature_requests for select
  using (auth.uid() = user_id);

drop policy if exists "Feature requests are insertable by owner" on public.feature_requests;
create policy "Feature requests are insertable by owner"
  on public.feature_requests for insert
  with check (auth.uid() = user_id);

-- admin policies for feature_requests (select/update) are created further down,
-- after public.is_admin() is defined in the profiles section

-- ============================================================
-- Profiles (nickname, bio, avatar) + avatar storage
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text,
  bio text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe to re-run on an already-created database:
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- nicknames must be unique (case-insensitive)
create unique index if not exists profiles_nickname_unique_idx
  on public.profiles (lower(nickname))
  where nickname is not null;

-- ============================================================
-- Friend code on profiles
-- defined early: every later statement that creates/backfills a profiles row
-- (the new-signup trigger, the legacy backfill insert) needs to be able to call
-- generate_friend_code() and satisfy the not-null constraint below.
-- ============================================================

alter table public.profiles add column if not exists friend_code text;

create or replace function public.generate_friend_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := lpad(floor(random() * 1000000)::text, 6, '0');
    exit when not exists (select 1 from public.profiles where friend_code = candidate);
  end loop;
  return candidate;
end;
$$;

update public.profiles set friend_code = public.generate_friend_code() where friend_code is null;
alter table public.profiles alter column friend_code set not null;
create unique index if not exists profiles_friend_code_unique_idx on public.profiles (friend_code);

-- lets authenticated users find others by nickname (partial) or friend_code (exact),
-- without widening the profiles SELECT policy
create or replace function public.search_profiles(p_query text)
returns table (id uuid, nickname text, avatar_url text, friend_code text)
language sql
security definer set search_path = public
stable
as $$
  select p.id, p.nickname, p.avatar_url, p.friend_code
  from public.profiles p
  where p.id <> auth.uid()
    and (
      p.nickname ilike '%' || p_query || '%'
      or p.friend_code = regexp_replace(p_query, '[^0-9]', '', 'g')
    )
  order by p.nickname
  limit 20
$$;

grant execute on function public.search_profiles(text) to authenticated;

-- security definer helper so RLS policies can check admin status without recursing
create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = p_user_id), false);
$$;

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Profiles are viewable by admins" on public.profiles;
create policy "Profiles are viewable by admins"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Feature requests are viewable by admins" on public.feature_requests;
create policy "Feature requests are viewable by admins"
  on public.feature_requests for select
  using (public.is_admin());

drop policy if exists "Feature requests are updatable by admins" on public.feature_requests;
create policy "Feature requests are updatable by admins"
  on public.feature_requests for update
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- auto-create a profile row for new signups
-- uses the nickname chosen at sign-up (passed as user metadata) when available,
-- falling back to the email prefix
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta_nickname text;
begin
  meta_nickname := nullif(trim(new.raw_user_meta_data ->> 'nickname'), '');
  insert into public.profiles (id, nickname, friend_code)
  values (new.id, coalesce(meta_nickname, split_part(new.email, '@', 1)), public.generate_friend_code())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- lets unauthenticated clients check nickname availability (e.g. during sign-up)
-- without exposing the rest of the profiles table
create or replace function public.nickname_available(p_nickname text)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select not exists (
    select 1 from public.profiles
    where lower(nickname) = lower(p_nickname)
  );
$$;

grant execute on function public.nickname_available(text) to anon, authenticated;

-- backfill for accounts created before this trigger existed
insert into public.profiles (id, nickname, friend_code)
select id, split_part(email, '@', 1), public.generate_friend_code()
from auth.users
on conflict (id) do nothing;

-- grant admin access to the app owner
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'gasparenavarra2@gmail.com');

-- storage bucket + RLS for avatar images, fixed path convention: {user_id}/avatar (no extension)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Friend requests / friendships
-- a single row doubles as the friendship once status = 'accepted';
-- declining a pending request or removing a friend is just deleting the row
-- ============================================================

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  receiver_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create unique index if not exists friend_requests_pair_unique_idx
  on public.friend_requests (least(sender_id, receiver_id), greatest(sender_id, receiver_id));

alter table public.friend_requests enable row level security;

drop policy if exists "Friend requests are viewable by participants" on public.friend_requests;
create policy "Friend requests are viewable by participants"
  on public.friend_requests for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Friend requests are insertable by sender" on public.friend_requests;
create policy "Friend requests are insertable by sender"
  on public.friend_requests for insert
  with check (auth.uid() = sender_id);

drop policy if exists "Friend requests are updatable by participants" on public.friend_requests;
create policy "Friend requests are updatable by participants"
  on public.friend_requests for update
  using (auth.uid() = sender_id or auth.uid() = receiver_id)
  with check (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Friend requests are deletable by participants" on public.friend_requests;
create policy "Friend requests are deletable by participants"
  on public.friend_requests for delete
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop trigger if exists friend_requests_set_updated_at on public.friend_requests;
create trigger friend_requests_set_updated_at
  before update on public.friend_requests
  for each row
  execute function public.set_updated_at();

-- lets a user read the profile (nickname/avatar) of anyone they have a friend
-- request or friendship with, in either direction — needed to render incoming/
-- outgoing requests, the friends list, and a conversation's counterpart
drop policy if exists "Profiles are viewable by friend-request participants" on public.profiles;
create policy "Profiles are viewable by friend-request participants"
  on public.profiles for select
  using (
    exists (
      select 1 from public.friend_requests fr
      where (fr.sender_id = auth.uid() and fr.receiver_id = profiles.id)
         or (fr.receiver_id = auth.uid() and fr.sender_id = profiles.id)
    )
  );

-- ============================================================
-- Conversations + messages (1:1 chat between friends)
-- ============================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (user_a <> user_b)
);

create unique index if not exists conversations_pair_unique_idx
  on public.conversations (least(user_a, user_b), greatest(user_a, user_b));

-- per-side "I've read up to here" markers, used to render WhatsApp-style unread state
alter table public.conversations add column if not exists user_a_last_read_at timestamptz;
alter table public.conversations add column if not exists user_b_last_read_at timestamptz;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id, created_at);

create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id and (c.user_a = auth.uid() or c.user_b = auth.uid())
  );
$$;

create or replace function public.bump_conversation_last_message()
returns trigger
language plpgsql
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_bump_conversation on public.messages;
create trigger messages_bump_conversation
  after insert on public.messages
  for each row
  execute function public.bump_conversation_last_message();

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Conversations are viewable by participants" on public.conversations;
create policy "Conversations are viewable by participants"
  on public.conversations for select
  using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "Conversations are insertable between friends" on public.conversations;
create policy "Conversations are insertable between friends"
  on public.conversations for insert
  with check (
    (auth.uid() = user_a or auth.uid() = user_b)
    and exists (
      select 1 from public.friend_requests fr
      where fr.status = 'accepted'
        and ((fr.sender_id = user_a and fr.receiver_id = user_b) or (fr.sender_id = user_b and fr.receiver_id = user_a))
    )
  );

drop policy if exists "Conversations are updatable by participants" on public.conversations;
create policy "Conversations are updatable by participants"
  on public.conversations for update
  using (auth.uid() = user_a or auth.uid() = user_b)
  with check (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "Messages are viewable by participants" on public.messages;
create policy "Messages are viewable by participants"
  on public.messages for select
  using (public.is_conversation_participant(conversation_id));

drop policy if exists "Messages are insertable by participants" on public.messages;
create policy "Messages are insertable by participants"
  on public.messages for insert
  with check (sender_id = auth.uid() and public.is_conversation_participant(conversation_id));

-- enable realtime delivery for live message updates
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
