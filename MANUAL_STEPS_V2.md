# 🙏 Setup guide — Shree Laxminarayan Mandir website

**This is the current setup guide.** Work through it from top to bottom and you
will have the temple's website running, first on your own computer and then on
the internet.

> ⚡ **In a hurry and already have your cloud accounts?**
> → **[QUICKSTART.md](QUICKSTART.md)** gets you running in about 5 minutes.
>
> 📄 The older guide, [`MANUAL_STEPS.md`](MANUAL_STEPS.md), is kept for
> reference. Where the two disagree, **this file is right**.

## Who this is written for

Someone who has **never used a terminal**, on **Windows 11**, with
**VS Code** installed. Every command is given twice — once for **bash**
(Linux, macOS, or Git Bash on Windows) and once for **PowerShell** (the normal
Windows terminal). Use whichever matches your computer. If you're on Windows and
unsure, use the PowerShell one.

**How to read the commands.** Anything in `<angle brackets>` is a placeholder —
replace the whole thing, brackets included. So if your email is
`priest@example.com`, then `'<your-email>'` becomes `'priest@example.com'`.

**🔒 means secret.** Never paste a 🔒 value into a chat, an email, a screenshot,
or any file that isn't listed in § G. If one leaks, go back to where you created
it and generate a new one.

**A terminal in VS Code:** menu **Terminal → New Terminal**. A panel opens at
the bottom. You type a command, press `Enter`, and wait for the next prompt
before typing the following one. The **+** button opens more terminals; the
dropdown beside it lets you pick PowerShell or Git Bash.

---

## 📋 Overview

