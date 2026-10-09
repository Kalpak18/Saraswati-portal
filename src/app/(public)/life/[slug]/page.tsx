import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import EventContent from "./EventContent";

async function loadEvent(slug: string) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("events")
    .select("id, title, slug, event_date, description, cover_photo_url, event_photos(photo_url, caption, display_order)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata(props: PageProps<"/life/[slug]">) {
  const { slug } = await props.params;
  const ev = await loadEvent(decodeURIComponent(slug));
  if (!ev) return { title: "Event" };
  return {
    title: ev.title,
    description: ev.description?.slice(0, 160) || undefined,
    openGraph: ev.cover_photo_url ? { images: [ev.cover_photo_url] } : undefined,
  };
}

export default async function EventPage(props: PageProps<"/life/[slug]">) {
  const { slug } = await props.params;
  const ev = await loadEvent(decodeURIComponent(slug));
  if (!ev) notFound();

  const photos = ((ev.event_photos ?? []) as { photo_url: string; caption: string | null; display_order: number }[])
    .sort((a, b) => a.display_order - b.display_order)
    .map(({ photo_url, caption }) => ({ url: photo_url, caption }));

  return (
    <EventContent
      event={{
        title: ev.title,
        event_date: ev.event_date,
        description: ev.description ?? "",
        cover: ev.cover_photo_url ?? photos[0]?.url ?? null,
        photos,
      }}
    />
  );
}
