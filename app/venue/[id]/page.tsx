'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import FaceStack from '@/components/FaceStack';
import { Back, Chip, Faces, I, Icon, PersonAv, SampleNote, Shell } from '@/components/ui';
import { useApp } from '@/lib/store';
import { ME, img, type Review } from '@/lib/types';
import { FEATURES } from '@/lib/features';

export default function VenuePage() {
  const { id } = useParams<{ id: string }>();
  const { data, s, set, flip, has, venue, person } = useApp();
  const v = data.venues.find((x) => x.id === id);
  const [stars, setStars] = useState(4);
  const [text, setText] = useState('Quiet afternoon and friendly staff.');
  const [tag, setTag] = useState(true);
  const [tab, setTab] = useState<'specials' | 'events' | 'menu' | 'photos' | 'reviews'>('specials');

  if (!v) return <Shell><div className="sc"><Back href="/map">Back to the map</Back><h1>Place not found</h1></div></Shell>;

  const following = has('venueFollows', v.id), fav = has('favs', v.id), visited = has('visits', v.id);
  const reviews = [...s.myReviews.filter((r) => r.venueId === v.id), ...data.reviews.filter((r) => r.venueId === v.id)];
  const posts = data.posts.filter((p) => p.authorKind === 'venue' && p.authorId === v.id);
  const hereNow = data.people.filter((p) => p.sharing && p.at === v.id && s.following.includes(p.id));
  const events = data.events.filter((e) => e.venueId === v.id);
  const avg = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : v.score.toFixed(1);

  const postReview = () => {
    const r: Review = { id: `mine-${Date.now()}`, venueId: v.id, personId: ME, rating: stars, text };
    // One rating per confirmed visit: posting spends the visit.
    set({ myReviews: [r, ...s.myReviews], visits: s.visits.filter((x) => x !== v.id) });
  };

  return (
    <Shell>
      <div className="sc">
        <Back href="/map">Back to the map</Back>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cover" src={img(v.img)} alt={v.name} />
        <div className="col"><h1>{v.name}</h1><p>{v.kind} · Hout Bay</p>
          {v.address && <p className="sm">{v.address}</p>}
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {v.website && <a className="tog" style={{ display: 'flex', alignItems: 'center' }} href={v.website} target="_blank" rel="noopener noreferrer">Website</a>}
            {v.instagram && <a className="tog" style={{ display: 'flex', alignItems: 'center' }} href={`https://www.instagram.com/${v.instagram}/`} target="_blank" rel="noopener noreferrer">Instagram</a>}
            <a className="tog" style={{ display: 'flex', alignItems: 'center' }} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.name + ' Hout Bay')}`} target="_blank" rel="noopener noreferrer">Directions</a>
          </div></div>
        <SampleNote>Sample scores, posts, reviews and offers. Real venue name. Photos are placeholders from the team.</SampleNote>
        <div className="row">
          <button className={`tog ${following ? 'on' : ''}`} style={{ flex: 1, minHeight: 48 }} aria-pressed={following} onClick={() => flip('venueFollows', v.id)}>{following ? 'Following' : 'Follow'}</button>
          <button className={`tog ${fav ? 'on' : ''}`} style={{ flex: 1, minHeight: 48 }} aria-pressed={fav} onClick={() => flip('favs', v.id)}>{fav ? 'Favourite' : 'Add to favourites'}</button>
        </div>

        <div className="row" style={{ alignItems: 'stretch' }}>
          <div className="card" style={{ flex: 1 }}><p>Customer score</p><span className="big-n">{avg}</span><p>of 5 · {reviews.length} verified reviews</p></div>
          <div className="card" style={{ flex: 1 }}><p>Trust</p><span className="big-n">{v.trust}</span><p>Honours locals fairly</p></div>
        </div>

        {hereNow.length > 0 && (
          <div className="card"><h3>Here now</h3><div className="row"><Faces ids={hereNow.map((p) => p.id)} /><p className="sm">{hereNow.map((p) => p.name).join(', ')} (people you follow who chose to share)</p></div></div>
        )}

        {/* Venue-owned section: specials, events, menu, photos and reviews. */}
        <div className="tabs2" role="tablist" aria-label={`${v.name} sections`}>
          {([['specials', 'Specials'], ['events', 'Events'], ['menu', 'Menu'], ['photos', 'Photos'], ['reviews', 'Reviews']] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        {tab === 'specials' && (<>
          {v.deal && <div className="card"><div className="row sp"><h3>Locals' offer</h3><Chip tone="rw">Sample</Chip></div><p>{v.deal}</p></div>}
          {posts.filter((p) => p.photo).map((p) => (
            <div className="card" key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="pimg" src={img(p.photo!)} alt="" loading="lazy" />
              <div className="row sp"><p className="sm">{p.at}</p>{p.chip && <Chip tone="rw">{p.chip}</Chip>}</div>
              <p style={{ color: 'var(--ink)' }}>{p.text} [sample post]</p>
            </div>
          ))}
          {!v.deal && !posts.some((p) => p.photo) && <p>No specials listed yet.</p>}
        </>)}
        {tab === 'events' && (<>
          {events.length === 0 && <p>No events listed yet.</p>}
          {events.map((e) => (
            <div className="card" key={e.id}><h3>{e.title}</h3><p>{e.whenText}</p><div className="row" style={{ gap: 8 }}><FaceStack ids={e.going} more={e.goingMore} /><p className="sm">{e.going.length + e.goingMore} going</p></div></div>
          ))}
        </>)}
        {tab === 'menu' && <div className="card"><h3>Menu</h3><p>[Pending: the venue adds its menu from the manager app.]</p></div>}
        {tab === 'photos' && (v.gallery?.length
          ? <div className="pgrid">{v.gallery.map((g2) => (// eslint-disable-next-line @next/next/no-img-element
              <img key={g2} src={img(g2)} alt="" loading="lazy" />
            ))}</div>
          : <p>No photos yet.</p>)}
        {tab === 'reviews' && (<>
          {reviews.length === 0 && <p>No reviews yet.</p>}
          {reviews.map((r) => { const p = person(r.personId); return (
            <div className="card" key={r.id}><div className="row"><PersonAv p={p} />
              {FEATURES.social
                ? <Link href={`/profile/${p.id}`} className="col link"><h3>{p.name}</h3><p className="sm">{r.rating} of 5</p></Link>
                : <div className="col"><h3>{p.name}</h3><p className="sm">{r.rating} of 5</p></div>}<Chip tone="calm">Verified visit</Chip></div><p>{r.text}</p></div>
          ); })}
        </>)}

        <div className="card">
          <h3>What trust is made of</h3>
          {[['Discounts matched to receipts', `${Math.round(v.trust * 0.98)}%`, v.trust * 0.98], ['Confirmed local visits, last 90 days', '[N]', 70], ['Tourist-season price rises reported', '[N]', 100 - v.trust]].map(([l, n, w]) => (
            <div className="col" key={l as string}><div className="row sp"><p>{l}</p><b>{n}</b></div><div className="bar"><i style={{ width: `${w}%` }} /></div></div>
          ))}
          <p className="sm">Counted from confirmed visits and member reports. How the number is combined is still to be decided.</p>
        </div>

        <div className="card">
          <div className="row sp"><h3>Locals' offer</h3><Chip tone="rw">Sample</Chip></div>
          <div className="mock"><span>Prototype control, not part of the app. Who gets the till discount?</span>
            <div className="seg"><button className={s.rule === 'active' ? 'on' : ''} onClick={() => set({ rule: 'active' })}>Active and above</button><button className={s.rule === 'local' ? 'on' : ''} onClick={() => set({ rule: 'local' })}>Local and above</button></div></div>
          <p style={{ color: 'var(--ink)' }}>{s.rule === 'active'
            ? 'Your offer is on. Ask for the I am local line. Valid Tuesday to Thursday, 15:00 to 18:00 [sample times]. Discount size: [pending].'
            : 'The offer starts at Local. You need [N] more confirmed visits over [N] weeks. Your visits already count toward points.'}</p>
          {v.deal && <p className="sm">{v.deal}</p>}
        </div>

        <div className="card">
          <h3>Rate this place</h3>
          {!visited ? (
            <div className="col" style={{ gap: 10 }}>
              <p style={{ color: 'var(--ink)' }}>Ratings come from confirmed visits only, one per visit. Photograph your receipt after your next visit.</p>
              <Link className="btn s" href={`/receipt?venue=${v.id}`}>Photograph receipt</Link>
            </div>
          ) : (
            <div className="col" style={{ gap: 10 }}>
              <div className="stars" role="group" aria-label="Your rating">{[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className={n <= stars ? 'on' : ''} aria-label={`${n} of 5`} aria-pressed={n <= stars} onClick={() => setStars(n)}><Icon d={I.star} /></button>
              ))}</div>
              <label htmlFor="rv">Your review</label><textarea id="rv" value={text} onChange={(e) => setText(e.target.value)} />
              <div className="row"><button className={`tog ${tag ? 'on' : ''}`} aria-pressed={tag} onClick={() => setTag(!tag)}>Tag the owner</button><Chip tone="calm">Verified visit</Chip></div>
              <button className="btn" onClick={postReview}>Post review</button>
            </div>
          )}
        </div>

        <h2>From the owner</h2>
        {following ? posts.map((p) => (
          <div className="card" key={p.id}>
            <div className="row"><div className="col"><h3>{v.name}</h3><p className="sm">Venue you follow · {p.at}</p></div>{p.chip && <Chip tone="rw">{p.chip}</Chip>}</div>
            <p style={{ color: 'var(--ink)' }}>{p.text} [sample post]</p>
            <div className="row">{FEATURES.social && <Link className="tog" href="/feed">See in feed</Link>}<Chip>Seen only by followers</Chip></div>
          </div>
        )) : <div className="card"><h3>Posts are for followers</h3><p>Follow {v.name} to see its posts and alerts. The owner never sends marketing to people who do not follow.</p></div>}
        {following && posts.length === 0 && <p>No posts from this venue yet.</p>}

      </div>
    </Shell>
  );
}
