/**
 * UI "moods": four complete looks taken from the ChatGPT signup concepts, each with a light and a dark
 * version. A mood only re-assigns CSS variables and the artwork (see the `[data-mood]` blocks in
 * globals.css). "classic" is the original look, driven by the themes in lib/themes.ts.
 *
 * Light or dark comes from the same `theme` setting as before: 'system' | 'light' | 'dark'.
 */
export type MoodId = 'sentinel-gold' | 'immersive' | 'sentinel-silver' | 'postcard' | 'classic';

export interface MoodDef {
  id: MoodId;
  name: string;
  note: string;
  /** Preview dots for the picker, light then dark: ground, text, button. */
  swatch: { light: [string, string, string]; dark: [string, string, string] };
}

export const MOODS: MoodDef[] = [
  { id: 'sentinel-gold', name: 'Golden Sentinel', note: 'Warm, local, premium.', swatch: { light: ['#FFF7EB', '#183A3D', '#C23B25'], dark: ['#0B2E2E', '#FFF7EB', '#D4AF37'] } },
  { id: 'immersive', name: 'Hout Bay Immersive', note: 'Authentic and place-led.', swatch: { light: ['#E3EEEC', '#183A3D', '#C23B25'], dark: ['#0B2E2E', '#FFF7EB', '#F1634D'] } },
  { id: 'sentinel-silver', name: 'Silver Sculpture', note: 'Modern and understated.', swatch: { light: ['#F6F4EF', '#183A3D', '#C23B25'], dark: ['#0B2E2E', '#FFF7EB', '#D5DDE0'] } },
  { id: 'postcard', name: 'Local Postcard', note: 'Open, friendly, community.', swatch: { light: ['#FBF3E8', '#183A3D', '#C23B25'], dark: ['#14203A', '#FFF7EB', '#F6A15B'] } },
  { id: 'classic', name: 'Classic', note: 'The original look and its themes.', swatch: { light: ['#FFF7EB', '#183A3D', '#C23B25'], dark: ['#0E2527', '#FFF7EB', '#F1634D'] } },
];

export const DEFAULT_MOOD: MoodId = 'sentinel-gold';

export const isMood = (x: unknown): x is MoodId => MOODS.some((m) => m.id === x);
