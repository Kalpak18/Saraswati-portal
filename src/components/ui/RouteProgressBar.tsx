"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin top-of-page progress bar shown during route transitions.
 *
 * Placement: once in the root layout. Zero deps — deliberately no nprogress.
 *
 * Behaviour:
 * - Starts on any anchor click that resolves to an internal route, or a form
 *   submit intent (both feel like "the page is changing" to a user).
 * - Advances asymptotically toward ~90% while pending, so slow servers still
 *   show visible motion instead of a frozen bar.
 * - Completes and fades when the pathname or searchParams change (the render
 *   the user was waiting for has landed).
 */
export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  const start = () => {
    clearTimers();
    setVisible(true);
    setProgress(8);
    // Trickle up toward 90% — never completes on its own; the route change does.
    const tick = () => {
      setProgress((p) => {
        const next = p + (90 - p) * 0.12;
        return next > 89.5 ? 89.5 : next;
      });
      timers.current.push(window.setTimeout(tick, 220));
    };
    timers.current.push(window.setTimeout(tick, 220));
  };

  const done = () => {
    clearTimers();
    setProgress(100);
    timers.current.push(window.setTimeout(() => setVisible(false), 250));
    timers.current.push(window.setTimeout(() => setProgress(0), 500));
  };

  // Complete when the route actually changes.
  useEffect(() => {
    if (!visible) return;
    done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  // Start on internal navigation intents.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return; // ignore right / middle click
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const el = (e.target as HTMLElement | null)?.closest("a");
      if (!el) return;
      const href = el.getAttribute("href");
      if (!href) return;
      if (el.target && el.target !== "_self") return;
      if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (href.startsWith("#")) return;
      if (el.hasAttribute("download")) return;
      if (el.getAttribute("data-no-progress") !== null) return;
      start();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also on browser back/forward.
  useEffect(() => {
    const onPop = () => start();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearTimers(), []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 250ms ease" }}
    >
      <div
        className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.6)]"
        style={{
          width: `${progress}%`,
          transition: "width 220ms ease-out",
        }}
      />
    </div>
  );
}
