"use client";
/**
 * Pooja booking form → POST {API}/api/v1/bookings (FastAPI → pooja_bookings).
 *
 * Phase 0 fixes: real error handling (it used to show success even on failure),
 * valid HH:MM booking_time values, and bilingual labels.
 * Nakshatra/rashi are always submitted in canonical English so the admin inbox
 * is consistent regardless of the devotee's locale.
 * Phase 2: the pooja list comes from the API (passed in by the page) and the
 * booking is sent with a real pooja_id.
 */
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import en from '@/messages/en.json';
import { formatterFor } from '@/lib/format';
import { getBrowserClient } from '@/lib/supabase/client';
import { supabaseConfigured } from '@/lib/supabase/env';
import { pick } from '@/lib/localize';
import type { Pooja } from '@/lib/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const inp: React.CSSProperties = { fontFamily:'var(--ff-body)', fontSize:'.95rem', color:'var(--text-dark)', background:'var(--ivory-100)', border:'1px solid var(--ivory-300)', padding:'9px 12px', width:'100%', outline:'none', transition:'border-color .2s' };
const lbl: React.CSSProperties = { fontFamily:'var(--ff-heading)', fontSize:'.67rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--text-mid)', display:'block', marginBottom:'.3rem' };

const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  /** Bookable poojas; null when the API couldn't be reached. */
  poojas: Pooja[] | null;
  /** Preselected pooja (from /poojas/book?pooja=<id>). */
  initialPoojaId?: string;
}

