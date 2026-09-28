# Phase 0 Audit — Shree Laxminarayan Mandir Platform

Audit date: 2026-09-27. Scope: everything under `backend/`, `frontend/`, `ai-services/`, plus root config
and the uncommitted auth work-in-progress found in the working tree.

Each finding has a **status**:

- **FIXED (P0)** means it was fixed in the Phase 0 commit.
- **→ Phase N** means it's deliberately deferred to the phase of the plan that owns it. For example, mock
  data is replaced in Phase 2 because it needs the Phase 1 schema first.

---

## 1. Bugs, broken imports, inconsistent naming, dead code

### Backend

| # | Finding | Status |
|---|---------|--------|
| B1 | **Backend cannot start.** `schemas/poojas.py` uses `EmailStr`, which requires `email-validator`, but that isn't in `requirements.txt`. `import app.main` raises `ImportError`. | FIXED (P0) — added `email-validator` |
| B2 | `.single()` in supabase-py **raises** `APIError` when zero rows match, so every "not found" lookup returns a 500 instead of the intended 404. | FIXED (P0) — `fetch_one()` helper using `limit(1)` |
| B3 | Bookings select `poojas(name_en, name_ne)`, which returns the key `poojas`, but `BookingResponse` declares `pooja: PoojaResponse`. The join data was silently dropped, and would have failed validation even if renamed, since it's only a partial pooja. | FIXED (P0) — `PoojaSummary` + PostgREST alias `pooja:poojas(...)` |
| B4 | Date, time, and UUID serialisation was done with hand-rolled `str()` loops in each router, and some were missing: `pooja_id` in PATCH, and `pooja_id` in the other create paths. | FIXED (P0) — `model_dump(mode="json")` everywhere |
| B5 | `DELETE /poojas`, `/books`, and `/bhajans` return 204 even when the id doesn't exist. `DELETE /events` returns 404. The behaviour was inconsistent. | FIXED (P0) — all return 404 when missing |
| B6 | `GET /bookings?status=` accepted any string. | FIXED (P0) — typed as `BookingStatus` literal |
| B7 | Pydantic v1-style `class Config` is deprecated in Pydantic v2 (emits warnings). | FIXED (P0) — `model_config` |
| B8 | `backend/package.json` / `package-lock.json` hold **JavaScript** Supabase packages inside the Python backend. They were never used. | FIXED (P0) — removed from git (local `node_modules/` can be deleted) |
| B9 | `app/middleware/`, `app/models/`, `app/services/` are empty packages. | Kept: `services/` is used by Phase 7. The others are harmless. |
| B10 | The user brief mentions a bhajans router. It lives inside `routers/books.py` (the `/bhajans` prefix), which is fine but easy to miss. | Documented here |
| B11 | There are two Python virtualenvs, `/.venv` (root) and `/backend/venv`. Both are git-ignored. | Note: only `backend/venv` is needed |

### Frontend

