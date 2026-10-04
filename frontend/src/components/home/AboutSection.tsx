import Image from 'next/image';
import { useTranslations } from 'next-intl';
import NamamDivider from '@/components/ui/NamamDivider';

// Figure (nk) and label (lk) both come from messages so NE shows ३६५ / बिहान ५.
const FACTS = [
  { nk:'daysOpenN', lk:'daysOpen' }, { nk:'festivalsN', lk:'festivals' },
  { nk:'suprabhatamN', lk:'suprabhatam' }, { nk:'blessingsN', lk:'blessings' },
] as const;

export default function AboutSection() {
  const t = useTranslations('about');
  return (
    <section className="about-section">
      <div className="page-inner about-grid">
        <div>
          <span className="section-eyebrow">{t('eyebrow')}</span>
          <h2 className="section-title">{t('title')}</h2>
          <span className="section-title-ne">{t('titleNe')}</span>
          <NamamDivider />
          <p style={{ fontSize:'1.2rem', color:'var(--text-dark)', fontWeight:600, marginBottom:'1.1rem', lineHeight:1.8 }}>{t('p1')}</p>
          <p style={{ fontSize:'1.08rem', color:'var(--text-mid)', marginBottom:'1.1rem', lineHeight:1.8 }}>{t('p2')}</p>
          <p style={{ fontSize:'1.08rem', color:'var(--text-mid)', marginBottom:'1.1rem', lineHeight:1.8 }}>{t('p3')}</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.9rem', marginTop:'2rem' }}>
            {FACTS.map(({ nk, lk }) => (
              <div key={lk} className="fact-card">
                <span className="fact-number">{t(nk)}</span>
                <span className="fact-label">{t(lk)}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem' }}>
          <div className="deity-arch">
            <Image src="/images/deity.jpg" alt="Lord Laxminarayan" width={400} height={534}
              style={{ width:'100%', height:'500px', objectFit:'cover', objectPosition:'center top' }} />
          </div>
          <p className="deity-caption">{t('deityCaption')}</p>
        </div>
      </div>
    </section>
  );
}