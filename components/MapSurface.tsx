'use client';
/**
 * The map surface: base map plus venue pins. This is the ONLY file that differs between the map
 * branches (stylised SVG here, MapLibre on `map/maplibre`, Google on `map/google`), so the page,
 * pins' data, cards and face stacks stay identical and the comparison is fair.
 *
 * Contract: show `venues`, mark `sel` as selected, call `onSelect(id)` on a pin tap and
 * `onSelect(null)` on a tap of empty map. `hereBy` maps venue id to the people I follow who are
 * there now (place only, never a position).
 */
import { useMemo } from 'react';
import FaceStack from '@/components/FaceStack';
import MapBase from '@/components/MapBase';
import { spreadPins } from '@/lib/spread';
import { img, type Cat, type Venue } from '@/lib/types';

export interface MapSurfaceProps {
  venues: Venue[];
  sel: string | null;
  onSelect: (id: string | null) => void;
  hereBy: Map<string, string[]>;
}

export const CAT_LABEL: Record<Cat, string> = { eat: 'Eat', drink: 'Drink', do: 'Do' };

/** Stylised map size (matches the .mapbox aspect ratio) and the footprint of one pin plus its name. */
const MAP = { w: 390, h: 700 };
const PIN = { w: 84, h: 84 };

export default function MapSurface({ venues, sel, onSelect, hereBy }: MapSurfaceProps) {
  /** Pin positions after spacing. Computed over all venues so pins do not jump when filtering. */
  const pos = useMemo(() => spreadPins(venues.map((v) => ({ id: v.id, x: v.x, y: v.y })), MAP, PIN), [venues]);

  return (
    <div className="mapbox" onClick={() => onSelect(null)}>
      <MapBase />
      {venues.map((v) => {
        const people = hereBy.get(v.id) ?? [];
        const p = pos.get(v.id) ?? { x: v.x, y: v.y };
        return (
          <div key={v.id} className={`pinw ${v.id === sel ? 'sel' : ''}`} style={{ left: `${(p.x / MAP.w) * 100}%`, top: `${(p.y / MAP.h) * 100}%` }}>
            <button className="pin2" aria-pressed={v.id === sel} aria-label={`${v.name}, ${CAT_LABEL[v.cat]}${people.length ? `, ${people.length} people you follow are here` : ''}`}
              onClick={(e) => { e.stopPropagation(); onSelect(v.id === sel ? null : v.id); }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(v.logo ?? v.img)} alt="" />
              <span className="pn">{v.name}</span>
            </button>
            {people.length > 0 && <div className="pst"><FaceStack ids={people} popover /></div>}
          </div>
        );
      })}
      <p className="sm" style={{ position: 'absolute', left: 12, bottom: 8, right: 12, zIndex: 1, color: 'var(--i3)' }}>Stylised map. Positions approximate. Faces are people you follow who chose to share.</p>
    </div>
  );
}
