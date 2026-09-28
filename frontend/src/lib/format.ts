/**
 * Deterministic EN/NE number and date formatting.
 *
 * Why not Intl / next-intl's formatter? Browsers ship reduced ICU data:
 * Chrome has NO Nepali locale data, so Intl.DateTimeFormat('ne') falls back
 * to English ("October 21, 2026") and Intl.NumberFormat('ne') gives Latin
 * digits, while Node on the server has full data ("२१ अक्टोबर २०२६", "५००").
 * Formatting the same value on server and client then disagreed, causing
 * React hydration errors (#418) and English dates on Nepali pages.
 *
 * These helpers use fixed tables instead, so server and browser always
 * produce identical output. Use them for EVERY user-visible number/date.
 * Dates are 'YYYY-MM-DD' strings (no timezone involved).
 */

const DEVA_DIGITS = '०१२३४५६७८९';
export const toDevanagariDigits = (s: string) => s.replace(/[0-9]/g, d => DEVA_DIGITS[Number(d)]);

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ne: ['जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल', 'मे', 'जुन', 'जुलाई', 'अगस्ट', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर'],
};
const MONTHS_SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ne: ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'],
};

const isNe = (locale: string) => locale === 'ne';

/** Group an integer string: 1,234,567 (en) or 12,34,567 (ne, lakh style). */
function group(int: string, lakh: boolean): string {
  if (!lakh) return int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (int.length <= 3) return int;
  const head = int.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${int.slice(-3)}`;
}

/**
 * Format a number. Up to 2 decimals are kept (trailing zeros dropped).
 * opts.grouping=false for years/day numbers; opts.minDigits pads with zeros.
 */
export function formatNumber(n: number, locale: string, opts: { grouping?: boolean; minDigits?: number } = {}): string {
  const neg = n < 0;
  const [int, frac] = Math.abs(Math.round(n * 100) / 100).toString().split('.');
  let s = opts.minDigits ? int.padStart(opts.minDigits, '0') : int;
  if (opts.grouping !== false) s = group(s, isNe(locale));
  if (frac) s += `.${frac}`;
  if (neg) s = `-${s}`;
  return isNe(locale) ? toDevanagariDigits(s) : s;
}

export type DateStyle = 'long' | 'full' | 'dayMonth' | 'monthYear' | 'month';

/**
 * Format an AD date 'YYYY-MM-DD'.
 *   long      October 21, 2026            | २१ अक्टोबर २०२६
 *   full      Wednesday, October 21, 2026 | बुधबार, २१ अक्टोबर २०२६
 *   dayMonth  Oct 21                      | २१ अक्टोबर
 *   monthYear October 2026                | अक्टोबर २०२६
 *   month     Oct                         | अक्टोबर
 */
export function formatDate(ymd: string, locale: string, style: DateStyle = 'long'): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const ne = isNe(locale);
  const num = (v: number) => formatNumber(v, locale, { grouping: false });
  const month = (ne ? MONTHS.ne : MONTHS.en)[m - 1];
  const short = ne ? MONTHS.ne[m - 1] : MONTHS_SHORT_EN[m - 1];
  switch (style) {
    case 'month':     return short;
    case 'dayMonth':  return ne ? `${num(d)} ${short}` : `${short} ${d}`;
    case 'monthYear': return `${month} ${num(y)}`;
    case 'full': {
      const wd = (ne ? WEEKDAYS.ne : WEEKDAYS.en)[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
      return `${wd}, ${formatDate(ymd, locale, 'long')}`;
    }
    default:          return ne ? `${num(d)} ${month} ${num(y)}` : `${month} ${d}, ${y}`;
  }
}

/** m:ss clock for audio (e.g. 3:07 / ३:०७). */
export function formatClock(seconds: number | null | undefined, locale: string): string {
  if (seconds == null || !isFinite(seconds)) return '';
  const s = Math.floor(seconds);
  return `${formatNumber(Math.floor(s / 60), locale, { grouping: false })}:${formatNumber(s % 60, locale, { grouping: false, minDigits: 2 })}`;
}

/** Convenience bundle bound to a locale: const format = formatterFor(locale). */
export function formatterFor(locale: string) {
  return {
    number: (n: number, opts?: { grouping?: boolean; minDigits?: number }) => formatNumber(n, locale, opts),
    date: (ymd: string, style?: DateStyle) => formatDate(ymd, locale, style),
    clock: (seconds: number | null | undefined) => formatClock(seconds, locale),
  };
}
