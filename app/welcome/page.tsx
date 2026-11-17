'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useApp } from '@/lib/store';
import { img } from '@/lib/types';

const STEPS = ['Join from anywhere.', 'Visit a taking-part place and show your membership.', 'Photograph your receipt. Your first confirmed visit switches the membership on.'];

/**
 * Welcome and member signup. The artwork (sculpture, Hout Bay photo) comes from the active mood and is drawn
 * by <Shell hero>; this page only lays out the content, so every mood shares one markup.
 */
export default function Welcome() {
  const router = useRouter();
  const { enabled, user } = useAuth();
  const { s } = useApp();
  return (
    <Shell tabs={false} hero>
      <div className="wl">
        <div className="row" style={{ fontWeight: 700, fontSize: 18 }}>
          <svg className="ic" viewBox="0 0 24 24" style={{ width: 24, height: 28 }} aria-hidden="true"><path d="M5 22V11a7 7 0 0 1 14 0v11" /><circle cx="12" cy="17" r="1.5" fill="currentColor" /></svg>
          <span>I am local</span>
        </div>
        <form className="wl-card" onSubmit={(e) => {
          e.preventDefault();
          const email = (new FormData(e.currentTarget).get('email') as string | null)?.trim();
          // With sign-in on, a typed email carries over to the sign-in page; otherwise just look around.
          router.push(enabled && !user && email ? `/signin?email=${encodeURIComponent(email)}` : '/favourites');
        }}>
          {s.mood === 'classic' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img('site/welcome')} alt="Hout Bay at dusk, the harbour lights below Chapman's Peak" style={{ width: '100%', height: 190, objectFit: 'cover', objectPosition: 'center 78%', borderRadius: 16 }} />
          )}
          <div className="wl-top">
            <h1 style={{ fontSize: 32 }}>Member Signup</h1>
            <p>The I am local membership rewards the people who keep a town lively.</p>
            <div className="card">
              {STEPS.map((t, i) => (
                <div className="wl-step" key={t}><span className="n">{i + 1}</span><p>{t}</p></div>
              ))}
            </div>
          </div>
          <div className="wl-form">
            <div className="col" style={{ gap: 6 }}><label htmlFor="em">Email</label><input id="em" name="email" type="email" placeholder="you@example.com" /></div>
            <button className="btn" type="submit" style={{ minHeight: 56 }}>Join</button>
            <p style={{ textAlign: 'center' }}><Link href={enabled ? '/signin' : '/favourites'} style={{ textDecoration: 'underline' }}>I already have a membership</Link></p>
            <p className="sm" style={{ textAlign: 'center' }}>Receipt photos and your location are used only to confirm visits. [Privacy notice wording pending]</p>
            <div className="sample">Mock-up. Everything here is sample data and nothing is sent anywhere.</div>
          </div>
        </form>
      </div>
    </Shell>
  );
}
