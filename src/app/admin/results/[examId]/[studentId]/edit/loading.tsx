import { Skeleton } from "@/components/ui/Skeleton";

export default function EditMarksLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-6 w-72" />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex gap-4 border-b border-gray-100 pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-gray-100 py-2 last:border-0">
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className="h-8 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
