'use client';
/**
 * Client state. An anonymous visitor's follows, likes, posts and settings live in their own
 * browser (localStorage), so the demo can be shared freely and reset from Settings.
 * A signed-in visitor's state is also saved to their account (see lib/userState.ts), so it
 * follows them across devices. The account copy wins when one exists; otherwise the browser
 * copy is uploaded the first time they sign in.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { loadUserState, saveUserState } from './userState';
import type { Visit } from './visits';
import { ME, type AppData, type Person, type Post, type Review, type Venue } from './types';

const KEY = 'ial-demo-v2';

export interface Local {
  theme: 'light' | 'dark' | 'system';
  following: string[]; // people
  venueFollows: string[];
  favs: string[]; // venues shown on Favourites
  alerts: string[]; // venues with deal alerts on
  liked: string[];
  reposted: string[];
  sharing: boolean; // my own busy-level sharing
  visits: string[]; // venues with a confirmed, not yet reviewed visit
  rule: 'active' | 'local'; // open product question, kept as a prototype switch
  notif: { deals: boolean; friends: boolean; receipts: boolean };
  reviewsFollowersOnly: boolean;
  myReviews: Review[];
  myPosts: Post[];
  history: Visit[]; // Doorway history: check-ins, with receipt confirmed or not
  checkedIn: string | null; // venue id of the current check-in, if any
}

const DEFAULTS: Local = {
  theme: 'system',
  following: ['ana', 'daria', 'craig', 'james', 'mischelle', 'aedan', 'philip'],
  venueFollows: ['w', 'l', 'b', 'd'],
  favs: ['w', 'l', 'b', 'd'],
  alerts: ['w', 'l', 'b'],
  liked: [],
  reposted: [],
  sharing: false,
  visits: ['b', 'd'], // Woodcutters starts locked so the receipt flow can be tried
  rule: 'local',
  notif: { deals: true, friends: true, receipts: true },
  reviewsFollowersOnly: false,
  myReviews: [],
  myPosts: [],
  // Two sample rows so the history is not empty on first view; labelled Sample in the UI.
  history: [
    { venueId: 'b', at: '2026-11-13T18:20:00+02:00', receipt: true, sample: true },
    { venueId: 'd', at: '2026-11-08T13:10:00+02:00', receipt: true, sample: true },
  ],
  checkedIn: null,
};

interface Ctx {
  data: AppData;
  s: Local;
  set: (patch: Partial<Local>) => void;
  /** Add or remove an id in one of the list fields. */
  flip: (key: 'following' | 'venueFollows' | 'favs' | 'alerts' | 'liked' | 'reposted', id: string) => void;
  has: (key: 'following' | 'venueFollows' | 'favs' | 'alerts' | 'liked' | 'reposted' | 'visits', id: string) => boolean;
  person: (id: string) => Person;
  venue: (id: string) => Venue;
  me: Person;
  reset: () => void;
  ready: boolean;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ data, children }: { data: AppData; children: ReactNode }) {
  const [s, setS] = useState<Local>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const { user } = useAuth();
  const userId = user?.id ?? null;
  // Account sync bookkeeping: which user's state is loaded, and the last JSON we sent or received.
  const syncedFor = useRef<string | null>(null);
  const lastSynced = useRef<string>('');
  const sRef = useRef(s);
  sRef.current = s;

  // Load saved state after mount (keeps server and first client render identical).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* private mode: run on defaults */ }
    setReady(true);
  }, []);

  // On sign-in: adopt the account's saved state, or upload this browser's state if the account has none.
  useEffect(() => {
    if (!ready) return;
    if (!userId) { syncedFor.current = null; return; }
    let cancelled = false;
    (async () => {
      const remote = await loadUserState<Partial<Local>>(userId);
      if (cancelled) return;
      if (remote) {
        const merged = { ...DEFAULTS, ...remote };
        lastSynced.current = JSON.stringify(merged);
        setS(merged);
      } else {
        lastSynced.current = JSON.stringify(sRef.current);
        await saveUserState(userId, sRef.current);
      }
      syncedFor.current = userId;
    })();
    return () => { cancelled = true; };
  }, [userId, ready]);

  // While signed in, save changes to the account shortly after they stop (debounced).
  useEffect(() => {
    if (!userId || syncedFor.current !== userId) return;
    const json = JSON.stringify(s);
    if (json === lastSynced.current) return;
    const t = setTimeout(() => { lastSynced.current = json; void saveUserState(userId, s); }, 800);
    return () => clearTimeout(t);
  }, [s, userId]);

  // Persist and apply theme.
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, [s, ready]);

  useEffect(() => {
    // Wait for the saved choice to load; until then the pre-paint script in layout.tsx owns the theme.
    if (!ready) return;
    const apply = () => {
      const dark = s.theme === 'dark' || (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    if (s.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [s.theme, ready]);

  const set = useCallback((patch: Partial<Local>) => setS((p) => ({ ...p, ...patch })), []);
  const flip: Ctx['flip'] = useCallback((key, id) => setS((p) => ({ ...p, [key]: p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id] })), []);
  const has: Ctx['has'] = useCallback((key, id) => s[key].includes(id), [s]);
  const reset = useCallback(() => setS(DEFAULTS), []);

  const value = useMemo<Ctx>(() => {
    const pm = new Map(data.people.map((p) => [p.id, p]));
    const vm = new Map(data.venues.map((v) => [v.id, v]));
    return {
      data, s, set, flip, has, reset, ready,
      person: (id) => pm.get(id) ?? data.people[0],
      venue: (id) => vm.get(id) ?? data.venues[0],
      me: pm.get(ME) ?? data.people[0],
    };
  }, [data, s, set, flip, has, reset, ready]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp must be used inside AppProvider');
  return c;
}
