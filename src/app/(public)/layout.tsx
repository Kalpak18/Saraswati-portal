import { createSupabaseServer } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

/**
 * Wraps every public page (/, /about, /events, /team, …) with the same
 * header + footer. Fetches school settings once here so children don't have
 * to.
 */
export default async function PublicLayout(props: LayoutProps<"/">) {
  const supabase = await createSupabaseServer();
  const { data: school } = await supabase
    .from("school_settings")
    .select("name, address, logo_url")
    .limit(1)
    .maybeSingle();

  const s = {
    name: school?.name ?? null,
    address: school?.address ?? null,
    logo_url: school?.logo_url ?? null,
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PublicHeader school={{ name: s.name, logo_url: s.logo_url }} />
      <main className="flex-1">{props.children}</main>
      <PublicFooter school={{ name: s.name, address: s.address }} />
    </div>
  );
}
