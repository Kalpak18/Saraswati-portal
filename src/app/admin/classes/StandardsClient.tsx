"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { saveStandard, deleteStandard, saveDivision, deleteDivision } from "./actions";
import { normalizeDivision, normalizeStandard, displayDivision, displayStandard } from "@/lib/i18n/normalize";

type Std = { id: string; name: string; academic_year: string; display_order: number };
type Div = { id: string; standard_id: string; name: string; is_active: boolean; display_order: number };

const currentAY = (() => {
  const d = new Date();
  const y = d.getMonth() >= 5 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
})();

export default function StandardsClient({
  standards, divisions, studentCountByDivision,
}: {
  standards: Std[];
  divisions: Div[];
  studentCountByDivision: Record<string, number>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(standards.map((s) => [s.id, true])),
  );

  // Modals
  const [stdModal, setStdModal] = useState<Std | null>(null);
  const [divModal, setDivModal] = useState<Div | null>(null);

  const divsByStd = new Map<string, Div[]>();
  for (const d of divisions) {
    if (!divsByStd.has(d.standard_id)) divsByStd.set(d.standard_id, []);
    divsByStd.get(d.standard_id)!.push(d);
  }

  function openAddStd() {
    setStdModal({ id: "", name: "", academic_year: currentAY, display_order: 0 });
  }
  function openEditStd(s: Std) { setStdModal({ ...s }); }
  function openAddDiv(standardId: string) {
    setDivModal({ id: "", standard_id: standardId, name: "", is_active: true, display_order: 0 });
  }
  function openEditDiv(d: Div) { setDivModal({ ...d }); }

  async function onSaveStd(e: React.FormEvent) {
    e.preventDefault();
    if (!stdModal) return;
    const payload = { ...stdModal, id: stdModal.id || undefined };
    startTransition(async () => {
      try {
        await saveStandard(payload);
        setStdModal(null);
        router.refresh();
      } catch (err) { toast.error((err as Error).message); }
    });
  }

  async function onDeleteStd(s: Std) {
    if (!confirm(`Delete "${s.name}" and ALL its divisions & students?`)) return;
    startTransition(async () => {
      try { await deleteStandard(s.id); router.refresh(); }
      catch (err) { toast.error((err as Error).message); }
    });
  }

  async function onSaveDiv(e: React.FormEvent) {
    e.preventDefault();
    if (!divModal) return;
    const payload = { ...divModal, id: divModal.id || undefined };
    startTransition(async () => {
      try {
        await saveDivision(payload);
        setDivModal(null);
        router.refresh();
      } catch (err) { toast.error((err as Error).message); }
    });
  }

  async function onDeleteDiv(d: Div) {
    if (!confirm(`Delete division "${d.name}" and ALL its students?`)) return;
    startTransition(async () => {
      try { await deleteDivision(d.id); router.refresh(); }
      catch (err) { toast.error((err as Error).message); }
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Standards & Divisions</h1>
        <Button onClick={openAddStd}><Plus className="mr-1 h-4 w-4" /> Add standard</Button>
      </div>

      {standards.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          No standards yet. Click <b>Add standard</b> — e.g. <em>10 वी</em>, then add divisions <em>अ, ब, क</em> under it.
        </div>
      )}

      {standards.map((s) => {
        const divs = divsByStd.get(s.id) ?? [];
        const isOpen = expanded[s.id] ?? true;
        return (
          <div key={s.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
              <button onClick={() => setExpanded((e) => ({ ...e, [s.id]: !isOpen }))}
                className="rounded p-1 text-gray-500 hover:bg-gray-200">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{s.name}</div>
                <div className="text-xs text-gray-500">Academic year: {s.academic_year} · {divs.length} division{divs.length === 1 ? "" : "s"}</div>
              </div>
              <button className="rounded p-1.5 text-gray-500 hover:bg-gray-200" onClick={() => openEditStd(s)}>
                <Pencil className="h-4 w-4" />
              </button>
              <button className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => onDeleteStd(s)} disabled={pending}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {isOpen && (
              <div className="divide-y divide-gray-100">
                {divs.length === 0 && (
                  <div className="px-4 py-4 text-sm text-gray-500">
                    No divisions in this standard yet.
                  </div>
                )}
                {divs.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 px-4 py-2.5">
                    <div className="flex-1">
                      <Link href={`/admin/students?division=${d.id}`}
                        className="inline-flex items-center gap-1 font-medium text-gray-900 hover:text-indigo-600">
                        Division {d.name}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                      <div className="text-xs text-gray-500">
                        {studentCountByDivision[d.id] ?? 0} students
                      </div>
                    </div>
                    <span className={d.is_active
                      ? "rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                      : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"}>
                      {d.is_active ? "Active" : "Inactive"}
                    </span>
                    <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => openEditDiv(d)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => onDeleteDiv(d)} disabled={pending}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="px-4 py-2">
                  <Button size="sm" variant="secondary" onClick={() => openAddDiv(s.id)}>
                    <Plus className="mr-1 h-3 w-3" /> Add division
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Standard modal */}
      <Modal open={!!stdModal} onClose={() => setStdModal(null)}
        title={stdModal?.id ? "Edit standard" : "Add standard"}>
        {stdModal && (
          <form onSubmit={onSaveStd} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Standard name</span>
              <Input required placeholder="10th or 10 वी" value={stdModal.name}
                onChange={(e) => setStdModal({ ...stdModal, name: e.target.value })} />
              {(() => {
                const c = normalizeStandard(stdModal.name);
                return c && c !== stdModal.name.trim() ? (
                  <span className="text-xs text-gray-500">Will be saved as <b>{displayStandard(c, "mr")}</b></span>
                ) : null;
              })()}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Academic year</span>
              <Input required placeholder="2026-27" value={stdModal.academic_year}
                onChange={(e) => setStdModal({ ...stdModal, academic_year: e.target.value })} />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setStdModal(null)}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Division modal */}
      <Modal open={!!divModal} onClose={() => setDivModal(null)}
        title={divModal?.id ? "Edit division" : "Add division"}>
        {divModal && (
          <form onSubmit={onSaveDiv} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Division name</span>
              <Input required placeholder="A / अ / 1" value={divModal.name}
                onChange={(e) => setDivModal({ ...divModal, name: e.target.value })} />
              {(() => {
                const c = normalizeDivision(divModal.name);
                return c && c !== divModal.name.trim() ? (
                  <span className="text-xs text-gray-500">Will be saved as <b>{displayDivision(c, "mr")}</b></span>
                ) : null;
              })()}
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={divModal.is_active}
                onChange={(e) => setDivModal({ ...divModal, is_active: e.target.checked })} />
              <span>Active</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDivModal(null)}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
