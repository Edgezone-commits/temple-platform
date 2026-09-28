import { Suspense, use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import Hero            from '@/components/home/Hero';
import TimingsBar      from '@/components/home/TimingsBar';
import AboutSection    from '@/components/home/AboutSection';
import AltarStrip      from '@/components/home/AltarStrip';
import ServicesSection from '@/components/home/ServicesSection';
import EventsPreview, { EventsPreviewSkeleton } from '@/components/home/EventsPreview';

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <Hero />
      <TimingsBar />
      <AboutSection />
      <AltarStrip />
      <ServicesSection />
      {/* Streams in after the API responds; the rest of the page renders immediately. */}
      <Suspense fallback={<EventsPreviewSkeleton />}>
        <EventsPreview />
      </Suspense>
    </>
  );
}