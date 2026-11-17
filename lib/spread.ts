/**
 * Nudge map pins apart so none overlap. Pure function, no React.
 *
 * The stylised map places venues by hand, and several sit close together, so large circular pins
 * with names would stack. This runs a simple relaxation: any two pin boxes that overlap are pushed
 * apart along the axis where they overlap least, then everything is clamped inside the map.
 * Positions stay deterministic (same input, same output) so pins do not jump between renders.
 * A real map with zoom (MapLibre) will replace the need for this, but clusters still help there.
 */
export interface Pt { id: string; x: number; y: number }

export function spreadPins(pts: Pt[], bounds: { w: number; h: number }, box: { w: number; h: number }, iterations = 300): Map<string, { x: number; y: number }> {
  const p = [...pts].sort((a, b) => a.id.localeCompare(b.id)).map((q) => ({ ...q }));
  const halfW = box.w / 2, halfH = box.h / 2;
  for (let it = 0; it < iterations; it++) {
    let moved = false;
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        let dx = p[j].x - p[i].x, dy = p[j].y - p[i].y;
        const ox = box.w - Math.abs(dx), oy = box.h - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        // Identical positions: separate along a fixed diagonal so the result is deterministic.
        if (dx === 0 && dy === 0) { dx = 1; dy = 1; }
        // Push along the axis with the smaller overlap, half each way (plus a hair so they stop touching).
        if (ox < oy) { const s = Math.sign(dx) * (ox / 2 + 0.5); p[i].x -= s; p[j].x += s; }
        else { const s = Math.sign(dy) * (oy / 2 + 0.5); p[i].y -= s; p[j].y += s; }
      }
    }
    for (const q of p) {
      q.x = Math.min(bounds.w - halfW, Math.max(halfW, q.x));
      q.y = Math.min(bounds.h - halfH, Math.max(halfH, q.y));
    }
    if (!moved) break;
  }
  return new Map(p.map((q) => [q.id, { x: q.x, y: q.y }]));
}
