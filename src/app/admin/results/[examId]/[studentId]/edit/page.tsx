import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import EditMarksForm from "./EditMarksForm";

export default async function EditMarksPage(props: PageProps<"/admin/results/[examId]/[studentId]/edit">) {
  const { examId, studentId } = await props.params;
  const supabase = await createSupabaseServer();

  const [{ data: exam }, { data: student }, { data: subjects }, { data: marks }] = await Promise.all([
    supabase.from("exams").select("id, test_type, academic_year, divisions(name, standards(name))").eq("id", examId).single(),
    supabase.from("students").select("id, roll_no, student_name").eq("id", studentId).single(),
    supabase.from("exam_subjects").select("id, subject_name, paper_no, paper_date, max_marks, display_order").eq("exam_id", examId).order("display_order", { ascending: true }),
    supabase.from("marks").select("subject_id, marks_obtained, grade").eq("exam_id", examId).eq("student_id", studentId),
  ]);
  if (!exam || !student) notFound();

  const marksBy = new Map<string, { marks_obtained: number | null; grade: string | null }>();
  for (const m of marks ?? []) marksBy.set(m.subject_id, m);

  const rows = (subjects ?? []).map((s) => ({
    subject_id: s.id,
    subject_name: s.subject_name,
    paper_no: s.paper_no,
    paper_date: s.paper_date,
    max_marks: s.max_marks,
    marks_obtained: marksBy.get(s.id)?.marks_obtained ?? null,
    grade: marksBy.get(s.id)?.grade ?? null,
  }));

  const div = exam.divisions as unknown as { name: string; standards: { name: string } | null } | null;
  const label = div ? `${div.standards?.name ?? ""} — ${div.name}`.trim() : "";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <div className="text-sm text-gray-500">
          <Link href="/admin/results" className="hover:underline">Results</Link>
          {" / "}
          <Link href={`/admin/results/${examId}`} className="hover:underline">{label} — {exam.test_type}</Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">
          Edit marks — {student.student_name} <span className="text-sm text-gray-500">(Roll #{student.roll_no})</span>
        </h1>
      </div>
      <EditMarksForm examId={examId} studentId={studentId} rows={rows} />
    </div>
  );
}
