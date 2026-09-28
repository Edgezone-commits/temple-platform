/**
 * Horizontal strip of the next few observances (festivals, Ekadashi, Purnima…)
 * from calendar_events. Server Component; renders nothing when there is no
 * data, since the full event grid below already shows an empty/error state.
 */
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { DATE_FMT, parseDate, pick } from '@/lib/localize';
import type { CalendarEntry } from '@/lib/types';

export default async function CalendarStrip({ entries }: { entries: CalendarEntry[] }) {
  if (entries.length === 0) return null;
  const [t, format, locale] = await Promise.all([getTranslations('categories.calendar'), getFormatter(), getLocale()]);

  return (
    <div style={{ background:'var(--maroon-900)', borderBottom:'2px solid var(--gold-700)', overflowX:'auto' }}>
      <ul style={{ maxWidth:'1280px', margin:'0 auto', padding:'0 2rem', display:'flex', listStyle:'none' }}>
        {entries.map(e => {
          const tithi = pick(e, 'tithi', locale) || t(e.category);
          return (
            <li key={e.id} className="cal-strip-item">
              <time dateTime={e.event_date} style={{ fontFamily:'var(--ff-display)', fontSize:'.95rem', color:'var(--gold-500)', display:'block', marginBottom:'2px' }}>
                {format.dateTime(parseDate(e.event_date), DATE_FMT.dayMonth)}
              </time>
              <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.6rem', letterSpacing:'.15em', textTransform:'uppercase', color:'rgba(232,201,122,.55)', display:'block', marginBottom:'3px' }}>{tithi}</span>
              <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.8rem', color:'var(--gold-100)', display:'block' }}>{pick(e, 'title', locale)}</span>
              {pick(e, 'bs_date', locale) && (
                <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.72rem', color:'rgba(232,201,122,.45)' }}>{pick(e, 'bs_date', locale)}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
