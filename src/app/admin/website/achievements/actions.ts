"use server";

import { toResult } from "@/lib/actionResult";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { uploadPublicImage, deletePublicImage } from "@/lib/storage";
import { normalizeName } from "@/lib/match/nameMatch";
import { LEVELS, CATEGORIES } from "@/lib/achievements";

const LevelEnum = z.enum(LEVELS.map((l) => l.key) as [string, ...string[]]);
const CategoryEnum = z.enum(CATEGORIES.map((c) => c.key) as [string, ...string[]]);
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function revalidateShowcase() {
  revalidatePath("/");
  revalidatePath("/achievements");
  revalidatePath("/admin/website/achievements");
}

async function requireUser() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return { supabase, userId: data.user.id };
}

// "१० वी — अ" for a linked student, so the public card never needs to
// read the students table.
type StudentSnap = { id: string; student_name: string; standard_label: string | null };

async function snapshotStudents(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  ids: string[],
): Promise<Map<string, StudentSnap>> {
  const out = new Map<string, StudentSnap>();
  if (ids.length === 0) return out;
  const { data, error } = await supabase
    .from("students")
    .select("id, student_name, divisions(name, standards(name))")
    .in("id", ids);
  if (error) throw new Error(error.message);
  for (const s of data ?? []) {
    const div = s.divisions as unknown as { name: string; standards: { name: string } | null } | null;
    out.set(s.id, {
      id: s.id,
      student_name: s.student_name,
      standard_label: div?.standards?.name ?? null,
    });
  }
  return out;
}

// ============================================================
// Import
// ============================================================
const ImportRow = z.object({
  student_id: z.string().uuid().nullable(),
  student_name: z.string().min(1).max(200),
  standard_label: z.string().max(40).nullable(),
  exam_name: z.string().min(1).max(200),
  level: LevelEnum.nullable(),
  rank: z.number().int().positive().nullable(),
  score: z.number().nullable(),
  max_score: z.number().nullable(),
  award: z.string().max(200).nullable(),
  medal: z.enum(["gold", "silver", "bronze"]).nullable(),
  achieved_on: IsoDate.nullable(),
  academic_year: z.string().max(20).nullable(),
});

const ImportPayload = z.object({
  idempotency_key: z.string().min(8).max(128),
  file_name: z.string().max(256).nullable(),
  category: CategoryEnum,
  publish: z.boolean(),
  rows: z.array(ImportRow).min(1).max(5000),
});

async function checkAchievementImport__impl(key: string) {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("achievement_imports")
    .select("id, uploaded_at, file_name, rows_inserted, rows_updated")
    .eq("idempotency_key", key)
    .maybeSingle();
  return data;
}

async function importAchievements__impl(input: unknown) {
  const p = ImportPayload.parse(input);
  const { supabase, userId } = await requireUser();

  // Claim the idempotency key first — the unique index makes a double-click
  // or a re-upload of the same file fail here instead of duplicating rows.
  const examNames = Array.from(new Set(p.rows.map((r) => r.exam_name)));
  const { data: batch, error: batchErr } = await supabase
    .from("achievement_imports")
    .insert({
      idempotency_key: p.idempotency_key,
      file_name: p.file_name,
      exam_name: examNames.join(", ").slice(0, 500),
      uploaded_by: userId,
    })
    .select("id")
    .single();
  if (batchErr || !batch) {
    if (batchErr?.code === "23505") throw new Error("This file has already been imported.");
    throw new Error(batchErr?.message ?? "Could not start import");
  }

  try {
    const snaps = await snapshotStudents(
      supabase,
      Array.from(new Set(p.rows.map((r) => r.student_id).filter((x): x is string => !!x))),
    );

    // Re-importing a corrected merit list should update rows, not add a
    // second copy. Identity = exam + year + (student id, else name).
    const { data: existing, error: exErr } = await supabase
      .from("achievements")
      .select("id, exam_name, academic_year, student_id, student_name")
      .in("exam_name", examNames);
    if (exErr) throw new Error(exErr.message);

    const identity = (exam: string, year: string | null, sid: string | null, name: string) =>
      `${exam.toLowerCase()}|${year ?? ""}|${sid ?? "n:" + normalizeName(name)}`;
    const existingByKey = new Map<string, string>();
    for (const e of existing ?? []) {
      const k = identity(e.exam_name ?? "", e.academic_year, e.student_id, e.student_name ?? "");
      existingByKey.set(k, e.id);
      // Also index by name, so a row imported unlinked and now linked is found.
      if (e.student_id && e.student_name) {
        existingByKey.set(identity(e.exam_name ?? "", e.academic_year, null, e.student_name), e.id);
      }
    }

    const inserts: Record<string, unknown>[] = [];
    const updates: { id: string; row: Record<string, unknown> }[] = [];

    for (const r of p.rows) {
      const snap = r.student_id ? snaps.get(r.student_id) : undefined;
      const name = snap?.student_name ?? r.student_name;
      const row = {
        title: r.exam_name,
        exam_name: r.exam_name,
        category: p.category,
        student_id: snap?.id ?? null,
        student_name: name,
        standard_label: snap?.standard_label ?? r.standard_label,
        level: r.level,
        rank: r.rank,
        score: r.score,
        max_score: r.max_score,
        award: r.award,
        medal: r.medal,
        achieved_on: r.achieved_on,
        academic_year: r.academic_year,
        import_batch_id: batch.id,
      };
      const id =
        existingByKey.get(identity(r.exam_name, r.academic_year, snap?.id ?? null, name)) ??
        existingByKey.get(identity(r.exam_name, r.academic_year, null, name));
      if (id) updates.push({ id, row });
      else inserts.push({ ...row, is_published: p.publish });
    }

    const CHUNK = 500;
    for (let i = 0; i < inserts.length; i += CHUNK) {
      const { error } = await supabase.from("achievements").insert(inserts.slice(i, i + CHUNK));
      if (error) throw new Error(error.message);
    }
    for (const u of updates) {
      const { error } = await supabase.from("achievements").update(u.row).eq("id", u.id);
      if (error) throw new Error(error.message);
    }

    await supabase
      .from("achievement_imports")
      .update({ rows_inserted: inserts.length, rows_updated: updates.length })
      .eq("id", batch.id);

    revalidateShowcase();
    return { batch_id: batch.id, inserted: inserts.length, updated: updates.length };
  } catch (err) {
    // Release the key so the admin can fix the file and retry.
    await supabase.from("achievement_imports").delete().eq("id", batch.id);
    throw err;
  }
}

