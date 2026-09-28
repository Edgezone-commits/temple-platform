/**
 * /[locale]/admin — dashboard: counts of what needs attention and the next
 * pending bookings, plus quick links to add content.
 */
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import BookingCard, { type Booking } from '@/components/admin/BookingCard';
import { adminFetch, requireAdmin } from '@/lib/admin/api';
import { formatterFor } from '@/lib/format';
import { todayInNepal } from '@/lib/localize';
import { addDays } from '@/lib/nepaliCalendar';

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const account = await requireAdmin(locale);
  const today = todayInNepal();
  const [t, tn, pending, events, calendar, gallery] = await Promise.all([
    getTranslations('admin.dashboard'),
    getTranslations('admin.nav'),
    adminFetch<Booking[]>('/bookings/?status=pending&limit=200'),
    adminFetch<unknown[]>('/events/?upcoming=true&limit=500'),
    adminFetch<unknown[]>(`/calendar/?start=${today}&end=${addDays(today, 30)}&limit=500`),
    adminFetch<unknown[]>('/gallery/?limit=500'),
  ]);
  const format = formatterFor(locale);
  const count = (r: { ok: boolean; data?: unknown }) => (r.ok && Array.isArray(r.data) ? format.number(r.data.length) : '—');
  const next = pending.ok ? [...pending.data].reverse().slice(0, 3) : [];

  const stats = [
    { label: t('pendingBookings'), value: count(pending), href: '/admin/bookings', accent: true },
    { label: t('upcomingEvents'), value: count(events), href: '/admin/events' },
    { label: t('observances'), value: count(calendar), href: '/admin/calendar' },
    { label: t('photos'), value: count(gallery), href: '/admin/gallery' },
  ];

  return (
    <section>
      <div className="adm-page-head">
        <div>
          <h1>{t('welcome', { name: account.name })}</h1>
          <p className="adm-muted">{t('intro')}</p>
        </div>
      </div>
      <div className="adm-stats">
        {stats.map(s => (
          <Link key={s.href} href={s.href} className={`adm-stat${s.accent ? ' accent' : ''}`}>
            <span className="adm-stat-value">{s.value}</span>
            <span className="adm-stat-label">{s.label}</span>
          </Link>
        ))}
      </div>
      <div className="adm-quick">
        <span className="adm-muted">{t('quickAdd')}:</span>
        {(['events', 'calendar', 'gallery', 'poojas'] as const).map(s => (
          <Link key={s} href={`/admin/${s}/new`} className="adm-btn adm-btn-ghost">+ {tn(s)}</Link>
        ))}
      </div>
      <div className="adm-panel">
        <div className="adm-panel-head">
          <h2>{t('recentPending')}</h2>
          <Link href="/admin/bookings" className="adm-link">{t('viewAll')}</Link>
        </div>
        {next.length === 0 ? <p className="adm-empty">{t('noPending')}</p>
          : <div className="adm-bookings">{next.map(b => <BookingCard key={b.id} b={b} compact />)}</div>}
      </div>
    </section>
  );
}
