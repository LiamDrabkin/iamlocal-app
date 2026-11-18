/**
 * Web Mercator helpers. Pure functions, no React and no Google dependency.
 *
 * Google Maps does not expose a cheap "lat/lng to screen pixel" call outside an OverlayView, and the
 * pin de-overlap step (lib/spread.ts) needs screen pixels. Because the map is kept north-up and flat,
 * the standard Web Mercator formulas give the same answer, so we compute it ourselves.
 */
export interface LatLng { lat: number; lng: number }
export interface Size { w: number; h: number }

const TILE = 256; // Google and OSM both use 256px tiles at zoom 0

const worldSize = (zoom: number) => TILE * 2 ** zoom;

/** Lat/lng to "world pixels": distance in pixels from the top-left of the whole-world map at this zoom. */
function toWorld(p: LatLng, zoom: number) {
  const size = worldSize(zoom);
  const s = Math.sin((p.lat * Math.PI) / 180);
  return { x: ((p.lng + 180) / 360) * size, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * size };
}

/** Inverse of toWorld. */
function fromWorld(x: number, y: number, zoom: number): LatLng {
  const size = worldSize(zoom);
  const n = Math.PI - (2 * Math.PI * y) / size;
  return { lat: (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))), lng: (x / size) * 360 - 180 };
}

/** Where `point` appears inside a viewport of `view` pixels whose centre is `center` at `zoom` (fractional zoom is fine). */
export function latLngToViewport(point: LatLng, center: LatLng, zoom: number, view: Size) {
  const a = toWorld(point, zoom), c = toWorld(center, zoom);
  return { x: view.w / 2 + (a.x - c.x), y: view.h / 2 + (a.y - c.y) };
}

/**
 * The map centre that makes `target` appear (dx, dy) pixels away from the middle of the viewport.
 * Used to park a selected venue a little above centre so the detail card does not cover it.
 */
export function centreForOffset(target: LatLng, zoom: number, dx: number, dy: number): LatLng {
  const t = toWorld(target, zoom);
  return fromWorld(t.x - dx, t.y - dy, zoom);
}
