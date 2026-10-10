import { createSupabaseServer } from "@/lib/supabase/server";
import FacultyContent, { type Member } from "./FacultyContent";

export const metadata = { title: "Faculty" };

export default async function FacultyPage() {
  const supabase = await createSupabaseServer();
  // team_public only carries email/phone for people who chose to show them.
  let { data, error } = await supabase.from("team_public").select("*").order("display_order", { ascending: true });
  if (error) {
    // launch.sql not applied yet: read the table, and never pass contact details on.
    const legacy = await supabase.from("team_members")
      .select("id, name, designation, bio, photo_url, category, display_order")
      .eq("is_active", true).order("display_order", { ascending: true });
    data = legacy.data; error = legacy.error;
  }
  return <FacultyContent members={(data ?? []) as Member[]} />;
}
