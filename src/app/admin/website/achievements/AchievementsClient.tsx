"use client";

import { clientAction } from "@/lib/clientAction";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ExternalLink, Eye, EyeOff, FileUp, Medal, Pencil, Plus, Search, Trash2, Trophy, Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { ImageUpload } from "@/components/ui/ImageUpload";
import {
  CATEGORIES, LEVELS, categoryLabel, levelLabel, levelRank, detectMedal, ordinal,
} from "@/lib/achievements";
import { parseNum } from "@/lib/i18n/normalize";
import { saveAchievement as saveAchievementAction, deleteAchievements as deleteAchievementsAction, setAchievementsPublished as setAchievementsPublishedAction, deleteImportBatch as deleteImportBatchAction, uploadAchievementImage as uploadAchievementImageAction } from "./actions";
import { StudentPicker } from "./StudentPicker";
import type { RosterStudent } from "./roster";

// Server actions return { ok, error }; these wrappers throw the real message (see lib/clientAction.ts).
const saveAchievement = clientAction(saveAchievementAction);
const deleteAchievements = clientAction(deleteAchievementsAction);
const setAchievementsPublished = clientAction(setAchievementsPublishedAction);
const deleteImportBatch = clientAction(deleteImportBatchAction);
const uploadAchievementImage = clientAction(uploadAchievementImageAction);

export type AchievementRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  achieved_on: string | null;
  photo_url: string | null;
  student_id: string | null;
  student_name: string | null;
  standard_label: string | null;
  exam_name: string | null;
  level: string | null;
  rank: number | null;
  score: number | null;
  max_score: number | null;
  award: string | null;
  medal: string | null;
  academic_year: string | null;
  is_published: boolean;
  import_batch_id: string | null;
};

export type ImportRow = {
  id: string;
  file_name: string | null;
  exam_name: string | null;
  uploaded_at: string;
  rows_inserted: number;
  rows_updated: number;
};

const LEVEL_TONE: Record<string, "gray" | "brand" | "blue" | "purple" | "accent"> = {
  school: "gray", centre: "gray", taluka: "gray", district: "blue",
  division: "blue", state: "brand", national: "purple", international: "accent",
};

