import { use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import PageHero    from '@/components/ui/PageHero';
import ContactForm from '@/components/contact/ContactForm';

const CARDS = [
  { icon:'📍', tk:'addressTitle', bk:'address' },
  { icon:'📞', tk:'phoneTitle',   bk:'phone'   },
  { icon:'✉',  tk:'emailTitle',   bk:'email'   },
  { icon:'⏰', tk:'hoursTitle',   bk:'hours'   },
] as const;

export default function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(use(params).locale);
  const t = useTranslations('contact');
  return (
    <>
      <PageHero page="contact" />
      <div className="page-section">
        <div className="page-inner g-2" style={{ gap:'3rem' }}>
          <ContactForm />
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {CARDS.map(({ icon, tk, bk }) => (
              <div key={tk} style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', borderLeft:'3px solid var(--gold-500)', padding:'1.2rem' }}>
                <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.72rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--maroon-800)', display:'block', marginBottom:'.5rem' }}>{icon} {t(tk)}</span>
                <p style={{ fontSize:'.9rem', color:'var(--text-mid)', lineHeight:1.65, whiteSpace:'pre-line' }}>{t(bk)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
