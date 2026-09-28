import { CardGridSkeleton, PageSkeleton } from '@/components/ui/Skeletons';

/** Shown while /events fetches from the API. */
export default function Loading() {
  return (
    <PageSkeleton filters={5}>
      <CardGridSkeleton count={6} columns={3} />
    </PageSkeleton>
  );
}