export default function AchievementsClient({
  rows, imports, roster,
}: { rows: AchievementRow[]; imports: ImportRow[]; roster: RosterStudent[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [exam, setExam] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<AchievementRow | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);
  const [confirmUndo, setConfirmUndo] = useState<ImportRow | null>(null);

  const exams = useMemo(
    () => Array.from(new Set(rows.map((r) => r.exam_name).filter(Boolean) as string[])).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (category && r.category !== category) return false;
      if (exam && r.exam_name !== exam) return false;
      if (!needle) return true;
      return [r.title, r.student_name, r.exam_name, r.award, r.standard_label]
        .some((v) => v?.toLowerCase().includes(needle));
    });
  }, [rows, q, category, exam]);

  const stats = useMemo(() => ({
    total: rows.length,
    published: rows.filter((r) => r.is_published).length,
    statePlus: rows.filter((r) => levelRank(r.level) >= levelRank("state")).length,
    exams: exams.length,
  }), [rows, exams]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(filtered.map((r) => r.id)));
  const toggle = (id: string) =>
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  function run(fn: () => Promise<unknown>, ok: string) {
    startTransition(async () => {
      try {
        await fn();
        toast.success(ok);
        setSelected(new Set());
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  const selectedIds = Array.from(selected);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        breadcrumbs={[{ label: "Website", href: "/admin/website" }, { label: "Achievements" }]}
        title="Achievements"
        description="Competitive-exam results, awards and highlights shown on the school website."
        actions={
          <>
            <Link
              href="/achievements"
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3.5 text-sm text-ink-700 shadow-sm hover:bg-ink-50"
            >
              <ExternalLink className="h-4 w-4" /> View live
            </Link>
            <Button variant="secondary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing("new")}>
              Add manually
            </Button>
            <Link href="/admin/website/achievements/import">
              <Button size="sm" leftIcon={<FileUp className="h-4 w-4" />}>Import results</Button>
            </Link>
          </>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total", value: stats.total },
          { label: "Published", value: stats.published },
          { label: "State level +", value: stats.statePlus },
          { label: "Exams / events", value: stats.exams },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm">
            <div className="text-[11px] font-medium uppercase tracking-wider text-ink-500">{s.label}</div>
            <div className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_220px]">
        <Input
          placeholder="Search name, exam, award…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          leftAdornment={<Search className="h-4 w-4" />}
          aria-label="Search achievements"
        />
        <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className="h-[42px]">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.en}</option>)}
        </Select>
        <Select value={exam} onChange={(e) => setExam(e.target.value)} aria-label="Exam" className="h-[42px]">
          <option value="">All exams / events</option>
          {exams.map((x) => <option key={x} value={x}>{x}</option>)}
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900">
          <span className="font-medium">{selected.size} selected</span>
          <span className="flex-1" />
          <Button size="xs" variant="secondary" loading={pending} leftIcon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => run(() => setAchievementsPublished(selectedIds, true), "Published")}>
            Publish
          </Button>
          <Button size="xs" variant="secondary" loading={pending} leftIcon={<EyeOff className="h-3.5 w-3.5" />}
            onClick={() => run(() => setAchievementsPublished(selectedIds, false), "Hidden from website")}>
            Hide
          </Button>
          <Button size="xs" variant="danger" leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => setConfirmDelete(selectedIds)}>
            Delete
          </Button>
        </div>
      )}

      <ResponsiveTable
        head={
          <>
            <th className="w-10 px-4 py-3">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all"
                className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
            </th>
            <th className="px-4 py-3">Student / title</th>
            <th className="px-4 py-3">Exam / event</th>
            <th className="px-4 py-3">Result</th>
            <th className="px-4 py-3">Level</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </>
        }
        empty={
          <EmptyState
            icon={<Trophy className="h-6 w-6" />}
            title={rows.length ? "Nothing matches these filters" : "No achievements yet"}
            description={rows.length ? undefined : "Import an Olympiad, NMMS, scholarship or sports result sheet, or add one by hand."}
            action={rows.length ? undefined : (
              <Link href="/admin/website/achievements/import">
                <Button leftIcon={<FileUp className="h-4 w-4" />}>Import results</Button>
              </Link>
            )}
          />
        }
        rows={filtered.map((r) => ({
          key: r.id,
          cells: (
            <>
              <td className="px-4 py-3">
                <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)}
                  aria-label={`Select ${r.student_name ?? r.title}`}
                  className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-ink-900">{r.student_name || r.title}</div>
                <div className="text-xs text-ink-500">
                  {[r.standard_label, categoryLabel(r.category, "en")].filter(Boolean).join(" · ")}
                  {!r.student_id && r.student_name && <span className="ml-1 text-amber-600">· not linked</span>}
                </div>
              </td>
              <td className="px-4 py-3 text-ink-700">
                <div>{r.exam_name ?? r.title}</div>
                <div className="text-xs tabular-nums text-ink-500">{r.academic_year ?? r.achieved_on ?? ""}</div>
              </td>
              <td className="px-4 py-3"><ResultCell r={r} /></td>
              <td className="px-4 py-3">
                {r.level ? <Badge tone={LEVEL_TONE[r.level] ?? "gray"}>{levelLabel(r.level, "en")}</Badge> : <span className="text-ink-300">—</span>}
              </td>
              <td className="px-4 py-3">
                {r.is_published ? <Badge tone="green">Live</Badge> : <Badge>Hidden</Badge>}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <IconButton label={r.is_published ? "Hide from website" : "Publish"} tone="brand" disabled={pending}
                    onClick={() => run(() => setAchievementsPublished([r.id], !r.is_published), r.is_published ? "Hidden" : "Published")}>
                    {r.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </IconButton>
                  <IconButton label="Edit" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></IconButton>
                  <IconButton label="Delete" tone="danger" onClick={() => setConfirmDelete([r.id])}><Trash2 className="h-4 w-4" /></IconButton>
                </div>
              </td>
            </>
          ),
          mobile: (
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)}
                aria-label={`Select ${r.student_name ?? r.title}`}
                className="mt-1 h-4 w-4 rounded border-ink-300 text-brand-700" />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-ink-900">{r.student_name || r.title}</div>
                <div className="text-xs text-ink-500">{r.exam_name ?? r.title} · {r.academic_year ?? ""}</div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <ResultCell r={r} />
                  {r.level && <Badge tone={LEVEL_TONE[r.level] ?? "gray"}>{levelLabel(r.level, "en")}</Badge>}
                  {r.is_published ? <Badge tone="green">Live</Badge> : <Badge>Hidden</Badge>}
                </div>
              </div>
              <div className="flex flex-col">
                <IconButton label="Edit" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></IconButton>
                <IconButton label="Delete" tone="danger" onClick={() => setConfirmDelete([r.id])}><Trash2 className="h-4 w-4" /></IconButton>
              </div>
            </div>
          ),
        }))}
      />

      {imports.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Recent imports</h2>
          <ul className="divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
            {imports.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <FileUp className="h-4 w-4 flex-none text-ink-400" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-ink-800">{b.exam_name || b.file_name}</div>
                  <div className="text-xs text-ink-500">
                    {b.file_name} · {new Date(b.uploaded_at).toLocaleString()} · {b.rows_inserted} added, {b.rows_updated} updated
                  </div>
                </div>
                <Button size="xs" variant="ghost" leftIcon={<Undo2 className="h-3.5 w-3.5" />} onClick={() => setConfirmUndo(b)}>
                  Undo
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {editing && (
        <AchievementForm
          initial={editing === "new" ? null : editing}
          roster={roster}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh(); }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        loading={pending}
        title={`Delete ${confirmDelete?.length ?? 0} achievement${confirmDelete?.length === 1 ? "" : "s"}?`}
        description="They will be removed from the website immediately. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          const ids = confirmDelete!;
          setConfirmDelete(null);
          run(() => deleteAchievements(ids), "Deleted");
        }}
      />
      <ConfirmDialog
        open={!!confirmUndo}
        onClose={() => setConfirmUndo(null)}
        loading={pending}
        title="Undo this import?"
        description={`Every achievement added or last updated by "${confirmUndo?.file_name ?? "this file"}" will be deleted.`}
        confirmLabel="Undo import"
        onConfirm={() => {
          const id = confirmUndo!.id;
          setConfirmUndo(null);
          run(() => deleteImportBatch(id), "Import removed");
        }}
      />
    </div>
  );
}

