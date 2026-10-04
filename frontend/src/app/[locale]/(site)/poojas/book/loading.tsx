import { PageHeroSkeleton } from '@/components/ui/Skeletons';

/** Shown while /poojas/book loads the pooja list. */
export default function Loading() {
  return (
    <>
      <PageHeroSkeleton />
      <div className="page-section" aria-hidden="true">
        <div className="page-inner g-split">
          <div className="skeleton" style={{ height:'620px' }} />
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height:'110px' }} />)}
          </div>
        </div>
      </div>
    </>
  );
}
