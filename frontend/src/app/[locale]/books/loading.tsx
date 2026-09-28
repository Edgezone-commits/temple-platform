import { CardGridSkeleton, PageSkeleton } from '@/components/ui/Skeletons';

/** Shown while /books fetches from the API. */
export default function Loading() {
  return (
    <PageSkeleton filters={5}>
      <CardGridSkeleton count={8} columns={4} mediaHeight={190} />
    </PageSkeleton>
  );
}
