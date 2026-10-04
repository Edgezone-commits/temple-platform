/**
 * Grid of bookable pooja services (from GET /api/v1/poojas via poojas/page.tsx).
 * Server Component. "Book →" deep-links to the form with the pooja preselected.
 */
import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import { formatterFor } from '@/lib/format';
import { Link } from '@/i18n/navigation';
import StateMessage from '@/components/ui/StateMessage';
import { POOJA_ICONS } from '@/lib/icons';
import { pick, pickAlt } from '@/lib/localize';
import type { Pooja } from '@/lib/types';

export default async function PoojaGrid({ poojas }: { poojas: Pooja[] | null }) {
  const [t, ts, locale] = await Promise.all([
    getTranslations('poojaGrid'), getTranslations('state'), getLocale(),
  ]);
  const format = formatterFor(locale);

  return (
    <div className="page-section">
      <div className="page-inner">
        <div style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', borderLeft:'4px solid var(--gold-500)', padding:'1rem 1.5rem', marginBottom:'2.5rem', display:'flex', gap:'1rem', alignItems:'flex-start' }}>
          <span style={{ fontSize:'1.4rem' }} aria-hidden="true">🙏</span>
          <div>
            <p style={{ fontFamily:'var(--ff-heading)', fontSize:'.78rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--maroon-800)', marginBottom:'.3rem' }}>{t('infoTitle')}</p>
            <p style={{ fontSize:'.92rem', color:'var(--text-mid)', lineHeight:1.6 }}>{t('infoBody')}</p>
          </div>
        </div>

        {poojas === null ? (
          <StateMessage kind="error" message={ts('error')} hint={ts('errorHint')} />
        ) : poojas.length === 0 ? (
          <StateMessage kind="empty" message={ts('emptyPoojas')} />
        ) : (
          <div className="g-3">
            {poojas.map((p, i) => {
              const name = pick(p, 'name', locale);
              const alt = pickAlt(p, 'name', locale);
              const desc = pick(p, 'description', locale);
              return (
                <article key={p.id} className="card-lift">
                  <div className="card-media" style={{ height:'130px', background:'linear-gradient(135deg,var(--maroon-900),var(--maroon-700))' }}>
                    {p.image_url
                      ? <Image src={p.image_url} alt={name} fill sizes="(max-width:900px) 100vw, 33vw" style={{ objectFit:'cover' }} />
                      : <span aria-hidden="true">{POOJA_ICONS[i % POOJA_ICONS.length]}</span>}
                    {p.is_popular && (
                      <span style={{ position:'absolute', top:'.8rem', right:'.8rem', background:'var(--gold-500)', color:'var(--maroon-950)', fontFamily:'var(--ff-heading)', fontSize:'.6rem', fontWeight:700, letterSpacing:'.1em', padding:'3px 8px' }}>{t('popular')}</span>
                    )}
                  </div>
                  <div style={{ padding:'1.2rem' }}>
                    <h3 style={{ fontFamily:'var(--ff-heading)', fontSize:'.9rem', fontWeight:700, color:'var(--maroon-800)', marginBottom:'2px' }}>{name}</h3>
                    {alt && <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.82rem', color:'var(--text-light)', display:'block', marginBottom:'.6rem' }}>{alt}</span>}
                    {desc && <p style={{ fontSize:'.9rem', color:'var(--text-mid)', lineHeight:1.5, marginBottom:'1rem' }}>{desc}</p>}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid var(--ivory-300)', paddingTop:'.8rem', gap:'.5rem' }}>
                      <div>
                        {p.price != null && (
                          <span style={{ fontFamily:'var(--ff-display)', fontSize:'1rem', color:'var(--maroon-600)', display:'block', lineHeight:1 }}>
                            {`${t('currency')} ${format.number(p.price)}`}
                          </span>
                        )}
                        {p.duration_minutes != null && (
                          <span style={{ fontFamily:'var(--ff-meta)', fontStyle:'italic', fontSize:'.8rem', color:'var(--text-light)' }}>
                            {`⏱ ${t('minutes', { n: format.number(p.duration_minutes) })}`}
                          </span>
                        )}
                      </div>
                      <Link href={{ pathname: '/poojas/book', query: { pooja: p.id } }} style={{ fontFamily:'var(--ff-heading)', fontSize:'.65rem', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', background:'var(--maroon-800)', color:'var(--gold-300)', padding:'7px 14px', textDecoration:'none', display:'inline-block', whiteSpace:'nowrap' }}>
                        {t('book')}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
