import { createSupabaseServer } from "@/lib/supabase/server";
import AchievementsClient, { type AchievementRow, type ImportRow } from "./AchievementsClient";
import { loadRoster } from "./roster";

export const dynamic = "force-dynamic";
export const metadata = { title: "Achievements" };

export default async function AchievementsAdminPage() {
  const supabase = await createSupabaseServer();
  const [{ data: rows, error }, { data: imports }, roster] = await Promise.all([
    supabase
      .from("achievements")
      .select(
        "id, title, description, category, achieved_on, photo_url, student_id, student_name, standard_label, exam_name, level, rank, score, max_score, award, medal, academic_year, is_published, import_batch_id, created_at",
      )
      .order("achieved_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("achievement_imports")
      .select("id, file_name, exam_name, uploaded_at, rows_inserted, rows_updated")
      .order("uploaded_at", { ascending: false })
      .limit(8),
    loadRoster(),
  ]);

  if (error) {
    // Most likely cause: supabase/achievements.sql has not been applied.
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">Achievements table is not ready.</p>
        <p className="mt-1">
          Run <code className="rounded bg-white px-1">supabase/achievements.sql</code> in the Supabase SQL editor,
          then reload this page.
        </p>
        <p className="mt-2 text-xs text-amber-700">{error.message}</p>
      </div>
    );
  }

  return (
    <AchievementsClient
      rows={(rows ?? []) as AchievementRow[]}
      imports={(imports ?? []) as ImportRow[]}
      roster={roster}
    />
  );
}
