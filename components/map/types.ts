/**
 * The map contract. Every map implementation (stylised, MapLibre, Google) takes exactly these props,
 * so the page, pins, cards and face stacks never know which provider is drawing the base map.
 *
 * Show `venues`, mark `sel` as selected, call `onSelect(id)` on a pin tap and `onSelect(null)` on a tap
 * of empty map. `hereBy` maps a venue id to the people I follow who are there now (place only, never a
 * street position).
 */
import type { Cat, Venue } from '@/lib/types';

export interface MapSurfaceProps {
  venues: Venue[];
  sel: string | null;
  onSelect: (id: string | null) => void;
  hereBy: Map<string, string[]>;
}

export const CAT_LABEL: Record<Cat, string> = { eat: 'Eat', drink: 'Drink', do: 'Do' };
