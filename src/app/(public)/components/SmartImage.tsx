"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** The photo's real width ÷ height once it has loaded (null until then). */
export function useImageRatio(src: string | null | undefined): number | null {
  const [ratio, setRatio] = useState<{ src: string; r: number } | null>(null);
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => { if (img.naturalWidth && img.naturalHeight) setRatio({ src, r: img.naturalWidth / img.naturalHeight }); };
    img.src = src;
    return () => { img.onload = null; };
  }, [src]);
  return ratio && ratio.src === src ? ratio.r : null;
}

/**
 * True when cropping this photo into the frame would cut away a lot of it —
 * a tall poster, flyer, QR sheet or phone screenshot in a landscape frame
 * (or a panorama in a square one).
 */
export function wouldCropBadly(photoRatio: number | null, frameRatio: number) {
  if (photoRatio == null) return false;
  return photoRatio < frameRatio * 0.72 || photoRatio > frameRatio * 1.7;
}

/**
 * Fills its frame (the parent sets the size / aspect ratio). Ordinary photos
 * are cropped to fill, like before; photos that would lose too much are
 * shown whole, with a soft blurred copy of themselves filling the space.
 */
export function SmartImage({
  src, alt = "", frameRatio, className, imgClassName, loading = "lazy",
}: {
  src: string;
  alt?: string;
  /** Width ÷ height of the frame, e.g. 16/10. */
  frameRatio: number;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
}) {
  const contain = wouldCropBadly(useImageRatio(src), frameRatio);
  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {contain && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt="" aria-hidden="true" loading={loading}
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-2xl saturate-125" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading={loading}
        className={cn("relative h-full w-full", contain ? "object-contain p-3 drop-shadow-xl sm:p-5" : "object-cover", imgClassName)} />
    </div>
  );
}
