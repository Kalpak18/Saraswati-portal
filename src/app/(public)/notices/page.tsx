import { createSupabaseServer } from "@/lib/supabase/server";
import { NOTICE_COLUMNS, type PublicNotice } from "@/lib/notices";
import NoticesContent from "./NoticesContent";

export const metadata = {
  title: "Notices",
  description: "Admission, result, exam and holiday notices from the school.",
};

export default async function NoticesPage() {
  const supabase = await createSupabaseServer();
  // RLS already limits visitors to live notices (published, started, not expired).
  const { data } = await supabase
    .from("notices")
    .select(NOTICE_COLUMNS)
    .order("is_pinned", { ascending: false })
    .order("publish_on", { ascending: false })
    .limit(300);
  return <NoticesContent notices={(data ?? []) as PublicNotice[]} />;
}
