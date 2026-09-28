/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Reads/writes the auth cookies through next/headers. (In Server Components
 * cookies are read-only; the proxy refreshes the session on every request,
 * so the failed write there is expected and ignored.)
 */
import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from './env';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — safe to ignore (see file header).
        }
      },
    },
  });
}

export interface Account {
  id: string;
  email: string | null;
  name: string;
  isAdmin: boolean;
}

/**
 * The logged-in user with their profile role, or null.
 * Uses getUser() (validated with Supabase Auth), never the unverified session.
 */
export async function getAccount(): Promise<Account | null> {
  if (!supabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    // RLS lets a user read their own profile row.
    const { data: profile } = await supabase
      .from('profiles').select('display_name, role').eq('id', user.id).maybeSingle();
    const meta = user.user_metadata ?? {};
    return {
      id: user.id,
      email: user.email ?? null,
      name: profile?.display_name || meta.display_name || meta.full_name || user.email?.split('@')[0] || '',
      isAdmin: profile?.role === 'admin',
    };
  } catch {
    return null;
  }
}

/** Access token for calling the FastAPI backend on the user's behalf. */
export async function getAccessToken(): Promise<string | null> {
  const supabase = await createClient();
  // getUser() first so an expired/revoked session isn't used.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
