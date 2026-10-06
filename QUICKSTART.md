# ⚡ 5-minute quickstart

**For the impatient.** This assumes you already have all three cloud accounts
set up and your keys to hand:

1. A **Supabase** project, with `schema_v2.sql`, `seed.sql` and `seed_calendar.sql` already run
2. A **Google AI Studio** API key for "Ask the Pandit" — <https://aistudio.google.com/apikey>
3. *(Only if you want Google/Facebook login)* **Google Cloud** OAuth credentials, already pasted into Supabase

If any of that isn't true, or you've never used a terminal, use
**[MANUAL_STEPS_V2.md](MANUAL_STEPS_V2.md)** instead — it explains every click.

You also need **Docker Desktop** running. Check the whale icon in your system
tray is steady, not animating.

---

## 1 · Get the code

```bash
git clone <your-repo-url> temple-platform
cd temple-platform
```

## 2 · Write the three settings files

Copy the examples, then fill in your own values:

```bash
cp backend/.env.example        backend/.env
cp frontend/.env.example       frontend/.env.local
cp ai-services/.env.example    ai-services/.env
```

<details>
<summary>PowerShell</summary>

```powershell
Copy-Item backend\.env.example     backend\.env
Copy-Item frontend\.env.example    frontend\.env.local
Copy-Item ai-services\.env.example ai-services\.env
```
</details>

Now open each one and paste your values. The four that matter:

| File | Key | Value |
|---|---|---|
| `backend/.env` | `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `backend/.env` | `SUPABASE_SERVICE_KEY` 🔒 | the `service_role` key |
| `backend/.env` | `GOOGLE_API_KEY` 🔒 | your AI Studio key (`AIza…`) |
| `frontend/.env.local` | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | project URL + the `anon` key |

`ai-services/.env` only needs `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` 🔒.

> 🔒 means secret. Never commit these files — git already ignores them.

> **One gotcha:** `NEXT_PUBLIC_API_URL` is baked into the website when it is
> **built**, not when it runs. For the Docker path leave it as
> `http://localhost:8000`. If you change it later, rebuild with
> `docker compose up --build`, not just `docker compose up`.

## 3 · Build the AI's knowledge base

This reads your temple content out of Supabase and indexes it. The first run
downloads a ~470 MB language model once, so give it a few minutes.

```bash
docker compose run --rm ingest
```

You're looking for a line like `Done: 12 sources embedded (34 chunks)`.

## 4 · Start everything

```bash
docker compose up --build
```

First build takes 5–10 minutes (it installs PyTorch). After that, seconds.

## 5 · Open it

| What | Where |
|---|---|
| 🛕 The website | <http://localhost:3000> |
| 🇳🇵 In Nepali | <http://localhost:3000/ne> |
| ⚙️ API docs | <http://localhost:8000/docs> |
| ❤️ Health check | <http://localhost:8000/health> |

Click the 🙏 button at the bottom-right and ask *"What time is morning darshan?"*

---

## 6 · Make yourself the admin

Sign up at <http://localhost:3000/en/signup>, then in **Supabase → SQL Editor**:

```sql
update public.profiles set role = 'admin' where email = '<your-email>';
```

Log out, log back in, then open <http://localhost:3000/en/admin>.

---

## Everyday commands

With the `Makefile`:

```bash
make up        # start everything
make down      # stop everything
make logs      # follow the logs
make ingest    # re-index after changing temple content
make smoke     # ask the live agent 3 test questions
make test      # run the Python test suites
```

Or the raw Docker equivalents:

```bash
docker compose up -d
docker compose down
docker compose logs -f
docker compose run --rm ingest
```

**Re-run `make ingest` whenever you change temple info, poojas, events, the
calendar or books** — otherwise "Ask the Pandit" keeps answering from the old
index.

---

## If something's wrong

| Symptom | Fix |
|---|---|
| `docker: command not found` | Docker Desktop isn't installed or isn't running. |
| Pages say "Could not load…" | The backend didn't start. `docker compose logs backend` |
| Chat says it's unavailable | `GOOGLE_API_KEY` missing from `backend/.env`, or step 3 was skipped. |
| Chat says "I don't have that information" for everything | The index is empty. Run step 3. |
| `port is already allocated` | Something else is on 3000 or 8000. Stop it, or change the port in `docker-compose.yml`. |
| Website loads but login does nothing | `NEXT_PUBLIC_SUPABASE_*` missing from `frontend/.env.local`. Rebuild after fixing. |

Fuller troubleshooting: **[MANUAL_STEPS_V2.md § Q](MANUAL_STEPS_V2.md#q--troubleshooting)**.

🙏 *Jai Shree Laxminarayan.*
