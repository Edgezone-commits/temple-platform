"use client";
/**
 * Contact form.
 * There is no backend endpoint for messages yet, so submitting opens the
 * visitor's email app with the message pre-filled (previously it pretended to
 * send and silently discarded the message).
 * TODO: add POST /api/v1/contact + a messages table if an inbox is wanted.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

const TEMPLE_EMAIL = 'info@laxminarayanmandir.org';

const inp: React.CSSProperties = { fontFamily:'var(--ff-body)', fontSize:'.95rem', color:'var(--text-dark)', background:'var(--ivory-100)', border:'1px solid var(--ivory-300)', padding:'9px 12px', width:'100%', outline:'none', transition:'border-color .2s' };
const lbl: React.CSSProperties = { fontFamily:'var(--ff-heading)', fontSize:'.67rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--text-mid)', display:'block', marginBottom:'.3rem' };

export default function ContactForm() {
  const t = useTranslations('contact.form');
  const subjects = t.raw('subjects') as string[];
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name:'', contact:'', subject:'', message:'' });
  const ch = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const subject = form.subject || subjects[0];
    const body = `${form.message}\n\n— ${form.name} (${form.contact})`;
    window.location.href = `mailto:${TEMPLE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  if (sent) return (
    <div style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', padding:'3rem', textAlign:'center' }}>
      <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🙏</div>
      <h2 style={{ fontFamily:'var(--ff-display)', fontSize:'1.2rem', color:'var(--maroon-800)', marginBottom:'1rem' }}>{t('sentTitle')}</h2>
      <p style={{ fontSize:'1rem', color:'var(--text-mid)', lineHeight:1.7 }}>{t('sentBody')}</p>
      <p style={{ fontFamily:'var(--ff-deva)', fontSize:'1rem', color:'var(--gold-700)', marginTop:'.5rem' }}>जय श्री लक्ष्मीनारायण!</p>
      <button onClick={() => setSent(false)} className="btn-primary" style={{ marginTop:'2rem' }}>{t('again')}</button>
    </div>
  );

  return (
    <form onSubmit={submit} style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', padding:'2.5rem' }}>
      <div style={{ fontFamily:'var(--ff-display)', fontSize:'1.15rem', color:'var(--maroon-800)', marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'2px solid var(--gold-500)' }}>{t('title')}</div>

      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl} htmlFor="c-name">{t('name')}</label>
        <input id="c-name" name="name" type="text" value={form.name} onChange={ch} placeholder={t('namePh')} style={inp} required maxLength={200} />
      </div>
      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl} htmlFor="c-contact">{t('contact')}</label>
        <input id="c-contact" name="contact" type="text" value={form.contact} onChange={ch} placeholder={t('contactPh')} style={inp} required maxLength={200} />
      </div>
      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl} htmlFor="c-subject">{t('subject')}</label>
        <select id="c-subject" name="subject" value={form.subject} onChange={ch} style={inp}>
          <option value="">{t('select')}</option>
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl} htmlFor="c-message">{t('message')}</label>
        <textarea id="c-message" name="message" value={form.message} onChange={ch} placeholder={t('messagePh')} style={{ ...inp, minHeight:'130px', resize:'vertical' }} required maxLength={4000} />
      </div>
      <button type="submit" className="btn-primary" style={{ width:'100%', textAlign:'center', marginTop:'.5rem' }}>{t('submit')}</button>
    </form>
  );
}
