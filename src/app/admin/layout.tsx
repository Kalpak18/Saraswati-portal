import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import AdminShell from "./AdminShell";

export default async function AdminLayout(props: LayoutProps<"/admin">) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: school } = await supabase
    .from("school_settings")
    .select("name, logo_url")
    .limit(1)
    .single();

  return (
    <AdminShell
      userEmail={user.email ?? ""}
      schoolName={school?.name ?? "Saraswati Portal"}
      logoUrl={school?.logo_url ?? null}
    >
      {props.children}
    </AdminShell>
  );
}
