import { Skeleton } from "@/components/ui/Skeleton";

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Skeleton className="h-16 w-16 rounded-md" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="space-y-4">
          <div className="flex justify-end gap-1"><Skeleton className="h-4 w-24" /></div>
          <div className="space-y-1"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="mx-auto h-4 w-40" />
        </div>
      </div>
    </div>
  );
}
