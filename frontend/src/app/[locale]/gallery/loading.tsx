import { PageSkeleton } from '@/components/ui/Skeletons';

/** Shown while /gallery fetches from the API. */
export default function Loading() {
  return (
    <PageSkeleton filters={4}>
      <div className="gallery-grid" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton" style={{ aspectRatio:'4/3' }} />)}
      </div>
    </PageSkeleton>
  );
}
