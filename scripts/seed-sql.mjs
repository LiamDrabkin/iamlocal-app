// Generates supabase/schema.sql seed inserts from data/seed.json so the DB and the fallback data never drift.
import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync(new URL('../data/seed.json', import.meta.url)));
const q = (v) => (v === null || v === undefined ? 'null' : typeof v === 'number' ? String(v) : typeof v === 'boolean' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => `array[${a.map(q).join(',')}]::text[]`;
const out = [];
for (const p of d.people) out.push(`insert into people(id,name,level,bio,avatar,sharing,at_venue,recent,photos) values(${q(p.id)},${q(p.name)},${q(p.level)},${q(p.bio)},${q(p.avatar)},${q(p.sharing)},${q(p.at)},${arr(p.recent)},${arr(p.photos ?? [])}) on conflict (id) do nothing;`);
for (const v of d.venues) out.push(`insert into venues(id,name,kind,cat,x,y,score,trust,img,blurb,deal,address,website,instagram,logo,gallery) values(${q(v.id)},${q(v.name)},${q(v.kind)},${q(v.cat)},${v.x},${v.y},${v.score},${v.trust},${q(v.img)},${q(v.blurb)},${q(v.deal)},${q(v.address)},${q(v.website)},${q(v.instagram)},${q(v.logo)},${arr(v.gallery ?? [])}) on conflict (id) do nothing;`);
for (const e of d.events) out.push(`insert into events(id,venue_id,title,when_text,going,going_more,chip) values(${q(e.id)},${q(e.venue_id)},${q(e.title)},${q(e.when_text)},${arr(e.going)},${e.going_more},${q(e.chip)}) on conflict (id) do nothing;`);
for (const p of d.posts) out.push(`insert into posts(id,author_kind,author_id,venue_id,body,photo,chip,likes,reps,at_text,rating) values(${q(p.id)},${q(p.author_kind)},${q(p.author_id)},${q(p.venue_id)},${q(p.text)},${q(p.photo)},${q(p.chip)},${p.likes},${p.reps},${q(p.at)},${p.rating ?? 'null'}) on conflict (id) do nothing;`);
for (const r of d.reviews) out.push(`insert into reviews(id,venue_id,person_id,rating,body) values(${q(r.id)},${q(r.venue_id)},${q(r.person_id)},${r.rating},${q(r.text)}) on conflict (id) do nothing;`);
fs.writeFileSync(new URL('../supabase/seed.sql', import.meta.url), out.join('\n') + '\n');
console.log('wrote supabase/seed.sql', out.length, 'statements');

// One paste-able file for a fresh project: tables, accounts/security, then the sample data.
const read = (f) => fs.readFileSync(new URL(`../supabase/${f}`, import.meta.url), 'utf8');
fs.writeFileSync(new URL('../supabase/setup.sql', import.meta.url), [read('schema.sql'), read('auth.sql'), read('seed.sql')].join('\n'));
console.log('wrote supabase/setup.sql (schema + auth + seed)');
