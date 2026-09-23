"use server";

import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const LookupSchema = z.object({
  mobile: z.string().min(4).max(20),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function findStudents(input: unknown) {
  const p = LookupSchema.parse(input);
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("students")
    .select("id, roll_no, student_name, division_id, divisions(name, standards(name, academic_year))")
    .eq("parent_mobile", p.mobile.trim())
    .eq("dob", p.dob);
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => {
    const div = s.divisions as unknown as { name: string; standards: { name: string; academic_year: string } | null } | null;
    return {
      id: s.id,
      roll_no: s.roll_no,
      student_name: s.student_name,
      class_name: div ? `${div.standards?.name ?? ""} — ${div.name}`.trim() : "",
      academic_year: div?.standards?.academic_year ?? "",
    };
  });
}

export async function listExamsForStudent(studentId: string) {
  const admin = createSupabaseAdmin();
  // Only exams where this student has marks
  const { data: markRows } = await admin
    .from("marks")
    .select("exam_id")
    .eq("student_id", studentId);
  const examIds = Array.from(new Set((markRows ?? []).map((r) => r.exam_id)));
  if (examIds.length === 0) return [];
  const { data, error } = await admin
    .from("exams")
    .select("id, test_type, academic_year, exam_start_date, exam_end_date, exam_date")
    .in("id", examIds)
    .order("exam_start_date", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
