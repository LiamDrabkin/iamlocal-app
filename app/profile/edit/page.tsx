'use client';
/** Edit my profile: picture, background, bio. Saved with the rest of my state (browser, or account when signed in). */
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Back, Chip, Shell } from '@/components/ui';
import { shrinkImage } from '@/lib/image';
import { useApp } from '@/lib/store';
import { img } from '@/lib/types';
import { FEATURES } from '@/lib/features';

export default function EditProfile() {
  const { s, set, me, data, venue, has } = useApp();
  const avatarIn = useRef<HTMLInputElement>(null);
  const coverIn = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(s.profile.bio ?? me.bio);
  const [err, setErr] = useState('');

  const pick = async (f: File | undefined, key: 'avatar' | 'cover', edge: number) => {
    if (!f) return;
    try { set({ profile: { ...s.profile, [key]: await shrinkImage(f, edge) } }); setErr(''); }
    catch { setErr('That file could not be read as a picture. Try a JPG or PNG.'); }
  };

  // Current specials and deals at the places I follow, so I can see what is on while editing.
  const deals = data.events.filter((e) => has('alerts', e.venueId) || has('favs', e.venueId));

  return (
    <Shell>
      <div className="sc">
        <Back href="/profile">Back to profile</Back>
        <h1>Edit profile</h1>

        <div className="card">
          <h2>Picture and background</h2>
          {s.profile.cover
            // eslint-disable-next-line @next/next/no-img-element
            ? <img className="pcover" src={s.profile.cover} alt="Your background" />
            : <div className="pcover" aria-hidden="true" />}
          <div className="row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="av big" src={img(me.avatar)} alt="Your picture" />
            <div className="col" style={{ gap: 8, flex: 1 }}>
              <button className="btn s" onClick={() => avatarIn.current?.click()}>Change picture</button>
              <button className="btn s" onClick={() => coverIn.current?.click()}>Change background</button>
            </div>
          </div>
          <input ref={avatarIn} type="file" accept="image/*" hidden aria-label="Choose a profile picture" onChange={(e) => void pick(e.target.files?.[0], 'avatar', 320)} />
          <input ref={coverIn} type="file" accept="image/*" hidden aria-label="Choose a background picture" onChange={(e) => void pick(e.target.files?.[0], 'cover', 900)} />
          {err && <p role="alert" style={{ color: 'var(--ac)' }}>{err}</p>}
          <p className="sm">Pictures are shrunk on this device and saved with your profile. Choose photos you are happy for others to see.</p>
        </div>

        <div className="card">
          <h2>About you</h2>
          <label htmlFor="bio">Bio</label>
          <textarea id="bio" value={bio} maxLength={160} onChange={(e) => setBio(e.target.value)} />
          <button className="btn" onClick={() => set({ profile: { ...s.profile, bio } })}>Save bio</button>
        </div>

        {FEATURES.social && (
          <div className="card">
            <h2>Posts</h2>
            <p>Create a post from a place you have a confirmed visit at.</p>
            <Link className="btn s" href="/feed">Write a post</Link>
          </div>
        )}

        <h2>On now at your favourites</h2>
        {deals.length === 0 && <p>No current deals.</p>}
        {deals.map((e) => (
          <Link key={e.id} href={`/venue/${e.venueId}`} className="card">
            <div className="row sp"><h3>{venue(e.venueId).name}</h3>{e.chip && <Chip tone="rw">{e.chip}</Chip>}</div>
            <p>{e.title}, {e.whenText.toLowerCase()}</p>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
