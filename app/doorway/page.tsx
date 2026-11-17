'use client';
/**
 * Doorway: check in at a place, show the code, photograph the receipt, and see your history.
 * Mock-up: the check-in and the code are generated here. Real verification (a code staff can
 * trust, a manager check, receipt reading) is a separate service and is not simulated.
 */
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Back, Chip, Shell, TrustCard, VenueImg } from '@/components/ui';
import { useApp } from '@/lib/store';
import { img } from '@/lib/types';
import { checkIn, confirmedVisits, shortDate } from '@/lib/visits';

const CODE_SECONDS = 30;
const randomCode = () => `${100 + Math.floor(Math.random() * 899)} ${100 + Math.floor(Math.random() * 899)}`;

export default function Doorway() {
  const { me, s, set, data, venue } = useApp();
  const [code, setCode] = useState(randomCode);
  const [secs, setSecs] = useState(CODE_SECONDS);

  // Favourites first, then everywhere else, so the likely place is at the top of the list.
  const options = useMemo(() => {
    const fav = s.favs.map((id) => venue(id));
    return [...fav, ...data.venues.filter((v) => !s.favs.includes(v.id))];
  }, [s.favs, data.venues, venue]);
  const [pick, setPick] = useState(options[0]?.id ?? 'w');

  const here = s.checkedIn ? venue(s.checkedIn) : null;
  const history = confirmedVisits(s.history);

  // The code refreshes while checked in.
  useEffect(() => {
    if (!s.checkedIn) return;
    const t = setInterval(() => setSecs((n) => {
      if (n <= 1) { setCode(randomCode()); return CODE_SECONDS; }
      return n - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [s.checkedIn]);

  const doCheckIn = () => { setCode(randomCode()); setSecs(CODE_SECONDS); set({ checkedIn: pick, history: checkIn(s.history, pick) }); };

  return (
    <Shell>
      <div className="sc">
        <Back href="/favourites">Back</Back>
        <h1>Doorway</h1>

        {!here ? (
          <div className="card">
            <h2>Check in</h2>
            <p>Choose where you are. Your code appears once you check in.</p>
            <div className="col" style={{ gap: 6 }}>
              <label htmlFor="where">Where are you?</label>
              <select id="where" value={pick} onChange={(e) => setPick(e.target.value)}>{options.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
            </div>
            <button className="btn" onClick={doCheckIn}>Check in at {venue(pick).name}</button>
          </div>
        ) : (
          <>
            <div className="card" style={{ alignItems: 'center', textAlign: 'center', padding: 24 }}>
              <Chip tone="calm">Checked in at {here.name}</Chip>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="av big" src={img(me.avatar)} alt={me.name} />
              <h2>{me.name}</h2>
              <p>{me.level} · Hout Bay</p>
              <span style={{ font: "600 40px 'Source Code Pro', monospace", letterSpacing: '.08em' }} aria-live="off">{code}</span>
              <div className="bar" style={{ width: '100%' }}><i style={{ width: `${(secs / CODE_SECONDS) * 100}%` }} /></div>
              <p className="sm">Show this to staff. The code changes every {CODE_SECONDS} seconds [sample]</p>
            </div>
            <Link className="btn" href={`/receipt?venue=${here.id}`}>Take photo of {here.name} receipt</Link>
            <button className="btn s" onClick={() => set({ checkedIn: null })}>End check-in</button>
          </>
        )}

        <TrustCard />

        <h2>History</h2>
        <p className="sm">Visits where you checked in and your receipt was confirmed.</p>
        {history.length === 0 && <p>No confirmed visits yet.</p>}
        {history.map((h) => { const v = venue(h.venueId); return (
          <Link key={`${h.venueId}-${h.at}`} href={`/venue/${v.id}`} className="card">
            <div className="row"><VenueImg v={v} /><div className="col"><h3>{v.name}</h3><p className="sm">{shortDate(h.at)}{h.sample ? ' · Sample' : ''}</p></div><Chip tone="calm">Confirmed</Chip></div>
          </Link>
        ); })}
      </div>
    </Shell>
  );
}
