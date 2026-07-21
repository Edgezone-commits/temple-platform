import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const EVENTS = [
  { icon:'🪷', badge:'Upcoming', en:'Vaikunta Ekadashi',    ne:'वैकुण्ठ एकादशी',  desc:'Most sacred Ekadashi — gates of Vaikunta open for devoted souls.' },
  { icon:'🎊', badge:'Annual',   en:'Brahmotsavam',          ne:'ब्रह्मोत्सवम्',    desc:'Nine-day grand festival with daily processions and special sevas.' },
  { icon:'🌙', badge:'Monthly',  en:'Purnima Celebrations',  ne:'पूर्णिमा उत्सव',  desc:'Full moon prayers, lamp-lighting, and prasad for all devotees.' },
];

export default function EventsPreview() {
  const t = useTranslations('eventsPreview');
  return (
    <section className="events-section">
      <div style={{ maxWidth:'1280px', margin:'0 auto', position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'3rem' }}>
          <div>
            <span className="section-eyebrow light">{t('eyebrow')}</span>
            <h2 className="section-title light">{t('title')}</h2>
            <span className="section-title-ne light">{t('titleNe')}</span>
          </div>
          <Link href="/events" style={{ fontFamily:'var(--ff-heading)', fontSize:'.7rem', letterSpacing:'.18em', textTransform:'uppercase', color:'var(--gold-500)', textDecoration:'none', borderBottom:'1px solid var(--gold-700)', paddingBottom:'2px', whiteSpace:'nowrap' }}>
            {t('viewAll')}
          </Link>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.4rem' }}>
          {EVENTS.map(({ icon, badge, en, ne, desc }) => (
            <Link key={en} href="/events" style={{ textDecoration:'none' }}>
              <div className="event-card">
                <div style={{ height:'145px', background:'linear-gradient(135deg,var(--maroon-800),var(--maroon-600))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.8rem' }}>{icon}</div>
                <span className="event-badge">{badge}</span>
                <div style={{ padding:'.6rem 1.2rem 1.3rem' }}>
                  <p style={{ fontFamily:'var(--ff-heading)', fontSize:'.88rem', fontWeight:700, color:'var(--gold-100)', marginBottom:'1px' }}>{en}</p>
                  <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.78rem', color:'rgba(232,201,122,.45)', display:'block', marginBottom:'.5rem' }}>{ne}</span>
                  <p style={{ fontSize:'.88rem', color:'rgba(249,237,203,.5)', lineHeight:1.5 }}>{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}