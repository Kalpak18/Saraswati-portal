import { createSupabaseServer } from "@/lib/supabase/server";
import type { DownloadItem } from "@/lib/downloads";
import DownloadsClient from "./DownloadsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Downloads" };

export default async function DownloadsAdminPage() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from("downloads").select("*")
    .order("category").order("display_order", { ascending: true });
  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">Downloads isn&apos;t set up yet.</p>
        <p className="mt-1">Run <code className="rounded bg-white px-1">supabase/launch.sql</code> in the Supabase SQL editor, then reload.</p>
      </div>
    );
  }
  return <DownloadsClient items={(data ?? []) as DownloadItem[]} />;
}
