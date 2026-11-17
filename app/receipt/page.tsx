'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useRef, useState, type ChangeEvent } from 'react';
import { Back, Shell } from '@/components/ui';
import { useApp } from '@/lib/store';

function Inner() {
  const q = useSearchParams();
  const router = useRouter();
  const { venue } = useApp();
  const v = venue(q.get('venue') ?? 'w');
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // `capture` opens the rear camera on a phone; on a computer it opens a file picker.
  // The photo is shown here only to check it, is never uploaded in this mock-up, and the
  // object URL is dropped when the page is left.
  const onPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPreview(URL.createObjectURL(f));
  };

  return (
    <Shell tabs={false}>
      <div className="sc">
        <Back href={`/venue/${v.id}`}>Back to {v.name}</Back>
        <h1>Photograph your receipt</h1>
        <p>For {v.name}. A confirmed receipt unlocks rating, posting from the place and your member discount.</p>
        <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={onPhoto} aria-label={`Photo of your ${v.name} receipt`} />
        {preview
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={preview} alt="Your receipt photo" style={{ width: '100%', maxHeight: 340, objectFit: 'contain', borderRadius: 16 }} />
          : <div className="card" style={{ height: 220, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}><p>No photo yet. Fit the whole receipt in the frame.</p></div>}
        <p className="sm">Receipt photos are used only to confirm the visit. Nothing is uploaded in this mock-up. [Retention wording pending]</p>
        {preview
          ? <><button className="btn" onClick={() => router.push(`/result?venue=${v.id}`)}>Use this photo</button><button className="btn s" onClick={() => { setPreview(null); input.current?.click(); }}>Retake</button></>
          : <button className="btn" onClick={() => input.current?.click()}>Open camera</button>}
        <Link className="btn s" href={`/venue/${v.id}`}>Cancel</Link>
      </div>
    </Shell>
  );
}

export default function Receipt() {
  return <Suspense><Inner /></Suspense>;
}
