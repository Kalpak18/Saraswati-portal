import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";

export default function ResultsLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-10 w-40" />
      </div>
      <SkeletonTable rows={5} cols={5} />
    </div>
  );
}
