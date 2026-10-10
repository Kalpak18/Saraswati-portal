"use client";

import { clientAction } from "@/lib/clientAction";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, GripVertical, Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { moveItem, useDragSort } from "@/components/ui/useDragSort";
import { cn } from "@/lib/utils";
import {
  saveMember as saveMemberAction, deleteMember as deleteMemberAction,
  reorderMembers as reorderMembersAction, uploadMemberPhoto as uploadMemberPhotoAction,
} from "./actions";

// Server actions return { ok, error }; these wrappers throw the real message (see lib/clientAction.ts).
const saveMember = clientAction(saveMemberAction);
const deleteMember = clientAction(deleteMemberAction);
const reorderMembers = clientAction(reorderMembersAction);
const uploadMemberPhoto = clientAction(uploadMemberPhotoAction);

export type Member = {
  id: string;
  name: string;
  designation: string;
  designation_mr?: string | null;
  qualification?: string | null;
  subjects?: string | null;
  bio: string;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  show_contact?: boolean;
  category: string;
  is_active: boolean;
  display_order: number;
};

const CATEGORIES = [
  { key: "leadership", label: "Leadership" },
  { key: "management", label: "Management" },
  { key: "faculty", label: "Teachers" },
  { key: "staff", label: "Support staff" },
] as const;

export default function TeamClient({ members, columnsReady }: { members: Member[]; columnsReady: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Member | "new" | null>(null);
  const [confirm, setConfirm] = useState<Member | null>(null);

  function run(fn: () => Promise<unknown>, ok?: string) {
    startTransition(async () => {
      try { await fn(); if (ok) toast.success(ok); router.refresh(); }
      catch (err) { toast.error((err as Error).message); }
    });
  }
  const moveTo = (from: number, to: number) => run(() => reorderMembers(moveItem(members.map((m) => m.id), from, to)));
  const drag = useDragSort(members.length, (f, t) => { if (!pending) moveTo(f, t); });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumbs={[{ label: "Website", href: "/admin/website" }, { label: "Team" }]}
        title="Team"
        description="Leadership, teachers and staff shown on the Faculty page. Drag to set the order."
        actions={
          <>
            <Link href="/academics/faculty" target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3.5 text-sm text-ink-700 shadow-sm hover:bg-ink-50">
              <ExternalLink className="h-4 w-4" /> View live
            </Link>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>Add person</Button>
          </>
        }
      />

      {!columnsReady && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Run <code className="rounded bg-white px-1">supabase/launch.sql</code> in Supabase to enable qualification, subjects and Marathi roles.
        </div>
      )}

      {members.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white shadow-sm">
          <EmptyState icon={<Users className="h-6 w-6" />} title="No team members yet"
            description="Add the principal, teachers and staff — they appear on the Faculty page."
            action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>Add person</Button>} />
        </div>
      ) : (
        <ul className="space-y-2">
          {members.map((m, i) => (
            <li key={m.id} {...drag.itemProps(i)}
              className={cn("flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm transition-all",
                m.is_active ? "border-ink-200" : "border-dashed border-ink-200 opacity-60",
                "data-dragging:opacity-40 data-drop-target:border-brand-500 data-drop-target:ring-2 data-drop-target:ring-brand-200")}>
              <span {...drag.handleProps(i)} className="hidden rounded p-1 text-ink-300 hover:bg-ink-100 sm:block" title="Drag to reorder">
                <GripVertical className="h-4 w-4" />
              </span>
              <div className="h-12 w-12 flex-none overflow-hidden rounded-full bg-brand-50 ring-1 ring-ink-100">
                {m.photo_url
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={m.photo_url} alt="" className="h-full w-full object-cover" />
                  : <UserRound className="m-3 h-6 w-6 text-brand-300" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-ink-900">{m.name}</span>
                  <Badge>{CATEGORIES.find((c) => c.key === m.category)?.label ?? m.category}</Badge>
                  {!m.is_active && <Badge>Hidden</Badge>}
                </div>
                <div className="truncate text-xs text-ink-500">{[m.designation, m.subjects].filter(Boolean).join(" · ")}</div>
              </div>
              <div className="flex items-center gap-1">
                <IconButton label="Move up" disabled={i === 0 || pending} onClick={() => moveTo(i, i - 1)}><ArrowUp className="h-4 w-4" /></IconButton>
                <IconButton label="Move down" disabled={i === members.length - 1 || pending} onClick={() => moveTo(i, i + 1)}><ArrowDown className="h-4 w-4" /></IconButton>
                <IconButton label="Edit" onClick={() => setEditing(m)}><Pencil className="h-4 w-4" /></IconButton>
                <IconButton label="Delete" tone="danger" onClick={() => setConfirm(m)}><Trash2 className="h-4 w-4" /></IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <MemberForm initial={editing === "new" ? null : editing} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh(); }} />
      )}

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} loading={pending}
        title={`Remove ${confirm?.name ?? ""}?`} description="They are removed from the Faculty page. To keep them but hide them, edit and untick “Show on website”."
        confirmLabel="Remove"
        onConfirm={() => { const id = confirm!.id; setConfirm(null); run(() => deleteMember(id), "Removed"); }} />
    </div>
  );
}

