"use client";

import { clientAction } from "@/lib/clientAction";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Eye, EyeOff, ExternalLink, FileText, Megaphone, Paperclip, Pencil, Pin, PinOff, Plus, Trash2, X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { NOTICE_CATEGORIES, noticeCategory } from "@/lib/notices";
import { cn } from "@/lib/utils";
import { saveNotice as saveNoticeAction, deleteNotice as deleteNoticeAction, setNoticeFlags as setNoticeFlagsAction, startNoticeUpload as startNoticeUploadAction } from "./actions";

// Server actions return { ok, error }; these wrappers throw the real message (see lib/clientAction.ts).
const saveNotice = clientAction(saveNoticeAction);
const deleteNotice = clientAction(deleteNoticeAction);
const setNoticeFlags = clientAction(setNoticeFlagsAction);
const startNoticeUpload = clientAction(startNoticeUploadAction);

export type AdminNotice = {
  id: string;
  title: string;
  body: string;
  category: string;
  link_href: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  is_pinned: boolean;
  is_published: boolean;
  publish_on: string;
  expires_on: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

function status(n: AdminNotice): { label: string; tone: "green" | "gray" | "amber" | "red" } {
  const d = today();
  if (!n.is_published) return { label: "Hidden", tone: "gray" };
  if (n.publish_on > d) return { label: `From ${n.publish_on}`, tone: "amber" };
  if (n.expires_on && n.expires_on < d) return { label: "Expired", tone: "red" };
  return { label: "Live", tone: "green" };
}

export default function NoticesClient({ notices }: { notices: AdminNotice[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<AdminNotice | "new" | null>(null);
  const [confirm, setConfirm] = useState<AdminNotice | null>(null);
  const [filter, setFilter] = useState("");

  const visible = useMemo(() => notices.filter((n) => !filter || n.category === filter), [notices, filter]);

  function run(fn: () => Promise<unknown>, ok: string) {
    startTransition(async () => {
      try { await fn(); toast.success(ok); router.refresh(); }
      catch (err) { toast.error((err as Error).message); }
    });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        breadcrumbs={[{ label: "Website", href: "/admin/website" }, { label: "Notices" }]}
        title="Notice board"
        description="Admission, result, exam and holiday updates. Pinned notices scroll across the top of the home page."
        actions={
          <>
            <Link href="/notices" target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3.5 text-sm text-ink-700 shadow-sm hover:bg-ink-50">
              <ExternalLink className="h-4 w-4" /> View live
            </Link>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>New notice</Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {[{ key: "", en: "All" }, ...NOTICE_CATEGORIES].map((c) => (
          <button key={c.key} type="button" onClick={() => setFilter(c.key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors",
              filter === c.key ? "bg-brand-700 text-white ring-brand-700" : "bg-white text-ink-700 ring-ink-200 hover:bg-ink-50",
            )}>
            {c.en}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white shadow-sm">
          <EmptyState
            icon={<Megaphone className="h-6 w-6" />}
            title={notices.length ? "No notices in this category" : "No notices yet"}
            description={notices.length ? undefined : "Post an admission date, a result announcement or a holiday notice."}
            action={notices.length ? undefined : <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>New notice</Button>}
          />
        </div>
      ) : (
        <ul className="divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
          {visible.map((n) => {
            const cat = noticeCategory(n.category);
            const st = status(n);
            return (
              <li key={n.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {n.is_pinned && <Pin className="h-3.5 w-3.5 fill-accent-400 text-accent-500" aria-label="Pinned" />}
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1", cat.tone)}>{cat.en}</span>
                    <Badge tone={st.tone}>{st.label}</Badge>
                    <span className="text-xs tabular-nums text-ink-500">
                      {n.publish_on}{n.expires_on ? ` → ${n.expires_on}` : ""}
                    </span>
                  </div>
                  <div className="mt-1.5 font-medium text-ink-900">{n.title}</div>
                  {n.body && <p className="mt-1 line-clamp-2 text-sm text-ink-600">{n.body}</p>}
                  {n.attachment_url && (
                    <a href={n.attachment_url} target="_blank" rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                      <Paperclip className="h-3.5 w-3.5" /> {n.attachment_name || "Attachment"}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1 self-end sm:self-start">
                  <IconButton label={n.is_pinned ? "Unpin" : "Pin to top"} tone="brand" disabled={pending}
                    onClick={() => run(() => setNoticeFlags(n.id, { is_pinned: !n.is_pinned }), n.is_pinned ? "Unpinned" : "Pinned")}>
                    {n.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </IconButton>
                  <IconButton label={n.is_published ? "Hide" : "Publish"} tone="brand" disabled={pending}
                    onClick={() => run(() => setNoticeFlags(n.id, { is_published: !n.is_published }), n.is_published ? "Hidden" : "Published")}>
                    {n.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </IconButton>
                  <IconButton label="Edit" onClick={() => setEditing(n)}><Pencil className="h-4 w-4" /></IconButton>
                  <IconButton label="Delete" tone="danger" onClick={() => setConfirm(n)}><Trash2 className="h-4 w-4" /></IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <NoticeForm
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh(); }}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Delete this notice?"
        description="It is removed from the website and its attachment is deleted."
        confirmLabel="Delete"
        loading={pending}
        onConfirm={() => { const id = confirm!.id; setConfirm(null); run(() => deleteNotice(id), "Notice deleted"); }}
      />
    </div>
  );
}

function NoticeForm({ initial, onClose, onSaved }: { initial: AdminNotice | null; onClose: () => void; onSaved: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({
    title: initial?.title ?? "",
    body: initial?.body ?? "",
    category: initial?.category ?? "admission",
    link_href: initial?.link_href ?? "",
    attachment_url: initial?.attachment_url ?? null as string | null,
    attachment_name: initial?.attachment_name ?? null as string | null,
    is_pinned: initial?.is_pinned ?? false,
    is_published: initial?.is_published ?? true,
    publish_on: initial?.publish_on ?? today(),
    expires_on: initial?.expires_on ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function attach(file: File) {
    if (file.size > 20 * 1024 * 1024) { toast.error("Attachment must be under 20 MB"); return; }
    setUploading(true);
    try {
      const s = await startNoticeUpload(file.name);
      const { error } = await createSupabaseBrowser().storage.from(s.bucket)
        .uploadToSignedUrl(s.path, s.token, file, { contentType: file.type || undefined });
      if (error) throw new Error(error.message);
      setF((x) => ({ ...x, attachment_url: s.url, attachment_name: file.name }));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveNotice({
          id: initial?.id ?? null,
          ...f,
          link_href: f.link_href.trim() || null,
          expires_on: f.expires_on || null,
        });
        toast.success(initial ? "Notice updated" : "Notice posted");
        onSaved();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <Modal open onClose={onClose} size="xl" title={initial ? "Edit notice" : "New notice"}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <div className="mb-1.5 text-sm font-medium text-ink-700">Type</div>
          <div className="flex flex-wrap gap-2">
            {NOTICE_CATEGORIES.map((c) => (
              <button key={c.key} type="button" onClick={() => setF({ ...f, category: c.key })}
                aria-pressed={f.category === c.key}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-all",
                  f.category === c.key ? cn(c.tone, "ring-2") : "bg-white text-ink-600 ring-ink-200 hover:bg-ink-50",
                )}>
                {c.en} · {c.mr}
              </button>
            ))}
          </div>
        </div>
        <Input label="Title" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })}
          placeholder="e.g. Admissions open for 2027-28 · Std 5th to 10th" />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink-700">Details</span>
          <textarea rows={4} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })}
            placeholder="Dates, documents required, timings, who to contact…"
            className="block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm shadow-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Show from" type="date" required value={f.publish_on}
            onChange={(e) => setF({ ...f, publish_on: e.target.value })} />
          <Input label="Remove after (optional)" type="date" value={f.expires_on}
            onChange={(e) => setF({ ...f, expires_on: e.target.value })} hint="Leave blank to keep it up." />
        </div>

        <Input label="Link (optional)" placeholder="/lookup or https://…" value={f.link_href}
          onChange={(e) => setF({ ...f, link_href: e.target.value })}
          hint="e.g. /lookup for a result notice, or an online admission form." />

        <div>
          <div className="mb-1.5 text-sm font-medium text-ink-700">Attachment (optional)</div>
          {f.attachment_url ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm">
              <a href={f.attachment_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center gap-2 text-brand-700 hover:underline">
                <FileText className="h-4 w-4 flex-none" /> <span className="truncate">{f.attachment_name || "Attachment"}</span>
              </a>
              <IconButton label="Remove attachment" tone="danger" size="sm"
                onClick={() => setF({ ...f, attachment_url: null, attachment_name: null })}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
          ) : (
            <Button type="button" variant="secondary" size="sm" loading={uploading}
              leftIcon={<Paperclip className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
              {uploading ? "Uploading…" : "Attach PDF or photo of the notice"}
            </Button>
          )}
          <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void attach(file); }} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={f.is_pinned} onChange={(e) => setF({ ...f, is_pinned: e.target.checked })}
              className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
            Pin to top & scroll on the home page
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={f.is_published} onChange={(e) => setF({ ...f, is_published: e.target.checked })}
              className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
            Published
          </label>
        </div>

        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={pending} disabled={uploading}>{initial ? "Save" : "Post notice"}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
