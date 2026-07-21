"use client";
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';

interface HeaderProps { locale: 'en' | 'ne' }

export default function Header({ locale }: HeaderProps) {
  const t = useTranslations('header');
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(l: 'en' | 'ne') {
    router.replace(pathname, { locale: l });
  }

  return (
    <header style={{ position:'sticky', top:0, zIndex:200, boxShadow:'0 4px 24px rgba(0,0,0,.55)' }}>
      {/* Top bar */}
      <div className="header-top">
        <div style={{ display:'flex', gap:'1.5rem' }}>
          <span>📞 {t('phone')}</span>
          <span>📍 {t('location')}</span>
        </div>
        <div className="lang-toggle">
          <button className={`lang-btn ${locale==='en'?'active':''}`} onClick={() => switchLocale('en')}>EN</button>
          <button className={`lang-btn ${locale==='ne'?'active':''}`} onClick={() => switchLocale('ne')}>नेपाली</button>
        </div>
      </div>

      {/* Main row */}
      <div className="header-main">
        <div>
          <div className="temple-name-en">{t('templeName')}</div>
          <div className="temple-name-ne">{t('templeNameNe')}</div>
          <div className="temple-tradition">{t('tradition')}</div>
        </div>
        <Link href="/" aria-label="Home">
          <Image src="/images/logo.png" alt="Temple Logo" width={260} height={110}
            style={{ height:'68px', width:'auto', filter:'drop-shadow(0 2px 10px rgba(201,148,58,.35))' }}
            priority />
        </Link>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <Link href="/poojas/book" className="btn-primary" style={{ fontSize:'.7rem', padding:'8px 18px' }}>
            🙏 {locale==='en'?'Book a Pooja':'पूजा बुक गर्नुहोस्'}
          </Link>
        </div>
      </div>
      <div className="header-gold-line" />
    </header>
  );
}