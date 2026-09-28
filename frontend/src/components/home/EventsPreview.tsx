/**
 * Homepage "Upcoming Celebrations" — next 3 events from GET /api/v1/events.
 * Async Server Component: the homepage wraps it in <Suspense> with
 * EventsPreviewSkeleton so the rest of the page isn't blocked by the API.
 */
import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import { formatterFor } from '@/lib/format';
import { Link } from '@/i18n/navigation';
import StateMessage from '@/components/ui/StateMessage';
import { getEvents } from '@/lib/api';
import { EVENT_ICON } from '@/lib/icons';
import { pick, pickAlt } from '@/lib/localize';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="events-section">
      <div style={{ maxWidth:'1280px', margin:'0 auto', position:'relative', zIndex:1 }}>{children}</div>
    </section>
  );
}

async function Header() {
  const t = await getTranslations('eventsPreview');
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'3rem', gap:'1rem', flexWrap:'wrap' }}>
      <div>
        <span className="section-eyebrow light">{t('eyebrow')}</span>
        <h2 className="section-title light">{t('title')}</h2>
        <span className="section-title-ne light">{t('titleNe')}</span>
      </div>
      <Link href="/calendar" style={{ fontFamily:'var(--ff-heading)', fontSize:'.7rem', letterSpacing:'.18em', textTransform:'uppercase', color:'var(--gold-500)', textDecoration:'none', borderBottom:'1px solid var(--gold-700)', paddingBottom:'2px', whiteSpace:'nowrap' }}>
        {t('viewAll')}
      </Link>
    </div>
  );
}

export default async function EventsPreview() {
  const [result, t, tc, ts, locale] = await Promise.all([
    getEvents({ upcoming: true, limit: 3 }),
    getTranslations('eventsPreview'),
    getTranslations('categories.event'),
    getTranslations('state'),
    getLocale(),
  ]);

  const format = formatterFor(locale);

  let body: React.ReactNode;
  if (result.error) body = <StateMessage kind="error" message={ts('error')} dark />;
  else if (result.data.length === 0) body = <StateMessage kind="empty" message={ts('emptyEvents')} dark />;
  else body = (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.4rem' }}>
      {result.data.map(e => {
        const title = pick(e, 'title', locale);
        const alt = pickAlt(e, 'title', locale);
        const desc = pick(e, 'description', locale);
        return (
          <Link key={e.id} href="/events" style={{ textDecoration:'none' }}>
            <article className="event-card" style={{ height:'100%' }}>
              <div className="card-media" style={{ height:'145px', fontSize:'2.8rem' }}>
                {e.image_url
                  ? <Image src={e.image_url} alt={title} fill sizes="(max-width:900px) 100vw, 33vw" style={{ objectFit:'cover' }} />
                  : <span aria-hidden="true">{EVENT_ICON[e.category] ?? '🙏'}</span>}
              </div>
              <span className="event-badge">
                {format.date(e.event_date, 'dayMonth')}
                {e.is_featured ? ` · ${t('featured')}` : ` · ${tc(e.category)}`}
              </span>
              <div style={{ padding:'.6rem 1.2rem 1.3rem' }}>
                <h3 style={{ fontFamily:'var(--ff-heading)', fontSize:'.88rem', fontWeight:700, color:'var(--gold-100)', marginBottom:'1px' }}>{title}</h3>
                {alt && <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.78rem', color:'rgba(232,201,122,.45)', display:'block', marginBottom:'.5rem' }}>{alt}</span>}
                {desc && <p style={{ fontSize:'.88rem', color:'rgba(249,237,203,.55)', lineHeight:1.5 }}>{desc}</p>}
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );

  return <Shell><Header />{body}</Shell>;
}

/** Suspense fallback: same shell with shimmering dark cards. */
export async function EventsPreviewSkeleton() {
  return (
    <Shell>
      <Header />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.4rem' }} aria-hidden="true">
        {[0, 1, 2].map(i => (
          <div key={i} style={{ border:'1px solid rgba(201,148,58,.18)', background:'rgba(30,6,6,.65)' }}>
            <div className="skeleton dark" style={{ height:'145px', borderRadius:0 }} />
            <div style={{ padding:'1rem 1.2rem 1.3rem', display:'flex', flexDirection:'column', gap:'.55rem' }}>
              <div className="skeleton dark" style={{ width:'40%', height:'12px' }} />
              <div className="skeleton dark" style={{ width:'70%', height:'15px' }} />
              <div className="skeleton dark" style={{ width:'90%', height:'12px' }} />
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
