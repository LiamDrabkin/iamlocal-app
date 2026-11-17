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
