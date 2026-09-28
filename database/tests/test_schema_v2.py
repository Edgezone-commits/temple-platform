r"""
Integration test for database/schema_v2.sql.

Runs the schema against a REAL, throwaway local Postgres with minimal stubs of
the Supabase pieces it depends on (auth.users, auth.uid(), storage.*, and the
anon / authenticated / service_role roles), then checks RLS and triggers as an
anonymous visitor, a devotee, and an admin.

Scenario A: brand-new project, schema run twice (idempotency).
Scenario B: hand-made v1 tables + the old DATABASE_SETUP.sql draft +
            a legacy admin_profiles table, then schema run twice (upgrade path).

This creates and DROPS databases named t_fresh / t_legacy, so point it at a
disposable server — NEVER at Supabase.

How to run (Windows example, no Postgres install needed):
    npm i --prefix %TEMP%\pg @embedded-postgres/windows-x64
    set B=%TEMP%\pg\node_modules\@embedded-postgres\windows-x64\native\bin
    %B%\initdb -D %TEMP%\pgdata -U postgres -A trust -E UTF8 --locale=C
    %B%\pg_ctl -D %TEMP%\pgdata -o "-p 55432" start
    pip install psycopg2-binary
    python database/tests/test_schema_v2.py
    %B%\pg_ctl -D %TEMP%\pgdata stop
"""
import json, os, sys, uuid
from pathlib import Path

import psycopg2

REPO = Path(__file__).resolve().parents[2]
SCHEMA = (REPO / "database" / "schema_v2.sql").read_text(encoding="utf-8")
DSN = os.environ.get("PGTEST_DSN", "host=127.0.0.1 port=55432 user=postgres")

# The shape of the old draft (DATABASE_SETUP.sql) that may already be applied
# in Supabase. Inlined so the test doesn't depend on that untracked file.
_draft_path = REPO / "DATABASE_SETUP.sql"
DRAFT = _draft_path.read_text(encoding="utf-8") if _draft_path.exists() else """
create table profiles (id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null, updated_at timestamptz default now() not null,
  email text not null, display_name text,
  role text default 'devotee' not null check (role in ('devotee','admin')),
  constraint profiles_email_key unique(email));
alter table profiles enable row level security;
create policy "Admins can view all profiles" on profiles for select
  using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Service role can insert profiles" on profiles for insert with check (true);
"""

# Minimal imitation of the parts of Supabase the schema depends on.
STUBS = """
do $$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean default false);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated, service_role;
grant all on all tables in schema storage to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
"""

# What a hand-made v1 dashboard setup plausibly looks like (subset of columns).
LEGACY = """
create table public.events (id uuid primary key default gen_random_uuid(), title_en text not null,
  event_date date not null, is_active boolean default true, is_featured boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now());
create table public.poojas (id uuid primary key default gen_random_uuid(), name_en text not null,
  price numeric, sort_order int default 0, is_available boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now());
create table public.pooja_bookings (id uuid primary key default gen_random_uuid(),
  pooja_id uuid references public.poojas(id), devotee_name text not null, devotee_phone text not null,
  booking_date date not null, status text default 'pending',
  created_at timestamptz default now(), updated_at timestamptz default now());
create table public.books (id uuid primary key default gen_random_uuid(), title_en text not null);
create table public.bhajans (id uuid primary key default gen_random_uuid(), title_en text not null);
create table public.calendar_events (id uuid primary key default gen_random_uuid(), title_en text not null, event_date date not null);
create table public.temple_info (id uuid primary key default gen_random_uuid(), key text unique not null);
create table public.chat_history (id uuid primary key default gen_random_uuid(), content text);
create table public.admin_profiles (user_id uuid primary key references auth.users(id));
insert into public.events (title_en, event_date, is_active) values ('Old visible', '2026-10-01', true), ('Old hidden', '2026-10-02', false);
"""

ALICE, BOB, CAROL = (str(uuid.uuid4()) for _ in range(3))
ok = True


def check(label, cond):
    global ok
    ok &= bool(cond)
    print(("  PASS  " if cond else "  FAIL  ") + label)


def fresh_db(name):
    c = psycopg2.connect(DSN + " dbname=postgres"); c.autocommit = True
    c.cursor().execute(f"drop database if exists {name} with (force)")
    c.cursor().execute(f"create database {name}")
    c.close()
    conn = psycopg2.connect(DSN + f" dbname={name}"); conn.autocommit = True
    return conn


def run(conn, sql, label):
    try:
        conn.cursor().execute(sql)
        print(f"  ran   {label}")
        return True
    except Exception as e:
        print(f"  ERROR {label}: {e}")
        return False


