import { createSupabaseServer } from "@/lib/supabase/server";
import AboutContent from "./AboutContent";

export const metadata = { title: "About" };

export default async function AboutPage() {
  const supabase = await createSupabaseServer();
  const { data: sections } = await supabase
    .from("about_sections")
    .select("key, heading, body_html, display_order")
    .order("display_order", { ascending: true });

  return <AboutContent sections={sections ?? []} />;
}
