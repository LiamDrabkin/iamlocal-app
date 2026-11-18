'use client';
/**
 * Google Maps implementation of the map contract (components/map/types.ts):
 * show `venues`, mark `sel`, call `onSelect(id | null)`. `hereBy` maps a venue id to the people I follow
 * who are there now (place only, never a position). The map implementations are interchangeable, so the
 * page, cards and face stacks stay identical and the comparison is fair.
 *
 * Pins are AdvancedMarkers (needs a vector Map ID) whose content is the same HTML pin the other branches
 * use. Google owns each marker's position; we only add a small pixel nudge so pins do not overlap.
 *
 * Performance: the de-overlap step is the expensive part, so it runs only when the map settles (`idle`),
 * never on every frame of a pan or zoom. Between settles the markers simply ride along with the map.
 *
 * Setup: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (HTTP-referrer and API restricted) and NEXT_PUBLIC_GOOGLE_MAP_ID.
 */
import { useEffect, useMemo, useState } from 'react';
import { APIProvider, AdvancedMarker, AdvancedMarkerAnchorPoint, Map as GoogleMap, useMap } from '@vis.gl/react-google-maps';
import FaceStack from '@/components/FaceStack';
import { CAT_LABEL, type MapSurfaceProps } from '@/components/map/types';
import { HOUT_BAY_CENTER, venueLatLng } from '@/lib/geo';
import { centreForOffset, latLngToViewport } from '@/lib/mercator';
import { spreadPins } from '@/lib/spread';
import { pinImg, type Venue } from '@/lib/types';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;

/** Pin size by zoom: small logo dots far out, full logo and name up close. The footprint feeds the de-overlap step. */
const sizeFor = (zoom: number) => (zoom >= 15.5 ? { img: 56, w: 92, h: 90, names: true } : zoom >= 14.5 ? { img: 48, w: 58, h: 58, names: false } : { img: 40, w: 44, h: 44, names: false });

/** Spacing is computed in a huge virtual viewport so pins that are off-screen are not clamped onto the edge. */
const VIRTUAL_PAD = 10_000;

type Nudge = { dx: number; dy: number };

/** Frame every venue that has a looked-up position (a rough guess must not drag the opening view away). */
function openingBounds(venues: Venue[]): google.maps.LatLngBoundsLiteral | undefined {
  const pts = venues.map(venueLatLng).filter((c) => !c.approx);
  if (!pts.length) return undefined;
  const lats = pts.map((p) => p.lat), lngs = pts.map((p) => p.lng);
  const padLat = (Math.max(...lats) - Math.min(...lats)) * 0.15, padLng = (Math.max(...lngs) - Math.min(...lngs)) * 0.15;
  return { north: Math.max(...lats) + padLat, south: Math.min(...lats) - padLat, east: Math.max(...lngs) + padLng, west: Math.min(...lngs) - padLng };
}

/** True when the app is on a dark theme (the root element carries data-theme="dark"). */
function useDarkTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setDark(root.dataset.theme === 'dark');
    read();
    const watcher = new MutationObserver(read);
    watcher.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => watcher.disconnect();
  }, []);
  return dark;
}

