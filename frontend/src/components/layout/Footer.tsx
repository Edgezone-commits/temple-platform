import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const t  = useTranslations('footer');
  const tn = useTranslations('nav');

  return (
    <footer className="site-footer">
      <div className="footer-gold-line" />
      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'3.5rem 2rem',
        display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'3rem' }}>

        <div>
          <Image src="/images/logo.png" alt="Temple Logo" width={200} height={84}
            style={{ height:'52px', width:'auto', filter:'brightness(.8) sepia(.3)', marginBottom:'.9rem' }} />
          <span style={{ fontFamily:'var(--ff-display)', fontSize:'.88rem', color:'var(--gold-300)', display:'block', lineHeight:1.4, marginBottom:'.2rem' }}>
            Shree Laxminarayan Mandir
          </span>
          <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.78rem', color:'rgba(232,201,122,.35)', display:'block', marginBottom:'.9rem' }}>
            Shree Laxminarayan Mandir
          </span>
          <p style={{ fontSize:'.88rem', color:'rgba(232,201,122,.38)', lineHeight:1.8 }}>
            {t('address')}<br />
            {t('phone')}<br />
            {t('email')}
          </p>
        </div>

        <div>
          <p className="footer-col-title">{t('quickLinks')}</p>
          <Link href="/"            className="footer-link">{tn('home')}</Link>
          <Link href="/events"      className="footer-link">{tn('events')}</Link>
          <Link href="/poojas"      className="footer-link">{tn('poojas')}</Link>
          <Link href="/poojas/book" className="footer-link">{tn('bookPooja')}</Link>
          <Link href="/books"       className="footer-link">{tn('books')}</Link>
          <Link href="/bhajans"     className="footer-link">{tn('bhajans')}</Link>
        </div>

        <div>
          <p className="footer-col-title">{t('services')}</p>
          <Link href="/poojas"  className="footer-link">Archana</Link>
          <Link href="/poojas"  className="footer-link">Abhishekam</Link>
          <Link href="/poojas"  className="footer-link">Homam</Link>
          <Link href="/contact" className="footer-link">Donate</Link>
          <Link href="/contact" className="footer-link">AI Pandit (Coming Soon)</Link>
        </div>

        <div>
          <p className="footer-col-title">{t('timings')}</p>
          {[['Morning','5:00 AM - 12:00 PM'],['Afternoon','Closed 12-4 PM'],['Evening','4:00 PM - 8:00 PM']].map(([l,v]) => (
            <div key={l}>
              <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.63rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--gold-500)', display:'block', marginTop:'.7rem' }}>{l}</span>
              <p style={{ fontSize:'.88rem', color:'rgba(232,201,122,.4)' }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop:'1px solid rgba(201,148,58,.12)', padding:'1rem 2rem', maxWidth:'1280px', margin:'0 auto', display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontFamily:'var(--ff-meta)', fontStyle:'italic', fontSize:'.78rem', color:'rgba(201,148,58,.28)' }}>{t('copyright')}</span>
        <span style={{ fontFamily:'var(--ff-meta)', fontStyle:'italic', fontSize:'.78rem', color:'rgba(201,148,58,.28)' }}>{t('mantra')}</span>
      </div>
    </footer>
  );
}