"use client";

import { clientAction } from "@/lib/clientAction";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Eye, EyeOff, FileText, Paperclip, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { DOWNLOAD_CATEGORIES, fileMeta, type DownloadItem } from "@/lib/downloads";
import { cn } from "@/lib/utils";
import {
  saveDownload as saveDownloadAction, deleteDownload as deleteDownloadAction,
  setDownloadPublished as setDownloadPublishedAction, startDownloadUpload as startDownloadUploadAction,
} from "./actions";

// Server actions return { ok, error }; these wrappers throw the real message (see lib/clientAction.ts).
const saveDownload = clientAction(saveDownloadAction);
const deleteDownload = clientAction(deleteDownloadAction);
const setDownloadPublished = clientAction(setDownloadPublishedAction);
const startDownloadUpload = clientAction(startDownloadUploadAction);

const MAX_BYTES = 25 * 1024 * 1024;

export default function DownloadsClient({ items }: { items: DownloadItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<DownloadItem | "new" | null>(null);
  const [confirm, setConfirm] = useState<DownloadItem | null>(null);

  function run(fn: () => Promise<unknown>, ok?: string) {
    startTransition(async () => {
      try { await fn(); if (ok) toast.success(ok); router.refresh(); }
      catch (err) { toast.error((err as Error).message); }
    });
  }

  const byCat = DOWNLOAD_CATEGORIES.map((c) => ({ ...c, rows: items.filter((i) => i.category === c.key) })).filter((g) => g.rows.length);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumbs={[{ label: "Website", href: "/admin/website" }, { label: "Downloads" }]}
        title="Downloads"
        description="Calendar, forms, circulars and syllabus — parents download them from the Downloads page."
        actions={
          <>
            <Link href="/academics/downloads" target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3.5 text-sm text-ink-700 shadow-sm hover:bg-ink-50">
              <ExternalLink className="h-4 w-4" /> View live
            </Link>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>Add document</Button>
          </>
        }
      />

      {items.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white shadow-sm">
          <EmptyState icon={<FileText className="h-6 w-6" />} title="No documents yet"
            description="Upload the school calendar, admission form or a circular (PDF, Word, Excel, PowerPoint or image, up to 25 MB)."
            action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>Add document</Button>} />
        </div>
      ) : (
        <div className="space-y-6">
          {byCat.map((g) => (
            <section key={g.key}>
              <h2 className="mb-2 text-sm font-semibold text-ink-900">{g.en}</h2>
              <ul className="divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
                {g.rows.map((d) => (
                  <li key={d.id} className={cn("flex items-center gap-3 p-3", !d.is_published && "opacity-60")}>
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-brand-50 text-brand-700"><FileText className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-ink-900 hover:text-brand-700 hover:underline">{d.title}</a>
                        {!d.is_published && <Badge>Hidden</Badge>}
                      </div>
                      <div className="truncate text-xs text-ink-500">{[fileMeta(d.file_name, d.file_size), d.description].filter(Boolean).join(" · ")}</div>
                    </div>
                    <IconButton label={d.is_published ? "Hide" : "Publish"} tone="brand" disabled={pending}
                      onClick={() => run(() => setDownloadPublished(d.id, !d.is_published), d.is_published ? "Hidden" : "Published")}>
                      {d.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </IconButton>
                    <IconButton label="Edit" onClick={() => setEditing(d)}><Pencil className="h-4 w-4" /></IconButton>
                    <IconButton label="Delete" tone="danger" onClick={() => setConfirm(d)}><Trash2 className="h-4 w-4" /></IconButton>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {editing && (
        <DownloadForm initial={editing === "new" ? null : editing} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh(); }} />
      )}
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} loading={pending}
        title="Delete this document?" description="It is removed from the Downloads page and its file is deleted." confirmLabel="Delete"
        onConfirm={() => { const id = confirm!.id; setConfirm(null); run(() => deleteDownload(id), "Deleted"); }} />
    </div>
  );
}

function DownloadForm({ initial, onClose, onSaved }: { initial: DownloadItem | null; onClose: () => void; onSaved: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({
    title: initial?.title ?? "",
    title_mr: initial?.title_mr ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "circulars",
    file_url: initial?.file_url ?? "",
    file_name: initial?.file_name ?? null as string | null,
    file_size: initial?.file_size ?? null as number | null,
    is_published: initial?.is_published ?? true,
  });
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function upload(file: File) {
    if (file.size > MAX_BYTES) { toast.error("File must be under 25 MB"); return; }
    setUploading(true);
    try {
      const s = await startDownloadUpload(file.name);
      const { error } = await createSupabaseBrowser().storage.from(s.bucket)
        .uploadToSignedUrl(s.path, s.token, file, { contentType: file.type || undefined });
      if (error) throw new Error(error.message);
      setF((x) => ({
        ...x, file_url: s.url, file_name: file.name, file_size: file.size,
        // Suggest a title from the file name when it's empty.
        title: x.title || file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
      }));
    } catch (err) { toast.error((err as Error).message); }
    finally { setUploading(false); }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveDownload({ id: initial?.id ?? null, ...f });
        toast.success(initial ? "Saved" : "Document added");
        onSaved();
      } catch (err) { toast.error((err as Error).message); }
    });
  }

  return (
    <Modal open onClose={onClose} size="xl" title={initial ? "Edit document" : "Add document"} closeOnBackdrop={false}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <div className="mb-1.5 text-sm font-medium text-ink-700">File</div>
          {f.file_url ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm">
              <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-2 text-brand-700 hover:underline">
                <Paperclip className="h-4 w-4 flex-none" /> <span className="truncate">{f.file_name || "File"}</span>
                <span className="flex-none text-xs text-ink-500">{fileMeta(f.file_name, f.file_size)}</span>
              </a>
              <Button type="button" size="xs" variant="secondary" loading={uploading} onClick={() => fileRef.current?.click()}>Replace</Button>
            </div>
          ) : (
            <Button type="button" variant="secondary" loading={uploading} leftIcon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
              {uploading ? "Uploading…" : "Choose file (PDF, Word, Excel, PowerPoint, image)"}
            </Button>
          )}
          <input ref={fileRef} type="file" className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
            onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void upload(file); }} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Title (English)" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Academic calendar 2026-27" />
          <Input label="Title (मराठी, optional)" lang="mr" value={f.title_mr} onChange={(e) => setF({ ...f, title_mr: e.target.value })} />
        </div>
        <div>
          <div className="mb-1.5 text-sm font-medium text-ink-700">Category</div>
          <div className="flex flex-wrap gap-1.5">
            {DOWNLOAD_CATEGORIES.map((c) => (
              <button key={c.key} type="button" onClick={() => setF({ ...f, category: c.key })} aria-pressed={f.category === c.key}
                className={cn("h-8 rounded-lg border px-3 text-xs font-medium",
                  f.category === c.key ? "border-brand-500 bg-brand-50 text-brand-800" : "border-ink-200 text-ink-700 hover:bg-ink-50")}>
                {c.en} · {c.mr}
              </button>
            ))}
          </div>
        </div>
        <Input label="Short note (optional)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="e.g. For Std 5th to 10th" />
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={f.is_published} onChange={(e) => setF({ ...f, is_published: e.target.checked })}
            className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
          Show on the Downloads page
        </label>
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={pending} disabled={uploading || !f.file_url}>{initial ? "Save" : "Add document"}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
