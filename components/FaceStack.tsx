'use client';
/**
 * A stack of circular profile photos that expands when tapped to show who is in it.
 * Used wherever the app used to show a bare number: the map pins, the "Coming up" events
 * and the venue page. Only the people the caller passes in are shown (the caller applies the
 * privacy rule: people you follow who chose to share).
 */
import Link from 'next/link';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import { img } from '@/lib/types';

interface Props {
  ids: string[];
  /** Faces shown before "+n". */
  max?: number;
  /** Open the list as a floating card (map) instead of in the page flow. */
  popover?: boolean;
  /** Extra people not listed by id, for example "and 5 more going". */
  more?: number;
}

export default function FaceStack({ ids, max = 3, popover = false, more = 0 }: Props) {
  const { person } = useApp();
  const [open, setOpen] = useState(false);
  if (ids.length === 0) return null;
  const shown = ids.slice(0, max);
  const extra = ids.length - shown.length + more;

  return (
    <div className={`fs ${popover ? 'pop' : ''}`}>
      <button type="button" className="fsb" aria-expanded={open} aria-label={`${ids.length + more} people. ${open ? 'Hide' : 'Show'} who`} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
        {shown.map((id) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={id} className="fsa" src={img(person(id).avatar)} alt="" />
        ))}
        {extra > 0 && <span className="fsn">+{extra}</span>}
      </button>
      {open && (
        <div className="fsx" role="list">
          {ids.map((id) => (
            <Link key={id} role="listitem" href={`/profile/${id}`} className="row" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="av sm" src={img(person(id).avatar)} alt="" />
              <span>{person(id).name}</span>
            </Link>
          ))}
          {more > 0 && <p className="sm">and {more} more</p>}
        </div>
      )}
    </div>
  );
}
