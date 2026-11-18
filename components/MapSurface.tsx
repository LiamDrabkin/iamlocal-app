'use client';
/**
 * The one map component the pages use. It picks a provider (components/map/provider.ts) and lazy-loads
 * only that implementation, so the other maps never add to the page's weight. Every implementation
 * takes the same props (components/map/types.ts), so pins, cards and face stacks are identical and a
 * provider can be swapped without touching the page.
 *
 * Outside production a small switch lets you flip between maps live, to compare them on a phone.
 */
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { PROVIDERS, canSwitchMap, rememberProvider, resolveProvider, type MapProviderId } from '@/components/map/provider';
import { CAT_LABEL, type MapSurfaceProps } from '@/components/map/types';

export { CAT_LABEL };
export type { MapSurfaceProps };

/** Placeholder while a provider loads, sized like the map so the page does not jump. */
const Loading = () => <div className="mapbox" aria-busy="true"><p className="sm" style={{ padding: 16 }}>Loading the map</p></div>;

/** ssr: false because maplibre-gl and the Google loader both need the browser. */
const SURFACES: Record<MapProviderId, React.ComponentType<MapSurfaceProps>> = {
  maplibre: dynamic(() => import('@/components/map/MapLibreSurface'), { ssr: false, loading: Loading }),
  google: dynamic(() => import('@/components/map/GoogleSurface'), { ssr: false, loading: Loading }),
  stylised: dynamic(() => import('@/components/map/StylisedSurface'), { ssr: false, loading: Loading }),
};

export default function MapSurface(props: MapSurfaceProps) {
  // Unknown until the browser has read ?map= and the saved choice, so the wrong map is never mounted first.
  const [provider, setProvider] = useState<MapProviderId | null>(null);
  useEffect(() => setProvider(resolveProvider()), []);

  if (!provider) return <Loading />;
  const Surface = SURFACES[provider];

  return (
    <div className="mapwrap">
      {/* key: switching provider tears the old map down completely instead of reusing its state. */}
      <Surface key={provider} {...props} />
      {canSwitchMap && (
        <div className="mapsw" role="group" aria-label="Map provider (test builds only)">
          {PROVIDERS.map((p) => (
            <button key={p.id} className={`tog pill ${provider === p.id ? 'on' : ''}`} aria-pressed={provider === p.id} title={p.note}
              onClick={() => { rememberProvider(p.id); setProvider(p.id); }}>{p.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
