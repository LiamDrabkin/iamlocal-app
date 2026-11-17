'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Chip, Shell } from '@/components/ui';
import { useApp } from '@/lib/store';
import { markReceipt } from '@/lib/visits';

type Outcome = 'confirmed' | 'look' | 'failed';
const COPY: Record<Outcome, { h: string; p: string }> = {
  confirmed: { h: 'Visit confirmed', p: 'Your receipt matched. You can now rate this place, post from it and use your member discount.' },
  look: { h: 'Needs a quick look', p: 'The receipt could not be read automatically. The manager will check it, usually within a day.' },
  failed: { h: 'We could not read that', p: 'Try again in better light with the whole receipt in frame.' },
};

function Inner() {
  const q = useSearchParams();
  const { venue, s, set } = useApp();
  const v = venue(q.get('venue') ?? 'w');
  const [o, setO] = useState<Outcome>('confirmed');

  const pick = (x: Outcome) => {
    setO(x);
    // Confirmed marks the visit so rating and posting unlock; anything else leaves it locked.
    set({
      visits: x === 'confirmed' ? Array.from(new Set([...s.visits, v.id])) : s.visits.filter((id) => id !== v.id),
      // The Doorway history only counts a visit once check-in and a confirmed receipt are both true.
      history: markReceipt(s.history, v.id, x === 'confirmed'),
    });
  };
  // Apply the default outcome once on first view (not during render).
  useEffect(() => { pick('confirmed'); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [v.id]);

  return (
    <Shell tabs={false}>
      <div className="sc">
        <Chip tone={o === 'confirmed' ? 'calm' : undefined}>{v.name}</Chip>
        <h1>{COPY[o].h}</h1>
        <p>{COPY[o].p}</p>
        <div className="mock"><span>Prototype control: choose the outcome</span>
          <div className="seg">{(['confirmed', 'look', 'failed'] as const).map((x) => <button key={x} className={o === x ? 'on' : ''} onClick={() => pick(x)}>{x === 'look' ? 'Needs a look' : x[0].toUpperCase() + x.slice(1)}</button>)}</div></div>
        {o === 'failed' && <Link className="btn" href={`/receipt?venue=${v.id}`}>Try again</Link>}
        <Link className="btn" href={`/venue/${v.id}`}>{o === 'confirmed' ? `Rate ${v.name}` : `Back to ${v.name}`}</Link>
        <Link className="btn s" href="/favourites">Done</Link>
      </div>
    </Shell>
  );
}

export default function Result() {
  return <Suspense><Inner /></Suspense>;
}
