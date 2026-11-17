/**
 * Visit history helpers (pure functions, no React).
 *
 * A visit is counted in the Doorway history only when BOTH are true: the person checked in at
 * the place, and a receipt photo for that visit was confirmed. This mirrors the product rule
 * that a visit is confirmed by a receipt, not by a tap alone. In this mock-up both steps are
 * simulated; real verification (live code, staff check, receipt reading) belongs to a later service.
 */
export interface Visit {
  venueId: string;
  /** ISO timestamp of the check-in. */
  at: string;
  /** True once a receipt photo for this visit has been confirmed. */
  receipt: boolean;
  /** Marks seeded demo rows so the UI can label them as sample data. */
  sample?: boolean;
}

/** Start a visit. A repeat check-in at the same place replaces its unconfirmed row instead of adding a duplicate. */
export function checkIn(history: Visit[], venueId: string, now = new Date()): Visit[] {
  const rest = history.filter((v) => !(v.venueId === venueId && !v.receipt));
  return [{ venueId, at: now.toISOString(), receipt: false }, ...rest];
}

/** Set the receipt flag on the most recent visit at a place. No check-in means nothing to confirm, so nothing changes. */
export function markReceipt(history: Visit[], venueId: string, receipt: boolean): Visit[] {
  const i = history.findIndex((v) => v.venueId === venueId);
  if (i < 0) return history;
  return history.map((v, n) => (n === i ? { ...v, receipt } : v));
}

/** Visits that count: checked in and receipt confirmed, newest first. */
export const confirmedVisits = (history: Visit[]): Visit[] =>
  history.filter((v) => v.receipt).sort((a, b) => b.at.localeCompare(a.at));

/** Short date such as "13 Nov". */
export const shortDate = (iso: string): string => new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
