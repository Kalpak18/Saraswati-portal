import { createSupabaseServer } from "@/lib/supabase/server";
import ToppersContent from "./ToppersContent";

export const metadata = { title: "Toppers" };

export default async function ToppersPage() {
  const supabase = await createSupabaseServer();
  const { data: toppers } = await supabase
    .from("toppers")
    .select("id, rank, note, photo_url, students(id, student_name), exams(test_type, academic_year, exam_start_date)")
    .eq("is_featured", true)
    .order("rank", { ascending: true });
  return <ToppersContent toppers={toppers ?? []} />;
}
