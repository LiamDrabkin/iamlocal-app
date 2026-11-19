/**
 * Feature flags. One codebase serves both environments; a flag decides what each one shows.
 *
 * - social: the social layer (feed, posts, other people's profiles, friends and following lists).
 *   Off on production (NEXT_PUBLIC_VERCEL_ENV === 'production'), on everywhere else.
 *   Override for local testing with NEXT_PUBLIC_FEATURE_SOCIAL=1 (force on) or =0 (force off).
 *
 * Hiding is done in the UI and at the route (the page returns 404), not by deleting code or data,
 * so turning a feature back on is a one-line change.
 */
const env = process.env.NEXT_PUBLIC_VERCEL_ENV;

/** '1' forces on, '0' forces off, anything else uses the environment default. */
const flag = (override: string | undefined, fallback: boolean) => (override === '1' ? true : override === '0' ? false : fallback);

export const FEATURES = {
  social: flag(process.env.NEXT_PUBLIC_FEATURE_SOCIAL, env !== 'production'),
} as const;

/** Wording that depends on a flag, kept together so the screens stay readable. */
export const COPY = {
  /** What a signed-in account saves, as a phrase for "Your ___ are saved". */
  saved: FEATURES.social ? 'follows, likes, posts and settings' : 'favourites and settings',
  /** The same, shorter, for "Save your ___ to an account". */
  savedShort: FEATURES.social ? 'follows, likes and posts' : 'favourites',
} as const;
