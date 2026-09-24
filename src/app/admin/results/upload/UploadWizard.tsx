"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Check, FileSpreadsheet, X, UserPlus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { parseResultsWorkbook, type ParsedFile, type ParsedStudentBlock } from "@/lib/excel/parseResults";
import { matchStudent, type Candidate, type MatchResult } from "@/lib/match/nameMatch";
import { normalizeDivision, displayDivision } from "@/lib/i18n/normalize";
import { saveBatch, checkUploadIdempotency, probeExamConflicts } from "../actions";

type Std = { id: string; name: string; academic_year: string };
type Div = { id: string; standard_id: string; name: string };

type Mode = "existing" | "create" | "skip";

type NewStudentForm = {
  gr_no: string;
  roll_no: number | "";
  parent_mobile: string;
  dob: string;
};

type ResolvedStudent = {
  raw: ParsedStudentBlock;
  match: MatchResult;
  mode: Mode;
  division_id: string | null;
  chosen_id: string | null;
  newStudent: NewStudentForm;
  on_conflict: "replace" | "skip";     // decided on the conflict modal
};

type StepA = { kind: "select" };
type StepB = {
  kind: "preview";
  file: ParsedFile;
  file_name: string;
  idempotency_key: string;
  already_committed_at: string | null;
  standard_id: string;
  fallback_division_id: string;
  test_type: string;
  academic_year: string;
  resolved: ResolvedStudent[];
  rostersByDivision: Record<string, Candidate[]>;
};
type StepC = { kind: "done"; count: number; created: number; examsCreated: number };

const emptyNewStudent = (rollHint?: number): NewStudentForm => ({
  gr_no: "", roll_no: rollHint ?? "", parent_mobile: "", dob: "",
});

