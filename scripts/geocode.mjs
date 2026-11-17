// Look up real coordinates for every venue in data/seed.json using OpenStreetMap's Nominatim
// and write them to data/geo.json. Run on your own computer:  node scripts/geocode.mjs
//
// Nominatim's usage policy: at most one request per second and an identifying User-Agent.
// Entries in geo.json marked "manual": true are never overwritten, so hand-corrected pins stay put.
// ALWAYS eyeball the printed table: a name match is a guess, and a wrong pin is worse than none.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const UA = 'iamlocal-mock/0.1 (liam.drabkin@icloud.com)';
const VIEWBOX = '18.30,-34.00,18.42,-34.08'; // left,top,right,bottom around Hout Bay
const seed = JSON.parse(readFileSync('data/seed.json', 'utf8'));
const out = existsSync('data/geo.json') ? JSON.parse(readFileSync('data/geo.json', 'utf8')) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&bounded=1&viewbox=${VIEWBOX}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json())[0] ?? null;
}

for (const v of seed.venues) {
  if (out[v.id]?.manual) { console.log(`${v.id}  ${v.name}: kept (manual)`); continue; }
  // Try the street address first (most precise), then the name.
  const tries = [v.address && `${v.address}, Hout Bay`, `${v.name}, Hout Bay, Cape Town`].filter(Boolean);
  let hit = null, used = '';
  for (const q of tries) {
    try { hit = await search(q); } catch (e) { console.log(`  ! ${q}: ${e.message}`); }
    await sleep(1100);
    if (hit) { used = q; break; }
  }
  if (hit) {
    out[v.id] = { lat: +(+hit.lat).toFixed(6), lng: +(+hit.lon).toFixed(6), match: hit.display_name, query: used };
    console.log(`${v.id}  ${v.name}\n     -> ${out[v.id].lat}, ${out[v.id].lng}  (${hit.display_name})`);
  } else {
    console.log(`${v.id}  ${v.name}: NOT FOUND, will use the rough position until you set it by hand`);
  }
}
writeFileSync('data/geo.json', JSON.stringify(out, null, 2) + '\n');
console.log('\nWrote data/geo.json. Fix any wrong or missing venue by hand and add "manual": true to its entry.');
