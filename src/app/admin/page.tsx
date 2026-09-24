import { createSupabaseServer } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();

  const [
    { count: divisionsCount },
    { count: studentsCount },
    { count: examsCount },
    { data: school },
  ] = await Promise.all([
    supabase.from("divisions").select("*", { count: "exact", head: true }),
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("exams").select("*", { count: "exact", head: true }),
    supabase.from("school_settings").select("name").limit(1).maybeSingle(),
  ]);

  return (
    <DashboardClient
      classesCount={divisionsCount ?? 0}
      studentsCount={studentsCount ?? 0}
      examsCount={examsCount ?? 0}
      schoolName={school?.name ?? ""}
    />
  );
}
