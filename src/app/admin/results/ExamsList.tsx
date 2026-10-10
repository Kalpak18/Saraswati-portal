"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, FileSpreadsheet, Trash2, Upload } from "lucide-react";
import { clientAction } from "@/lib/clientAction";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";
import { deleteExams as deleteExamsAction } from "./actions";

const deleteExams = clientAction(deleteExamsAction);

export type ExamRow = {
  id: string;
  label: string;          // "१० वी — अ"
  test_type: string;
  academic_year: string;
  dates: string;
};

export default function ExamsList({ exams, filterLabel }: { exams: ExamRow[]; filterLabel: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();

  const allOn = exams.length > 0 && exams.every((e) => selected.has(e.id));
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  const toggleAll = () => setSelected(allOn ? new Set() : new Set(exams.map((e) => e.id)));

  const ask = (ids: string[]) => { setTyped(""); setConfirmIds(ids); };
  const many = (confirmIds?.length ?? 0) > 1;

  function doDelete() {
    if (!confirmIds) return;
    startTransition(async () => {
      try {
        const { deleted } = await deleteExams(confirmIds);
        toast.success(`Deleted ${deleted} exam${deleted === 1 ? "" : "s"} and their report cards`);
        setSelected(new Set());
        setConfirmIds(null);
        router.refresh();
      } catch (err) { toast.error((err as Error).message); }
    });
  }

  const checkbox = (checked: boolean, onChange: () => void, label: string) => (
    <input type="checkbox" checked={checked} onChange={onChange} aria-label={label}
      className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
  );

  return (
    <>
      {exams.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-ink-700">
            {checkbox(allOn, toggleAll, "Select all")}
            Select all {exams.length}
          </label>
          <div className="ml-auto flex flex-wrap gap-2">
            {selected.size > 0 && (
              <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => ask([...selected])}>
                Delete selected ({selected.size})
              </Button>
            )}
            <Button variant="secondary" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => ask(exams.map((e) => e.id))}>
              Delete all {exams.length} shown
            </Button>
          </div>
        </div>
      )}

      <ResponsiveTable
        head={
          <>
            <th className="w-10 px-4 py-3"><span className="sr-only">Select</span></th>
            <th className="px-4 py-3">Class</th>
            <th className="px-4 py-3">Test</th>
            <th className="px-4 py-3">Year</th>
            <th className="px-4 py-3">Exam dates</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </>
        }
        empty={
          <EmptyState
            icon={<FileSpreadsheet className="h-6 w-6" />}
            title={filterLabel ? `No exams for ${filterLabel}` : "No exams uploaded yet"}
            description="Upload a filled result Excel to publish report cards."
            action={
              <Link href="/admin/results/upload">
                <Button leftIcon={<Upload className="h-4 w-4" />}>Upload new result</Button>
              </Link>
            }
          />
        }
        rows={exams.map((e) => ({
          key: e.id,
          cells: (
            <>
              <td className="px-4 py-3">{checkbox(selected.has(e.id), () => toggle(e.id), `Select ${e.label} ${e.test_type}`)}</td>
              <td className="px-4 py-3 font-medium text-ink-900">{e.label}</td>
              <td className="px-4 py-3 text-ink-700">{e.test_type}</td>
              <td className="px-4 py-3 text-ink-700 tabular-nums">{e.academic_year}</td>
              <td className="px-4 py-3 text-ink-700 tabular-nums">{e.dates}</td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-3">
                  <Link href={`/admin/results/${e.id}`} className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button type="button" onClick={() => ask([e.id])} className="text-ink-400 hover:text-red-600" aria-label={`Delete ${e.label} ${e.test_type}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </>
          ),
          mobile: (
            <div className="flex items-center gap-3">
              {checkbox(selected.has(e.id), () => toggle(e.id), `Select ${e.label} ${e.test_type}`)}
              <Link href={`/admin/results/${e.id}`} className="min-w-0 flex-1">
                <div className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{e.label}</div>
                <div className="mt-0.5 truncate text-base font-semibold text-ink-900">{e.test_type}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-500">
                  <Badge tone="brand">{e.academic_year}</Badge>
                  <span className="tabular-nums">{e.dates}</span>
                </div>
              </Link>
              <button type="button" onClick={() => ask([e.id])} className="p-2 text-ink-400 hover:text-red-600" aria-label={`Delete ${e.label} ${e.test_type}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ),
        }))}
      />

      <Modal open={!!confirmIds} onClose={() => setConfirmIds(null)} title={many ? `Delete ${confirmIds?.length} exams?` : "Delete this exam?"} size="md">
        <div className="space-y-4 text-sm">
          <p className="text-ink-700">
            This permanently removes {many ? "these exams" : "the exam"} with all {many ? "their" : "its"} marks and report cards
            {many && filterLabel ? <> (<b>{filterLabel}</b>)</> : null}. Parents will no longer see {many ? "them" : "it"}.
            Students and classes are kept. <b>This can&apos;t be undone</b> — keep the Excel files if you may need them again.
          </p>
          {many && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-600">Type <b>DELETE</b> to confirm</span>
              <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
            </label>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setConfirmIds(null)}>Cancel</Button>
            <Button variant="danger" loading={pending} disabled={many && typed.trim().toUpperCase() !== "DELETE"} onClick={doDelete}>
              Delete {many ? `${confirmIds?.length} exams` : "exam"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
