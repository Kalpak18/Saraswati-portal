import { createSupabaseServer } from "@/lib/supabase/server";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("school_settings")
    .select("name, address, logo_url")
    .limit(1)
    .single();

  return (
    <SettingsClient
      initial={{
        name: data?.name ?? "",
        address: data?.address ?? "",
        logo_url: data?.logo_url ?? null,
      }}
    />
  );
}
