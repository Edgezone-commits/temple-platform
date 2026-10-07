# Authentication System — Architecture Reference

How sign-in works on the Shree Laxminarayan Mandir site: Supabase Auth, bilingual
through next-intl, plain CSS.

> ⚠️ **This document was written against an earlier draft of the auth code and
> had drifted badly.** It described five `/api/auth/*` route handlers, a
> `frontend/middleware.ts` and a `src/lib/auth-actions.ts` — **none of which
> exist**. The architecture moved to Server Actions, and Next 16 renamed
> middleware to `proxy`. It has now been rewritten against the code as it
> actually stands. Where you see a path here, it was checked.
>
> **For setting the site up, use [MANUAL_STEPS_V2.md](./MANUAL_STEPS_V2.md),
> not this file.** This is the architecture reference — what talks to what, and
> why.

---

## 1. Setup and database

| Then | Now |
|---|---|
| `SETUP.md` | Still present, but superseded by **MANUAL_STEPS_V2.md § C–G** (Supabase project, Auth settings, SMTP, the `.env` files). |
| `DATABASE_SETUP.sql` | Superseded by **`database/schema_v2.sql`**, run with `seed.sql` and `seed_calendar.sql` — see MANUAL_STEPS_V2 § D2–D4. `schema_v2.sql` creates `profiles` (keyed to `auth.users`, with `role` defaulting to `devotee`), the RLS policies, the signup trigger and the `is_admin()` helper. |

