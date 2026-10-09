import { createSupabaseServer } from "@/lib/supabase/server";
import ToppersClient, { type ExamGroup } from "./ToppersClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Toppers" };

export default async function ToppersAdminPage() {
  const supabase = await createSupabaseServer();
  const [{ data: exams }, { data: toppers, error }] = await Promise.all([
    supabase
      .from("exams")
      .select("id, test_type, academic_year, exam_start_date, divisions(name, standards(id, name, display_order))")
      .order("exam_start_date", { ascending: false }),
    supabase
      .from("toppers")
      .select("id, exam_id, rank, student_name, percentage, total, max_total, is_featured, photo_url, note")
      .order("rank", { ascending: true }),
  ]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">Toppers table needs the latest migration.</p>
        <p className="mt-1">Run <code className="rounded bg-white px-1">supabase/achievements.sql</code> in the Supabase SQL editor.</p>
        <p className="mt-2 text-xs text-amber-700">{error.message}</p>
      </div>
    );
  }

  // One group per test of a standard: the same "Unit Test 1" uploaded
  // separately for divisions A, B and C is ranked together.
  const groups = new Map<string, ExamGroup>();
  for (const e of exams ?? []) {
    const div = e.divisions as unknown as {
      name: string; standards: { id: string; name: string; display_order: number } | null;
    } | null;
    const std = div?.standards;
    const key = `${std?.id ?? "?"}|${e.test_type}|${e.academic_year}|${e.exam_start_date}`;
    const g: ExamGroup = groups.get(key) ?? {
      key,
      standard: std?.name ?? "—",
      standard_order: std?.display_order ?? 0,
      test_type: e.test_type,
      academic_year: e.academic_year,
      exam_start_date: e.exam_start_date,
      exam_ids: [],
      divisions: [],
      toppers: [],
    };
    g.exam_ids.push(e.id);
    if (div?.name) g.divisions.push(div.name);
    groups.set(key, g);
  }
  const groupByExam = new Map<string, ExamGroup>();
  for (const g of groups.values()) for (const id of g.exam_ids) groupByExam.set(id, g);
  for (const t of toppers ?? []) groupByExam.get(t.exam_id)?.toppers.push(t);

  return <ToppersClient groups={Array.from(groups.values())} />;
}
