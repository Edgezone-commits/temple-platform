/**
 * Month grid for /calendar (Server Component).
 *
 * - Bikram Sambat months by default (like a Nepali patro), Gregorian on toggle;
 *   every cell shows both dates.
 * - Observances come from calendar_events (fetched by the page) and appear as
 *   coloured chips (dots on phones) linking to the agenda list below.
 * - Navigation is plain links (?cal=bs&y=2083&m=7), so it works without JS and
 *   every month has a shareable URL.
 */
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import StateMessage from '@/components/ui/StateMessage';
import { DATE_FMT, parseDate, pick, pickAlt } from '@/lib/localize';
import {
  LAST_CONFIRMED_BS_YEAR, adToBs, parseYmd, weekday,
  type CalendarSystem, type MonthView,
} from '@/lib/nepaliCalendar';
import type { CalendarCategory, CalendarEntry } from '@/lib/types';

const LEGEND: CalendarCategory[] = ['festival', 'ekadashi', 'purnima', 'amavasya', 'sankranti', 'special_pooja'];
const MAX_CHIPS = 2;
const color = (c: CalendarCategory) => `var(--cal-${c}, var(--cal-other))`;

interface Props {
  view: MonthView;
  today: string;              // AD YYYY-MM-DD in Nepal time
  entries: CalendarEntry[];
  error: boolean;
}

