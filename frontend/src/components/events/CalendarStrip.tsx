'use client';
const DATES = [
  { date:'Jul 21', tithi:'Purnima',    en:'Full Moon Puja',    ne:'पूर्णिमा पूजा'   },
  { date:'Aug 16', tithi:'Janmashtami',en:'Janmashtami',       ne:'जन्माष्टमी'       },
  { date:'Sep 5',  tithi:'Ekadashi',   en:'Vaikunta Ekadashi', ne:'वैकुण्ठ एकादशी'  },
  { date:'Oct 2',  tithi:'Navaratri',  en:'Brahmotsavam',      ne:'ब्रह्मोत्सवम्'    },
  { date:'Nov 15', tithi:'Karthigai',  en:'Karthigai Deepam',  ne:'कार्तिगई दीपम्'  },
];

export default function CalendarStrip() {
  return (
    <div style={{ background:'var(--maroon-900)', borderBottom:'2px solid var(--gold-700)', overflowX:'auto' }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'0 2rem', display:'flex' }}>
        {DATES.map(({ date, tithi, en, ne }) => (
          <div key={date} style={{ flex:'1 0 200px', padding:'1.1rem 1.5rem',
            borderRight:'1px solid rgba(201,148,58,.18)', cursor:'pointer', transition:'background .2s' }}
            onMouseEnter={e => (e.currentTarget.style.background='rgba(201,148,58,.08)')}
            onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
            <span style={{ fontFamily:'var(--ff-display)', fontSize:'.95rem', color:'var(--gold-500)', display:'block', marginBottom:'2px' }}>{date}</span>
            <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.6rem', letterSpacing:'.15em', textTransform:'uppercase', color:'rgba(232,201,122,.4)', display:'block', marginBottom:'3px' }}>{tithi}</span>
            <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.8rem', color:'var(--gold-100)', display:'block' }}>{en}</span>
            <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.72rem', color:'rgba(232,201,122,.4)' }}>{ne}</span>
          </div>
        ))}
      </div>
    </div>
  );
}