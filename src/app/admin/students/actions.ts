"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";

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

export async function saveStudent(input: z.infer<typeof StudentSchema>) {
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

export async function deleteStudent(id: string) {
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

export async function importStudents(divisionId: string, rows: unknown[]) {
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
