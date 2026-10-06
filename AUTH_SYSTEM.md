# Authentication System Implementation Guide

Complete authentication system for Shree Laxminarayan Mandir website with Supabase, next-intl bilingual support, and plain CSS styling.

---

## 📋 Files Created

### 1. **Configuration & Setup**

#### [SETUP.md](./SETUP.md)
Manual Supabase dashboard configuration steps:
- Enable Email/Password authentication
- Set up Google OAuth (Google Cloud Console)
- Set up Facebook OAuth (Facebook Developer)
- Customize password reset email template
- Session duration configuration

#### [DATABASE_SETUP.sql](./DATABASE_SETUP.sql)
SQL script to run in Supabase:
- Creates `profiles` table (linked to `auth.users`)
- Adds `role` column (default 'devotee', allows 'devotee' | 'admin')
- Implements Row Level Security (RLS) policies
- Auto-creates profile on user signup via trigger
- Admin policies for profile management

---

### 2. **Frontend Pages** (under `frontend/src/app/[locale]/(auth)/`)

All pages support both `/en/` and `/ne/` locales via next-intl.

#### [layout.tsx](./frontend/src/app/[locale]/(auth)/layout.tsx)
**Server Component**
- Centered card layout with maroon/gold gradient background
- Displays temple name with Namam divider
- No header, nav, or footer (isolated from main site)
- Uses CSS custom properties for styling

#### [login/page.tsx](./frontend/src/app/[locale]/(auth)/login/page.tsx)
**Client Component**
- Email & password login form
- "Continue with Google" button
- "Continue with Facebook" button
- "Forgot password?" link
- "Sign up" link
- Inline validation errors & loading states

#### [signup/page.tsx](./frontend/src/app/[locale]/(auth)/signup/page.tsx)
**Client Component**
- Name, email, password, confirm password fields
- Same OAuth provider buttons
- Form validation with error display
- Link to login page

#### [forgot-password/page.tsx](./frontend/src/app/[locale]/(auth)/forgot-password/page.tsx)
**Client Component**
- Email input to request OTP
- Shows success message with email confirmation
- Link to reset password page

#### [reset-password/page.tsx](./frontend/src/app/[locale]/(auth)/reset-password/page.tsx)
**Client Component**
- Email field
- 6-digit OTP code input (auto-formatted, centered with monospace font)
- New password & confirm password fields
- Shows success page after verification
- Auto-redirects to login after 2 seconds

---

### 3. **Server Actions** (API-like functions)

#### [frontend/src/lib/auth-actions.ts](./frontend/src/lib/auth-actions.ts)
Server Actions using `'use server'`:
- `signInWithPassword(email, password)` - Email/password login
- `signUpWithPassword(name, email, password)` - Register new user
- `requestPasswordResetOtp(email)` - Send OTP to email
- `verifyPasswordResetOtp(email, code, newPassword)` - Verify OTP & reset
- `signOut()` - Logout
- `getSession()` - Get current session
- `getCurrentUser()` - Get authenticated user

---

### 4. **API Routes** (Route Handlers)

#### [api/auth/password-login/route.ts](./frontend/src/app/api/auth/password-login/route.ts)
`POST /api/auth/password-login`
- Request: `{ email, password }`
- Response: `{ data }` or `{ error }`

#### [api/auth/password-signup/route.ts](./frontend/src/app/api/auth/password-signup/route.ts)
`POST /api/auth/password-signup`
- Request: `{ name, email, password }`
- Response: `{ data }` or `{ error }`

#### [api/auth/oauth/[provider]/route.ts](./frontend/src/app/api/auth/oauth/[provider]/route.ts)
`POST /api/auth/oauth/google` or `/api/auth/oauth/facebook`
- Request: `{ locale }`
- Response: `{ url }` (redirect to OAuth provider)

#### [api/auth/request-otp/route.ts](./frontend/src/app/api/auth/request-otp/route.ts)
`POST /api/auth/request-otp`
- Request: `{ email }`
- Response: `{ data }` or `{ error }`

#### [api/auth/verify-otp-and-reset/route.ts](./frontend/src/app/api/auth/verify-otp-and-reset/route.ts)
`POST /api/auth/verify-otp-and-reset`
- Request: `{ email, code, newPassword }`
- Response: `{ data }` or `{ error }`

#### [auth/callback/route.ts](./frontend/src/app/auth/callback/route.ts)
`GET /auth/callback?code=...`
- OAuth redirect handler
- Exchanges code for session
- Redirects to locale-aware home page

---

### 5. **Middleware**

#### [frontend/middleware.ts](./frontend/middleware.ts)
Updated to:
1. **Run next-intl locale routing** (existing functionality preserved)
2. **Refresh Supabase session** on every request
3. **Protect admin routes** (`/admin/*`):
   - Redirects unauthenticated users to `/[locale]/login`
   - Ready for role-based checks with profiles table

---

### 6. **Internationalization**

#### [frontend/src/messages/en.json](./frontend/src/messages/en.json)
Added `auth` namespace with keys:
- `auth.common.*` - Shared labels & errors
- `auth.login.*` - Login page text
- `auth.signup.*` - Signup page text
- `auth.forgotPassword.*` - Forgot password page
- `auth.resetPassword.*` - Reset password page

#### [frontend/src/messages/ne.json](./frontend/src/messages/ne.json)
Same structure with Nepali translations.

---

## 🚀 Implementation Steps

