'use client';
/**
 * Authentication context (Supabase Auth, passwordless email link).
 *
 * Signing in is optional: the whole app can be browsed anonymously. Signing in only changes
 * where a visitor's own state is kept (their account instead of this browser; see lib/store.tsx).
 * When Supabase is not configured, `enabled` is false and the UI hides every sign-in control.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase, supabaseConfigured } from './supabase';

interface AuthCtx {
  /** Supabase is configured, so sign-in is available. */
  enabled: boolean;
  /** Signed-in user, or null for an anonymous visitor. */
  user: User | null;
  /** True until the first session check has finished. */
  loading: boolean;
  /** Email a one-time sign-in link. Resolves to an error message, or null on success. */
  signIn: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false); });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string) => {
    const sb = getSupabase();
    if (!sb) return 'Sign-in is not available in this build.';
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      // Returns the visitor to the app after they tap the emailed link. The URL must be allow-listed in Supabase.
      options: { emailRedirectTo: `${window.location.origin}/favourites`, shouldCreateUser: true },
    });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => { await getSupabase()?.auth.signOut(); }, []);

  const value = useMemo<AuthCtx>(() => ({ enabled: supabaseConfigured, user, loading, signIn, signOut }), [user, loading, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}
