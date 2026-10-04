import { setRequestLocale, getTranslations } from 'next-intl/server';
import PageHero      from '@/components/ui/PageHero';
import StateMessage  from '@/components/ui/StateMessage';
import CalendarStrip from '@/components/events/CalendarStrip';
import EventsGrid    from '@/components/events/EventsGrid';
import { getCalendar, getEvents } from '@/lib/api';
import { todayInNepal } from '@/lib/localize';

/** /events — upcoming events (GET /events?upcoming) + next observances strip. */
export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [events, calendar, t] = await Promise.all([
    getEvents({ upcoming: true }),
    getCalendar({ start: todayInNepal(), limit: 6 }),
    getTranslations('state'),
  ]);

  return (
    <>
      <PageHero page="events" />
      <CalendarStrip entries={calendar.data ?? []} />
      <div className="page-section">
        <div className="page-inner">
          {events.error
            ? <StateMessage kind="error" message={t('error')} hint={t('errorHint')} />
            : <EventsGrid events={events.data} />}
        </div>
      </div>
    </>
  );
}
