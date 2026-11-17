'use client';
/**
 * MapSurface, MapLibre version (branch map/maplibre). Same contract as the stylised version on `dev`:
 * show `venues`, mark `sel`, call `onSelect(id | null)`. Base map is OpenStreetMap data served by
 * OpenFreeMap (no account or key). Pins are normal HTML laid over the map, so the pin look, FaceStack
 * and cards are identical to the other branches.
 *
 * Performance: while the map moves, pins are positioned directly on their DOM nodes with a GPU
 * transform (no React render per frame). The de-overlap spacing, which is the expensive part, runs
 * only when the map settles (`moveend`) and is stored as a fixed pixel offset per pin.
 */
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Map as MLMap } from 'maplibre-gl';
import FaceStack from '@/components/FaceStack';
import { HOUT_BAY_CENTER, clearGeoOverrides, exportGeoJson, geoOverrideCount, loadGeoOverrides, setGeoOverride, venueLatLng } from '@/lib/geo';
import { spreadPins } from '@/lib/spread';
import { pinImg, type Cat, type Venue } from '@/lib/types';

export interface MapSurfaceProps {
  venues: Venue[];
  sel: string | null;
  onSelect: (id: string | null) => void;
  hereBy: Map<string, string[]>;
}

export const CAT_LABEL: Record<Cat, string> = { eat: 'Eat', drink: 'Drink', do: 'Do' };

/** Override with NEXT_PUBLIC_MAP_STYLE to try another OpenFreeMap style (bright, positron) or a MapTiler URL. */
const STYLE = process.env.NEXT_PUBLIC_MAP_STYLE ?? 'https://tiles.openfreemap.org/styles/liberty';

/** Pin size by zoom: small logo dots far out, full logo and name up close. The footprint feeds the de-overlap step. */
const sizeFor = (zoom: number) => (zoom >= 15.5 ? { img: 56, w: 92, h: 90, names: true } : zoom >= 14.5 ? { img: 48, w: 58, h: 58, names: false } : { img: 40, w: 44, h: 44, names: false });