export default async function MonthCalendar({ view, today, entries, error }: Props) {
  const [t, tc, ts, format, locale] = await Promise.all([
    getTranslations('calendar'), getTranslations('categories.calendar'), getTranslations('state'),
    getFormatter(), getLocale(),
  ]);
  const ne = locale === 'ne';
  const bsMonths = t.raw('bsMonths') as string[];
  const weekdays = t.raw('weekdays') as string[];
  const num = (n: number) => format.number(n, { useGrouping: false });
  const adMonthYear = (ad: string) => format.dateTime(parseDate(ad), { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const adMonthShort = (ad: string) => format.dateTime(parseDate(ad), { month: 'short', timeZone: 'UTC' });
  const bsMonthYear = (ad: string) => { const b = adToBs(ad); return `${bsMonths[b.m - 1]} ${num(b.y)}`; };

  const first = view.days[0];
  const last = view.days[view.days.length - 1];

  // ---- titles ------------------------------------------------------------
  const title = view.system === 'bs' ? `${bsMonths[view.m - 1]} ${num(view.y)}` : adMonthYear(first);
  const otherStart = view.system === 'bs' ? adMonthYear(first) : bsMonthYear(first);
  const otherEnd = view.system === 'bs' ? adMonthYear(last) : bsMonthYear(last);
  const subtitle = otherStart === otherEnd ? otherStart : `${otherStart} – ${otherEnd}`;
  const provisional = adToBs(last).y > LAST_CONFIRMED_BS_YEAR;

  // ---- entries by day ------------------------------------------------------
  const byDay = new Map<string, CalendarEntry[]>();
  for (const e of entries) {
    const from = e.event_date < first ? first : e.event_date;
    const to = (e.end_date ?? e.event_date) > last ? last : (e.end_date ?? e.event_date);
    for (const d of view.days) if (d >= from && d <= to) byDay.set(d, [...(byDay.get(d) ?? []), e]);
  }
  for (const list of byDay.values()) list.sort((a, b) => Number(b.is_major) - Number(a.is_major));
  const agenda = [...entries].sort((a, b) => a.event_date.localeCompare(b.event_date) || Number(b.is_major) - Number(a.is_major));

  // ---- links -------------------------------------------------------------
  const href = (system: CalendarSystem, ym?: { y: number; m: number } | null) => ({
    pathname: '/calendar' as const,
    query: ym ? { cal: system, y: String(ym.y), m: String(ym.m) } : { cal: system },
  });
  // Switching systems keeps you near the same dates: use the month's middle day.
  const mid = view.days[Math.floor(view.days.length / 2)];
  const midBs = adToBs(mid), midAd = parseYmd(mid);
  const switchTo = (s: CalendarSystem) => href(s, s === 'bs' ? { y: midBs.y, m: midBs.m } : { y: midAd.y, m: midAd.m });

  // ---- cell labels ---------------------------------------------------------
  // secondaryMonth is shown where the other calendar's month changes (hidden on phones).
  const cellNumbers = (ad: string) => {
    const bs = adToBs(ad), a = parseYmd(ad);
    if (view.system === 'bs') {
      return { primary: num(bs.d), secondary: num(a.d), secondaryMonth: a.d === 1 || ad === first ? adMonthShort(ad) : '' };
    }
    return { primary: num(a.d), secondary: num(bs.d), secondaryMonth: bs.d === 1 || ad === first ? bsMonths[bs.m - 1] : '' };
  };

  return (
    <div className="cal-wrap">
      <div className="cal-inner">
        {/* Month navigation */}
        <div className="cal-toolbar">
          {view.prev
            ? <Link className="cal-nav" href={href(view.system, view.prev)} aria-label={t('prev')} rel="prev">‹</Link>
            : <span className="cal-nav" aria-disabled="true">‹</span>}
          <div className="cal-title">
            <h2>{title}</h2>
            <span className="cal-subtitle">{subtitle}</span>
          </div>
          {view.next
            ? <Link className="cal-nav" href={href(view.system, view.next)} aria-label={t('next')} rel="next">›</Link>
            : <span className="cal-nav" aria-disabled="true">›</span>}
        </div>

        <div className="cal-controls">
          <nav className="cal-seg" aria-label={t('switchTo')}>
            <Link href={switchTo('bs')} aria-current={view.system === 'bs' ? 'true' : undefined}>{t('bs')}</Link>
            <Link href={switchTo('ad')} aria-current={view.system === 'ad' ? 'true' : undefined}>{t('ad')}</Link>
          </nav>
          <span className="cal-seg"><Link href={href(view.system)}>{t('today')}</Link></span>
        </div>

        {provisional && <p className="cal-provisional" role="note">{t('provisional')}</p>}
        {error && <div style={{ marginBottom:'1.2rem' }}><StateMessage kind="error" message={ts('error')} hint={ts('errorHint')} /></div>}

        {/* Grid */}
        <div className="cal-grid">
          {weekdays.map((w, i) => <div key={w} className={`cal-wd${i === 6 ? ' sat' : ''}`} aria-hidden="true">{w}</div>)}
          {Array.from({ length: view.leading }, (_, i) => <div key={`b${i}`} className="cal-cell blank" aria-hidden="true" />)}
          {view.days.map(ad => {
            const list = byDay.get(ad) ?? [];
            const { primary, secondary, secondaryMonth } = cellNumbers(ad);
            const isToday = ad === today;
            const cls = ['cal-cell', weekday(ad) === 6 && 'sat', isToday && 'today', list.some(e => e.is_major) && 'major'].filter(Boolean).join(' ');
            const bs = adToBs(ad);
            const label = `${format.dateTime(parseDate(ad), { ...DATE_FMT.long, weekday: 'long' })} · ${bsMonths[bs.m - 1]} ${num(bs.d)}, ${num(bs.y)}`
              + (list.length ? ` — ${list.map(e => pick(e, 'title', locale)).join(', ')}` : '');
            return (
              <div key={ad} className={cls} aria-label={label} aria-current={isToday ? 'date' : undefined}>
                {isToday && <span className="cal-today-badge">{t('todayBadge')}</span>}
                <div className="cal-daynum">
                  <span className={`cal-primary${ne ? ' deva' : ''}`}>{primary}</span>
                  <span className="cal-secondary">{secondaryMonth && <span className="cal-sec-month">{secondaryMonth} </span>}{secondary}</span>
                </div>
                {list.slice(0, MAX_CHIPS).map(e => (
                  <a key={e.id} href={`#e-${e.id}`} className={`cal-chip${ne ? ' deva' : ''}`} style={{ background: color(e.category) }} title={pick(e, 'title', locale)}>
                    {pick(e, 'title', locale)}
                  </a>
                ))}
                {list.length > MAX_CHIPS && <span className="cal-more">{t('more', { n: num(list.length - MAX_CHIPS) })}</span>}
                {list.length > 0 && (
                  <span className="cal-dots" aria-hidden="true">
                    {list.map(e => <i key={e.id} className="cal-dot" style={{ background: color(e.category) }} />)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend + notes */}
        <div className="cal-legend" aria-label={t('legend')}>
          {LEGEND.map(c => <span key={c}><i style={{ background: color(c) }} />{tc(c)}</span>)}
        </div>
        <p className="cal-notes">{t('saturdayHint')} {t('computedNote')}</p>

        {/* Agenda */}
        <section className="cal-agenda" aria-labelledby="agenda-title">
          <h3 id="agenda-title">{t('agendaTitle')}</h3>
          {agenda.length === 0 && !error ? (
            <StateMessage kind="empty" message={t('noEntries')} />
          ) : (
            <ol>
              {agenda.map(e => {
                const bs = adToBs(e.event_date);
                const primaryNum = view.system === 'bs' ? num(bs.d) : num(parseYmd(e.event_date).d);
                // Started in an earlier month (multi-day): say which month the day number belongs to.
                const startMonth = e.event_date < first
                  ? (view.system === 'bs' ? bsMonths[bs.m - 1] : adMonthShort(e.event_date))
                  : '';
                const alt = pickAlt(e, 'title', locale);
                const desc = pick(e, 'description', locale);
                const tithi = pick(e, 'tithi', locale);
                return (
                  <li key={e.id} id={`e-${e.id}`} style={{ borderLeftColor: color(e.category) }}>
                    <div className="ag-date">
                      <strong className={ne ? 'deva' : undefined}>{primaryNum}</strong>
                      {startMonth && <small>{startMonth}</small>}
                      {weekdays[weekday(e.event_date)]}
                      <small>{view.system === 'bs'
                        ? format.dateTime(parseDate(e.event_date), DATE_FMT.dayMonth)
                        : `${bsMonths[bs.m - 1]} ${num(bs.d)}`}</small>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <span className="ag-cat" style={{ color: color(e.category) }}>
                        {tc(e.category)}{tithi && tithi !== tc(e.category) ? ` · ${tithi}` : ''}
                      </span>
                      <h4>{pick(e, 'title', locale)}{e.is_major ? ' ✦' : ''}</h4>
                      {alt && <span className="ag-alt">{alt}</span>}
                      {e.end_date && e.end_date !== e.event_date && (
                        <p>{t('multiDay', { date: format.dateTime(parseDate(e.end_date), DATE_FMT.long) })}</p>
                      )}
                      {desc && <p>{desc}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
