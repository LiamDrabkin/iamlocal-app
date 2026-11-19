'use client';
/** One profile screen for both "me" (/profile) and any other person (/profile/[id]). */
import Link from 'next/link';
import { useState } from 'react';
import { Back, Chip, Faces, Icon, I, PersonAv, SampleNote, Shell, VenueImg } from '@/components/ui';
import { useApp } from '@/lib/store';
import { ME, img, type Level } from '@/lib/types';
import { FEATURES } from '@/lib/features';

const LADDER: Level[] = ['Visitor', 'Active', 'Local', 'Regular'];

export default function ProfileView({ id }: { id: string }) {
  const { data, s, flip, has, person, venue } = useApp();
  const p = person(id);
  const mine = id === ME;
  const [tab, setTab] = useState<'places' | 'people' | 'posts' | 'reviews'>('places');

  const reviews = [...(mine ? s.myReviews : []), ...data.reviews.filter((r) => r.personId === id)];
  const following = data.people.filter((x) => x.id !== id && (mine ? s.following.includes(x.id) : x.recent.some((r) => p.recent.includes(r))));
  const posts = [...(mine ? s.myPosts : []), ...data.posts.filter((x) => x.authorKind === 'person' && x.authorId === id)];
  const deals = data.events.filter((e) => has('alerts', e.venueId));

  /** Reviews, one per confirmed visit. Shown in the Posts tab (social) or its own Reviews tab (production). */
  const reviewsBlock = (
    <>
          <h2>Reviews</h2>
          {reviews.length === 0 && <p>No reviews yet.</p>}
          {reviews.map((r) => (
            <Link key={r.id} href={`/venue/${r.venueId}`} className="card"><div className="row sp"><h3>{venue(r.venueId).name}</h3><Chip>{r.rating} of 5</Chip></div><p>{r.text}</p></Link>
          ))}
          <div className="sample">One review per confirmed visit. Venues can reply.</div>
    </>
  );

  return (
    <Shell>
      <div className="sc">
        {!mine && <Back href="/profile">Back</Back>}
        <div className="row sp"><h1>{mine ? 'Profile' : p.name}</h1>
          {mine && <Link href="/settings" className="bell" aria-label="Settings" style={{ borderRadius: 12, width: 48, height: 48 }}><Icon d={I.gear} /></Link>}</div>

        {mine && s.profile.cover
          // eslint-disable-next-line @next/next/no-img-element
          ? <img className="pcover" src={s.profile.cover} alt="" />
          : null}
        <div className="card">
          <div className="row">{/* eslint-disable-next-line @next/next/no-img-element */}<img className="av big" src={img(p.avatar)} alt={p.name} />
            <div className="col"><h2>{mine ? `${p.name} (you)` : p.name}</h2><p>Hout Bay · {p.level}</p><p className="sm">{p.bio}</p></div></div>
          {!mine && <button className={`tog ${has('following', id) ? 'on' : ''}`} style={{ minHeight: 48 }} aria-pressed={has('following', id)} onClick={() => flip('following', id)}>{has('following', id) ? 'Following' : 'Follow'}</button>}
          <div className="lad">{LADDER.map((l) => <span key={l} className={l === p.level ? 'on' : ''}>{l}</span>)}</div>
          {mine && <Link className="btn s" href="/profile/edit">Edit profile</Link>}
          {mine && <div className="row sp"><div className="col"><p className="sm">Your I am local reference</p><span style={{ font: "600 20px 'Source Code Pro', monospace", letterSpacing: '.06em' }}>IAL 7K2 9QD</span></div><Link className="btn" href="/doorway">Show doorway</Link></div>}
        </div>

        {mine && (
          <div className="card">
            <div className="row sp"><h3>Your Trust Score</h3><Chip>Sample</Chip></div>
            <div className="row sp"><span className="big-n">[N]</span><p>of 100</p></div>
            <div className="bar"><i style={{ width: '55%' }} /></div>
            <p className="sm">How this is worked out is still to be decided. It is a placeholder.</p>
          </div>
        )}
        <SampleNote />

        <div className="seg" role="tablist" aria-label="Profile sections">
          {(FEATURES.social
            ? ([['places', 'Places'], ['people', mine ? 'People' : 'Overlap'], ['posts', 'Posts']] as const)
            : ([['places', 'Places'], ['reviews', 'Reviews']] as const)
          ).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {tab === 'places' && (<>
          <h2>Recent places</h2>
          {p.recent.map((vid) => { const v = venue(vid); return (
            <Link key={vid} href={`/venue/${vid}`} className="card"><div className="row"><VenueImg v={v} cls="thumb" /><div className="col"><h3>{v.name}</h3><p className="sm">{mine && !has('visits', vid) && vid === 'w' ? 'Visit confirmed' : 'Visit confirmed'} [sample]</p></div><Chip tone="calm">Verified</Chip></div></Link>
          ); })}
        </>)}

        {tab === 'reviews' && reviewsBlock}

        {tab === 'posts' && (<>
          {p.photos?.length ? (<>
            <h2>Photos</h2>
            <div className="pgrid">
              {p.photos.map((ph) => (// eslint-disable-next-line @next/next/no-img-element
                <img key={ph} src={img(ph)} alt="" loading="lazy" />
              ))}
            </div>
          </>) : null}
          <h2>Posts</h2>
          {posts.length === 0 && <p>No posts yet.</p>}
          {posts.map((x) => (
            <div className="card" key={x.id}>
              <div className="row sp"><p className="sm">{x.venueId ? venue(x.venueId).name : ''} · {x.at}</p>{x.chip && <Chip tone="calm">{x.chip}</Chip>}</div>
              <p style={{ color: 'var(--ink)' }}>{x.text}</p>
              {x.photo && (// eslint-disable-next-line @next/next/no-img-element
                <img className="pimg" src={img(x.photo)} alt="" loading="lazy" />
              )}
            </div>
          ))}
          {reviewsBlock}
        </>)}

        {tab === 'people' && (<>
          <h2>{mine ? 'Friends and following' : 'People who go to the same places'}</h2>
          {mine && <div className="row" style={{ gap: 8 }}><Chip>{s.following.length} following</Chip><Chip>{s.venueFollows.length} venues</Chip></div>}
          {following.map((x) => (
            <div className="card" key={x.id}><div className="row"><PersonAv p={x} />
              <Link href={`/profile/${x.id}`} className="col link"><h3>{x.name}</h3><p className="sm">{x.level}{x.sharing && s.following.includes(x.id) ? ' · shares busy level' : ''}</p></Link>
              <button className={`tog ${has('following', x.id) ? 'on' : ''}`} aria-pressed={has('following', x.id)} onClick={() => flip('following', x.id)}>{has('following', x.id) ? 'Following' : 'Follow'}</button></div></div>
          ))}
        </>)}

        {mine && (<>
          <h2>Deals from your favourites</h2>
          {deals.map((e) => { const v = venue(e.venueId); return (
            <Link key={e.id} href={`/venue/${v.id}`} className="card"><div className="row sp"><h3>{v.name}</h3>{e.chip && <Chip tone={e.chip === 'New' ? 'calm' : 'rw'}>{e.chip}</Chip>}</div><p>{e.title}, {e.whenText.toLowerCase()}</p><div className="row" style={{ gap: 8 }}><Faces ids={e.going} /><p className="sm">{e.goingMore + e.going.length} going</p></div></Link>
          ); })}
          <Link className="btn" href="/favourites">See all alerts</Link>
        </>)}
      </div>
    </Shell>
  );
}
