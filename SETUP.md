# Supabase Authentication Setup for Shree Laxminarayan Mandir

This guide walks through the manual Supabase configuration required for the complete authentication system.

## Prerequisites

- Active Supabase project (https://app.supabase.com)
- Supabase URL and anon key already in `.env.local`
- Google Cloud Console account for OAuth
- Facebook Developer account for OAuth

---

## 1. Enable Email/Password Authentication

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Click on **Email** (should already be enabled by default)
3. Ensure **Email Confirmations** is set as needed:
   - If requiring email verification: toggle on
   - If allowing signups without confirmation: toggle off
4. Save and note the authentication URL (you'll need it for OAuth)

---

## 2. Set Up Google OAuth Provider

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: click the project selector dropdown → **New Project**
3. Name it "Shree Laxminarayan Mandir" and create it
4. Wait for the project to be created, then switch to it

### Step 2: Set Up OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Select **External** for User Type, click **Create**
3. Fill in the form:
   - **App name**: "Shree Laxminarayan Mandir"
   - **User support email**: your email
   - **Developer contact**: your email
4. On the next page, add the following scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Add yourself as a test user (or skip if publishing)
6. Click **Save and Continue**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Name it "Mandir Auth"
5. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR_SUPABASE_URL/auth/v1/callback
   ```
   (Replace `YOUR_SUPABASE_URL` with your actual Supabase project URL, e.g., `https://abcdefg.supabase.co`)
6. Click **Create**
7. Copy the **Client ID** and **Client Secret** (keep these secret)

### Step 4: Add Google OAuth to Supabase

1. Go to your Supabase dashboard → **Authentication** → **Providers** → **Google**
2. Paste the Google **Client ID** and **Client Secret**
3. Click **Save**

---

## 3. Set Up Facebook OAuth Provider

### Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Choose **Consumer** as the app type
4. Fill in the form:
   - **App Name**: "Shree Laxminarayan Mandir"
   - **App Contact Email**: your email
   - **App Purpose**: choose appropriate category
5. Complete the setup process

### Step 2: Set Up Facebook Login Product

1. In your Facebook app dashboard, go to **Products**
2. Click **Add Product** and find **Facebook Login**
3. Click **Set Up**
4. Choose **Web** as the platform
5. In **Settings** → **Basic**, note your **App ID** and **App Secret** (keep these secret)

### Step 3: Configure Redirect URIs

1. Go to **Facebook Login** → **Settings**
2. Under **Valid OAuth Redirect URIs**, add:
   ```
   https://YOUR_SUPABASE_URL/auth/v1/callback
   ```
   (Replace `YOUR_SUPABASE_URL` with your actual Supabase URL)
3. Save changes

### Step 4: Add Facebook OAuth to Supabase

1. Go to your Supabase dashboard → **Authentication** → **Providers** → **Facebook**
2. Paste the Facebook **App ID** and **App Secret**
3. Click **Save**

---

## 4. Customize Email Templates (Optional but Recommended)

The password reset flow uses a 6-digit OTP code instead of a magic link. Customize the email template to reflect this:

1. Go to **Authentication** → **Email Templates**
2. Find the **Reset Password** template
3. Edit the template text to something like:

   ```
   Your password reset code is: {{ .TokenHash }}
   
   This code will expire in 24 hours.
   
   If you did not request a password reset, ignore this email.
   ```

   (Supabase will replace `{{ .TokenHash }}` with the actual OTP code)

4. Click **Save**

---

## 5. Enable "Confirm email" Row Level Security (Optional)

If you enabled email confirmations in step 1:

1. Go to **Database** → **Roles**
2. Verify that `authenticated` and `service_role` are listed
3. We'll use RLS policies when we create the `profiles` table (see Database Setup section)

---

## 6. Set Session Duration (Optional)

1. Go to **Authentication** → **Providers** → **Email**
2. Adjust **JWT Expiry Limit** (default 1 hour)
3. This controls how long access tokens remain valid before refresh is needed

---

## Environment Variables

Ensure your `.env.local` contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These are used by the frontend Supabase client to initialize authentication.

---

## Next Steps

1. Run the database setup SQL from `DATABASE_SETUP.sql` in your Supabase SQL editor
2. Deploy the auth pages, server actions, and middleware from this project
3. Test login/signup flows locally before deploying to production

For troubleshooting:
- Check **Authentication** → **Users** to see if accounts are being created
- Check **Logs** in the Supabase dashboard for auth-related errors
- Verify redirect URIs match exactly (no trailing slashes, correct protocol)
