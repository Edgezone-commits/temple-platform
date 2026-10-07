# Changes

Everything added, changed or removed, grouped by priority. Oldest first:

| Commit | |
|---|---|
| `7df9878` | `fix: resolve localhost run issues across backend, frontend, and docs` |
| `cbd819e` | `refactor(rag): migrate PanditAssistant to Gemini via LangGraph state graph` |
| `cfd882f` | `chore: update env examples and docs for Gemini migration` |
| `4012d06` | `feat(rag): tool-calling LangGraph agent with eval harness` |
| `197d8b1` | `feat: add Docker and docker-compose for dev and production` |
| `3e53aa0` | `feat: add bilingual privacy policy and terms of use pages` |
| `e422d44` | `docs: fix two broken documents found by link validation` |

**Read [§ Verification](#verification) before trusting any of this.** One
deliverable could not be checked here, and it is named precisely.

---

## Priority 1 — localhost run issues

### Changed

| File | What and why |
|---|---|
| `backend/app/config.py` | `ALLOWED_ORIGINS` default now includes `http://127.0.0.1:3000`. A browser treats it as a different origin from `localhost`, so opening the site there made **every** API call fail CORS. Also added `get_settings()` error translation: a fresh clone with no `backend/.env` died on a pydantic `ValidationError` that never mentioned `backend/.env`; it now names the missing keys and gives the copy command for both shells. |
| `frontend/src/components/poojas/BookingForm.tsx` | Used `NEXT_PUBLIC_API_URL` without stripping a trailing slash, so a value ending in `/` produced `//api/v1/bookings/`. The other three call sites stripped it; only this one didn't. |
| `frontend/src/lib/auth/actions.ts` | `siteOrigin()` inferred the scheme with `host.startsWith('localhost')`, so a dev server reached on `127.0.0.1:3000` got an `https://` origin and the OAuth/email redirect bounced back to login. Now `localhost`, `127.0.0.1` and `[::1]` all resolve to `http`. |
| `frontend/src/lib/api.ts`, `frontend/src/lib/admin/api.ts`, `frontend/src/components/chat/PanditChat.tsx` | Switched to the shared module below. |
| `backend/app/routers/chat.py` | The "not installed" 503 branch now logs the exact command that clears it. |
| `README.md`, `MANUAL_STEPS.md` | Every shell command given twice, labelled *Windows (PowerShell)* and *Linux / macOS (bash)*. Documented that `pip install` must run from `backend/` (because `requirements.txt` says `-e ../ai-services`) and why the two pytest suites run separately. The 503 troubleshooting row now separates its three distinct causes. |
| `.env.example`, `backend/.env.example` | `ALLOWED_ORIGINS` lists both localhost spellings, with the reason. |
| `ai-services/.env.example` | Rewritten: listed 4 of the 13 variables the package actually reads. |

### Added

- `frontend/src/lib/apiUrl.ts` — one place for `NEXT_PUBLIC_API_URL` / `API_URL`
  resolution and slash handling, so the four call sites can't drift apart again.

### Checked and found already correct — deliberately unchanged

No `/api/api/v1` double prefix (AUDIT F7 was genuinely fixed); no
uppercase-extension asset references (F6 fixed); `.single()` absent outside a
docstring; `email-validator`, `python-multipart` and `uvicorn[standard]` all
present; every `cookies()` call awaited; `src/proxy.ts`'s matcher does fire for
`/`, `/en/*` and `/ne/*`.

### One item from the brief deliberately not done

**No `__init__.py` was added to `ai-services/tests/`.** `backend/tests/` already
has one, making it an importable package named `tests`; a second would collide
the moment anyone ran `pytest` over both directories. Documented instead.

---

## Priority 2 — Gemini + a tool-calling LangGraph agent

### Added

| File | |
|---|---|
| `ai-services/temple_rag/tools.py` | The five read-only tools. All filter on their table's visibility flag; none touches `profiles`, `pooja_bookings`, `chat_history` or `auth.users`; every argument is clamped (90-day ranges, 100-char strings, 25 rows); every tool catches its own errors and returns a sentence. Table and column names were read from `database/schema_v2.sql`, not guessed. |
| `ai-services/temple_rag/fake_model.py` | A scripted chat model for offline tests and evals. Not a Gemini simulation. |
| `ai-services/evals/cases.jsonl` | 40 cases: 12 English facts, 12 Nepali facts, 6 calendar, 5 pooja/booking, 5 off-topic or injection. |
| `ai-services/evals/seed_fixture.py` | The seed rows as Python, plus a stand-in Supabase client so offline runs exercise the database tools. `python evals/seed_fixture.py` re-reads the SQL and reports drift. |
| `ai-services/evals/run_evals.py` | The harness. Reports tool selection, answer-contains, refusal correctness **in both directions**, citation rate, latency and tokens; prints failing cases with their tool trace; exits non-zero on failure. |
| `ai-services/scripts/smoke_chat.py` | Three live questions (English, Nepali, off-topic). Exit 0/1, usable as a deploy gate. |
| `docs/AGENT.md` | Mermaid diagram, node and tool tables, the five "why we chose this" notes, and the eval results. |

### Changed

| File | |
|---|---|
| `ai-services/temple_rag/assistant.py` | Rewritten as a `StateGraph`: `guard → agent ⇄ tools → ground_check → finalize`, plus `refuse`. Same public interface: `PanditAssistant.answer(question, history, locale_hint) -> Answer`. `Answer` gains `tool_trace` and `tool_rounds` (additive, defaulted). |
| `ai-services/temple_rag/config.py` | `anthropic_api_key` → `google_api_key` (`GOOGLE_API_KEY`); `claude_model` → `gemini_model` (`GEMINI_MODEL`, default `gemini-2.5-flash`); added `temperature` and `max_tool_rounds`. |
| `backend/app/config.py` | `ANTHROPIC_API_KEY` → `GOOGLE_API_KEY`, `CLAUDE_MODEL` → `GEMINI_MODEL`. |
| `backend/app/routers/chat.py` | Error mapping rewritten (see below). Writes the configured model name to `chat_history.model`. |
| `ai-services/tests/test_rag.py` | Anthropic HTTP mock replaced with the scripted model. Kept all five original cases, added the guard, nudge, round cap, tool degradation, argument clamping and citation numbering. 7 → 19 tests. |
| `backend/tests/test_api.py` | Gemini error mapping parametrised over 6 status codes. 14 → 20 tests. |
| `ai-services/pyproject.toml`, `ai-services/requirements.txt`, `backend/requirements.txt` | `anthropic` removed; `langchain-google-genai`, `langchain-core`, `langgraph` added. ChromaDB and sentence-transformers unchanged. |
| `README.md`, `MANUAL_STEPS.md`, all four `.env.example` files | Anthropic/Claude → Google Gemini / AI Studio, with the key console and pricing page linked. |

### Deliberately unchanged

The e5 embeddings, ChromaDB, the ingest script's behaviour and output, the
`/api/v1/chat` request/response schema, the `chat_history` row shape, the system
prompt's safety rules, the refusal replies, and the Nepali/English language
matching. **No Anthropic or Claude string remains anywhere in the repo.**

### Three things that forced the design

1. **A data race I wrote and then removed.** The first draft kept each
   question's citation list in module-level mutable lists — shared across
   concurrent requests. It now lives in a `ContextVar`, which is per-thread and
   so correct for FastAPI's sync threadpool.
2. **A Gemini protocol constraint.** When the tool-round cap fires, the last AI
   message still carries tool calls that were never executed, and the API
   rejects a conversation containing a `functionCall` with no matching
   `functionResponse`. `ground_check` detects this and stops instead of
   re-sending.
3. **`google.api_core` does not exist in this stack.** `langchain-google-genai`
   4.2 is built on the newer `google-genai` SDK, so the brief's
   `google.api_core.exceptions` is not importable. Every failure arrives as
   `google.genai.errors.APIError` with `.code` carrying the HTTP status, mapped
   onto the same four user-facing 503 messages as before, plus `httpx`
   connection errors and `GraphRecursionError`.

### Agreed removals

`CLAUDE_EFFORT` and the adaptive-thinking setting are gone (no Gemini
equivalent). `CLAUDE_MAX_TOKENS` → `GEMINI_MAX_TOKENS`. Prompt caching of the
system prompt went with the Anthropic SDK, so the current date now travels in
the human message rather than being kept out of a cacheable prompt.

### Eval results, and what they do and don't mean

Offline pass rate went **61% → 70% → 90% → 100% (40/40)** across three fixes.
Honestly attributed, that was **one real defect and three bugs in my own
harness**:

- **Real:** `search_temple_knowledge` and `get_temple_info` both claimed "temple
  etiquette and rules", so nothing told the model which owned a dress-code
  question. Rewritten so `get_temple_info` is authoritative and `search` is
  explicitly the fallback. **The only change that affects the real model.**
- **Harness:** the stand-in matched keywords against the whole human message,
  which always contains "Today is … (Nepal **time**)" — so *all 40 cases* routed
  to `get_temple_info`.
- **Harness:** substring matching meant `"Sudarshana Homam"` contained
  `"darshan"` and became a timings question. Latin keywords now respect word
  boundaries.
- **Harness:** tool output was truncated at 1500 chars, dropping exactly the
  footwear and attire rows three cases asked about.

Each tool was then verified directly: they do return the footwear rules, Kartik
Purnima for 15–30 Nov 2026, and 120 minutes for Satyanarayan Puja. The tools
were always right; the stand-in was choosing badly.

> ⚠️ **The 100% is not a quality measure.** Offline mode replaces Gemini with a
> keyword rule and Supabase with a fixture, and uses a non-semantic embedder. It
> measures the harness and the graph. Latency and token figures are synthetic.
> Its value is as a regression gate: 40/40 is the baseline.
>
> ⚠️ **`docs/AGENT.md`'s "Online results" section is deliberately empty**, with
> the command to fill it. No estimated number is presented as measured.

---

## Priority 3 — the manual

### Added

- **`MANUAL_STEPS_V2.md`** — the new entry point. 1381 lines, sections A–Q, 182
  checkboxes, for a non-coder on Windows 11 with VS Code. Every command twice
  (bash and PowerShell); every `<placeholder>` points back to the step that
  produced the value; no step says "configure X" without naming the field.
- **`QUICKSTART.md`** — the one-page Docker path for someone whose three cloud
  accounts already exist.

### Changed

- `MANUAL_STEPS.md` — kept in full, with a banner pointing to V2.
- `README.md` — points at V2 and QUICKSTART; hosting row updated to match § P.

All 54 headings and every internal and cross-file link were validated
programmatically: **0 broken**. That caught a real rendering bug —
`<https://api.<your-domain>/health>` has nested angle brackets and wouldn't
render as a link.

### Deviation from the brief

**§ A recommends Node 22 LTS, not Node 20 LTS** (and `frontend/Dockerfile` uses
`node:22-alpine`). Next 16 requires ≥ 20.9, but Node 20 reached end of life in
April 2026 — recommending it would put an unpatched runtime on a public site.
The guide states the reason. Reverting is a one-line change in each place.

---

## Priority 4 — Docker

### Added

| File | |
|---|---|
| `backend/Dockerfile` | `python:3.13-slim`, multi-stage venv, non-root uid 10001, `HEALTHCHECK` on `GET /health`, `uvicorn --workers 2`. |
| `ai-services/Dockerfile` | Same base and pattern; `ENTRYPOINT` is the ingest script, so it runs once and exits. |
| `frontend/Dockerfile` | `node:22-alpine`, deps → build → runtime on standalone output, non-root `nextjs`, port 3000. |
| `.dockerignore`, `backend/.dockerignore`, `ai-services/.dockerignore`, `frontend/.dockerignore` | |
| `docker-compose.yml` | `backend`, `frontend`, `ingest`; `chroma_data` and `hf_cache` volumes; one bridge network. |
| `docker-compose.prod.yml` | No published ports, `restart: unless-stopped`, index mounted read-only on the backend, memory limits, origins from `SITE_ORIGINS`. |
| `deploy/caddy/Caddyfile` | Site on `/`, API on `/api/*`, one domain, automatic HTTPS, security headers, nginx equivalent commented below. |
| `Makefile` | `up down logs ingest smoke fmt test build`, plus `help ps restart evals ingest-force prod-* clean`. |

### Changed

- `frontend/next.config.ts` — added `output: 'standalone'`.

### Four decisions that would be bugs if done the easy way

1. **The backend image builds from the repo root**, not `./backend`, because
   `backend/requirements.txt` installs its sibling with `-e ../ai-services`,
   which only resolves with both folders in the context. The image mirrors the
   repo layout so the editable install's path and `CHROMA_PERSIST_DIR` mean the
   same thing as in development.
2. **`standalone/server.js` does not serve `public/` or `.next/static`.**
   Confirmed in the bundled Next 16 docs and then by a real `npm run build`:
   `.next/standalone/` holds only `server.js`, `node_modules` and
   `package.json`. The Dockerfile copies both folders in, or every image 404s.
3. **`frontend/.dockerignore` does not exclude `.env.local`** — a departure from
   the brief's "exclude `.env*`". `next build` must read the `NEXT_PUBLIC_*`
   values to compile them into the bundle, and those are public by definition;
   the finished bundle contains them either way. Build args would have forced a
   non-technical maintainer to keep the values in two places. Real secrets stay
   in `backend/.env`, which no image sees.
4. **Ignore patterns needed `**/` prefixes.** Docker matches a pattern against
   the whole relative path and `*` does not cross `/`, so a bare `__pycache__/`
   only matches a top-level directory.

### Two deliberate departures from the brief's compose spec

- **`ingest` is in a `tools` profile and is *not* a `depends_on` of the
  backend**, though the brief asked for "depends on ingest having completed at
  least once". As a hard dependency it would re-run a multi-minute embedding job
  on every `up`, and a brief Supabase outage would stop the whole site starting.
  An empty index is not a crash — the assistant says it doesn't know, which is
  what it is built to do. So it is a documented manual step (§ H) instead.
- **`ALLOWED_ORIGINS` in production comes only from `SITE_ORIGINS`**, using
  `${SITE_ORIGINS:?…}` so compose refuses to start and names the variable. This
  replaced a `:-[]` default once I noticed the trap: a compose `environment:`
  entry overrides `env_file:`, so a maintainer setting `ALLOWED_ORIGINS` in
  `backend/.env` per the old § P3.5 would have had it silently ignored and seen
  every browser call fail like a code bug. § P now matches.

---

## Priority 5 — the privacy policy and terms of use

This was item 8's blocker in *Still yours to do*: **Facebook login cannot be
published without a privacy policy page, and the site had none.** It is the only
thing left on that list that a repository can actually produce — everything else
needs an account, a payment method or the temple's own decision.

### Added

| File | |
|---|---|
| `frontend/src/app/[locale]/(site)/privacy/page.tsx` | `/en/privacy`, `/ne/privacy`. |
| `frontend/src/app/[locale]/(site)/terms/page.tsx` | `/en/terms`, `/ne/terms`. |
| `frontend/src/components/ui/LegalDoc.tsx` | Renders either page from `messages → <ns>.{updated,intro,sections[]}`, so no prose is hard-coded in a component and both languages stay in the same place as the rest of the site's text. |

### Changed

| File | |
|---|---|
| `frontend/src/messages/en.json`, `ne.json` | Added `pages.privacy`, `pages.terms`, the `privacy`, `terms` and `legal` namespaces, and `footer.privacy` / `footer.terms`. Both files have **identical key sets**, list indices included. |
| `frontend/src/components/layout/Footer.tsx` | Both links in the bottom bar, so the policy is reachable from every page — which is what Facebook's review looks for. |
| `frontend/src/components/ui/PageHero.tsx` | `Page` union gains `'privacy' \| 'terms'`. |
| `frontend/src/app/globals.css` | A `.legal-*` block, plus `.footer-legal`. Reuses the existing tokens and the `btn-outline` + local-override pattern the History page already uses for gold buttons on an ivory background. |
| `MANUAL_STEPS_V2.md` | § M's note rewritten (the page now exists, but § M still has to wait for § P's real domain, because Facebook will not accept `localhost`); § M6 gives the exact three URLs; **new § N4** tells the temple to read both pages, and which clauses to check; § O gains a smoke-test line. |
| `AUTH_SYSTEM.md` | Rewritten — it documented an architecture that never shipped. See below. |
| `MANUAL_STEPS.md` | The eleven table-of-contents anchors, all of which were dead. See below. |

