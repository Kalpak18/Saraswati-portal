import Link from "next/link";
import { Upload, FileSpreadsheet, ArrowRight } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { selectAll } from "@/lib/supabase/selectAll";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";
import { Badge } from "@/components/ui/Badge";

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

  const list = await selectAll((from, to) => {
    let q = supabase
      .from("exams")
      .select("id, test_type, academic_year, exam_start_date, exam_end_date, division_id, divisions!inner(name, standard_id, standards(name))");
    if (year) q = q.eq("academic_year", year);
    if (standardId) q = q.eq("divisions.standard_id", standardId);
    return q.order("exam_start_date", { ascending: false }).order("id").range(from, to);
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Results / Report cards"
        description={list.length ? `${list.length} exam${list.length === 1 ? "" : "s"} uploaded` : undefined}
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
          <Button type="submit" variant="secondary">Show</Button>
        </form>
      )}

      <ResponsiveTable
        head={
          <>
            <th className="px-4 py-3">Class</th>
            <th className="px-4 py-3">Test type</th>
            <th className="px-4 py-3">Academic year</th>
            <th className="px-4 py-3">Exam dates</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </>
        }
        empty={
          <EmptyState
            icon={<FileSpreadsheet className="h-6 w-6" />}
            title="No exams uploaded yet"
            description="Upload a filled result Excel to publish report cards for a division."
            action={
              <Link href="/admin/results/upload">
                <Button leftIcon={<Upload className="h-4 w-4" />}>Upload new result</Button>
              </Link>
            }
          />
        }
        rows={list.map((e) => {
          const div = e.divisions as unknown as { name: string; standards: { name: string } | null } | null;
          const label = div ? `${div.standards?.name ?? ""} — ${div.name}`.trim() : "";
          const dateRange =
            e.exam_start_date === e.exam_end_date
              ? e.exam_start_date
              : `${e.exam_start_date} → ${e.exam_end_date}`;
          return {
            key: e.id,
            cells: (
              <>
                <td className="px-4 py-3 font-medium text-ink-900">{label}</td>
                <td className="px-4 py-3 text-ink-700">{e.test_type}</td>
                <td className="px-4 py-3 text-ink-700 tabular-nums">{e.academic_year}</td>
                <td className="px-4 py-3 text-ink-700 tabular-nums">{dateRange}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/results/${e.id}`}
                    className="inline-flex items-center gap-1 rounded font-medium text-brand-700 hover:text-brand-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  >
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </>
            ),
            mobile: (
              <Link
                href={`/admin/results/${e.id}`}
                className="flex items-center justify-between gap-3 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-ink-500">
                    {label}
                  </div>
                  <div className="mt-0.5 truncate text-base font-semibold text-ink-900">
                    {e.test_type}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-500">
                    <Badge tone="brand">{e.academic_year}</Badge>
                    <span className="tabular-nums">{dateRange}</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 flex-none text-ink-400" />
              </Link>
            ),
          };
        })}
      />
    </div>
  );
}
