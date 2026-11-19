'use client';
/** Small shared building blocks. Every avatar and venue name here is a link, so nothing is a dead end. */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { img, type Person, type Venue } from '@/lib/types';
import { useApp } from '@/lib/store';
import { FEATURES } from '@/lib/features';

export const Icon = ({ d, fill }: { d: string; fill?: boolean }) => (
  <svg className="ic" viewBox="0 0 24 24" aria-hidden="true" style={fill ? { fill: 'currentColor' } : undefined}><path d={d} /></svg>
);
export const I = {
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  feed: 'M4 6h16M4 12h16M4 18h10',
  pin: 'M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z',
  user: 'M4 21c0-4 4-6 8-6s8 2 8 6',
  repost: 'M4 11V9a3 3 0 0 1 3-3h11l-3-3M20 13v2a3 3 0 0 1-3 3H6l3 3',
  bell: 'M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  gear: 'M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
};

export function Chip({ children, tone }: { children: ReactNode; tone?: 'calm' | 'rw' }) {
  return <span className={`chip ${tone ?? ''}`}>{children}</span>;
}

/** A person's avatar. Links to their profile only when the social layer is on; otherwise it is just a picture. */
export function PersonAv({ p, cls = '' }: { p: Person; cls?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  const pic = <img className={`av ${cls}`} src={img(p.avatar)} alt={p.name} />;
  return FEATURES.social ? <Link href={`/profile/${p.id}`} aria-label={`${p.name}'s profile`}>{pic}</Link> : pic;
}

export function VenueImg({ v, cls = 'thumb' }: { v: Venue; cls?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={cls} src={img(v.img)} alt={v.name} />;
}

/** Overlapping faces; each links to that person's profile. */
export function Faces({ ids }: { ids: string[] }) {
  const { person } = useApp();
  return <div className="stk">{ids.map((id) => <PersonAv key={id} p={person(id)} cls="sm" />)}</div>;
}

/** The member's own trust score. Sample value until the scoring rules are decided. */
export function TrustCard({ value = 62 }: { value?: number }) {
  return (
    <div className="card">
      <div className="row sp"><h3>Your trust score</h3><Chip>Sample</Chip></div>
      <div className="row sp"><span className="big-n">{value}</span><p>of 100</p></div>
      <div className="bar" role="img" aria-label={`Trust score ${value} of 100`}><i style={{ width: `${value}%` }} /></div>
      <p className="sm">How this is worked out is still to be decided. It is a placeholder.</p>
    </div>
  );
}

export function Back({ href, children }: { href: string; children: ReactNode }) {
  return <Link className="back" href={href}>{children}</Link>;
}

/** Bottom tab bar: Favourites, Feed (social only), Doorway, Map, Profile. Settings opens from the gear in Profile. */
export function Tabs() {
  const path = usePathname();
  const on = (p: string) => (path === p || path.startsWith(p + '/') ? 'on' : '');
  return (
    <nav className={`tabs ${FEATURES.social ? '' : 'flat'}`} aria-label="Main">
      <Link className={on('/favourites')} href="/favourites"><Icon d={I.heart} />Favourites</Link>
      {FEATURES.social && <Link className={on('/feed')} href="/feed"><Icon d={I.feed} />Feed</Link>}
      <Link href="/doorway" aria-label="Show my membership"><span className="c"><svg className="ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 28, height: 28 }}><path d="M6 20V11a6 6 0 0 1 12 0v9" /><circle cx="12" cy="16" r="1.6" fill="currentColor" /></svg></span></Link>
      <Link className={on('/map')} href="/map"><Icon d={I.pin} />Map</Link>
      <Link className={on('/profile') || on('/settings')} href="/profile"><svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d={I.user} /></svg>Profile</Link>
    </nav>
  );
}

/** Page frame used by every main screen. */
/** App frame. The two art layers are driven by the active mood's CSS variables (app/moods.css); `hero` is the Welcome page. */
export function Shell({ children, tabs = true, hero = false }: { children: ReactNode; tabs?: boolean; hero?: boolean }) {
  return (<div className={hero ? 'app hero' : 'app'}><div className="art-h" aria-hidden="true" /><div className="art-s" aria-hidden="true" />{children}{tabs && <Tabs />}</div>);
}

export const SampleNote = ({ children }: { children?: ReactNode }) => (
  <div className="sample">{children ?? 'Sample scores, posts, reviews and deals. Real venue names. Photos are placeholders from the team.'}</div>
);
