import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();

  const [{ count: divisionsCount }, { count: studentsCount }, { count: examsCount }] = await Promise.all([
    supabase.from("divisions").select("*", { count: "exact", head: true }),
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("exams").select("*", { count: "exact", head: true }),
  ]);

  return (
    <DashboardClient
      classesCount={divisionsCount ?? 0}
      studentsCount={studentsCount ?? 0}
      examsCount={examsCount ?? 0}
    />
  );
}
