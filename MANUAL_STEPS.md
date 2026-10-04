# 🙏 Manual Steps: Your Setup Guide

This guide covers **everything only you can do**: clicking through websites, creating accounts, and pasting keys.
The code is finished. These steps connect it to the real world.

**How to use this guide**

- Do the parts **in order**. Each part assumes the earlier ones are done.
- Tick each box `[ ]` as you go. On GitHub you can tick them right on the page, or edit this file in VS Code and change `[ ]` to `[x]`.
- `Text like this` is something you **type or copy exactly**.
- Anything in **`<angle brackets>`** is a placeholder. Replace the whole thing, brackets included, with your own value.
  Example: `<your-email>` → `ram@gmail.com`
- ⏱ shows roughly how long each part takes.

> **Keep a notepad open.** Several steps give you a key that a later step needs. Write each one down as you get it.
> **Never** share the keys marked 🔒 SECRET, and never put them in the `frontend` folder or in a screenshot.

---

## 📋 Overview

| Part | What you'll do | ⏱ |
|---|---|---|
| [A](#part-a--clean-up-old-draft-files) | Delete 3 old draft files | 2 min |
| [B](#part-b--set-up-supabase-database--logins) | Set up Supabase (database, logins, emails) | 30 min |
| [C](#part-c--get-an-anthropic-api-key-for-ask-the-pandit) | Get an Anthropic (Claude) key for "Ask the Pandit" | 10 min |
| [D](#part-d--fill-in-the-environment-files) | Paste all keys into the two settings files | 10 min |
| [E](#part-e--run-the-website-on-your-computer) | Run the website on your computer | 20 min |
| [F](#part-f--make-yourself-the-admin) | Make your own account the admin | 5 min |
| [G](#part-g--google-login) | Turn on "Continue with Google" | 20 min |
| [H](#part-h--facebook-login) | Turn on "Continue with Facebook" | 25 min |
| [I](#part-i--replace-placeholder-content-with-the-temples-real-details) | Replace placeholder details with the temple's real ones | 1–2 hrs |
| [J](#part-j--final-test-checklist) | Final test checklist | 20 min |
| [K](#part-k--put-the-website-online-deployment) | Put the website online (deployment) | 1–2 hrs |
| [—](#-troubleshooting) | Troubleshooting | — |

---

## Part A: Clean up old draft files

⏱ 2 min

Three files in the main project folder are **old drafts from before this project was rebuilt**. They are out of date, and `DATABASE_SETUP.sql` contains **security holes**: it would let any visitor make themselves an admin.

- [ ] **A1.** In the `temple-platform` folder, delete these three files:
  - `DATABASE_SETUP.sql`: replaced by `database/schema_v2.sql`
  - `AUTH_SYSTEM.md`: replaced by the auth code itself and this guide
  - `SETUP.md`: replaced by this guide

> ⚠️ **Never run `DATABASE_SETUP.sql`**, even by accident. If you ran it in the past, that's fine: Part B fixes it automatically.

---

## Part B: Set up Supabase (database + logins)

⏱ 30 min. Supabase stores all the temple's data (events, poojas, bookings, photos) and handles logins.

### B1. Get your project keys

You already have a Supabase project. If you ever need a new one: [supabase.com](https://supabase.com) → **New project** → choose the region **closest to Nepal** (e.g. *Mumbai* / `ap-south-1`).

- [ ] **B1.1** Open [supabase.com/dashboard](https://supabase.com/dashboard) and click your temple project.
- [ ] **B1.2** In the left sidebar, click the ⚙️ **Project Settings** gear (bottom) → **API Keys**.
  If you see a tab called **Legacy API keys**, open it. This project uses those keys.
- [ ] **B1.3** Copy these three values into your notepad:

  | Name in Supabase | Write it down as | Secret? |
  |---|---|---|
  | **Project URL** (Project Settings → **Data API**, or at the top of the API page). Looks like `https://abcdefgh.supabase.co` | `SUPABASE_URL` | No |
  | **anon** / **public** key (long text starting `eyJ…`) | `ANON_KEY` | No (safe in the browser) |
  | **service_role** key (click *Reveal*) | `SERVICE_KEY` | 🔒 **SECRET** |

  The part between `https://` and `.supabase.co` is your **project ref** (e.g. `abcdefgh`). You'll need it in Parts G and H.

### B2. Create the database tables

- [ ] **B2.1** Left sidebar → **SQL Editor** → **+ New query**.
- [ ] **B2.2** In VS Code, open `database/schema_v2.sql`, select everything (`Ctrl+A`), copy (`Ctrl+C`), and paste it into the Supabase SQL editor.
- [ ] **B2.3** Click **Run** (or press `Ctrl+Enter`). You should see **"Success. No rows returned"**.
  *This is safe to run more than once, and it never deletes existing data.*
- [ ] **B2.4** *(Recommended)* Load the starter content so the site isn't empty on day one. Repeat B2.1–B2.3 with:
  1. `database/seed.sql`: sample events, poojas, books, bhajans, the 3 bundled photos, and temple info
  2. `database/seed_calendar.sql`: festivals, Ekadashi, Purnima, etc. from Sept 2026 to Dec 2027
- [ ] **B2.5** Check: left sidebar → **Table Editor**. You should see tables such as `events`, `poojas`, `profiles`, `gallery`, `leadership`, and `calendar_events`.
- [ ] **B2.6** Check the photo storage: left sidebar → **Storage**. You should see 4 buckets: `gallery`, `book-pdfs`, `bhajan-audio`, `site-media`. *(The SQL created them for you. There's nothing to click here, just confirm they exist.)*

### B3. Tell Supabase where your website lives

- [ ] **B3.1** Left sidebar → **Authentication** → **URL Configuration**.
- [ ] **B3.2** **Site URL**: `http://localhost:3000` → **Save**. *(You'll change this to the real domain in Part K.)*
- [ ] **B3.3** Under **Redirect URLs** → **Add URL** → `http://localhost:3000/**` → **Save**.

### B4. Make the password-reset email send a 6-digit code

The "Forgot password" page asks the visitor to type a **6-digit code**. Supabase's default email sends a link instead, so you need to change that one template.

- [ ] **B4.1** Left sidebar → **Authentication** → **Emails** (it may be called **Email Templates**) → **Reset Password** tab.
- [ ] **B4.2** **Subject**: `Your password reset code · Shree Laxminarayan Mandir`
- [ ] **B4.3** Replace the whole **Body** with:

  ```html
  <h2>🙏 Shree Laxminarayan Mandir</h2>
  <p>Use this code to reset your password:</p>
  <p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
  <p>The code expires in 1 hour. If you didn't ask for this, you can ignore this email.</p>
  <hr>
  <p>पासवर्ड रिसेट गर्न यो कोड प्रयोग गर्नुहोस्: <b>{{ .Token }}</b></p>
  ```

  `{{ .Token }}` is the important part. Keep it exactly as written.
- [ ] **B4.4** **Save**.
- [ ] **B4.5** *(Optional, makes it look nicer)* In the **Confirm signup** tab, change the subject to `Confirm your account · Shree Laxminarayan Mandir`. **Keep** the `{{ .ConfirmationURL }}` link in the body.

### B5. Set up a real email sender (needed before devotees can sign up)

> ⚠️ **Important for a real temple:** Supabase's built-in email sender is only for testing. It sends just a few emails per hour, and **may only deliver to your own team's addresses**. Real devotees wouldn't receive their sign-up or password emails. Do this before you announce the website.

You can skip B5 while testing on your own computer, but finish it before Part K.

- [ ] **B5.1** Create a free account with an email-sending service. [Resend](https://resend.com) and [Brevo](https://www.brevo.com) both have free plans that are plenty for a temple.
- [ ] **B5.2** In that service, add and verify your domain (it walks you through adding a few DNS records). Then find its **SMTP settings**: host, port, username, password.
- [ ] **B5.3** Supabase → **Authentication** → **Emails** → **SMTP Settings** → turn on **Enable custom SMTP** and fill in:
  - **Sender email**: e.g. `noreply@<your-domain>`
  - **Sender name**: `Shree Laxminarayan Mandir`
  - **Host / Port / Username / Password**: from B5.2
- [ ] **B5.4** **Save**.

✅ **Part B done.**

---

## Part C: Get an Anthropic API key for "Ask the Pandit"

⏱ 10 min. "Ask the Pandit" is the AI chat button at the bottom-right of every page. It uses Anthropic's Claude.

**Cost:** about **NPR 1 per answer** (≈ $0.007). A $10 credit covers roughly 1,400 questions. The backend also limits how many questions one person can ask per minute, so nobody can run up a bill.

- [ ] **C1.** Go to [console.anthropic.com](https://console.anthropic.com) and sign up. Use the temple's email if it has one.
- [ ] **C2.** **Settings → Billing**: add a payment card and buy a small amount of credit (e.g. **$10**). This is prepaid, so it can never charge more than you load.
- [ ] **C3.** *(Recommended)* **Settings → Limits**: set a **monthly spend limit** (e.g. $10) as an extra safety net.
- [ ] **C4.** **Settings → API Keys → Create Key**. Name it `temple-website`. Copy the key (starts with `sk-ant-…`).
  🔒 **SECRET.** It's shown only once. Write it in your notepad as `ANTHROPIC_KEY`.

> The key goes **only** in `backend/.env` (next part). The website never sends it to visitors' browsers.

✅ **Part C done.**

---

## Part D: Fill in the environment files

⏱ 10 min. "Environment files" are small settings files holding the keys from Parts B and C. Git ignores them on purpose, so your secrets never get uploaded to GitHub.

### D1. Backend settings: `backend/.env`

This file already exists from earlier work. It still contains an old `GEMINI_API_KEY` line that is no longer used.

- [ ] **D1.1** Open `backend/.env` in VS Code.
- [ ] **D1.2** Make it look like this, using your own values:

  ```ini
  APP_NAME="Shree Laxminarayan Mandir API"
  APP_VERSION="1.0.0"
  DEBUG=True
  ALLOWED_ORIGINS=["http://localhost:3000"]

  SUPABASE_URL=<SUPABASE_URL from B1.3>
  SUPABASE_ANON_KEY=<ANON_KEY from B1.3>
  SUPABASE_SERVICE_KEY=<SERVICE_KEY from B1.3>

  ANTHROPIC_API_KEY=<ANTHROPIC_KEY from C4>
  CLAUDE_MODEL=claude-sonnet-5-5
  ```

- [ ] **D1.3** **Delete** the `GEMINI_API_KEY=…` line, then save.

What each line means:

| Setting | What it's for |
|---|---|
| `DEBUG` | `True` on your computer; `False` when online. |
| `ALLOWED_ORIGINS` | Which website addresses may talk to the backend. Add the real domain in Part K. |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Where the database is. |
| `SUPABASE_SERVICE_KEY` 🔒 | Full database access, used **only** by the backend. |
| `ANTHROPIC_API_KEY` 🔒 | Pays for "Ask the Pandit" answers. |
| `CLAUDE_MODEL` | Which Claude model answers. `claude-sonnet-5-5` gives the best quality for the price. The reasoning is in `ai-services/temple_rag/config.py`. |

### D2. Frontend settings: `frontend/.env.local`

- [ ] **D2.1** Open `frontend/.env.local`. If it doesn't exist, copy `frontend/.env.example` and rename the copy to `.env.local`.
- [ ] **D2.2** Make it look like this:

  ```ini
  NEXT_PUBLIC_SUPABASE_URL=<SUPABASE_URL from B1.3>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY from B1.3>
  NEXT_PUBLIC_API_URL=http://localhost:8000
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  ```

| Setting | What it's for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `…ANON_KEY` | Lets the site log people in. Safe to be public. |
| `NEXT_PUBLIC_API_URL` | Where the backend runs. **No** `/api` at the end. |
| `NEXT_PUBLIC_SITE_URL` | This website's own address, used in email links. |

> ⚠️ **Never** put `SUPABASE_SERVICE_KEY` or `ANTHROPIC_API_KEY` in this file. Anything starting with `NEXT_PUBLIC_` can be seen by every visitor.

✅ **Part D done.**

---

## Part E: Run the website on your computer

⏱ 20 min the first time. You need **3 terminal windows** open at once. In VS Code: **Terminal → New Terminal**, then use the ➕ button for more.

**One-time requirements:** [Python 3.13](https://www.python.org/downloads/) (tick *"Add python.exe to PATH"* when installing) and [Node.js 22 or newer](https://nodejs.org).

> **PowerShell tip:** if activating the virtual environment shows *"running scripts is disabled"*, run this once, then try again:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### Terminal 1: the backend (API)

- [ ] **E1.** Run these one at a time:

  ```powershell
  cd backend
  python -m venv venv                  # first time only
  venv\Scripts\Activate.ps1            # you'll see (venv) at the start of the line
  pip install -r requirements.txt      # first time only, takes a few minutes
  uvicorn app.main:app --reload
  ```

- [ ] **E2.** Check: open [http://localhost:8000/health](http://localhost:8000/health). It should show `{"status":"healthy"}`.
  [http://localhost:8000/docs](http://localhost:8000/docs) lists every API endpoint.

Leave this terminal running.

### Terminal 2: build the AI's knowledge base

"Ask the Pandit" answers only from the temple's own information. This step reads that information (timings, poojas, festivals, books) from the database and indexes it.

- [ ] **E3.** Run:

  ```powershell
  cd backend
  venv\Scripts\Activate.ps1
  python ../ai-services/scripts/ingest.py
  ```

  The first run downloads a language model (~470 MB) once, then it's quick.
- [ ] **E4.** **Re-run this command whenever** you add books, change temple info or timings, or add a new year of calendar dates. Unchanged content is skipped automatically. Add `--force` to rebuild everything.

> 📚 **Want the Pandit to know more?** Put the temple's PDFs or text files (history, scripture notes, FAQs) into `ai-services/knowledge_base/` and run E3 again.

### Terminal 3: the website

- [ ] **E5.** Run:

  ```powershell
  cd frontend
  npm install          # first time only
  npm run dev
  ```

- [ ] **E6.** Open [http://localhost:3000](http://localhost:3000) 🎉. Click **नेपाली** at the top to check the Nepali version.

**Next time** you only need: Terminal 1 → `cd backend`, `venv\Scripts\Activate.ps1`, `uvicorn app.main:app --reload`; Terminal 3 → `cd frontend`, `npm run dev`.

✅ **Part E done.**

---

## Part F: Make yourself the admin

⏱ 5 min. Every new account starts as a normal devotee. For security, the only way to create the **first** admin is from the Supabase dashboard.

- [ ] **F1.** On your local site, go to [http://localhost:3000/en/signup](http://localhost:3000/en/signup) and create an account with your own email.
- [ ] **F2.** Open the confirmation email and click the link. *(Not arriving? Check spam. Without custom SMTP (B5), Supabase's test sender is slow and limited.)*
- [ ] **F3.** Supabase → **SQL Editor** → **New query** → paste this, putting **your** email inside the quotes:

  ```sql
  update public.profiles set role = 'admin' where email = '<your-email>';
  ```

  Click **Run**. It should say **"1 row affected"**. If it says 0, the email doesn't match exactly. Check spelling and capital letters.
- [ ] **F4.** Check:

  ```sql
  select email, role from public.profiles;
  ```

  Your row should show `admin`.
- [ ] **F5.** On the website, **log out and log back in**. Then open [http://localhost:3000/en/admin](http://localhost:3000/en/admin). You should see the **Temple Admin** dashboard.

> **Adding more admins later** (e.g. the temple secretary): they sign up first, then you run F3 with their email.
> **Removing an admin:** the same command, with `'devotee'` instead of `'admin'`.

✅ **Part F done.**

---

## Part G: Google login

⏱ 20 min. Adds the **"Continue with Google"** button.

You need your Supabase **project ref** from B1.3. Your Google **callback URL** is:

```
https://<project-ref>.supabase.co/auth/v1/callback
```

- [ ] **G1.** Go to [console.cloud.google.com](https://console.cloud.google.com) and sign in, ideally with the temple's Google account.
- [ ] **G2.** Top bar → project picker → **New Project** → name it `Laxminarayan Mandir Website` → **Create** → make sure it's selected.
- [ ] **G3.** Search bar → **Google Auth Platform** (older screens call it **OAuth consent screen**) → **Get started**:
  - **App name**: `Shree Laxminarayan Mandir`
  - **User support email**: your email
  - **Audience**: **External**
  - **Contact email**: your email → agree → **Create**
- [ ] **G4.** **Branding** (optional): upload the temple logo (`frontend/public/images/logo.png`).
- [ ] **G5.** **Clients** → **+ Create client**:
  - **Application type**: **Web application**
  - **Name**: `Temple website`
  - **Authorized JavaScript origins** → **Add URI** → `http://localhost:3000`
  - **Authorized redirect URIs** → **Add URI** → your callback URL from above
  - **Create**
- [ ] **G6.** A box shows the **Client ID** and **Client secret** 🔒. Copy both.
- [ ] **G7.** Supabase → **Authentication** → **Sign In / Providers** (older screens: **Providers**) → **Google** → turn **on** → paste the **Client ID** and **Client Secret** → **Save**.
- [ ] **G8.** Back in Google → **Audience** → **Publish app** → confirm.
  *Until you publish, only email addresses you add as "Test users" can log in with Google.*
- [ ] **G9.** Test: [http://localhost:3000/en/login](http://localhost:3000/en/login) → **Continue with Google**. You should come back logged in.

✅ **Part G done.**

---

## Part H: Facebook login

⏱ 25 min. Adds the **"Continue with Facebook"** button.

> 📝 **Facebook requires a Privacy Policy web page** before the login can go public. The website doesn't have one yet. You can publish a short policy on a free Google Doc / Google Site for now (it should say what you collect: name, email, bookings, and why). Or ask me to add a bilingual `/privacy` page to the site.

- [ ] **H1.** Go to [developers.facebook.com](https://developers.facebook.com) → log in → **My Apps** → **Create App**.
- [ ] **H2.** Choose the use case **"Authenticate and request data from users with Facebook Login"** → **Next**.
  App name: `Shree Laxminarayan Mandir`, contact email: yours → **Create app**.
- [ ] **H3.** **Use cases** → Facebook Login → **Customize** → under **Permissions**, make sure **`email`** is added (click **Add** next to it if not).
- [ ] **H4.** Still in Facebook Login → **Settings** → **Valid OAuth Redirect URIs** → paste your callback URL from Part G:
  `https://<project-ref>.supabase.co/auth/v1/callback` → **Save changes**.
- [ ] **H5.** Left menu → **App settings → Basic**:
  - Copy the **App ID** and **App Secret** 🔒 (click *Show*)
  - **Privacy Policy URL**: your policy page (see the note above)
  - **User data deletion**: choose *Data deletion instructions URL* and use the same page (it should explain how to ask the temple to delete an account)
  - **Category**: e.g. *Lifestyle* → **Save changes**
- [ ] **H6.** Supabase → **Authentication** → **Sign In / Providers** → **Facebook** → turn **on** → paste **App ID** as *Client ID* and **App Secret** as *Client Secret* → **Save**.
- [ ] **H7.** Test on [http://localhost:3000/en/login](http://localhost:3000/en/login). While the app is in *Development* mode, only you (the app's admin) can log in. That's normal.
- [ ] **H8.** When ready for the public: Facebook app dashboard → **Publish** / switch **App Mode** to **Live**. Facebook may ask you to finish a checklist first.

✅ **Part H done.**

---

## Part I: Replace placeholder content with the temple's real details

⏱ 1–2 hrs. Most of this is done **in the admin dashboard** (`/en/admin`), with no coding needed. Everything you change there appears on the website immediately, in both languages.

### I1. Phone number and email (edit 2 files)

The site currently shows `+977-XXXXXXXXX` and `info@laxminarayanmandir.org`.

- [ ] **I1.1** In VS Code, press `Ctrl+Shift+H` (Replace in Files).
- [ ] **I1.2** Find `+977-XXXXXXXXX` → replace with the temple's real phone (e.g. `+977-57-520000`) → **Replace All**. This updates both `frontend/src/messages/en.json` and `ne.json`.
- [ ] **I1.3** Find `+977-98XXXXXXXX` (the example in the booking form's phone box) → replace with a sample like `+977-98…`, or leave it.
- [ ] **I1.4** Find `info@laxminarayanmandir.org` → replace with the temple's real email (or delete those lines if there isn't one).
- [ ] **I1.5** Also update the same details in **Admin → Temple info**. "Ask the Pandit" reads from there. Then re-run the knowledge-base step (E3).

### I2. In the admin dashboard

- [ ] **I2.1** **Temple info**: check timings, address and contact details.
- [ ] **I2.2** **Events**: the sample events have **placeholder dates**. Edit them to the real programme, or hide them.
- [ ] **I2.3** **Calendar**: the festival/Ekadashi/Purnima dates were calculated astronomically for Hetauda. **Ask the temple priest to check them once** against the temple's own panchang, and fix any that differ.
- [ ] **I2.4** **Poojas** and **Archanas**: check names, prices (in NPR) and durations. These came from the old mock-up.
- [ ] **I2.5** **Founders & leadership**: add photos, names (English + Nepali) and short bios. The **History** page shows an empty message until you do.
- [ ] **I2.6** **Gallery**: upload real photos (festivals, daily pooja, the temple building). Only 3 photos exist right now.
- [ ] **I2.7** **Books**: upload the PDF for each book. Until then it shows "PDF coming soon".
- [ ] **I2.8** **Bhajans**: upload the audio (MP3) for each bhajan. Until then it shows "audio coming soon".
- [ ] **I2.9** After big content changes, re-run the knowledge-base step (E3) so "Ask the Pandit" knows about them.

### I3. Photos and assets that need *you*

These can't come from code. They need real files from the temple:

| What | Where it shows | How to replace |
|---|---|---|
| **High-resolution deity photo** (at least 1920 px wide) | Big background at the top of the home page, and the About section | Replace `frontend/public/images/deity.jpg`. Keep the exact name, **lower-case `.jpg`**. |
| **Temple logo** (PNG, ideally transparent background) | Header, footer, login pages | Replace `frontend/public/images/logo.png`. The current one has a white box behind it. |
| `altar.jpg` | The wide "Sacred Sanctum" photo strip on the home page | Replace with a better photo (same name). |
| `interior.jpg` | One of the 3 starter gallery photos | Upload better photos in Admin → Gallery and hide the starter ones. |
| **Event photos** | Event cards (currently show an emoji icon) | Admin → Events → each event → image |
| **Founder / leader portraits** | History page | Admin → Founders & leadership |
| **Book PDFs, bhajan recordings** | Books / Bhajans pages | Admin → Books / Bhajans |

> 🖼 Pooja and service cards intentionally use icons (🪔 💧 🔥), not photos. That's a design choice, not a missing asset.

✅ **Part I done.**

---

## Part J: Final test checklist

⏱ 20 min. Do this on your computer (Part E running), and again after going online (Part K).

**Public site**
- [ ] Every menu page opens: Home, Events, Calendar, Poojas, Book Pooja, Books, Bhajans, Gallery, History, Contact
- [ ] **EN ⇄ नेपाली** switch works on every page, and Nepali numbers show as ०१२३…
- [ ] Calendar: **‹ ›** change month, **Today** jumps back, the **Bikram Sambat / Gregorian** toggle works
- [ ] Gallery: clicking a photo opens it large; arrow keys and swiping move between photos
- [ ] On your **phone** (same Wi-Fi, open `http://<your-computer-IP>:3000`) or via Chrome's mobile view (`F12` → 📱): nothing is cut off and the menu scrolls sideways

**Bookings**
- [ ] Book a pooja as a visitor → you see "Booking Received"
- [ ] **Admin → Bookings**: it appears under **Pending** → **Confirm** moves it to **Confirmed**

**Accounts**
- [ ] Sign up → confirmation email arrives → link logs you in
- [ ] **Forgot password** → email shows a **6-digit code** → the code + a new password works
- [ ] Google and Facebook buttons work (Parts G/H)
- [ ] A normal (non-admin) account visiting `/en/admin` is sent back to the home page

**Ask the Pandit**
- [ ] Ask "What are the darshan timings?" → a correct answer with a source
- [ ] Ask in Nepali, "दर्शनको समय कति हो?" → it answers in Nepali
- [ ] Ask something unrelated (e.g. "Who won the cricket match?") → it politely says it can only help with temple topics

---

## Part K: Put the website online (deployment)

⏱ 1–2 hrs. You don't need to do this now. These are the recommended steps for when you're ready.

The website is **three pieces**. Each goes to a different place:

| Piece | Recommended host | Cost |
|---|---|---|
| Database + logins + files | **Supabase** (already online) | Free plan is fine to start |
| Website (`frontend/`) | **[Vercel](https://vercel.com)** | Free (Hobby plan) |
| Backend + AI (`backend/` + `ai-services/`) | **[Render](https://render.com)** (or any server with **≥ 2 GB RAM**) | Paid instance; check current pricing |

> **Why the backend needs 2 GB RAM:** "Ask the Pandit" runs its multilingual search model on the server itself. Small free servers (512 MB) run out of memory.

### K1. Put the code on GitHub

- [ ] **K1.1** Review the latest commits, then push: `git push` (create a **private** repository on GitHub first if you haven't).
- [ ] **K1.2** Double-check that GitHub does **not** show `backend/.env` or `frontend/.env.local`. They should be missing; git ignores them.

### K2. A domain name

- [ ] **K2.1** Nepali organisations can get a **free `.org.np` / `.com.np` domain** at [register.com.np](https://register.com.np). You'll need the temple's registration documents. For example: `laxminarayanmandir.org.np`.
  *(Or buy any domain, e.g. `.org`, from a registrar.)*

### K3. Backend on Render

- [ ] **K3.1** Render → **New → Web Service** → connect the GitHub repo.
- [ ] **K3.2** Settings:
  - **Root Directory**: `backend`
  - **Runtime**: Python
  - **Build Command**:
    `pip install torch --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt`
    *(The first part installs the small CPU-only version of PyTorch instead of the huge GPU one.)*
  - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - **Instance type**: at least **2 GB RAM**
- [ ] **K3.3** **Disks** → add a persistent disk mounted at `/var/data` (1 GB is plenty). This keeps the AI knowledge base safe across restarts.
- [ ] **K3.4** **Environment** → add each line from your `backend/.env`, with these changes:
  - `DEBUG` = `False`
  - `ALLOWED_ORIGINS` = `["https://<your-domain>"]` (the real website address, in quotes and square brackets)
  - add `CHROMA_PERSIST_DIR` = `/var/data/chroma_db`
  - add `PYTHON_VERSION` = `3.13.2`
- [ ] **K3.5** Deploy. Then open `https://<your-render-app>.onrender.com/health` → `{"status":"healthy"}`.
- [ ] **K3.6** Build the knowledge base online: Render → your service → **Shell** → run
  `python ../ai-services/scripts/ingest.py`

### K4. Website on Vercel

- [ ] **K4.1** Vercel → **Add New → Project** → import the GitHub repo.
- [ ] **K4.2** **Root Directory**: `frontend` (Vercel detects Next.js automatically).
- [ ] **K4.3** **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: same as before
  - `NEXT_PUBLIC_API_URL` = `https://<your-render-app>.onrender.com`
  - `NEXT_PUBLIC_SITE_URL` = `https://<your-domain>`
- [ ] **K4.4** **Deploy**. Then **Settings → Domains** → add your domain and follow Vercel's DNS instructions.

### K5. Point every login service at the real address

Most "it works on my computer but not online" problems come from skipping this part.

- [ ] **K5.1** **Supabase** → Authentication → URL Configuration:
  - **Site URL** → `https://<your-domain>`
  - **Redirect URLs** → add `https://<your-domain>/**` (keep the localhost one for testing)
- [ ] **K5.2** **Google** (Part G5) → your client → **Authorized JavaScript origins** → add `https://<your-domain>`
- [ ] **K5.3** **Facebook** (Part H5) → App settings → Basic → **App Domains** → add `<your-domain>`
- [ ] **K5.4** Make sure custom SMTP (Part B5) is set up.
- [ ] **K5.5** Run the whole **Part J** checklist on the live site.

### K6. After launch (good habits)

- [ ] Supabase free projects **pause after a week with no activity**. A live temple website gets daily visits, so this is unlikely to matter, but keep an eye on it.
- [ ] Back up the database now and then: Supabase → **Database → Backups** (paid plans), or export important tables as CSV from the Table Editor.
- [ ] Check the Anthropic spend now and then: [console.anthropic.com](https://console.anthropic.com) → **Usage**.
- [ ] Each year, add the next year's calendar dates (Admin → Calendar), then re-run the knowledge-base step.

🎉 **Done. Jai Shree Laxminarayan!**

---

## 🛠 Troubleshooting

| Problem | Likely cause → fix |
|---|---|
| Pages show "Could not load …" | The backend isn't running. Start Terminal 1 (Part E1). Online: check that the Render service is up and `NEXT_PUBLIC_API_URL` is correct. |
| `/en/admin` sends me to the home page | Your account isn't an admin yet. Do Part F, then **log out and back in**. |
| "Ask the Pandit" says it's unavailable | `ANTHROPIC_API_KEY` is missing or wrong in `backend/.env`, or your Anthropic credit has run out. Restart the backend after editing `.env`. |
| The Pandit says "I don't know" to basic questions | The knowledge base is empty or old. Run Part E3 (online: K3.6). |
| Sign-up / reset emails never arrive | Check spam. Set up custom SMTP (Part B5). Supabase's test sender is very limited. |
| The reset email has a link instead of a code | The **Reset Password** template wasn't changed. Redo Part B4. |
| Google: "redirect_uri_mismatch" | The redirect URI in Google (G5) must be exactly `https://<project-ref>.supabase.co/auth/v1/callback`. |
| Google / Facebook login returns to the login page with an error | The provider isn't switched on in Supabase, the ID or secret was pasted wrongly, or (online) Part K5 was skipped. |
| Facebook: "App not active" | The app is still in Development mode. Switch it to Live (H8). |
| Admin image upload fails | Run `database/schema_v2.sql` again (it creates the storage buckets and permissions), and make sure you're logged in as admin. |
| `pip install` fails on Windows | Make sure Python **3.13** is installed and `(venv)` shows at the start of the line. |
| "running scripts is disabled" in PowerShell | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once. |
| Website works on the computer but images 404 online | File names are case-sensitive online. Use `deity.jpg`, not `deity.JPG`. |

---

*Something unclear or not working? Note the step number (e.g. "G5") and the exact error message. That makes it quick to fix.*
