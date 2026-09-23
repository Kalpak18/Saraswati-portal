"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { saveStudent, deleteStudent, importStudents } from "./actions";

type Std = { id: string; name: string; academic_year: string };
type Div = { id: string; standard_id: string; name: string };

type Student = {
  id: string;
  gr_no: string | null;
  roll_no: number;
  student_name: string;
  parent_mobile: string;
  dob: string;
  gender: string | null;
  admission_date: string | null;
  is_active: boolean;
};

type EditState = {
  id?: string;
  division_id: string;
  gr_no: string;
  roll_no: number | "";
  student_name: string;
  parent_mobile: string;
  dob: string;
  gender: string;
  admission_date: string;
  is_active: boolean;
};

export default function StudentsClient({
  standards, divisions, selectedDivisionId, students,
}: { standards: Std[]; divisions: Div[]; selectedDivisionId: string; students: Student[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stdById = new Map(standards.map((s) => [s.id, s]));

  const divisionLabel = (d: Div) => {
    const std = stdById.get(d.standard_id);
    return std ? `${std.name} — ${d.name} (${std.academic_year})` : d.name;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      s.student_name.toLowerCase().includes(q) ||
      String(s.roll_no).includes(q) ||
      (s.gr_no ?? "").toLowerCase().includes(q),
    );
  }, [query, students]);

  function onDivChange(id: string) {
    router.push(`/admin/students?division=${id}`);
  }

  function openAdd() {
    if (!selectedDivisionId) { toast.error("Add a standard + division first"); return; }
    setEditing({
      division_id: selectedDivisionId, gr_no: "", roll_no: "",
      student_name: "", parent_mobile: "", dob: "",
      gender: "", admission_date: "", is_active: true,
    });
    setEditOpen(true);
  }
  function openEdit(s: Student) {
    setEditing({
      id: s.id, division_id: selectedDivisionId,
      gr_no: s.gr_no ?? "",
      roll_no: s.roll_no, student_name: s.student_name,
      parent_mobile: s.parent_mobile, dob: s.dob,
      gender: s.gender ?? "",
      admission_date: s.admission_date ?? "",
      is_active: s.is_active,
    });
    setEditOpen(true);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (editing.roll_no === "" || Number.isNaN(Number(editing.roll_no))) {
      toast.error("Roll no required"); return;
    }
    startTransition(async () => {
      try {
        await saveStudent({
          id: editing.id, division_id: editing.division_id,
          gr_no: editing.gr_no || null,
          roll_no: Number(editing.roll_no),
          student_name: editing.student_name,
          parent_mobile: editing.parent_mobile, dob: editing.dob,
          gender: editing.gender || null,
          admission_date: editing.admission_date || null,
          is_active: editing.is_active,
        });
        setEditOpen(false);
        router.refresh();
      } catch (err) { toast.error((err as Error).message); }
    });
  }

  async function onDelete(s: Student) {
    if (!confirm("Delete this student?")) return;
    startTransition(async () => {
      try { await deleteStudent(s.id); router.refresh(); }
      catch (err) { toast.error((err as Error).message); }
    });
  }

  function excelDateToISO(v: unknown): string {
    if (v == null || v === "") return "";
    if (typeof v === "string") {
      const m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
      const m2 = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (m2) return `${m2[3]}-${m2[2].padStart(2, "0")}-${m2[1].padStart(2, "0")}`;
      return v;
    }
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (typeof v === "number") {
      const d = XLSX.SSF.parse_date_code(v);
      if (!d) return "";
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
    return String(v);
  }

  async function handleFile(file: File) {
    if (!selectedDivisionId) { toast.error("Select a division first"); return; }
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

    const cleaned: unknown[] = [];
    const errors: string[] = [];
    rows.forEach((r, i) => {
      const gr = String(r.gr_no ?? r["GR No"] ?? r["GR"] ?? "").trim();
      const roll = Number(r.roll_no ?? r["Roll No"] ?? r["roll no"]);
      const name = String(r.student_name ?? r["Student Name"] ?? r.name ?? "").trim();
      const mobile = String(r.parent_mobile ?? r["Parent Mobile"] ?? r.mobile ?? "").trim();
      const dob = excelDateToISO(r.dob ?? r["DOB"] ?? r["Date of Birth"]);
      const gender = String(r.gender ?? r["Gender"] ?? "").trim();
      const adm = excelDateToISO(r.admission_date ?? r["Admission Date"] ?? "");
      if (!roll || !name || !mobile || !dob) {
        errors.push(`Row ${i + 2}: missing required fields`);
        return;
      }
      cleaned.push({
        gr_no: gr || null,
        roll_no: roll, student_name: name, parent_mobile: mobile, dob,
        gender: gender || null, admission_date: adm || null,
      });
    });

    if (cleaned.length === 0) { toast.error(errors[0] || "No valid rows found"); return; }

    startTransition(async () => {
      try {
        const { inserted } = await importStudents(selectedDivisionId, cleaned);
        toast.success(`Imported ${inserted} students`);
        if (errors.length) toast.warning(`${errors.length} rows skipped — check formatting`);
        setImportOpen(false);
        router.refresh();
      } catch (err) { toast.error((err as Error).message); }
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Students</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            value={selectedDivisionId}
            onChange={(e) => onDivChange(e.target.value)}
          >
            {divisions.length === 0 && <option value="">— No divisions yet —</option>}
            {divisions.map((d) => <option key={d.id} value={d.id}>{divisionLabel(d)}</option>)}
          </select>
          <Button variant="secondary" onClick={() => setImportOpen(true)} disabled={!selectedDivisionId}>
            <Upload className="mr-1 h-4 w-4" /> Import Excel
          </Button>
          <Button onClick={openAdd} disabled={!selectedDivisionId}>+ Add student</Button>
        </div>
      </div>

      <Input placeholder="Search by name, roll, or GR"
        value={query} onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm" />

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-3">Roll</th>
              <th className="px-3 py-3">GR No</th>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Parent mobile</th>
              <th className="px-3 py-3">DOB</th>
              <th className="px-3 py-3">Gender</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                No students in this division yet.
              </td></tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">{s.roll_no}</td>
                <td className="px-3 py-2 text-gray-500">{s.gr_no ?? "-"}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{s.student_name}</td>
                <td className="px-3 py-2 text-gray-700">{s.parent_mobile}</td>
                <td className="px-3 py-2 text-gray-700">{s.dob}</td>
                <td className="px-3 py-2 text-gray-500">{s.gender ?? "-"}</td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => onDelete(s)} disabled={pending}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)}
        title={editing?.id ? "Edit student" : "Add student"} className="max-w-lg">
        {editing && (
          <form onSubmit={onSave} className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Roll no *</span>
              <Input required type="number" min={1}
                value={editing.roll_no === "" ? "" : editing.roll_no}
                onChange={(e) => setEditing({ ...editing, roll_no: e.target.value === "" ? "" : Number(e.target.value) })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">GR no</span>
              <Input value={editing.gr_no}
                onChange={(e) => setEditing({ ...editing, gr_no: e.target.value })} />
            </label>
            <label className="col-span-2 flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Name *</span>
              <Input required value={editing.student_name}
                onChange={(e) => setEditing({ ...editing, student_name: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Parent mobile *</span>
              <Input required value={editing.parent_mobile}
                onChange={(e) => setEditing({ ...editing, parent_mobile: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">DOB *</span>
              <Input required type="date" value={editing.dob}
                onChange={(e) => setEditing({ ...editing, dob: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Gender</span>
              <select
                className="h-10 rounded-md border border-gray-300 bg-white px-2 text-sm"
                value={editing.gender}
                onChange={(e) => setEditing({ ...editing, gender: e.target.value })}
              >
                <option value="">—</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Admission date</span>
              <Input type="date" value={editing.admission_date}
                onChange={(e) => setEditing({ ...editing, admission_date: e.target.value })} />
            </label>
            <label className="col-span-2 inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_active}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
              <span>Active</span>
            </label>
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Import modal */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import students from Excel">
        <div className="flex flex-col gap-4 text-sm">
          <p className="text-gray-600">
            Columns: <code>gr_no</code>, <code>roll_no</code>, <code>student_name</code>,{" "}
            <code>parent_mobile</code>, <code>dob</code>, <code>gender</code>, <code>admission_date</code>.
            Dates as YYYY-MM-DD or DD/MM/YYYY.
          </p>
          <p className="text-gray-500 text-xs">
            Get the ready template at <b>Templates</b> in the sidebar.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setImportOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