function ResultCell({ r }: { r: AchievementRow }) {
  const bits: React.ReactNode[] = [];
  if (r.medal) {
    const tone = r.medal === "gold" ? "text-amber-600" : r.medal === "silver" ? "text-ink-500" : "text-orange-700";
    bits.push(<Medal key="m" className={`h-4 w-4 ${tone}`} aria-label={`${r.medal} medal`} />);
  }
  if (r.rank) bits.push(<span key="r" className="font-semibold text-ink-900">{ordinal(r.rank, "en")}</span>);
  if (r.score != null) {
    bits.push(
      <span key="s" className="tabular-nums text-ink-700">
        {r.score}{r.max_score != null ? `/${r.max_score}` : ""}
      </span>,
    );
  }
  if (r.award) bits.push(<span key="a" className="text-ink-600">{r.award}</span>);
  if (bits.length === 0) return <span className="text-ink-300">—</span>;
  return <span className="inline-flex flex-wrap items-center gap-1.5 text-sm">{bits}</span>;
}

// ============================================================
// Add / edit form
// ============================================================
type FormState = {
  title: string; description: string; category: string;
  student_id: string | null; student_name: string; standard_label: string;
  exam_name: string; level: string; rank: string; score: string; max_score: string;
  award: string; achieved_on: string; academic_year: string;
  photo_url: string | null; is_published: boolean;
};

function toForm(r: AchievementRow | null): FormState {
  return {
    title: r?.title ?? "",
    description: r?.description ?? "",
    category: r?.category ?? "competitive",
    student_id: r?.student_id ?? null,
    student_name: r?.student_name ?? "",
    standard_label: r?.standard_label ?? "",
    exam_name: r?.exam_name ?? "",
    level: r?.level ?? "",
    rank: r?.rank?.toString() ?? "",
    score: r?.score?.toString() ?? "",
    max_score: r?.max_score?.toString() ?? "",
    award: r?.award ?? "",
    achieved_on: r?.achieved_on ?? "",
    academic_year: r?.academic_year ?? "",
    photo_url: r?.photo_url ?? null,
    is_published: r?.is_published ?? true,
  };
}

