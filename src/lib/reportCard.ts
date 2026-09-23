import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportCardData } from "@/components/ReportCard";

export async function loadReportCard(
  supabase: SupabaseClient,
  examId: string,
  studentId: string,
): Promise<ReportCardData | null> {
  const [{ data: exam }, { data: student }, { data: school }, { data: subjects }, { data: marks }] = await Promise.all([
    supabase.from("exams").select("id, test_type, academic_year, exam_date, exam_start_date, exam_end_date, divisions(name, standards(name))").eq("id", examId).single(),
    supabase.from("students").select("roll_no, student_name, gr_no").eq("id", studentId).single(),
    supabase.from("school_settings").select("name, address, logo_url").limit(1).single(),
    supabase.from("exam_subjects").select("id, subject_name, paper_no, paper_date, max_marks, display_order").eq("exam_id", examId).order("display_order", { ascending: true }),
    supabase.from("marks").select("subject_id, marks_obtained, grade").eq("exam_id", examId).eq("student_id", studentId),
  ]);

  if (!exam || !student) return null;

  const marksByS = new Map<string, { marks_obtained: number | null; grade: string | null }>();
  for (const m of marks ?? []) {
    marksByS.set(m.subject_id, { marks_obtained: m.marks_obtained, grade: m.grade });
  }

  const div = exam.divisions as unknown as { name: string; standards: { name: string } | null } | null;
  const className = div ? `${div.standards?.name ?? ""} — ${div.name}`.trim() : "";
  const st = student as { roll_no: number; student_name: string; gr_no: string | null };

  return {
    school: {
      name: school?.name ?? "",
      address: school?.address ?? "",
      logo_url: school?.logo_url ?? null,
    },
    className,
    test_type: exam.test_type,
    academic_year: exam.academic_year,
    exam_date: exam.exam_date ?? null,
    student: { roll_no: st.roll_no, name: st.student_name, gr_no: st.gr_no },
    papers: (subjects ?? []).map((s) => {
      const m = marksByS.get(s.id);
      return {
        paper_no: s.paper_no,
        paper_date: s.paper_date,
        subject_name: s.subject_name,
        marks_obtained: m?.marks_obtained ?? null,
        max_marks: s.max_marks,
        grade: m?.grade ?? null,
      };
    }),
  };
}
