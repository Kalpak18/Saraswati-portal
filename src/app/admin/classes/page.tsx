import { createSupabaseServer } from "@/lib/supabase/server";
import StandardsClient from "./StandardsClient";

export default async function StandardsPage() {
  const supabase = await createSupabaseServer();

  const [{ data: standards }, { data: divisions }, { data: counts }] = await Promise.all([
    supabase.from("standards")
      .select("id, name, academic_year, display_order")
      .order("academic_year", { ascending: false })
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("divisions")
      .select("id, standard_id, name, is_active, display_order")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("students").select("division_id"),
  ]);

  const studentCountByDivision = new Map<string, number>();
  for (const row of counts ?? []) {
    studentCountByDivision.set(row.division_id, (studentCountByDivision.get(row.division_id) ?? 0) + 1);
  }

  return (
    <StandardsClient
      standards={standards ?? []}
      divisions={divisions ?? []}
      studentCountByDivision={Object.fromEntries(studentCountByDivision)}
    />
  );
}
