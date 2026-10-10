"use server";

import { toResult } from "@/lib/actionResult";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { DIVISIONS, STANDARDS, normalizeDivision, normalizeStandard } from "@/lib/i18n/normalize";

const StudentSchema = z.object({
  id: z.string().uuid().optional(),
  division_id: z.string().uuid(),
  roll_no: z.number().int().min(1).max(9999),
  student_name: z.string().min(1).max(200),
  parent_mobile: z.string().min(4).max(20),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be YYYY-MM-DD"),
  gender: z.string().max(20).nullable().optional(),
  is_active: z.boolean().default(true),
});

async function saveStudent__impl(input: z.infer<typeof StudentSchema>) {
  const p = StudentSchema.parse(input);
  const supabase = await createSupabaseServer();
  const payload = {
    division_id: p.division_id,
    roll_no: p.roll_no,
    student_name: p.student_name,
    parent_mobile: p.parent_mobile,
    dob: p.dob,
    gender: p.gender || null,
    is_active: p.is_active,
  };
  if (p.id) {
    const { error } = await supabase.from("students").update(payload).eq("id", p.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("students").insert(payload);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/students");
  revalidatePath("/admin");
}

async function deleteStudent__impl(id: string) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/students");
  revalidatePath("/admin");
}

const ImportRowSchema = z.object({
  roll_no: z.number().int().min(1).max(9999),
  student_name: z.string().min(1).max(200),
  parent_mobile: z.string().min(4).max(20),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.string().max(20).nullable().optional(),
});

async function importStudents__impl(divisionId: string, rows: unknown[]) {
  if (!divisionId) throw new Error("division_id required");
  const parsed = z.array(ImportRowSchema).parse(rows);
  const supabase = await createSupabaseServer();
  const payload = parsed.map((r) => ({
    division_id: divisionId,
    roll_no: r.roll_no,
    student_name: r.student_name,
    parent_mobile: r.parent_mobile,
    dob: r.dob,
    gender: r.gender || null,
  }));
  const { error, count } = await supabase
    .from("students")
    .upsert(payload, { onConflict: "division_id,roll_no", count: "exact" });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return { inserted: count ?? payload.length };
}

// ------------------------------------------------------------
// Whole school in one file: every row names its class + division.
// Missing classes / divisions for the year are created, then students
// are added or updated (same class + division + roll = same student).
// ------------------------------------------------------------
const SchoolRowSchema = ImportRowSchema.extend({
  standard: z.string().min(1).max(20),
  division: z.string().min(1).max(20),
});

async function importSchoolStudents__impl(academicYear: string, rows: unknown[]) {
  const year = z.string().regex(/^\d{4}-\d{2}$/, "Academic year looks like 2026-27").parse(academicYear.trim());
  const parsed = z.array(SchoolRowSchema).min(1).max(20000).parse(rows);
  const supabase = await createSupabaseServer();

  // 1. Classes for the year (create the missing ones).
  const { data: stds, error: sErr } = await supabase.from("standards").select("id, name").eq("academic_year", year);
  if (sErr) throw new Error(sErr.message);
  const stdId = new Map<string, string>();
  for (const s of stds ?? []) stdId.set(normalizeStandard(s.name) ?? s.name, s.id);
  const needStd = Array.from(new Set(parsed.map((r) => r.standard))).filter((n) => !stdId.has(n));
  if (needStd.length) {
    const { data, error } = await supabase.from("standards")
      .insert(needStd.map((name) => ({ name, academic_year: year, display_order: STANDARDS.find((x) => x.canonical === name)?.number ?? 0 })))
      .select("id, name");
    if (error) throw new Error(error.message);
    for (const s of data ?? []) stdId.set(s.name, s.id);
  }

  // 2. Divisions under those classes (create the missing ones).
  const { data: divs, error: dErr } = await supabase.from("divisions").select("id, standard_id, name").in("standard_id", Array.from(stdId.values()));
  if (dErr) throw new Error(dErr.message);
  const divId = new Map<string, string>();
  for (const d of divs ?? []) divId.set(`${d.standard_id}|${normalizeDivision(d.name) ?? d.name}`, d.id);
  const needDiv = Array.from(new Set(parsed.map((r) => `${stdId.get(r.standard)}|${r.division}`))).filter((k) => !divId.has(k));
  if (needDiv.length) {
    const { data, error } = await supabase.from("divisions")
      .insert(needDiv.map((k) => {
        const [standard_id, name] = k.split("|");
        return { standard_id, name, display_order: DIVISIONS.findIndex((x) => x.canonical === name) + 1 };
      }))
      .select("id, standard_id, name");
    if (error) throw new Error(error.message);
    for (const d of data ?? []) divId.set(`${d.standard_id}|${d.name}`, d.id);
  }

  // 3. Students, 500 at a time.
  const payload = parsed.map((r) => ({
    division_id: divId.get(`${stdId.get(r.standard)}|${r.division}`)!,
    roll_no: r.roll_no,
    student_name: r.student_name,
    parent_mobile: r.parent_mobile,
    dob: r.dob,
    gender: r.gender || null,
  }));
  let saved = 0;
  for (let i = 0; i < payload.length; i += 500) {
    const { error, count } = await supabase.from("students")
      .upsert(payload.slice(i, i + 500), { onConflict: "division_id,roll_no", count: "exact" });
    if (error) throw new Error(`Saved ${saved} of ${payload.length}, then: ${error.message}`);
    saved += count ?? Math.min(500, payload.length - i);
  }
  revalidatePath("/admin/students");
  revalidatePath("/admin/classes");
  revalidatePath("/admin");
  return { saved, classes_created: needStd.length, divisions_created: needDiv.length };
}

// ---- Exported actions: errors come back as values (see lib/actionResult.ts) ----
export async function saveStudent(...args: Parameters<typeof saveStudent__impl>) { return toResult(() => saveStudent__impl(...args)); }
export async function deleteStudent(...args: Parameters<typeof deleteStudent__impl>) { return toResult(() => deleteStudent__impl(...args)); }
export async function importStudents(...args: Parameters<typeof importStudents__impl>) { return toResult(() => importStudents__impl(...args)); }
export async function importSchoolStudents(...args: Parameters<typeof importSchoolStudents__impl>) { return toResult(() => importSchoolStudents__impl(...args)); }