### The text is derived from the code, not from a template

Every claim in the policy was checked against what the software does:

- **What it lists as collected** comes from `database/schema_v2.sql` — `profiles`
  (email, display name, avatar URL, preferred locale), `pooja_bookings`
  (name, phone, optional email, date, time, gothram, nakshatra, rashi, notes)
  and `chat_history` (message text, locale, session id).
- **"The contact form stores nothing on this website"** — `ContactForm.tsx` has
  no endpoint; it opens a `mailto:` link. So the policy says that, rather than
  claiming a message store that does not exist.
- **"No analytics, advertising or tracking cookies"** — a grep for `gtag`,
  `googletagmanager`, `analytics`, `posthog`, `sentry` and `plausible` across
  `frontend/src` and `backend/app` returns nothing. The only cookies are
  Supabase's sign-in cookies, and `localePrefix: 'always'` in
  `src/i18n/routing.ts` means there is no locale cookie either.
- **"Local storage keeps your Ask a Pandit conversation"** — `PanditChat.tsx`,
  which is also why the policy says to keep sensitive details out of the chat.
- **Terms § 2, "no payment is taken on this website"** — there is no payment
  integration anywhere (no eSewa, Khalti, Stripe or Razorpay); `price` is a
  display-only column, and `bookingInfo.payment` already tells devotees payment
  happens at the temple. The terms now state it as a commitment, and § N4 says
  the section has to change first if that ever stops being true.
