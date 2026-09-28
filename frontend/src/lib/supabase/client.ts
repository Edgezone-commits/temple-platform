/**
 * Supabase client for Client Components (browser). Used for things that must
 * happen in the browser: uploading files to Storage from the admin screens,
 * and attaching the user's token to the public booking request.
 */
'use client';
import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  if (!client) client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
