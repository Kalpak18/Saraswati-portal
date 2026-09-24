import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";

export default function ExamDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-6 w-72" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <SkeletonTable rows={8} cols={5} />
    </div>
  );
}
