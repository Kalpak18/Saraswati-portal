import { createSupabaseServer } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

/**
 * Wraps every public page with the site header and footer. School settings
 * are fetched once here (light query) and dropped into both — children never
 * have to re-query.
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
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader school={{ name: s.name, logo_url: s.logo_url }} />
      <main className="flex-1">{props.children}</main>
      <PublicFooter school={s} />
    </div>
  );
}
