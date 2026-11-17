'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import FaceStack from '@/components/FaceStack';
import MapSurface, { CAT_LABEL as LABEL } from '@/components/MapSurface';
import { Chip, Icon, Shell } from '@/components/ui';
import { useApp } from '@/lib/store';
import { img, type Cat } from '@/lib/types';



export default function MapPage() {
  const { data, s, set, venue } = useApp();
  const [cat, setCat] = useState<Cat | 'all'>('all');
  const [q, setQ] = useState('');
  // null = no card open, so the map can be explored freely.
  const [sel, setSel] = useState<string | null>(null);

  /** Busy level: only people I follow who switched sharing on. Place only, never a street position. */
  const hereBy = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of data.people) {
      if (p.sharing && p.at && s.following.includes(p.id)) m.set(p.at, [...(m.get(p.at) ?? []), p.id]);
    }
    return m;
  }, [data.people, s.following]);

  /** Locals' specials: posts from venues that carry a photo. */
  const specials = data.posts.filter((p) => p.authorKind === 'venue' && p.photo);

  const shown = data.venues.filter((v) => (cat === 'all' || v.cat === cat) && v.name.toLowerCase().includes(q.toLowerCase()));
  const cur = sel ? venue(sel) : null;
  const here = cur ? hereBy.get(cur.id) ?? [] : [];

  return (
    <Shell>
      <div className="maphd">
        <div className="row">
          <input type="search" aria-label="Search Hout Bay" placeholder="Search Hout Bay" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className={`tog ${s.sharing ? 'on' : ''}`} aria-pressed={s.sharing} onClick={() => set({ sharing: !s.sharing })}>{s.sharing ? 'Sharing until 21:00' : 'Sharing off'}</button>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {(['all', 'eat', 'drink', 'do'] as const).map((c) => (
            <button key={c} className={`tog pill ${cat === c ? 'on' : ''}`} style={{ flex: 1 }} aria-pressed={cat === c} onClick={() => setCat(c)}>{c === 'all' ? 'All' : LABEL[c]}</button>
          ))}
        </div>
      </div>

      <MapSurface venues={shown} sel={sel} onSelect={setSel} hereBy={hereBy} />

      {specials.length > 0 && (
        <section className="spw" aria-label="Locals' specials">
          <div className="row sp"><h2>Locals' specials</h2><Chip>Sample</Chip></div>
          <div className="spr">
            {specials.map((p) => { const v = venue(p.venueId ?? p.authorId); return (
              <Link key={p.id} href={`/venue/${v.id}`} className="spc">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(p.photo!)} alt="" loading="lazy" />
                <h3>{v.name}</h3>
                <p className="sm">{p.text}</p>
              </Link>
            ); })}
          </div>
        </section>
      )}

      {cur && (
        <div className="mapsheet" role="dialog" aria-label={cur.name}>
          <div className="row sp">
            <div className="row" style={{ gap: 8 }}><Chip>{LABEL[cur.cat]}</Chip><Chip tone="calm">Score {cur.score.toFixed(1)}</Chip><Chip>Trust {cur.trust}</Chip></div>
            <button className="bell" style={{ width: 44, height: 44 }} aria-label="Close" onClick={() => setSel(null)}><Icon d="M6 6l12 12M18 6L6 18" /></button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mimg" src={img(cur.img)} alt="" />
          <h2>{cur.name}</h2>
          <div className="row">
            <FaceStack ids={here} />
            <p className="sm">{here.length === 0 ? 'No one you follow is here now' : here.length === 1 ? 'One person you follow is here' : `${here.length} people you follow are here`}</p>
          </div>
          <Link className="btn" href={`/venue/${cur.id}`}>Go to {cur.name}</Link>
        </div>
      )}
    </Shell>
  );
}
