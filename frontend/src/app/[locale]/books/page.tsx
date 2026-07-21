import PageHero        from '@/components/ui/PageHero';
import BookingForm     from '@/components/poojas/BookingForm';
import BookingInfoPanel from '@/components/poojas/BookingInfoPanel';

export default function BookPoojaPage() {
  return (
    <>
      <PageHero eyebrow="Schedule a Seva" title="Book a Pooja" titleNe="पूजा बुकिङ फारम" />
      <div style={{ padding:'3.5rem 2rem', background:'var(--ivory-100)' }}>
        <div style={{ maxWidth:'1280px', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 360px', gap:'3rem', alignItems:'start' }}>
          <BookingForm />
          <BookingInfoPanel />
        </div>
      </div>
    </>
  );
}