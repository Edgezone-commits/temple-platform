-- =============================================================================
-- Shree Laxminarayan Mandir — database schema v2
-- =============================================================================
-- Run in: Supabase Dashboard → SQL Editor (as the default `postgres` role).
--
-- IDEMPOTENT. Safe to run on:
--   • a brand-new project (creates everything), or
--   • the existing project, where events/poojas/pooja_bookings/books/bhajans
--     etc. were created by hand in the dashboard. Missing columns are added
--     with ADD COLUMN IF NOT EXISTS; existing data is never dropped.
-- Re-running it is harmless.
--
-- SUPERSEDES the untracked draft DATABASE_SETUP.sql, which had two security
-- bugs (see AUDIT.md A7/A8):
--   1. Its admin policies queried `profiles` from inside a `profiles` policy
--      → "infinite recursion detected in policy" (42P17).
--   2. "Service role can insert profiles" WITH CHECK (true) let ANY user
--      insert a profile with role='admin', and users could UPDATE their own
--      role → trivial privilege escalation.
--   Both are fixed below (is_admin() SECURITY DEFINER helper + role-lock
--   trigger) and the draft's policies are dropped by name.
--
-- What's new vs. the hand-made v1 tables:
--   profiles        NEW  — 1:1 with auth.users, role 'devotee' | 'admin',
--                          auto-created on signup (email + Google/Facebook).
--                          Replaces the old admin_profiles table.
--   gallery         NEW  — Phase 4 gallery page.
--   leadership      NEW  — founders + current leadership for the History
--                          page (is_founder flag); `founders` is a VIEW of it.
--   kb_documents    NEW  — log of what the Phase 7 RAG pipeline ingested into
--                          ChromaDB (vectors live in ChromaDB, not Postgres).
--   calendar_events +cols — category, tithi, Nepali (BS) date label, etc.
--   events          +category (festival/ekadashi/purnima/special_pooja…)
--   poojas          +is_popular
--   pooja_bookings  +user_id, +admin_notes, +status check
--   chat_history    shape defined for the AI assistant
--   every table     updated_at maintained by trigger
--   RLS             enabled on every table: public read where appropriate,
--                   admin-only writes, owners read their own bookings/chats.
--   storage         buckets + admin-only upload policies.
--
-- NOTE ON THE BACKEND: FastAPI uses the service-role key, which bypasses RLS.
-- RLS here protects direct access with the public anon key (browser /
-- supabase-js). The backend enforces admin checks itself (app/auth.py).
-- =============================================================================

create extension if not exists pgcrypto;  -- gen_random_uuid()


-- =============================================================================
-- 0. Shared helpers
-- =============================================================================

-- Keeps updated_at current on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- =============================================================================
-- 1. profiles  (NEW — replaces admin_profiles)
-- =============================================================================
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             text,
  display_name      text,
  avatar_url        text,
  preferred_locale  text not null default 'en',
  role              text not null default 'devotee',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Bring a profiles table created by the old draft up to shape.
alter table public.profiles add column if not exists email            text;
alter table public.profiles add column if not exists display_name     text;
alter table public.profiles add column if not exists avatar_url       text;
alter table public.profiles add column if not exists preferred_locale text not null default 'en';
alter table public.profiles add column if not exists role             text not null default 'devotee';
alter table public.profiles add column if not exists created_at       timestamptz not null default now();
alter table public.profiles add column if not exists updated_at       timestamptz not null default now();
-- Facebook/phone signups may have no email, so it can't be NOT NULL.
alter table public.profiles alter column email drop not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('devotee', 'admin'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_locale_check') then
    alter table public.profiles
      add constraint profiles_locale_check check (preferred_locale in ('en', 'ne'));
  end if;
end $$;

-- is_admin(): SECURITY DEFINER so it reads profiles WITHOUT going through
-- profiles' own RLS — this is what avoids the infinite-recursion bug.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Auto-create a profile for every new auth user (email/password, Google,
-- Facebook). OAuth providers put the name/avatar in different metadata keys.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, preferred_locale)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    case when new.raw_user_meta_data ->> 'locale' = 'ne' then 'ne' else 'en' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role lock: a logged-in non-admin can never change anyone's role (including
-- their own). Direct SQL (SQL editor) and the service-role key have no
-- auth.uid(), so admins can still be promoted from the dashboard.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

