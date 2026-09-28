"use client";
/**
 * Filterable grid of upcoming temple events.
 * Data is fetched on the server (events/page.tsx → GET /api/v1/events) and
 * passed in; only the category filter runs in the browser.
 */
import { useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import StateMessage from '@/components/ui/StateMessage';
import { formatterFor } from '@/lib/format';
import { pick, pickAlt } from '@/lib/localize';
import { EVENT_ICON } from '@/lib/icons';
import type { EventCategory, TempleEvent } from '@/lib/types';

const FILTERS: EventCategory[] = ['festival', 'ekadashi', 'purnima', 'special_pooja'];

export default function EventsGrid({ events }: { events: TempleEvent[] }) {
  const t = useTranslations('categories');
  const ts = useTranslations('state');
  const locale = useLocale();
  const format = formatterFor(locale);
  const [active, setActive] = useState<EventCategory | 'all'>('all');

  if (events.length === 0) return <StateMessage kind="empty" message={ts('emptyEvents')} />;

  const filtered = active === 'all' ? events : events.filter(e => e.category === active);

  return (
    <>
      <div style={{ display:'flex', gap:'.7rem', flexWrap:'wrap', marginBottom:'2.5rem' }} role="toolbar">
        {(['all', ...FILTERS] as const).map(f => (
          <button key={f} onClick={() => setActive(f)} aria-pressed={active === f}
            className={`filter-btn ${active === f ? 'active' : ''}`}>
            {f === 'all' ? t('all') : t(`event.${f}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <StateMessage kind="empty" message={ts('emptyCategory')} />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.4rem' }}>
          {filtered.map(e => {
            const title = pick(e, 'title', locale);
            const alt = pickAlt(e, 'title', locale);
            const desc = pick(e, 'description', locale);
            return (
              <article key={e.id} className="card-lift" style={{ borderTop:'3px solid var(--gold-500)' }}>
                <div className="card-media" style={{ height:'150px' }}>
                  {e.image_url
                    ? <Image src={e.image_url} alt={title} fill sizes="(max-width:900px) 100vw, 33vw" style={{ objectFit:'cover' }} />
                    : <span aria-hidden="true">{EVENT_ICON[e.category] ?? '🙏'}</span>}
                </div>
                <div style={{ padding:'1.1rem 1.3rem 1.4rem' }}>
                  <time dateTime={e.event_date} style={{ fontFamily:'var(--ff-heading)', fontSize:'.62rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--gold-700)', display:'block', marginBottom:'.3rem' }}>
                    {format.date(e.event_date, 'long')} · {t(`event.${e.category}`)}
                  </time>
                  <h3 style={{ fontFamily:'var(--ff-heading)', fontSize:'.92rem', fontWeight:700, color:'var(--maroon-800)', marginBottom:'2px' }}>{title}</h3>
                  {alt && <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.8rem', color:'var(--text-light)', display:'block', marginBottom:'.5rem' }}>{alt}</span>}
                  {desc && <p style={{ fontSize:'.9rem', color:'var(--text-mid)', lineHeight:1.5 }}>{desc}</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