| § | What you'll do | ⏱ |
|---|---|---|
| [A](#a--install-the-prerequisites) | Install Node.js, Python, Git and Docker Desktop | 30 min |
| [B](#b--get-the-code-and-open-it-in-vs-code) | Clone the project and open it | 5 min |
| [C](#c--create-the-supabase-project) | Create the database and copy three keys | 15 min |
| [D](#d--run-the-sql-files) | Create the tables and load starter content | 10 min |
| [E](#e--configure-supabase-auth) | Site URL, redirect URLs, the 6-digit code email | 20 min |
| [F](#f--get-a-google-gemini-api-key) | A free key for "Ask the Pandit" | 10 min |
| [G](#g--fill-in-the-env-files) | Write the three settings files | 15 min |
| [H](#h--build-the-ai-knowledge-base) | Index the temple's content | 10 min |
| [I](#i--run-everything-with-docker-recommended) | **Start the site** with one command | 15 min |
| [J](#j--alternative-run-without-docker) | The three-terminal way, if Docker won't install | 25 min |
| [K](#k--make-yourself-the-admin) | Promote your own account | 5 min |
| [L](#l--set-up-google-login) | "Continue with Google" | 20 min |
| [M](#m--set-up-facebook-login) | "Continue with Facebook" | 25 min |
| [N](#n--replace-the-placeholder-content) | Put the temple's real details in | 1–2 hrs |
| [O](#o--final-smoke-test-checklist) | Check everything works | 20 min |
| [P](#p--deploy-to-production) | Domain, DNS, hosting, hardening | 2–3 hrs |
| [Q](#q--troubleshooting) | When something goes wrong | — |

**Minimum to see the site on your own computer:** A → I.
**Minimum to go live for devotees:** everything.

---

## A — Install the prerequisites

⏱ 30 min, mostly waiting for downloads. You only ever do this once.

Install all four, in any order. After each one, **close and reopen VS Code** —
otherwise it won't notice the new program.

- [ ] **A1. Git** — downloads the code and tracks changes.
  Get it from <https://git-scm.com/downloads>. Accept every default. On Windows
  this also installs **Git Bash**, which is what makes the bash commands in this
  guide work on Windows.

- [ ] **A2. Node.js 22 LTS** — runs the website.
  Get it from <https://nodejs.org> and choose the **LTS** button (not
  "Current"). Accept every default.

  > **Why 22 and not 20?** The website needs at least Node 20.9. Node 20 reached
  > its end of life in April 2026, meaning no more security updates, so 22 LTS is
  > the right choice for a site that will sit on the internet.

- [ ] **A3. Python 3.13** — runs the API and the AI.
  Get it from <https://www.python.org/downloads>.
  ⚠️ **On the very first installer screen, tick "Add python.exe to PATH"** before
  clicking Install. This is the single most common thing people miss, and
  everything later fails without it.

- [ ] **A4. Docker Desktop** — runs the whole site with one command.
  Get it from <https://www.docker.com/products/docker-desktop>. Accept the
  defaults, restart your computer when it asks, then **start Docker Desktop** and
  wait until the whale icon in the system tray stops animating.

  > On Windows it may ask to install **WSL 2**. Say yes; it handles it for you.
  > If your computer can't run Docker, skip it and use **§ J** instead.

- [ ] **A5. Check all four.** Open a terminal (**Terminal → New Terminal**) and
  run these one at a time:

  **bash**
  ```bash
  git --version
  node -v
  python3 --version
  docker --version
  ```

  **PowerShell**
  ```powershell
  git --version
  node -v
  python --version
  docker --version
  ```

  You should see four version numbers, roughly like this:

  ```
  git version 2.47.0
  v22.11.0
  Python 3.13.2
  Docker version 27.3.1, build ce12230
  ```

  **If one says "not recognized" or "command not found"**, that program didn't
  install properly, or you didn't reopen VS Code. Reopen VS Code first and try
  again. For Python on Windows, the usual cause is the missing PATH tick in A3 —
  re-run the installer, choose **Modify**, and tick it.

  > **`python` vs `python3`:** Windows installers provide `python`. macOS and
  > Linux provide `python3`. Use whichever one answers on your machine, and use
  > that same word everywhere below.

✅ **§ A done.**

---

## B — Get the code and open it in VS Code

⏱ 5 min.

- [ ] **B1.** Decide where the project will live, and go there. Your home folder
  is fine.

  **bash**
  ```bash
  cd ~
  ```

  **PowerShell**
  ```powershell
  cd $HOME
  ```

- [ ] **B2.** Download the code. Replace `<your-repo-url>` with the address of
  the repository (it looks like `https://github.com/<user>/temple-platform.git`).

  ```bash
  git clone <your-repo-url> temple-platform
  cd temple-platform
  ```

  *(This command is identical in both shells.)*

- [ ] **B3.** Open the folder in VS Code: **File → Open Folder…** → pick
  `temple-platform` → **Select Folder**. If VS Code asks *"Do you trust the
  authors of the files in this folder?"*, click **Yes, I trust the authors**.

- [ ] **B4.** Check you're in the right place. In a VS Code terminal:

  ```bash
  ls
  ```

  **PowerShell**
  ```powershell
  ls
  ```

  You should see `frontend`, `backend`, `ai-services`, `database`, `docs`,
  `README.md` and `docker-compose.yml`. If you don't, you're in the wrong folder.

✅ **§ B done.**

---

## C — Create the Supabase project

⏱ 15 min. Supabase is the database. It stores every event, pooja, booking,
photo and user account, and it handles logins.

> **Already have a project?** Skip to **C4** and just collect the keys.

- [ ] **C1.** Go to <https://supabase.com> → **Start your project** → sign in
  (GitHub or email). Use the temple's account if it has one, so the project
  doesn't belong to one volunteer personally.

- [ ] **C2.** Click **New project**.

- [ ] **C3.** Fill the form:
  - **Name**: `laxminarayan-mandir`
  - **Database Password**: click **Generate a password** and 🔒 **save it in
    your notepad**. You will almost never need it, but it cannot be shown again.
  - **Region**: **South Asia (Mumbai) `ap-south-1`** — the closest to Nepal, so
    the website feels fast for devotees in Hetauda. Choosing a far-away region is
    the single easiest way to make the site feel slow.
  - **Pricing Plan**: **Free**
  - → **Create new project**, then wait ~2 minutes while it sets up.

- [ ] **C4.** Open a **notepad** (Notepad, or a new file in VS Code — but *not*
  inside the project folder, so you can't commit it by accident). You'll collect
  three values.

- [ ] **C5.** In the Supabase sidebar, click the ⚙️ **Project Settings** gear at
  the bottom → **API Keys**. If you see a tab called **Legacy API keys**, open
  it — this project uses those.

- [ ] **C6.** Copy these three into your notepad:

  | In Supabase | Save it as | Secret? |
  |---|---|---|
  | **Project URL** (under **Data API**, or at the top of the API page). Looks like `https://abcdefgh.supabase.co` | `SUPABASE_URL` | No |
  | **anon** / **public** key — long text starting `eyJ…` | `ANON_KEY` | No — it's designed to be public |
  | **service_role** key — click **Reveal** first | `SERVICE_KEY` | 🔒 **YES. Full database access.** |

- [ ] **C7.** Also note your **project ref** — the part between `https://` and
  `.supabase.co`. For `https://abcdefgh.supabase.co` the ref is `abcdefgh`.
  Save it as `PROJECT_REF`. You need it in § L and § M.

> 🔒 **About `SERVICE_KEY`:** it bypasses every security rule in the database.
> It belongs only in `backend/.env` and `ai-services/.env`, which never leave
> your server. If it ever appears in the website's code, in a browser, or in a
> screenshot, go to **Project Settings → API Keys** and roll it immediately.

✅ **§ C done.**

---

## D — Run the SQL files

⏱ 10 min. This creates the tables and (optionally) fills them with starter
content so the site isn't empty on day one.

Run the three files **in this order**. The order matters: the second and third
add rows to tables the first one creates.

- [ ] **D1.** Supabase sidebar → **SQL Editor** → **+ New query**.

- [ ] **D2. The tables** — `database/schema_v2.sql`:
  1. In VS Code, open `database/schema_v2.sql`
  2. Click inside it, press `Ctrl+A` (select all), then `Ctrl+C` (copy)
  3. Click into the Supabase SQL box and press `Ctrl+V` (paste)
  4. Click **Run** (or press `Ctrl+Enter`)
  5. You should see **"Success. No rows returned"**

  > This file is **idempotent** — a long word meaning **it is safe to run again,
  > as many times as you like**. It only ever adds what's missing and never
  > deletes your data. If you're ever unsure whether it ran, just run it again.

- [ ] **D3. The starter content** — `database/seed.sql`. Repeat D1–D2 with this
  file. It adds sample poojas, archanas, events, books, bhajans, the three
  bundled photos, and the temple's timings and contact details.

- [ ] **D4. The festival calendar** — `database/seed_calendar.sql`. Repeat again.
  This adds festivals, Ekadashi, Purnima, Amavasya and Sankranti dates from
  September 2026 to December 2027.

- [ ] **D5. Check the tables exist.** Sidebar → **Table Editor**. You should see
  `profiles`, `events`, `poojas`, `pooja_bookings`, `archanas`, `books`,
  `bhajans`, `temple_info`, `calendar_events`, `chat_history`, `gallery`,
  `leadership` and `kb_documents`.

- [ ] **D6. Check the file storage exists.** Sidebar → **Storage**. You should
  see four buckets: `gallery`, `book-pdfs`, `bhajan-audio`, `site-media`. The SQL
  created them — there's nothing to click, just confirm they're there.

- [ ] **D7. Check the content loaded.** Sidebar → **SQL Editor** → new query:

  ```sql
  select
    (select count(*) from public.poojas)          as poojas,
    (select count(*) from public.temple_info)     as temple_info,
    (select count(*) from public.calendar_events) as calendar;
  ```

  Expect roughly `poojas 9`, `temple_info 10`, `calendar 90`. If all three are
  `0`, D3 and D4 didn't run — go back and do them.

> ⚠️ **Two things in the starter content are deliberately fake** and you must
> replace them in § N: the phone number is `+977-XXXXXXXXX`, and the sample
> **event dates are placeholders** spread over the coming months.

✅ **§ D done.**

---

## E — Configure Supabase Auth

⏱ 20 min. This makes sign-up, login and password reset work.

### E1 · Site URL and redirect URLs

- [ ] **E1.1** Sidebar → **Authentication** → **URL Configuration**.
- [ ] **E1.2** **Site URL**: type exactly `http://localhost:3000` → **Save**.
  *(You'll change this to the real domain in § P.)*
- [ ] **E1.3** Under **Redirect URLs**, click **Add URL** and add each of these,
  one at a time, saving after each:
  - `http://localhost:3000/**`
  - `http://127.0.0.1:3000/**`

  > The `/**` on the end matters — it means "any page under this address". Add
  > both spellings because a browser treats `localhost` and `127.0.0.1` as two
  > different websites, and depending on how you open the site you may get either.

### E2 · The 6-digit password-reset code

The website's "Forgot password" page asks for a **6-digit code**. Supabase
sends a clickable link by default, so you must change this one template or
password reset will not work.

- [ ] **E2.1** Sidebar → **Authentication** → **Emails** (on some screens
  **Email Templates**) → the **Reset Password** tab.

- [ ] **E2.2** Set **Subject** to:

  ```
  Your password reset code · Shree Laxminarayan Mandir
  ```

- [ ] **E2.3** Delete everything in the **Body** box and paste this instead:

  ```html
  <h2>🙏 Shree Laxminarayan Mandir</h2>
  <p>Use this code to reset your password:</p>
  <p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
  <p>The code expires in 1 hour. If you didn't ask for this, you can ignore this email.</p>
  <hr>
  <p>पासवर्ड रिसेट गर्न यो कोड प्रयोग गर्नुहोस्: <b>{{ .Token }}</b></p>
  ```

  ⚠️ **`{{ .Token }}` must be copied exactly**, including the spaces inside the
  braces and the dot before `Token`. That is the placeholder Supabase swaps for
  the real 6-digit code. If you change it even slightly, the email arrives with
  the literal text `{{ .Token }}` instead of a code.

- [ ] **E2.4** Click **Save**.

- [ ] **E2.5** *(Optional, nicer)* Open the **Confirm signup** tab and change its
  subject to `Confirm your account · Shree Laxminarayan Mandir`. **Leave the
  `{{ .ConfirmationURL }}` link in the body alone** — that one *is* meant to be a
  link.

### E3 · A real email sender

> ⚠️ **Read this before you tell any devotee about the website.** Supabase's
> built-in email sender is for testing only. It sends a handful of emails per
> hour and **may only deliver to your own team's addresses**. Real devotees
> would never receive their sign-up or password-reset emails.

You can skip E3 while testing on your own computer, but you **must** finish it
before § P.

- [ ] **E3.1** Make a free account at <https://resend.com> or
  <https://www.brevo.com>. Both free tiers are generous for a temple.
- [ ] **E3.2** In that service, add and verify the temple's domain. It walks you
  through adding a few DNS records (see § P2 for how to add DNS records).
- [ ] **E3.3** Find its **SMTP settings** and note the **host**, **port**,
  **username** and **password** 🔒.
- [ ] **E3.4** Supabase → **Authentication** → **Emails** → **SMTP Settings** →
  switch on **Enable custom SMTP** and fill in:
  - **Sender email**: `noreply@<your-domain>`
  - **Sender name**: `Shree Laxminarayan Mandir`
  - **Host**, **Port**, **Username**, **Password** 🔒 from E3.3
- [ ] **E3.5** **Save**, then use the **Send test email** button if it's offered.

✅ **§ E done.**

---

## F — Get a Google Gemini API key

⏱ 10 min. This powers **"Ask the Pandit"**, the 🙏 chat button at the
bottom-right of every page.

**What it costs:** Gemini has a **free tier** that is comfortable for a temple
website. Check <https://ai.google.dev/pricing> for the current per-minute and
per-day limits — Google changes them, so this guide deliberately doesn't quote
numbers that would go stale. The backend also caps how many questions one
visitor can ask per minute, so a single person can't burn the whole allowance.

- [ ] **F1.** Go to <https://aistudio.google.com/apikey> and sign in with a
  Google account — the temple's, if it has one.
- [ ] **F2.** Click **Create API key**.
- [ ] **F3.** If it asks for a Google Cloud project, pick any existing one or let
  it create a new one. **The free tier does not need a credit card.**
- [ ] **F4.** Copy the key. It starts with `AIza…`.
  🔒 **SECRET.** Save it in your notepad as `GOOGLE_KEY`.
- [ ] **F5.** *(Only if you later turn on billing)* At
  <https://console.cloud.google.com> → **Billing → Budgets & alerts**, set a
  small monthly budget alert so a surprise is impossible.

> 🔒 This key goes **only** in `backend/.env` and `ai-services/.env`. The
> browser never sees it: visitors' questions go to the temple's own API, which
> talks to Gemini on the server side. If it leaks, delete it in AI Studio and
> create a new one.

**Want to know how the assistant actually works?** See
[`docs/AGENT.md`](docs/AGENT.md) — it has a diagram, the list of things the
assistant is allowed to look up, and why it's built that way.

✅ **§ F done.**

---

## G — Fill in the `.env` files

⏱ 15 min. An "env file" is a plain text list of settings, one per line, as
`NAME=value`. Git is already told to ignore all three, so your secrets can never
be uploaded by accident.

There are three, and they are **not** interchangeable:

| File | Used by | Contains secrets? |
|---|---|---|
| `backend/.env` | the API and the AI assistant | 🔒 yes |
| `frontend/.env.local` | the website | no — everything in it is public |
| `ai-services/.env` | the knowledge-base indexer | 🔒 yes |

- [ ] **G1.** Create all three from the examples:

  **bash**
  ```bash
  cp backend/.env.example     backend/.env
  cp frontend/.env.example    frontend/.env.local
  cp ai-services/.env.example ai-services/.env
  ```

  **PowerShell**
  ```powershell
  Copy-Item backend\.env.example     backend\.env
  Copy-Item frontend\.env.example    frontend\.env.local
  Copy-Item ai-services\.env.example ai-services\.env
  ```

  > Note the frontend one is called `.env.local`, not `.env`. That's a Next.js
  > convention, not a typo.

### G1 · `backend/.env`

- [ ] **G1.1** Open `backend/.env` in VS Code.
- [ ] **G1.2** Make it look like this, substituting your own values from § C and § F:

  ```ini
  APP_NAME="Shree Laxminarayan Mandir API"
  APP_VERSION="1.0.0"
  DEBUG=True
  ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

  SUPABASE_URL=<SUPABASE_URL from C6>
  SUPABASE_ANON_KEY=<ANON_KEY from C6>
  SUPABASE_SERVICE_KEY=<SERVICE_KEY from C6>

  GOOGLE_API_KEY=<GOOGLE_KEY from F4>
  GEMINI_MODEL=gemini-2.5-flash
  ```

- [ ] **G1.3** Save (`Ctrl+S`).

| Setting | What it's for |
|---|---|
| `DEBUG` | `True` on your computer; **`False`** once it's online (§ P). |
| `ALLOWED_ORIGINS` | Which web addresses may call this API. Both spellings of localhost are listed because a browser treats them as different sites. You'll replace these with the real domain in § P. |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Where the database is. |
| `SUPABASE_SERVICE_KEY` 🔒 | Full database access, used **only** by the API. |
| `GOOGLE_API_KEY` 🔒 | Lets "Ask the Pandit" answer. |
| `GEMINI_MODEL` | Which model answers. `gemini-2.5-flash` is fast, cheap and has a free tier. `gemini-2.5-pro` is better on long scripture passages but costs more. The reasoning is written out in `ai-services/temple_rag/config.py`. |

### G2 · `frontend/.env.local`

- [ ] **G2.1** Open `frontend/.env.local`.
- [ ] **G2.2** Make it look like this:

  ```ini
  NEXT_PUBLIC_SUPABASE_URL=<SUPABASE_URL from C6>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY from C6>
  NEXT_PUBLIC_API_URL=http://localhost:8000
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  ```

- [ ] **G2.3** Save.

| Setting | What it's for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `…ANON_KEY` | Lets the site log people in. Safe to be public. |
| `NEXT_PUBLIC_API_URL` | Where the API is. **No `/api` on the end** — the code adds that. Putting `/api` here produces `/api/api/v1` and every page breaks. |
| `NEXT_PUBLIC_SITE_URL` | The site's own address, used to build the links in sign-up and password emails. |

> ⚠️ **Never** put `SUPABASE_SERVICE_KEY` or `GOOGLE_API_KEY` in this file.
> **Everything** beginning `NEXT_PUBLIC_` is compiled into the website and
> readable by every visitor. That prefix is a promise that the value is public.

> ⚠️ **`NEXT_PUBLIC_` values are frozen when the website is built**, not when it
> runs. If you change one, you must rebuild: `docker compose up --build`
> (§ I), or stop and restart `npm run dev` (§ J).

### G3 · `ai-services/.env`

- [ ] **G3.1** Open `ai-services/.env`. It only needs two real values:

  ```ini
  SUPABASE_URL=<SUPABASE_URL from C6>
  SUPABASE_SERVICE_KEY=<SERVICE_KEY from C6>
  ```

- [ ] **G3.2** Leave everything else commented out (the lines starting `#`). Save.

- [ ] **G4. Check nothing secret is about to be committed.**

  ```bash
  git status
  ```

  The three files you just created must **not** appear in the list. If any of
  them does, **stop** and tell a developer — the ignore rules are broken.

✅ **§ G done.**

---

## H — Build the AI knowledge base

⏱ 10 min (mostly a one-time download). This reads the temple's content out of
Supabase — timings, poojas, festivals, books — and turns it into something the
assistant can search.

**Do this after § D and § G, and before § I.**

- [ ] **H1.** Run the indexer. With Docker (recommended — nothing to install):

  ```bash
  docker compose run --rm ingest
  ```

  *(Same command in both shells. If Docker isn't working, use § J4 instead.)*

- [ ] **H2.** The first run downloads a ~470 MB language model. Expect a few
  minutes and a progress bar. Later runs take seconds.

- [ ] **H3.** **Confirm it worked.** The last line should look like:

  ```
  Done: 12 sources embedded (34 chunks), 0 unchanged, 0 removed.
  ```

  The exact numbers depend on how much content you have. What matters is that
  **chunks is not 0**. If it says `0 sources embedded (0 chunks)`, the database
  is empty — go back to § D3/D4.

- [ ] **H4. 🔁 Re-run this command whenever temple content changes** — new or
  edited poojas, timings, events, calendar dates, books or temple info.
  Otherwise the assistant keeps answering from the old information. Unchanged
  content is skipped automatically, so it's quick and safe to re-run as often as
  you like. Add `--force` to rebuild everything from scratch.

> 📚 **Teaching the assistant more:** drop the temple's own PDFs or text files
> (history, scripture notes, a FAQ) into `ai-services/knowledge_base/` and run
> H1 again. They're indexed alongside the database content.

✅ **§ H done.**

---

## I — Run everything with Docker (recommended)

⏱ 15 min the first time. This is the easiest and most reliable way: one command
starts the website, the API and the database connection together, with the right
versions of everything.

Make sure **Docker Desktop is running** (steady whale icon in the system tray).

- [ ] **I1. Start it.** From the `temple-platform` folder:

  ```bash
  docker compose up --build
  ```

  The first build takes **5–10 minutes** — it installs PyTorch, which is large.
  After that, starting takes seconds. Leave this terminal running; it shows the
  logs. To stop, click in it and press `Ctrl+C`.

- [ ] **I2. Wait for the ready lines.** Among the scrolling text, look for:

  ```
  backend-1   | Uvicorn running on http://0.0.0.0:8000
  frontend-1  | ✓ Ready in 1.2s
  ```

- [ ] **I3. Check the API is healthy.** Open <http://localhost:8000/health>. It
  should show `{"status":"healthy"}`.
  <http://localhost:8000/docs> lists every endpoint, if you're curious.

- [ ] **I4. Open the website**: <http://localhost:3000> 🎉
  Click **नेपाली** at the top to check the Nepali version.
  `http://127.0.0.1:3000` works too.

- [ ] **I5. Try the assistant.** Click the 🙏 button at the bottom-right and ask
  *"What time is morning darshan?"* You should get a real answer with a source
  listed under it.

### Everyday commands

A `Makefile` wraps the common ones. Run `make <target>` from the project folder:

| Command | What it does |
|---|---|
| `make up` | Start everything in the background |
| `make down` | Stop everything |
| `make logs` | Watch the logs (`Ctrl+C` to stop watching) |
| `make ingest` | Re-index temple content (same as § H1) |
| `make smoke` | Ask the live assistant 3 test questions |
| `make test` | Run the Python test suites |
| `make build` | Rebuild the images after a code change |

> **No `make` on Windows?** It isn't installed by default. Either use the raw
> commands below, or install it with `winget install ezwinports.make`.

The equivalents without `make`:

```bash
docker compose up -d                  # start in the background
docker compose down                   # stop
docker compose logs -f                # watch the logs
docker compose logs -f backend        # just the API's logs
docker compose run --rm ingest        # re-index
docker compose up --build             # rebuild after changing code or env files
docker compose ps                     # see what is running
```

> **The `ingest` service is meant to exit.** It does its job and stops — that's
> why `docker compose ps` won't show it running, and it isn't a fault.

✅ **§ I done.** You can skip § J entirely.

---

## J — Alternative: run without Docker

⏱ 25 min. Use this only if Docker won't install or run on your computer. You'll
need **three terminals** open at once (the **+** button in the VS Code terminal
panel).

> **PowerShell tip:** if activating the virtual environment says *"running
> scripts is disabled on this system"*, run this once and try again:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### Terminal 1 — the API

- [ ] **J1.** Run these one at a time:

  **bash**
  ```bash
  cd backend
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  uvicorn app.main:app --reload
  ```

  **PowerShell**
  ```powershell
  cd backend
  python -m venv venv
  venv\Scripts\Activate.ps1
  pip install -r requirements.txt
  uvicorn app.main:app --reload
  ```

  `venv` is a private folder of Python packages, so this project can't break
  anything else on your computer. Once it's active you'll see `(venv)` at the
  start of the line. The `pip install` step takes several minutes and only needs
  doing once.

  > ⚠️ **Stay in the `backend` folder for `pip install`.** The file refers to the
  > AI package as `-e ../ai-services`, a path that only resolves from there.

- [ ] **J2.** Check <http://localhost:8000/health> shows `{"status":"healthy"}`.
  Leave this terminal running.

### Terminal 2 — the knowledge base

- [ ] **J3.** Open a second terminal (**+**).

- [ ] **J4.** Run the indexer:

  **bash**
  ```bash
  cd backend
  source venv/bin/activate
  python ../ai-services/scripts/ingest.py
  ```

  **PowerShell**
  ```powershell
  cd backend
  venv\Scripts\Activate.ps1
  python ../ai-services/scripts/ingest.py
  ```

  Check for the `Done: … chunks` line, as in § H3. Re-run this whenever content
  changes. This terminal is then free for other commands.

### Terminal 3 — the website

- [ ] **J5.** Open a third terminal (**+**) and run:

  ```bash
  cd frontend
  npm install
  npm run dev
  ```

  *(Identical in both shells.)* `npm install` takes a few minutes the first time.

- [ ] **J6.** Open <http://localhost:3000> 🎉

**Next time** you only need two terminals:

- Terminal 1 → `cd backend`, then `source venv/bin/activate` (bash) or `venv\Scripts\Activate.ps1` (PowerShell), then `uvicorn app.main:app --reload`
- Terminal 3 → `cd frontend`, then `npm run dev`

✅ **§ J done.**

---

## K — Make yourself the admin

⏱ 5 min. Every new account starts as an ordinary devotee. For safety the
**first** admin can only be created from the Supabase dashboard — there is no
button on the website that could be abused.

- [ ] **K1.** With the site running, go to <http://localhost:3000/en/signup> and
  create an account with **your own** email address.

- [ ] **K2.** Open the confirmation email and click the link.
  *Not arriving?* Check spam. Without custom SMTP (§ E3), Supabase's test sender
  is slow and may only deliver to your own team's addresses.

- [ ] **K3.** Supabase → **SQL Editor** → **+ New query** → paste this, with
  **your** email between the quotes:

  ```sql
  update public.profiles set role = 'admin' where email = '<your-email>';
  ```

  Click **Run**. It should report **"1 row affected"** (or `UPDATE 1`).

  **If it says 0 rows:** the email doesn't match exactly. Check spelling and
  capitals, then list what's actually there:

  ```sql
  select email, role from public.profiles;
  ```

- [ ] **K4.** Confirm your row now says `admin`:

  ```sql
  select email, role from public.profiles where email = '<your-email>';
  ```

- [ ] **K5.** On the website, **log out and log back in**. The role is read when
  you log in, so without this you'll still be treated as a devotee.

- [ ] **K6.** Open <http://localhost:3000/en/admin>. You should see the **Temple
  Admin** dashboard.

> **Adding another admin later** (the temple secretary, say): they sign up
> first, then you run K3 with their email.
> **Removing an admin:** the same command with `'devotee'` in place of `'admin'`.

✅ **§ K done.**

---

## L — Set up Google login

⏱ 20 min. This adds the **"Continue with Google"** button to the login page.
It's optional — email and password already work without it.

First, write down your **callback URL**. Take `PROJECT_REF` from § C7:

```
https://<PROJECT_REF>.supabase.co/auth/v1/callback
```

So if your ref is `abcdefgh`, it's
`https://abcdefgh.supabase.co/auth/v1/callback`. Google and Supabase must agree
on this **character for character**, including `https://` and no trailing slash.

- [ ] **L1.** Go to <https://console.cloud.google.com> and sign in — ideally with
  the temple's Google account.

- [ ] **L2.** In the blue bar at the top, click the **project picker** (it says
  "Select a project" or shows a project name) → **New Project** →
  **Project name**: `Laxminarayan Mandir Website` → **Create**. Wait for the
  notification, then make sure the picker now shows that project.

- [ ] **L3.** In the search bar at the top, type **Google Auth Platform** and
  open it. On older screens this is called **APIs & Services → OAuth consent
  screen**. Click **Get started** and fill in:
  - **App name**: `Shree Laxminarayan Mandir`
  - **User support email**: pick your email from the dropdown
  - → **Next**
  - **Audience**: choose **External** → **Next**
  - **Contact Information**: your email → **Next**
  - Tick the box agreeing to the policy → **Create**

- [ ] **L4.** *(Optional)* In the left menu click **Branding** and upload the
  temple logo from `frontend/public/images/logo.png`. This is what devotees see
  on Google's "choose an account" screen.

- [ ] **L5.** Left menu → **Clients** → **+ Create client**:
  - **Application type**: **Web application**
  - **Name**: `Temple website`
  - Under **Authorised JavaScript origins**, click **+ Add URI** and enter:
    `http://localhost:3000`
  - Under **Authorised redirect URIs**, click **+ Add URI** and paste your
    callback URL from the top of this section
  - → **Create**

- [ ] **L6.** A panel shows **Client ID** and **Client secret** 🔒. Copy both
  into your notepad. You can reopen this later from **Clients** → your client,
  so it isn't a one-time reveal.

- [ ] **L7.** Go to Supabase → **Authentication** → **Sign In / Providers**
  (older screens: just **Providers**) → click **Google**:
  - Turn **Enable Sign in with Google** **on**
  - **Client ID**: paste from L6
  - **Client Secret** 🔒: paste from L6
  - → **Save**

- [ ] **L8.** Back in Google Cloud → left menu → **Audience** → **Publish app**
  → confirm.
  ⚠️ **Until you publish, only addresses you add under "Test users" can log in
  with Google.** If you'd rather stay in testing for now, add your own email
  there instead.

- [ ] **L9. Test it.** Go to <http://localhost:3000/en/login> → **Continue with
  Google** → pick your account. You should land back on the temple site, logged
  in.

  Stuck? See § Q, "Google says redirect_uri_mismatch".

✅ **§ L done.**

---

## M — Set up Facebook login

⏱ 25 min, and also optional.

> 📝 **Facebook requires a published Privacy Policy page** before this login can
> go public. The website doesn't have one yet. For now you can publish a short
> policy as a public Google Doc or Google Site — it should say what the temple
> collects (name, email, booking details), why, and how to ask for deletion. Ask
> a developer if you'd like a proper bilingual `/privacy` page added to the site.

You need the same **callback URL** as § L.

- [ ] **M1.** Go to <https://developers.facebook.com> → log in → top-right
  **My Apps** → **Create app**.

- [ ] **M2.** **App name**: `Shree Laxminarayan Mandir`, **App contact email**:
  yours → **Next**.

- [ ] **M3.** For the use case, choose **"Authenticate and request data from
  users with Facebook Login"** → **Next**. Skip the business portfolio step if
  offered → **Go to dashboard**.

- [ ] **M4.** Left menu → **Use cases** → beside *Authenticate and request
  data…* click **Customise**. In the **Permissions** list find **`email`** and
  click **Add** if it isn't already added.

- [ ] **M5.** Left menu → **Facebook Login** → **Settings**. In **Valid OAuth
  Redirect URIs**, paste your callback URL from § L → **Save changes** at the
  bottom.

- [ ] **M6.** Left menu → **App settings** → **Basic**:
  - **App ID**: copy it
  - **App secret**: click **Show**, copy it 🔒
  - **Privacy Policy URL**: the address of your policy page
  - **User data deletion**: choose **Data deletion instructions URL** and paste
    the same policy page (it must explain how to ask the temple to delete an
    account)
  - **Category**: choose something reasonable, e.g. **Lifestyle**
  - → **Save changes**

- [ ] **M7.** Supabase → **Authentication** → **Sign In / Providers** →
  **Facebook**:
  - Turn it **on**
  - **Client ID**: the **App ID** from M6
  - **Client Secret** 🔒: the **App secret** from M6
  - → **Save**

- [ ] **M8. Test it** at <http://localhost:3000/en/login>.
  ⚠️ While the app is in **Development** mode, **only you** (the app's admin) can
  log in. That's expected, not a bug.

- [ ] **M9.** When you're ready for devotees: in the Facebook app dashboard,
  switch **App Mode** from **Development** to **Live** (top bar). Facebook may
  require you to complete a checklist first — the Privacy Policy URL is the
  usual blocker.

✅ **§ M done.**

---

## N — Replace the placeholder content

⏱ 1–2 hrs. Almost all of this happens in the **admin dashboard** at
`/en/admin`, with no code. Changes appear on the public site immediately, in
both languages.

> **Log in to the admin dashboard:** go to <http://localhost:3000/en/login>,
> sign in with the account you promoted in § K, then open
> <http://localhost:3000/en/admin>. If you're bounced back to the home page, you
> haven't logged out and in again since § K3.

### N1 · The two fake details you must replace

The starter content ships with a placeholder phone number and email.

- [ ] **N1.1** In VS Code press `Ctrl+Shift+H` (**Replace in Files**).
- [ ] **N1.2** Search for `+977-XXXXXXXXX` and replace with the temple's real
  number, e.g. `+977-57-520000` → click **Replace All**. This updates both
  `frontend/src/messages/en.json` and `ne.json`.
- [ ] **N1.3** Search for `info@laxminarayanmandir.org` and replace with the real
  address (or delete those lines if the temple has no email).
- [ ] **N1.4** **Also change them in the database**, which is what the AI reads:
  **Admin → Temple info** → edit `contact.phone` and `contact.email`.
- [ ] **N1.5** Re-run the knowledge base (§ H1) so "Ask the Pandit" stops quoting
  the placeholder.

### N2 · In the admin dashboard

| Section | What to check | Why it matters |
|---|---|---|
| **Temple info** | Timings, address, phone, email, booking policy, what to bring | "Ask the Pandit" answers from here, so wrong data here means wrong answers |
| **Events** | ⚠️ The sample events have **placeholder dates**. Replace with the real programme, or hide them | Devotees will turn up on the wrong day |
| **Calendar** | The festival/Ekadashi/Purnima dates were computed astronomically for Hetauda. **Ask the temple priest to check them once** against the temple's own panchang | Festival dates are the thing devotees trust the site for most |
| **Poojas** / **Archanas** | Names, prices in NPR, durations. These came from the old mock-up | People will arrive expecting the listed price |
| **Founders & leadership** | Add photos, names in English *and* Nepali, short bios | The History page shows an empty message until you do |
| **Gallery** | Upload real photos. Only 3 ship with the site | |
| **Books** | Upload a PDF for each book | Until then each shows "PDF coming soon" |
| **Bhajans** | Upload the MP3 for each bhajan | Until then each shows "audio coming soon" |

- [ ] **N2.1** Work down that table.
- [ ] **N2.2** After any significant content change, **re-run § H1**.

### N3 · Files only the temple can provide

These can't come from code — they need real photos and recordings.

| What | Where it appears | How to replace |
|---|---|---|
| **High-resolution deity photo**, 1920 px wide or more | The large background at the top of the home page, and the About section | Replace `frontend/public/images/deity.jpg`. ⚠️ Keep the exact filename, **lower-case `.jpg`** |
| **Temple logo**, PNG with a transparent background | Header, footer, login pages | Replace `frontend/public/images/logo.png`. The current one has a white box behind it |
| `altar.jpg` | The wide "Sacred Sanctum" strip on the home page | Replace with a better photo, same filename |
| `interior.jpg` | One of the 3 starter gallery photos | Upload better ones in **Admin → Gallery** and hide the starters |
| **Event photos** | Event cards (they currently show an emoji) | **Admin → Events** → each event → image |
| **Portraits of founders / leaders** | History page | **Admin → Founders & leadership** |
| **Book PDFs, bhajan recordings** | Books / Bhajans pages | **Admin → Books / Bhajans** |

> ⚠️ **Filenames are case-sensitive once the site is online**, even though
> Windows ignores case. `Deity.JPG` will work on your computer and show a broken
> image on the real website. Always use lower-case names and extensions.

> 🖼 Pooja and service cards deliberately use icons (🪔 💧 🔥) rather than
> photos. That's a design choice, not a missing file.

✅ **§ N done.**

---

## O — Final smoke test checklist

⏱ 20 min. Do this on your own computer now, and **again** after § P on the real
address. Tick every box.

### Both languages

- [ ] Every menu page opens: Home, Events, Calendar, Poojas, Book Pooja, Books, Bhajans, Gallery, History, Contact
- [ ] The **EN ⇄ नेपाली** switch works on every one of those pages
- [ ] On Nepali pages, numbers appear as Devanagari digits (`०१२३`), not `0123`
- [ ] No page shows a stray English sentence on the Nepali side
- [ ] Calendar: **‹ ›** change the month, **Today** jumps back, and the **Bikram Sambat / Gregorian** toggle works
- [ ] Gallery: clicking a photo opens it large; arrow keys and swiping move between photos

### Phone and desktop widths

- [ ] On a real phone: connect to the same Wi-Fi and open `http://<your-computer-IP>:3000`
      *(find the IP with `ipconfig` on PowerShell, or `ip addr` on bash — look for something like `192.168.1.x`)*
- [ ] Or in Chrome: press `F12`, then the 📱 icon, and choose a phone size
- [ ] At phone width: nothing is cut off, no sideways scrolling of the whole page, and the menu tabs scroll sideways by themselves
- [ ] At desktop width: the layout fills the screen without a huge empty gap

### The chat widget

- [ ] The 🙏 button appears at the bottom-right of every public page
- [ ] Ask *"What are the darshan timings?"* → a correct answer, with a source listed beneath it
- [ ] Ask in Nepali, *"दर्शनको समय कति हो?"* → **it answers in Nepali**
- [ ] Ask *"How much is Abhishekam?"* → the price matching **Admin → Poojas**
- [ ] Ask something unrelated, e.g. *"Who won the cricket match?"* → it politely declines and offers to help with temple topics instead
- [ ] Ask something it can't know, e.g. *"What is the head priest's phone number?"* → it says it doesn't have that and suggests contacting the temple. **It must not invent one.**

### Booking

- [ ] Book a pooja as an ordinary visitor → you see **"Booking Received"**
- [ ] **Admin → Bookings** → it appears under **Pending**
- [ ] Click **Confirm** → it moves to **Confirmed**
- [ ] Try to submit the form with the phone number blank → it refuses, with a readable message
- [ ] Try to book a date in the past → it refuses

### Accounts

- [ ] Sign up with a fresh email → the confirmation email arrives → the link logs you in
- [ ] **Forgot password** → the email contains a **6-digit code**, not a link → the code plus a new password works
- [ ] Log in with **Google** (§ L)
- [ ] Log in with **Facebook** (§ M)
- [ ] An ordinary non-admin account opening `/en/admin` is sent back to the home page
- [ ] Log out works, and afterwards `/en/admin` sends you to the login page

### Automated checks

Run these too — they catch things clicking around won't:

**bash**
```bash
cd backend && source venv/bin/activate
python -m pytest                        # the API tests
python -m pytest ../ai-services/tests   # the AI pipeline tests
python ../ai-services/scripts/smoke_chat.py   # 3 live questions
cd ../frontend && npx tsc --noEmit && npx eslint src
```

**PowerShell**
```powershell
cd backend; venv\Scripts\Activate.ps1
python -m pytest
python -m pytest ../ai-services/tests
python ../ai-services/scripts/smoke_chat.py
cd ..\frontend; npx tsc --noEmit; npx eslint src
```

Or, with Docker: `make test` and `make smoke`.

> Run the two `pytest` commands separately rather than one `pytest` over the
> whole project. Both test folders would otherwise clash on the name `tests`.

✅ **§ O done.**

---

## P — Deploy to production

⏱ 2–3 hrs. This puts the site on a real address that devotees can visit.

**The shape of it:** the website goes on **Vercel** (free, fast, built for
Next.js). The API and the AI indexer go on a small **VPS** running Docker
Compose, because the AI needs ~1 GB of RAM and a persistent disk for its index —
more than a free serverless host allows.

### P1 · Put the code on GitHub

- [ ] **P1.1** Create a **private** repository at <https://github.com/new>.
      Private matters: the repo contains your deployment config.
- [ ] **P1.2** Push the code:

  ```bash
  git remote add origin https://github.com/<user>/<repo>.git
  git branch -M main
  git push -u origin main
  ```

- [ ] **P1.3** **Confirm no secrets went up.** On GitHub, browse the repo and
  check there is **no** `backend/.env`, `frontend/.env.local` or
  `ai-services/.env`. Only the `.env.example` files should be there. If a real
  one is present, treat every key in it as compromised: roll the Supabase
  service key and the Gemini key immediately.

### P2 · A domain name and DNS

- [ ] **P2.1** Buy a domain from any registrar (Namecheap, Cloudflare,
      GoDaddy…). Something like `laxminarayanmandir.org`.
- [ ] **P2.2** You'll add two DNS records. "DNS records" are the phone book that
      turns a name into a server. In your registrar's **DNS** panel:

  | Type | Name | Value | Purpose |
  |---|---|---|---|
  | `A` | `api` | `<your-VPS-IP>` | `api.<your-domain>` → the API |
  | `CNAME` | `www` | `cname.vercel-dns.com` | `www.<your-domain>` → the website |

  Vercel will tell you exactly what to add for the root domain in P4. DNS
  changes can take anything from a minute to a few hours to take effect.

### P3 · The API on a VPS

Any provider works — Hetzner, DigitalOcean, Vultr, Linode. **2 GB of RAM
minimum**, because the embedding model needs about 470 MB and PyTorch needs room
to load.

- [ ] **P3.1** Create an Ubuntu 24.04 server. Save its IP address.
- [ ] **P3.2** Connect to it: `ssh root@<your-VPS-IP>`
- [ ] **P3.3** Install Docker:

  ```bash
  curl -fsSL https://get.docker.com | sh
  ```

- [ ] **P3.4** Get the code onto it:

  ```bash
  git clone https://github.com/<user>/<repo>.git temple-platform
  cd temple-platform
  ```

- [ ] **P3.5** Create `backend/.env` on the server — with production values this
  time. Note the three differences from § G:

  ```ini
  DEBUG=False

  SUPABASE_URL=<SUPABASE_URL>
  SUPABASE_ANON_KEY=<ANON_KEY>
  SUPABASE_SERVICE_KEY=<SERVICE_KEY>

  GOOGLE_API_KEY=<GOOGLE_KEY>
  GEMINI_MODEL=gemini-2.5-flash
  ```

  ⚠️ **Note there is no `ALLOWED_ORIGINS` line here.** In production that comes
  from the `SITE_ORIGINS` shell variable instead, because
  `docker-compose.prod.yml` sets it explicitly and a compose `environment:` entry
  always overrides `env_file:` — so a value in this file would be silently
  ignored. Set it in the shell before starting:

  ```bash
  export SITE_ORIGINS='["https://<your-domain>","https://www.<your-domain>"]'
  ```

  To make that survive a reboot, add the same line to the end of
  `/root/.bashrc` (or `/etc/environment`, without the `export`).

  Compose **refuses to start** and names the variable if you forget it. That's
  deliberate: a default would either block every browser with a CORS error that
  looks like a code bug, or quietly leave localhost allowed in production.

- [ ] **P3.6** Create `ai-services/.env` with `SUPABASE_URL` and
  `SUPABASE_SERVICE_KEY`.

- [ ] **P3.7** Build the index, then start the API:

  ```bash
  export SITE_ORIGINS='["https://<your-domain>","https://www.<your-domain>"]'
  docker compose run --rm ingest
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend
  ```

  Only `backend` is started here: the website itself is served by Vercel
  (§ P4), so the `frontend` service stays unused on this machine.

  The second file is the production overlay: it restarts containers
  automatically, stops exposing ports directly to the internet, and mounts the
  AI index read-only.

- [ ] **P3.8** Put HTTPS in front of it. The repo ships a Caddy config at
  `deploy/caddy/Caddyfile`, which gets and renews certificates by itself. Edit it
  to use your domain, then start it as described in the comments at the top of
  that file.

- [ ] **P3.9** Check `https://api.<your-domain>/health` returns
  `{"status":"healthy"}` — over **https**, with no browser warning.

- [ ] **P3.10** Schedule the re-index so the assistant doesn't go stale. On the
  VPS run `crontab -e` and add:

  ```cron
  0 3 * * * cd /root/temple-platform && docker compose run --rm ingest >> /var/log/temple-ingest.log 2>&1
  ```

  That re-indexes at 3 a.m. daily. Admins who change content and want it
  reflected sooner can still run `make ingest`.

### P4 · The website on Vercel

- [ ] **P4.1** Go to <https://vercel.com> → sign in with GitHub → **Add New…** →
  **Project** → pick your repository.
- [ ] **P4.2** **Root Directory**: set it to **`frontend`**. This is essential —
  the repo has several folders and Vercel defaults to the top one.
- [ ] **P4.3** Framework Preset should auto-detect **Next.js**. Leave the build
  settings alone.
- [ ] **P4.4** Open **Environment Variables** and add all four:

  | Name | Value |
  |---|---|
  | `NEXT_PUBLIC_SUPABASE_URL` | `https://<PROJECT_REF>.supabase.co` |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your `ANON_KEY` |
  | `NEXT_PUBLIC_API_URL` | `https://api.<your-domain>` |
  | `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` |

  ⚠️ **No `/api` on the end of `NEXT_PUBLIC_API_URL`.** And do **not** add
  `SUPABASE_SERVICE_KEY` or `GOOGLE_API_KEY` here — the website never needs them,
  and anything with the `NEXT_PUBLIC_` prefix is visible to every visitor.

- [ ] **P4.5** **Deploy**, and wait a few minutes.
- [ ] **P4.6** **Settings → Domains** → add `<your-domain>` and
  `www.<your-domain>`. Vercel shows the exact DNS record to add; put it in your
  registrar (§ P2) and wait for the green tick.

  > ⚠️ **If you change any `NEXT_PUBLIC_` value later, you must redeploy.** They
  > are baked in at build time, so editing the variable alone changes nothing.
  > Vercel → **Deployments** → ⋯ → **Redeploy**.

### P5 · Point the login services at the real address

Everything was configured for `localhost`. Update all three:

- [ ] **P5.1 Supabase** → **Authentication** → **URL Configuration**:
  - **Site URL** → `https://<your-domain>`
  - **Redirect URLs** → add `https://<your-domain>/**` and
    `https://www.<your-domain>/**`. Keep the localhost ones so you can still
    develop.
- [ ] **P5.2 Google** (§ L5) → your client → **Authorised JavaScript origins** →
  add `https://<your-domain>`. The redirect URI stays the Supabase callback.
- [ ] **P5.3 Facebook** (§ M6) → **App settings → Basic** → **App Domains** →
  add `<your-domain>`. Switch the app to **Live** (§ M9).
- [ ] **P5.4** Confirm custom SMTP (§ E3) is on, or no devotee will receive a
  sign-up email.

### P6 · Hardening checklist

Tick every one before you announce the site.

- [ ] **The service key is not in the frontend.** In Vercel's env vars, confirm
  there is no `SUPABASE_SERVICE_KEY` and no `GOOGLE_API_KEY`. Then open the live
  site, press `F12` → **Network**, reload, and search the responses for the first
  few characters of your service key. Zero matches.
- [ ] **CORS is tight.** `ALLOWED_ORIGINS` on the VPS lists only your real
  domain(s) (§ P3.5). Check with:
  `curl -H "Origin: https://evil.example" -I https://api.<your-domain>/health`
  — the response must not echo that origin back.
- [ ] **`DEBUG=False`** in the server's `backend/.env`.
- [ ] **HTTPS everywhere.** Both `https://<your-domain>` and
  `https://api.<your-domain>` load with no warning. No page mixes in `http://`
  resources.
- [ ] **Rate limits work.** Ask the chat widget 10 questions quickly; around the
  9th you should be asked to wait. (Defaults: 8/minute, 150/day per visitor.
  Tune with `CHAT_PER_MINUTE` / `CHAT_PER_DAY`.)
- [ ] **Admin is locked down.** A logged-out visitor opening
  `https://<your-domain>/en/admin` goes to the login page; a logged-in
  non-admin goes to the home page.
- [ ] **Writes need an admin.** This must fail with 401 or 403:
  `curl -X POST https://api.<your-domain>/api/v1/events/ -H "Content-Type: application/json" -d '{}'`
- [ ] **Only expected keys exist.** Supabase → **Project Settings → API Keys**,
  and AI Studio → your keys. Delete anything you don't recognise.
- [ ] **Backups.** Supabase → **Database → Backups** on a paid plan, or export
  the important tables as CSV from the Table Editor now and then.
- [ ] **Re-run the whole of § O** against the live address.

### P7 · After launch

- [ ] Supabase free projects **pause after a week with no activity**. A live
  temple site gets daily visits so this is unlikely, but keep an eye on it.
- [ ] Check Gemini usage occasionally at <https://aistudio.google.com> → your key
  → **Usage**.
- [ ] Each year, add the next year's festival dates (**Admin → Calendar**), then
  re-run the index (§ H1).
- [ ] Keep the server patched: `ssh` in and run
  `apt update && apt upgrade -y` every month or so.

🎉 **Done. Jai Shree Laxminarayan!**

---

## Q — Troubleshooting

### "The backend won't start"

| What you see | Cause → fix |
|---|---|
| `Missing required settings: SUPABASE_URL, …` | `backend/.env` doesn't exist or is missing those lines. Redo § G1. |
| `ModuleNotFoundError: No module named 'app'` | You're in the wrong folder. `cd backend` first. |
| `ModuleNotFoundError: No module named 'fastapi'` | The virtual environment isn't active — you should see `(venv)`. Re-run the activate line from § J1. |
| `ERROR: Could not open requirements file` | You ran `pip install` from the wrong folder. It must be run from inside `backend`. |
| `error: Microsoft Visual C++ 14.0 or greater is required` | A Python package needs a compiler. Install the "Desktop development with C++" workload from Visual Studio Build Tools — or just use Docker (§ I) and skip the problem. |
| `address already in use` / `port is already allocated` | Something else is on port 8000. Close the other terminal running it, or change the port. |
| Docker: `Cannot connect to the Docker daemon` | Docker Desktop isn't running. Start it and wait for the whale to stop animating. |

### "The chat returns 503"

The API log says which of three causes it is — `docker compose logs backend`, or
look at Terminal 1.

| In the log | Fix |
|---|---|
| `not configured (GOOGLE_API_KEY missing)` | Add `GOOGLE_API_KEY` to `backend/.env` (§ F, § G1) and **restart the backend** — the key is read once at startup. |
| `not installed on this server` | The AI package isn't in the environment. `cd backend` then `pip install -r requirements.txt`. Check with `python -c "import temple_rag"`, which should print nothing at all. With Docker, run `docker compose up --build`. |
| `rate limit` / `quota` | You've hit the Gemini free-tier limit. Wait a minute. See <https://ai.google.dev/pricing>. |
| `rejected the API key` | The key is wrong, revoked, or has a typo (watch for a trailing space). Make a new one in AI Studio. |
| `Couldn't reach the AI service` | The server has no internet, or a firewall blocks it. |

### "The assistant says 'I don't have that information' about everything"

The knowledge base is empty or stale.

- [ ] Run § H1 and check the `Done: … chunks` line says more than 0 chunks.
- [ ] If it says `0 sources`, the database has no content — redo § D3/D4.
- [ ] If you just edited content in the admin dashboard, that's expected until
      you re-run § H1.

> This behaviour is deliberate. The assistant is built to say "I don't know"
> rather than guess, because a confident wrong answer about a festival date is
> worse than no answer. See [`docs/AGENT.md`](docs/AGENT.md).

### "Nepali text shows as English"

| Check | Fix |
|---|---|
| Is the address `/ne/…`? | Click **नेपाली** in the header, or go to <http://localhost:3000/ne> directly. |
| Only *some* text is English? | Database content has an empty `_ne` field. Fill in the Nepali column in **Admin**. |
| Numbers show `0123` instead of `०१२३`? | A real bug — report it with the page address. |
| The assistant replies in English to a Nepali question? | It matches the language of your message. Type in Devanagari rather than romanised Nepali. |

### "OAuth loops back to the login page"

Almost always a URL mismatch. In order of likelihood:

- [ ] The provider isn't switched **on** in Supabase → **Authentication →
      Sign In / Providers**.
- [ ] The Client ID or Secret was pasted with a leading/trailing space. Re-paste
      both.
- [ ] The redirect URI in Google/Facebook isn't **exactly**
      `https://<PROJECT_REF>.supabase.co/auth/v1/callback` — no trailing slash,
      `https` not `http`, correct project ref.
- [ ] The address you're browsing isn't in Supabase's **Redirect URLs**. If you
      opened the site on `127.0.0.1:3000`, add `http://127.0.0.1:3000/**`
      (§ E1.3) — or just use `localhost`.
- [ ] Google: the app is unpublished and your email isn't a **Test user** (§ L8).
- [ ] Facebook: the app is in **Development** mode, so only its admin can log in
      (§ M8).
- [ ] After going live: you skipped § P5.

**`redirect_uri_mismatch` from Google** means exactly this: the URI Google
received isn't on its allowed list. Google's error page shows the URI it got —
copy that exact string into **Authorised redirect URIs** (§ L5).

### "Images 404 on Vercel but work on my computer"

**Filenames are case-sensitive on the server; Windows ignores case.** So
`deity.JPG` works locally and 404s online.

- [ ] Use lower-case names and extensions: `deity.jpg`, not `Deity.JPG`.
- [ ] Renaming only the case needs two steps in git, because git also ignores
      case on Windows:

  ```bash
  git mv frontend/public/images/Deity.JPG frontend/public/images/temp.jpg
  git mv frontend/public/images/temp.jpg frontend/public/images/deity.jpg
  ```

- [ ] Check the reference matches the file exactly, including the folder.
- [ ] For admin-uploaded photos, a 404 instead means the Storage bucket isn't
      public — re-run `database/schema_v2.sql` (§ D2), which sets that up.

### "The ingest step runs out of memory"

The embedding model needs roughly 470 MB, plus room for PyTorch.

- [ ] On a VPS, use at least **2 GB of RAM**.
- [ ] If it's killed with no message (exit code 137), that's the out-of-memory
      killer. Add swap:

  ```bash
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ```

- [ ] Index in smaller pieces: `python ai-services/scripts/ingest.py --files-only`
      handles just the files in `knowledge_base/`.
- [ ] A very large book PDF is the usual culprit. Remove it, confirm the rest
      works, then add it back on its own.
- [ ] Docker Desktop on Windows: **Settings → Resources** → give it more memory.

### Still stuck?

Note the **section number** (e.g. "L5"), the **exact error text**, and whether
you used the bash or PowerShell command. That's almost always enough to identify
the problem quickly.
