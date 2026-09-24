import Link from "next/link";
import { Upload, FileSpreadsheet, ArrowRight } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";
import { Badge } from "@/components/ui/Badge";

export default async function ResultsPage() {
  const supabase = await createSupabaseServer();
  const { data: exams } = await supabase
    .from("exams")
    .select("id, test_type, academic_year, exam_start_date, exam_end_date, division_id, divisions(name, standards(name))")
    .order("exam_start_date", { ascending: false });

  const list = exams ?? [];

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
                <td className="px-4 py-3 font-medium text-gray-900">{label}</td>
                <td className="px-4 py-3 text-gray-700">{e.test_type}</td>
                <td className="px-4 py-3 text-gray-700 tabular-nums">{e.academic_year}</td>
                <td className="px-4 py-3 text-gray-700 tabular-nums">{dateRange}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/results/${e.id}`}
                    className="inline-flex items-center gap-1 rounded font-medium text-indigo-600 hover:text-indigo-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                  >
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </>
            ),
            mobile: (
              <Link
                href={`/admin/results/${e.id}`}
                className="flex items-center justify-between gap-3 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                    {label}
                  </div>
                  <div className="mt-0.5 truncate text-base font-semibold text-gray-900">
                    {e.test_type}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                    <Badge tone="indigo">{e.academic_year}</Badge>
                    <span className="tabular-nums">{dateRange}</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 flex-none text-gray-400" />
              </Link>
            ),
          };
        })}
      />
    </div>
  );
}
