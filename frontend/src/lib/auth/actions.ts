'use server';
/**
 * Server Actions for every auth operation (used by the (auth) pages and the
 * header's logout button). Forms post straight to these, so they also work
 * without JavaScript.
 *
 *   signIn               email + password
 *   signUp               name + email + password (email confirmation link)
 *   requestPasswordReset email → Supabase emails a 6-digit CODE (not a link;
 *                        requires the "Reset Password" email template to use
 *                        {{ .Token }} — see MANUAL_STEPS.md)
 *   resetPassword        email + code + new password
 *   signInWithProvider   Google / Facebook OAuth
 *   signOut
 *
 * Errors come back as translation keys (auth.errors.*) — never raw Supabase
 * English text — so Nepali pages stay Nepali.
 */
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/env';

export type AuthErrorKey =
  | 'invalidCredentials' | 'emailNotConfirmed' | 'userExists' | 'weakPassword'
  | 'passwordMismatch' | 'invalidEmail' | 'nameRequired' | 'codeInvalid' | 'rateLimited'
  | 'samePassword' | 'notConfigured' | 'generic';

export interface AuthState {
  error?: AuthErrorKey;
  ok?: 'checkEmail' | 'codeSent';
  email?: string;
}

const MIN_PASSWORD = 8;
const LOCALES = ['en', 'ne'];

// ---------------------------------------------------------------- helpers
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const localeOf = (fd: FormData) => (LOCALES.includes(str(fd, 'locale')) ? str(fd, 'locale') : 'en');
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/** Only allow same-site relative paths as post-login destinations. */
export async function safeNext(next: string | null | undefined, locale: string): Promise<string> {
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\')) return next;
  return `/${locale}`;
}

/** Public origin for email/OAuth redirect links. */
async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

function mapError(e: AuthError | null): AuthErrorKey {
  if (!e) return 'generic';
  switch (e.code) {
    case 'invalid_credentials': return 'invalidCredentials';
    case 'email_not_confirmed': return 'emailNotConfirmed';
    case 'user_already_exists':
    case 'email_exists': return 'userExists';
    case 'weak_password': return 'weakPassword';
    case 'same_password': return 'samePassword';
    case 'otp_expired':
    case 'otp_disabled': return 'codeInvalid';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit': return 'rateLimited';
    case 'email_address_invalid':
    case 'validation_failed': return 'invalidEmail';
  }
  if (e.status === 429) return 'rateLimited';
  if (/token has expired|invalid/i.test(e.message) && e.status === 403) return 'codeInvalid';
  return 'generic';
}

// ---------------------------------------------------------------- actions
export async function signIn(_prev: AuthState, fd: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { error: 'notConfigured' };
  const locale = localeOf(fd);
  const email = str(fd, 'email').toLowerCase();
  const password = String(fd.get('password') ?? '');
  if (!isEmail(email)) return { error: 'invalidEmail', email };
  if (!password) return { error: 'invalidCredentials', email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: mapError(error), email };

  revalidatePath('/', 'layout');
  redirect(await safeNext(str(fd, 'next'), locale));
}

export async function signUp(_prev: AuthState, fd: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { error: 'notConfigured' };
  const locale = localeOf(fd);
  const name = str(fd, 'name');
  const email = str(fd, 'email').toLowerCase();
  const password = String(fd.get('password') ?? '');
  const confirm = String(fd.get('confirm') ?? '');
  if (name.length < 2) return { error: 'nameRequired', email };
  if (!isEmail(email)) return { error: 'invalidEmail', email };
  if (password.length < MIN_PASSWORD) return { error: 'weakPassword', email };
  if (password !== confirm) return { error: 'passwordMismatch', email };

  const supabase = await createClient();
  const next = await safeNext(str(fd, 'next'), locale);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name, locale },   // read by the profiles trigger
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: mapError(error), email };
  // Supabase returns a user with no identities when the email is already registered
  // (it deliberately doesn't error, to avoid revealing accounts).
  if (data.user && data.user.identities?.length === 0) return { error: 'userExists', email };
  if (!data.session) return { ok: 'checkEmail', email };   // email confirmation required

  revalidatePath('/', 'layout');
  redirect(next);
}

export async function requestPasswordReset(_prev: AuthState, fd: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { error: 'notConfigured' };
  const locale = localeOf(fd);
  const email = str(fd, 'email').toLowerCase();
  if (!isEmail(email)) return { error: 'invalidEmail', email };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/${locale}/reset-password`,
  });
  // Don't reveal whether the address has an account — only surface rate limits.
  if (error && mapError(error) === 'rateLimited') return { error: 'rateLimited', email };
  redirect(`/${locale}/reset-password?email=${encodeURIComponent(email)}&sent=1`);
}

export async function resetPassword(_prev: AuthState, fd: FormData): Promise<AuthState> {
  if (!supabaseConfigured) return { error: 'notConfigured' };
  const locale = localeOf(fd);
  const email = str(fd, 'email').toLowerCase();
  const code = str(fd, 'code').replace(/\s/g, '');
  const password = String(fd.get('password') ?? '');
  const confirm = String(fd.get('confirm') ?? '');
  if (!isEmail(email)) return { error: 'invalidEmail', email };
  if (!/^\d{6,10}$/.test(code)) return { error: 'codeInvalid', email };
  if (password.length < MIN_PASSWORD) return { error: 'weakPassword', email };
  if (password !== confirm) return { error: 'passwordMismatch', email };

  const supabase = await createClient();
  const { error: otpError } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
  if (otpError) return { error: 'codeInvalid', email };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: mapError(error), email };

  // Sign out everywhere and ask for a fresh login with the new password.
  await supabase.auth.signOut({ scope: 'global' });
  revalidatePath('/', 'layout');
  redirect(`/${locale}/login?reset=1`);
}

export async function signInWithProvider(fd: FormData): Promise<void> {
  const locale = localeOf(fd);
  const provider = str(fd, 'provider');
  if (!supabaseConfigured || (provider !== 'google' && provider !== 'facebook')) {
    redirect(`/${locale}/login?error=oauth`);
  }
  const next = await safeNext(str(fd, 'next'), locale);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect(`/${locale}/login?error=oauth`);
  redirect(data.url);
}

export async function signOut(fd: FormData): Promise<void> {
  const locale = localeOf(fd);
  if (supabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath('/', 'layout');
  redirect(`/${locale}`);
}