### Step 1: Supabase Configuration (Manual)
1. Follow [SETUP.md](./SETUP.md) to configure:
   - Email/password provider
   - Google OAuth (requires Google Cloud app)
   - Facebook OAuth (requires Facebook Developer app)
   - Email templates (optional)

### Step 2: Database Setup
1. Open your Supabase SQL Editor
2. Copy and run [DATABASE_SETUP.sql](./DATABASE_SETUP.sql)
3. This creates the `profiles` table with:
   - Auto-profile creation on signup
   - RLS policies for users & admins
   - Role-based access control

### Step 3: Environment Variables
Ensure `.env.local` contains:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### Step 4: Deploy Files
All files are already created. No additional setup needed except:
- Verify API routes are accessible
- Test OAuth callbacks work
- Check middleware session refresh in browser DevTools Network tab

### Step 5: Test Flows

**Email/Password Login:**
1. Navigate to `http://localhost:3000/en/signup`
2. Create account (name, email, password)
3. Redirect to home page
4. Navigate to `http://localhost:3000/en/login`
5. Sign in with email/password

**Password Reset:**
1. On login page, click "Forgot password?"
2. Enter email, receive OTP
3. Copy 6-digit code from email
4. Enter code + new password on reset page
5. Success → redirected to login

**OAuth (Google/Facebook):**
1. Click "Continue with Google" or Facebook
2. Authenticate with provider
3. Auto-redirected to home page
4. Session stored in cookies

**Admin Routes:**
1. Unauthenticated user visits `/en/admin/dashboard`
2. Automatically redirected to `/en/login`
3. After login, can access admin routes (if user role = 'admin')

---

## 🎨 Styling Notes

All forms use **CSS custom properties** from `globals.css`:
- **Colors**: `--maroon-950`, `--maroon-900`, `--gold-500`, `--ivory-50`, `--ivory-100`, `--text-dark`
- **Fonts**: `--ff-display` (headings), `--ff-body` (paragraphs), `--ff-heading` (labels)
- **Button classes**: `.btn-primary` (gold filled), `.btn-outline` (gold outline)
- **Input styling**: `background: var(--ivory-100); border: 1px solid var(--ivory-300); padding: 9px 12px;`

No Tailwind CSS — pure CSS custom properties and inline styles for consistency.

---

## 🔐 Security Notes

1. **Passwords**: Never sent to client. Handled by Supabase only.
2. **Session tokens**: Stored in secure HTTP-only cookies by Supabase SDK.
3. **RLS Policies**: Users can only read/update their own profile; admins can read all.
4. **OTP Codes**: 6-digit codes expire after 24 hours (Supabase default).
5. **Environment variables**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.

---

## 📱 Route Structure

```
/en/ (home)
├── /en/login (auth layout)
├── /en/signup (auth layout)
├── /en/forgot-password (auth layout)
├── /en/reset-password (auth layout)
├── /en/admin/* (protected, redirects if not logged in)
└── ... (other pages)

/ne/ (Nepali routes follow same structure)

/auth/callback (OAuth redirect, not locale-prefixed)
/api/auth/* (API routes for authentication)
```

---

## ✅ Translation Keys Reference

### Common Keys (`auth.common`)
- `email`, `emailRequired`, `emailInvalid`
- `password`, `passwordRequired`, `confirmPassword`
- `loading`, `or`, `errorGeneric`
- `noAccount`, `hasAccount`, `signUp`, `logIn`

### Login Keys (`auth.login`)
- `title`, `submitButton`, `forgotPassword`
- `googleButton`, `facebookButton`

### Signup Keys (`auth.signup`)
- `title`, `submitButton`, `name`, `namePlaceholder`, `nameRequired`
- `passwordTooShort`, `confirmPasswordRequired`, `passwordsMismatch`
- `googleButton`, `facebookButton`

### Forgot Password Keys (`auth.forgotPassword`)
- `title`, `subtitle`, `submitButton`, `emailHint`
- `checkEmail`, `checkEmailMessage`, `checkEmailCode`
- `resetPasswordButton`, `backToLogin`

### Reset Password Keys (`auth.resetPassword`)
- `title`, `subtitle`, `submitButton`
- `code`, `codeRequired`, `codeInvalid`, `codeHint`
- `newPassword`, `confirmPasswordRequired`, `passwordTooShort`, `passwordsMismatch`
- `successTitle`, `successMessage`, `redirecting`, `backToLogin`

---

## 🐛 Troubleshooting

**OAuth redirects to error page:**
- Verify redirect URIs in Google Cloud & Facebook match exactly: `https://YOUR_SUPABASE_URL/auth/v1/callback`
- Check Supabase dashboard for provider credentials

**OTP codes not received:**
- Verify email templates are configured in Supabase
- Check Supabase Logs tab for email delivery errors
- Confirm email addresses are correct

**Session not persisting between pages:**
- Clear cookies and local storage
- Check middleware.ts is running (add console.logs if needed)
- Verify `.env.local` has correct Supabase credentials

**Admin routes still accessible without auth:**
- Restart dev server after updating middleware.ts
- Check Network tab to confirm session refresh is happening

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

---

## ✨ Next Steps

1. **Admin Dashboard**: Create admin pages at `frontend/src/app/[locale]/admin/`
2. **Profile Management**: Add profile edit page at `frontend/src/app/[locale]/profile/`
3. **User Notifications**: Integrate toast/alert library for better UX
4. **Email Customization**: Create branded password reset emails in Supabase
5. **Logging & Analytics**: Track auth events (login, signup, failed attempts)

---

**System built with Next.js 16 (App Router), Supabase, next-intl, and plain CSS.**
