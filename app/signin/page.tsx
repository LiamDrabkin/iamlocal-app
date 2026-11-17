'use client';
/** Sign in or create an account with a one-time email link. Optional: the app works without it. */
import Link from 'next/link';
import { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Back, Shell } from '@/components/ui';
import { useAuth } from '@/lib/auth';

function SignInForm() {
  const { enabled, user, signIn, signOut } = useAuth();
  const [email, setEmail] = useState(useSearchParams().get('email') ?? '');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending'); setError(null);
    const err = await signIn(email);
    if (err) { setError(err); setStatus('idle'); } else setStatus('sent');
  };

  if (!enabled) return <p>Sign-in is not switched on for this copy of the mock-up.</p>;

  if (user) return (
    <div className="card">
      <h2>You are signed in</h2>
      <p>{user.email}</p>
      <p className="sm">Your follows, likes, posts and settings are saved to your account.</p>
      <Link className="btn" href="/favourites">Continue</Link>
      <button className="btn s" onClick={() => void signOut()}>Sign out</button>
    </div>
  );

  if (status === 'sent') return (
    <div className="card" role="status">
      <h2>Check your email</h2>
      <p>We sent a sign-in link to <b>{email}</b>. Open it on this device to finish. It can take a minute to arrive.</p>
      <button className="btn s" onClick={() => setStatus('idle')}>Use a different email</button>
    </div>
  );

  return (
    <form className="col" style={{ gap: 14 }} onSubmit={submit}>
      <div className="col" style={{ gap: 6 }}>
        <label htmlFor="em">Email</label>
        <input id="em" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error && <p role="alert" style={{ color: 'var(--ac)' }}>{error}</p>}
      <button className="btn" type="submit" disabled={status === 'sending'} style={{ minHeight: 56 }}>{status === 'sending' ? 'Sending…' : 'Email me a sign-in link'}</button>
      <p className="sm">No password. New here? The same link creates your account.</p>
    </form>
  );
}

export default function SignIn() {
  return (
    <Shell tabs={false}>
      <div className="sc">
        <Back href="/welcome">Back</Back>
        <h1>Sign in</h1>
        <p>Save your follows, likes and posts to an account, so they follow you across devices.</p>
        <Suspense fallback={null}><SignInForm /></Suspense>
        <p className="sm" style={{ textAlign: 'center' }}><Link href="/favourites" style={{ textDecoration: 'underline' }}>Keep looking around without an account</Link></p>
      </div>
    </Shell>
  );
}
