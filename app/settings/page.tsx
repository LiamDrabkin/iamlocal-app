'use client';
import Link from 'next/link';
import { Back, Shell } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { visibleThemes } from '@/lib/themes';
import { MOODS } from '@/lib/moods';
import { useApp, type Local } from '@/lib/store';
import { COPY } from '@/lib/features';

/** Platforms a member could link. Mock-up only: linking just records the choice. */
const PLATFORMS = ['Instagram', 'Facebook', 'TikTok', 'X'];

type NotifKey = keyof Local['notif'];

export default function Settings() {
  const { s, set, reset, data } = useApp();
  const { enabled, user, signOut } = useAuth();
  const Toggle = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
    <button className={`tog pill ${on ? 'on' : ''}`} aria-pressed={on} aria-label={label} onClick={onClick}>{on ? 'On' : 'Off'}</button>
  );
  const notif = (k: NotifKey) => set({ notif: { ...s.notif, [k]: !s.notif[k] } });

  return (
    <Shell>
      <div className="sc">
        <Back href="/profile">Back to profile</Back>
        <h1>Settings</h1>
        {enabled && (
          <div className="card">
            <h2>Account</h2>
            {user ? (<>
              <p>{user.email}</p>
              <p className="sm">Your {COPY.saved} are saved to your account.</p>
              <button className="btn s" onClick={() => void signOut()}>Sign out</button>
            </>) : (<>
              <p className="sm">Not signed in. Your {COPY.saved} are saved only in this browser.</p>
              <Link className="btn" href="/signin">Sign in or create account</Link>
            </>)}
          </div>
        )}
        <div className="card">
          <h2>Look</h2>
          <div className="tgrid" role="group" aria-label="Look">
            {MOODS.map((m) => {
              const dark = s.theme === 'dark' || (s.theme !== 'light' && s.theme !== 'system' && visibleThemes.find((t) => t.id === s.theme)?.mode === 'dark');
              const sw = dark ? m.swatch.dark : m.swatch.light;
              return (
                <button key={m.id} className={s.mood === m.id ? 'on' : ''} aria-pressed={s.mood === m.id} onClick={() => set({ mood: m.id, ...(s.theme !== 'system' && s.theme !== 'light' && s.theme !== 'dark' ? { theme: 'system' as const } : {}) })}>
                  <span className="dots" aria-hidden="true">{sw.map((c) => <i key={c} style={{ background: c }} />)}</span>
                  <b>{m.name}</b><span className="sm">{m.note}</span>
                </button>
              );
            })}
          </div>
          <div className="row" role="group" aria-label="Mode" style={{ gap: 8 }}>
            {(['system', 'light', 'dark'] as const).map((m) => (
              <button key={m} className={`tog ${s.theme === m ? 'on' : ''}`} style={{ minHeight: 48, flex: 1 }} aria-pressed={s.theme === m} onClick={() => set({ theme: m })}>
                {m === 'system' ? 'Phone' : m === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Classic themes</h2>
          <button className={`tog ${s.theme === 'system' ? 'on' : ''}`} style={{ minHeight: 48 }} aria-pressed={s.theme === 'system'} onClick={() => set({ theme: 'system', mood: 'classic' })}>
            {s.theme === 'system' ? 'Following my phone (light and dark)' : 'Follow my phone instead'}
          </button>
          {([['Light', 'light', false], ['Dark', 'dark', false], ['Experiments (off-brand, for discussion)', null, true]] as const).map(([title, mode, exp]) => {
            const list = visibleThemes.filter((t) => (exp ? !!t.experiment : !t.experiment && t.mode === mode));
            if (!list.length) return null;
            return (<div className="col" style={{ gap: 8 }} key={title}>
              <h3>{title}</h3>
              <div className="tgrid" role="group" aria-label={title}>
                {list.map((t) => (
                  <button key={t.id} className={s.theme === t.id ? 'on' : ''} aria-pressed={s.theme === t.id}
                    onClick={() => set(t.mode === 'dark' ? { theme: t.id, darkPick: t.id, mood: 'classic' } : { theme: t.id, lightPick: t.id, mood: 'classic' })}>
                    <span className="dots" aria-hidden="true">{t.swatch.map((c) => <i key={c} style={{ background: c }} />)}</span>
                    <b>{t.name}</b><span className="sm">{t.note}</span>
                  </button>
                ))}
              </div>
            </div>);
          })}
        </div>
        <div className="card">
          <h2>Connected accounts</h2>
          <p className="sm">Mock-up: choosing Connect only records your choice. Nothing is linked and nothing is shared.</p>
          {PLATFORMS.map((n) => { const on = s.connected.includes(n); return (
            <div className="row" key={n}><div className="col"><b>{n}</b></div>
              <button className={`tog ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => set({ connected: on ? s.connected.filter((x) => x !== n) : [...s.connected, n] })}>{on ? 'Connected' : 'Connect'}</button></div>
          ); })}
        </div>
        <div className="card">
          <h2>What my profile shows</h2>
          {([['places', 'My places'], ['reviews', 'My reviews'], ['photos', 'My photos']] as const).map(([k, t]) => (
            <div className="row" key={k}><div className="col"><b>{t}</b></div><Toggle on={s.share[k]} onClick={() => set({ share: { ...s.share, [k]: !s.share[k] } })} label={t} /></div>
          ))}
        </div>
        <div className="card">
          <h2>Notifications</h2>
          {([['deals', 'Deals from favourites', "Locals' offers and events"], ['friends', 'Friend activity', 'Check-ins and reviews'], ['receipts', 'Receipt results', 'Confirmed or needs a look']] as const).map(([k, t, d]) => (
            <div className="row" key={k}><div className="col"><b>{t}</b><p className="sm">{d}</p></div><Toggle on={s.notif[k]} onClick={() => notif(k)} label={t} /></div>
          ))}
        </div>
        <div className="card">
          <h2>Privacy</h2>
          <div className="row"><div className="col"><b>Share where I am</b><p className="sm">Off by default. Followers see the place only, never a street position.</p></div><Toggle on={s.sharing} onClick={() => set({ sharing: !s.sharing })} label="Share where I am" /></div>
          <div className="row"><div className="col"><b>Show my reviews to followers only</b></div><Toggle on={s.reviewsFollowersOnly} onClick={() => set({ reviewsFollowersOnly: !s.reviewsFollowersOnly })} label="Reviews to followers only" /></div>
        </div>
        <div className="card"><h2>Your data</h2><p>Download or delete your data, and how long receipts are kept: [pending, to be confirmed against POPIA].</p></div>
        <div className="sample">Sign-in is by emailed link for now. Google, Apple and phone-number sign-in are still to be decided.</div>
        <div className="card">
          <h2>About this mock-up</h2>
          <p className="sm">Data source: {data.source === 'supabase' ? 'Supabase' : 'built-in sample data'}. {user ? 'Your data is saved to your account.' : `Your ${COPY.saved} are saved only in this browser.`}</p>
          <button className="btn s" onClick={() => { if (confirm(`Reset your ${COPY.saved} on this device?`)) reset(); }}>Reset demo on this device</button>
        </div>
      </div>
    </Shell>
  );
}
