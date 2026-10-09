"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FlipHorizontal2, RotateCcw, RotateCw, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { Modal, ModalActions } from "./Modal";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { cn } from "@/lib/utils";

/**
 * Crop / adjust a photo before it is uploaded.
 *
 * The crop frame is fixed; the photo moves under it. Drag (or one finger)
 * pans, the slider / wheel / pinch zooms, and the photo always covers the
 * frame so the result never has empty edges. Brightness, contrast and
 * saturation preview live with CSS filters and are baked in on export.
 * No library: a transform model + one canvas draw.
 */

export type AspectKey = "original" | "16:9" | "4:3" | "1:1" | "3:4";
const ASPECTS: { key: AspectKey; label: string; ratio: number | null }[] = [
  { key: "16:9", label: "16:9", ratio: 16 / 9 },
  { key: "4:3", label: "4:3", ratio: 4 / 3 },
  { key: "1:1", label: "Square", ratio: 1 },
  { key: "3:4", label: "Portrait", ratio: 3 / 4 },
  { key: "original", label: "Original", ratio: null },
];

type Adjust = { brightness: number; contrast: number; saturate: number };
const NO_ADJUST: Adjust = { brightness: 100, contrast: 100, saturate: 100 };
const filterOf = (a: Adjust) => `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturate}%)`;

const MAX_ZOOM = 4;

