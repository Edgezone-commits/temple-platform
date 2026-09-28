import { useTranslations } from 'next-intl';

const card: React.CSSProperties = { background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', borderLeft:'3px solid var(--gold-500)', padding:'1.2rem', marginBottom:'1rem' };
const ttl: React.CSSProperties  = { fontFamily:'var(--ff-heading)', fontSize:'.72rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--maroon-800)', display:'block', marginBottom:'.5rem' };
const bdy: React.CSSProperties  = { fontSize:'.9rem', color:'var(--text-mid)', lineHeight:1.65, whiteSpace:'pre-line' };

const SECTIONS = ['location', 'timings', 'contact', 'bring'] as const;

/** Sidebar next to the booking form: location, timings, what to bring, payment. */
export default function BookingInfoPanel() {
  const t = useTranslations('bookingInfo');
  return (
    <aside>
      {SECTIONS.map(s => (
        <div key={s} style={card}>
          <span style={ttl}>{t(`${s}Title`)}</span>
          <p style={bdy}>{t(s)}</p>
        </div>
      ))}
      <div style={{ ...card, background:'var(--maroon-900)' }}>
        <span style={{ ...ttl, color:'var(--gold-500)' }}>{t('paymentTitle')}</span>
        <p style={{ ...bdy, color:'rgba(232,201,122,.55)' }}>{t('payment')}</p>
      </div>
    </aside>
  );
}