| # | Finding | Status |
|---|---------|--------|
| F1 | **Locale middleware never runs.** `frontend/middleware.ts` sits at the project root, but the app uses `src/app`. Next.js only detects middleware/proxy next to `app/` (i.e. `src/`). Next 16 also renamed `middleware` → `proxy`. As a result, `/` rendered the default create-next-app page and locale detection never happened. | FIXED (P0) — moved to `src/proxy.ts` |
| F2 | `src/app/page.tsx` is the untouched create-next-app template (Tailwind classes, Vercel links). | FIXED (P0) — deleted. `/` now redirects to `/en` via the proxy |
| F3 | `/poojas/book` rendered `PoojaGrid` + `ArchanaSection` (a copy-paste of `/poojas`). The real `BookingForm` and `BookingInfoPanel` were dead code. This is the same bug class as commit b206018 fixed for `/books`. | FIXED (P0) |
| F4 | `BookingForm` shows "Booking Received!" **even when the request fails**: `catch {}` swallowed errors and `res.ok` was never checked. | FIXED (P0) |
| F5 | `BookingForm` sends `booking_time: "5:00 AM (Suprabhatam)"`. The backend expects `HH:MM`, so every real submission would have been rejected with a 422. | FIXED (P0) — value/label split |
| F6 | Images reference `/images/deity.jpg`, but the file is `deity.JPG`. This works on Windows (case-insensitive) but **404s on Linux/Vercel**. | FIXED (P0) — renamed file |
| F7 | `frontend/.env.example` says `NEXT_PUBLIC_API_URL=http://localhost:8000/api`, but the code appends `/api/v1` (→ `/api/api/v1`). Root `.env.example` uses `SUPABASE_SERVICE_ROLE_KEY` while the backend reads `SUPABASE_SERVICE_KEY`. | FIXED (P0) — examples aligned |
| F8 | `README.md` contains unresolved merge-conflict markers (`<<<<<<< HEAD`). | FIXED (P0) |
| F9 | Hard-coded **English-only** user-facing text: PageHero titles on every inner page, Header "Book a Pooja", Footer (services column, timings, the Nepali temple name is actually English), Contact page + form, BookingForm, BookingInfoPanel. | FIXED (P0) for all components *not* rewritten in Phase 2 |
| F10 | English-only text inside the mock-data components: EventsGrid, CalendarStrip, BooksGrid, BhajanPlayer, PoojaGrid, ArchanaSection, EventsPreview. | FIXED (P2) |
| F11 | `ContactForm` doesn't send anything. It just flips to "Message Sent!". | FIXED (P0) — it now opens the visitor's mail client with the message pre-filled (honest behaviour), noted as a TODO for a backend endpoint |
| F12 | `globals.css` does `@import "tailwindcss"` but no page uses Tailwind classes (only the deleted template did). | Kept: it only contributes the preflight reset, and removing it would subtly change spacing. Revisit in Phase 8. |
| F13 | No responsive breakpoints. Grids are fixed at `repeat(3/4,1fr)` and `1fr 400px`, so layouts break on phones. | PARTLY (P4): header/nav/footer adapt on phones and `overflow-x: clip` stops page-wide overflow. The home timings bar, contact grid, and Devanagari letter-spacing on small caps labels are left for Phase 8. |
| F15 | **The Nepali locale never worked.** next-intl read the locale from a proxy header that never reaches Server Components, so `/ne/*` rendered English text under `<html lang="ne">`. This was found while verifying F1. | FIXED (P0) — `setRequestLocale(locale)` in the layout and every page, plus `locale` passed to `NextIntlClientProvider` |
| F16 | **Nepali numbers/dates broke after hydration (found in Phase 4, introduced in Phase 2).** Chrome ships no Nepali ICU data, so `Intl`/next-intl formatting in Client Components produced English dates and Latin digits in the browser, while the server rendered Devanagari. This caused React hydration error #418 on `/ne/events` and `/ne/poojas/book`, and the booking dropdown switched to "रु 500". | FIXED (P4) — `lib/format.ts` (table-driven, identical on server and browser) used everywhere; a Chrome sweep of all pages × both locales shows zero console errors |
| F14 | Footer links "AI Pandit (Coming Soon)" → `/contact`. | FIXED (P7): the footer link now opens the “Ask the Pandit” widget |

### Uncommitted auth work-in-progress (untracked files)

The pages in `(auth)/`, `api/auth/*`, `auth/callback`, `lib/auth-actions.ts`, and `DATABASE_SETUP.sql` / `SETUP.md` / `AUTH_SYSTEM.md` were never committed. Problems:

| # | Finding | Status |
|---|---------|--------|
| A1 | **Doesn't compile.** 14 TypeScript errors: `cookies()` is async since Next 15 and wasn't awaited. `forgot-password/page.tsx` is an empty file. | FIXED (P5) |
| A2 | `(auth)/layout.tsx` renders its own `<html><body>` *inside* `[locale]/layout.tsx`, which already renders `<html>`. The result is nested `<html>` (invalid), and the header/footer are **not** hidden. The route-group structure needs to change. | FIXED (P5) |
| A3 | "OTP" reset actually calls `resetPasswordForEmail(..., { redirectTo })`, which sends a **magic link**. OTP-style needs the email template to include `{{ .Token }}`, and the app to use `verifyOtp({ type: 'recovery' })`. | FIXED (P5) |
| A4 | Two parallel implementations of the same thing: Server Actions (`auth-actions.ts`) **and** API routes (`api/auth/*`). The pages use the API routes. The brief asks for Server Actions only. | FIXED (P5) |
| A5 | Uses `NEXT_PUBLIC_APP_URL`, but `.env.local` defines `NEXT_PUBLIC_SITE_URL`. Every redirect would fall back to localhost in production. | FIXED (P5) |
| A6 | OAuth callback always redirects to `/en` on error, and reads the locale from user metadata that is never set. | FIXED (P5) |
| A7 | `DATABASE_SETUP.sql` admin policies query `profiles` from *within* a `profiles` policy, which is **infinite recursion** in Postgres RLS (error 42P17). | FIXED (P1) — `is_admin()` SECURITY DEFINER helper in `database/schema_v2.sql` (recursion reproduced, then verified gone, in `database/tests/test_schema_v2.py`) |
| A8 | `DATABASE_SETUP.sql` has "Service role can insert profiles" `WITH CHECK (true)`. That lets **any** anon/authenticated user insert arbitrary profiles, including `role='admin'`. It's a **privilege-escalation hole**. The same file also lets users `UPDATE` their own row with no column restriction, so a devotee could set `role='admin'` on themselves. | FIXED (P1) — policy dropped, no INSERT policy, `profiles_protect_role` trigger (escalation reproduced against the draft, then verified blocked) |

