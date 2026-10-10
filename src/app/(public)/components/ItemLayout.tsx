"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { gridColsFor, masonryColsFor, type Columns } from "@/lib/homeSections";
import { cn } from "@/lib/utils";
import { Reveal } from "./motion";

/**
 * Lays out a section's items the way the admin chose:
 *   grid     — even rows, `columns` per row on large screens
 *   masonry  — staggered columns that keep each photo's own shape
 *   carousel — one swipeable row showing `columns` at a time, with arrows
 * Every item fades in as it scrolls into view.
 */
export function ItemLayout({
  layout, columns, children, className, gap = "1.5rem", stretch = true,
}: {
  layout: "grid" | "masonry" | "carousel";
  columns?: Columns;
  children: ReactNode;
  className?: string;
  /** Default space between items; the section's "Gap" setting overrides it. */
  gap?: string;
  /** Grid items fill the row height (cards) — off for photos. */
  stretch?: boolean;
}) {
  const items = Children.toArray(children);
  if (items.length === 0) return null;

  const g = `var(--sec-gap, ${gap})`;

  if (layout === "carousel") return <Carousel columns={columns ?? 3} gap={g} className={className}>{items}</Carousel>;

  if (layout === "masonry") {
    return (
      <div className={cn("[column-fill:balance]", masonryColsFor(columns), className)} style={{ columnGap: g }}>
        {items.map((child, i) => (
          <Reveal key={i} delay={(i % 4) * 80} className="break-inside-avoid" style={{ marginBottom: g }}>{child}</Reveal>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid", gridColsFor(items.length, columns), className)} style={{ gap: g }}>
      {items.map((child, i) => (
        <Reveal key={i} delay={(i % (columns ?? 3)) * 100} className={stretch ? "h-full" : undefined}>{child}</Reveal>
      ))}
    </div>
  );
}

// Slide widths: most of the screen on phones (so the next one peeks in),
// `columns` across on large screens, allowing for the gaps between them.
// Spelled out for Tailwind; --g is the gap set on the track.
const SLIDE_WIDTH: Record<Columns, string> = {
  1: "w-[88%] lg:w-full",
  2: "w-[85%] sm:w-[calc((100%-var(--g))/2)]",
  3: "w-[85%] sm:w-[calc((100%-var(--g))/2)] lg:w-[calc((100%-2*var(--g))/3)]",
  4: "w-[70%] sm:w-[calc((100%-var(--g))/2)] lg:w-[calc((100%-3*var(--g))/4)]",
  5: "w-[60%] sm:w-[calc((100%-2*var(--g))/3)] lg:w-[calc((100%-4*var(--g))/5)]",
};

function Carousel({ columns, gap, children, className }: { columns: Columns; gap: string; children: ReactNode[]; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const id = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { cancelAnimationFrame(id); ro.disconnect(); };
  }, [measure]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={track}
        onScroll={measure}
        className="-mx-4 flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-4 pb-4 scrollbar-none sm:mx-0 sm:px-0"
        style={{ gap, "--g": gap } as React.CSSProperties}
      >
        {children.map((child, i) => (
          <div key={i} className={cn("flex-none snap-start", SLIDE_WIDTH[columns])}>
            <Reveal from="right" delay={Math.min(i, columns) * 90} className="h-full">{child}</Reveal>
          </div>
        ))}
      </div>
      {!(edges.start && edges.end) && (
        <div className="mt-4 hidden justify-end gap-2 sm:flex">
          {([-1, 1] as const).map((d) => (
            <button key={d} type="button" onClick={() => page(d)} disabled={d === -1 ? edges.start : edges.end}
              aria-label={d === -1 ? "Previous" : "Next"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-800 shadow-md ring-1 ring-ink-200 transition-all hover:bg-ink-50 disabled:opacity-30">
              {d === -1 ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
