/**
 * /[locale]/history — founders and present leadership from the leadership
 * table (GET /api/v1/leadership; founders are returned first).
 */
import Image from 'next/image';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import PageHero     from '@/components/ui/PageHero';
import StateMessage from '@/components/ui/StateMessage';
import NamamDivider from '@/components/ui/NamamDivider';
import { getLeadership } from '@/lib/api';
import { pick, pickAlt } from '@/lib/localize';
import type { LeaderProfile } from '@/lib/types';

async function PersonCard({ p }: { p: LeaderProfile }) {
  const [t, locale] = await Promise.all([getTranslations('history'), getLocale()]);
  const name = pick(p, 'name', locale);
  const bio = pick(p, 'bio', locale);
  return (
    <article className={`person-card${p.is_founder ? ' founder' : ''}`}>
      <div className="person-photo">
        {p.photo_url
          ? <Image src={p.photo_url} alt={name} fill sizes="(max-width:700px) 100vw, 260px" style={{ objectFit: 'cover', objectPosition: 'center top' }} />
          : <span aria-hidden="true">🙏</span>}
      </div>
      <div className="person-body">
        {pick(p, 'role', locale) && <span className="person-role">{pick(p, 'role', locale)}</span>}
        <h3>{name}</h3>
        {pickAlt(p, 'name', locale) && <span className="person-alt">{pickAlt(p, 'name', locale)}</span>}
        {p.years_active && <span className="person-years">{p.years_active}</span>}
        {bio && <p className="person-bio">{bio}</p>}
        {p.video_url && <a href={p.video_url} target="_blank" rel="noopener noreferrer" className="btn-outline person-video">{t('watch')}</a>}
      </div>
    </article>
  );
}

export default async function HistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [result, t, ts] = await Promise.all([getLeadership(), getTranslations('history'), getTranslations('state')]);
  const founders = result.data?.filter(p => p.is_founder) ?? [];
  const leaders = result.data?.filter(p => !p.is_founder) ?? [];

  const group = (title: string, alt: string, people: LeaderProfile[]) => people.length > 0 && (
    <section className="history-group">
      <span className="section-eyebrow">{alt}</span>
      <h2 className="section-title">{title}</h2>
      <NamamDivider />
      <div className="person-list">{people.map(p => <PersonCard key={p.id} p={p} />)}</div>
    </section>
  );

  return (
    <>
      <PageHero page="history" />
      <div style={{ padding: '3.5rem 2rem', background: 'var(--ivory-100)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {result.error ? <StateMessage kind="error" message={ts('error')} hint={ts('errorHint')} />
            : founders.length + leaders.length === 0 ? <StateMessage kind="empty" message={t('empty')} />
            : <>
                {group(t('founders'), t('foundersNe'), founders)}
                {group(t('leadership'), t('leadershipNe'), leaders)}
              </>}
        </div>
      </div>
    </>
  );
}