function AchievementForm({
  initial, roster, onClose, onSaved,
}: {
  initial: AchievementRow | null;
  roster: RosterStudent[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<FormState>(toForm(initial));
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const title = f.title.trim() || f.exam_name.trim();
    if (!title) { toast.error("Enter a title or an exam / event name"); return; }
    startTransition(async () => {
      try {
        const rank = parseNum(f.rank);
        await saveAchievement({
          id: initial?.id ?? null,
          title,
          description: f.description,
          category: f.category,
          student_id: f.student_id,
          student_name: f.student_name.trim() || null,
          standard_label: f.standard_label.trim() || null,
          exam_name: f.exam_name.trim() || null,
          level: f.level || null,
          rank: rank != null && rank > 0 ? Math.trunc(rank) : null,
          score: parseNum(f.score),
          max_score: parseNum(f.max_score),
          award: f.award.trim() || null,
          medal: detectMedal(f.award),
          achieved_on: f.achieved_on || null,
          academic_year: f.academic_year.trim() || null,
          photo_url: f.photo_url,
          is_published: f.is_published,
        });
        toast.success(initial ? "Achievement updated" : "Achievement added");
        onSaved();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <Modal open onClose={onClose} size="2xl" title={initial ? "Edit achievement" : "Add achievement"}
      description="Linked students show their current class automatically.">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StudentPicker
            roster={roster}
            studentId={f.student_id}
            studentName={f.student_name}
            onChange={(v) => setF((s) => ({
              ...s, student_id: v.student_id, student_name: v.student_name,
              standard_label: v.standard_label ?? s.standard_label,
            }))}
          />
          <Input label="Class" placeholder="e.g. 10 वी" value={f.standard_label}
            onChange={(e) => set("standard_label", e.target.value)} disabled={!!f.student_id} />
          <Input label="Exam / event" placeholder="e.g. MTS Olympiad, NMMS, District Kabaddi"
            value={f.exam_name} onChange={(e) => set("exam_name", e.target.value)} />
          <Input label="Title (optional)" placeholder="Defaults to the exam / event name"
            value={f.title} onChange={(e) => set("title", e.target.value)} />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink-700">Category</span>
            <Select value={f.category} onChange={(e) => set("category", e.target.value)} className="h-[42px]">
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.en} · {c.mr}</option>)}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink-700">Level</span>
            <Select value={f.level} onChange={(e) => set("level", e.target.value)} className="h-[42px]">
              <option value="">—</option>
              {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.en} · {l.mr}</option>)}
            </Select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Input label="Rank" inputMode="numeric" placeholder="1" value={f.rank} onChange={(e) => set("rank", e.target.value)} />
          <Input label="Marks" inputMode="decimal" value={f.score} onChange={(e) => set("score", e.target.value)} />
          <Input label="Out of" inputMode="decimal" value={f.max_score} onChange={(e) => set("max_score", e.target.value)} />
          <Input label="Academic year" placeholder="2025-26" value={f.academic_year} onChange={(e) => set("academic_year", e.target.value)} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Award / result" placeholder="Gold medal, Scholarship, Qualified…" value={f.award}
            onChange={(e) => set("award", e.target.value)} hint="Words like gold / silver / bronze show a medal." />
          <Input label="Date" type="date" value={f.achieved_on} onChange={(e) => set("achieved_on", e.target.value)} />
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink-700">Description</span>
          <textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)}
            className="block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm shadow-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr] sm:items-start">
          <ImageUpload aspect="square" value={f.photo_url} onChange={(u) => set("photo_url", u)}
            onUpload={uploadAchievementImage} label="Photo" hint="Student or certificate photo. Optional." maxDimension={900} />
          <label className="flex items-center gap-2 text-sm text-ink-700 sm:mt-7">
            <input type="checkbox" checked={f.is_published} onChange={(e) => set("is_published", e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
            Show on the public website
          </label>
        </div>

        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={pending}>{initial ? "Save changes" : "Add achievement"}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
