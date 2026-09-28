import { use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import PageHero      from '@/components/ui/PageHero';
import CalendarStrip from '@/components/events/CalendarStrip';
import EventsGrid    from '@/components/events/EventsGrid';

export default function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <PageHero page="events" />
      <CalendarStrip />
      <EventsGrid />
    </>
  );
}