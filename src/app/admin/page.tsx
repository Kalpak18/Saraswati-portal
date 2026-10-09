import { createSupabaseServer } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";
import { getSchoolInfo } from "@/lib/school";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();

  const [
    { count: divisionsCount },
    { count: studentsCount },
    { count: examsCount },
    school,
  ] = await Promise.all([
    supabase.from("divisions").select("*", { count: "exact", head: true }),
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("exams").select("*", { count: "exact", head: true }),
    getSchoolInfo(),
  ]);

  return (
    <DashboardClient
      classesCount={divisionsCount ?? 0}
      studentsCount={studentsCount ?? 0}
      examsCount={examsCount ?? 0}
      school={{ name: school.name, name_mr: school.name_mr }}
    />
  );
}
