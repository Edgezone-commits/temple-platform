import PageHero      from '@/components/ui/PageHero';
import CalendarStrip from '@/components/events/CalendarStrip';
import EventsGrid    from '@/components/events/EventsGrid';

export default function EventsPage() {
  return (
    <>
      <PageHero eyebrow="Temple Calendar" title="Events & Celebrations" titleNe="आगामी कार्यक्रम तथा उत्सवहरू" />
      <CalendarStrip />
      <EventsGrid />
    </>
  );
}