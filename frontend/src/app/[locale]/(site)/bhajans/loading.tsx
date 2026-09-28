import { ListSkeleton, PageSkeleton } from '@/components/ui/Skeletons';

/** Shown while /bhajans fetches from the API. */
export default function Loading() {
  return (
    <PageSkeleton filters={6}>
      <ListSkeleton rows={8} />
    </PageSkeleton>
  );
}