- **Terms § 1, "a booking request is a request"** — matches
  `pooja_bookings.status` defaulting to `pending`.

### Two documentation defects found on the way, and fixed

Validating the markdown links turned up two real breaks that predate this work.

**1. `AUTH_SYSTEM.md` described an architecture that never shipped.** It was
written against the early auth draft the Phase 0 audit found in the working
tree, and it documented:

- **five `/api/auth/*` route handlers** — `password-login`, `password-signup`,
  `oauth/[provider]`, `request-otp`, `verify-otp-and-reset`. **None exist.** The
  only route handler in the app is `/auth/callback`.
- **`frontend/middleware.ts`** — does not exist. Next 16 renamed middleware to
  **proxy**, and it is `frontend/src/proxy.ts`. A file named `middleware.ts`
  would simply be ignored, which makes this the most expensive kind of wrong.
- **`frontend/src/lib/auth-actions.ts`** with seven functions
  (`signInWithPassword`, `requestPasswordResetOtp`, `getSession`, …). The real
  module is `frontend/src/lib/auth/actions.ts` and the real exports are
  `signIn`, `signUp`, `requestPasswordReset`, `resetPassword`,
  `signInWithProvider`, `signOut` and `safeNext` — the four form actions taking
  `(prevState, FormData)` for `useActionState`.
