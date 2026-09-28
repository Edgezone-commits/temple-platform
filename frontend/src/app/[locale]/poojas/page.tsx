import { setRequestLocale } from 'next-intl/server';
import PageHero       from '@/components/ui/PageHero';
import PoojaGrid      from '@/components/poojas/PoojaGrid';
import ArchanaSection from '@/components/poojas/ArchanaSection';
import { getArchanas, getPoojas } from '@/lib/api';

/** /poojas — pooja services + archana offerings, both from the API. */
export default async function PoojasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [poojas, archanas] = await Promise.all([getPoojas(), getArchanas()]);

  return (
    <>
      <PageHero page="poojas" />
      <PoojaGrid poojas={poojas.data} />
      <ArchanaSection archanas={archanas.data} />
    </>
  );
}
