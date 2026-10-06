/**
 * Server-only helpers for the admin screens.
 *
 * adminFetch() calls the FastAPI backend with the logged-in admin's Supabase
 * access token (Authorization: Bearer …). The backend verifies the token and
 * profiles.role = 'admin' on every write — the service-role key never leaves
 * the backend.
 */
import 'server-only';
import { redirect } from 'next/navigation';
import { getAccessToken, getAccount, type Account } from '@/lib/supabase/server';
import { SERVER_API_BASE as BASE } from '@/lib/apiUrl';

export type AdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; detail?: unknown };

export async function adminFetch<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<AdminResult<T>> {
  const token = await getAccessToken();
  if (!token) return { ok: false, status: 401 };
  try {
    const res = await fetch(`${BASE}/api/v1${path}`, {
      method: init.method ?? 'GET',
      headers: { Authorization: `Bearer ${token}`, ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',                       // admin always sees live data
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 204) return { ok: true, data: null as T };
    const json = await res.json().catch(() => null);
    return res.ok ? { ok: true, data: json as T } : { ok: false, status: res.status, detail: json?.detail };
  } catch {
    return { ok: false, status: 0 };
  }
}

/** Use at the top of every admin page/action: returns the admin or redirects away. */
export async function requireAdmin(locale: string): Promise<Account> {
  const account = await getAccount();
  if (!account) redirect(`/${locale}/login?next=/${locale}/admin`);
  if (!account.isAdmin) redirect(`/${locale}?denied=admin`);
  return account;
}
