import { cn } from "@/lib/utils";

/**
 * Grey placeholder block for the shape of upcoming content.
 *
 * Rules of thumb:
 * - `Skeleton` mirrors the *shape*, not the *pixel size*, of the real thing
 *   that will replace it (line of text, row, card). Match line height, not
 *   min pixels: a 6px sliver is worse than nothing.
 * - Do NOT stack skeletons for a full page inside a component that also
 *   fetches — use a route-level `loading.tsx` instead.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200/70",
        className,
      )}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({
  lines = 1,
  widths,
  className,
}: {
  lines?: number;
  /** Per-line width (Tailwind class or %); defaults to `w-full`, last line shorter. */
  widths?: string[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            widths?.[i] ?? (i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"),
          )}
        />
      ))}
    </div>
  );
}

/** Rectangular block for cards / large widgets. */
export function SkeletonCard({ className }: { className?: string }) {
  return <Skeleton className={cn("h-24 w-full", className)} />;
}

/** Table skeleton: header row + `rows` data rows across `cols` columns. */
export function SkeletonTable({
  rows = 6,
  cols = 4,
}: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-gray-100 px-4 py-3 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
