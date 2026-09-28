import { ListSkeleton, PageSkeleton } from '@/components/ui/Skeletons';

/** Shown while /history fetches from the API. */
export default function Loading() {
  return <PageSkeleton><ListSkeleton rows={3} /></PageSkeleton>;
}
