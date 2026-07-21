'use client';
import { Link } from '@/i18n/navigation';

const ARCHANAS = [
  { en:'Ashtottara Archana',  ne:'अष्टोत्तर अर्चना', price:'NPR 100', deity:'Laxminarayan' },
  { en:'Sahasranama Archana', ne:'सहस्रनाम अर्चना',  price:'NPR 300', deity:'Vishnu'       },
  { en:'Pushpanjali',         ne:'पुष्पाञ्जलि',       price:'NPR 51',  deity:'Lakshmi'      },
  { en:'Tulasi Archana',      ne:'तुलसी अर्चना',      price:'NPR 51',  deity:'Laxminarayan' },
];

export default function ArchanaSection() {
  return (
    <div style={{ padding:'3.5rem 2rem', background:'var(--maroon-950)', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, opacity:.04, backgroundImage:'repeating-linear-gradient(0deg,var(--gold-500) 0,var(--gold-500) 1px,transparent 0,transparent 38px),repeating-linear-gradient(90deg,var(--gold-500) 0,var(--gold-500) 1px,transparent 0,transparent 38px)', pointerEvents:'none' }} />
      <div style={{ maxWidth:'1280px', margin:'0 auto', position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <span className="section-eyebrow light">Flower Offering</span>
          <h2 className="section-title light">Archana Services</h2>
          <span className="section-title-ne light">अर्चना सेवाहरू</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1.2rem' }}>
          {ARCHANAS.map(({ en, ne, price, deity }) => (
            <div key={en} style={{ background:'rgba(30,6,6,.65)', border:'1px solid rgba(201,148,58,.2)', padding:'1.5rem', textAlign:'center', cursor:'pointer', transition:'border-color .2s,transform .2s' }}
              onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor='var(--gold-500)'; el.style.transform='translateY(-3px)'; }}
              onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor='rgba(201,148,58,.2)'; el.style.transform='none'; }}>
              <span style={{ fontSize:'2rem', display:'block', marginBottom:'.8rem' }}>🌸</span>
              <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.85rem', fontWeight:700, color:'var(--gold-100)', display:'block', marginBottom:'3px' }}>{en}</span>
              <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.78rem', color:'rgba(232,201,122,.45)', display:'block', marginBottom:'.4rem' }}>{ne}</span>
              <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.6rem', letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(232,201,122,.35)', display:'block', marginBottom:'.8rem' }}>Deity: {deity}</span>
              <span style={{ fontFamily:'var(--ff-display)', fontSize:'1rem', color:'var(--gold-500)', display:'block', marginBottom:'1rem' }}>{price}</span>
              <Link href="/poojas/book" style={{ fontFamily:'var(--ff-heading)', fontSize:'.65rem', fontWeight:700, letterSpacing:'.15em', textTransform:'uppercase', background:'var(--gold-500)', color:'var(--maroon-950)', padding:'7px 16px', textDecoration:'none', display:'inline-block' }}>Offer Now</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}