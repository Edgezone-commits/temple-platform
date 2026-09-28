import { PageHeroSkeleton } from '@/components/ui/Skeletons';

/** Shown while /calendar fetches the month's observances. */
export default function Loading() {
  return (
    <>
      <PageHeroSkeleton />
      <div className="cal-wrap" aria-hidden="true">
        <div className="cal-inner">
          <div className="skeleton" style={{ width:'min(320px,70%)', height:'34px', margin:'0 auto 1.4rem' }} />
          <div className="skeleton" style={{ width:'220px', height:'32px', margin:'0 auto 1.6rem' }} />
          <div className="cal-grid">
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="cal-cell"><div className="skeleton" style={{ width:'40%', height:'16px' }} /></div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
