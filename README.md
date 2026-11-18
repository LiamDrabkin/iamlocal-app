# I am local – interactive mock-up (Next.js + optional Supabase)

## Run locally
    npm install && npm run dev      # http://localhost:3000

## Deploy to Vercel (2 minutes)
    npx vercel          # follow prompts, then: npx vercel --prod
Works immediately with built-in sample data (data/seed.json). No env vars needed.

## Optional: Supabase
1. Create a NEW Supabase project (not a truID one).
2. SQL editor: run supabase/schema.sql, then supabase/seed.sql.
3. In Vercel add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, redeploy.
Public read only (RLS). Visitor follows/likes/posts live in each browser's localStorage; Settings > Reset demo clears them.

## Privacy
public/img contains team photos. Turn on Vercel Deployment Protection (or share only with the team) before sharing widely.

## Maps

One map component (`components/MapSurface.tsx`) picks a provider and lazy-loads only that one.

| Provider | Needs | Notes |
|---|---|---|
| `maplibre` (default) | nothing | OpenStreetMap data via OpenFreeMap. Pin editor at `/map?edit=1` |
| `google` | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAP_ID` | Restrict the key by HTTP referrer and to the Maps JavaScript API |
| `stylised` | nothing | The hand-drawn illustration |

Set the default with `NEXT_PUBLIC_MAP_PROVIDER`. Outside production you can flip live with the switch on the map page, or open `/map?map=google` (remembered per browser). Production always uses the default.

Add a provider: create `components/map/<Name>Surface.tsx` taking `MapSurfaceProps` (`components/map/types.ts`), add it to `PROVIDERS` in `components/map/provider.ts`, and register it in `components/MapSurface.tsx`.
