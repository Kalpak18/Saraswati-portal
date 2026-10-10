import Link from "next/link";
import { Calendar, ExternalLink, Images, Plus } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";
export const metadata = { title: "Events" };

export default async function EventsAdminPage() {
  const supabase = await createSupabaseServer();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, slug, event_date, cover_photo_url, is_published, event_photos(count)")
    .order("event_date", { ascending: false, nullsFirst: false });
  const list = events ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        breadcrumbs={[{ label: "Website", href: "/admin/website" }, { label: "Events" }]}
        title="Events"
        description="Annual day, sports day, trips, celebrations — with their photos. The newest appear in the home page story."
        actions={
          <>
            <Link href="/life" target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3.5 text-sm text-ink-700 shadow-sm hover:bg-ink-50">
              <ExternalLink className="h-4 w-4" /> View live
            </Link>
            <Link href="/admin/website/events/new">
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>New event</Button>
            </Link>
          </>
        }
      />

      {list.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white shadow-sm">
          <EmptyState
            icon={<Calendar className="h-6 w-6" />}
            title="No events yet"
            description="Create an event and upload its photos — they will appear on the home page and in School life."
            action={<Link href="/admin/website/events/new"><Button leftIcon={<Plus className="h-4 w-4" />}>New event</Button></Link>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => {
            const count = (e.event_photos as unknown as { count: number }[] | null)?.[0]?.count ?? 0;
            return (
              <Link key={e.id} href={`/admin/website/events/${e.id}`}
                className="group overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
                <div className="aspect-16/10 bg-ink-100">
                  {e.cover_photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={e.cover_photo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink-300"><Calendar className="h-10 w-10" /></div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs tabular-nums text-ink-500">{e.event_date ?? "No date"}</span>
                    {e.is_published ? <Badge tone="green">Live</Badge> : <Badge>Draft</Badge>}
                  </div>
                  <div className="mt-1 line-clamp-2 font-medium text-ink-900 group-hover:text-brand-800">{e.title}</div>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs text-ink-500">
                    <Images className="h-3.5 w-3.5" /> {count} photo{count === 1 ? "" : "s"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
