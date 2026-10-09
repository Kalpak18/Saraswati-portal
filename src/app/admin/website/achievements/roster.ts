import { createSupabaseServer } from "@/lib/supabase/server";
import { normalizeStandard, normalizeDivision } from "@/lib/i18n/normalize";
import { selectAll } from "@/lib/supabase/selectAll";

// Minimal roster sent to the browser for name matching — no mobiles/DOBs.
export type RosterStudent = {
  id: string;
  name: string;
  roll_no: number;
  standard_label: string | null;   // as the admin named it, e.g. "10 वी"
  standard: string | null;          // canonical, for comparing with sheets
  division: string | null;          // canonical
  division_label: string | null;
  academic_year: string | null;
};

export async function loadRoster(): Promise<RosterStudent[]> {
  const supabase = await createSupabaseServer();
  // The whole school (~5000 students) — fetched page by page.
  const data = await selectAll((from, to) =>
    supabase
      .from("students")
      .select("id, student_name, roll_no, divisions(name, standards(name, academic_year))")
      .eq("is_active", true)
      .order("student_name").order("id")
      .range(from, to),
  );
  return data.map((s) => {
    const div = s.divisions as unknown as {
      name: string; standards: { name: string; academic_year: string } | null;
    } | null;
    const stdLabel = div?.standards?.name ?? null;
    return {
      id: s.id,
      name: s.student_name,
      roll_no: s.roll_no,
      standard_label: stdLabel,
      standard: stdLabel ? normalizeStandard(stdLabel) ?? stdLabel : null,
      division: div ? normalizeDivision(div.name) ?? div.name : null,
      division_label: div?.name ?? null,
      academic_year: div?.standards?.academic_year ?? null,
    };
  });
}
