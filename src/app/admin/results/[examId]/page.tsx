import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer, FileText } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

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

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">
            <Link href="/admin/results" className="hover:underline">Results</Link> / {label}
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            {exam.test_type}{" "}
            <span className="text-gray-500">
              — {exam.exam_start_date}
              {exam.exam_end_date && exam.exam_end_date !== exam.exam_start_date && <> → {exam.exam_end_date}</>}
              {" · "}{exam.academic_year}
            </span>
          </h1>
        </div>
        <Link href={`/admin/results/${examId}/print-all`} target="_blank">
          <Button><Printer className="mr-1 h-4 w-4" /> Print all cards</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Roll</th>
              <th className="px-4 py-3">GR No</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students?.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{s.roll_no}</td>
                <td className="px-4 py-3 text-gray-500">{s.gr_no ?? "-"}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{s.student_name}</td>
                <td className="px-4 py-3">
                  {withMarks.has(s.id) ? (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Marks entered</span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">No marks</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {withMarks.has(s.id) ? (
                    <div className="inline-flex items-center gap-3">
                      <Link href={`/admin/results/${examId}/${s.id}/edit`}
                        className="text-sm text-gray-600 hover:underline">Edit</Link>
                      <Link
                        href={`/admin/results/${examId}/${s.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                      >
                        <FileText className="h-4 w-4" /> View card
                      </Link>
                    </div>
                  ) : (
                    <Link href={`/admin/results/${examId}/${s.id}/edit`}
                      className="text-sm text-indigo-600 hover:underline">Enter marks</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
