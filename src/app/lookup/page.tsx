import LookupForm from "./LookupForm";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function LookupPage() {
  const supabase = await createSupabaseServer();
  const { data: school } = await supabase
    .from("school_settings")
    .select("name, logo_url")
    .limit(1)
    .single();

  return <LookupForm school={{ name: school?.name ?? null, logo_url: school?.logo_url ?? null }} />;
}
