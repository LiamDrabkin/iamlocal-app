/** Shared data shapes. Mirrors supabase/schema.sql (snake_case there, camelCase here). */

export type Cat = 'eat' | 'drink' | 'do';
export type Level = 'Visitor' | 'Active' | 'Local' | 'Regular';

export interface Person {
  id: string;
  name: string;
  level: Level;
  bio: string;
  avatar: string; // file stem in /public/img
  sharing: boolean; // chose to share busy level
  at: string | null; // venue id they are at now (place only, never a position)
  recent: string[]; // venue ids
  photos?: string[]; // photo wall on the profile (file stems in /public/img)
}

export interface Venue {
  id: string;
  name: string;
  kind: string;
  cat: Cat;
  x: number; // stylised map position (0..390)
  y: number; // (0..768)
  score: number; // SAMPLE customer score
  trust: number; // SAMPLE "honours locals fairly" value
  img: string; // hero photo: cover, list thumbnail, map card
  logo?: string | null; // insignia; used as the venue avatar in the feed
  gallery?: string[]; // extra photos on the venue page
  blurb: string | null;
  deal: string | null;
  address?: string | null;
  website?: string | null;
  instagram?: string | null;
}

export interface EventItem {
  id: string;
  venueId: string;
  title: string;
  whenText: string;
  going: string[]; // person ids shown as faces
  goingMore: number;
  chip: string | null;
}

export interface Post {
  id: string;
  authorKind: 'person' | 'venue';
  authorId: string;
  venueId: string | null;
  text: string;
  photo: string | null;
  chip: string | null;
  likes: number;
  reps: number;
  at: string;
  rating?: number | null;
}

export interface Review {
  id: string;
  venueId: string;
  personId: string;
  rating: number;
  text: string;
}

export interface AppData {
  people: Person[];
  venues: Venue[];
  events: EventItem[];
  posts: Post[];
  reviews: Review[];
  source: 'supabase' | 'sample';
}

/** Small square thumbnail of a venue for map pins, or its logo. See scripts/make_pin_thumbs.py. */
export const pinImg = (v: { logo?: string | null; img: string }) => img(v.logo ?? `${v.img}-pin`);

/** Id of the person using the mock. */
export const ME = 'liam';

/** Public path of an image stem. */
/** File stem in /public/img, or a ready URL (a picked photo saved as a data URL). */
export const img = (stem: string) => (/^(data:|https?:)/.test(stem) ? stem : `/img/${stem}.jpg`);