// Undo a whole import (rows it created or last touched).
async function deleteImportBatch__impl(batchId: string) {
  const id = z.string().uuid().parse(batchId);
  const { supabase } = await requireUser();
  const { error } = await supabase.from("achievements").delete().eq("import_batch_id", id);
  if (error) throw new Error(error.message);
  await supabase.from("achievement_imports").delete().eq("id", id);
  revalidateShowcase();
}

// ============================================================
// Manual create / edit
// ============================================================
const AchievementSchema = z.object({
  id: z.string().uuid().nullable(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).default(""),
  category: CategoryEnum,
  student_id: z.string().uuid().nullable(),
  student_name: z.string().max(200).nullable(),
  standard_label: z.string().max(40).nullable(),
  exam_name: z.string().max(200).nullable(),
  level: LevelEnum.nullable(),
  rank: z.number().int().positive().nullable(),
  score: z.number().nullable(),
  max_score: z.number().nullable(),
  award: z.string().max(200).nullable(),
  medal: z.enum(["gold", "silver", "bronze"]).nullable(),
  achieved_on: IsoDate.nullable(),
  academic_year: z.string().max(20).nullable(),
  photo_url: z.string().max(500).nullable(),
  is_published: z.boolean(),
});

async function saveAchievement__impl(input: unknown) {
  const p = AchievementSchema.parse(input);
  const { supabase } = await requireUser();

  const snap = p.student_id ? (await snapshotStudents(supabase, [p.student_id])).get(p.student_id) : undefined;
  const { id, ...rest } = p;
  const row = {
    ...rest,
    student_id: snap?.id ?? null,
    student_name: snap?.student_name ?? (p.student_name || null),
    standard_label: snap?.standard_label ?? (p.standard_label || null),
  };

  if (id) {
    const { data: before } = await supabase.from("achievements").select("photo_url").eq("id", id).maybeSingle();
    const { error } = await supabase.from("achievements").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    if (before?.photo_url && before.photo_url !== row.photo_url) await deletePublicImage(before.photo_url);
  } else {
    const { error } = await supabase.from("achievements").insert(row);
    if (error) throw new Error(error.message);
  }
  revalidateShowcase();
}

async function deleteAchievements__impl(ids: string[]) {
  const list = z.array(z.string().uuid()).min(1).parse(ids);
  const { supabase } = await requireUser();
  const { data: rows } = await supabase.from("achievements").select("photo_url").in("id", list);
  const { error } = await supabase.from("achievements").delete().in("id", list);
  if (error) throw new Error(error.message);
  for (const r of rows ?? []) if (r.photo_url) await deletePublicImage(r.photo_url);
  revalidateShowcase();
}

async function setAchievementsPublished__impl(ids: string[], published: boolean) {
  const list = z.array(z.string().uuid()).min(1).parse(ids);
  const { supabase } = await requireUser();
  const { error } = await supabase.from("achievements").update({ is_published: published }).in("id", list);
  if (error) throw new Error(error.message);
  revalidateShowcase();
}

async function uploadAchievementImage__impl(fd: FormData): Promise<{ url: string }> {
  await requireUser();
  const file = fd.get("file") as File | null;
  if (!file) throw new Error("No file provided");
  return uploadPublicImage("achievements", file);
}

// ---- Exported actions: errors come back as values (see lib/actionResult.ts) ----
export async function checkAchievementImport(...args: Parameters<typeof checkAchievementImport__impl>) { return toResult(() => checkAchievementImport__impl(...args)); }
export async function importAchievements(...args: Parameters<typeof importAchievements__impl>) { return toResult(() => importAchievements__impl(...args)); }
export async function deleteImportBatch(...args: Parameters<typeof deleteImportBatch__impl>) { return toResult(() => deleteImportBatch__impl(...args)); }
export async function saveAchievement(...args: Parameters<typeof saveAchievement__impl>) { return toResult(() => saveAchievement__impl(...args)); }
export async function deleteAchievements(...args: Parameters<typeof deleteAchievements__impl>) { return toResult(() => deleteAchievements__impl(...args)); }
export async function setAchievementsPublished(...args: Parameters<typeof setAchievementsPublished__impl>) { return toResult(() => setAchievementsPublished__impl(...args)); }
export async function uploadAchievementImage(...args: Parameters<typeof uploadAchievementImage__impl>) { return toResult(() => uploadAchievementImage__impl(...args)); }