// SHA-256 → hex; used as idempotency key
async function sha256Hex(input: string | ArrayBuffer): Promise<string> {
  const buf = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Min/max date across a list of ISO strings (nulls ignored)
function dateRange(dates: (string | null)[]): { start: string | null; end: string | null } {
  const valid = dates.filter((d): d is string => !!d).sort();
  return { start: valid[0] ?? null, end: valid[valid.length - 1] ?? null };
}

export default function UploadWizard({
  standards, divisions,
}: { standards: Std[]; divisions: Div[] }) {
  const router = useRouter();
  const stdById = new Map(standards.map((s) => [s.id, s]));

  const [standardId, setStandardId] = useState(standards[0]?.id ?? "");
  const [step, setStep] = useState<StepA | StepB | StepC>({ kind: "select" });
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  // Modal state for conflicts
  type ConflictInfo = {
    key: string;                      // group key: divisionId::testType::start
    divisionId: string;
    divisionName: string;
    testType: string;
    exam_start_date: string;
    conflicting_student_ids: string[];
  };
  const [conflicts, setConflicts] = useState<ConflictInfo[] | null>(null);

  const divisionsOfStandard = (sid: string) => divisions.filter((d) => d.standard_id === sid);
  const divNameById = new Map(divisions.map((d) => [d.id, d.name]));

  async function onFile(file: File) {
    if (!standardId) { toast.error("Select a standard first"); return; }
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseResultsWorkbook(buf);
      if (parsed.students.length === 0) {
        toast.error("No student data detected in file");
        setBusy(false); return;
      }

      const divs = divisionsOfStandard(standardId);
      if (divs.length === 0) { toast.error("Add a division under this standard first"); setBusy(false); return; }
      const fallbackDivisionId = divs[0].id;

      // Idempotency key: sha256(file bytes + standard + file name)
      const supabase = createSupabaseBrowser();
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id ?? "anon";
      const key = await sha256Hex(new Uint8Array(buf).byteLength + "|" + file.name + "|" + standardId + "|" + uid + "|" + await sha256Hex(buf));

      const priorBatch = await checkUploadIdempotency(key);

      const { data: rosterRows, error } = await supabase
        .from("students")
        .select("id, roll_no, student_name, gr_no, division_id")
        .in("division_id", divs.map((d) => d.id));
      if (error) { toast.error(error.message); setBusy(false); return; }

      const rostersByDivision: Record<string, Candidate[]> = {};
      for (const d of divs) rostersByDivision[d.id] = [];
      for (const r of rosterRows ?? []) {
        rostersByDivision[r.division_id]?.push({ id: r.id, roll_no: r.roll_no, name: r.student_name });
      }
      const rosterByIdMap = new Map(
        (rosterRows ?? []).map((r) => [r.id, {
          id: r.id, roll_no: r.roll_no, name: r.student_name,
          gr_no: r.gr_no as string | null, division_id: r.division_id as string,
        }]),
      );
      const rosterByGr = new Map(
        (rosterRows ?? []).filter((r) => r.gr_no).map((r) => [String(r.gr_no).trim(), r.id]),
      );

      const divIdByCanonical = new Map<string, string>();
      for (const d of divs) {
        const canon = normalizeDivision(d.name) ?? d.name;
        divIdByCanonical.set(canon, d.id);
      }

      const resolved: ResolvedStudent[] = parsed.students.map((s) => {
        const targetDivisionId = s.division_canonical ? (divIdByCanonical.get(s.division_canonical) ?? null) : null;
        const routedDivisionId = targetDivisionId ?? fallbackDivisionId;
        const roster = rostersByDivision[routedDivisionId] ?? [];
        const maxRoll = roster.reduce((m, c) => Math.max(m, c.roll_no), 0);

        // priority 1: GR
        if (s.gr_no) {
          const hit = rosterByGr.get(s.gr_no.trim());
          if (hit) {
            const info = rosterByIdMap.get(hit)!;
            return {
              raw: s,
              match: { status: "matched" as const, student_id: hit, score: 1, candidates: [{ id: hit, roll_no: info.roll_no, name: info.name }] },
              mode: "existing",
              division_id: info.division_id,
              chosen_id: hit,
              newStudent: emptyNewStudent(maxRoll + 1),
              on_conflict: "replace",
            };
          }
        }
        // priority 2: roll + division
        if (s.roll_no != null && targetDivisionId) {
          const hit = roster.find((c) => c.roll_no === s.roll_no);
          if (hit) {
            return {
              raw: s,
              match: { status: "matched" as const, student_id: hit.id, score: 1, candidates: [hit] },
              mode: "existing",
              division_id: targetDivisionId,
              chosen_id: hit.id,
              newStudent: emptyNewStudent(maxRoll + 1),
              on_conflict: "replace",
            };
          }
        }
        // priority 3: fuzzy
        const m = matchStudent(s.raw_student_name, roster);
        const mode: Mode = m.status === "matched" ? "existing" : m.status === "review" ? "existing" : "skip";
        return {
          raw: s,
          match: m,
          mode,
          division_id: routedDivisionId,
          chosen_id: m.status !== "unmatched" ? m.student_id : null,
          newStudent: emptyNewStudent(s.roll_no ?? (maxRoll + 1)),
          on_conflict: "replace",
        };
      });

      const std = stdById.get(standardId);
      setStep({
        kind: "preview",
        file: parsed,
        file_name: file.name,
        idempotency_key: key,
        already_committed_at: priorBatch?.uploaded_at ?? null,
        standard_id: standardId,
        fallback_division_id: fallbackDivisionId,
        test_type: parsed.test_type ?? "",
        academic_year: parsed.academic_year ?? std?.academic_year ?? "",
        resolved,
        rostersByDivision,
      });
    } catch (err) {
      toast.error((err as Error).message || "Failed to parse file");
    } finally {
      setBusy(false);
    }
  }

  // ---------- Step A ----------
  if (step.kind === "select") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <StepHeader step={1} title="Upload result file" />
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <label className="mb-4 flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Standard</span>
            <select
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              value={standardId}
              onChange={(e) => setStandardId(e.target.value)}
            >
              {standards.length === 0 && <option value="">— Add a standard first —</option>}
              {standards.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.academic_year})</option>
              ))}
            </select>
          </label>
          <label className="block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center hover:border-indigo-400 hover:bg-indigo-50">
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
              disabled={busy || !standardId}
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <div className="text-sm font-medium text-gray-700">
              {busy ? "Reading file…" : "Click to choose file"}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              .xlsx / .xls / .csv — one student, N stacked, or one sheet per student.
            </div>
          </label>
        </div>
      </div>
    );
  }

  // ---------- Step C ----------
  if (step.kind === "done") {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-green-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
          <Check className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          {step.count} students&apos; results saved
          {step.examsCreated > 1 && <> across {step.examsCreated} exam{step.examsCreated === 1 ? "" : "s"}</>}
          {step.created > 0 && <> · {step.created} new students created</>}
        </h2>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/admin/results"><Button variant="secondary">View report cards</Button></Link>
          <Button onClick={() => setStep({ kind: "select" })}>Upload another</Button>
        </div>
      </div>
    );
  }

  // ---------- Step B ----------
  const s = step;
  const setResolved = (next: ResolvedStudent[]) => setStep({ ...s, resolved: next });

  const stats = s.resolved.reduce(
    (acc, r) => {
      if (r.mode === "existing" && r.chosen_id) acc.matched++;
      else if (r.mode === "create") acc.creating++;
      else acc.skipped++;
      return acc;
    },
    { matched: 0, creating: 0, skipped: 0 },
  );

  const divisionsForStd = divisionsOfStandard(s.standard_id);

  function buildSubjectIndex(group: ResolvedStudent[]) {
    const seen = new Map<string, { subject_name: string; paper_no: number | null; max_marks: number | null; paper_date: string | null }>();
    for (const r of group) {
      for (const sub of r.raw.subjects) {
        const k = `${sub.subject}|${sub.paper_no ?? "n"}`;
        if (!seen.has(k)) seen.set(k, { subject_name: sub.subject, paper_no: sub.paper_no, max_marks: sub.max_marks, paper_date: sub.date });
        else {
          const existing = seen.get(k)!;
          if (existing.max_marks == null && sub.max_marks != null) existing.max_marks = sub.max_marks;
          if (!existing.paper_date && sub.date) existing.paper_date = sub.date;
        }
      }
    }
    return Array.from(seen.values());
  }

  // Build groups keyed by (division, test_type, exam_start_date)
  function buildGroups(included: ResolvedStudent[]) {
    const map = new Map<string, {
      key: string; divisionId: string; testType: string;
      exam_start_date: string; exam_end_date: string;
      students: ResolvedStudent[];
    }>();
    for (const r of included) {
      const divisionId = r.division_id ?? s.fallback_division_id;
      const testType = (r.raw.test_type ?? "").trim() || s.test_type.trim();
      const dates = r.raw.subjects.map((sub) => sub.date);
      const { start, end } = dateRange(dates);
      if (!testType) throw new Error(`Missing test type for "${r.raw.raw_student_name}"`);
      if (!start || !end) throw new Error(`Missing paper dates for "${r.raw.raw_student_name}" — can't identify exam`);
      const key = `${divisionId}::${testType}::${start}`;
      const existing = map.get(key);
      if (existing) {
        existing.students.push(r);
        if (end > existing.exam_end_date) existing.exam_end_date = end;
      } else {
        map.set(key, {
          key, divisionId, testType,
          exam_start_date: start, exam_end_date: end,
          students: [r],
        });
      }
    }
    return Array.from(map.values());
  }

  async function onConfirm() {
    if (s.already_committed_at && !confirm("This exact file was already uploaded on " + new Date(s.already_committed_at).toLocaleString() + ". Re-uploading will be a no-op. Continue?")) {
      return;
    }
    if (!s.academic_year.trim()) { toast.error("Academic year required"); return; }

    const included = s.resolved.filter((r) => r.mode !== "skip");
    if (included.length === 0) { toast.error("No students selected to save"); return; }

    for (const r of included) {
      if (r.mode === "create") {
        const ns = r.newStudent;
        if (!ns.roll_no || !ns.parent_mobile || !ns.dob) {
          toast.error(`Fill roll no, mobile & DOB for "${r.raw.raw_student_name}"`); return;
        }
      }
    }

    let groups: ReturnType<typeof buildGroups>;
    try { groups = buildGroups(included); }
    catch (err) { toast.error((err as Error).message); return; }

    // Same-file dedup: within any single group, existing student can't appear twice
    for (const g of groups) {
      const seenIds = new Set<string>();
      const seenRolls = new Set<number>();
      for (const r of g.students) {
        if (r.mode === "existing") {
          if (seenIds.has(r.chosen_id!)) {
            toast.error(`"${r.raw.raw_student_name}" mapped twice in ${g.testType} (${g.exam_start_date}) — fix or skip one`);
            return;
          }
          seenIds.add(r.chosen_id!);
        } else if (r.mode === "create") {
          const rn = Number(r.newStudent.roll_no);
          if (seenRolls.has(rn)) {
            toast.error(`Duplicate new-student roll ${rn} in ${g.testType} (${g.exam_start_date})`);
            return;
          }
          seenRolls.add(rn);
        }
      }
    }

    // Probe each group for existing (student, exam) conflicts
    startTransition(async () => {
      try {
        const conflictReport: ConflictInfo[] = [];
        for (const g of groups) {
          const existingIds = g.students
            .filter((r) => r.mode === "existing" && r.chosen_id)
            .map((r) => r.chosen_id!);
          if (existingIds.length === 0) continue;
          const res = await probeExamConflicts({
            division_id: g.divisionId,
            test_type: g.testType,
            academic_year: s.academic_year.trim(),
            exam_start_date: g.exam_start_date,
            existing_student_ids: existingIds,
          });
          if (res.exam_exists && res.conflicting_student_ids.length > 0) {
            conflictReport.push({
              key: g.key,
              divisionId: g.divisionId,
              divisionName: divNameById.get(g.divisionId) ?? "?",
              testType: g.testType,
              exam_start_date: g.exam_start_date,
              conflicting_student_ids: res.conflicting_student_ids,
            });
          }
        }

        if (conflictReport.length > 0) {
          setConflicts(conflictReport);
          return;
        }

        await commitBatch(groups);
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  async function commitBatch(groups: ReturnType<typeof buildGroups>) {
    try {
      const res = await saveBatch({
        idempotency_key: s.idempotency_key,
        file_name: s.file_name,
        exams: groups.map((g) => ({
          division_id: g.divisionId,
          test_type: g.testType,
          academic_year: s.academic_year.trim(),
          exam_start_date: g.exam_start_date,
          exam_end_date: g.exam_end_date,
          subjects: buildSubjectIndex(g.students),
          students: g.students.map((r) => {
            const entries = r.raw.subjects.map((sub) => ({
              subject_name: sub.subject,
              paper_no: sub.paper_no,
              marks_obtained: sub.marks_obtained,
              grade: sub.grade,
            }));
            const on_conflict = r.on_conflict;
            if (r.mode === "existing") {
              return { mode: "existing" as const, student_id: r.chosen_id!, entries, on_conflict };
            }
            return {
              mode: "create" as const,
              new_student: {
                gr_no: r.newStudent.gr_no || null,
                roll_no: Number(r.newStudent.roll_no),
                student_name: r.raw.raw_student_name.replace(/^(कु\.?|कुमारी|कुमार|श्री\.?|सौ\.?)\s+/i, "").trim() || r.raw.raw_student_name,
                parent_mobile: r.newStudent.parent_mobile,
                dob: r.newStudent.dob,
              },
              entries,
              on_conflict,
            };
          }),
        })),
      });

      if (res.already_committed) {
        toast.info(`This file was already saved on ${new Date(res.batch!.uploaded_at).toLocaleString()} — nothing changed.`);
        setStep({ kind: "done", count: res.batch!.rows_saved, created: res.batch!.students_created, examsCreated: res.batch!.exams_touched });
      } else {
        const total = res.exams.reduce((a, e) => a + e.students_saved, 0);
        const created = res.exams.reduce((a, e) => a + e.students_created, 0);
        setStep({ kind: "done", count: total, created, examsCreated: res.exams.length });
      }
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function applyDefaultToConflicts(action: "replace" | "skip") {
    if (!conflicts) return;
    const idsInConflicts = new Set(conflicts.flatMap((c) => c.conflicting_student_ids));
    const next = s.resolved.map((r) =>
      r.mode === "existing" && r.chosen_id && idsInConflicts.has(r.chosen_id)
        ? { ...r, on_conflict: action }
        : r,
    );
    setStep({ ...s, resolved: next });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <StepHeader step={2} title="Preview & confirm" />

      {s.already_committed_at && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          ℹ This exact file was already uploaded on <b>{new Date(s.already_committed_at).toLocaleString()}</b>. Re-uploading will be a no-op.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-500">Test type (fallback)</span>
          <Input value={s.test_type} onChange={(e) => setStep({ ...s, test_type: e.target.value })} />
          <span className="text-[10px] text-gray-400">Used only for blocks that don&apos;t declare their own.</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-500">Academic year</span>
          <Input value={s.academic_year} onChange={(e) => setStep({ ...s, academic_year: e.target.value })} />
        </label>
        <div className="col-span-2 flex flex-col justify-end text-sm">
          <div className="text-gray-500">Detected: <b>{s.resolved.length}</b> student blocks</div>
          <div className="text-gray-500">
            <span className="text-green-700">{stats.matched} matched</span>
            {stats.creating > 0 && <span className="ml-2 text-indigo-700">· {stats.creating} to create</span>}
            {stats.skipped > 0 && <span className="ml-2 text-gray-500">· {stats.skipped} skipped</span>}
          </div>
        </div>
      </div>

      {s.file.warnings.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {s.file.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
        </div>
      )}

      <div className="space-y-3">
        {s.resolved.map((r, idx) => (
          <StudentCard
            key={idx}
            resolved={r}
            divisionsForStd={divisionsForStd}
            rostersByDivision={s.rostersByDivision}
            onChange={(next) => {
              const list = [...s.resolved];
              list[idx] = next;
              setResolved(list);
            }}
          />
        ))}
      </div>

      <div className="sticky bottom-0 flex justify-between gap-3 border-t border-gray-200 bg-white/95 p-4 backdrop-blur">
        <Button variant="secondary" onClick={() => setStep({ kind: "select" })}>
          <X className="mr-1 h-4 w-4" /> Cancel
        </Button>
        <Button size="lg" onClick={onConfirm} disabled={pending}>
          <Check className="mr-1 h-4 w-4" />
          {pending ? "Working…" : `Confirm & Save (${stats.matched + stats.creating})`}
        </Button>
      </div>

      {/* Conflict resolution modal */}
      {conflicts && (
        <Modal open={!!conflicts} onClose={() => setConflicts(null)} className="max-w-2xl"
          title="Existing data found">
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
              <div>
                Some students already have marks in one or more of these exams. Choose what to do —
                you can also override per student on the row above.
              </div>
            </div>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {conflicts.map((c) => (
                <li key={c.key} className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs">
                  <div className="font-medium text-gray-900">
                    {divNameById.get(c.divisionId)} · {c.testType} · starts {c.exam_start_date}
                  </div>
                  <div className="mt-0.5 text-gray-600">
                    {c.conflicting_student_ids.length} student{c.conflicting_student_ids.length === 1 ? "" : "s"} already have marks in this exam.
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-3">
              <Button variant="secondary" onClick={() => setConflicts(null)}>Cancel — I&apos;ll adjust manually</Button>
              <Button variant="secondary" onClick={() => {
                applyDefaultToConflicts("skip");
                setConflicts(null);
                toast.info("Conflicting students set to Skip. Confirm & Save again.");
              }}>Skip all conflicting</Button>
              <Button onClick={() => {
                applyDefaultToConflicts("replace");
                setConflicts(null);
                // Immediately commit with replace
                startTransition(async () => {
                  const included = s.resolved.filter((r) => r.mode !== "skip").map((r) =>
                    conflicts.some((c) => c.conflicting_student_ids.includes(r.chosen_id ?? ""))
                      ? { ...r, on_conflict: "replace" as const }
                      : r,
                  );
                  try {
                    const g = buildGroups(included);
                    await commitBatch(g);
                  } catch (err) {
                    toast.error((err as Error).message);
                  }
                });
              }}>Replace all conflicting</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StepHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
        {step}
      </div>
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
    </div>
  );
}

function StudentCard({
  resolved, divisionsForStd, rostersByDivision, onChange,
}: {
  resolved: ResolvedStudent;
  divisionsForStd: Div[];
  rostersByDivision: Record<string, Candidate[]>;
  onChange: (r: ResolvedStudent) => void;
}) {
  const [open, setOpen] = useState(false);

  const badge = (() => {
    if (resolved.mode === "skip") return { text: "Skipped", cls: "bg-gray-100 text-gray-600" };
    if (resolved.mode === "create") return { text: "New student", cls: "bg-indigo-50 text-indigo-700" };
    if (resolved.match.status === "matched") return { text: "Matched", cls: "bg-green-50 text-green-700" };
    if (resolved.match.status === "review")  return { text: "Review", cls: "bg-amber-50 text-amber-700" };
    return { text: "Unmatched", cls: "bg-red-50 text-red-700" };
  })();

  const currentRoster = rostersByDivision[resolved.division_id ?? ""] ?? [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start gap-3 p-4">
        <div className="min-w-45 flex-1">
          <div className="text-xs uppercase text-gray-500">From file</div>
          <div className="font-medium text-gray-900">
            {resolved.raw.raw_student_name || <em className="text-gray-400">(no name)</em>}
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            {resolved.raw.roll_no != null && <>Roll #{resolved.raw.roll_no} · </>}
            {resolved.raw.division_canonical && <>Div {displayDivision(resolved.raw.division_canonical, "mr")} · </>}
            {resolved.raw.gr_no && <>GR {resolved.raw.gr_no} · </>}
            {resolved.raw.test_type && <span className="text-indigo-600">Test: {resolved.raw.test_type}</span>}
          </div>
        </div>

        <div className="min-w-35">
          <div className="text-xs uppercase text-gray-500">Division</div>
          <select
            className="mt-0.5 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
            value={resolved.division_id ?? ""}
            onChange={(e) => onChange({ ...resolved, division_id: e.target.value, chosen_id: null })}
          >
            {divisionsForStd.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="min-w-35">
          <div className="mb-1 text-xs uppercase text-gray-500">Action</div>
          <div className="flex gap-1 rounded-md border border-gray-300 bg-white p-0.5 text-xs">
            {(["existing", "create", "skip"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => onChange({ ...resolved, mode: m })}
                className={`flex-1 rounded px-2 py-1 ${
                  resolved.mode === m ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {m === "existing" ? "Map" : m === "create" ? "Create" : "Skip"}
              </button>
            ))}
          </div>
          {resolved.mode === "existing" && resolved.chosen_id && (
            <div className="mt-2">
              <div className="text-xs uppercase text-gray-500">On conflict</div>
              <div className="flex gap-1 rounded-md border border-gray-300 bg-white p-0.5 text-xs">
                {(["replace", "skip"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => onChange({ ...resolved, on_conflict: c })}
                    className={`flex-1 rounded px-2 py-1 ${resolved.on_conflict === c ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                  >
                    {c === "replace" ? "Replace" : "Skip"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="min-w-55 flex-1">
          {resolved.mode === "existing" && (
            <>
              <div className="text-xs uppercase text-gray-500">Map to student</div>
              <select
                className="mt-0.5 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
                value={resolved.chosen_id ?? ""}
                onChange={(e) => onChange({ ...resolved, chosen_id: e.target.value || null })}
              >
                <option value="">— pick —</option>
                {currentRoster.map((c) => (
                  <option key={c.id} value={c.id}>#{c.roll_no} — {c.name}</option>
                ))}
              </select>
              {resolved.match.status !== "matched" && resolved.match.score > 0 && (
                <div className="mt-1 text-xs text-gray-500">Match score {(resolved.match.score * 100).toFixed(0)}%</div>
              )}
            </>
          )}
          {resolved.mode === "create" && (
            <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3">
              <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-indigo-700">
                <UserPlus className="h-3 w-3" /> Create in this division
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label>Roll no *
                  <Input className="h-8" required type="number" min={1}
                    value={resolved.newStudent.roll_no === "" ? "" : resolved.newStudent.roll_no}
                    onChange={(e) => onChange({ ...resolved, newStudent: {
                      ...resolved.newStudent,
                      roll_no: e.target.value === "" ? "" : Number(e.target.value),
                    }})} />
                </label>
                <label>GR no
                  <Input className="h-8" value={resolved.newStudent.gr_no}
                    onChange={(e) => onChange({ ...resolved, newStudent: { ...resolved.newStudent, gr_no: e.target.value }})} />
                </label>
                <label>Parent mobile *
                  <Input className="h-8" required value={resolved.newStudent.parent_mobile}
                    onChange={(e) => onChange({ ...resolved, newStudent: { ...resolved.newStudent, parent_mobile: e.target.value }})} />
                </label>
                <label>DOB *
                  <Input className="h-8" required type="date" value={resolved.newStudent.dob}
                    onChange={(e) => onChange({ ...resolved, newStudent: { ...resolved.newStudent, dob: e.target.value }})} />
                </label>
              </div>
            </div>
          )}
        </div>

        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.text}</span>

        <button onClick={() => setOpen((v) => !v)} className="text-xs text-indigo-600 hover:underline">
          {open ? "Hide" : "Show"} {resolved.raw.subjects.length} papers
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100 p-4">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="py-1 pr-3">#</th>
                <th className="py-1 pr-3">Date</th>
                <th className="py-1 pr-3">Subject</th>
                <th className="py-1 pr-3 text-right">Marks</th>
                <th className="py-1 pr-3 text-right">Max</th>
                <th className="py-1">Grade</th>
              </tr>
            </thead>
            <tbody>
              {resolved.raw.subjects.map((sub, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="py-1 pr-3 text-gray-600">{sub.paper_no ?? "-"}</td>
                  <td className="py-1 pr-3 text-gray-600">{sub.date ?? "-"}</td>
                  <td className="py-1 pr-3 font-medium text-gray-900">{sub.subject}</td>
                  <td className="py-1 pr-3 text-right text-gray-800">{sub.marks_obtained ?? <em className="text-gray-400">—</em>}</td>
                  <td className="py-1 pr-3 text-right text-gray-500">{sub.max_marks ?? "-"}</td>
                  <td className="py-1 text-gray-700">{sub.grade ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
