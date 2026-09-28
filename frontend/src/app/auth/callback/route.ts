/**
 * GET /auth/callback — where Supabase sends the browser back after
 *   • Google / Facebook OAuth           (?code=…)
 *   • the sign-up confirmation email    (?code=… or ?token_hash=…&type=signup)
 * Exchanges it for a session cookie, then redirects to ?next (same-site path
 * only), keeping the visitor's language. Lives outside [locale] because the
 * redirect URL registered with Supabase/Google/Facebook must be fixed.
 */
import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/auth/actions';

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = await safeNext(url.searchParams.get('next'), 'en');
  const locale = next.match(/^\/(en|ne)(?:\/|$)/)?.[1] ?? 'en';
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/${locale}/login?error=${reason}`, url.origin));

  if (url.searchParams.get('error')) return fail('oauth');   // user cancelled / provider error

  const supabase = await createClient();
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail('oauth');
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return fail('link');
  } else {
    return fail('link');
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
