"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Pencil, Trash2, Upload, Users, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CountryCodeSelect } from "@/components/ui/CountryCodeSelect";
import { IconButton } from "@/components/ui/IconButton";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "@/lib/countries";
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
  parent_country: Country;
  parent_mobile_local: string;
  dob: string;
  gender: string;
  admission_date: string;
  is_active: boolean;
};

// Split a stored mobile (e.g. "+919822014571", "9822014571", "09822014571")
// into (country, local). Best-effort by longest matching dial prefix.
function splitMobile(raw: string): { country: Country; local: string } {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return { country: DEFAULT_COUNTRY, local: "" };
  // Strip a leading zero (national trunk prefix common in IN etc.) if what
  // remains still parses cleanly.
  const trimmed = digits.startsWith("0") && digits.length > 10 ? digits.slice(1) : digits;
  // Match the longest dial code that fits.
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (trimmed.startsWith(c.dial) && trimmed.length > c.dial.length) {
      return { country: c, local: trimmed.slice(c.dial.length) };
    }
  }
  // No dial code prefix — treat the whole thing as local, default country.
  return { country: DEFAULT_COUNTRY, local: trimmed };
}

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
      student_name: "",
      parent_country: DEFAULT_COUNTRY, parent_mobile_local: "",
      dob: "",
      gender: "", admission_date: "", is_active: true,
    });
    setEditOpen(true);
  }
  function openEdit(s: Student) {
    const { country, local } = splitMobile(s.parent_mobile);
    setEditing({
      id: s.id, division_id: selectedDivisionId,
      gr_no: s.gr_no ?? "",
      roll_no: s.roll_no, student_name: s.student_name,
      parent_country: country, parent_mobile_local: local,
      dob: s.dob,
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
    const local = editing.parent_mobile_local.replace(/\D/g, "");
    if (!local) { toast.error("Parent mobile required"); return; }
    const parent_mobile = `+${editing.parent_country.dial}${local}`;

    startTransition(async () => {
      try {
        await saveStudent({
          id: editing.id, division_id: editing.division_id,
          gr_no: editing.gr_no || null,
          roll_no: Number(editing.roll_no),
          student_name: editing.student_name,
          parent_mobile, dob: editing.dob,
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
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Students"
        description={
          selectedDivisionId
            ? `${filtered.length} of ${students.length} shown`
            : "Add a division first, then manage its students here."
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setImportOpen(true)}
              disabled={!selectedDivisionId}
              leftIcon={<Upload className="h-4 w-4" />}
            >
              <span className="hidden sm:inline">Import Excel</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button
              onClick={openAdd}
              disabled={!selectedDivisionId}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              <span className="hidden sm:inline">Add student</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </>
        }
      />

      {/* Filter bar: division picker + search */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex flex-col gap-1 text-xs sm:min-w-[220px]">
          <span className="font-medium uppercase tracking-wide text-gray-500">Division</span>
          <select
            className="h-11 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:h-10"
            value={selectedDivisionId}
            onChange={(e) => onDivChange(e.target.value)}
            aria-label="Filter by division"
          >
            {divisions.length === 0 && <option value="">— No divisions yet —</option>}
            {divisions.map((d) => <option key={d.id} value={d.id}>{divisionLabel(d)}</option>)}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs">
          <span className="font-medium uppercase tracking-wide text-gray-500">Search</span>
          <Input
            placeholder="Name, roll, or GR"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftAdornment={<Search className="h-4 w-4" />}
            aria-label="Search students"
          />
        </label>
      </div>

      <ResponsiveTable
        head={
          <>
            <th className="px-3 py-3">Roll</th>
            <th className="px-3 py-3">GR No</th>
            <th className="px-3 py-3">Name</th>
            <th className="px-3 py-3">Parent mobile</th>
            <th className="px-3 py-3">DOB</th>
            <th className="px-3 py-3">Gender</th>
            <th className="px-3 py-3 text-right">Actions</th>
          </>
        }
        empty={
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No students yet"
            description={
              selectedDivisionId
                ? "Add students one at a time, or import a whole class from Excel."
                : "Create a standard and a division first, then come back here."
            }
            action={
              selectedDivisionId ? (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="secondary" onClick={() => setImportOpen(true)} leftIcon={<Upload className="h-4 w-4" />}>
                    Import Excel
                  </Button>
                  <Button onClick={openAdd} leftIcon={<Plus className="h-4 w-4" />}>
                    Add student
                  </Button>
                </div>
              ) : null
            }
          />
        }
        rows={filtered.map((s) => ({
          key: s.id,
          cells: (
            <>
              <td className="px-3 py-2 text-gray-700 tabular-nums">{s.roll_no}</td>
              <td className="px-3 py-2 text-gray-500">{s.gr_no ?? "—"}</td>
              <td className="px-3 py-2 font-medium text-gray-900">{s.student_name}</td>
              <td className="px-3 py-2 tabular-nums text-gray-700">{s.parent_mobile}</td>
              <td className="px-3 py-2 text-gray-700 tabular-nums">{s.dob}</td>
              <td className="px-3 py-2 text-gray-500">{s.gender ?? "—"}</td>
              <td className="px-3 py-2 text-right">
                <div className="inline-flex items-center gap-1">
                  <IconButton label={`Edit ${s.student_name}`} onClick={() => openEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    tone="danger"
                    label={`Delete ${s.student_name}`}
                    onClick={() => onDelete(s)}
                    disabled={pending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </td>
            </>
          ),
          mobile: (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                    Roll {s.roll_no}{s.gr_no ? ` · GR ${s.gr_no}` : ""}
                  </div>
                  <div className="mt-0.5 truncate text-base font-semibold text-gray-900">
                    {s.student_name}
                  </div>
                </div>
                <div className="flex flex-none gap-1">
                  <IconButton label={`Edit ${s.student_name}`} onClick={() => openEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    tone="danger"
                    label={`Delete ${s.student_name}`}
                    onClick={() => onDelete(s)}
                    disabled={pending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <div>
                  <dt className="font-medium uppercase tracking-wide text-gray-500">Mobile</dt>
                  <dd className="tabular-nums text-gray-800 break-all">{s.parent_mobile}</dd>
                </div>
                <div>
                  <dt className="font-medium uppercase tracking-wide text-gray-500">DOB</dt>
                  <dd className="tabular-nums text-gray-800">{s.dob}</dd>
                </div>
                {s.gender && (
                  <div>
                    <dt className="font-medium uppercase tracking-wide text-gray-500">Gender</dt>
                    <dd className="text-gray-800">{s.gender}</dd>
                  </div>
                )}
              </dl>
            </div>
          ),
        }))}
      />

      {/* Add / Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={editing?.id ? "Edit student" : "Add student"}
        size="xl"
      >
        {editing && (
          <form onSubmit={onSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-gray-700">Name *</span>
              <Input required value={editing.student_name}
                onChange={(e) => setEditing({ ...editing, student_name: e.target.value })} />
            </label>
            <div className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-gray-700">Parent mobile *</span>
              <div className="flex items-stretch gap-2">
                <CountryCodeSelect
                  value={editing.parent_country}
                  onChange={(c) => setEditing({ ...editing, parent_country: c })}
                  disabled={pending}
                />
                <Input
                  required
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={15}
                  placeholder="9822014571"
                  className="flex-1"
                  value={editing.parent_mobile_local}
                  onChange={(e) =>
                    setEditing({ ...editing, parent_mobile_local: e.target.value.replace(/\D/g, "") })
                  }
                />
              </div>
            </div>
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
            <label className="inline-flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={editing.is_active}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Active — appears in class rosters &amp; parent lookup</span>
            </label>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" loading={pending}>Save</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Import modal */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import students from Excel"
        size="lg"
      >
        <div className="flex flex-col gap-4 text-sm">
          <p className="text-gray-600">
            Columns: <code className="rounded bg-gray-100 px-1 text-xs">gr_no</code>,{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">roll_no</code>,{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">student_name</code>,{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">parent_mobile</code>,{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">dob</code>,{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">gender</code>,{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">admission_date</code>.
            Dates in YYYY-MM-DD or DD/MM/YYYY.
          </p>
          <p className="text-xs text-gray-500">
            Get a ready-to-fill template at <b>Templates</b> in the sidebar.
          </p>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center hover:border-indigo-400 hover:bg-indigo-50">
            <Upload className="h-6 w-6 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Choose an Excel file</span>
            <span className="text-xs text-gray-500">.xlsx, .xls, or .csv</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setImportOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
