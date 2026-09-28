import { CardGridSkeleton, PageSkeleton } from '@/components/ui/Skeletons';

/** Shown while /poojas fetches from the API. */
export default function Loading() {
  return (
    <PageSkeleton>
      <div className="skeleton" style={{ height:'78px', marginBottom:'2.5rem' }} aria-hidden="true" />
      <CardGridSkeleton count={6} columns={3} mediaHeight={130} />
    </PageSkeleton>
  );
}
