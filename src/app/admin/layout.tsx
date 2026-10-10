import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import AdminShell from "./AdminShell";
import { getSchoolInfo } from "@/lib/school";

// Private page: keep it out of search engines (robots.txt also disallows it).
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout(props: LayoutProps<"/admin">) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const school = await getSchoolInfo();

  return (
    <AdminShell
      userEmail={user.email ?? ""}
      school={{ name: school.name, name_mr: school.name_mr }}
      logoUrl={school.logo_url}
    >
      {props.children}
    </AdminShell>
  );
}
