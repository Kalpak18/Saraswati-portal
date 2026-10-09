"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowLeft, CheckCircle2, FileSpreadsheet, HelpCircle, Upload, UserCheck, UserX,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import {
  parseAchievementsWorkbook, type ParsedAchievementRow, type Field,
} from "@/lib/excel/parseAchievements";
import { matchInRoster } from "@/lib/match/rosterMatch";
import { CATEGORIES, LEVELS, levelLabel, ordinal, type Level } from "@/lib/achievements";
import { checkAchievementImport, importAchievements } from "../actions";
import type { RosterStudent } from "../roster";

type Status = "matched" | "review" | "unmatched";

type Row = ParsedAchievementRow & {
  include: boolean;
  status: Status;
  student_id: string | null;        // chosen link (null = keep as a name only)
  candidates: RosterStudent[];
};

type Parsed = {
  fileName: string;
  key: string;
  priorImport: { uploaded_at: string } | null;
  columns: Field[];
  warnings: string[];
  rows: Row[];
};

const FIELD_LABEL: Partial<Record<Field, string>> = {
  name: "Name", standard: "Class", division: "Division", roll: "Roll no", exam: "Exam",
  level: "Level", rank: "Rank", score: "Marks", max: "Out of", percent: "%", award: "Award / result",
  date: "Date", year: "Year",
};

