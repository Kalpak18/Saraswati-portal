"use client";

import { clientAction } from "@/lib/clientAction";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowDown, ArrowUp, Copy, ExternalLink, Eye, EyeOff, GripVertical, Image as ImageIcon, LayoutTemplate, Lock, Pencil, Plus, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { PAGES, kindSpec, kindsForPage, pick, type HomeSection, type SectionKind, type SitePage } from "@/lib/homeSections";
import { cn } from "@/lib/utils";
import { moveItem, useDragSort } from "@/components/ui/useDragSort";
import { addSection as addSectionAction, deleteSection as deleteSectionAction, duplicateSection as duplicateSectionAction, initPageLayout as initPageLayoutAction, reorderSections as reorderSectionsAction, setSectionVisible as setSectionVisibleAction } from "./actions";
import SectionEditor from "./SectionEditor";

// Server actions return { ok, error }; these wrappers throw the real message (see lib/clientAction.ts).
const addSection = clientAction(addSectionAction);
const deleteSection = clientAction(deleteSectionAction);
const duplicateSection = clientAction(duplicateSectionAction);
const initPageLayout = clientAction(initPageLayoutAction);
const reorderSections = clientAction(reorderSectionsAction);
const setSectionVisible = clientAction(setSectionVisibleAction);

