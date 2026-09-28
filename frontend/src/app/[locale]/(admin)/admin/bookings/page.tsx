/**
 * /[locale]/admin/bookings — pooja bookings inbox.
 * Tabs filter by status (?status=pending by default); each card can be
 * confirmed / cancelled / completed and given an internal note.
 */
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import BookingCard, { type Booking } from '@/components/admin/BookingCard';
import { adminFetch } from '@/lib/admin/api';

const TABS = ['pending', 'confirmed', 'completed', 'cancelled', 'all'] as const;

export default async function BookingsPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const tab = (TABS as readonly string[]).includes(sp.status ?? '') ? sp.status! : 'pending';
  const [t, tl, result] = await Promise.all([
    getTranslations('admin.bookings'),
    getTranslations('admin.list'),
    adminFetch<Booking[]>(`/bookings/?limit=200${tab === 'all' ? '' : `&status=${tab}`}`),
  ]);
  // Pending: soonest first (what to act on next); other tabs: newest first (as returned).
  const bookings = result.ok ? (tab === 'pending' ? [...result.data].reverse() : result.data) : [];

  return (
    <section>
      <div className="adm-page-head"><h1>{t('title')}</h1></div>
      <nav className="adm-tabs" aria-label={t('title')}>
        {TABS.map(s => (
          <Link key={s} href={{ pathname: '/admin/bookings', query: { status: s } }} className={`adm-tab${tab === s ? ' active' : ''}`}
            aria-current={tab === s ? 'page' : undefined}>{t(`tabs.${s}`)}</Link>
        ))}
      </nav>
      {!result.ok ? <p className="adm-alert error" role="alert">{tl('loadError')}</p>
        : bookings.length === 0 ? <p className="adm-empty">{t('empty')}</p>
        : <div className="adm-bookings">{bookings.map(b => <BookingCard key={b.id} b={b} />)}</div>}
    </section>
  );
}
