/**
 * Real-world coordinates for venues, kept out of the database so the map branches need no schema change.
 * `data/geo.json` is filled by `node scripts/geocode.mjs` (lookup from OpenStreetMap) and can be edited by hand
 * or with the in-map pin editor (open /map?edit=1, drag pins, press Copy). A venue with no entry gets a rough
 * position derived from its stylised x/y, flagged `approx`, so the map still works before the lookup has run.
 *
 * Edits made in the pin editor live in this browser's localStorage until they are copied into data/geo.json.
 */
import geo from '@/data/geo.json';
import type { Venue } from './types';

export interface LatLng { lat: number; lng: number; approx: boolean }
interface GeoEntry { lat: number; lng: number; manual?: boolean; match?: string; query?: string }

const TABLE = geo as Record<string, GeoEntry>;
const KEY = 'ial-geo-edit';
let overrides: Record<string, { lat: number; lng: number }> = {};

/** Hout Bay spans roughly lng 18.33 to 18.40 and lat -34.02 to -34.06; the stylised map is 390 x 700. */
const approxFromXY = (v: Venue): LatLng => ({ lng: 18.335 + (v.x / 390) * 0.06, lat: -34.025 - (v.y / 700) * 0.035, approx: true });

export function venueLatLng(v: Venue): LatLng {
  const o = overrides[v.id] ?? TABLE[v.id];
  return o ? { lat: o.lat, lng: o.lng, approx: false } : approxFromXY(v);
}

/** Load pin-editor edits saved in this browser. Browser only. */
export function loadGeoOverrides(): void {
  try { overrides = JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { overrides = {}; }
}
export function setGeoOverride(id: string, ll: { lat: number; lng: number }): void {
  overrides[id] = { lat: +ll.lat.toFixed(6), lng: +ll.lng.toFixed(6) };
  try { localStorage.setItem(KEY, JSON.stringify(overrides)); } catch { /* private mode: edits stay in memory */ }
}
export function clearGeoOverrides(): void {
  overrides = {};
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
export const geoOverrideCount = (): number => Object.keys(overrides).length;

/** The full contents for data/geo.json: the file's entries with my edits on top, marked manual so a re-run keeps them. */
export function exportGeoJson(): string {
  const out: Record<string, GeoEntry> = { ...TABLE };
  for (const [id, ll] of Object.entries(overrides)) out[id] = { lat: ll.lat, lng: ll.lng, manual: true };
  return JSON.stringify(out, null, 2) + '\n';
}

/** Where the map opens: Hout Bay harbour. */
export const HOUT_BAY_CENTER = { lat: -34.0495, lng: 18.3565, zoom: 14 };
