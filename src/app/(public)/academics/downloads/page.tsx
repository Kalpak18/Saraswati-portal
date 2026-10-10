import { createSupabaseServer } from "@/lib/supabase/server";
import type { DownloadItem } from "@/lib/downloads";
import DownloadsContent from "./DownloadsContent";

export const metadata = {
  title: "Downloads",
  description: "School calendar, forms, circulars and syllabus to download.",
};

export default async function DownloadsPage() {
  const supabase = await createSupabaseServer();
  // RLS limits visitors to published documents.
  const { data } = await supabase.from("downloads").select("*")
    .eq("is_published", true).order("display_order", { ascending: true });
  return <DownloadsContent items={(data ?? []) as DownloadItem[]} />;
}
