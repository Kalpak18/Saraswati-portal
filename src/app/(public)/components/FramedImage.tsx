import { type ReactNode } from "react";
import { shapeClass, type PhotoFit, type PhotoShape } from "@/lib/homeSections";
import { cn } from "@/lib/utils";
import { SmartImage } from "./SmartImage";

const RATIO: Record<string, number> = { "4:3": 4 / 3, "16:9": 16 / 9, "1:1": 1, "3:4": 3 / 4 };

/**
 * Every section photo goes through this frame so the admin's per-section
 * "Photo shape" and "Fit" settings apply everywhere the same way:
 *   shape "original"  → the photo keeps its own proportions (never cropped)
 *   fixed shape + fill    → cropped to fill the shape
 *   fixed shape + contain → whole photo shown, a soft blurred copy fills the rest
 *   fixed shape, fit not chosen → crop ordinary photos, but show posters /
 *                                 flyers / screenshots whole (SmartImage)
 * `fallback` is the shape the section used before settings existed.
 */
export function FramedImage({
  src, alt = "", shape, fallback, fit, className, imgClassName, loading = "lazy", children,
}: {
  src: string;
  alt?: string;
  shape?: PhotoShape;
  fallback: Exclude<PhotoShape, "original"> | "original";
  /** Left unset = decide per photo. */
  fit?: PhotoFit;
  /** Classes for the frame (rounding, background…). */
  className?: string;
  /** Classes for the photo itself (hover zoom…). */
  imgClassName?: string;
  loading?: "lazy" | "eager";
  /** Overlays (captions, badges) positioned over the photo. */
  children?: ReactNode;
}) {
  const aspect = shapeClass(shape, fallback);

  if (!aspect) {
    // Original shape: the frame is exactly as tall as the photo.
    return (
      <div className={cn("relative overflow-hidden", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading={loading} className={cn("block h-auto w-full", imgClassName)} />
        {children}
      </div>
    );
  }

  if (!fit) {
    return (
      <div className={cn("relative overflow-hidden", aspect, className)}>
        <SmartImage src={src} alt={alt} loading={loading} frameRatio={RATIO[shape ?? fallback] ?? 4 / 3}
          className="absolute inset-0" imgClassName={imgClassName} />
        {children}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", aspect, className)}>
      {fit === "contain" && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt="" aria-hidden="true" loading={loading}
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl brightness-90" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading={loading}
        className={cn("relative h-full w-full", fit === "contain" ? "object-contain" : "object-cover", imgClassName)} />
      {children}
    </div>
  );
}
