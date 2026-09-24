import { Skeleton } from "@/components/ui/Skeleton";

export default function TemplatesLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
