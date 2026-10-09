"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Film, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

const MAX_BYTES = 50 * 1024 * 1024;

type StartUpload = (fileName: string) => Promise<{ bucket: string; path: string; token: string; url: string }>;

/**
 * Video picker for the CMS. The server action `onStart` authorises one
 * upload path; the file then goes browser → Storage directly, because a
 * 30 MB clip would never fit through a server action body.
 */
export function VideoUpload({
  value, onChange, onStart, poster, hint, mediaClassName, mediaStyle,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  onStart: StartUpload;
  poster?: string | null;
  hint?: string;
  /** Extra class / style on the playing video — e.g. to show a camera move. */
  mediaClassName?: string;
  mediaStyle?: React.CSSProperties;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!file.type.startsWith("video/")) { toast.error("Choose a video file (MP4 or WebM)"); return; }
    if (file.size > MAX_BYTES) {
      toast.error(`Video is ${(file.size / 1024 / 1024).toFixed(0)} MB — the limit is 50 MB. Trim it or export at 1080p.`);
      return;
    }
    setBusy(true);
    try {
      const s = await onStart(file.name);
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.storage.from(s.bucket).uploadToSignedUrl(s.path, s.token, file, {
        contentType: file.type,
      });
      if (error) throw new Error(error.message);
      onChange(s.url);
      toast.success("Video uploaded — press Save to publish it");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-ink-200 bg-ink-900">
        {value ? (
          <video
            src={value} poster={poster ?? undefined} muted loop playsInline autoPlay controls={false}
            className={cn("h-full w-full object-cover", mediaClassName)} style={mediaStyle} />
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-300 hover:text-white">
            <Film className={busy ? "h-8 w-8 animate-pulse" : "h-8 w-8"} />
            <span className="text-sm font-medium">{busy ? "Uploading…" : "Choose a video"}</span>
          </button>
        )}
      </div>
      {value && (
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="secondary" loading={busy}
            leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => inputRef.current?.click()}>
            Replace
          </Button>
          <IconButton label="Remove video" tone="danger" onClick={() => onChange(null)} disabled={busy}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      )}
      {hint && <p className="text-xs text-ink-500">{hint}</p>}
      <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
    </div>
  );
}
