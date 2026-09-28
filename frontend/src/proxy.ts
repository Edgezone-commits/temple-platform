/**
 * Next.js 16 proxy (formerly "middleware"). Must live in src/, next to app/.
 *
 * On every page request:
 *   1. Refresh the Supabase auth session (rotating cookies when the access
 *      token is about to expire). Refreshed cookies are written to the
 *      REQUEST first so this request's Server Components see them, and then
 *      copied onto the response for the browser.
 *   2. next-intl locale routing (/ → /en, locale detection).
 *   3. Cheap gate for /<locale>/admin: not logged in → login page.
 *      (The role check — admin vs devotee — is done in the admin layout.)
 */
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from './lib/supabase/env';

const handleI18n = createIntlMiddleware(routing);

type CookieToSet = { name: string; value: string; options?: Parameters<NextResponse['cookies']['set']>[2] };

export default async function proxy(request: NextRequest) {
  const refreshed: CookieToSet[] = [];
  let user = null;

  if (supabaseConfigured) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          refreshed.push(...cookiesToSet);
        },
      },
    });
    try {
      // getUser() validates the token with Supabase and refreshes it if needed.
      ({ data: { user } } = await supabase.auth.getUser());
    } catch {
      user = null;   // Supabase unreachable: treat as logged out, never block the site.
    }
  }

  const { pathname } = request.nextUrl;
  const adminMatch = pathname.match(/^\/(en|ne)\/admin(?:\/|$)/);
  let response: NextResponse;
  if (adminMatch && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${adminMatch[1]}/login`;
    url.search = `?next=${encodeURIComponent(pathname)}`;
    response = NextResponse.redirect(url);
  } else {
    response = handleI18n(request);
  }

  refreshed.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

export const config = {
  // Skip API routes, Next internals, the OAuth callback and static files.
  matcher: ['/((?!api|auth|_next|_vercel|.*\\..*).*)'],
};