def as_user(cur, role, uid=None):
    cur.execute("reset role; select set_config('request.jwt.claim.sub', %s, false)", (uid or "",))
    cur.execute(f"set role {role}")


def try_sql(cur, sql, args=None):
    cur.execute("savepoint s")
    try:
        cur.execute(sql, args)
        rows = cur.fetchall() if cur.description else cur.rowcount
        cur.execute("release savepoint s")
        return True, rows
    except Exception as e:
        cur.execute("rollback to savepoint s")
        return False, str(e).splitlines()[0]


print("== Scenario A: brand-new project ==")
a = fresh_db("t_fresh")
run(a, STUBS, "stubs")
check("schema_v2 run #1 on empty db", run(a, SCHEMA, "schema_v2 #1"))
check("schema_v2 run #2 (idempotent)", run(a, SCHEMA, "schema_v2 #2"))

print("\n== Scenario B: existing v1 tables + old draft + admin_profiles ==")
b = fresh_db("t_legacy")
run(b, STUBS, "stubs")
run(b, LEGACY, "legacy v1 tables")
b.cursor().execute("insert into auth.users (id, email) values (%s,'alice@x.np'), (%s,'bob@x.np')", (ALICE, BOB))
run(b, DRAFT, "old DATABASE_SETUP.sql draft")
b.cursor().execute("insert into public.admin_profiles values (%s)", (BOB,))
check("schema_v2 run #1 over legacy", run(b, SCHEMA, "schema_v2 #1"))
check("schema_v2 run #2 over legacy (idempotent)", run(b, SCHEMA, "schema_v2 #2"))

cur = b.cursor()
cur.execute("select id::text, role, display_name from public.profiles order by email")
profiles = {r[0]: r for r in cur.fetchall()}
check("existing users backfilled into profiles", ALICE in profiles and BOB in profiles)
check("admin_profiles member migrated to role=admin", profiles.get(BOB, (0, ''))[1] == 'admin')
check("other users default to devotee", profiles.get(ALICE, (0, ''))[1] == 'devotee')
cur.execute("select count(*) from pg_policies where tablename='profiles' and policyname like '%%Service role%%'")
check("draft's privilege-escalation policy removed", cur.fetchone()[0] == 0)
cur.execute("select column_name from information_schema.columns where table_name='events' and column_name in ('category','title_ne','location_en')")
check("missing columns added to legacy events", len(cur.fetchall()) == 3)
cur.execute("select count(*) from public.events")
check("legacy event rows preserved", cur.fetchone()[0] == 2)

# Google signup → profile with name/avatar from OAuth metadata
cur.execute("insert into auth.users (id, email, raw_user_meta_data) values (%s, 'carol@gmail.com', %s)",
            (CAROL, json.dumps({"full_name": "Carol Sharma", "avatar_url": "https://img/c.png", "locale": "ne"})))
cur.execute("select display_name, avatar_url, preferred_locale, role from public.profiles where id=%s", (CAROL,))
check("OAuth signup trigger creates profile (name/avatar/locale)", cur.fetchone() == ("Carol Sharma", "https://img/c.png", "ne", "devotee"))

# Seed rows as superuser
cur.execute("insert into public.poojas (name_en) values ('Abhishekam') returning id"); pooja = cur.fetchone()[0]
cur.execute("insert into public.pooja_bookings (pooja_id, user_id, devotee_name, devotee_phone, booking_date) values (%s,%s,'Alice','9800000000','2026-12-01'),(%s,null,'Walk-in','9811111111','2026-12-02')", (pooja, ALICE, pooja))
cur.execute("insert into public.gallery (image_url, category) values ('u1','festival'),('u2','deity')")
cur.execute("update public.gallery set is_published=false where image_url='u2'")
cur.execute("insert into public.leadership (name_en, is_founder) values ('Founder Ji', true), ('Priest Ji', false)")

# Transactional block for role-based tests
b.autocommit = False
cur = b.cursor()

print("\n-- anon --")
as_user(cur, "anon")
okk, rows = try_sql(cur, "select title_en from public.events")
check("anon sees only active events", okk and [r[0] for r in rows] == ["Old visible"])
okk, rows = try_sql(cur, "select image_url from public.gallery")
check("anon sees only published gallery", okk and [r[0] for r in rows] == ["u1"])
okk, rows = try_sql(cur, "select name_en from public.founders")
check("anon can read founders view (founders only)", okk and [r[0] for r in rows] == ["Founder Ji"])
okk, _ = try_sql(cur, "insert into public.events (title_en, event_date) values ('x','2026-01-01')")
check("anon cannot insert events", not okk)
okk, rows = try_sql(cur, "select * from public.pooja_bookings")
check("anon sees no bookings", okk and rows == [])
okk, rows = try_sql(cur, "select * from public.profiles")
check("anon sees no profiles", okk and rows == [])

