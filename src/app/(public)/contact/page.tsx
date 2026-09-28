import { createSupabaseServer } from "@/lib/supabase/server";
import ContactContent from "./ContactContent";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const supabase = await createSupabaseServer();
  const { data: school } = await supabase
    .from("school_settings")
    .select("name, address")
    .limit(1)
    .maybeSingle();

  return <ContactContent school={{ name: school?.name ?? null, address: school?.address ?? null }} />;
}
