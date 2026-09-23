import { createSupabaseServer } from "@/lib/supabase/server";
import UploadWizard from "./UploadWizard";

export default async function UploadPage() {
  const supabase = await createSupabaseServer();

  const [{ data: standards }, { data: divisions }] = await Promise.all([
    supabase.from("standards")
      .select("id, name, academic_year, display_order")
      .order("academic_year", { ascending: false })
      .order("display_order", { ascending: true }),
    supabase.from("divisions")
      .select("id, standard_id, name, is_active")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
  ]);

  return <UploadWizard standards={standards ?? []} divisions={divisions ?? []} />;
}