function MemberForm({ initial, onClose, onSaved }: { initial: Member | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    designation: initial?.designation ?? "",
    designation_mr: initial?.designation_mr ?? "",
    qualification: initial?.qualification ?? "",
    subjects: initial?.subjects ?? "",
    bio: initial?.bio ?? "",
    photo_url: initial?.photo_url ?? null as string | null,
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    show_contact: initial?.show_contact ?? false,
    category: (initial?.category ?? "faculty") as Member["category"],
    is_active: initial?.is_active ?? true,
  });
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveMember({ id: initial?.id ?? null, ...f });
        toast.success(initial ? "Saved" : "Added");
        onSaved();
      } catch (err) { toast.error((err as Error).message); }
    });
  }

  return (
    <Modal open onClose={onClose} size="2xl" title={initial ? `Edit ${initial.name}` : "Add person"} closeOnBackdrop={false}>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[180px_1fr]">
          <ImageUpload aspect="square" value={f.photo_url} onChange={(u) => set("photo_url", u)}
            onUpload={uploadMemberPhoto} maxDimension={800} label="Photo" hint="Square, face centred." />
          <div className="space-y-4">
            <Input label="Name" required value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Smt. Sunita Patil" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Role (English)" required value={f.designation} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. Principal" />
              <Input label="Role (मराठी)" lang="mr" value={f.designation_mr} onChange={(e) => set("designation_mr", e.target.value)} placeholder="e.g. मुख्याध्यापिका" />
            </div>
            <div>
              <div className="mb-1.5 text-sm font-medium text-ink-700">Group</div>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button key={c.key} type="button" onClick={() => set("category", c.key)} aria-pressed={f.category === c.key}
                    className={cn("h-8 rounded-lg border px-3 text-xs font-medium",
                      f.category === c.key ? "border-brand-500 bg-brand-50 text-brand-800" : "border-ink-200 text-ink-700 hover:bg-ink-50")}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Qualification (optional)" value={f.qualification} onChange={(e) => set("qualification", e.target.value)} placeholder="e.g. M.Sc., B.Ed." />
          <Input label="Subjects (optional)" value={f.subjects} onChange={(e) => set("subjects", e.target.value)} placeholder="e.g. Mathematics, Science" />
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink-700">Short bio (optional)</span>
          <textarea rows={3} value={f.bio} onChange={(e) => set("bio", e.target.value)}
            className="block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm shadow-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Email (optional)" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
          <Input label="Phone (optional)" type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={f.show_contact} onChange={(e) => set("show_contact", e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
            Show email &amp; phone on the website
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
            Show on website
          </label>
        </div>
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={pending}>{initial ? "Save" : "Add person"}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