drop trigger if exists profiles_updated_at on public.profiles;   -- name used by the old draft
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Backfill profiles for users who signed up before this trigger existed.
insert into public.profiles (id, email, display_name)
select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'display_name', split_part(coalesce(u.email, ''), '@', 1))
from auth.users u
on conflict (id) do nothing;

-- Carry over admins from the old admin_profiles table, if it exists.
-- Its exact shape is unknown, so accept either a user_id or an id column.
do $$
begin
  if to_regclass('public.admin_profiles') is not null then
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'admin_profiles' and column_name = 'user_id') then
      execute 'update public.profiles p set role = ''admin''
               from public.admin_profiles a where a.user_id = p.id';
    elsif exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'admin_profiles' and column_name = 'id') then
      execute 'update public.profiles p set role = ''admin''
               from public.admin_profiles a where a.id::text = p.id::text';
    end if;
    raise notice 'admin_profiles is superseded by profiles.role — drop it once you have verified your admins.';
  end if;
end $$;


-- =============================================================================
-- 2. Core content tables (existing in v1 — created here if missing,
--    otherwise topped up with any missing columns)
-- =============================================================================

-- ---------- events -----------------------------------------------------------
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  title_en        text not null,
  title_ne        text,
  description_en  text,
  description_ne  text,
  event_date      date not null,
  start_time      time,
  end_time        time,
  location_en     text,
  location_ne     text,
  image_url       text,
  category        text not null default 'festival',
  is_featured     boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.events add column if not exists title_ne       text;
alter table public.events add column if not exists description_en text;
alter table public.events add column if not exists description_ne text;
alter table public.events add column if not exists start_time     time;
alter table public.events add column if not exists end_time       time;
alter table public.events add column if not exists location_en    text;
alter table public.events add column if not exists location_ne    text;
alter table public.events add column if not exists image_url      text;
-- NEW: drives the Festivals / Ekadashi / Purnima / Special Poojas filter
alter table public.events add column if not exists category       text not null default 'festival';
alter table public.events add column if not exists is_featured    boolean not null default false;
alter table public.events add column if not exists is_active      boolean not null default true;
alter table public.events add column if not exists created_at     timestamptz not null default now();
alter table public.events add column if not exists updated_at     timestamptz not null default now();
create index if not exists events_date_idx on public.events (event_date) where is_active;

