import Link from "next/link";
import { Upload } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { selectAll } from "@/lib/supabase/selectAll";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import ExamsList, { type ExamRow } from "./ExamsList";

export default async function ResultsPage(props: PageProps<"/admin/results">) {
  const sp = await props.searchParams;
  const supabase = await createSupabaseServer();

  // ~72 divisions × many tests a year: list one year (and optionally one
  // class) at a time instead of every exam ever uploaded.
  const { data: standards } = await supabase
    .from("standards")
    .select("id, name, academic_year, display_order")
    .order("academic_year", { ascending: false })
    .order("display_order", { ascending: true });
  const years = Array.from(new Set((standards ?? []).map((s) => s.academic_year)));
  const year = typeof sp.year === "string" && years.includes(sp.year) ? sp.year : years[0] ?? "";
  const yearStandards = (standards ?? []).filter((s) => s.academic_year === year);
  const standardId = typeof sp.standard === "string" && yearStandards.some((s) => s.id === sp.standard) ? sp.standard : "";

  const all = await selectAll((from, to) => {
    let q = supabase
      .from("exams")
      .select("id, test_type, academic_year, exam_start_date, exam_end_date, division_id, divisions!inner(name, standard_id, standards(name))");
    if (year) q = q.eq("academic_year", year);
    if (standardId) q = q.eq("divisions.standard_id", standardId);
    return q.order("exam_start_date", { ascending: false }).order("id").range(from, to);
  });
  // Test names this year/class has, e.g. "आठवडी परीक्षा", "प्रथम सत्र".
  const tests = Array.from(new Set(all.map((e) => e.test_type))).sort();
  const test = typeof sp.test === "string" && tests.includes(sp.test) ? sp.test : "";
  const list = test ? all.filter((e) => e.test_type === test) : all;

  const exams: ExamRow[] = list.map((e) => {
    const div = e.divisions as unknown as { name: string; standards: { name: string } | null } | null;
    return {
      id: e.id,
      label: div ? `${div.standards?.name ?? ""} — ${div.name}`.trim() : "",
      test_type: e.test_type,
      academic_year: e.academic_year,
      dates: e.exam_start_date === e.exam_end_date ? e.exam_start_date : `${e.exam_start_date} → ${e.exam_end_date}`,
    };
  });
  const filterLabel = [year, yearStandards.find((s) => s.id === standardId)?.name, test].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Results / Report cards"
        description={list.length ? `${list.length} exam${list.length === 1 ? "" : "s"} · ${filterLabel}` : undefined}
        actions={
          <Link href="/admin/results/upload">
            <Button leftIcon={<Upload className="h-4 w-4" />}>
              <span className="hidden sm:inline">Upload new result</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </Link>
        }
      />

      {years.length > 0 && (
        <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-ink-600">Year</span>
            <select name="year" defaultValue={year} className="h-10 rounded-md border border-ink-300 bg-white px-3 text-sm">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-ink-600">Class</span>
            <select name="standard" defaultValue={standardId} className="h-10 rounded-md border border-ink-300 bg-white px-3 text-sm">
              <option value="">All classes</option>
              {yearStandards.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-ink-600">Test</span>
            <select name="test" defaultValue={test} className="h-10 max-w-60 rounded-md border border-ink-300 bg-white px-3 text-sm">
              <option value="">All tests</option>
              {tests.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <Button type="submit" variant="secondary">Show</Button>
        </form>
      )}

      <ExamsList exams={exams} filterLabel={filterLabel} />
    </div>
  );
}
