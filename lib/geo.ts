/**
 * Real-world coordinates for venues, kept out of the database so the map branches need no schema change.
 * `data/geo.json` is filled by `node scripts/geocode.mjs` (lookup from OpenStreetMap) and can be edited by hand.
 * A venue with no entry gets a rough position derived from its stylised x/y, flagged `approx`, so the map
 * still works before the lookup has run.
 */
import geo from '@/data/geo.json';
import type { Venue } from './types';

export interface LatLng { lat: number; lng: number; approx: boolean }

const TABLE = geo as Record<string, { lat: number; lng: number }>;

/** Hout Bay spans roughly lng 18.33 to 18.40 and lat -34.02 to -34.06; the stylised map is 390 x 700. */
const approxFromXY = (v: Venue): LatLng => ({ lng: 18.335 + (v.x / 390) * 0.06, lat: -34.025 - (v.y / 700) * 0.035, approx: true });

export function venueLatLng(v: Venue): LatLng {
  const g = TABLE[v.id];
  return g ? { lat: g.lat, lng: g.lng, approx: false } : approxFromXY(v);
}

/** Where the map opens: Hout Bay harbour. */
export const HOUT_BAY_CENTER = { lat: -34.0495, lng: 18.3565, zoom: 14 };
