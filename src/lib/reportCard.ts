import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportCardData } from "@/components/ReportCard";
import { brandingFromRow } from "@/lib/branding";
import { DEFAULT_NAME_MR } from "@/lib/schoolName";
import { selectAll } from "@/lib/supabase/selectAll";

const DEFAULT_ADDRESS = "Saraswati Vidyalaya, Savarkar Nagar, Ward No 3, Vasind, Maharashtra 421601";

export async function loadReportCard(
  supabase: SupabaseClient,
  examId: string,
  studentId: string,
): Promise<ReportCardData | null> {
  return (await loadReportCards(supabase, examId, studentId))[0] ?? null;
}

type MarkRow = { student_id: string; subject_id: string; marks_obtained: number | null };

/**
 * Report cards for one exam in a fixed number of queries, however many
 * students: one student's card, or (no studentId) every student who has
 * marks — in roll-number order, for "print all".
 */
export async function loadReportCards(
  supabase: SupabaseClient,
  examId: string,
  studentId?: string,
): Promise<ReportCardData[]> {
  const [{ data: exam }, { data: school }, { data: subjects }, marks] = await Promise.all([
    supabase.from("exams").select("id, test_type, academic_year, exam_date, exam_start_date, exam_end_date, divisions(name, standards(name))").eq("id", examId).single(),
    // "*": picks up name_mr / branding when those migrations have run.
    supabase.from("school_settings").select("*").limit(1).single(),
    supabase.from("exam_subjects").select("id, subject_name, paper_no, paper_date, max_marks, display_order").eq("exam_id", examId).order("display_order", { ascending: true }),
    selectAll<MarkRow>((from, to) => {
      let q = supabase.from("marks").select("student_id, subject_id, marks_obtained").eq("exam_id", examId);
      if (studentId) q = q.eq("student_id", studentId);
      return q.order("id").range(from, to);
    }),
  ]);
  if (!exam) return [];

  const ids = studentId ? [studentId] : Array.from(new Set(marks.map((m) => m.student_id)));
  if (ids.length === 0) return [];
  const students: { id: string; roll_no: number; student_name: string }[] = [];
  for (let i = 0; i < ids.length; i += 200) {   // keep the id list short enough for a URL
    const { data } = await supabase.from("students").select("id, roll_no, student_name").in("id", ids.slice(i, i + 200));
    students.push(...(data ?? []));
  }
  students.sort((a, b) => a.roll_no - b.roll_no);

  const marksBy = new Map<string, number | null>();
  for (const m of marks) marksBy.set(`${m.student_id}|${m.subject_id}`, m.marks_obtained);

  const div = exam.divisions as unknown as { name: string; standards: { name: string } | null } | null;
  const className = div ? `${div.standards?.name ?? ""} — ${div.name}`.trim() : "";
  const schoolPart = {
    name: school?.name ?? "",
    name_mr: (school?.name_mr as string | null)?.trim() || DEFAULT_NAME_MR,
    address: school?.address?.trim() || DEFAULT_ADDRESS,
    logo_url: school?.logo_url ?? null,
  };
  const branding = brandingFromRow(school);

  return students.map((st) => ({
    school: schoolPart,
    branding,
    className,
    test_type: exam.test_type,
    academic_year: exam.academic_year,
    exam_date: exam.exam_date ?? null,
    student: { roll_no: st.roll_no, name: st.student_name },
    papers: (subjects ?? []).map((s) => ({
      paper_no: s.paper_no,
      paper_date: s.paper_date,
      subject_name: s.subject_name,
      marks_obtained: marksBy.get(`${st.id}|${s.id}`) ?? null,
      max_marks: s.max_marks,
    })),
  }));
}
