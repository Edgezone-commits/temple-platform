import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const SVCS = [
  { icon:'🪔', nk:'pooja',   dk:'poojaDesc',   ck:'poojaCta',   ne:'पूजा बुकिङ',         href:'/poojas/book' },
  { icon:'🌸', nk:'archana', dk:'archanaDesc', ck:'archanaCta', ne:'अर्चना',              href:'/poojas'      },
  { icon:'📖', nk:'library', dk:'libraryDesc', ck:'libraryCta', ne:'पवित्र पुस्तकालय',   href:'/books'       },
  { icon:'🎵', nk:'bhajans', dk:'bhajansDesc', ck:'bhajansCta', ne:'भजन संग्रह',          href:'/bhajans'     },
] as const;

export default function ServicesSection() {
  const t = useTranslations('services');
  return (
    <section className="services-section">
      <div style={{ maxWidth:'1280px', margin:'0 auto', position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
          <span className="section-eyebrow">{t('eyebrow')}</span>
          <h2 className="section-title">{t('title')}</h2>
          <span className="section-title-ne">{t('titleNe')}</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1.4rem' }}>
          {SVCS.map(({ icon, nk, dk, ck, ne, href }) => (
            <Link key={nk} href={href} style={{ textDecoration:'none' }}>
              <div className="service-card">
                <span style={{ fontSize:'2.4rem', display:'block', marginBottom:'.9rem' }}>{icon}</span>
                <span className="service-name">{t(nk)}</span>
                <span className="service-name-ne">{ne}</span>
                <p className="service-desc">{t(dk)}</p>
                <span className="service-link">{t(ck)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}