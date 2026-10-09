import { createSupabaseServer } from "@/lib/supabase/server";
import NoticesClient, { type AdminNotice } from "./NoticesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notices" };

export default async function NoticesAdminPage() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("notices")
    .select("id, title, body, category, link_href, attachment_url, attachment_name, is_pinned, is_published, publish_on, expires_on")
    .order("is_pinned", { ascending: false })
    .order("publish_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">Notice board is not ready.</p>
        <p className="mt-1">Run <code className="rounded bg-white px-1">supabase/notices.sql</code> in the Supabase SQL editor.</p>
        <p className="mt-2 text-xs text-amber-700">{error.message}</p>
      </div>
    );
  }
  return <NoticesClient notices={(data ?? []) as AdminNotice[]} />;
}
