'use client';
import Link from 'next/link';
import FaceStack from '@/components/FaceStack';
import { Chip, I, Icon, SampleNote, Shell, VenueImg } from '@/components/ui';
import { useApp } from '@/lib/store';

export default function Favourites() {
  const { data, s, flip, has, venue } = useApp();
  const unseen = data.events.filter((e) => has('alerts', e.venueId)).length;
  const places = s.favs.map((id) => venue(id));

  return (
    <Shell>
      <div className="sc">
        <div className="row sp">
          <h1>Favourites</h1>
          <Link href="/profile" className="bell" aria-label={`${unseen} new alerts`}><Icon d={I.bell} />{unseen > 0 && <b>{unseen}</b>}</Link>
        </div>
        <SampleNote />

        <div className="card">
          <h2>Coming up</h2>
          {data.events.filter((e) => has('alerts', e.venueId) || has('favs', e.venueId)).map((e) => {
            const v = venue(e.venueId);
            return (
              <div className="ev" key={e.id}>
                <div className="col" style={{ gap: 6 }}>
                  <Link href={`/venue/${v.id}`} className="link"><h3>{v.name}</h3></Link>
                  <p>{e.title}, {e.whenText.toLowerCase()}</p>
                  <div className="row" style={{ gap: 8 }}>
                    <FaceStack ids={e.going} more={e.goingMore} />
                    <p className="sm">{e.going.length + e.goingMore} going</p>
                  </div>
                </div>
                {e.chip && <Chip tone={e.chip === 'New' ? 'calm' : 'rw'}>{e.chip}</Chip>}
              </div>
            );
          })}
        </div>

        <h2>Your places</h2>
        {places.length === 0 && <p>No favourites yet. Find places on the map.</p>}
        {places.map((v) => (
          <div className="card" key={v.id}>
            <Link href={`/venue/${v.id}`} className="row link">
              <VenueImg v={v} />
              <div className="col"><h3>{v.name}</h3><p>{v.kind}</p>
                <div className="row" style={{ gap: 6 }}><Chip tone="calm">Score {v.score.toFixed(1)}</Chip><Chip>Trust {v.trust}</Chip></div></div>
            </Link>
            <div className="row sp">
              <p>{v.blurb ?? 'No upcoming deals'}</p>
              <button className={`tog ${has('alerts', v.id) ? 'on' : ''}`} aria-pressed={has('alerts', v.id)} onClick={() => flip('alerts', v.id)}>{has('alerts', v.id) ? 'Alerts on' : 'Alerts off'}</button>
            </div>
          </div>
        ))}
        <Link className="btn s" href="/map">Find more places on the map</Link>
      </div>
    </Shell>
  );
}