async function sha256Hex(buf: ArrayBuffer | string): Promise<string> {
  const data = typeof buf === "string" ? new TextEncoder().encode(buf) : buf;
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function ImportWizard({ roster }: { roster: RosterStudent[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<{ inserted: number; updated: number } | null>(null);
  const [filter, setFilter] = useState<"all" | Status>("all");

  // File-wide defaults — fill blanks the sheet did not provide.
  const [examName, setExamName] = useState("");
  const [level, setLevel] = useState<Level | "">("");
  const [year, setYear] = useState("");
  const [category, setCategory] = useState("competitive");
  const [publish, setPublish] = useState(true);

  const rosterById = useMemo(() => new Map(roster.map((r) => [r.id, r])), [roster]);

  async function onFile(file: File) {
    if (!/\.(xlsx|xls|csv|ods)$/i.test(file.name)) {
      toast.error("Choose an Excel (.xlsx / .xls) or CSV file");
      return;
    }
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const res = parseAchievementsWorkbook(buf);
      if (res.rows.length === 0) {
        toast.error(res.warnings[0] ?? "No student rows found. The sheet needs a header row with a Name column.");
        return;
      }
      const key = await sha256Hex(`${file.name}|${await sha256Hex(buf)}`);
      const priorImport = await checkAchievementImport(key);

      const rows: Row[] = res.rows.map((r) => {
        const m = matchInRoster(r.student_name, roster, {
          standard: r.standard, division: r.division, roll_no: r.roll_no,
        });
        const ids = new Set(m.candidates.map((c) => c.id));
        return {
          ...r,
          // Rows that only inherited the file title follow the editable
          // "Exam / event name" field instead of pinning the parsed guess.
          exam_name: r.exam_name === res.exam_name ? null : r.exam_name,
          level: r.level === res.level ? null : r.level,
          academic_year: r.academic_year === res.academic_year ? null : r.academic_year,
          include: true,
          status: m.status,
          student_id: m.status === "unmatched" ? null : m.student_id,
          candidates: m.pool.filter((p) => ids.has(p.id)),
        };
      });

      setExamName(res.exam_name ?? file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
      setLevel(res.level ?? "");
      setYear(res.academic_year ?? "");
      setParsed({ fileName: file.name, key, priorImport, columns: res.columns, warnings: res.warnings, rows });
    } catch (err) {
      toast.error(`Could not read file: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  function patchRow(key: string, patch: Partial<Row>) {
    setParsed((p) => p && { ...p, rows: p.rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) });
  }

  const counts = useMemo(() => {
    const rows = parsed?.rows ?? [];
    return {
      all: rows.length,
      matched: rows.filter((r) => r.status === "matched").length,
      review: rows.filter((r) => r.status === "review").length,
      unmatched: rows.filter((r) => r.status === "unmatched").length,
      included: rows.filter((r) => r.include).length,
    };
  }, [parsed]);

  function save() {
    if (!parsed) return;
    const rows = parsed.rows.filter((r) => r.include);
    if (rows.length === 0) { toast.error("Select at least one row"); return; }
    const missingExam = rows.some((r) => !(r.exam_name || examName.trim()));
    if (missingExam) { toast.error("Enter the exam / event name"); return; }

    startTransition(async () => {
      try {
        const res = await importAchievements({
          idempotency_key: parsed.key,
          file_name: parsed.fileName,
          category,
          publish,
          rows: rows.map((r) => ({
            student_id: r.student_id,
            student_name: r.student_name,
            standard_label: r.standard ?? r.standard_raw,
            exam_name: (r.exam_name || examName).trim(),
            level: r.level ?? (level || null),
            rank: r.rank,
            score: r.score,
            max_score: r.max_score,
            award: r.award,
            medal: r.medal,
            achieved_on: r.achieved_on,
            academic_year: r.academic_year ?? (year.trim() || null),
          })),
        });
        setDone(res);
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  // ---------- Done ----------
  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">Import complete</h1>
        <p className="mt-2 text-sm text-ink-600">
          {done.inserted} added · {done.updated} updated{publish ? " · now live on the website" : " · saved as hidden"}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/admin/website/achievements"><Button variant="secondary">Back to achievements</Button></Link>
          <Link href="/achievements" target="_blank"><Button>View on website</Button></Link>
        </div>
      </div>
    );
  }

  // ---------- Upload ----------
  if (!parsed) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          breadcrumbs={[
            { label: "Website", href: "/admin/website" },
            { label: "Achievements", href: "/admin/website/achievements" },
            { label: "Import" },
          ]}
          title="Import competitive-exam results"
          description="Olympiad, NMMS, scholarship, Homi Bhabha, MTS, sports or cultural result sheets — in any column order, Marathi or English."
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void onFile(f);
          }}
          disabled={busy}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-white px-6 py-16 text-center transition-colors",
            dragging ? "border-brand-500 bg-brand-50" : "border-ink-200 hover:border-brand-300 hover:bg-brand-50/40",
          )}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            {busy ? <FileSpreadsheet className="h-7 w-7 animate-pulse" /> : <Upload className="h-7 w-7" />}
          </div>
          <div className="font-display text-lg font-semibold text-ink-900">
            {busy ? "Reading file…" : "Drop the result sheet here"}
          </div>
          <div className="text-sm text-ink-500">or click to choose · .xlsx, .xls, .csv</div>
        </button>
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,.ods" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }} />

        <div className="mt-8 rounded-xl border border-ink-200 bg-white p-5 text-sm text-ink-700 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-ink-900">
            <HelpCircle className="h-4 w-4 text-brand-700" /> What the importer understands
          </h2>
          <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            <li><b>Name</b> · नाव · Student / Candidate name <span className="text-red-600">(required)</span></li>
            <li><b>Class</b> · इयत्ता · Std · Grade</li>
            <li><b>Rank</b> · Merit no · गुणवत्ता क्रमांक · प्रथम / 1st</li>
            <li><b>Marks</b> · गुण · Score, and <b>Out of</b> · पैकी</li>
            <li><b>Award</b> · Medal · पारितोषिक · Result · Scholarship</li>
            <li><b>Level</b> · स्तर · District / State / National</li>
            <li><b>Exam</b> · परीक्षा · Competition (else taken from the title row)</li>
            <li><b>Division</b> + <b>Roll no</b> · exact roster match</li>
          </ul>
          <p className="mt-3 text-xs text-ink-500">
            A title row above the table like “MTS Olympiad 2025-26 State Level” fills in the exam, year and level for every row.
            Parent phone numbers, DOB, caste and similar columns are ignored.
          </p>
        </div>
      </div>
    );
  }

  // ---------- Review ----------
  const visible = parsed.rows.filter((r) => filter === "all" || r.status === filter);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        breadcrumbs={[
          { label: "Website", href: "/admin/website" },
          { label: "Achievements", href: "/admin/website/achievements" },
          { label: "Import" },
        ]}
        title="Review import"
        description={`${parsed.fileName} · ${counts.all} rows found`}
        actions={
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setParsed(null)}>
            Choose another file
          </Button>
        }
      />

      {parsed.priorImport && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          This exact file was already imported on {new Date(parsed.priorImport.uploaded_at).toLocaleString()}.
          Undo that import first if you need to bring it in again.
        </div>
      )}
      {parsed.warnings.map((w) => (
        <div key={w} className="mb-2 rounded-lg border border-ink-200 bg-ink-50 p-3 text-xs text-ink-600">{w}</div>
      ))}

      {/* Defaults */}
      <section className="mb-5 rounded-xl border border-ink-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <Input containerClassName="md:col-span-2" label="Exam / event name" required value={examName}
            onChange={(e) => setExamName(e.target.value)} hint="Used for rows without their own exam column." />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink-700">Level</span>
            <Select value={level} onChange={(e) => setLevel(e.target.value as Level | "")} className="h-[42px]">
              <option value="">—</option>
              {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.en} · {l.mr}</option>)}
            </Select>
          </label>
          <Input label="Academic year" placeholder="2025-26" value={year} onChange={(e) => setYear(e.target.value)} />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink-700">Category</span>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="h-[42px]">
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.en}</option>)}
            </Select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-500">
          <span>Columns detected:</span>
          {parsed.columns.map((c) => <Badge key={c} tone="brand">{FIELD_LABEL[c] ?? c}</Badge>)}
        </div>
      </section>

      {/* Filter tabs */}
      <div className="mb-3 flex flex-wrap gap-2">
        {([
          ["all", `All ${counts.all}`],
          ["matched", `Matched ${counts.matched}`],
          ["review", `Check ${counts.review}`],
          ["unmatched", `Not in roster ${counts.unmatched}`],
        ] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setFilter(k)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors",
              filter === k ? "bg-brand-700 text-white ring-brand-700" : "bg-white text-ink-700 ring-ink-200 hover:bg-ink-50",
            )}>
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ink-200 text-sm">
            <thead className="bg-ink-50 text-left text-xs font-medium uppercase tracking-wide text-ink-500">
              <tr>
                <th className="w-10 px-3 py-3" />
                <th className="px-3 py-3">Row</th>
                <th className="px-3 py-3">Name in file</th>
                <th className="px-3 py-3">Link to student</th>
                <th className="px-3 py-3">Exam</th>
                <th className="px-3 py-3">Result</th>
                <th className="px-3 py-3">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {visible.map((r) => (
                <tr key={r.key} className={cn(!r.include && "opacity-50")}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={r.include} aria-label={`Include ${r.student_name}`}
                      onChange={(e) => patchRow(r.key, { include: e.target.checked })}
                      className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
                  </td>
                  <td className="px-3 py-2.5 text-xs tabular-nums text-ink-400">{r.row_no}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-ink-900">{r.student_name}</div>
                    <div className="text-xs text-ink-500">
                      {[r.standard ?? r.standard_raw, r.division, r.roll_no != null ? `Roll ${r.roll_no}` : null].filter(Boolean).join(" · ")}
                    </div>
                    {r.warnings.map((w) => (
                      <div key={w} className="mt-0.5 flex items-center gap-1 text-xs text-amber-700">
                        <AlertTriangle className="h-3 w-3" /> {w}
                      </div>
                    ))}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {r.student_id && r.status === "matched" ? (
                        <UserCheck className="h-4 w-4 flex-none text-emerald-600" aria-label="Matched" />
                      ) : r.student_id ? (
                        <HelpCircle className="h-4 w-4 flex-none text-amber-500" aria-label="Please check" />
                      ) : (
                        <UserX className="h-4 w-4 flex-none text-ink-300" aria-label="Not linked" />
                      )}
                      <Select
                        value={r.student_id ?? ""}
                        onChange={(e) => patchRow(r.key, {
                          student_id: e.target.value || null,
                          status: e.target.value ? "matched" : "unmatched",
                        })}
                        className="min-w-56 py-1.5 text-xs"
                        aria-label={`Roster link for ${r.student_name}`}
                      >
                        <option value="">Not in roster — keep name only</option>
                        {r.student_id && !r.candidates.some((c) => c.id === r.student_id) && rosterById.get(r.student_id) && (
                          <option value={r.student_id}>{rosterById.get(r.student_id)!.name}</option>
                        )}
                        {r.candidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} · {c.standard_label ?? "—"} {c.division_label ?? ""} · #{c.roll_no}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-ink-700">
                    {r.exam_name || <span className="text-ink-400">{examName || "—"}</span>}
                    <div className="text-xs text-ink-500">{r.academic_year ?? (year || "")}</div>
                  </td>
                  <td className="px-3 py-2.5 text-ink-700">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {r.rank != null && <span className="font-semibold text-ink-900">{ordinal(r.rank, "en")}</span>}
                      {r.score != null && (
                        <span className="tabular-nums">{r.score}{r.max_score != null ? `/${r.max_score}` : ""}</span>
                      )}
                      {r.percentage != null && <span className="text-xs text-ink-500">({r.percentage}%)</span>}
                      {r.award && <Badge tone={r.medal ? "accent" : "gray"}>{r.award}</Badge>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-ink-600">
                    {levelLabel(r.level ?? (level || null), "en") ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex flex-col gap-3 border-t border-ink-200 bg-white/95 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
          Publish on the website straight away
        </label>
        <div className="flex items-center gap-3">
          {counts.review > 0 && (
            <span className="text-xs text-amber-700">{counts.review} row{counts.review === 1 ? "" : "s"} to check</span>
          )}
          <Button onClick={save} loading={pending} disabled={!!parsed.priorImport || counts.included === 0}>
            Import {counts.included} row{counts.included === 1 ? "" : "s"}
          </Button>
        </div>
      </div>
    </div>
  );
}
