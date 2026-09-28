import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const t  = useTranslations('footer');
  const tn = useTranslations('nav');
  const th = useTranslations('header');
  const tt = useTranslations('timings');

  return (
    <footer className="site-footer">
      <div className="footer-gold-line" />
      <div className="footer-grid">

        <div>
          <Image src="/images/logo.png" alt="Temple Logo" width={200} height={84}
            style={{ height:'52px', width:'auto', filter:'brightness(.8) sepia(.3)', marginBottom:'.9rem' }} />
          <span style={{ fontFamily:'var(--ff-display)', fontSize:'.88rem', color:'var(--gold-300)', display:'block', lineHeight:1.4, marginBottom:'.2rem' }}>
            {th('templeName')}
          </span>
          <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.78rem', color:'rgba(232,201,122,.35)', display:'block', marginBottom:'.9rem' }}>
            {th('templeNameNe')}
          </span>
          <p style={{ fontSize:'.88rem', color:'rgba(232,201,122,.38)', lineHeight:1.8, whiteSpace:'pre-line' }}>
            {t('address')}<br />
            {t('phone')}<br />
            {t('email')}
          </p>
        </div>

        <div>
          <p className="footer-col-title">{t('quickLinks')}</p>
          <Link href="/"            className="footer-link">{tn('home')}</Link>
          <Link href="/events"      className="footer-link">{tn('events')}</Link>
          <Link href="/calendar"    className="footer-link">{tn('calendar')}</Link>
          <Link href="/poojas"      className="footer-link">{tn('poojas')}</Link>
          <Link href="/poojas/book" className="footer-link">{tn('bookPooja')}</Link>
          <Link href="/books"       className="footer-link">{tn('books')}</Link>
          <Link href="/bhajans"     className="footer-link">{tn('bhajans')}</Link>
          <Link href="/gallery"     className="footer-link">{tn('gallery')}</Link>
        </div>

        <div>
          <p className="footer-col-title">{t('services')}</p>
          <Link href="/poojas"  className="footer-link">{t('archana')}</Link>
          <Link href="/poojas"  className="footer-link">{t('abhishekam')}</Link>
          <Link href="/poojas"  className="footer-link">{t('homam')}</Link>
          <Link href="/contact" className="footer-link">{t('donate')}</Link>
          <span className="footer-link" style={{ cursor:'default' }}>{t('aiPandit')}</span>
        </div>

        <div>
          <p className="footer-col-title">{t('timings')}</p>
          {([['morning','morningTime'],['afternoon','afternoonTime'],['evening','eveningTime']] as const).map(([lk,vk]) => [tt(lk), tt(vk)]).map(([l,v]) => (
            <div key={l}>
              <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.63rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--gold-500)', display:'block', marginTop:'.7rem' }}>{l}</span>
              <p style={{ fontSize:'.88rem', color:'rgba(232,201,122,.4)' }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-bottom">
        <span style={{ fontFamily:'var(--ff-meta)', fontStyle:'italic', fontSize:'.78rem', color:'rgba(201,148,58,.28)' }}>{t('copyright')}</span>
        <span style={{ fontFamily:'var(--ff-meta)', fontStyle:'italic', fontSize:'.78rem', color:'rgba(201,148,58,.28)' }}>{t('mantra')}</span>
      </div>
    </footer>
  );
}