export default function BookingForm({ poojas, initialPoojaId }: Props) {
  const t = useTranslations('booking');
  const tp = useTranslations('poojaGrid');
  const locale = useLocale();
  const format = formatterFor(locale);
  const nakshatras = t.raw('nakshatras') as string[];
  const rashis     = t.raw('rashis') as string[];
  const times      = t.raw('times') as Record<string, string>;

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const validInitial = poojas?.some(p => p.id === initialPoojaId) ? initialPoojaId! : '';
  const [form, setForm] = useState({ pooja:validInitial, name:'', phone:'', email:'', date:'', time:'05:00', gothram:'', nakshatra:'', rashi:'', notes:'' });

  const ch = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      // Logged-in devotees send their token so the booking is linked to their account.
      const headers: Record<string, string> = { 'Content-Type':'application/json' };
      if (supabaseConfigured) {
        const { data } = await getBrowserClient().auth.getSession();
        if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
      }
      const res = await fetch(`${API}/api/v1/bookings/`, {
        method:'POST', headers,
        body: JSON.stringify({
          pooja_id: form.pooja,
          devotee_name: form.name,
          devotee_phone: form.phone,
          devotee_email: form.email || undefined,
          booking_date: form.date,
          booking_time: form.time,
          gothram: form.gothram || undefined,
          nakshatra: form.nakshatra ? en.booking.nakshatras[Number(form.nakshatra)] : undefined,
          rashi: form.rashi ? en.booking.rashis[Number(form.rashi)] : undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSent(true);
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }

  if (!poojas || poojas.length === 0) return (
    <div role="status" style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', borderLeft:'3px solid var(--gold-500)', padding:'2.5rem', textAlign:'center' }}>
      <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }} aria-hidden="true">🪔</div>
      <h2 style={{ fontFamily:'var(--ff-display)', fontSize:'1.15rem', color:'var(--maroon-800)', marginBottom:'.8rem' }}>{t('unavailableTitle')}</h2>
      <p style={{ fontSize:'1rem', color:'var(--text-mid)', lineHeight:1.7 }}>{t('unavailableBody')}</p>
    </div>
  );

  if (sent) return (
    <div style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', padding:'3rem', textAlign:'center' }}>
      <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🙏</div>
      <h2 style={{ fontFamily:'var(--ff-display)', fontSize:'1.3rem', color:'var(--maroon-800)', marginBottom:'1rem' }}>{t('successTitle')}</h2>
      <p style={{ fontSize:'1rem', color:'var(--text-mid)', lineHeight:1.7, marginBottom:'.5rem' }}>{t('successBody')}</p>
      <p style={{ fontFamily:'var(--ff-deva)', fontSize:'1rem', color:'var(--gold-700)' }}>जय श्री लक्ष्मीनारायण! 🌸</p>
      <button onClick={() => { setSent(false); setForm(f => ({ ...f, notes:'' })); }} className="btn-primary" style={{ marginTop:'2rem' }}>{t('again')}</button>
    </div>
  );

  return (
    <form onSubmit={submit} style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', padding:'2.5rem' }}>
      <div style={{ fontFamily:'var(--ff-display)', fontSize:'1.15rem', color:'var(--maroon-800)', marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'2px solid var(--gold-500)' }}>
        {t('formTitle')}
      </div>

      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl} htmlFor="b-pooja">{t('pooja')}</label>
        <select id="b-pooja" name="pooja" value={form.pooja} onChange={ch} style={inp} required>
          <option value="" disabled>{t('poojaPlaceholder')}</option>
          {poojas.map(p => (
            <option key={p.id} value={p.id}>
              {`${pick(p, 'name', locale)}${p.price != null ? ` — ${tp('currency')} ${format.number(p.price)}` : ''}`}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div><label style={lbl} htmlFor="b-name">{t('name')}</label>
          <input id="b-name" name="name" type="text" value={form.name} onChange={ch} placeholder={t('namePh')} style={inp} required minLength={2} maxLength={200} /></div>
        <div><label style={lbl} htmlFor="b-phone">{t('phone')}</label>
          <input id="b-phone" name="phone" type="tel" value={form.phone} onChange={ch} placeholder={t('phonePh')} style={inp} required minLength={7} maxLength={20} /></div>
      </div>

      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl} htmlFor="b-email">{t('email')}</label>
        <input id="b-email" name="email" type="email" value={form.email} onChange={ch} placeholder={t('emailPh')} style={inp} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div><label style={lbl} htmlFor="b-date">{t('date')}</label>
          <input id="b-date" name="date" type="date" min={today()} value={form.date} onChange={ch} style={inp} required /></div>
        <div><label style={lbl} htmlFor="b-time">{t('time')}</label>
          <select id="b-time" name="time" value={form.time} onChange={ch} style={inp}>
            {Object.entries(times).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div><label style={lbl} htmlFor="b-gothram">{t('gothram')}</label>
          <input id="b-gothram" name="gothram" type="text" value={form.gothram} onChange={ch} placeholder={t('gothramPh')} style={inp} maxLength={100} /></div>
        <div><label style={lbl} htmlFor="b-nakshatra">{t('nakshatra')}</label>
          <select id="b-nakshatra" name="nakshatra" value={form.nakshatra} onChange={ch} style={inp}>
            <option value="">{t('select')}</option>
            {nakshatras.map((n, i) => <option key={i} value={i}>{n}</option>)}
          </select></div>
      </div>

      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl} htmlFor="b-rashi">{t('rashi')}</label>
        <select id="b-rashi" name="rashi" value={form.rashi} onChange={ch} style={inp}>
          <option value="">{t('select')}</option>
          {rashis.map((r, i) => <option key={i} value={i}>{r}</option>)}
        </select>
      </div>

      <div style={{ marginBottom:'1rem' }}>
        <label style={lbl} htmlFor="b-notes">{t('notes')}</label>
        <textarea id="b-notes" name="notes" value={form.notes} onChange={ch} placeholder={t('notesPh')} style={{ ...inp, minHeight:'90px', resize:'vertical' }} maxLength={1500} />
      </div>

      {error && (
        <p role="alert" style={{ background:'#fbeaea', borderLeft:'3px solid var(--maroon-600)', color:'var(--maroon-800)', padding:'.7rem 1rem', fontSize:'.92rem', marginBottom:'1rem' }}>{error}</p>
      )}

      <button type="submit" className="btn-primary" style={{ width:'100%', textAlign:'center', marginTop:'.5rem', opacity:loading?.7:1 }} disabled={loading}>
        {loading ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
