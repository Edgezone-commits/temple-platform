import PageHero     from '@/components/ui/PageHero';
import BhajanPlayer from '@/components/bhajans/BhajanPlayer';

export default function BhajansPage() {
  return (
    <>
      <PageHero eyebrow="Devotional Music" title="Bhajan Collection" titleNe="भजन, अष्टपदी र स्तोत्रहरू" />
      <BhajanPlayer />
    </>
  );
}