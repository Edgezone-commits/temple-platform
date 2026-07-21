'use client';
import { Link } from '@/i18n/navigation';

const POOJAS = [
  { icon:'🪔', en:'Sahasranama Archana', ne:'सहस्रनाम अर्चना',  price:'NPR 500',   dur:'45 min', hot:true,  desc:'1000 names of Lord Vishnu offered with flowers each morning.' },
  { icon:'💧', en:'Abhishekam',           ne:'अभिषेकम्',          price:'NPR 1,100', dur:'60 min', hot:false, desc:'Sacred bathing of the deity with milk, honey, curd, and sandalwood.' },
  { icon:'🔥', en:'Sudarshana Homam',     ne:'सुदर्शन होमम्',     price:'NPR 3,100', dur:'2 hrs',  hot:false, desc:'Fire ritual for protection and removal of all obstacles.' },
  { icon:'🌺', en:'Sri Sooktam Puja',     ne:'श्री सूक्तम् पूजा', price:'NPR 1,500', dur:'75 min', hot:false, desc:'Vedic hymns to Goddess Lakshmi for prosperity and harmony.' },
  { icon:'⭐', en:'Nakshatra Shanti',      ne:'नक्षत्र शान्ति',    price:'NPR 2,100', dur:'90 min', hot:true,  desc:'Birth star puja for peace, health, and prosperity.' },
  { icon:'📿', en:'Satyanarayan Puja',     ne:'सत्यनारायण पूजा',  price:'NPR 2,500', dur:'2 hrs',  hot:true,  desc:'Auspicious puja for family wellbeing and fulfillment of vows.' },
  { icon:'🌸', en:'Lakshmi Puja',          ne:'लक्ष्मी पूजा',       price:'NPR 1,800', dur:'60 min', hot:false, desc:'Dedicated worship of Goddess Lakshmi for abundance and fortune.' },
  { icon:'🕉️', en:'Vishnu Sahasranama',   ne:'विष्णु सहस्रनाम',   price:'NPR 800',   dur:'60 min', hot:false, desc:'Recitation of 1000 names of Lord Vishnu for peace and liberation.' },
  { icon:'🪷', en:'Thiruvanandal Seva',    ne:'तिरुवानन्दल सेवा',   price:'NPR 1,200', dur:'45 min', hot:false, desc:'Special seva unique to the Sri Vaishnava Totadri tradition.' },
];

export default function PoojaGrid() {
  return (
    <div style={{ padding:'3.5rem 2rem', background:'var(--ivory-100)' }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
        {/* Info note */}
        <div style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', borderLeft:'4px solid var(--gold-500)', padding:'1rem 1.5rem', marginBottom:'2.5rem', display:'flex', gap:'1rem', alignItems:'flex-start' }}>
          <span style={{ fontSize:'1.4rem' }}>🙏</span>
          <div>
            <p style={{ fontFamily:'var(--ff-heading)', fontSize:'.78rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--maroon-800)', marginBottom:'.3rem' }}>Booking Information</p>
            <p style={{ fontSize:'.92rem', color:'var(--text-mid)', lineHeight:1.6 }}>All poojas follow the Pancharatra Agama shastra. Please book at least 24 hours in advance. Walk-ins welcome subject to availability.</p>
          </div>
        </div>
        {/* Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.4rem' }}>
          {POOJAS.map(({ icon, en, ne, price, dur, hot, desc }) => (
            <div key={en} style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', overflow:'hidden', transition:'transform .2s,box-shadow .2s', cursor:'pointer', position:'relative' }}
              onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.transform='translateY(-3px)'; el.style.boxShadow='0 8px 28px rgba(107,26,26,.1)'; }}
              onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.transform='none'; el.style.boxShadow='none'; }}>
              <div style={{ height:'130px', background:'linear-gradient(135deg,var(--maroon-900),var(--maroon-700))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', position:'relative' }}>
                {icon}
                {hot && <span style={{ position:'absolute', top:'.8rem', right:'.8rem', background:'var(--gold-500)', color:'var(--maroon-950)', fontFamily:'var(--ff-heading)', fontSize:'.6rem', fontWeight:700, letterSpacing:'.1em', padding:'3px 8px' }}>Popular</span>}
              </div>
              <div style={{ padding:'1.2rem' }}>
                <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.9rem', fontWeight:700, color:'var(--maroon-800)', display:'block', marginBottom:'2px' }}>{en}</span>
                <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.82rem', color:'var(--text-light)', display:'block', marginBottom:'.6rem' }}>{ne}</span>
                <p style={{ fontSize:'.9rem', color:'var(--text-mid)', lineHeight:1.5, marginBottom:'1rem' }}>{desc}</p>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid var(--ivory-300)', paddingTop:'.8rem' }}>
                  <div>
                    <span style={{ fontFamily:'var(--ff-display)', fontSize:'1rem', color:'var(--maroon-600)', display:'block', lineHeight:1 }}>{price}</span>
                    <span style={{ fontFamily:'var(--ff-meta)', fontStyle:'italic', fontSize:'.8rem', color:'var(--text-light)' }}>⏱ {dur}</span>
                  </div>
                  <Link href="/poojas/book" style={{ fontFamily:'var(--ff-heading)', fontSize:'.65rem', fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', background:'var(--maroon-800)', color:'var(--gold-300)', padding:'7px 14px', textDecoration:'none', display:'inline-block', transition:'all .2s' }}>Book →</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}