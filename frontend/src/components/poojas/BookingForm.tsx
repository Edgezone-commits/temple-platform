"use client";
import { useState } from 'react';

const POOJAS=['Sahasranama Archana — NPR 500','Abhishekam — NPR 1,100','Sudarshana Homam — NPR 3,100','Sri Sooktam Puja — NPR 1,500','Nakshatra Shanti — NPR 2,100','Satyanarayan Puja — NPR 2,500','Lakshmi Puja — NPR 1,800','Vishnu Sahasranama — NPR 800','Ashtottara Archana — NPR 100','Pushpanjali — NPR 51'];
const NAKSHATRAS=['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
const RASHIS=['Mesha (Aries)','Vrishabha (Taurus)','Mithuna (Gemini)','Karka (Cancer)','Simha (Leo)','Kanya (Virgo)','Tula (Libra)','Vrishchika (Scorpio)','Dhanus (Sagittarius)','Makara (Capricorn)','Kumbha (Aquarius)','Meena (Pisces)'];
const TIMES=['5:00 AM (Suprabhatam)','6:00 AM','8:00 AM','10:00 AM','4:00 PM (Evening)','6:00 PM','7:00 PM'];

const inp: React.CSSProperties = { fontFamily:'var(--ff-body)', fontSize:'.95rem', color:'var(--text-dark)', background:'var(--ivory-100)', border:'1px solid var(--ivory-300)', padding:'9px 12px', width:'100%', outline:'none', transition:'border-color .2s' };
const lbl: React.CSSProperties = { fontFamily:'var(--ff-heading)', fontSize:'.67rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--text-mid)', display:'block', marginBottom:'.3rem' };
const ne: React.CSSProperties  = { fontFamily:'var(--ff-deva)', fontSize:'.7rem', letterSpacing:0, textTransform:'none', color:'var(--text-light)', marginLeft:'.3rem' };

export default function BookingForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ pooja:POOJAS[0], name:'', phone:'', email:'', date:'', time:TIMES[0], gothram:'', nakshatra:'', rashi:'', notes:'' });

  const ch = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000'}/api/v1/bookings`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ devotee_name:form.name, devotee_phone:form.phone, devotee_email:form.email||undefined, booking_date:form.date, booking_time:form.time, gothram:form.gothram||undefined, nakshatra:form.nakshatra||undefined, rashi:form.rashi||undefined, notes:`Pooja: ${form.pooja}. ${form.notes}` })
      });
    } catch { /* offline dev fallback */ }
    setSent(true); setLoading(false);
  }

  if (sent) return (
    <div style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', padding:'3rem', textAlign:'center' }}>
      <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🙏</div>
      <h2 style={{ fontFamily:'var(--ff-display)', fontSize:'1.3rem', color:'var(--maroon-800)', marginBottom:'1rem' }}>Booking Received!</h2>
      <p style={{ fontSize:'1rem', color:'var(--text-mid)', lineHeight:1.7, marginBottom:'.5rem' }}>Our pandit will contact you within 24 hours to confirm.</p>
      <p style={{ fontFamily:'var(--ff-deva)', fontSize:'1rem', color:'var(--gold-700)' }}>जय श्री लक्ष्मीनारायण! 🌸</p>
      <button onClick={() => setSent(false)} className="btn-primary" style={{ marginTop:'2rem' }}>Book Another Pooja</button>
    </div>
  );

  return (
    <form onSubmit={submit} style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', padding:'2.5rem' }}>
      <div style={{ fontFamily:'var(--ff-display)', fontSize:'1.15rem', color:'var(--maroon-800)', marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'2px solid var(--gold-500)' }}>
        Devotee &amp; Pooja Details
      </div>

      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl}>Select Pooja <span style={ne}>/ पूजा छान्नुहोस्</span></label>
        <select name="pooja" value={form.pooja} onChange={ch} style={inp} required>
          {POOJAS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div><label style={lbl}>Name <span style={ne}>/ नाम</span></label>
          <input name="name" type="text" value={form.name} onChange={ch} placeholder="Full name" style={inp} required /></div>
        <div><label style={lbl}>Phone <span style={ne}>/ फोन</span></label>
          <input name="phone" type="tel" value={form.phone} onChange={ch} placeholder="+977-XXXXXXXXXX" style={inp} required /></div>
      </div>

      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl}>Email (optional) <span style={ne}>/ इमेल</span></label>
        <input name="email" type="email" value={form.email} onChange={ch} placeholder="your@email.com" style={inp} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div><label style={lbl}>Date <span style={ne}>/ मिति</span></label>
          <input name="date" type="date" value={form.date} onChange={ch} style={inp} required /></div>
        <div><label style={lbl}>Time <span style={ne}>/ समय</span></label>
          <select name="time" value={form.time} onChange={ch} style={inp}>{TIMES.map(t => <option key={t}>{t}</option>)}</select></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div><label style={lbl}>Gothram <span style={ne}>/ गोत्र</span></label>
          <input name="gothram" type="text" value={form.gothram} onChange={ch} placeholder="e.g. Bharadwaja" style={inp} /></div>
        <div><label style={lbl}>Nakshatra <span style={ne}>/ नक्षत्र</span></label>
          <select name="nakshatra" value={form.nakshatra} onChange={ch} style={inp}>
            <option value="">-- Select --</option>
            {NAKSHATRAS.map(n => <option key={n}>{n}</option>)}
          </select></div>
      </div>

      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl}>Rashi <span style={ne}>/ राशि</span></label>
        <select name="rashi" value={form.rashi} onChange={ch} style={inp}>
          <option value="">-- Select Rashi --</option>
          {RASHIS.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl}>Special Requests <span style={ne}>/ विशेष अनुरोध</span></label>
        <textarea name="notes" value={form.notes} onChange={ch} placeholder="Any notes for the priest..." style={{ ...inp, minHeight:'90px', resize:'vertical' }} />
      </div>

      <button type="submit" className="btn-primary" style={{ width:'100%', textAlign:'center', marginTop:'.5rem', opacity:loading?.7:1 }} disabled={loading}>
        {loading ? 'Submitting...' : '🙏 Submit Booking'}
      </button>
    </form>
  );
}