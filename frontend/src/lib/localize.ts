/**
 * Helpers for bilingual database rows (title_en / title_ne, …).
 * Safe to use in both Server and Client Components.
 */

export type Locale = 'en' | 'ne';

/**
 * pick(row, 'title', locale) → row.title_ne when the locale is Nepali and a
 * Nepali value exists, otherwise row.title_en. Returns '' if neither exists.
 */
export function pick<K extends string>(
  row: Partial<Record<`${K}_en` | `${K}_ne`, string | null>>,
  field: K,
  locale: string,
): string {
  const en = row[`${field}_en` as `${K}_en`] ?? '';
  if (locale === 'ne') return row[`${field}_ne` as `${K}_ne`] || en;
  return en;
}

/**
 * The other language's value, for the small secondary line under titles.
 * No fallback: returns '' if that language is missing, so a title is never
 * shown twice.
 */
export function pickAlt<K extends string>(
  row: Partial<Record<`${K}_en` | `${K}_ne`, string | null>>,
  field: K,
  locale: string,
): string {
  const other = locale === 'ne' ? 'en' : 'ne';
  const alt = row[`${field}_${other}` as `${K}_en` | `${K}_ne`] ?? '';
  return alt === pick(row, field, locale) ? '' : alt;
}

/**
 * Parse 'YYYY-MM-DD' as UTC midnight. ALWAYS format the result with
 * { timeZone: 'UTC' } (see DATE_FMT) so a date never shifts by a day between
 * the server's and the visitor's timezone.
 */
export function parseDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Common date formats for parseDate() values. */
export const DATE_FMT = {
  long:  { day: 'numeric', month: 'long',  year: 'numeric', timeZone: 'UTC' },
  short: { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' },
  dayMonth: { day: 'numeric', month: 'short', timeZone: 'UTC' },
  weekday: { weekday: 'short', timeZone: 'UTC' },
} as const;

/** Today's date (YYYY-MM-DD) in Nepal time, regardless of server timezone. */
export function todayInNepal(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());
}
