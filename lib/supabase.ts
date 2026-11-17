/**
 * Supabase configuration and the shared browser client.
 *
 * Only public values are used here: the project URL and the publishable (or legacy anon) key.
 * Row-level security in supabase/schema.sql and supabase/auth.sql is what protects the data,
 * so these two values are safe to ship to the browser. Never add a secret/service_role key.
 *
 * NEXT_PUBLIC_* variables are inlined at build time, so each must be referenced literally.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the project is configured. When false the app runs on seed data and browser-only state. */
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

let browserClient: SupabaseClient | null = null;

/** Browser client with session persistence (used for sign-in and the signed-in user's own rows). */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  browserClient ??= createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return browserClient;
}