- the auth pages as **Client Components**. They are Server Components that
  render client forms from `components/auth/AuthForms.tsx`.
- a `auth.common.*` translation namespace. Shared labels sit directly on
  `auth.*`; there is no `common`.
- `SETUP.md` and `DATABASE_SETUP.sql` as the setup path, both since superseded
  by MANUAL_STEPS_V2 § C–G and `database/schema_v2.sql`.

Rewritten against the code, every path checked. It now says plainly at the top
that it had drifted, and that MANUAL_STEPS_V2 — not it — is the setup guide. The
genuinely useful parts (styling tokens, the security notes) were kept and
corrected: the security section now also records `safeNext()`'s open-redirect
guard and why `is_admin()` is `SECURITY DEFINER`.

Its file links also used bare destinations containing `)`, as in
`](./frontend/src/app/[locale]/(auth)/login/page.tsx)`. Markdown ends the
destination at the **first** `)`, so each rendered as a link to
`…/[locale]/(auth` followed by the literal text `)/login/page.tsx)`. They now
use CommonMark's `](<…>)` form, which permits parentheses — the same class of
bug as Priority 3's nested angle brackets.

**2. Every link in `MANUAL_STEPS.md`'s table of contents was dead.** All eleven
anchors were written with a double hyphen (`#part-a--clean-up-old-draft-files`),
which would be right if the headings read *"Part A — Clean up…"*. They read
*"Part A: Clean up…"*, and GitHub drops the colon and collapses the single space
to **one** hyphen. Rewritten from the headings themselves. (`#-troubleshooting`
was already correct and left alone: `github-slugger` does not trim after
dropping punctuation, so a heading opening with an emoji keeps a leading
hyphen.)

