"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { uploadPublicImage } from "@/lib/storage";

async function requireUser() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return supabase;
}

function revalidateToppers() {
  revalidatePath("/");
  revalidatePath("/academics/toppers");
  revalidatePath("/admin/website/toppers");
}

// ============================================================
// Generate toppers from uploaded marks
// ============================================================
// An exam row belongs to ONE division, but a school announces toppers for
// the whole standard. The admin page groups the per-division exam rows of
// the same test into one group; this ranks every student across all of them.
const GeneratePayload = z.object({
  exam_ids: z.array(z.string().uuid()).min(1).max(30),
  top_n: z.number().int().min(1).max(25),
});

export async function generateToppers(input: unknown) {
  const p = GeneratePayload.parse(input);
  const supabase = await requireUser();

  const [{ data: exams, error: eErr }, { data: subjects, error: sErr }, { data: marks, error: mErr }] =
    await Promise.all([
      supabase
        .from("exams")
        .select("id, test_type, academic_year, divisions(name, standards(name))")
        .in("id", p.exam_ids),
      supabase.from("exam_subjects").select("id, exam_id, max_marks").in("exam_id", p.exam_ids),
      supabase.from("marks").select("exam_id, student_id, subject_id, marks_obtained").in("exam_id", p.exam_ids),
    ]);
  if (eErr || sErr || mErr) throw new Error((eErr ?? sErr ?? mErr)!.message);
  if (!exams || exams.length === 0) throw new Error("Exam not found");

  const maxBySubject = new Map((subjects ?? []).map((s) => [s.id, s.max_marks as number | null]));

  // Totals per (exam, student). A subject with no mark entered (absent,
  // exempt) is left out of both the total and the max so it neither
  // helps nor hurts the percentage.
  type Tot = { exam_id: string; student_id: string; total: number; max: number; hasMax: boolean };
  const totals = new Map<string, Tot>();
  for (const m of marks ?? []) {
    if (m.marks_obtained == null) continue;
    const k = `${m.exam_id}|${m.student_id}`;
    const t = totals.get(k) ?? { exam_id: m.exam_id, student_id: m.student_id, total: 0, max: 0, hasMax: true };
    t.total += Number(m.marks_obtained);
    const mx = maxBySubject.get(m.subject_id);
    if (mx == null) t.hasMax = false; else t.max += Number(mx);
    totals.set(k, t);
  }
  if (totals.size === 0) throw new Error("No marks have been entered for this exam yet");

  const scored = Array.from(totals.values()).map((t) => ({
    ...t,
    pct: t.hasMax && t.max > 0 ? Math.round((t.total / t.max) * 10000) / 100 : null,
  }));
  // Percentage when every subject has a max; raw total otherwise.
  const metric = (x: (typeof scored)[number]) => x.pct ?? x.total;
  scored.sort((a, b) => metric(b) - metric(a));

  // Competition ranking: 1, 1, 3.
  const ranked: ((typeof scored)[number] & { rank: number })[] = [];
  scored.forEach((s, i) => {
    const rank = i > 0 && metric(s) === metric(scored[i - 1]) ? ranked[i - 1].rank : i + 1;
    ranked.push({ ...s, rank });
  });
  const winners = ranked.filter((r) => r.rank <= p.top_n);

  const { data: students, error: stErr } = await supabase
    .from("students")
    .select("id, student_name")
    .in("id", winners.map((w) => w.student_id));
  if (stErr) throw new Error(stErr.message);
  const nameById = new Map((students ?? []).map((s) => [s.id, s.student_name]));

  // Keep a photo / note the admin already added when regenerating.
  const { data: prior } = await supabase
    .from("toppers")
    .select("student_id, photo_url, note, is_featured")
    .in("exam_id", p.exam_ids);
  const priorBy = new Map((prior ?? []).map((t) => [t.student_id, t]));

  const examById = new Map(exams.map((e) => [e.id, e]));
  const rows = winners.map((w) => {
    const e = examById.get(w.exam_id)!;
    const div = e.divisions as unknown as { name: string; standards: { name: string } | null } | null;
    const before = priorBy.get(w.student_id);
    return {
      exam_id: w.exam_id,
      student_id: w.student_id,
      rank: w.rank,
      student_name: nameById.get(w.student_id) ?? "",
      standard_label: div?.standards?.name ?? null,
      exam_label: e.test_type,
      academic_year: e.academic_year,
      total: w.total,
      max_total: w.hasMax ? w.max : null,
      percentage: w.pct,
      photo_url: before?.photo_url ?? null,
      note: before?.note ?? null,
      is_featured: before?.is_featured ?? true,
    };
  });

  const { error: delErr } = await supabase.from("toppers").delete().in("exam_id", p.exam_ids);
  if (delErr) throw new Error(delErr.message);
  const { error: insErr } = await supabase.from("toppers").insert(rows);
  if (insErr) throw new Error(insErr.message);

  revalidateToppers();
  return { count: rows.length };
}

export async function clearToppers(examIds: string[]) {
  const ids = z.array(z.string().uuid()).min(1).parse(examIds);
  const supabase = await requireUser();
  const { error } = await supabase.from("toppers").delete().in("exam_id", ids);
  if (error) throw new Error(error.message);
  revalidateToppers();
}

const TopperUpdate = z.object({
  id: z.string().uuid(),
  is_featured: z.boolean().optional(),
  note: z.string().max(200).nullable().optional(),
  photo_url: z.string().max(500).nullable().optional(),
});

export async function updateTopper(input: unknown) {
  const { id, ...patch } = TopperUpdate.parse(input);
  const supabase = await requireUser();
  const { error } = await supabase.from("toppers").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateToppers();
}

export async function uploadTopperImage(fd: FormData): Promise<{ url: string }> {
  await requireUser();
  const file = fd.get("file") as File | null;
  if (!file) throw new Error("No file provided");
  return uploadPublicImage("toppers", file);
}
