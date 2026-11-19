'use client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useState } from 'react';
import { Chip, I, Icon, SampleNote, Shell } from '@/components/ui';
import { useApp } from '@/lib/store';
import { ME, img, type Post } from '@/lib/types';
import { FEATURES } from '@/lib/features';

/** The social feed. Off on production: the route returns 404 (lib/features.ts). */
export default function FeedRoute() {
  if (!FEATURES.social) notFound();
  return <Feed />;
}

function Feed() {
  const { data, s, set, flip, has, person, venue, me } = useApp();
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState('Quiet Tuesday and a warm welcome.');
  const [place, setPlace] = useState(data.venues[0].id);

  const posts: Post[] = [...s.myPosts, ...data.posts];
  const visited = has('visits', place);

  const publish = () => {
    const p: Post = { id: `mine-${Date.now()}`, authorKind: 'person', authorId: ME, venueId: place, text, photo: null, chip: 'Verified visit', likes: 0, reps: 0, at: 'Just now' };
    set({ myPosts: [p, ...s.myPosts] });
    setComposing(false);
  };

  return (
    <Shell>
      {composing && (<>
        <div className="scrim" onClick={() => setComposing(false)} />
        <div className="sheet" role="dialog" aria-label="New post" style={{ top: 90 }}>
          <div className="row sp"><h3>New post</h3><button className="btn s" style={{ minHeight: 44 }} onClick={() => setComposing(false)}>Close</button></div>
          <div className="col" style={{ gap: 6 }}><label htmlFor="msg">What happened?</label><textarea id="msg" value={text} onChange={(e) => setText(e.target.value)} /></div>
          <div className="col" style={{ gap: 6 }}><label htmlFor="plc">Tag a place</label>
            <select id="plc" value={place} onChange={(e) => setPlace(e.target.value)}>{data.venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
          {visited
            ? <div className="row"><Chip tone="calm">Tags the owner</Chip><Chip>Seen by your followers</Chip></div>
            : <p>Posting from a place needs a confirmed visit. <Link href={`/receipt?venue=${place}`} style={{ textDecoration: 'underline', color: 'var(--ink)' }}>Photograph a receipt at {venue(place).name}</Link>.</p>}
          <button className="btn" disabled={!visited || !text.trim()} onClick={publish}>Post</button>
        </div>
      </>)}

      <div className="sc">
        <h1>Feed</h1>
        <SampleNote>Sample posts, scores and counts. Real venue names. Everything you do here stays in your own browser.</SampleNote>
        <div className="card"><div className="row">
          <Link href={`/profile`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="av" src={img(me.avatar)} alt="You" /></Link>
          <button className="btn s" style={{ flex: 1, justifyContent: 'flex-start', fontWeight: 600 }} onClick={() => setComposing(true)}>Share where you have been</button>
        </div></div>

        {posts.map((p) => {
          const isVenue = p.authorKind === 'venue';
          const author = isVenue ? venue(p.authorId) : person(p.authorId);
          const authorHref = isVenue ? `/venue/${p.authorId}` : `/profile/${p.authorId}`;
          const avatar = isVenue ? ((author as ReturnType<typeof venue>).logo ?? (author as ReturnType<typeof venue>).img) : (author as ReturnType<typeof person>).avatar;
          const tagged = p.venueId && !isVenue ? venue(p.venueId) : null;
          const reposted = has('reposted', p.id), liked = has('liked', p.id);
          return (
            <div className="card" key={p.id}>
              {p.id === 'p4' && <p className="sm">Reposted by {me.name}</p>}
              <div className="row">
                <Link href={authorHref}>{/* eslint-disable-next-line @next/next/no-img-element */}<img className={`av ${isVenue ? 'v' : ''}`} src={img(avatar)} alt={author.name} /></Link>
                <Link href={authorHref} className="col link"><h3>{author.name}</h3><p className="sm">{isVenue ? 'Venue you follow' : p.rating ? `Rated ${p.rating} of 5` : 'Visited'} · {p.at}</p></Link>
                {p.chip && <Chip tone={p.chip === 'Verified visit' ? 'calm' : p.chip === "Locals' offer" ? 'rw' : undefined}>{p.chip}</Chip>}
              </div>
              <p style={{ color: 'var(--ink)' }}>{p.text} {tagged && <Link href={`/venue/${tagged.id}`} style={{ color: 'var(--ac)', fontWeight: 700 }}>@{tagged.name}</Link>}</p>
              {p.photo && p.venueId && <Link href={`/venue/${p.venueId}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="pimg" src={img(p.photo)} alt="" /></Link>}
              <div className="act">
                <button className={liked ? 'on' : ''} aria-pressed={liked} onClick={() => flip('liked', p.id)}><Icon d={I.heart} />{p.likes + (liked ? 1 : 0)}</button>
                <button className={reposted ? 'on' : ''} aria-pressed={reposted} onClick={() => flip('reposted', p.id)}><Icon d={I.repost} />Repost {p.reps + (reposted ? 1 : 0)}</button>
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
