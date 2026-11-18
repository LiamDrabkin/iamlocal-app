/**
 * Which base map to draw. The default comes from NEXT_PUBLIC_MAP_PROVIDER. Outside production a
 * `?map=` query parameter or the switch on the map page can override it (remembered per browser), so
 * maps can be compared on a phone while the UI is being worked on. Production always uses the default.
 *
 * To add a provider: add it to PROVIDERS, create components/map/<Name>Surface.tsx that takes
 * MapSurfaceProps, and register it in components/MapSurface.tsx.
 */
import { showExperiments } from '@/lib/themes';

export const PROVIDERS = [
  { id: 'maplibre', label: 'MapLibre', note: 'OpenStreetMap data, no key' },
  { id: 'google', label: 'Google', note: 'Needs a key and a Map ID' },
  { id: 'stylised', label: 'Stylised', note: 'Hand-drawn illustration' },
] as const;

export type MapProviderId = (typeof PROVIDERS)[number]['id'];

const KEY = 'ial-map';
const isProvider = (v: unknown): v is MapProviderId => PROVIDERS.some((p) => p.id === v);

/** MapLibre is the fallback: it needs no key and costs nothing to load. */
export const DEFAULT_PROVIDER: MapProviderId = isProvider(process.env.NEXT_PUBLIC_MAP_PROVIDER) ? process.env.NEXT_PUBLIC_MAP_PROVIDER : 'maplibre';

/** Whether the visitor may pick a provider (never on production). */
export const canSwitchMap = showExperiments;

/** Browser only. Order of precedence: ?map= (and remembered), then the default. */
export function resolveProvider(): MapProviderId {
  if (!canSwitchMap) return DEFAULT_PROVIDER;
  try {
    const q = new URLSearchParams(window.location.search).get('map');
    if (isProvider(q)) { window.localStorage.setItem(KEY, q); return q; }
    const saved = window.localStorage.getItem(KEY);
    if (isProvider(saved)) return saved;
  } catch { /* storage can be blocked; fall through to the default */ }
  return DEFAULT_PROVIDER;
}

export function rememberProvider(id: MapProviderId) {
  try { window.localStorage.setItem(KEY, id); } catch { /* ignore */ }
}
