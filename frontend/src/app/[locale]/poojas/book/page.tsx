import { setRequestLocale } from 'next-intl/server';
import PageHero         from '@/components/ui/PageHero';
import BookingForm      from '@/components/poojas/BookingForm';
import BookingInfoPanel from '@/components/poojas/BookingInfoPanel';
import { getPoojas } from '@/lib/api';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pooja?: string | string[] }>;
}

/** /poojas/book — booking form; ?pooja=<id> preselects a pooja (links from /poojas). */
export default async function BookPoojaPage({ params, searchParams }: Props) {
  const [{ locale }, { pooja }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const poojas = await getPoojas();

  return (
    <>
      <PageHero page="book" />
      <div style={{ padding:'3.5rem 2rem', background:'var(--ivory-100)' }}>
        <div style={{ maxWidth:'1280px', margin:'0 auto', display:'grid', gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)', gap:'2.5rem', alignItems:'start' }}>
          <BookingForm poojas={poojas.data} initialPoojaId={typeof pooja === 'string' ? pooja : undefined} />
          <BookingInfoPanel />
        </div>
      </div>
    </>
  );
}
