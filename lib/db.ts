import { createClient } from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL } from './supabase';
import seed from '@/data/seed.json';
import type { AppData, EventItem, Person, Post, Review, Venue } from './types';

/**
 * Data access. Runs on the server (see app/layout.tsx).
 * - If NEXT_PUBLIC_SUPABASE_URL and a publishable (or legacy anon) key are set, read from Supabase.
 * - If they are missing, or the read fails, fall back to data/seed.json so the demo never breaks.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
const sample = (): AppData => ({
  people: seed.people as unknown as Person[],
  venues: seed.venues as unknown as Venue[],
  events: (seed.events as any[]).map((e) => ({ id: e.id, venueId: e.venue_id, title: e.title, whenText: e.when_text, going: e.going, goingMore: e.going_more, chip: e.chip })),
  posts: (seed.posts as any[]).map((p) => ({ id: p.id, authorKind: p.author_kind, authorId: p.author_id, venueId: p.venue_id, text: p.text, photo: p.photo, chip: p.chip, likes: p.likes, reps: p.reps, at: p.at, rating: p.rating ?? null })),
  reviews: (seed.reviews as any[]).map((r) => ({ id: r.id, venueId: r.venue_id, personId: r.person_id, rating: r.rating, text: r.text })),
  source: 'sample',
});

export async function loadData(): Promise<AppData> {
  const url = SUPABASE_URL;
  const key = SUPABASE_KEY;
  if (!url || !key) return sample();

  try {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const [people, venues, events, posts, reviews] = await Promise.all([
      db.from('people').select('*'),
      db.from('venues').select('*'),
      db.from('events').select('*').order('id'),
      db.from('posts').select('*').order('id'),
      db.from('reviews').select('*').order('id'),
    ]);
    const failed = [people, venues, events, posts, reviews].find((r) => r.error || !r.data?.length);
    if (failed) return sample();

    return {
      people: people.data!.map((p: any): Person => ({ id: p.id, name: p.name, level: p.level, bio: p.bio ?? '', avatar: p.avatar, sharing: p.sharing, at: p.at_venue, recent: p.recent ?? [], photos: p.photos ?? [] })),
      venues: venues.data!.map((v: any): Venue => ({ id: v.id, name: v.name, kind: v.kind, cat: v.cat, x: v.x, y: v.y, score: Number(v.score), trust: v.trust, img: v.img, logo: v.logo, gallery: v.gallery ?? [], blurb: v.blurb, deal: v.deal, address: v.address, website: v.website, instagram: v.instagram })),
      events: events.data!.map((e: any): EventItem => ({ id: e.id, venueId: e.venue_id, title: e.title, whenText: e.when_text, going: e.going ?? [], goingMore: e.going_more, chip: e.chip })),
      posts: posts.data!.map((p: any): Post => ({ id: p.id, authorKind: p.author_kind, authorId: p.author_id, venueId: p.venue_id, text: p.body, photo: p.photo, chip: p.chip, likes: p.likes, reps: p.reps, at: p.at_text ?? '', rating: p.rating })),
      reviews: reviews.data!.map((r: any): Review => ({ id: r.id, venueId: r.venue_id, personId: r.person_id, rating: r.rating, text: r.body })),
      source: 'supabase',
    };
  } catch {
    return sample();
  }
}
