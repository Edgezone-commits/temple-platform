/**
 * One pooja booking in the admin inbox: devotee details, tap-to-call phone,
 * status buttons and an internal note. Each button is a small form posting
 * to the updateBooking Server Action (works without JS).
 */
import { getLocale, getTranslations } from 'next-intl/server';
import { updateBooking } from '@/lib/admin/actions';
import { formatterFor } from '@/lib/format';

export interface Booking {
  id: string;
  devotee_name: string;
  devotee_phone: string;
  devotee_email: string | null;
  booking_date: string;
  booking_time: string | null;
  gothram: string | null;
  nakshatra: string | null;
  rashi: string | null;
  notes: string | null;
  admin_notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  user_id: string | null;
  pooja: { name_en: string; name_ne: string | null } | null;
}

export default async function BookingCard({ b, compact = false }: { b: Booking; compact?: boolean }) {
  const [t, locale] = await Promise.all([getTranslations('admin.bookings'), getLocale()]);
  const format = formatterFor(locale);
  const act = updateBooking.bind(null, b.id);
  const pooja = b.pooja ? ((locale === 'ne' && b.pooja.name_ne) || b.pooja.name_en) : t('unknownPooja');
  const statusBtn = (status: Booking['status'], label: string, cls: string) => (
    <form action={act}>
      <input type="hidden" name="_locale" value={locale} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="admin_notes" value={b.admin_notes ?? ''} />
      <button type="submit" className={`adm-btn ${cls}`}>{label}</button>
    </form>
  );

  return (
    <article className={`adm-booking status-${b.status}`}>
      <header className="adm-booking-head">
        <div>
          <h3>{b.devotee_name}</h3>
          <span className="adm-muted">{t('received', { date: format.date(b.created_at.slice(0, 10), 'long') })}
            {b.user_id && <> · <span className="adm-badge ok">{t('account')}</span></>}</span>
        </div>
        <span className={`adm-status ${b.status}`}>{t(`status.${b.status}`)}</span>
      </header>
      <dl className="adm-booking-grid">
        <div><dt>{t('pooja')}</dt><dd>{pooja}</dd></div>
        <div><dt>{t('when')}</dt><dd>{format.date(b.booking_date, 'full')}{b.booking_time ? ` · ${b.booking_time.slice(0, 5)}` : ''}</dd></div>
        <div><dt>{t('contact')}</dt><dd><a href={`tel:${b.devotee_phone}`}>{b.devotee_phone}</a>{b.devotee_email && <><br /><a href={`mailto:${b.devotee_email}`}>{b.devotee_email}</a></>}</dd></div>
        {!compact && (b.gothram || b.nakshatra || b.rashi) && (
          <div><dt>{t('details')}</dt><dd>
            {[b.gothram && `${t('gothram')}: ${b.gothram}`, b.nakshatra && `${t('nakshatra')}: ${b.nakshatra}`, b.rashi && `${t('rashi')}: ${b.rashi}`].filter(Boolean).join(' · ')}
          </dd></div>
        )}
      </dl>
      {!compact && b.notes && <p className="adm-booking-notes"><strong>{t('notes')}:</strong> {b.notes}</p>}
      {!compact && (
        <form action={act} className="adm-booking-note">
          <input type="hidden" name="_locale" value={locale} />
          <label className="adm-label" htmlFor={`note-${b.id}`}>{t('adminNotes')}</label>
          <textarea id={`note-${b.id}`} name="admin_notes" className="adm-input" rows={2} defaultValue={b.admin_notes ?? ''} placeholder={t('adminNotesPh')} />
          <button type="submit" className="adm-btn adm-btn-ghost">{t('saveNote')}</button>
        </form>
      )}
      <div className="adm-booking-actions">
        {b.status === 'pending' && statusBtn('confirmed', t('confirm'), 'adm-btn-primary')}
        {b.status === 'confirmed' && statusBtn('completed', t('complete'), 'adm-btn-primary')}
        {(b.status === 'pending' || b.status === 'confirmed') && statusBtn('cancelled', t('cancel'), 'adm-btn-danger')}
        {(b.status === 'cancelled' || b.status === 'completed') && statusBtn('pending', t('reopen'), 'adm-btn-ghost')}
      </div>
    </article>
  );
}
