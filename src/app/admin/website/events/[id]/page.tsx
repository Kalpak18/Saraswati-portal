import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import EventEditor from "./EventEditor";

export const dynamic = "force-dynamic";

export default async function EventEditorPage(props: PageProps<"/admin/website/events/[id]">) {
  const { id } = await props.params;
  if (id === "new") return <EventEditor initial={null} />;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createSupabaseServer();
  const { data: ev } = await supabase
    .from("events")
    .select("id, slug, title, event_date, description, cover_photo_url, is_published, event_photos(photo_url, caption, display_order)")
    .eq("id", id)
    .maybeSingle();
  if (!ev) notFound();

  const photos = ((ev.event_photos ?? []) as { photo_url: string; caption: string | null; display_order: number }[])
    .sort((a, b) => a.display_order - b.display_order)
    .map(({ photo_url, caption }) => ({ photo_url, caption }));

  return (
    <EventEditor
      initial={{
        id: ev.id,
        slug: ev.slug,
        title: ev.title,
        event_date: ev.event_date,
        description: ev.description ?? "",
        cover_photo_url: ev.cover_photo_url,
        is_published: ev.is_published,
        photos,
      }}
    />
  );
}
