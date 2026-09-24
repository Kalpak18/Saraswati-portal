import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer, FileText, Pencil } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";
import { Badge } from "@/components/ui/Badge";

export default async function ExamDetailPage(props: PageProps<"/admin/results/[examId]">) {
  const { examId } = await props.params;
  const supabase = await createSupabaseServer();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, test_type, academic_year, exam_start_date, exam_end_date, exam_date, division_id, divisions(name, standards(name))")
    .eq("id", examId)
    .single();

  if (!exam) notFound();

  const { data: students } = await supabase
    .from("students")
    .select("id, roll_no, student_name, gr_no")
    .eq("division_id", exam.division_id)
    .order("roll_no", { ascending: true });

  // Which students have marks recorded
  const { data: marks } = await supabase
    .from("marks")
    .select("student_id")
    .eq("exam_id", examId);
  const withMarks = new Set((marks ?? []).map((m) => m.student_id));

  const div = exam.divisions as unknown as { name: string; standards: { name: string } | null } | null;
  const label = div ? `${div.standards?.name ?? ""} — ${div.name}`.trim() : "";
  const dateRange =
    exam.exam_start_date === exam.exam_end_date
      ? exam.exam_start_date
      : `${exam.exam_start_date} → ${exam.exam_end_date}`;

  const list = students ?? [];
  const entered = list.filter((s) => withMarks.has(s.id)).length;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        breadcrumbs={[
          { label: "Results", href: "/admin/results" },
          { label: label || "Exam" },
        ]}
        title={exam.test_type}
        description={
          <span className="tabular-nums text-gray-500">
            {dateRange} · {exam.academic_year} · {entered}/{list.length} students with marks
          </span>
        }
        actions={
          <Link href={`/admin/results/${examId}/print-all`} target="_blank">
            <Button leftIcon={<Printer className="h-4 w-4" />}>
              <span className="hidden sm:inline">Print all cards</span>
              <span className="sm:hidden">Print all</span>
            </Button>
          </Link>
        }
      />

      <ResponsiveTable
        head={
          <>
            <th className="px-4 py-3">Roll</th>
            <th className="px-4 py-3">GR No</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </>
        }
        empty={<div className="text-center text-sm text-gray-500">No students in this division.</div>}
        rows={list.map((s) => {
          const hasMarks = withMarks.has(s.id);
          return {
            key: s.id,
            cells: (
              <>
                <td className="px-4 py-3 tabular-nums text-gray-700">{s.roll_no}</td>
                <td className="px-4 py-3 text-gray-500">{s.gr_no ?? "—"}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{s.student_name}</td>
                <td className="px-4 py-3">
                  {hasMarks
                    ? <Badge tone="green">Marks entered</Badge>
                    : <Badge tone="gray">No marks</Badge>}
                </td>
                <td className="px-4 py-3 text-right">
                  {hasMarks ? (
                    <div className="inline-flex items-center gap-3">
                      <Link
                        href={`/admin/results/${examId}/${s.id}/edit`}
                        className="rounded text-sm text-gray-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/results/${examId}/${s.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      >
                        <FileText className="h-4 w-4" />
                        View card
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`/admin/results/${examId}/${s.id}/edit`}
                      className="rounded text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                      Enter marks
                    </Link>
                  )}
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
                  {hasMarks
                    ? <Badge tone="green">Entered</Badge>
                    : <Badge tone="gray">Pending</Badge>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {hasMarks ? (
                    <>
                      <Link
                        href={`/admin/results/${examId}/${s.id}`}
                        target="_blank"
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700"
                      >
                        <FileText className="h-4 w-4" />
                        View card
                      </Link>
                      <Link
                        href={`/admin/results/${examId}/${s.id}/edit`}
                        className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={`/admin/results/${examId}/${s.id}/edit`}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700"
                    >
                      Enter marks
                    </Link>
                  )}
                </div>
              </div>
            ),
          };
        })}
      />
    </div>
  );
}
