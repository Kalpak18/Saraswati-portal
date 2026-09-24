"use server";

import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { enforceLookupRateLimit, RateLimitError } from "@/lib/rateLimit";

const LookupSchema = z.object({
  mobile: z.string().min(6).max(20),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type LookupStudent = {
  id: string;
  roll_no: number;
  gr_no: string | null;
  student_name: string;
  standard_name: string;
  division_name: string;
  class_name: string;
  academic_year: string;
};

export type LookupExam = {
  id: string;
  test_type: string;
  academic_year: string;
  exam_date: string | null;
  exam_start_date: string | null;
  exam_end_date: string | null;
  /** null when the exam is graded only / has no numeric marks */
  obtained: number | null;
  total: number | null;
  percent: number | null;
  subject_count: number;
};

const STUDENT_FIELDS =
  "id, roll_no, gr_no, student_name, division_id, divisions(name, standards(name, academic_year))";

export async function findStudents(input: unknown): Promise<LookupStudent[]> {
  const parsed = LookupSchema.safeParse(input);
  if (!parsed.success) throw new Error("अपूर्ण माहिती · Incomplete details");
  const p = parsed.data;

  // Throttled per IP: mobile + DOB is guessable, and this endpoint is public.
  try {
    await enforceLookupRateLimit();
  } catch (err) {
    if (err instanceof RateLimitError) {
      throw new Error("खूप प्रयत्न झाले. काही वेळाने पुन्हा प्रयत्न करा · Too many attempts, please try again later");
    }
    throw err;
  }

  const admin = createSupabaseAdmin();
  // Numbers are stored however they were typed/imported: "9822014571",
  // "+919822014571", "09822014571". Indian numbers are 10 digits; other
  // countries vary, so match on at most the last 10 — unambiguous once
  // paired with the date of birth.
  const digits = p.mobile.replace(/\D/g, "");
  if (digits.length < 6) return [];
  const last10 = digits.slice(-10);

  // Fast path: indexed equality on the generated column from production.sql.
  let { data, error } = await admin
    .from("students")
    .select(STUDENT_FIELDS)
    .eq("parent_mobile_norm", last10)
    .eq("dob", p.dob);

  // Migration not applied yet — fall back to the (unindexed) suffix match so
  // the portal keeps working, and say so in the logs.
  if (error && (error.code === "42703" || /parent_mobile_norm/.test(error.message))) {
    console.warn("[lookup] students.parent_mobile_norm missing — run supabase/production.sql for indexed lookups");
    ({ data, error } = await admin
      .from("students")
      .select(STUDENT_FIELDS)
      .like("parent_mobile", `%${last10}`)
      .eq("dob", p.dob));
  }

  if (error) {
    console.error("[lookup] findStudents failed:", error.message);
    throw new Error("तांत्रिक अडचण. पुन्हा प्रयत्न करा · Something went wrong, please try again");
  }

  return (data ?? []).map((s) => {
    const div = s.divisions as unknown as { name: string; standards: { name: string; academic_year: string } | null } | null;
    const standard_name = div?.standards?.name ?? "";
    const division_name = div?.name ?? "";
    return {
      id: s.id,
      roll_no: s.roll_no,
      gr_no: s.gr_no ?? null,
      student_name: s.student_name,
      standard_name,
      division_name,
      class_name: div ? `${standard_name} — ${division_name}`.trim() : "",
      academic_year: div?.standards?.academic_year ?? "",
    };
  });
}

export async function listExamsForStudent(studentId: string): Promise<LookupExam[]> {
  const admin = createSupabaseAdmin();

  // Only exams where this student has marks
  const { data: markRows } = await admin
    .from("marks")
    .select("exam_id, subject_id, marks_obtained")
    .eq("student_id", studentId);

  const examIds = Array.from(new Set((markRows ?? []).map((r) => r.exam_id)));
  if (examIds.length === 0) return [];

  const [{ data: exams, error }, { data: subjects }] = await Promise.all([
    admin
      .from("exams")
      .select("id, test_type, academic_year, exam_start_date, exam_end_date, exam_date")
      .in("id", examIds)
      .order("exam_start_date", { ascending: false, nullsFirst: false }),
    admin.from("exam_subjects").select("id, exam_id, max_marks").in("exam_id", examIds),
  ]);
  if (error) {
    console.error("[lookup] listExamsForStudent failed:", error.message);
    throw new Error("तांत्रिक अडचण. पुन्हा प्रयत्न करा · Something went wrong, please try again");
  }

  const maxBySubject = new Map<string, number | null>();
  for (const s of subjects ?? []) maxBySubject.set(s.id, s.max_marks);

  // Only count papers the student actually has a numeric mark for, so a
  // partially-entered exam still shows an honest percentage.
  const totals = new Map<string, { obtained: number; total: number; count: number }>();
  for (const m of markRows ?? []) {
    const max = maxBySubject.get(m.subject_id);
    const agg = totals.get(m.exam_id) ?? { obtained: 0, total: 0, count: 0 };
    agg.count += 1;
    if (m.marks_obtained != null && max != null) {
      agg.obtained += Number(m.marks_obtained);
      agg.total += Number(max);
    }
    totals.set(m.exam_id, agg);
  }

  return (exams ?? []).map((e) => {
    const agg = totals.get(e.id);
    const hasMarks = !!agg && agg.total > 0;
    return {
      id: e.id,
      test_type: e.test_type,
      academic_year: e.academic_year,
      exam_date: e.exam_date ?? null,
      exam_start_date: e.exam_start_date ?? null,
      exam_end_date: e.exam_end_date ?? null,
      obtained: hasMarks ? agg.obtained : null,
      total: hasMarks ? agg.total : null,
      percent: hasMarks ? Math.round((agg.obtained / agg.total) * 1000) / 10 : null,
      subject_count: agg?.count ?? 0,
    };
  });
}
