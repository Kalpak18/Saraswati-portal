"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { useSectionDesign } from "./SectionDesign";

// Scroll-driven motion for the public site, with no animation library.
//
// Everything writes CSS custom properties straight onto elements inside a
// requestAnimationFrame, so scrolling never re-renders React. Styles then
// read those variables (`--p`, `--dist`) in plain CSS transforms.
// Visitors with "reduce motion" switched on get the final, static layout.

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Writes `--p` (0 → 1) on `ref` as the element travels through the viewport.
 *  - "through": 0 when its top meets the viewport bottom, 1 when its bottom
 *    leaves the viewport top (parallax layers).
 *  - "pinned":  0 when its top reaches the viewport top, 1 when its bottom
 *    reaches the viewport bottom (sticky scenes inside a tall section).
 *  - "leave":   0 at rest, 1 once the element has scrolled fully out the top
 *    (the hero zoom / fade).
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  mode: "through" | "pinned" | "leave" = "through",
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.setProperty("--p", mode === "pinned" ? "1" : "0");
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      let p: number;
      if (mode === "pinned") p = -r.top / Math.max(1, r.height - vh);
      else if (mode === "leave") p = -r.top / Math.max(1, r.height);
      else p = (vh - r.top) / (vh + r.height);
      el.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(4));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, mode]);
}

/** True once the element has come into view (stays true). */
export function useInView<T extends HTMLElement>(options: IntersectionObserverInit = { rootMargin: "0px 0px -12% 0px" }) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      // Nothing to animate — show immediately (async to keep effects pure).
      const id = requestAnimationFrame(() => setSeen(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSeen(true); io.disconnect(); }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // options is a literal per call site; re-observing on identity change is not wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen]);
  return [ref, seen] as const;
}

const HIDDEN: Record<string, string> = {
  up: "translate-y-10 opacity-0",
  down: "-translate-y-10 opacity-0",
  left: "-translate-x-12 opacity-0",
  right: "translate-x-12 opacity-0",
  scale: "scale-95 opacity-0",
  fade: "opacity-0",
};

/** Fades / slides its children in the first time they scroll into view. */
export function Reveal({
  children, from = "up", delay = 0, className, style, as: Tag = "div",
}: {
  children: ReactNode;
  from?: keyof typeof HIDDEN;
  delay?: number;            // ms, for staggering siblings
  className?: string;
  style?: CSSProperties;
  as?: "div" | "li" | "section" | "article";
}) {
  const [ref, seen] = useInView<HTMLElement>();
  // The section's Design panel can swap or switch off entrance animations.
  const { animation } = useSectionDesign();
  if (animation === "none") {
    return <Tag className={className} style={style}>{children}</Tag>;
  }
  const effective = animation === "fade" ? "fade" : animation === "zoom" ? "scale"
    : animation === "slide" ? (from === "right" ? "right" : "left") : from;
  return (
    <Tag
      // `as` makes the element type a union; the ref is valid for all of them.
      ref={ref as RefObject<never>}
      style={{ ...style, transitionDelay: seen ? `${delay}ms` : "0ms" } as CSSProperties}
      className={cn(
        "transition-[opacity,transform] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        seen ? "translate-x-0 translate-y-0 scale-100 opacity-100" : HIDDEN[effective],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * Moves its content at a different speed from the page. `speed` is the
 * total travel in px across the element's pass through the viewport;
 * negative moves against the scroll.
 */
export function Parallax({ children, speed = 60, className }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollProgress(ref, "through");
  return (
    <div ref={ref} className={cn("will-change-transform", className)}
      style={{ transform: `translate3d(0, calc((0.5 - var(--p, 0.5)) * ${speed}px), 0)` }}>
      {children}
    </div>
  );
}
