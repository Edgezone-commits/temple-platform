/**
 * Server-side data fetching from the FastAPI backend.
 *
 * Used only by Server Components (the `server-only` import makes a client
 * import a build error). Every call returns `{ data, error }` instead of
 * throwing, so a backend outage shows a friendly "couldn't load" state rather
 * than crashing the whole page.
 *
 * Caching: responses are cached for REVALIDATE seconds and tagged, so the
 * Phase 6 admin screens can call revalidateTag('events') etc. after an edit
 * to refresh the public pages immediately.
 */
import 'server-only';
import { SERVER_API_BASE as BASE } from './apiUrl';
import type { Archana, Bhajan, Book, CalendarEntry, GalleryPhoto, LeaderProfile, Pooja, TempleEvent } from './types';

const REVALIDATE = 60;

export type ApiResult<T> = { data: T; error: false } | { data: null; error: true };

async function apiGet<T>(path: string, tag: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${BASE}/api/v1${path}`, {
      next: { revalidate: REVALIDATE, tags: [tag] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`[api] GET ${path} → ${res.status}`);
      return { data: null, error: true };
    }
    return { data: (await res.json()) as T, error: false };
  } catch (err) {
    console.error(`[api] GET ${path} failed:`, err instanceof Error ? err.message : err);
    return { data: null, error: true };
  }
}

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const getEvents = (opts: { upcoming?: boolean; limit?: number } = {}) =>
  apiGet<TempleEvent[]>(`/events/${qs({ upcoming: opts.upcoming, limit: opts.limit ?? 100 })}`, 'events');

export const getPoojas = () => apiGet<Pooja[]>('/poojas/', 'poojas');

export const getArchanas = () => apiGet<Archana[]>('/archanas/', 'archanas');

export const getBooks = () => apiGet<Book[]>('/books/?limit=100', 'books');

export const getBhajans = () => apiGet<Bhajan[]>('/bhajans/?limit=100', 'bhajans');

export const getCalendar = (opts: { start?: string; end?: string; limit?: number } = {}) =>
  apiGet<CalendarEntry[]>(`/calendar/${qs(opts)}`, 'calendar');

export const getGallery = () => apiGet<GalleryPhoto[]>('/gallery/?limit=500', 'gallery');

export const getLeadership = () => apiGet<LeaderProfile[]>('/leadership/?limit=200', 'leadership');
