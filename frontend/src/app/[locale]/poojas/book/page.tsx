import { use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import PageHero         from '@/components/ui/PageHero';
import BookingForm      from '@/components/poojas/BookingForm';
import BookingInfoPanel from '@/components/poojas/BookingInfoPanel';

/** /poojas/book — the booking form (previously rendered PoojaGrid by mistake). */
export default function BookPoojaPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <PageHero page="book" />
      <div style={{ padding:'3.5rem 2rem', background:'var(--ivory-100)' }}>
        <div style={{ maxWidth:'1280px', margin:'0 auto', display:'grid', gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)', gap:'2.5rem', alignItems:'start' }}>
          <BookingForm />
          <BookingInfoPanel />
        </div>
      </div>
    </>
  );
}
