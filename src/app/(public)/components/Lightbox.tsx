"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type LightboxPhoto = { url: string; caption: string | null };

/** Full-screen photo viewer: arrows / swipe / keys to move, Esc to close. */
export function Lightbox({
  photos, index, onIndex, onClose,
}: { photos: LightboxPhoto[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const prev = useCallback(() => onIndex((index - 1 + photos.length) % photos.length), [index, photos.length, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % photos.length), [index, photos.length, onIndex]);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", onKey); };
  }, [prev, next, onClose]);

  const p = photos[index];
  return (
    <div
      role="dialog" aria-modal="true" aria-label="Photo viewer"
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-ink-900/95 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) { if (dx > 0) prev(); else next(); }
        touchX.current = null;
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={p.url} src={p.url} alt={p.caption ?? ""} onClick={(e) => e.stopPropagation()}
        className="animate-in zoom-in-95 max-h-[85svh] max-w-[92vw] rounded-lg object-contain shadow-2xl" />
      {p.caption && (
        <div className="absolute inset-x-0 bottom-6 text-center text-sm text-white/80">{p.caption}</div>
      )}
      <div className="absolute left-4 top-4 text-xs tabular-nums text-white/60">{index + 1} / {photos.length}</div>
      <button onClick={onClose} aria-label="Close"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X className="h-5 w-5" /></button>
      {photos.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous photo"
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:block">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next photo"
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:block">
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
}
