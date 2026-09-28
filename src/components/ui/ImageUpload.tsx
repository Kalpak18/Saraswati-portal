"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { ImagePlus, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

/**
 * Photo picker used across the CMS. Handles the browser side of the upload
 * (client-side resize down to a sensible max dimension, jpeg re-encode) then
 * hands the resulting blob to `onUpload`, which is a server action passed by
 * the caller. The server action returns a `{ url }` — this component swaps
 * to preview mode.
 *
 * Why resize on the client:
 *   Parents / admins upload from phone cameras that shoot 10 MP+. Sending
 *   full-res bytes to Supabase Storage wastes both the free-tier bucket
 *   quota and the parent's data. A 1600×1600 max cover fits every layout
 *   with no visible loss.
 */
type UploadFn = (formData: FormData) => Promise<{ url: string }>;

export function ImageUpload({
  value,
  onChange,
  onUpload,
  label,
  hint,
  aspect = "wide",
  maxDimension = 1600,
  className,
}: {
  /** Current image URL, if any. */
  value: string | null;
  /** Called with a new URL after upload, or `null` when the image is cleared. */
  onChange: (url: string | null) => void;
  /** Server action that receives a FormData with `file` and returns `{ url }`. */
  onUpload: UploadFn;
  label?: ReactNode;
  hint?: ReactNode;
  /** Frame shape hint for the preview. Doesn't affect the actual image. */
  aspect?: "wide" | "square" | "portrait";
  /** Max width AND height in pixels — image is scaled to fit. */
  maxDimension?: number;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const frame =
    aspect === "square" ? "aspect-square"
    : aspect === "portrait" ? "aspect-3/4"
    : "aspect-16/9";

  async function resizeAndUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setBusy(true);
    try {
      const resized = await resizeImage(file, maxDimension);
      const fd = new FormData();
      fd.set("file", resized, file.name.replace(/\.[^.]+$/, ".jpg"));
      startTransition(async () => {
        try {
          const { url } = await onUpload(fd);
          onChange(url);
          toast.success("Photo uploaded");
        } catch (err) {
          toast.error((err as Error).message || "Upload failed");
        } finally {
          setBusy(false);
        }
      });
    } catch (err) {
      setBusy(false);
      toast.error((err as Error).message || "Could not process image");
    }
  }

  const disabled = busy || pending;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) resizeAndUpload(f);
          e.target.value = ""; // let the same file be picked again after clear
        }}
      />

      {value ? (
        <div className={cn("group relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50", frame)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-linear-to-t from-black/50 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
            <IconButton
              tone="gray"
              label="Replace"
              className="!bg-white/90 hover:!bg-white"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              <RefreshCw className="h-4 w-4" />
            </IconButton>
            <IconButton
              tone="danger"
              label="Remove photo"
              className="!bg-white/90 hover:!bg-white"
              onClick={() => onChange(null)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
          {disabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm">
              Uploading…
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition-colors",
            "hover:border-indigo-400 hover:bg-indigo-50",
            "disabled:cursor-not-allowed disabled:opacity-70",
            frame,
          )}
        >
          <ImagePlus className="h-6 w-6 text-gray-400" />
          <div className="text-sm font-medium text-gray-700">
            {disabled ? "Uploading…" : "Choose photo"}
          </div>
          <div className="text-xs text-gray-500">Max {maxDimension}px, auto-compressed</div>
        </button>
      )}

      {value && (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Replace
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Client-side resize
// ============================================================
/**
 * Downscale a File to `maxDimension` on its longer side and re-encode as JPEG
 * at quality 0.85. Returns a Blob wearing `image/jpeg`. Skips resizing when
 * the image is already smaller than the cap — no point re-encoding.
 */
async function resizeImage(file: File, maxDimension: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = bitmap;
    const longer = Math.max(width, height);
    if (longer <= maxDimension && file.type === "image/jpeg") {
      // Already small AND already JPEG — keep bytes as-is.
      return file;
    }
    const scale = Math.min(1, maxDimension / longer);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    if (typeof OffscreenCanvas !== "undefined") {
      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D | null;
      if (!ctx) throw new Error("Canvas 2D unavailable");
      ctx.drawImage(bitmap, 0, 0, w, h);
      return await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    ctx.drawImage(bitmap, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
        "image/jpeg",
        0.85,
      );
    });
  } finally {
    bitmap.close?.();
  }
}
