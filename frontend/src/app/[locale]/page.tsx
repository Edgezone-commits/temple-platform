import Hero            from '@/components/home/Hero';
import TimingsBar      from '@/components/home/TimingsBar';
import AboutSection    from '@/components/home/AboutSection';
import AltarStrip      from '@/components/home/AltarStrip';
import ServicesSection from '@/components/home/ServicesSection';
import EventsPreview   from '@/components/home/EventsPreview';

export default function HomePage() {
  return (
    <>
      <Hero />
      <TimingsBar />
      <AboutSection />
      <AltarStrip />
      <ServicesSection />
      <EventsPreview />
    </>
  );
}