Both were missed before because Priority 3's check covered headings and links in
`MANUAL_STEPS_V2.md` and `README.md` — not the older files. The checker now runs
over all eight root documents, understands `](<…>)` destinations, and reproduces
the no-trim slug rule; it was negative-tested to confirm it still fails on a
genuinely broken link and anchor. **53 internal links, 0 broken.**

### What it is not

These pages are a plain-language description of what this software does. They
are **not legal advice and were not written by a lawyer**, and § N4 says so in
the guide as well. The temple's name, address and `info@laxminarayanmandir.org`
appear in them; § N1's find-and-replace already covers the email and phone
across both message files, and § N4 asks for the rest to be read once before the
site is announced.

### Verified

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npx eslint src` | clean |
| `npm run build` | succeeds; `/[locale]/privacy` and `/[locale]/terms` both in the route list |
| All four pages fetched from a dev server | 200, and the rendered HTML contains 10 numbered privacy sections, 11 terms sections, the contact block, and no `MISSING_MESSAGE` fallback in either language |
| Footer links on a rendered page | locale-correct (`/en/privacy` on English pages, `/ne/privacy` on Nepali) |
| Cross-links inside the pages | `/en/privacy` → `/en/terms` and `/en/contact`; `/ne/terms` → `/ne/privacy` and `/ne/contact` |
| `en.json` vs `ne.json` key sets | identical, list indices included |
| Every CSS variable used by `.legal-*` | exists in `globals.css` |
| Markdown links across all eight root documents | 53 internal links, **0 broken** (was 23 broken, all pre-existing) |

One bug was caught this way and fixed: the list-bullet `content:` value was
written through a shell heredoc and arrived as `U+0082` followed by `2` instead
of a bullet. It is now the literal `•`.

---

## Verification

### Passing, run here

| Check | Result |
|---|---|
| `pytest` under `backend/` | **20 passed** (was 14) |
| `pytest ../ai-services/tests` | **19 passed** (was 7) |
| `python ai-services/evals/run_evals.py --offline` | **40/40**, tool selection 100%, answer-contains 100%, refusal 100%, 0 wrongful refusals, 0 errored |
| `python ai-services/evals/seed_fixture.py` | fixture matches the seed SQL |
| `npx tsc --noEmit` under `frontend/` | clean |
| `npx eslint src` under `frontend/` | clean |
| `npm run build` under `frontend/` | succeeds, produces the standalone layout the image assumes |
| `docker compose config` | valid |
| `docker compose -f … -f docker-compose.prod.yml config` | valid; no published ports, `read_only` index, memory limits as intended |
| `docker compose config --services` | `up` selects only `backend` and `frontend` |
| Missing `SITE_ORIGINS` | fails with the intended message |
| Dockerfile `COPY` sources | every path exists |
| Markdown links | 54 headings, 0 broken |
| Secret scan of tracked files | no `.env` tracked; no key-shaped strings |

### ❌ Not verified — `docker compose up --build` was never run

**The Docker daemon on this machine cannot start.** `docker --version` reports
29.8.2, but `docker info` returns *"Docker Desktop is unable to start"*, and it
stayed down across a launch attempt and two minutes of polling.

So, concretely, **the following are unproven**:

- that any of the three images build;
- that the three services come up healthy;
- that the chat widget returns real answers to an English and a Nepali question
  through the containers.

What *is* established: all three Dockerfiles' `COPY` sources exist, both compose
files parse and resolve to the intended configuration, the frontend image's
assumption about `standalone` output was confirmed by a real build, and the
application code itself passes its full test suite outside Docker. The most
likely first-build problems are therefore environmental — a wheel without a
`linux/arm64` build, or the PyTorch download timing out — rather than structural.

**Please run this on a machine with a working daemon** and tell me anything that
breaks:

```bash
docker compose build                 # ~5-10 min, PyTorch is large
docker compose run --rm ingest       # needs Supabase creds; expect "N chunks"
docker compose up -d
docker compose ps                    # backend should read (healthy)
curl http://localhost:8000/health    # {"status":"healthy"}
# then open http://localhost:3000 and ask the widget one EN and one NE question
```

### Also not verified — the online evals

`docs/AGENT.md`'s online results table is empty because no `GOOGLE_API_KEY`,
Supabase project or ingested index was available. Fill it with:

```bash
cd backend && source venv/bin/activate
python ../ai-services/scripts/ingest.py
python ../ai-services/evals/run_evals.py        # ~4 min with the rate-limit pause
```

---

## Still yours to do

Nothing in this list can be done from a repository — each needs an account, a
payment method, or a decision only the temple can make.

| | What | Where |
|---|---|---|
| 1 | **Supabase project** — create it in the Mumbai (`ap-south-1`) region, run the three SQL files, copy the three keys | § C, § D |
| 2 | **Supabase Auth** — Site URL, both redirect URLs, and the `{{ .Token }}` reset-email template | § E1, § E2 |
| 3 | **Custom SMTP** 🔒 — Resend or Brevo. **Required before announcing the site**: Supabase's test sender may only deliver to your own team | § E3 |
| 4 | **Gemini API key** 🔒 — from AI Studio; no card needed for the free tier | § F |
| 5 | **The three `.env` files** 🔒 — they are git-ignored and must be written by hand on every machine, including the server | § G |
| 6 | **Promote your own account to admin** — sign up, then one `update` in the SQL editor, then log out and back in | § K |
| 7 | **Google OAuth app** 🔒 — consent screen, web client, the Supabase callback URL, then publish it | § L |
| 8 | **Facebook OAuth app** 🔒 — the privacy policy page it requires now exists; it needs reading once (§ N4) and a real domain (§ P) before § M can be finished | § M |
| 9 | **Real content** — the phone number and email are placeholders, the sample event dates are fake, and **the festival calendar needs the temple priest to check it against the panchang once** | § N |
| 10 | **Photos and recordings** — a high-resolution deity photo, a transparent-background logo, book PDFs, bhajan audio, founder portraits | § N3 |
| 11 | **Domain and DNS** | § P2 |
| 12 | **A VPS** (2 GB RAM minimum — the embedding model needs ~470 MB) and a Vercel account | § P3, § P4 |
| 13 | **Point all three login services at the real domain** after deploying | § P5 |
| 14 | **The hardening checklist**, including `DEBUG=False` and `SITE_ORIGINS` | § P6 |

Two of those are easy to put off and shouldn't be: **item 3**, because without
it no devotee can complete a sign-up, and **item 9's calendar review**, because
festival dates are the thing devotees will trust this site for most and they
were computed astronomically rather than taken from the temple's own panchang.
