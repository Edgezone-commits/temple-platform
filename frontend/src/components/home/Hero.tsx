"use client";
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import NamamDivider from '@/components/ui/NamamDivider';

export default function Hero() {
  const t = useTranslations('hero');
  return (
    <section className="hero-section">
      <div style={{ position:'absolute', inset:0 }}>
        <Image src="/images/deity.jpg" alt="Lord Laxminarayan" fill priority
          style={{ objectFit:'cover', objectPosition:'center top' }} sizes="100vw" />
      </div>
      <div className="hero-overlay" />
      <div className="hero-pattern" />
      <div style={{ position:'relative', zIndex:2, textAlign:'center', padding:'3rem 2rem', maxWidth:'820px', margin:'0 auto' }}>
        {/* Namam symbol */}
        <div style={{ marginBottom:'1.5rem', opacity:.85 }}>
          <svg width="52" height="70" viewBox="0 0 52 70" fill="none">
            <path d="M26 2C17 2 8 16 8 36C8 52 16 65 26 68C36 65 44 52 44 36C44 16 35 2 26 2Z"
              fill="none" stroke="#C9943A" strokeWidth="1.2" opacity="0.5"/>
            <path d="M19 7C12 18 9 30 10 44L14 62" fill="white" opacity="0.88"/>
            <path d="M33 7C40 18 43 30 42 44L38 62" fill="white" opacity="0.88"/>
            <path d="M23 12L23 65Q26 68 29 65L29 12Q26 7 23 12Z" fill="#8B1A1A" opacity="0.82"/>
            <rect x="12" y="64" width="28" height="4" rx="1" fill="#C9943A" opacity="0.65"/>
          </svg>
        </div>
        <span className="hero-eyebrow">{t('eyebrow')}</span>
        <h1 className="hero-title">{t('title')}</h1>
        <span className="hero-title-ne">{t('titleNe')}</span>
        <span className="hero-subtitle">{t('subtitle')}</span>
        <NamamDivider center light />
        <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
          <Link href="/poojas/book" className="btn-primary">🙏 {t('cta1')}</Link>
          <Link href="/events"      className="btn-outline">{t('cta2')}</Link>
        </div>
      </div>
    </section>
  );
}