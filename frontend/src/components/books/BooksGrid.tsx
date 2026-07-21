"use client";
import { useState } from 'react';

type Cat = 'All'|'Scripture'|'Stotra'|'Philosophy'|'Biography';
const CATS: Cat[] = ['All','Scripture','Stotra','Philosophy','Biography'];

const BOOKS = [
  { icon:'📖', en:'Vishnu Sahasranama',             ne:'विष्णु सहस्रनाम',        author:'Vyasa Maharshi',      lang:'Sanskrit', cat:'Scripture'  },
  { icon:'🕉️', en:'Sri Ranganatha Stotram',         ne:'श्री रंगनाथ स्तोत्रम्',  author:'Adi Shankaracharya',  lang:'Sanskrit', cat:'Stotra'     },
  { icon:'🌺', en:'Laxminarayan Mahatmya',           ne:'लक्ष्मीनारायण माहात्म्य', author:'Temple Publication',  lang:'Nepali',   cat:'Scripture'  },
  { icon:'📿', en:'Tiruppavai',                      ne:'तिरुप्पावई',              author:'Andal',               lang:'Sanskrit', cat:'Stotra'     },
  { icon:'✨', en:'Introduction to Sri Vaishnavism', ne:'श्री वैष्णवधर्म परिचय',  author:'Temple Publication',  lang:'English',  cat:'Philosophy' },
  { icon:'🌸', en:'Lakshmi Ashtakam',                ne:'लक्ष्मी अष्टकम्',         author:'Traditional',         lang:'Sanskrit', cat:'Stotra'     },
  { icon:'🕊️', en:'Narayana Suktam',                 ne:'नारायण सूक्तम्',           author:'Yajurveda',           lang:'Sanskrit', cat:'Scripture'  },
  { icon:'🦅', en:'Garuda Puranam (excerpts)',       ne:'गरुड पुराण (अंश)',         author:'Vyasa',               lang:'Nepali',   cat:'Scripture'  },
  { icon:'🧘', en:'Ramanuja Darshan',                ne:'रामानुज दर्शन',            author:'Sri Ramanuja',        lang:'English',  cat:'Philosophy' },
  { icon:'🌻', en:'Andal Biography',                 ne:'आण्डाल जीवनी',            author:'Temple Publication',  lang:'English',  cat:'Biography'  },
  { icon:'📜', en:'Totadri Nambi Charitra',          ne:'तोताद्री नम्बि चरित्र',   author:'Temple Publication',  lang:'Nepali',   cat:'Biography'  },
  { icon:'💎', en:'Divya Prabandham (selections)',   ne:'दिव्य प्रबन्धम् (चयन)',   author:'Alvars',              lang:'Sanskrit', cat:'Scripture'  },
];

const LC: Record<string,string> = { Sanskrit:'var(--maroon-800)', Nepali:'#1a4a1a', English:'#1a1a4a' };

export default function BooksGrid() {
  const [cat, setCat] = useState<Cat>('All');
  const list = cat==='All' ? BOOKS : BOOKS.filter(b => b.cat===cat);
  return (
    <div style={{ padding:'3.5rem 2rem', background:'var(--ivory-100)' }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
        <div style={{ display:'flex', gap:'.7rem', flexWrap:'wrap', marginBottom:'2.5rem' }}>
          {CATS.map(c => <button key={c} onClick={() => setCat(c)} className={`filter-btn ${cat===c?'active':''}`}>{c}</button>)}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1.4rem' }}>
          {list.map(({ icon, en, ne, author, lang }) => (
            <div key={en} style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', overflow:'hidden', transition:'transform .2s,box-shadow .2s', cursor:'pointer' }}
              onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.transform='translateY(-3px)'; el.style.boxShadow='0 8px 24px rgba(107,26,26,.1)'; }}
              onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.transform='none'; el.style.boxShadow='none'; }}>
              <div style={{ height:'190px', background:'linear-gradient(135deg,var(--maroon-800),var(--maroon-600))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', position:'relative' }}>
                {icon}
                <span style={{ position:'absolute', top:'.7rem', right:'.7rem', background:LC[lang]||'var(--maroon-800)', color:'var(--gold-300)', fontFamily:'var(--ff-heading)', fontSize:'.58rem', letterSpacing:'.1em', padding:'2px 7px' }}>{lang}</span>
              </div>
              <div style={{ padding:'1rem' }}>
                <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.82rem', fontWeight:700, color:'var(--maroon-800)', display:'block', lineHeight:1.3, marginBottom:'2px' }}>{en}</span>
                <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.75rem', color:'var(--text-light)', display:'block', marginBottom:'.4rem' }}>{ne}</span>
                <span style={{ fontFamily:'var(--ff-meta)', fontStyle:'italic', fontSize:'.8rem', color:'var(--text-light)' }}>{author}</span>
              </div>
              <div style={{ padding:'.8rem 1rem', borderTop:'1px solid var(--ivory-300)', display:'flex', gap:'.5rem' }}>
                <button style={{ flex:1, fontFamily:'var(--ff-heading)', fontSize:'.65rem', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', padding:'6px', border:'none', cursor:'pointer', background:'var(--gold-500)', color:'var(--maroon-950)' }}
                  onClick={() => alert('Upload your PDFs to Supabase Storage bucket "book-pdfs" and add the URL to the database!')}>📄 Read</button>
                <button style={{ flex:1, fontFamily:'var(--ff-heading)', fontSize:'.65rem', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', padding:'6px', border:'1px solid var(--ivory-300)', cursor:'pointer', background:'var(--ivory-200)', color:'var(--text-mid)' }}>⬇ Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}