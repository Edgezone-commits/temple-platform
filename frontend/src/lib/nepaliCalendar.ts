/**
 * Bikram Sambat (BS) ⇄ Gregorian (AD) helpers for the /calendar page, built
 * on `nepali-date-converter`. All dates in and out are 'YYYY-MM-DD' strings
 * (AD) or { y, m, d } with 1-based months (BS), so nothing depends on the
 * server's or browser's timezone.
 *
 * Accuracy: BS month lengths are fixed each year by Nepal's calendar
 * committee. The library matches the published calendar through BS 2083
 * (cross-checked day-by-day against the Python `nepali-datetime` package);
 * later years are projections, flagged on the page via LAST_CONFIRMED_BS_YEAR.
 * When a new official year is published, update the npm package.
 */
import NepaliDate from 'nepali-date-converter';

export const LAST_CONFIRMED_BS_YEAR = 2083;
/** Range supported by the converter's data tables. */
export const BS_MIN_YEAR = 2001;
export const BS_MAX_YEAR = 2089;

export type Ymd = { y: number; m: number; d: number };
export type CalendarSystem = 'bs' | 'ad';

const pad = (n: number) => String(n).padStart(2, '0');
export const ymdString = ({ y, m, d }: Ymd) => `${y}-${pad(m)}-${pad(d)}`;

export function parseYmd(s: string): Ymd {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}

/** Day of week (0 = Sunday) for an AD 'YYYY-MM-DD'. */
export function weekday(ad: string): number {
  const { y, m, d } = parseYmd(ad);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** AD 'YYYY-MM-DD' + n days. */
export function addDays(ad: string, n: number): string {
  const { y, m, d } = parseYmd(ad);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return ymdString({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() });
}

export function adToBs(ad: string): Ymd {
  const { y, m, d } = parseYmd(ad);
  // fromAD reads the Date's local fields, so build it from local fields too.
  const bs = NepaliDate.fromAD(new Date(y, m - 1, d)).getBS();
  return { y: bs.year, m: bs.month + 1, d: bs.date };
}

export function bsToAd({ y, m, d }: Ymd): string {
  const ad = new NepaliDate(y, m - 1, d).getAD();
  return ymdString({ y: ad.year, m: ad.month + 1, d: ad.date });
}

/** Month arithmetic on { y, m } (1-based months). */
export function shiftMonth(y: number, m: number, by: number): { y: number; m: number } {
  const i = y * 12 + (m - 1) + by;
  return { y: Math.floor(i / 12), m: (i % 12) + 1 };
}

export interface MonthView {
  system: CalendarSystem;
  y: number;
  m: number;
  /** AD dates of every day in the month, in order. */
  days: string[];
  /** Blank cells before day 1 (0 = month starts on Sunday). */
  leading: number;
  prev: { y: number; m: number } | null;
  next: { y: number; m: number } | null;
}

/** All AD days of a BS or AD month, plus navigation targets. */
export function buildMonth(system: CalendarSystem, y: number, m: number): MonthView {
  let first: string, last: string;
  if (system === 'bs') {
    first = bsToAd({ y, m, d: 1 });
    const n = shiftMonth(y, m, 1);
    last = addDays(bsToAd({ y: n.y, m: n.m, d: 1 }), -1);
  } else {
    first = ymdString({ y, m, d: 1 });
    last = addDays(ymdString({ ...shiftMonth(y, m, 1), d: 1 }), -1);
  }
  const days: string[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) days.push(d);

  const [minY, maxY] = system === 'bs' ? [BS_MIN_YEAR, BS_MAX_YEAR] : [BS_MIN_YEAR - 57, BS_MAX_YEAR - 57];
  const prev = shiftMonth(y, m, -1);
  const next = shiftMonth(y, m, 1);
  return {
    system, y, m, days, leading: weekday(first),
    prev: prev.y >= minY ? prev : null,
    next: next.y <= maxY ? next : null,
  };
}

/** Clamp/validate a requested month; falls back to the month containing `today`. */
export function resolveMonth(system: CalendarSystem, today: string, y?: string, m?: string) {
  const fallback = system === 'bs' ? adToBs(today) : parseYmd(today);
  const yy = Number(y), mm = Number(m);
  const [minY, maxY] = system === 'bs' ? [BS_MIN_YEAR, BS_MAX_YEAR] : [BS_MIN_YEAR - 57, BS_MAX_YEAR - 57];
  if (Number.isInteger(yy) && Number.isInteger(mm) && mm >= 1 && mm <= 12 && yy >= minY && yy <= maxY) {
    return { y: yy, m: mm };
  }
  return { y: fallback.y, m: fallback.m };
}
