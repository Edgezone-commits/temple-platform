/**
 * Archana (flower offering) cards from GET /api/v1/archanas. Server Component.
 * Hidden entirely on API error — the pooja grid above already shows the
 * error message, and one alert per page is enough.
 */
import { getLocale, getTranslations } from 'next-intl/server';
import { formatterFor } from '@/lib/format';
import { Link } from '@/i18n/navigation';
import StateMessage from '@/components/ui/StateMessage';
import { pick, pickAlt } from '@/lib/localize';
import type { Archana } from '@/lib/types';

export default async function ArchanaSection({ archanas }: { archanas: Archana[] | null }) {
  if (archanas === null) return null;
  const [t, tp, ts, locale] = await Promise.all([
    getTranslations('archanas'), getTranslations('poojaGrid'), getTranslations('state'), getLocale(),
  ]);
  const format = formatterFor(locale);

  return (
    <div className="page-section dark">
      <div style={{ position:'absolute', inset:0, opacity:.04, backgroundImage:'repeating-linear-gradient(0deg,var(--gold-500) 0,var(--gold-500) 1px,transparent 0,transparent 38px),repeating-linear-gradient(90deg,var(--gold-500) 0,var(--gold-500) 1px,transparent 0,transparent 38px)', pointerEvents:'none' }} />
      <div style={{ maxWidth:'1280px', margin:'0 auto', position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <span className="section-eyebrow light">{t('eyebrow')}</span>
          <h2 className="section-title light">{t('title')}</h2>
          <span className="section-title-ne light">{t('titleNe')}</span>
        </div>
        {archanas.length === 0 ? (
          <StateMessage kind="empty" message={ts('emptyArchanas')} dark />
        ) : (
          <div className="g-4" style={{ gap:'1.2rem' }}>
            {archanas.map(a => {
              const deity = pick(a, 'deity', locale);
              return (
                <article key={a.id} className="archana-card">
                  <span style={{ fontSize:'2rem', display:'block', marginBottom:'.8rem' }} aria-hidden="true">🌸</span>
                  <h3 style={{ fontFamily:'var(--ff-heading)', fontSize:'.85rem', fontWeight:700, color:'var(--gold-100)', display:'block', marginBottom:'3px' }}>{pick(a, 'name', locale)}</h3>
                  {pickAlt(a, 'name', locale) && (
                    <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.78rem', color:'rgba(232,201,122,.45)', display:'block', marginBottom:'.4rem' }}>{pickAlt(a, 'name', locale)}</span>
                  )}
                  {deity && (
                    <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.6rem', letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(232,201,122,.45)', display:'block', marginBottom:'.8rem' }}>{t('deity', { deity })}</span>
                  )}
                  {a.price != null && (
                    <span style={{ fontFamily:'var(--ff-display)', fontSize:'1rem', color:'var(--gold-500)', display:'block', marginBottom:'1rem' }}>{`${tp('currency')} ${format.number(a.price)}`}</span>
                  )}
                  <Link href="/poojas/book" style={{ fontFamily:'var(--ff-heading)', fontSize:'.65rem', fontWeight:700, letterSpacing:'.15em', textTransform:'uppercase', background:'var(--gold-500)', color:'var(--maroon-950)', padding:'7px 16px', textDecoration:'none', display:'inline-block' }}>{t('offer')}</Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
