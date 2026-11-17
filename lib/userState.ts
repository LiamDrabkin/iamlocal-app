/**
 * Persistence for a signed-in user's own state (follows, likes, posts, settings).
 *
 * Interim design: one JSON document per user in `user_state`, protected by row-level security
 * (a user can only read and write their own row). It is deliberately small and isolated here so
 * it can be replaced by normalised tables (follows, likes, posts) without touching the UI.
 */
import { getSupabase } from './supabase';

/** Load the saved state for a user. Returns null when there is no row yet, or the table is unavailable. */
export async function loadUserState<T>(userId: string): Promise<T | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('user_state').select('state').eq('user_id', userId).maybeSingle();
  if (error) { console.warn('[user_state] load failed:', error.message); return null; }
  return (data?.state as T) ?? null;
}

/** Create or replace the saved state. Failures are logged and never block the UI. */
export async function saveUserState(userId: string, state: unknown): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('user_state').upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
  if (error) console.warn('[user_state] save failed:', error.message);
}
