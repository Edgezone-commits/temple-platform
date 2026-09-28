import { use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import PageHero       from '@/components/ui/PageHero';
import PoojaGrid      from '@/components/poojas/PoojaGrid';
import ArchanaSection from '@/components/poojas/ArchanaSection';

export default function PoojasPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <PageHero page="poojas" />
      <PoojaGrid />
      <ArchanaSection />
    </>
  );
}