Required in `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 2. Pages — `frontend/src/app/[locale]/(auth)/`

All four reachable as `/en/…` and `/ne/…`.

Each page is a **Server Component** that does nothing but resolve the locale and
read the query string, then render a client form component. The forms live in
[`frontend/src/components/auth/AuthForms.tsx`](<./frontend/src/components/auth/AuthForms.tsx>)
(`'use client'`), built from the field primitives in
[`AuthFields.tsx`](<./frontend/src/components/auth/AuthFields.tsx>).

| Page | Renders | Query string it reads |
|---|---|---|
| [`login/page.tsx`](<./frontend/src/app/[locale]/(auth)/login/page.tsx>) | `<LoginForm>` | `?next=` destination, `?reset=1` after a password change, `?error=oauth\|link` from the callback |
| [`signup/page.tsx`](<./frontend/src/app/[locale]/(auth)/signup/page.tsx>) | `<SignupForm>` | `?next=` |
| [`forgot-password/page.tsx`](<./frontend/src/app/[locale]/(auth)/forgot-password/page.tsx>) | `<ForgotForm>` | — |
| [`reset-password/page.tsx`](<./frontend/src/app/[locale]/(auth)/reset-password/page.tsx>) | `<ResetForm>` | `?email=`, `?sent=1` |

[`layout.tsx`](<./frontend/src/app/[locale]/(auth)/layout.tsx>) is a Server
Component with no site header, nav or footer — just the temple mark, a
[language switch](<./frontend/src/components/auth/AuthLocaleSwitch.tsx>) that
preserves the current page and query, a `NamamDivider`, and a centred ivory card
on the maroon/gold background.

> Every field is a plain `<form>` input posting `FormData` to a Server Action, so
> the forms work with JavaScript disabled.

---

## 3. Server Actions — `frontend/src/lib/auth/actions.ts`

[`frontend/src/lib/auth/actions.ts`](<./frontend/src/lib/auth/actions.ts>),
marked `'use server'`. **This is the only place auth operations happen** — there
are no auth API routes.

The four form actions take `(prevState, FormData)` so the client forms can drive
them with `useActionState`:

| Export | Fields | Notes |
|---|---|---|
| `signIn` | `email`, `password`, `locale`, `next` | |
| `signUp` | `name`, `email`, `password`, `confirm`, `locale` | Sends the confirmation email; minimum password length 8 |
| `requestPasswordReset` | `email`, `locale` | Supabase emails a **6-digit code, not a link** — this requires the Reset Password template to use `{{ .Token }}` (MANUAL_STEPS_V2 § E2). Never reveals whether an address has an account; only rate limits surface. |
| `resetPassword` | `email`, `code`, `password`, `confirm`, `locale` | `verifyOtp({type:'recovery'})` → `updateUser` → global sign-out → back to login with `?reset=1` |

Plus `signInWithProvider(FormData)` (Google / Facebook), `signOut(FormData)`, and
`safeNext(next, locale)` — which the OAuth callback also uses, and which only
allows same-site relative paths as a post-login destination.

**Errors come back as translation keys** (`AuthErrorKey` → `auth.errors.*`),
never raw Supabase English, so a Nepali page stays Nepali.

---

## 4. The one route handler

[`frontend/src/app/auth/callback/route.ts`](<./frontend/src/app/auth/callback/route.ts>)
— `GET /auth/callback`. It is **outside `[locale]`** because the redirect URL
registered with Supabase, Google and Facebook has to be a fixed address.

It handles both the OAuth return (`?code=`) and the sign-up confirmation email
(`?code=` or `?token_hash=&type=signup`), exchanges either for a session cookie,
and redirects to `?next` with the visitor's language preserved. Failures go to
`/<locale>/login?error=oauth` (cancelled or provider error) or `?error=link`
(bad or expired link).

---

## 5. Proxy — `frontend/src/proxy.ts`

Next 16 renamed middleware to **proxy**, and it must sit in `src/`, beside
`app/`. [`frontend/src/proxy.ts`](<./frontend/src/proxy.ts>) does three things
per page request:

1. **Refreshes the Supabase session**, rotating cookies when the access token is
   near expiry. Refreshed cookies are written to the **request** first so this
   request's Server Components see them, then copied onto the response for the
   browser.
2. **next-intl locale routing** (`/` → `/en`, locale detection).
3. **Gates `/<locale>/admin`** — not logged in → `/<locale>/login?next=…`.

If Supabase is unreachable the visitor is treated as logged out rather than the
site being blocked.

Its matcher skips `api`, `auth`, `_next`, `_vercel` and anything with a file
extension — which is why the OAuth callback is not intercepted.

**The role check is deliberately not here.** `profiles.role === 'admin'` is
checked in
[`(admin)/admin/layout.tsx`](<./frontend/src/app/[locale]/(admin)/admin/layout.tsx>)
via `requireAdmin()` from `@/lib/admin/api`; devotees are sent to the home page.
The proxy does the cheap cookie check, the layout does the database one.

---

## 6. Translations — the `auth` namespace

In `frontend/src/messages/en.json` and `ne.json`. Shared labels sit at the top
level of the namespace, not in a `common` sub-object:

- **`auth.*`** — `email`, `emailPh`, `password`, `passwordPh`, `newPassword`,
  `newPasswordPh`, `confirmPassword`, `confirmPh`, `name`, `namePh`, `or`,
  `google`, `facebook`, `working`, `showPassword`, `hidePassword`, `backToSite`
- **`auth.login.*`** — `title`, `subtitle`, `submit`, `forgot`, `noAccount`,
  `signupLink`, `resetDone`
- **`auth.signup.*`** — `title`, `subtitle`, `submit`, `hasAccount`,
  `loginLink`, `checkEmailTitle`, `checkEmailBody`, `passwordHint`
- **`auth.forgot.*`** — `title`, `subtitle`, `submit`, `back`
- **`auth.reset.*`** — `title`, `subtitle`, `sent`, `code`, `codePh`, `submit`,
  `resend`
- **`auth.errors.*`** — one key per `AuthErrorKey`: `invalidCredentials`,
  `emailNotConfirmed`, `userExists`, `weakPassword`, `passwordMismatch`,
  `invalidEmail`, `nameRequired`, `codeInvalid`, `rateLimited`, `samePassword`,
  `notConfigured`, `oauth`, `link`, `generic`

`en.json` and `ne.json` must keep **identical key sets** — a missing key renders
as a visible `auth.x.y` fallback.

---

## 7. Route structure

```
/en/                       home
├── /en/login              (auth layout)
├── /en/signup             (auth layout)
├── /en/forgot-password    (auth layout)
├── /en/reset-password     (auth layout)
├── /en/admin/*            proxy requires a session; layout requires role 'admin'
├── /en/privacy            Privacy Policy
├── /en/terms              Terms of Use
└── ...                    the rest of the site

/ne/*                      the same, in Nepali

/auth/callback             OAuth + email confirmation. Not locale-prefixed.
```

There is **no `/api/auth/*`**. The site's only API routes are the FastAPI
backend's, under a different origin.

---

## 8. Styling

Plain CSS custom properties from `globals.css` — **no Tailwind**.

- **Colours**: `--maroon-950`, `--maroon-900`, `--gold-500`, `--ivory-50`,
  `--ivory-100`, `--text-dark`
- **Fonts**: `--ff-display` (headings), `--ff-body` (paragraphs),
  `--ff-heading` (labels)
- **Buttons**: `.btn-primary` (gold filled), `.btn-outline` (gold outline).
  On an ivory background, override the colour locally — see `.person-video` and
  `.legal-links a` for the established pattern.
- **Auth shell**: `.auth-shell`, `.auth-topbar`, `.auth-column`, `.auth-card`,
  `.auth-field`

---

## 9. Security

1. **Passwords** never reach the client and are never stored by this app —
   Supabase handles them.
2. **Session tokens** live in HTTP-only cookies set by the Supabase SSR client.
3. **RLS** restricts each account to its own rows; `is_admin()` is
   `SECURITY DEFINER` so it reads `profiles` without re-entering that table's own
   RLS, which is what avoids the infinite-recursion bug.
4. **Reset codes** are 6 digits and expire on Supabase's schedule. A reset signs
   the account out everywhere.
5. **Post-login redirects** go through `safeNext()` — same-site relative paths
   only, so `?next=` cannot be used as an open redirect.
6. **`SUPABASE_SERVICE_ROLE_KEY`** belongs in `backend/.env` only. It must never
   appear in frontend code, where any `NEXT_PUBLIC_*` value is compiled into the
   public bundle.

---

## 10. Troubleshooting

See **MANUAL_STEPS_V2 § Q** first — it covers these with the exact fix.

| Symptom | Where to look |
|---|---|
| OAuth returns to an error page | Redirect URI in Google Cloud / Facebook must be exactly `https://<your-project>.supabase.co/auth/v1/callback`. The site lands on `?error=oauth`. |
| Reset email arrives with a link, not a code | The Reset Password template still uses `{{ .ConfirmationURL }}`. It must use `{{ .Token }}` — MANUAL_STEPS_V2 § E2. |
| No email at all | Supabase's test sender may only deliver to your own team. Custom SMTP is § E3, and it is required before announcing the site. |
| Session not persisting | Confirm `src/proxy.ts` is running (it is `proxy.ts`, not `middleware.ts` — a file named `middleware.ts` is simply ignored by Next 16). Check `.env.local`. |
| Admin route reachable without auth | Restart the dev server after editing `proxy.ts`. Remember the role check lives in the admin layout, not the proxy. |
| A label renders as `auth.login.submit` | That key is missing from one of the two message files. |

---

## 11. Resources

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side-rendering)
- [next-intl](https://next-intl-docs.vercel.app/)
- Next 16's own docs are vendored at `frontend/node_modules/next/dist/docs/` —
  read those rather than relying on memory, since this version renamed
  middleware and changed `params` to a Promise.

---

**Next.js 16 (App Router), Supabase, next-intl, plain CSS.**
