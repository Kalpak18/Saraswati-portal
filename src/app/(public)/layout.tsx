import { getSchoolInfo } from "@/lib/school";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

/**
 * Wraps every public page with the site header and footer. School settings
 * are fetched once here (light query) and dropped into both — children never
 * have to re-query.
 */
export default async function PublicLayout(props: LayoutProps<"/">) {
  const s = await getSchoolInfo();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader school={{ name: s.name, name_mr: s.name_mr, logo_url: s.logo_url }} />
      <main className="flex-1">{props.children}</main>
      <PublicFooter school={s} />
    </div>
  );
}