export function ImageEditor({
  source, initialAspect = "16:9", maxDimension = 1600, onCancel, onDone,
}: {
  /** A freshly picked file, or the URL of an already-uploaded image. */
  source: File | string;
  initialAspect?: AspectKey;
  maxDimension?: number;
  onCancel: () => void;
  onDone: (blob: Blob) => void | Promise<void>;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aspect, setAspect] = useState<AspectKey>(initialAspect);
  const [rotation, setRotation] = useState(0);     // 0 | 90 | 180 | 270
  const [flip, setFlip] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [adjust, setAdjust] = useState<Adjust>(NO_ADJUST);
  const [frameW, setFrameW] = useState(0);
  const [saving, setSaving] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // ---- Load the image ------------------------------------------------------
  useEffect(() => {
    let url: string | null = null;
    const el = new Image();
    // Storage serves public files with CORS *, so a canvas can read them.
    el.crossOrigin = "anonymous";
    el.onload = () => setImg(el);
    el.onerror = () => setLoadError("Could not open this image.");
    if (typeof source === "string") el.src = source;
    else { url = URL.createObjectURL(source); el.src = url; }
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [source]);

  // ---- Frame size follows the modal width ----------------------------------
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setFrameW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [img]);

  const turned = rotation % 180 !== 0;
  const iw = img?.naturalWidth ?? 1, ih = img?.naturalHeight ?? 1;
  const rw = turned ? ih : iw, rh = turned ? iw : ih;            // rotated footprint
  const ratio = ASPECTS.find((a) => a.key === aspect)!.ratio ?? rw / rh;
  // Keep tall crops from towering over the screen (frame at most 420px high).
  const W = Math.min(frameW, 420 * ratio);
  const H = W / ratio;
  const baseScale = Math.max(W / rw, H / rh);                    // "cover"
  const scale = baseScale * zoom;

  const clamp = useCallback((o: { x: number; y: number }, s = scale) => {
    const mx = Math.max(0, (rw * s - W) / 2), my = Math.max(0, (rh * s - H) / 2);
    return { x: Math.min(mx, Math.max(-mx, o.x)), y: Math.min(my, Math.max(-my, o.y)) };
  }, [rw, rh, W, H, scale]);

  // The stored offset may overshoot after a zoom-out or shape change;
  // what's shown and exported is always the clamped position.
  const pos = clamp(offset);

  // ---- Pointer: drag to pan, two fingers to pinch --------------------------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, next);
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = Array.from(pointers.current.values());
      const z = pinch.current.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.dist);
      setZoom(Math.min(MAX_ZOOM, Math.max(1, z)));
    } else if (pointers.current.size === 1) {
      setOffset((o) => { const c = clamp(o); return clamp({ x: c.x + next.x - prev.x, y: c.y + next.y - prev.y }); });
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  }
  function onWheel(e: React.WheelEvent) {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(1, z * (e.deltaY < 0 ? 1.08 : 1 / 1.08))));
  }
  function nudge(dx: number, dy: number) {
    setOffset((o) => { const c = clamp(o); return clamp({ x: c.x + dx, y: c.y + dy }); });
  }

  function reset() {
    setRotation(0); setFlip(false); setZoom(1); setOffset({ x: 0, y: 0 }); setAdjust(NO_ADJUST);
  }

  // ---- Export --------------------------------------------------------------
  async function save() {
    if (!img || !W) return;
    setSaving(true);
    try {
      // Output at the photo's real resolution inside the frame (never
      // upscaled), with the longer side capped at maxDimension.
      const srcAcross = W / scale;                      // source pixels across the frame
      const capW = ratio >= 1 ? maxDimension : maxDimension * ratio;
      const outW = Math.max(1, Math.round(Math.min(srcAcross, capW)));
      const outH = Math.round(outW / ratio);
      const k = outW / W;
      const canvas = document.createElement("canvas");
      canvas.width = outW; canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, outW, outH);
      ctx.filter = filterOf(adjust);
      ctx.imageSmoothingQuality = "high";
      ctx.translate(outW / 2 + pos.x * k, outH / 2 + pos.y * k);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flip ? -1 : 1, 1);
      ctx.scale(scale * k, scale * k);
      ctx.drawImage(img, -iw / 2, -ih / 2);
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("Could not export image"))), "image/jpeg", 0.88));
      await onDone(blob);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onCancel} size="2xl" title="Edit photo" closeOnBackdrop={false}
      description="Drag to position · scroll or pinch to zoom">
      {loadError ? (
        <p className="py-10 text-center text-sm text-red-600">{loadError}</p>
      ) : (
        <div className="space-y-5">
          {/* Stage */}
          <div ref={stageRef} className="w-full">
            {img && W > 0 && (
              <div
                className="relative mx-auto touch-none select-none overflow-hidden rounded-lg bg-ink-900 ring-1 ring-ink-200"
                style={{ width: W, height: H, cursor: "grab" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
                tabIndex={0}
                role="application"
                aria-label="Crop area. Use arrow keys to move the photo, plus and minus to zoom."
                onKeyDown={(e) => {
                  const step = e.shiftKey ? 20 : 5;
                  if (e.key === "ArrowLeft") { e.preventDefault(); nudge(-step, 0); }
                  else if (e.key === "ArrowRight") { e.preventDefault(); nudge(step, 0); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); nudge(0, -step); }
                  else if (e.key === "ArrowDown") { e.preventDefault(); nudge(0, step); }
                  else if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(MAX_ZOOM, z * 1.1));
                  else if (e.key === "-") setZoom((z) => Math.max(1, z / 1.1));
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                  style={{
                    width: iw * scale,
                    height: ih * scale,
                    transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) rotate(${rotation}deg) scaleX(${flip ? -1 : 1})`,
                    filter: filterOf(adjust),
                  }}
                />
                {/* Rule-of-thirds guide */}
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-white/20" />)}
                </div>
              </div>
            )}
            {!img && <div className="flex h-64 items-center justify-center text-sm text-ink-500">Loading photo…</div>}
          </div>

          {/* Shape */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-ink-500">Shape</span>
            {ASPECTS.map((a) => (
              <button key={a.key} type="button" onClick={() => { setAspect(a.key); setOffset({ x: 0, y: 0 }); }}
                aria-pressed={aspect === a.key}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors",
                  aspect === a.key ? "bg-brand-700 text-white ring-brand-700" : "bg-white text-ink-700 ring-ink-200 hover:bg-ink-50",
                )}>
                {a.label}
              </button>
            ))}
          </div>

          {/* Zoom + turn */}
          <div className="flex flex-wrap items-center gap-3">
            <IconButton label="Zoom out" onClick={() => setZoom((z) => Math.max(1, z / 1.15))}><ZoomOut className="h-4 w-4" /></IconButton>
            <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={zoom} aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))} className="h-2 flex-1 accent-brand-700" />
            <IconButton label="Zoom in" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.15))}><ZoomIn className="h-4 w-4" /></IconButton>
            <span className="mx-1 h-6 w-px bg-ink-200" />
            <IconButton label="Rotate left" onClick={() => { setRotation((r) => (r + 270) % 360); setOffset({ x: 0, y: 0 }); }}><RotateCcw className="h-4 w-4" /></IconButton>
            <IconButton label="Rotate right" onClick={() => { setRotation((r) => (r + 90) % 360); setOffset({ x: 0, y: 0 }); }}><RotateCw className="h-4 w-4" /></IconButton>
            <IconButton label="Flip" onClick={() => setFlip((f) => !f)}><FlipHorizontal2 className="h-4 w-4" /></IconButton>
          </div>

          {/* Adjust */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {([
              ["brightness", "Brightness"],
              ["contrast", "Contrast"],
              ["saturate", "Colour"],
            ] as const).map(([k, label]) => (
              <label key={k} className="flex flex-col gap-1 text-xs font-medium text-ink-600">
                <span className="flex justify-between">{label}<span className="tabular-nums text-ink-400">{adjust[k] - 100 > 0 ? "+" : ""}{adjust[k] - 100}</span></span>
                <input type="range" min={50} max={150} value={adjust[k]}
                  onChange={(e) => setAdjust({ ...adjust, [k]: Number(e.target.value) })}
                  onDoubleClick={() => setAdjust({ ...adjust, [k]: 100 })}
                  className="h-2 accent-brand-700" />
              </label>
            ))}
          </div>
        </div>
      )}

      <ModalActions>
        <Button type="button" variant="ghost" leftIcon={<Undo2 className="h-4 w-4" />} onClick={reset} className="sm:mr-auto">
          Reset
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="button" onClick={save} loading={saving} disabled={!img || !!loadError}>Save photo</Button>
      </ModalActions>
    </Modal>
  );
}

/** Aspect preset that matches an ImageUpload frame. */
export function aspectForFrame(frame: "wide" | "square" | "portrait"): AspectKey {
  return frame === "square" ? "1:1" : frame === "portrait" ? "3:4" : "16:9";
}
