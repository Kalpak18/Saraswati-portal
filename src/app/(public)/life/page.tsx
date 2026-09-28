import { createSupabaseServer } from "@/lib/supabase/server";
import LifeContent from "./LifeContent";

export const metadata = { title: "School Life" };

export default async function LifePage() {
  const supabase = await createSupabaseServer();
  const [{ data: events }, { data: albums }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, slug, description, event_date, cover_photo_url")
      .eq("is_published", true)
      .order("event_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("gallery_albums")
      .select("id, title, slug, description, cover_photo_url, display_order")
      .eq("is_published", true)
      .order("display_order", { ascending: true }),
  ]);

  return <LifeContent events={events ?? []} albums={albums ?? []} />;
}
