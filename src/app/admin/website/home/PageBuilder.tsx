import { createSupabaseServer } from "@/lib/supabase/server";
import { loadHomeSections } from "@/lib/homeSectionsServer";
import type { SitePage } from "@/lib/homeSections";
import HomeBuilderClient from "./HomeBuilderClient";

/** Server half of the section builder, shared by the Home and About pages. */
export async function PageBuilder({ page }: { page: SitePage }) {
  const supabase = await createSupabaseServer();
  const [{ sections, saved }, tableCheck, { data: examRows }] = await Promise.all([
    loadHomeSections(page),
    // Selecting `page` also catches a home_sections table from before that column existed.
    supabase.from("home_sections").select("id, page", { count: "exact", head: true }),
    supabase.from("achievements").select("exam_name").not("exam_name", "is", null).limit(2000),
  ]);

  if (tableCheck.error) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">The page builder needs its table.</p>
        <p className="mt-1">Run <code className="rounded bg-white px-1">supabase/home_sections.sql</code> in the Supabase SQL editor, then reload.</p>
        <p className="mt-2 text-xs text-amber-700">{tableCheck.error.message}</p>
      </div>
    );
  }

  const exams = Array.from(new Set((examRows ?? []).map((r) => r.exam_name as string))).sort();
  return <HomeBuilderClient page={page} sections={sections} saved={saved} exams={exams} />;
}
