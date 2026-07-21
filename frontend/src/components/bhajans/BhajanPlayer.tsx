"use client";
import { useState, useRef, useEffect } from 'react';

const TRACKS = [
  { id:1,  en:'Vishnu Sahasranamam',         ne:'विष्णु सहस्रनामम्',           artist:'M.S. Subbulakshmi',  dur:'52:30', cat:'Scripture'    },
  { id:2,  en:'Balaji Suprabhatam',           ne:'बालाजी सुप्रभातम्',           artist:'Traditional',         dur:'12:15', cat:'Suprabhatam'  },
  { id:3,  en:'Lakshmi Ashtakam',             ne:'लक्ष्मी अष्टकम्',             artist:'Temple Choir',        dur:'8:42',  cat:'Stotra'       },
  { id:4,  en:'Sri Rama Ashtottaram',         ne:'श्री राम अष्टोत्तरम्',        artist:'Traditional',         dur:'10:20', cat:'Archana'      },
  { id:5,  en:'Govinda Namalu',               ne:'गोविन्द नामलु',               artist:'Annamacharya',        dur:'6:55',  cat:'Bhajan'       },
  { id:6,  en:'Tiruppavai — Verses 1–10',     ne:'तिरुप्पावई — श्लोक १–१०',     artist:'Andal',               dur:'18:30', cat:'Ashtapadi'    },
  { id:7,  en:'Narayana Kavacham',            ne:'नारायण कवचम्',                artist:'Vedic Recitation',    dur:'15:40', cat:'Vedic'        },
  { id:8,  en:'Mangalashtak — Laxminarayan',  ne:'मंगलाष्टक — लक्ष्मीनारायण',  artist:'Temple Tradition',    dur:'7:25',  cat:'Mangalashtak' },
  { id:9,  en:'Sri Suktam',                   ne:'श्री सूक्तम्',                artist:'Vedic Choir',         dur:'9:10',  cat:'Vedic'        },
  { id:10, en:'Hanuman Chalisa',              ne:'हनुमान चालीसा',               artist:'Traditional',         dur:'8:00',  cat:'Bhajan'       },
];

const CATS = ['All','Suprabhatam','Stotra','Bhajan','Vedic','Ashtapadi','Mangalashtak'];

export default function BhajanPlayer() {
  const [playing, setPlaying]  = useState<typeof TRACKS[0]|null>(null);
  const [progress, setProgress]= useState(0);
  const [filter, setFilter]    = useState('All');
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const list = filter==='All' ? TRACKS : TRACKS.filter(t => t.cat===filter);

  function play(track: typeof TRACKS[0]) {
    if (playing?.id===track.id) { stop(); return; }
    setPlaying(track); setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setProgress(p => { if(p>=100){ clearInterval(timerRef.current!); return 100; } return p+0.25; }), 150);
  }

  function stop() {
    setPlaying(null); setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <div style={{ padding:'3.5rem 2rem', background:'var(--ivory-100)' }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto' }}>

        {/* Now playing bar */}
        {playing && (
          <div style={{ background:'var(--maroon-900)', border:'1px solid rgba(201,148,58,.25)', padding:'1.2rem 1.5rem', marginBottom:'2rem', display:'flex', alignItems:'center', gap:'1.2rem' }}>
            <span style={{ fontSize:'1.8rem', animation:'pulse 2s ease-in-out infinite' }}>🎵</span>
            <div style={{ flex:1 }}>
              <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.9rem', color:'var(--gold-100)', display:'block' }}>{playing.en}</span>
              <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.75rem', color:'rgba(232,201,122,.45)' }}>{playing.ne} · {playing.artist}</span>
            </div>
            <div style={{ width:'180px', height:'4px', background:'rgba(201,148,58,.2)', borderRadius:'2px', overflow:'hidden' }}>
              <div style={{ height:'100%', background:'var(--gold-500)', width:`${progress}%`, transition:'width .15s' }} />
            </div>
            <button onClick={stop} style={{ width:'36px', height:'36px', borderRadius:'50%', background:'var(--gold-500)', color:'var(--maroon-950)', border:'none', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>⏸</button>
          </div>
        )}

        {/* Category filter */}
        <div style={{ display:'flex', gap:'.6rem', flexWrap:'wrap', marginBottom:'2rem' }}>
          {CATS.map(c => <button key={c} onClick={() => setFilter(c)} className={`filter-btn ${filter===c?'active':''}`}>{c}</button>)}
        </div>

        {/* Track list */}
        <div style={{ display:'flex', flexDirection:'column', gap:'.6rem' }}>
          {list.map((track, i) => {
            const on = playing?.id===track.id;
            return (
              <div key={track.id} onClick={() => play(track)} style={{ background:on?'var(--ivory-200)':'var(--ivory-50)', border:'1px solid var(--ivory-300)', borderLeft:`3px solid ${on?'var(--gold-500)':'transparent'}`, padding:'1rem 1.4rem', display:'grid', gridTemplateColumns:'3rem 1fr auto', alignItems:'center', gap:'1.2rem', cursor:'pointer', transition:'background .15s,border-color .15s' }}
                onMouseEnter={e => { if(!on)(e.currentTarget as HTMLElement).style.background='var(--ivory-200)'; }}
                onMouseLeave={e => { if(!on)(e.currentTarget as HTMLElement).style.background='var(--ivory-50)'; }}>
                <div style={{ fontFamily:'var(--ff-display)', fontSize:'.9rem', color:on?'var(--maroon-600)':'var(--gold-700)', textAlign:'center' }}>
                  {on ? '♪' : String(i+1).padStart(2,'0')}
                </div>
                <div>
                  <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.85rem', fontWeight:700, color:'var(--maroon-800)', display:'block', marginBottom:'1px' }}>{track.en}</span>
                  <span style={{ fontFamily:'var(--ff-deva)', fontSize:'.75rem', color:'var(--text-light)' }}>{track.ne}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'1.2rem' }}>
                  <div style={{ textAlign:'right' }}>
                    <span style={{ fontFamily:'var(--ff-meta)', fontStyle:'italic', fontSize:'.78rem', color:'var(--text-light)', display:'block' }}>{track.artist}</span>
                    <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.65rem', color:'var(--text-light)', letterSpacing:'.08em' }}>{track.dur}</span>
                  </div>
                  <button style={{ width:'36px', height:'36px', borderRadius:'50%', background:on?'var(--gold-500)':'var(--maroon-800)', color:on?'var(--maroon-950)':'var(--gold-300)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }}>
                    {on?'⏸':'▶'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop:'2.5rem', padding:'1.2rem 1.5rem', background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', borderLeft:'3px solid var(--gold-500)', fontSize:'.88rem', color:'var(--text-mid)', lineHeight:1.6 }}>
          🎵 <strong>To add real audio:</strong> Upload MP3 files to the <code>bhajan-audio</code> bucket in Supabase Storage, add a record to the <code>bhajans</code> table with the file URL, and connect the audio URL to an HTML &lt;audio&gt; element here.
        </div>
      </div>
    </div>
  );
}