export default function GoogleSurface({ venues, sel, onSelect, hereBy }: MapSurfaceProps) {
  const dark = useDarkTheme();
  // Used once, to frame the opening view; later changes to the filtered list must not move the camera.
  const [opening] = useState(() => openingBounds(venues));

  if (!API_KEY || !MAP_ID) {
    return (
      <div className="mapbox"><p className="sm" style={{ padding: 16 }}>Google Maps is not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and NEXT_PUBLIC_GOOGLE_MAP_ID in .env.local, then restart the dev server.</p></div>
    );
  }

  return (
    <div className="mapbox gmap">
      <APIProvider apiKey={API_KEY}>
        {/* colorScheme is read only when the map is created, so a theme change remounts the map. */}
        <GoogleMap
          key={dark ? 'dark' : 'light'}
          mapId={MAP_ID}
          colorScheme={dark ? 'DARK' : 'LIGHT'}
          {...(opening ? { defaultBounds: opening } : { defaultCenter: { lat: HOUT_BAY_CENTER.lat, lng: HOUT_BAY_CENTER.lng }, defaultZoom: HOUT_BAY_CENTER.zoom })}
          minZoom={12}
          maxZoom={18}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          onClick={() => onSelect(null)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <Pins venues={venues} sel={sel} onSelect={onSelect} hereBy={hereBy} />
        </GoogleMap>
      </APIProvider>
    </div>
  );
}

/** The venue pins. Lives inside <GoogleMap> so it can reach the map instance. */
function Pins({ venues, sel, onSelect, hereBy }: MapSurfaceProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(HOUT_BAY_CENTER.zoom);
  const [nudges, setNudges] = useState<Map<string, Nudge>>(() => new Map());
  const size = useMemo(() => sizeFor(zoom), [zoom]);

  // Keep the map north-up and flat: the pixel maths in lib/mercator.ts assumes it.
  useEffect(() => {
    if (!map) return;
    const flatten = () => { if (map.getHeading()) map.setHeading(0); if (map.getTilt()) map.setTilt(0); };
    const handles = [map.addListener('heading_changed', flatten), map.addListener('tilt_changed', flatten)];
    return () => handles.forEach((h) => h.remove());
  }, [map]);

  // When the map settles (or the list changes): measure, space the pins apart, store a fixed pixel nudge per pin.
  useEffect(() => {
    if (!map) return;
    const settle = () => {
      const centre = map.getCenter(), z = map.getZoom();
      if (!centre || z == null) return;
      const view = { w: map.getDiv().clientWidth, h: map.getDiv().clientHeight };
      const sz = sizeFor(z);
      const raw = venues.map((v) => {
        const p = latLngToViewport(venueLatLng(v), { lat: centre.lat(), lng: centre.lng() }, z, view);
        return { id: v.id, x: p.x + VIRTUAL_PAD, y: p.y + VIRTUAL_PAD };
      });
      const spread = spreadPins(raw, { w: view.w + 2 * VIRTUAL_PAD, h: view.h + 2 * VIRTUAL_PAD }, { w: sz.w, h: sz.h }, 60);
      setZoom(z);
      setNudges(new Map(raw.map((r) => { const s = spread.get(r.id) ?? r; return [r.id, { dx: s.x - r.x, dy: s.y - r.y }]; })));
    };
    const handle = map.addListener('idle', settle);
    settle();
    return () => handle.remove();
  }, [map, venues]);

  // Selecting a venue centres it a little high, so the detail card does not cover it.
  useEffect(() => {
    const v = sel ? venues.find((x) => x.id === sel) : null;
    if (!map || !v) return;
    const target = Math.max(map.getZoom() ?? 0, 15);
    map.setZoom(target);
    map.panTo(centreForOffset(venueLatLng(v), target, 0, -90));
    // Only when the selection changes, not when the filtered list is rebuilt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, map]);

  return (
    <>
      {venues.map((v) => {
        const people = hereBy.get(v.id) ?? [];
        const n = nudges.get(v.id);
        const c = venueLatLng(v);
        const isSel = v.id === sel;
        return (
          <AdvancedMarker
            key={v.id}
            position={{ lat: c.lat, lng: c.lng }}
            anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
            zIndex={isSel ? 10 : 1}
            title={`${v.name}, ${CAT_LABEL[v.cat]}${people.length ? `, ${people.length} people you follow are here` : ''}`}
            onClick={() => onSelect(isSel ? null : v.id)}
          >
            <div
              className={`pinw ${isSel ? 'sel' : ''} ${size.names ? '' : 'nonames'}`}
              style={{ ['--pin' as string]: `${size.img}px`, transform: n ? `translate(${n.dx}px, ${n.dy}px)` : undefined } as React.CSSProperties}
            >
              <div className="pin2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pinImg(v)} alt="" />
                <span className="pn">{v.name}</span>
              </div>
              {people.length > 0 && <div className="pst"><FaceStack ids={people} popover /></div>}
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
}
