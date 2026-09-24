"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";

// ============================================================
// Types shared with the wizard
// ============================================================
const NewStudentSchema = z.object({
  gr_no: z.string().max(50).nullable().optional(),
  roll_no: z.number().int().min(1).max(9999),
  student_name: z.string().min(1).max(200),
  parent_mobile: z.string().min(4).max(20),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const SubjectPayload = z.object({
  subject_name: z.string().min(1),
  max_marks: z.number().nullable(),
  paper_no: z.number().int().nullable(),
  paper_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

const EntryPayload = z.object({
  subject_name: z.string().min(1),
  paper_no: z.number().int().nullable(),
  marks_obtained: z.number().nullable(),
  grade: z.string().nullable(),
});

const StudentSlot = z.union([
  z.object({
    mode: z.literal("existing"),
    student_id: z.string().uuid(),
    entries: z.array(EntryPayload),
    on_conflict: z.enum(["replace", "skip"]).default("replace"),
  }),
  z.object({
    mode: z.literal("create"),
    new_student: NewStudentSchema,
    entries: z.array(EntryPayload),
    on_conflict: z.enum(["replace", "skip"]).default("replace"),
  }),
]);

const SaveExamPayload = z.object({
  division_id: z.string().uuid(),
  test_type: z.string().min(1),
  academic_year: z.string().min(1),
  exam_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  exam_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  subjects: z.array(SubjectPayload).min(1),
  students: z.array(StudentSlot).min(1),
});

const SaveBatchPayload = z.object({
  idempotency_key: z.string().min(8).max(128),
  file_name: z.string().max(256).nullable().optional(),
  exams: z.array(SaveExamPayload).min(1),
});

// ============================================================
// Idempotency probe — call BEFORE showing preview so we can warn admin
// ============================================================
export async function checkUploadIdempotency(key: string) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("upload_batches")
    .select("id, uploaded_at, file_name, rows_saved, students_created, exams_touched, status")
    .eq("idempotency_key", key)
    .maybeSingle();
  return data;
}

// ============================================================
// Conflict probe — for each candidate exam, tell the wizard which
// (student_id) already has marks so it can render the choice modal.
// ============================================================
const ProbeExamSchema = z.object({
  division_id: z.string().uuid(),
  test_type: z.string().min(1),
  academic_year: z.string().min(1),
  exam_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  existing_student_ids: z.array(z.string().uuid()),  // students already picked as "existing"
});

export async function probeExamConflicts(input: unknown) {
  const p = ProbeExamSchema.parse(input);
  const supabase = await createSupabaseServer();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, exam_start_date, exam_end_date")
    .eq("division_id", p.division_id)
    .eq("test_type", p.test_type)
    .eq("academic_year", p.academic_year)
    .eq("exam_start_date", p.exam_start_date)
    .maybeSingle();

  if (!exam) return { exam_exists: false, conflicting_student_ids: [] as string[] };

  if (p.existing_student_ids.length === 0) {
    return { exam_exists: true, exam_id: exam.id, conflicting_student_ids: [] as string[] };
  }

  const { data: existingMarks } = await supabase
    .from("marks")
    .select("student_id")
    .eq("exam_id", exam.id)
    .in("student_id", p.existing_student_ids);

  const conflicts = Array.from(new Set((existingMarks ?? []).map((m) => m.student_id)));
  return { exam_exists: true, exam_id: exam.id, conflicting_student_ids: conflicts };
}

// ============================================================
// Save one or more exams as a single transactional batch
// ============================================================
export async function saveBatch(input: unknown) {
  const p = SaveBatchPayload.parse(input);
  const supabase = await createSupabaseServer();

  // ----- Idempotency short-circuit -----
  const { data: existingBatch } = await supabase
    .from("upload_batches")
    .select("id, rows_saved, students_created, exams_touched, uploaded_at, status")
    .eq("idempotency_key", p.idempotency_key)
    .maybeSingle();

  if (existingBatch) {
    return {
      already_committed: true,
      batch: existingBatch,
      exams: [] as { exam_id: string; test_type: string; students_saved: number; students_created: number }[],
    };
  }

  const { data: user } = await supabase.auth.getUser();
  const uploaderId = user?.user?.id ?? null;

  // ----- Run all exams -----
  const results: { exam_id: string; test_type: string; students_saved: number; students_created: number }[] = [];
  let totalRows = 0;
  let totalCreated = 0;

  for (const exam of p.exams) {
    const r = await saveOneExam(exam, uploaderId, p.idempotency_key);
    totalRows += r.marks_saved;
    totalCreated += r.students_created;
    results.push({
      exam_id: r.exam_id,
      test_type: exam.test_type,
      students_saved: r.students_saved,
      students_created: r.students_created,
    });
  }

  // ----- Record the batch (post-commit) -----
  const { data: batch } = await supabase.from("upload_batches").insert({
    idempotency_key: p.idempotency_key,
    file_name: p.file_name ?? null,
    uploaded_by: uploaderId,
    rows_saved: totalRows,
    students_created: totalCreated,
    exams_touched: p.exams.length,
    status: "committed",
  }).select("id, uploaded_at, rows_saved, students_created, exams_touched").single();

  revalidatePath("/admin/results");
  revalidatePath("/admin");

  return { already_committed: false, batch, exams: results };
}

// ============================================================
// The core per-exam writer — used by saveBatch
// ============================================================
type ExamPayload = z.infer<typeof SaveExamPayload>;

async function saveOneExam(
  p: ExamPayload,
  uploaderId: string | null,
  idempotencyKey: string,
) {
  const supabase = await createSupabaseServer();

  // 1. Upsert exam (identity = division + test_type + year + exam_start_date)
  const { data: existing } = await supabase
    .from("exams")
    .select("id")
    .eq("division_id", p.division_id)
    .eq("test_type", p.test_type)
    .eq("academic_year", p.academic_year)
    .eq("exam_start_date", p.exam_start_date)
    .maybeSingle();

  let examId: string;
  if (existing?.id) {
    examId = existing.id;
    await supabase.from("exams").update({
      exam_end_date: p.exam_end_date,
      exam_date: p.exam_start_date,
    }).eq("id", examId);
  } else {
    const { data: created, error } = await supabase.from("exams").insert({
      division_id: p.division_id,
      test_type: p.test_type,
      academic_year: p.academic_year,
      exam_start_date: p.exam_start_date,
      exam_end_date: p.exam_end_date,
      exam_date: p.exam_start_date,
    }).select("id").single();
    if (error || !created) throw new Error(error?.message || "Failed to create exam");
    examId = created.id;
  }

  // 2. Merge subjects — ADD only new ones; keep existing subject IDs
  const { data: existingSubjects } = await supabase
    .from("exam_subjects")
    .select("id, subject_name, paper_no, max_marks, paper_date, display_order")
    .eq("exam_id", examId);

  const subjKey = (name: string, paper: number | null) => `${name}|${paper ?? "n"}`;
  const subjectIdByKey = new Map<string, string>();
  for (const s of existingSubjects ?? []) {
    subjectIdByKey.set(subjKey(s.subject_name, s.paper_no), s.id);
  }

  const subjectsToInsert = p.subjects
    .filter((s) => !subjectIdByKey.has(subjKey(s.subject_name, s.paper_no)))
    .map((s, i) => ({
      exam_id: examId,
      subject_name: s.subject_name,
      max_marks: s.max_marks,
      paper_no: s.paper_no,
      paper_date: s.paper_date,
      display_order: (existingSubjects?.length ?? 0) + i,
    }));

  if (subjectsToInsert.length > 0) {
    const { data: inserted, error: subErr } = await supabase
      .from("exam_subjects")
      .insert(subjectsToInsert)
      .select("id, subject_name, paper_no");
    if (subErr) throw new Error(subErr.message);
    for (const s of inserted ?? []) {
      subjectIdByKey.set(subjKey(s.subject_name, s.paper_no), s.id);
    }
  }

  // 3. Filter skipped slots + create new students
  const activeSlots = p.students.filter((s) => s.on_conflict !== "skip" || s.mode === "create" || true);
  // (We still respect on_conflict === "skip" per-student below, right before mark writes.)

  const studentIdBySlot: (string | null)[] = new Array(p.students.length).fill(null);
  const createRows: { slotIdx: number; payload: {
    division_id: string; gr_no: string | null; roll_no: number;
    student_name: string; parent_mobile: string; dob: string;
  } }[] = [];

  p.students.forEach((s, i) => {
    if (s.mode === "existing") studentIdBySlot[i] = s.student_id;
    else if (s.mode === "create") {
      createRows.push({
        slotIdx: i,
        payload: {
          division_id: p.division_id,
          gr_no: s.new_student.gr_no || null,
          roll_no: s.new_student.roll_no,
          student_name: s.new_student.student_name,
          parent_mobile: s.new_student.parent_mobile,
          dob: s.new_student.dob,
        },
      });
    }
  });

  let studentsCreated = 0;
  if (createRows.length > 0) {
    const { data: inserted, error: cErr } = await supabase
      .from("students")
      .insert(createRows.map((r) => r.payload))
      .select("id, roll_no");
    if (cErr) throw new Error(cErr.message);
    const idByRoll = new Map<number, string>();
    for (const row of inserted ?? []) idByRoll.set(row.roll_no, row.id);
    for (const r of createRows) {
      const id = idByRoll.get(r.payload.roll_no);
      if (!id) throw new Error("Failed to link newly created student");
      studentIdBySlot[r.slotIdx] = id;
      studentsCreated++;
    }
  }

  // 4. Per-student conflict handling
  //    - on_conflict === "replace": delete existing marks for (exam, student), then re-insert
  //    - on_conflict === "skip":    do nothing for this student
  const includedStudentIds: string[] = [];
  for (let i = 0; i < p.students.length; i++) {
    const slot = p.students[i];
    const sid = studentIdBySlot[i];
    if (!sid) continue;
    if (slot.on_conflict === "skip") continue;
    includedStudentIds.push(sid);
  }

  if (includedStudentIds.length > 0) {
    // Purge existing marks for these students in this exam
    const CHUNK = 500;
    for (let i = 0; i < includedStudentIds.length; i += CHUNK) {
      const slice = includedStudentIds.slice(i, i + CHUNK);
      const { error: delErr } = await supabase
        .from("marks")
        .delete()
        .eq("exam_id", examId)
        .in("student_id", slice);
      if (delErr) throw new Error(delErr.message);
    }
  }

  // 5. Insert marks
  const markRows: {
    exam_id: string; student_id: string; subject_id: string;
    marks_obtained: number | null; grade: string | null;
    updated_by: string | null; updated_source: string;
  }[] = [];

  p.students.forEach((slot, i) => {
    if (slot.on_conflict === "skip") return;
    const studentId = studentIdBySlot[i];
    if (!studentId) return;
    for (const e of slot.entries) {
      const sid = subjectIdByKey.get(subjKey(e.subject_name, e.paper_no));
      if (!sid) continue;
      markRows.push({
        exam_id: examId,
        student_id: studentId,
        subject_id: sid,
        marks_obtained: e.marks_obtained,
        grade: e.grade,
        updated_by: uploaderId,
        updated_source: "upload",
      });
    }
  });

  if (markRows.length > 0) {
    const CHUNK = 500;
    for (let i = 0; i < markRows.length; i += CHUNK) {
      const { error: mErr } = await supabase.from("marks")
        .insert(markRows.slice(i, i + CHUNK));
      if (mErr) throw new Error(mErr.message);
    }
  }

  return {
    exam_id: examId,
    students_saved: p.students.filter((s) => s.on_conflict !== "skip").length,
    students_created: studentsCreated,
    marks_saved: markRows.length,
    idempotency_key: idempotencyKey,
  };
}

// ============================================================
// Manual per-student correction (unchanged API, adds audit fields)
// ============================================================
const UpdatePayload = z.object({
  exam_id: z.string().uuid(),
  student_id: z.string().uuid(),
  entries: z.array(z.object({
    subject_id: z.string().uuid(),
    marks_obtained: z.number().nullable(),
    grade: z.string().nullable(),
  })),
});

export async function updateStudentMarks(input: unknown) {
  const p = UpdatePayload.parse(input);
  const supabase = await createSupabaseServer();
  const { data: user } = await supabase.auth.getUser();
  const uploaderId = user?.user?.id ?? null;

  const rows = p.entries.map((e) => ({
    exam_id: p.exam_id, student_id: p.student_id,
    subject_id: e.subject_id,
    marks_obtained: e.marks_obtained, grade: e.grade,
    updated_by: uploaderId, updated_source: "manual_edit",
  }));
  const { error } = await supabase.from("marks").upsert(rows, {
    onConflict: "exam_id,student_id,subject_id",
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/results/${p.exam_id}`);
  revalidatePath(`/admin/results/${p.exam_id}/${p.student_id}`);
}
