/**
 * The FastAPI backend's base URL — one place, so a trailing slash or a missing
 * env var can't behave differently in each caller.
 *
 * Neither value ends in a slash and neither includes `/api`: every caller
 * appends `/api/v1/...` itself. Putting `/api` in NEXT_PUBLIC_API_URL produces
 * `/api/api/v1` and 404s — see `.env.example`.
 *
 *   API_BASE         browser-visible; only NEXT_PUBLIC_* is inlined into the
 *                    client bundle, so this is the one Client Components use.
 *   SERVER_API_BASE  Server Components / Server Actions. API_URL lets a
 *                    deployed frontend reach the backend on a private address
 *                    (e.g. the Docker service name) while the browser keeps
 *                    using the public one. Client-side `process.env.API_URL`
 *                    is undefined, so this falls back to API_BASE there.
 */
const strip = (url: string) => url.replace(/\/+$/, '');

/** Only for `npm run dev` with no .env.local; production must set the env var. */
const DEV_FALLBACK = 'http://localhost:8000';

export const API_BASE = strip(process.env.NEXT_PUBLIC_API_URL || DEV_FALLBACK);

export const SERVER_API_BASE = strip(
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || DEV_FALLBACK,
);