print("\n-- alice (devotee) --")
as_user(cur, "authenticated", ALICE)
okk, rows = try_sql(cur, "select id::text from public.profiles")
check("devotee sees only own profile (no RLS recursion)", okk and [r[0] for r in rows] == [ALICE])
okk, err = try_sql(cur, "update public.profiles set role='admin' where id=%s", (ALICE,))
check("devotee CANNOT promote self to admin", not okk and "Only admins" in str(err))
okk, n = try_sql(cur, "update public.profiles set display_name='Alice D' where id=%s", (ALICE,))
check("devotee can edit own display_name", okk and n == 1)
okk, n = try_sql(cur, "update public.profiles set display_name='hacked' where id=%s", (BOB,))
check("devotee cannot edit someone else's profile", okk and n == 0)
okk, _ = try_sql(cur, "insert into public.profiles (id, email, role) values (gen_random_uuid(), 'e@x', 'admin')")
check("devotee cannot insert profiles", not okk)
okk, rows = try_sql(cur, "select devotee_name from public.pooja_bookings")
check("devotee sees only own bookings", okk and [r[0] for r in rows] == ["Alice"])
okk, _ = try_sql(cur, "insert into public.poojas (name_en) values ('x')")
check("devotee cannot write poojas", not okk)
okk, _ = try_sql(cur, "insert into storage.objects (bucket_id, name) values ('gallery','a.jpg')")
check("devotee cannot upload to gallery bucket", not okk)
okk, rows = try_sql(cur, "select public.is_admin()")
check("is_admin() false for devotee", okk and rows[0][0] is False)

print("\n-- bob (admin) --")
as_user(cur, "authenticated", BOB)
okk, rows = try_sql(cur, "select public.is_admin()")
check("is_admin() true for admin", okk and rows[0][0] is True)
okk, rows = try_sql(cur, "select count(*) from public.profiles")
check("admin sees all profiles", okk and rows[0][0] == 3)
okk, rows = try_sql(cur, "select count(*) from public.pooja_bookings")
check("admin sees all bookings", okk and rows[0][0] == 2)
okk, rows = try_sql(cur, "select count(*) from public.events")
check("admin sees inactive events too", okk and rows[0][0] == 2)
okk, _ = try_sql(cur, "insert into public.calendar_events (event_date, title_en, category) values ('2026-10-13','Ekadashi','ekadashi')")
check("admin can insert calendar_events", okk)
okk, _ = try_sql(cur, "insert into public.calendar_events (event_date, title_en, category) values ('2026-10-13','x','bogus')")
check("calendar category check rejects bad values", not okk)
okk, n = try_sql(cur, "update public.pooja_bookings set status='confirmed', admin_notes='ok' where devotee_name='Walk-in'")
check("admin can confirm a booking", okk and n == 1)
okk, _ = try_sql(cur, "update public.pooja_bookings set status='nonsense' where devotee_name='Walk-in'")
check("booking status check rejects bad values", not okk)
okk, n = try_sql(cur, "update public.profiles set role='admin' where id=%s", (ALICE,))
check("admin can promote another user", okk and n == 1)
okk, _ = try_sql(cur, "insert into storage.objects (bucket_id, name) values ('gallery','a.jpg')")
check("admin can upload to gallery bucket", okk)
okk, _ = try_sql(cur, "insert into storage.objects (bucket_id, name) values ('some-other-bucket','a.jpg')")
check("admin policy doesn't open unrelated buckets", not okk)

cur.execute("reset role")
cur.execute("select updated_at > created_at from public.pooja_bookings where devotee_name='Walk-in'")
check("updated_at trigger fires", cur.fetchone()[0] is True)
cur.execute("select id, public from storage.buckets order by id")
check("storage buckets created public", cur.fetchall() == [("bhajan-audio", True), ("book-pdfs", True), ("gallery", True), ("site-media", True)])
b.rollback()

# SQL-editor promotion path (no auth.uid()) must work for the first admin
b.autocommit = True
cur = b.cursor(); cur.execute("reset role; select set_config('request.jwt.claim.sub','',false)")
cur.execute("update public.profiles set role='admin' where email='carol@gmail.com'")
cur.execute("select role from public.profiles where email='carol@gmail.com'")
check("first admin can be promoted from SQL editor", cur.fetchone()[0] == "admin")

print("\nRESULT:", "ALL PASS" if ok else "FAILURES")
sys.exit(0 if ok else 1)
