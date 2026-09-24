import { Skeleton } from "@/components/ui/Skeleton";

export default function ReportCardLoading() {
  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
      <div className="mx-auto flex max-w-180 justify-end px-2 pb-2 print:hidden">
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="mx-auto max-w-180 rounded-xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-4 border-b border-gray-200 pb-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2 text-center">
            <Skeleton className="mx-auto h-5 w-64" />
            <Skeleton className="mx-auto h-3 w-40" />
          </div>
        </div>
        <Skeleton className="mx-auto mb-4 h-5 w-72" />
        <div className="mb-4 flex justify-between">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
