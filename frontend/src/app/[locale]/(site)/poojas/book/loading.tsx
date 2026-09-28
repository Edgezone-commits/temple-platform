import { PageHeroSkeleton } from '@/components/ui/Skeletons';

/** Shown while /poojas/book loads the pooja list. */
export default function Loading() {
  return (
    <>
      <PageHeroSkeleton />
      <div style={{ padding:'3.5rem 2rem', background:'var(--ivory-100)' }} aria-hidden="true">
        <div style={{ maxWidth:'1280px', margin:'0 auto', display:'grid', gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)', gap:'2.5rem' }}>
          <div className="skeleton" style={{ height:'620px' }} />
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height:'110px' }} />)}
          </div>
        </div>
      </div>
    </>
  );
}
