/**
 * Selectable themes. Each theme is a block of CSS-variable overrides in globals.css, keyed by
 * `[data-skin='<id>']`. `mode` decides light vs dark (`data-theme`), which sets color-scheme.
 *
 * Brand Bible v1.2: the six on-brand themes only re-assign the five brand colours (cream, deep teal,
 * tomato, sea-green, sun yellow), with no gradients or shadows. The `experiment` themes are off-brand
 * trials for discussion with the CTO. They are hidden on production (see `visibleThemes`).
 */
export type ThemeId =
  | 'brand' | 'harbour' | 'golden'
  | 'night' | 'night-market' | 'night-harbour'
  | 'x-lilac' | 'x-mono' | 'x-ink' | 'x-plum';

export type Mode = 'light' | 'dark';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  mode: Mode;
  note: string;
  experiment?: boolean;
  /** Preview dots in the picker: ground, card, text, accent. Must match the CSS block. */
  swatch: [string, string, string, string];
}

export const THEMES: ThemeDef[] = [
  { id: 'brand', name: 'Brand', mode: 'light', note: 'Warm cream, the default.', swatch: ['#FFF7EB', '#F9EDDC', '#183A3D', '#C23B25'] },
  { id: 'harbour', name: 'Harbour', mode: 'light', note: 'Sea-green ground, cream cards.', swatch: ['#B8DDD3', '#FFF7EB', '#183A3D', '#C23B25'] },
  { id: 'golden', name: 'Golden hour', mode: 'light', note: 'Sun-yellow ground, teal accent.', swatch: ['#F8CD62', '#FFF7EB', '#183A3D', '#183A3D'] },
  { id: 'night', name: 'Brand night', mode: 'dark', note: 'The brand dark mode.', swatch: ['#0E2527', '#183A3D', '#FFF7EB', '#F1634D'] },
  { id: 'night-market', name: 'Night market', mode: 'dark', note: 'Lantern-yellow accent.', swatch: ['#0E2527', '#183A3D', '#FFF7EB', '#F8CD62'] },
  { id: 'night-harbour', name: 'Night harbour', mode: 'dark', note: 'Cool, sea-green accent.', swatch: ['#183A3D', '#0E2527', '#FFF7EB', '#B8DDD3'] },
  { id: 'x-lilac', name: 'Dusk lilac', mode: 'light', note: 'Soft lilac and violet.', experiment: true, swatch: ['#F4EEFA', '#E9DDF6', '#2A1F45', '#6B3FD1'] },
  { id: 'x-mono', name: 'Clean mono', mode: 'light', note: 'White, black, one blue.', experiment: true, swatch: ['#FFFFFF', '#F2F2F2', '#111111', '#1B5CFF'] },
  { id: 'x-ink', name: 'Ink mint', mode: 'dark', note: 'Near-black with mint.', experiment: true, swatch: ['#0B0B0F', '#17171F', '#F2F2F7', '#4FE3B0'] },
  { id: 'x-plum', name: 'Plum', mode: 'dark', note: 'Deep plum with pink.', experiment: true, swatch: ['#1A1022', '#2A1B36', '#F7EEFF', '#FF7AB6'] },
];

export const DEFAULT_LIGHT: ThemeId = 'brand';
export const DEFAULT_DARK: ThemeId = 'night';

const MODE = Object.fromEntries(THEMES.map((t) => [t.id, t.mode])) as Record<ThemeId, Mode>;

/** Experiments show everywhere except production. NEXT_PUBLIC_VERCEL_ENV is set by Vercel; locally it is empty. */
export const showExperiments = process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production';
export const visibleThemes = THEMES.filter((t) => showExperiments || !t.experiment);

export interface ThemeState { theme: ThemeId | 'system' | 'light' | 'dark'; lightPick: ThemeId; darkPick: ThemeId }

/**
 * Work out which theme applies. "system" follows the phone and uses my last light and dark picks.
 * Old saved values 'light' and 'dark' (from before themes existed) map to those picks too.
 * A hidden experiment (on production) falls back to the matching on-brand theme.
 */
export function resolveTheme(st: ThemeState, prefersDark: boolean): { id: ThemeId; mode: Mode } {
  let id: ThemeId;
  if (st.theme === 'system') id = prefersDark ? st.darkPick : st.lightPick;
  else if (st.theme === 'light') id = st.lightPick;
  else if (st.theme === 'dark') id = st.darkPick;
  else id = st.theme;
  if (!MODE[id] || (!showExperiments && THEMES.find((t) => t.id === id)?.experiment)) id = MODE[id] === 'dark' ? DEFAULT_DARK : DEFAULT_LIGHT;
  return { id, mode: MODE[id] };
}
