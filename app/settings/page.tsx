'use client';
import Link from 'next/link';
import { Back, Shell } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useApp, type Local } from '@/lib/store';

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
              <p className="sm">Your follows, likes, posts and settings are saved to your account.</p>
              <button className="btn s" onClick={() => void signOut()}>Sign out</button>
            </>) : (<>
              <p className="sm">Not signed in. Your follows, likes, posts and settings are saved only in this browser.</p>
              <Link className="btn" href="/signin">Sign in or create account</Link>
            </>)}
          </div>
        )}
        <div className="card">
          <h2>Appearance</h2>
          <div className="seg" role="group" aria-label="Theme">
            {(['light', 'dark', 'system'] as const).map((t) => <button key={t} className={s.theme === t ? 'on' : ''} aria-pressed={s.theme === t} onClick={() => set({ theme: t })} style={{ textTransform: 'capitalize' }}>{t}</button>)}
          </div>
          <p className="sm">System follows your phone.</p>
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
          <p className="sm">Data source: {data.source === 'supabase' ? 'Supabase' : 'built-in sample data'}. {user ? 'Your data is saved to your account.' : 'Your follows, likes, posts and settings are saved only in this browser.'}</p>
          <button className="btn s" onClick={() => { if (confirm('Reset your follows, posts and settings on this device?')) reset(); }}>Reset demo on this device</button>
        </div>
      </div>
    </Shell>
  );
}
