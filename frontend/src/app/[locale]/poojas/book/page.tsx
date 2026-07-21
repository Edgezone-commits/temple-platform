import PageHero       from '@/components/ui/PageHero';
import PoojaGrid      from '@/components/poojas/PoojaGrid';
import ArchanaSection from '@/components/poojas/ArchanaSection';

export default function PoojasPage() {
  return (
    <>
      <PageHero eyebrow="Temple Services" title="Pooja & Archana Services" titleNe="पूजा र अर्चना सेवाहरू" />
      <PoojaGrid />
      <ArchanaSection />
    </>
  );
}