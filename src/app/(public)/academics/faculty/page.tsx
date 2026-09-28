import { createSupabaseServer } from "@/lib/supabase/server";
import FacultyContent from "./FacultyContent";

export const metadata = { title: "Faculty" };

export default async function FacultyPage() {
  const supabase = await createSupabaseServer();
  const { data: members } = await supabase
    .from("team_members")
    .select("id, name, designation, bio, photo_url, email, phone, category, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  return <FacultyContent members={members ?? []} />;
}
