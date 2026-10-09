"use client";

import { clientAction } from "@/lib/clientAction";
import { parseStudentsWorkbook, type StudentImport } from "@/lib/excel/parseStudents";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { saveStudent as saveStudentAction, deleteStudent as deleteStudentAction, importStudents as importStudentsAction } from "./actions";

// Server actions return { ok, error }; these wrappers throw the real message (see lib/clientAction.ts).
const saveStudent = clientAction(saveStudentAction);
const deleteStudent = clientAction(deleteStudentAction);
const importStudents = clientAction(importStudentsAction);

type Std = { id: string; name: string; academic_year: string };
type Div = { id: string; standard_id: string; name: string };

type Student = {
  id: string;
  roll_no: number;
  student_name: string;
  parent_mobile: string;
  dob: string;
  gender: string | null;
  is_active: boolean;
};

type EditState = {
  id?: string;
  division_id: string;
  roll_no: number | "";
  student_name: string;
  parent_country: Country;
  parent_mobile_local: string;
  dob: string;
  gender: string;
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
      String(s.roll_no).includes(q),
    );
  }, [query, students]);

  function onDivChange(id: string) {
    router.push(`/admin/students?division=${id}`);
  }

  function openAdd() {
    if (!selectedDivisionId) { toast.error("Add a standard + division first"); return; }
    setEditing({
      division_id: selectedDivisionId, roll_no: "",
      student_name: "",
      parent_country: DEFAULT_COUNTRY, parent_mobile_local: "",
      dob: "",
      gender: "", is_active: true,
    });
    setEditOpen(true);
  }
  function openEdit(s: Student) {
    const { country, local } = splitMobile(s.parent_mobile);
    setEditing({
      id: s.id, division_id: selectedDivisionId,
      roll_no: s.roll_no, student_name: s.student_name,
      parent_country: country, parent_mobile_local: local,
      dob: s.dob,
      gender: s.gender ?? "",
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
          roll_no: Number(editing.roll_no),
          student_name: editing.student_name,
          parent_mobile, dob: editing.dob,
          gender: editing.gender || null,
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

  // Parsed roster waiting for the admin to confirm (see the import modal).
  const [review, setReview] = useState<(StudentImport & { fileName: string }) | null>(null);

  async function handleFile(file: File) {
    if (!selectedDivisionId) { toast.error("Select a division first"); return; }
    try {
      const parsed = parseStudentsWorkbook(await file.arrayBuffer());
      setReview({ ...parsed, fileName: file.name });
    } catch (err) {
      toast.error(`Couldn't read this file: ${(err as Error).message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function confirmImport() {
    if (!review || !selectedDivisionId) return;
    const rows = review.rows.map(({ row: _r, ...rest }) => { void _r; return rest; });
    startTransition(async () => {
      try {
        const { inserted } = await importStudents(selectedDivisionId, rows);
        toast.success(`Imported ${inserted} students`);
        setReview(null);
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
          <span className="font-medium uppercase tracking-wide text-ink-500">Division</span>
          <select
            className="h-11 rounded-md border border-ink-300 bg-white px-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:h-10"
            value={selectedDivisionId}
            onChange={(e) => onDivChange(e.target.value)}
            aria-label="Filter by division"
          >
            {divisions.length === 0 && <option value="">— No divisions yet —</option>}
            {divisions.map((d) => <option key={d.id} value={d.id}>{divisionLabel(d)}</option>)}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs">
          <span className="font-medium uppercase tracking-wide text-ink-500">Search</span>
          <Input
            placeholder="Name or roll number"
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
              <td className="px-3 py-2 text-ink-700 tabular-nums">{s.roll_no}</td>
              <td className="px-3 py-2 font-medium text-ink-900">{s.student_name}</td>
              <td className="px-3 py-2 tabular-nums text-ink-700">{s.parent_mobile}</td>
              <td className="px-3 py-2 text-ink-700 tabular-nums">{s.dob}</td>
              <td className="px-3 py-2 text-ink-500">{s.gender ?? "—"}</td>
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
                  <div className="text-[11px] font-medium uppercase tracking-wide text-ink-500">
                    Roll {s.roll_no}
                  </div>
                  <div className="mt-0.5 truncate text-base font-semibold text-ink-900">
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
                  <dt className="font-medium uppercase tracking-wide text-ink-500">Mobile</dt>
                  <dd className="tabular-nums text-ink-800 break-all">{s.parent_mobile}</dd>
                </div>
                <div>
                  <dt className="font-medium uppercase tracking-wide text-ink-500">DOB</dt>
                  <dd className="tabular-nums text-ink-800">{s.dob}</dd>
                </div>
                {s.gender && (
                  <div>
                    <dt className="font-medium uppercase tracking-wide text-ink-500">Gender</dt>
                    <dd className="text-ink-800">{s.gender}</dd>
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
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-ink-700">Roll no *</span>
              <Input required type="number" min={1}
                value={editing.roll_no === "" ? "" : editing.roll_no}
                onChange={(e) => setEditing({ ...editing, roll_no: e.target.value === "" ? "" : Number(e.target.value) })} />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-ink-700">Name *</span>
              <Input required value={editing.student_name}
                onChange={(e) => setEditing({ ...editing, student_name: e.target.value })} />
            </label>
            <div className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-ink-700">Parent mobile *</span>
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
              <span className="font-medium text-ink-700">DOB *</span>
              <Input required type="date" value={editing.dob}
                onChange={(e) => setEditing({ ...editing, dob: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-ink-700">Gender</span>
              <select
                className="h-10 rounded-md border border-ink-300 bg-white px-2 text-sm"
                value={editing.gender}
                onChange={(e) => setEditing({ ...editing, gender: e.target.value })}
              >
                <option value="">—</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={editing.is_active}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500"
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
        onClose={() => { setReview(null); setImportOpen(false); }}
        title="Import students from Excel"
        size="lg"
      >
        <div className="flex flex-col gap-4 text-sm">
          <p className="text-ink-600">
            Columns: <code className="rounded bg-ink-100 px-1 text-xs">roll_no</code>,{" "}
            <code className="rounded bg-ink-100 px-1 text-xs">student_name</code>,{" "}
            <code className="rounded bg-ink-100 px-1 text-xs">parent_mobile</code>,{" "}
            <code className="rounded bg-ink-100 px-1 text-xs">dob</code>,{" "}
            <code className="rounded bg-ink-100 px-1 text-xs">gender</code>.
            Dates in YYYY-MM-DD or DD/MM/YYYY.
          </p>
          <p className="text-xs text-ink-500">
            Get a ready-to-fill template at <b>Templates</b> in the sidebar.
          </p>
          {!review ? (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink-300 bg-ink-50 p-6 text-center hover:border-brand-400 hover:bg-brand-50">
              <Upload className="h-6 w-6 text-ink-400" />
              <span className="text-sm font-medium text-ink-700">Choose an Excel file</span>
              <span className="text-xs text-ink-500">.xlsx, .xls, or .csv</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
                <div className="font-medium text-ink-900">{review.fileName}</div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs">
                  <span className="font-semibold text-emerald-700">{review.rows.length} ready to import</span>
                  {review.errors.length > 0 && <span className="font-semibold text-red-700">{review.errors.length} row{review.errors.length === 1 ? "" : "s"} need fixing</span>}
                  {review.warnings.length > 0 && <span className="font-semibold text-amber-700">{review.warnings.length} to double-check</span>}
                </div>
              </div>
              {review.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <div className="mb-1 font-semibold">These rows will be skipped — fix them in Excel and upload again:</div>
                  <ul className="space-y-0.5">
                    {review.errors.slice(0, 50).map((e) => <li key={e.row}>Row {e.row}: {e.message}</li>)}
                    {review.errors.length > 50 && <li>…and {review.errors.length - 50} more</li>}
                  </ul>
                </div>
              )}
              {review.warnings.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <ul className="space-y-0.5">{review.warnings.slice(0, 30).map((w, i) => <li key={i}>⚠ {w}</li>)}</ul>
                </div>
              )}
              {review.rows.length > 0 && (
                <p className="text-xs text-ink-500">
                  Students with a roll number already in this division are updated; new roll numbers are added.
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => { setReview(null); setImportOpen(false); }}>Cancel</Button>
            {review && (
              <>
                <Button variant="ghost" onClick={() => setReview(null)}>Choose another file</Button>
                <Button onClick={confirmImport} loading={pending} disabled={review.rows.length === 0}>
                  Import {review.rows.length} student{review.rows.length === 1 ? "" : "s"}
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
