import { use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import PageHero     from '@/components/ui/PageHero';
import BhajanPlayer from '@/components/bhajans/BhajanPlayer';

export default function BhajansPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <PageHero page="bhajans" />
      <BhajanPlayer />
    </>
  );
}