export default function HomeBuilderClient({
  page, sections, saved, exams,
}: { page: SitePage; sections: HomeSection[]; saved: boolean; exams: string[] }) {
  const meta = PAGES.find((p) => p.page === page)!;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<HomeSection | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState<HomeSection | null>(null);
  const initOnce = useRef(false);
  const [pendingOpen, setPendingOpen] = useState<string | null>(null);

  // First visit: save the built-in layout so every section has a real row.
  useEffect(() => {
    if (saved || initOnce.current) return;
    initOnce.current = true;
    initPageLayout(page)
      .then(() => router.refresh())
      .catch((err) => toast.error((err as Error).message));
  }, [saved, router, page]);

  function run(fn: () => Promise<unknown>, ok?: string) {
    startTransition(async () => {
      try { await fn(); if (ok) toast.success(ok); router.refresh(); }
      catch (err) { toast.error((err as Error).message); }
    });
  }

  function moveTo(from: number, to: number) {
    const ids = moveItem(sections.map((s) => s.id), from, to);
    run(() => reorderSections(ids));
  }
  const move = (i: number, dir: -1 | 1) => moveTo(i, i + dir);
  const drag = useDragSort(sections.length, (from, to) => { if (!locked && !pending) moveTo(from, to); });

  function add(kind: SectionKind) {
    setAdding(false);
    startTransition(async () => {
      try {
        const { id } = await addSection(kind, page);
        toast.success(`${kindSpec(kind)!.label} added at the bottom`);
        router.refresh();
        // Open the editor on the new section once the list has it.
        setPendingOpen(id);
      } catch (err) { toast.error((err as Error).message); }
    });
  }
  useEffect(() => {
    if (!pendingOpen) return;
    const s = sections.find((x) => x.id === pendingOpen);
    if (s) {
      const id = requestAnimationFrame(() => { setEditing(s); setPendingOpen(null); });
      return () => cancelAnimationFrame(id);
    }
  }, [pendingOpen, sections]);

  const locked = !saved; // rows are being created

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumbs={[{ label: "Website", href: "/admin/website" }, { label: meta.label }]}
        title={meta.label}
        description={`Arrange the ${meta.label.toLowerCase()} top to bottom — drag sections or use the arrows. Add, hide, rename or delete any section; changes go live on save.`}
        actions={
          <>
            <Link href={meta.href} target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3.5 text-sm text-ink-700 shadow-sm hover:bg-ink-50">
              <ExternalLink className="h-4 w-4" /> View live
            </Link>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)} disabled={locked}>
              Add section
            </Button>
          </>
        }
      />

      <nav aria-label="Pages" className="mb-4 flex gap-2">
        {PAGES.map((p) => (
          <Link key={p.page} href={p.admin} aria-current={p.page === page ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition-colors",
              p.page === page ? "bg-brand-700 text-white ring-brand-700" : "bg-white text-ink-700 ring-ink-200 hover:bg-ink-50",
            )}>
            {p.label}
          </Link>
        ))}
      </nav>

      <ol className="space-y-2">
        {/* The hero always opens the home page. */}
        {page === "home" && <li className="flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50 p-4">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-ink-900 text-white">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-ink-900">Hero — school photo or video</div>
            <div className="text-xs text-ink-500">Always first. Edited on its own page.</div>
          </div>
          <Lock className="h-4 w-4 text-ink-400" aria-label="Fixed position" />
          <Link href="/admin/website/hero">
            <Button size="xs" variant="secondary" leftIcon={<Pencil className="h-3.5 w-3.5" />}>Edit</Button>
          </Link>
        </li>}

        {sections.map((s, i) => {
          const spec = kindSpec(s.kind)!;
          const heading = pick(s.content.title, "en") || pick(s.content.eyebrow, "en") || pick(s.content.body, "en").slice(0, 60);
          const count = spec.items ? s.items.length : null;
          return (
            <li key={s.id} {...drag.itemProps(i)}
              className={cn(
                "flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm transition-all sm:flex-row sm:items-center",
                s.is_visible ? "border-ink-200" : "border-dashed border-ink-200 opacity-60",
                "data-dragging:opacity-40 data-drop-target:border-brand-500 data-drop-target:ring-2 data-drop-target:ring-brand-200",
              )}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span {...drag.handleProps(i)} className="hidden flex-none rounded p-1 text-ink-300 hover:bg-ink-100 hover:text-ink-600 sm:block" title="Drag to reorder">
                  <GripVertical className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="w-6 flex-none text-center text-xs font-semibold tabular-nums text-ink-400">{i + 1}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-ink-900">{heading || spec.label}</span>
                    {!s.is_visible && <Badge>Hidden</Badge>}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    {spec.label}
                    {spec.dataDriven && " · fills automatically"}
                    {count != null && count > 0 && ` · ${count} item${count === 1 ? "" : "s"}`}
                    {s.config.display && s.config.display !== "cards" && ` · ${s.config.display === "banners" ? "your banners" : "banners + cards"}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 self-end sm:self-center">
                <IconButton label="Move up" disabled={i === 0 || pending || locked} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></IconButton>
                <IconButton label="Move down" disabled={i === sections.length - 1 || pending || locked} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></IconButton>
                <IconButton label={s.is_visible ? "Hide" : "Show"} tone="brand" disabled={pending || locked}
                  onClick={() => run(() => setSectionVisible(s.id, !s.is_visible), s.is_visible ? "Hidden" : "Shown")}>
                  {s.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </IconButton>
                <IconButton label="Edit" disabled={locked} onClick={() => setEditing(s)}><Pencil className="h-4 w-4" /></IconButton>
                <IconButton label="Duplicate" disabled={locked || pending}
                  onClick={() => run(() => duplicateSection(s.id), "Section duplicated below")}>
                  <Copy className="h-4 w-4" />
                </IconButton>
                <IconButton label="Delete" tone="danger" disabled={locked} onClick={() => setConfirm(s)}><Trash2 className="h-4 w-4" /></IconButton>
              </div>
            </li>
          );
        })}
      </ol>

      {locked && <p className="mt-4 text-sm text-ink-500">Preparing your editable layout…</p>}

      {/* Add section picker */}
      <Modal open={adding} onClose={() => setAdding(false)} size="2xl" title="Add a section"
        description="Pick what the section shows. You can rename it and move it afterwards.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {kindsForPage(page).map((k) => (
            <button key={k.kind} type="button" onClick={() => add(k.kind)}
              className="flex flex-col items-start gap-1 rounded-xl border border-ink-200 p-4 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/50">
              <span className="flex items-center gap-2 font-medium text-ink-900">
                <LayoutTemplate className="h-4 w-4 text-brand-700" /> {k.label}
              </span>
              <span className="text-xs text-ink-500">{k.description}</span>
            </button>
          ))}
        </div>
      </Modal>

      {editing && (
        <SectionEditor
          section={editing}
          exams={exams}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh(); }}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={`Delete “${confirm ? pick(confirm.content.title, "en") || kindSpec(confirm.kind)!.label : ""}”?`}
        description="The section is removed from the home page. Its data (events, results, notices) is not touched — you can add the section back any time."
        confirmLabel="Delete section"
        loading={pending}
        onConfirm={() => { const id = confirm!.id; setConfirm(null); run(() => deleteSection(id), "Section deleted"); }}
      />
    </div>
  );
}
