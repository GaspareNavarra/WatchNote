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
  external_source text check (external_source in ('tmdb', 'jikan')),
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe to re-run on an already-created database (adds new columns introduced later):
alter table public.titles add column if not exists overview text;
alter table public.titles add column if not exists external_source text;
alter table public.titles add column if not exists external_id text;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'titles_external_source_check'
  ) then
    alter table public.titles
      add constraint titles_external_source_check
      check (external_source in ('tmdb', 'jikan'));
  end if;
end $$;

create index if not exists titles_user_id_idx on public.titles (user_id);
create unique index if not exists titles_user_external_unique_idx
  on public.titles (user_id, external_source, external_id)
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