These files were **not** included in the Phase 0 commit, because committing code that doesn't compile would violate the "no broken commits" rule. They are left untouched in the working tree and were rebuilt in Phase 5: Server Actions only, route groups, OTP reset. Phase 1 supersedes `DATABASE_SETUP.sql`.

---

## 2. Hard-coded / mock data instead of backend fetches — FIXED (P2)

All of the components below now render data fetched on the server from FastAPI, with loading skeletons and empty/error states. The old mock content lives on as optional starter data in `database/seed.sql`. Timings are still translation strings; `temple_info` holds them for the AI assistant.

| Component | Mock data | Should come from |
|-----------|-----------|------------------|
| `events/EventsGrid.tsx` | 9 events | `GET /api/v1/events` |
| `events/CalendarStrip.tsx` | 5 dates | `calendar_events` (new endpoint, Phase 2/3) |
| `home/EventsPreview.tsx` | 3 events | `GET /api/v1/events?upcoming=true&limit=3` |
| `poojas/PoojaGrid.tsx` | 9 poojas | `GET /api/v1/poojas` |
| `poojas/ArchanaSection.tsx` | 4 archanas | `archanas` table (no endpoint yet) |
| `poojas/BookingForm.tsx` | pooja dropdown strings (pooja only sent as free-text `notes`) | `GET /api/v1/poojas` → send `pooja_id` |
| `books/BooksGrid.tsx` | 12 books; "Read" button is an `alert()` | `GET /api/v1/books` |
| `bhajans/BhajanPlayer.tsx` | 10 tracks; **fake** player (a `setInterval` progress bar, no audio) | `GET /api/v1/bhajans` + real `<audio>` |
| Timings in `TimingsBar`, `Footer`, `BookingInfoPanel`, contact page | duplicated strings | `temple_info` (Phase 2); i18n messages for now |

---

## 3. Security issues

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| S1 | **Critical** | **Every write endpoint is unauthenticated.** Anyone on the internet can `POST/PATCH/DELETE` events, poojas, books, and bhajans, and can `GET` the full bookings list (devotee names, phones, emails). The backend uses the **service-role key**, which bypasses RLS, so database policies don't help. | FIXED (P0) — `require_admin` dependency verifies the Supabase JWT and checks `profiles.role = 'admin'`. It fails closed (403) until Phase 1 creates `profiles`. |
| S2 | High | Privilege escalation in the draft `DATABASE_SETUP.sql` (A8). | FIXED (P1) |
| S3 | Medium | Booking submission has no server-side sanity checks: past dates are accepted, and notes length is unlimited. | FIXED (P0) — date ≥ today, length limits |
| S4 | Info | Service-role key location: only in `backend/.env` (git-ignored). Frontend `.env.local` only has the anon key. **Not** exposed client-side. Git history was scanned for JWTs / API keys: none found. | OK |
| S5 | Info | `backend/.env.example` contained the real project ref URL. That isn't a secret, but it was replaced with a placeholder anyway. | FIXED (P0) |
| S6 | Medium | No rate limiting on public `POST /bookings` (spam risk). | → Phase 2 notes / deploy docs (a simple per-IP limiter) |

---

## 4. Supabase schema vs what the code needs

**There is no schema SQL for the core tables anywhere in the repo.** `events`, `poojas`, `pooja_bookings`, `books`, `bhajans`, and the rest were presumably created by hand in the Supabase dashboard. From this sandbox I couldn't reach Supabase (no outbound network) to introspect the live schema, so the column list below is inferred from the backend's Pydantic models. Phase 1 writes `database/schema_v2.sql` as a **complete, idempotent** schema (`CREATE TABLE IF NOT EXISTS` + `ADD COLUMN IF NOT EXISTS`). It's safe to run whether or not the tables already exist.

Gaps found:

1. `profiles` / roles: needed for admin checks, but only exists in the uncommitted draft (with the RLS bugs above).
2. `archanas`, `temple_info`, `calendar_events`, `chat_history`, `admin_profiles`: listed in the brief, but **no backend endpoints or schemas** exist for them. `admin_profiles` overlaps with `profiles.role`. Phase 1 folds it into `profiles`.
3. `calendar_events` needs a type (`festival | ekadashi | purnima | special_pooja | …`), plus bilingual title/description and optional Nepali (BS) date text, for the Phase 3 calendar.
4. `pooja_bookings` should record `user_id` (nullable, for logged-in devotees) and `admin_notes`.
5. `gallery`, `founders`/`leadership`: don't exist yet (Phase 1).
6. `updated_at` is required by every `*Response` model. The tables need an `updated_at` trigger, or `PATCH` responses will show stale timestamps.
7. The RAG vector store: handled in ChromaDB (Phase 7). Only an ingestion log table is needed in Postgres.