-- ---------- poojas -----------------------------------------------------------
create table if not exists public.poojas (
  id                uuid primary key default gen_random_uuid(),
  name_en           text not null,
  name_ne           text,
  description_en    text,
  description_ne    text,
  duration_minutes  integer check (duration_minutes > 0),
  price             numeric(10, 2) check (price >= 0),
  currency          text not null default 'NPR',
  is_available      boolean not null default true,
  is_popular        boolean not null default false,
  image_url         text,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table public.poojas add column if not exists name_ne          text;
alter table public.poojas add column if not exists description_en   text;
alter table public.poojas add column if not exists description_ne   text;
alter table public.poojas add column if not exists duration_minutes integer;
alter table public.poojas add column if not exists price            numeric(10, 2);
alter table public.poojas add column if not exists currency         text not null default 'NPR';
alter table public.poojas add column if not exists is_available     boolean not null default true;
-- NEW: the "Popular" badge on the pooja grid
alter table public.poojas add column if not exists is_popular       boolean not null default false;
alter table public.poojas add column if not exists image_url        text;
alter table public.poojas add column if not exists sort_order       integer not null default 0;
alter table public.poojas add column if not exists created_at       timestamptz not null default now();
alter table public.poojas add column if not exists updated_at       timestamptz not null default now();

-- ---------- pooja_bookings ---------------------------------------------------
create table if not exists public.pooja_bookings (
  id             uuid primary key default gen_random_uuid(),
  pooja_id       uuid references public.poojas (id) on delete set null,
  user_id        uuid references auth.users (id) on delete set null,
  devotee_name   text not null,
  devotee_email  text,
  devotee_phone  text not null,
  booking_date   date not null,
  booking_time   time,
  gothram        text,
  nakshatra      text,
  rashi          text,
  notes          text,
  status         text not null default 'pending',
  admin_notes    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.pooja_bookings add column if not exists pooja_id      uuid references public.poojas (id) on delete set null;
-- NEW: links a booking to the devotee's account when they were logged in
alter table public.pooja_bookings add column if not exists user_id       uuid references auth.users (id) on delete set null;
alter table public.pooja_bookings add column if not exists devotee_email text;
alter table public.pooja_bookings add column if not exists booking_time  time;
alter table public.pooja_bookings add column if not exists gothram       text;
alter table public.pooja_bookings add column if not exists nakshatra     text;
alter table public.pooja_bookings add column if not exists rashi         text;
alter table public.pooja_bookings add column if not exists notes         text;
alter table public.pooja_bookings add column if not exists status        text not null default 'pending';
-- NEW: internal notes the admin adds when confirming/cancelling
alter table public.pooja_bookings add column if not exists admin_notes   text;
alter table public.pooja_bookings add column if not exists created_at    timestamptz not null default now();
alter table public.pooja_bookings add column if not exists updated_at    timestamptz not null default now();
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pooja_bookings_status_check') then
    alter table public.pooja_bookings
      add constraint pooja_bookings_status_check
      check (status in ('pending', 'confirmed', 'cancelled', 'completed')) not valid;
  end if;
end $$;
create index if not exists pooja_bookings_status_date_idx on public.pooja_bookings (status, booking_date desc);
create index if not exists pooja_bookings_user_idx on public.pooja_bookings (user_id);

-- ---------- archanas ---------------------------------------------------------
create table if not exists public.archanas (
  id              uuid primary key default gen_random_uuid(),
  name_en         text not null,
  name_ne         text,
  description_en  text,
  description_ne  text,
  deity_en        text,
  deity_ne        text,
  price           numeric(10, 2) check (price >= 0),
  currency        text not null default 'NPR',
  is_available    boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.archanas add column if not exists name_ne        text;
alter table public.archanas add column if not exists description_en text;
alter table public.archanas add column if not exists description_ne text;
alter table public.archanas add column if not exists deity_en       text;
alter table public.archanas add column if not exists deity_ne       text;
alter table public.archanas add column if not exists price          numeric(10, 2);
alter table public.archanas add column if not exists currency       text not null default 'NPR';
alter table public.archanas add column if not exists is_available   boolean not null default true;
alter table public.archanas add column if not exists sort_order     integer not null default 0;
alter table public.archanas add column if not exists created_at     timestamptz not null default now();
alter table public.archanas add column if not exists updated_at     timestamptz not null default now();

-- ---------- books ------------------------------------------------------------
create table if not exists public.books (
  id               uuid primary key default gen_random_uuid(),
  title_en         text not null,
  title_ne         text,
  author_en        text,
  author_ne        text,
  description_en   text,
  description_ne   text,
  pdf_url          text,
  cover_image_url  text,
  category         text,             -- 'scripture' | 'stotra' | 'philosophy' | 'biography'
  language         text not null default 'sa',  -- 'sa' Sanskrit | 'ne' Nepali | 'en' English
  total_pages      integer,
  is_published     boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.books add column if not exists title_ne        text;
alter table public.books add column if not exists author_en       text;
alter table public.books add column if not exists author_ne       text;
alter table public.books add column if not exists description_en  text;
alter table public.books add column if not exists description_ne  text;
alter table public.books add column if not exists pdf_url         text;
alter table public.books add column if not exists cover_image_url text;
alter table public.books add column if not exists category        text;
alter table public.books add column if not exists language        text not null default 'sa';
alter table public.books add column if not exists total_pages     integer;
alter table public.books add column if not exists is_published    boolean not null default true;
alter table public.books add column if not exists sort_order      integer not null default 0;
alter table public.books add column if not exists created_at      timestamptz not null default now();
alter table public.books add column if not exists updated_at      timestamptz not null default now();

-- ---------- bhajans ----------------------------------------------------------
create table if not exists public.bhajans (
  id                uuid primary key default gen_random_uuid(),
  title_en          text not null,
  title_ne          text,
  artist_en         text,
  artist_ne         text,
  lyrics_en         text,
  lyrics_ne         text,
  audio_url         text,
  duration_seconds  integer,
  deity             text,            -- 'Vishnu' | 'Lakshmi' | 'Laxminarayan' …
  raaga             text,
  category          text,            -- 'suprabhatam' | 'stotra' | 'bhajan' | 'vedic' | 'ashtapadi' | 'mangalashtak'
  is_published      boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table public.bhajans add column if not exists title_ne         text;
alter table public.bhajans add column if not exists artist_en        text;
alter table public.bhajans add column if not exists artist_ne        text;
alter table public.bhajans add column if not exists lyrics_en        text;
alter table public.bhajans add column if not exists lyrics_ne        text;
alter table public.bhajans add column if not exists audio_url        text;
alter table public.bhajans add column if not exists duration_seconds integer;
alter table public.bhajans add column if not exists deity            text;
alter table public.bhajans add column if not exists raaga            text;
alter table public.bhajans add column if not exists category         text;
alter table public.bhajans add column if not exists is_published     boolean not null default true;
alter table public.bhajans add column if not exists sort_order       integer not null default 0;
alter table public.bhajans add column if not exists created_at       timestamptz not null default now();
alter table public.bhajans add column if not exists updated_at       timestamptz not null default now();

-- ---------- temple_info ------------------------------------------------------
-- Key/value bilingual facts (timings, address, phone, history paragraphs…).
-- Used by the site AND fed to the AI assistant as grounding context.
create table if not exists public.temple_info (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,     -- e.g. 'timings.morning', 'contact.phone'
  category    text not null default 'general',  -- 'timings' | 'contact' | 'history' | 'rituals' | 'general'
  value_en    text,
  value_ne    text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.temple_info add column if not exists category   text not null default 'general';
alter table public.temple_info add column if not exists value_en   text;
alter table public.temple_info add column if not exists value_ne   text;
alter table public.temple_info add column if not exists sort_order integer not null default 0;
alter table public.temple_info add column if not exists created_at timestamptz not null default now();
alter table public.temple_info add column if not exists updated_at timestamptz not null default now();

-- ---------- calendar_events --------------------------------------------------
-- Festivals, Ekadashi, Purnima, special poojas for the Phase 3 month view.
-- Dates are stored in AD (Gregorian) for sorting; bs_date_* holds the Nepali
-- Bikram Sambat label to display (e.g. 'असोज १२, २०८३'), and tithi_* the lunar day.
create table if not exists public.calendar_events (
  id              uuid primary key default gen_random_uuid(),
  event_date      date not null,
  end_date        date,                 -- multi-day festivals (e.g. Brahmotsavam)
  category        text not null default 'festival',
  title_en        text not null,
  title_ne        text,
  description_en  text,
  description_ne  text,
  tithi_en        text,
  tithi_ne        text,
  bs_date_en      text,
  bs_date_ne      text,
  is_major        boolean not null default false,
  event_id        uuid references public.events (id) on delete set null,
  is_published    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.calendar_events add column if not exists end_date       date;
alter table public.calendar_events add column if not exists category       text not null default 'festival';
alter table public.calendar_events add column if not exists title_ne       text;
alter table public.calendar_events add column if not exists description_en text;
alter table public.calendar_events add column if not exists description_ne text;
alter table public.calendar_events add column if not exists tithi_en       text;
alter table public.calendar_events add column if not exists tithi_ne       text;
alter table public.calendar_events add column if not exists bs_date_en     text;
alter table public.calendar_events add column if not exists bs_date_ne     text;
alter table public.calendar_events add column if not exists is_major       boolean not null default false;
alter table public.calendar_events add column if not exists event_id       uuid references public.events (id) on delete set null;
alter table public.calendar_events add column if not exists is_published   boolean not null default true;
alter table public.calendar_events add column if not exists created_at     timestamptz not null default now();
alter table public.calendar_events add column if not exists updated_at     timestamptz not null default now();
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'calendar_events_category_check') then
    alter table public.calendar_events
      add constraint calendar_events_category_check
      check (category in ('festival', 'ekadashi', 'purnima', 'amavasya', 'sankranti', 'special_pooja', 'other')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'calendar_events_dates_check') then
    alter table public.calendar_events
      add constraint calendar_events_dates_check
      check (end_date is null or end_date >= event_date) not valid;
  end if;
end $$;
create index if not exists calendar_events_date_idx on public.calendar_events (event_date);

-- ---------- chat_history -----------------------------------------------------
-- One row per message of the "Ask the Pandit" assistant (Phase 7).
-- Written by the backend (service role); anonymous visitors get a
-- client-generated session_id, logged-in users also get user_id.
create table if not exists public.chat_history (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null,
  user_id        uuid references auth.users (id) on delete set null,
  role           text not null,          -- 'user' | 'assistant'
  content        text not null,
  locale         text,                   -- language the message was written in ('en' | 'ne')
  sources        jsonb,                  -- retrieved chunks cited for assistant replies
  model          text,
  input_tokens   integer,
  output_tokens  integer,
  created_at     timestamptz not null default now()
);
alter table public.chat_history add column if not exists session_id    uuid;
alter table public.chat_history add column if not exists user_id       uuid references auth.users (id) on delete set null;
alter table public.chat_history add column if not exists role          text;
alter table public.chat_history add column if not exists content       text;
alter table public.chat_history add column if not exists locale        text;
alter table public.chat_history add column if not exists sources       jsonb;
alter table public.chat_history add column if not exists model         text;
alter table public.chat_history add column if not exists input_tokens  integer;
alter table public.chat_history add column if not exists output_tokens integer;
alter table public.chat_history add column if not exists created_at    timestamptz not null default now();
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'chat_history_role_check') then
    alter table public.chat_history
      add constraint chat_history_role_check check (role in ('user', 'assistant')) not valid;
  end if;
end $$;
create index if not exists chat_history_session_idx on public.chat_history (session_id, created_at);
create index if not exists chat_history_user_idx on public.chat_history (user_id);


-- =============================================================================
-- 3. New tables
-- =============================================================================

-- ---------- gallery (NEW, Phase 4) ------------------------------------------
-- image_url is the public Supabase Storage URL (bucket 'gallery');
-- storage_path is kept so the admin UI can delete the file too.
create table if not exists public.gallery (
  id            uuid primary key default gen_random_uuid(),
  image_url     text not null,
  storage_path  text,
  caption_en    text,
  caption_ne    text,
  category      text not null default 'temple',
  event_id      uuid references public.events (id) on delete set null,
  taken_on      date,
  sort_order    integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'gallery_category_check') then
    alter table public.gallery
      add constraint gallery_category_check
      check (category in ('temple', 'deity', 'festival', 'pooja', 'community', 'history', 'other'));
  end if;
end $$;
create index if not exists gallery_category_idx on public.gallery (category, sort_order);

-- ---------- leadership + founders (NEW, History page) -----------------------
-- One table for both, as specified (is_founder flag). `founders` is a view so
-- code can still query "founders" by name.
create table if not exists public.leadership (
  id            uuid primary key default gen_random_uuid(),
  name_en       text not null,
  name_ne       text,
  role_en       text,                   -- e.g. 'Founder', 'Head Priest', 'Chairperson'
  role_ne       text,
  bio_en        text,
  bio_ne        text,
  photo_url     text,
  video_url     text,
  years_active  text,                   -- free text, e.g. '1978 – 2004'
  is_founder    boolean not null default false,
  sort_order    integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists leadership_order_idx on public.leadership (is_founder desc, sort_order);

-- security_invoker: the view obeys the caller's RLS on leadership.
create or replace view public.founders
  with (security_invoker = true) as
  select * from public.leadership where is_founder;

-- ---------- kb_documents (NEW, Phase 7 RAG bookkeeping) ---------------------
-- Vectors live in ChromaDB. This table records WHAT was ingested so we can
-- re-ingest only changed sources (content_hash) and show status in admin.
create table if not exists public.kb_documents (
  id            uuid primary key default gen_random_uuid(),
  source_type   text not null,          -- 'book' | 'temple_info' | 'file'
  source_id     uuid,                   -- books.id / temple_info.id when applicable
  source_path   text,                   -- file path / storage path for raw files
  title         text not null,
  language      text,
  content_hash  text not null,
  chunk_count   integer not null default 0,
  ingested_at   timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists kb_documents_source_idx
  on public.kb_documents (source_type, coalesce(source_id::text, source_path));


-- =============================================================================
-- 4. updated_at triggers for every table that has the column
-- =============================================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'events', 'poojas', 'pooja_bookings', 'archanas', 'books', 'bhajans',
    'temple_info', 'calendar_events', 'gallery', 'leadership', 'kb_documents'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t);
  end loop;
end $$;


-- =============================================================================
-- 5. Row Level Security
-- =============================================================================
-- Pattern for content tables:
--   "<t>: public read"  — anon + authenticated can SELECT published rows
--   "<t>: admin all"    — admins can do everything (incl. read unpublished)
-- Policies are dropped and recreated so re-running picks up changes.

-- ---------- profiles ---------------------------------------------------------
alter table public.profiles enable row level security;

-- Remove the old draft's policies (recursive + privilege escalation).
drop policy if exists "Users can view their own profile"   on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admins can view all profiles"       on public.profiles;
drop policy if exists "Admins can update all profiles"     on public.profiles;
drop policy if exists "Service role can insert profiles"   on public.profiles;

drop policy if exists "profiles: read own or admin"   on public.profiles;
drop policy if exists "profiles: update own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());
-- Users may edit their own name/avatar/locale; the role column is protected
-- by the profiles_protect_role trigger. No INSERT policy: rows are created
-- only by the SECURITY DEFINER signup trigger.
create policy "profiles: update own or admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ---------- public-readable content tables ----------------------------------
do $$
declare
  rec record;
begin
  for rec in
    select * from (values
      ('events',          'is_active'),
      ('poojas',          'is_available'),
      ('archanas',        'is_available'),
      ('books',           'is_published'),
      ('bhajans',         'is_published'),
      ('temple_info',     'true'),
      ('calendar_events', 'is_published'),
      ('gallery',         'is_published'),
      ('leadership',      'is_published')
    ) as v(tbl, visible)
  loop
    execute format('alter table public.%I enable row level security', rec.tbl);

    execute format('drop policy if exists %I on public.%I', rec.tbl || ': public read', rec.tbl);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (%s)',
      rec.tbl || ': public read', rec.tbl, rec.visible);

    execute format('drop policy if exists %I on public.%I', rec.tbl || ': admin all', rec.tbl);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      rec.tbl || ': admin all', rec.tbl);
  end loop;
end $$;

-- ---------- pooja_bookings (contains devotee PII) ---------------------------
-- No public INSERT: bookings go through the FastAPI backend, which validates
-- them. Logged-in devotees can see their own bookings; admins see all.
alter table public.pooja_bookings enable row level security;
drop policy if exists "pooja_bookings: read own"  on public.pooja_bookings;
drop policy if exists "pooja_bookings: admin all" on public.pooja_bookings;
create policy "pooja_bookings: read own" on public.pooja_bookings
  for select to authenticated
  using (user_id = auth.uid());
create policy "pooja_bookings: admin all" on public.pooja_bookings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- chat_history ----------------------------------------------------
-- Written only by the backend. Users can read their own conversations.
alter table public.chat_history enable row level security;
drop policy if exists "chat_history: read own"   on public.chat_history;
drop policy if exists "chat_history: admin read" on public.chat_history;
create policy "chat_history: read own" on public.chat_history
  for select to authenticated
  using (user_id = auth.uid());
create policy "chat_history: admin read" on public.chat_history
  for select to authenticated
  using (public.is_admin());

-- ---------- kb_documents (admin only) ---------------------------------------
alter table public.kb_documents enable row level security;
drop policy if exists "kb_documents: admin all" on public.kb_documents;
create policy "kb_documents: admin all" on public.kb_documents
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- admin_profiles (legacy, if present) -----------------------------
-- Lock it down until it is dropped: RLS on, no policies = no anon access.
do $$
begin
  if to_regclass('public.admin_profiles') is not null then
    execute 'alter table public.admin_profiles enable row level security';
  end if;
end $$;


-- =============================================================================
-- 6. Storage buckets + policies
-- =============================================================================
-- Public buckets: files are readable by URL without a policy.
-- Uploads / replacements / deletions: admins only.
insert into storage.buckets (id, name, public)
values
  ('gallery',      'gallery',      true),
  ('book-pdfs',    'book-pdfs',    true),
  ('bhajan-audio', 'bhajan-audio', true),
  ('site-media',   'site-media',   true)   -- event images, leadership photos, covers
on conflict (id) do update set public = excluded.public;

drop policy if exists "temple buckets: admin insert" on storage.objects;
drop policy if exists "temple buckets: admin update" on storage.objects;
drop policy if exists "temple buckets: admin delete" on storage.objects;
create policy "temple buckets: admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('gallery', 'book-pdfs', 'bhajan-audio', 'site-media') and public.is_admin());
create policy "temple buckets: admin update" on storage.objects
  for update to authenticated
  using (bucket_id in ('gallery', 'book-pdfs', 'bhajan-audio', 'site-media') and public.is_admin())
  with check (bucket_id in ('gallery', 'book-pdfs', 'bhajan-audio', 'site-media') and public.is_admin());
create policy "temple buckets: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('gallery', 'book-pdfs', 'bhajan-audio', 'site-media') and public.is_admin());


-- =============================================================================
-- 7. Grants
-- =============================================================================
-- Supabase grants table privileges to anon/authenticated by default; RLS is
-- what actually restricts rows. Be explicit for the helper function + view.
grant execute on function public.is_admin() to anon, authenticated;
grant select on public.founders to anon, authenticated;


-- =============================================================================
-- 8. Promote your first admin (run separately, AFTER you have signed up)
-- =============================================================================
-- update public.profiles set role = 'admin' where email = 'you@example.com';
