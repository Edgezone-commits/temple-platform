/**
 * Next.js 16 proxy (formerly "middleware").
 *
 * Must live in src/ — next to app/ — or Next.js silently ignores it. The old
 * frontend/middleware.ts at the project root never ran, so locale routing
 * (/ → /en) was broken.
 *
 * Currently: next-intl locale detection + redirects.
 * Phase 5 adds Supabase session refresh here.
 */
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals, the OAuth callback and static files.
  matcher: ['/((?!api|auth|_next|_vercel|.*\..*).*)'],
};
