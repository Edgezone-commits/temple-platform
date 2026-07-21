"use client";
import { useState } from 'react';

const inp: React.CSSProperties = { fontFamily:'var(--ff-body)', fontSize:'.95rem', color:'var(--text-dark)', background:'var(--ivory-100)', border:'1px solid var(--ivory-300)', padding:'9px 12px', width:'100%', outline:'none', transition:'border-color .2s' };
const lbl: React.CSSProperties = { fontFamily:'var(--ff-heading)', fontSize:'.67rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--text-mid)', display:'block', marginBottom:'.3rem' };
const ne: React.CSSProperties  = { fontFamily:'var(--ff-deva)', fontSize:'.7rem', letterSpacing:0, textTransform:'none', marginLeft:'.3rem' };

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name:'', contact:'', subject:'', message:'' });
  const ch = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  if (sent) return (
    <div style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', padding:'3rem', textAlign:'center' }}>
      <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🙏</div>
      <h2 style={{ fontFamily:'var(--ff-display)', fontSize:'1.2rem', color:'var(--maroon-800)', marginBottom:'1rem' }}>Message Sent!</h2>
      <p style={{ fontSize:'1rem', color:'var(--text-mid)', lineHeight:1.7 }}>Thank you. We will respond within 24 hours.</p>
      <p style={{ fontFamily:'var(--ff-deva)', fontSize:'1rem', color:'var(--gold-700)', marginTop:'.5rem' }}>जय श्री लक्ष्मीनारायण!</p>
      <button onClick={() => setSent(false)} className="btn-primary" style={{ marginTop:'2rem' }}>Send Another</button>
    </div>
  );

  return (
    <form onSubmit={e => { e.preventDefault(); setSent(true); }} style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', padding:'2.5rem' }}>
      <div style={{ fontFamily:'var(--ff-display)', fontSize:'1.15rem', color:'var(--maroon-800)', marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'2px solid var(--gold-500)' }}>Send a Message</div>

      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl}>Your Name <span style={ne}>/ तपाईंको नाम</span></label>
        <input name="name" type="text" value={form.name} onChange={ch} placeholder="Full name" style={inp} required />
      </div>
      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl}>Email or Phone <span style={ne}>/ इमेल वा फोन</span></label>
        <input name="contact" type="text" value={form.contact} onChange={ch} placeholder="Email or phone" style={inp} required />
      </div>
      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl}>Subject <span style={ne}>/ विषय</span></label>
        <select name="subject" value={form.subject} onChange={ch} style={inp}>
          <option value="">-- Select --</option>
          {['General Enquiry','Pooja Booking','Donation','Event Information','Volunteer','Other'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl}>Message <span style={ne}>/ सन्देश</span></label>
        <textarea name="message" value={form.message} onChange={ch} placeholder="How can we help you?" style={{ ...inp, minHeight:'130px', resize:'vertical' }} required />
      </div>
      <button type="submit" className="btn-primary" style={{ width:'100%', textAlign:'center', marginTop:'.5rem' }}>Send Message →</button>
    </form>
  );
}