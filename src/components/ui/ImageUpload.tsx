"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Crop, ImagePlus, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { ImageEditor, aspectForFrame } from "./ImageEditor";

/**
 * Photo picker used across the CMS. A picked photo opens in the crop /
 * adjust editor first (and an uploaded one can be re-edited); the editor's
 * output — already sized to `maxDimension` and JPEG-encoded — goes to
 * `onUpload`, a server action passed by the caller that returns `{ url }`.
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
  mediaClassName,
  mediaStyle,
}: {
  /** Current image URL, if any. */
  value: string | null;
  /** Called with a new URL after upload, or `null` when the image is cleared. */
  onChange: (url: string | null) => void;
  /** Server action that receives a FormData with `file` and returns `{ url }`. */
  onUpload: UploadFn;
  label?: ReactNode;
  hint?: ReactNode;
  /** Frame shape of the preview; also the editor's starting crop shape. */
  aspect?: "wide" | "square" | "portrait";
  /** Max width AND height in pixels — image is scaled to fit. */
  maxDimension?: number;
  className?: string;
  /** Extra class / style on the shown photo — e.g. to play a camera move on it. */
  mediaClassName?: string;
  mediaStyle?: React.CSSProperties;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<File | string | null>(null);

  const frame =
    aspect === "square" ? "aspect-square"
    : aspect === "portrait" ? "aspect-3/4"
    : "aspect-16/9";

  function pick(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setEditing(file);
  }

  // Called by the editor with the cropped, adjusted JPEG.
  async function upload(blob: Blob) {
    setBusy(true);
    const fd = new FormData();
    fd.set("file", blob, "photo.jpg");
    await new Promise<void>((done) => {
      startTransition(async () => {
        try {
          const { url } = await onUpload(fd);
          onChange(url);
          setEditing(null);
          toast.success("Photo saved");
        } catch (err) {
          toast.error((err as Error).message || "Upload failed");
        } finally {
          setBusy(false);
          done();
        }
      });
    });
  }

  const disabled = busy || pending;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <label className="text-sm font-medium text-ink-700">{label}</label>}
      {hint && <p className="text-xs text-ink-500">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(f);
          e.target.value = ""; // let the same file be picked again after clear
        }}
      />

      {value ? (
        <div className={cn("group relative w-full overflow-hidden rounded-lg border border-ink-200 bg-ink-50", frame)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt=""
            className={cn("h-full w-full object-cover", mediaClassName)} style={mediaStyle} />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-linear-to-t from-black/50 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
            <IconButton
              tone="gray"
              label="Crop & adjust"
              className="!bg-white/90 hover:!bg-white"
              onClick={() => setEditing(value)}
              disabled={disabled}
            >
              <Crop className="h-4 w-4" />
            </IconButton>
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
            "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink-300 bg-ink-50 p-6 text-center transition-colors",
            "hover:border-brand-400 hover:bg-brand-50",
            "disabled:cursor-not-allowed disabled:opacity-70",
            frame,
          )}
        >
          <ImagePlus className="h-6 w-6 text-ink-400" />
          <div className="text-sm font-medium text-ink-700">
            {disabled ? "Uploading…" : "Choose photo"}
          </div>
          <div className="text-xs text-ink-500">You can crop and adjust it next</div>
        </button>
      )}

      {value && (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(value)}
            disabled={disabled}
            leftIcon={<Crop className="h-3.5 w-3.5" />}
          >
            Crop & adjust
          </Button>
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

      {editing && (
        <ImageEditor
          source={editing}
          initialAspect={aspectForFrame(aspect)}
          maxDimension={maxDimension}
          onCancel={() => { if (!busy) setEditing(null); }}
          onDone={upload}
        />
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
export async function resizeImage(file: File, maxDimension: number): Promise<Blob> {
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
