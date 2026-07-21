"use client";
import { useState } from 'react';

type Filter = 'All'|'Festivals'|'Ekadashi'|'Purnima'|'Special Poojas';
const FILTERS: Filter[] = ['All','Festivals','Ekadashi','Purnima','Special Poojas'];

const EVENTS = [
  { icon:'🪷', badge:'Dec 2025',    type:'Ekadashi',       en:'Vaikunta Ekadashi',    ne:'वैकुण्ठ एकादशी',   desc:'Most sacred Ekadashi. Special abhishekam and night-long prayers. Gates of Vaikunta believed to open.' },
  { icon:'🎊', badge:'Jan 2026',    type:'Festivals',      en:'Brahmotsavam',          ne:'ब्रह्मोत्सवम्',     desc:'Nine-day annual festival with daily processions, special sevas, and prasad distribution.' },
  { icon:'🌙', badge:'Monthly',     type:'Purnima',        en:'Purnima Celebrations',  ne:'पूर्णिमा उत्सव',    desc:'Full moon evening prayers, lamp-lighting ceremony, and prasad for all devotees.' },
  { icon:'🦚', badge:'Aug 2025',    type:'Festivals',      en:'Janmashtami',           ne:'जन्माष्टमी',         desc:'Birth of Lord Krishna — midnight prayers, bhajans, and abhishekam.' },
  { icon:'🌺', badge:'Mar 2026',    type:'Festivals',      en:'Panguni Uttiram',       ne:'पांगुनी उत्तिरम्',  desc:'Divine marriage of Vishnu and Lakshmi. Grand procession and flower decorations.' },
  { icon:'🙏', badge:'Fortnightly', type:'Ekadashi',       en:'Ekadashi Observance',   ne:'एकादशी व्रत',        desc:'Bi-monthly fasting day with Vishnu puja, stotra recitation, and community gathering.' },
  { icon:'🔥', badge:'Aug 2025',    type:'Special Poojas', en:'Sudarshana Homam',      ne:'सुदर्शन होमम्',     desc:'Fire ritual to Lord Sudarshana for protection and removal of all obstacles.' },
  { icon:'🌸', badge:'Nov 2025',    type:'Festivals',      en:'Karthigai Deepam',      ne:'कार्तिगई दीपम्',    desc:'Festival of lights — thousands of lamps lit in the temple compound at twilight.' },
  { icon:'⭐', badge:'Oct 2025',    type:'Special Poojas', en:'Navaratri Sevas',       ne:'नवरात्री सेवाहरू',  desc:'Nine nights of special sevas. Cultural programmes each evening.' },
];

export default function EventsGrid() {
  const [active, setActive] = useState<Filter>('All');
  const filtered = active === 'All' ? EVENTS : EVENTS.filter(e => e.type === active);

  return (
    <div style={{ padding:'3.5rem 2rem', background:'var(--ivory-100)' }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
        {/* Filter bar */}
        <div style={{ display:'flex', gap:'.7rem', flexWrap:'wrap', marginBottom:'2.5rem' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setActive(f)}
              className={`filter-btn ${active===f?'active':''}`}>{f}</button>
          ))}
        </div>
        {/* Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.4rem' }}>
          {filtered.map(({ icon, badge, en, ne, desc }) => (
            <div key={en} style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', borderTop:'3px solid var(--gold-500)', overflow:'hidden', transition:'box-shadow .2s,transform .2s', cursor:'pointer' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow='0 6px 24px rgba(107,26,26,.12)'; el.style.transform='translateY(-3px)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow='none'; el.style.transform='none'; }}>
              <div style={{ height:'150px', background:'linear-gradient(135deg,var(--maroon-800),var(--maroon-600))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem' }}>{icon}</div>
              <div style={{ padding:'1.1rem 1.3rem 1.4rem' }}>
                <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.62rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--gold-700)', display:'block', marginBottom:'.3rem' }}>{badge}</span>
                <p style={{ fontFamily:'var(--ff-heading)', fontSize:'.92rem', fontWeight:700, color:'var(--maroon-800)', marginBottom:'2px' }}>{en}</p>
                <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.8rem', color:'var(--text-light)', display:'block', marginBottom:'.5rem' }}>{ne}</span>
                <p style={{ fontSize:'.9rem', color:'var(--text-mid)', lineHeight:1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <p style={{ textAlign:'center', color:'var(--text-light)', fontFamily:'var(--ff-meta)', fontStyle:'italic', padding:'3rem' }}>
            No events in this category yet. Check back soon. 🙏
          </p>
        )}
      </div>
    </div>
  );
}