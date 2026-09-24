import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";

export default function StudentsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-6 w-32" />
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      <Skeleton className="h-10 max-w-sm" />
      <SkeletonTable rows={8} cols={6} />
    </div>
  );
}