export default function MapSurface({ venues, sel, onSelect, hereBy }: MapSurfaceProps) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const firstVenues = useRef(venues); // used once, to frame the opening view
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [ready, setReady] = useState(false);
  const [edit, setEdit] = useState(false); // pin editor: /map?edit=1
  const [edited, setEdited] = useState(0); // how many pins I have moved
  const [copied, setCopied] = useState(false);
  const dragging = useRef<string | null>(null);
  const [settled, setSettled] = useState(0); // bumped when the map stops moving: time to re-space pins
  const [size, setSize] = useState(() => sizeFor(HOUT_BAY_CENTER.zoom));
  const venuesRef = useRef(venues);
  venuesRef.current = venues;
  const pinEls = useRef(new Map<string, HTMLDivElement>());
  const offsets = useRef(new Map<string, { dx: number; dy: number }>()); // spacing nudge per pin, in pixels

  /** Move every pin to its projected screen position plus its spacing offset. Cheap: touches only transforms. */
  const place = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const v of venuesRef.current) {
      const el = pinEls.current.get(v.id);
      if (!el) continue;
      const c = venueLatLng(v);
      const p = map.project([c.lng, c.lat]);
      const o = offsets.current.get(v.id);
      el.style.transform = `translate3d(${p.x + (o?.dx ?? 0)}px, ${p.y + (o?.dy ?? 0)}px, 0) translate(-50%, -50%)`;
    }
  }, []);

  // Create the map once. maplibre-gl needs the browser, so it is loaded on demand.
  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let map: MLMap | undefined;
    loadGeoOverrides();
    setEdit(new URLSearchParams(window.location.search).get('edit') === '1');
    setEdited(geoOverrideCount());
    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      if (cancelled || !holder.current) return;
      map = new maplibregl.Map({
        container: holder.current, style: STYLE, center: [HOUT_BAY_CENTER.lng, HOUT_BAY_CENTER.lat], zoom: HOUT_BAY_CENTER.zoom,
        minZoom: 12, maxZoom: 18, attributionControl: { compact: true },
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
      const follow = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
      const settle = () => setSettled((t) => t + 1);
      map.on('move', follow);
      map.on('moveend', settle);
      map.on('resize', settle);
      map.on('click', () => onSelectRef.current(null));
      map.once('load', () => {
        // Frame every venue on first view.
        const b = new maplibregl.LngLatBounds();
        // Only venues with a looked-up position count: a rough guess must not drag the opening view away.
        firstVenues.current.forEach((v) => { const c = venueLatLng(v); if (!c.approx) b.extend([c.lng, c.lat]); });
        if (!b.isEmpty()) map?.fitBounds(b, { padding: { top: 90, bottom: 90, left: 70, right: 70 }, maxZoom: 15, duration: 0 });
        setReady(true);
        settle();
      });
    })();
    return () => { cancelled = true; cancelAnimationFrame(raf); map?.remove(); mapRef.current = null; };
  }, [place]);

  // Selecting a venue centres it (a little high, so the card does not cover it).
  useEffect(() => {
    const map = mapRef.current;
    const v = sel ? venues.find((x) => x.id === sel) : null;
    if (!ready || !map || !v) return;
    const c = venueLatLng(v);
    map.easeTo({ center: [c.lng, c.lat], zoom: Math.max(map.getZoom(), 15), offset: [0, -90], duration: 500 });
    // Only when the selection changes, not when the filtered list is rebuilt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, ready]);

  // When the map settles (or the list changes): work out the spacing offsets and size, then place the pins.
  useLayoutEffect(() => {
    const map = mapRef.current, el = holder.current;
    if (!ready || !map || !el) return;
    const sz = sizeFor(map.getZoom());
    const raw = venues.map((v) => { const c = venueLatLng(v); const p = map.project([c.lng, c.lat]); return { id: v.id, x: p.x, y: p.y }; });
    const spread = spreadPins(raw, { w: el.clientWidth, h: el.clientHeight }, { w: sz.w, h: sz.h }, 60);
    // In the pin editor pins sit exactly on their coordinates, so a dragged pin lands where it is dropped.
    offsets.current = edit ? new Map() : new Map(raw.map((r) => { const s = spread.get(r.id) ?? r; return [r.id, { dx: s.x - r.x, dy: s.y - r.y }]; }));
    setSize(sz);
    place();
  }, [venues, ready, settled, place, edit]);

  return (
    <div className="mapbox rmap" style={{ ['--pin' as string]: `${size.img}px` } as React.CSSProperties}>
      <div ref={holder} className="rcanvas" />
      {edit && (
        <div className="rpanel" role="region" aria-label="Pin editor">
          <h3>Pin editor</h3>
          <p className="sm">Drag each pin onto the right spot. Zoom in for accuracy. {edited} moved.</p>
          <button className="btn s" style={{ minHeight: 44 }} onClick={() => { void navigator.clipboard.writeText(exportGeoJson()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); }); }}>{copied ? 'Copied' : 'Copy positions'}</button>
          <button className="btn s" style={{ minHeight: 44 }} onClick={() => { clearGeoOverrides(); setEdited(0); setSettled((t) => t + 1); }}>Undo all my moves</button>
        </div>
      )}
      {ready && (
        <div className={`rpins ${size.names ? '' : 'nonames'}`}>
          {venues.map((v) => {
            const people = hereBy.get(v.id) ?? [];
            return (
              <div key={v.id} className={`pinw ${v.id === sel ? 'sel' : ''}`}
                ref={(el) => { if (el) { pinEls.current.set(v.id, el); } else { pinEls.current.delete(v.id); } }}>
                <button className="pin2" aria-pressed={v.id === sel} aria-label={`${v.name}, ${CAT_LABEL[v.cat]}${people.length ? `, ${people.length} people you follow are here` : ''}`}
                  style={edit ? { touchAction: 'none', cursor: 'grab' } : undefined}
                  onPointerDown={(e) => {
                    if (!edit) return;
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    dragging.current = v.id;
                    mapRef.current?.dragPan.disable();
                    onSelect(v.id);
                  }}
                  onPointerMove={(e) => {
                    const map = mapRef.current, box = holder.current;
                    if (!edit || dragging.current !== v.id || !map || !box) return;
                    const r = box.getBoundingClientRect();
                    const ll = map.unproject([e.clientX - r.left, e.clientY - r.top]);
                    setGeoOverride(v.id, { lat: ll.lat, lng: ll.lng });
                    place();
                  }}
                  onPointerUp={() => { if (dragging.current) { dragging.current = null; mapRef.current?.dragPan.enable(); setEdited(geoOverrideCount()); } }}
                  onClick={(e) => { e.stopPropagation(); if (!edit) onSelect(v.id === sel ? null : v.id); }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pinImg(v)} alt="" />
                  <span className="pn">{v.name}</span>
                </button>
                {people.length > 0 && <div className="pst"><FaceStack ids={people} popover /></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
