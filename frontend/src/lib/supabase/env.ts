/**
 * Supabase public config. Both values are safe for the browser (the anon key
 * only has the rights Row Level Security grants). The service-role key is
 * NEVER used in the frontend — only the FastAPI backend has it.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
