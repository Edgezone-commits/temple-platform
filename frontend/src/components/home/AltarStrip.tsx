import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function AltarStrip() {
  const t = useTranslations('altar');
  return (
    <div style={{ position:'relative', height:'320px', overflow:'hidden' }}>
      <Image src="/images/altar.jpg" alt="Temple Sanctum" fill
        style={{ objectFit:'cover', objectPosition:'center 60%' }} sizes="100vw" />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(14,3,3,.25),rgba(14,3,3,.72))' }} />
      <div style={{ position:'absolute', bottom:'2rem', left:'50%', transform:'translateX(-50%)', textAlign:'center', width:'100%' }}>
        <p style={{ fontFamily:'var(--ff-display)', fontSize:'1.2rem', color:'var(--gold-100)', letterSpacing:'.08em' }}>{t('title')}</p>
        <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.9rem', color:'var(--gold-300)' }}>{t('subtitle')}</span>
      </div>
    </div>
  );
}