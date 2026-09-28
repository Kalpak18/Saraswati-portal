import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import PageIntro from "../PageIntro";

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const supabase = await createSupabaseServer();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, slug, description, event_date, cover_photo_url")
    .eq("is_published", true)
    .order("event_date", { ascending: false, nullsFirst: false });

  const list = events ?? [];

  return (
    <>
      <PageIntro
        eyebrow="What's happening"
        title="Events"
        subtitle="Photos and updates from throughout the school year."
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-14 text-center">
            <Calendar className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-4 text-sm font-medium text-gray-700">No events published yet</p>
            <p className="mt-1 text-xs text-gray-500">Check back soon for upcoming activities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {list.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.slug}`}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-16/9 w-full overflow-hidden bg-gray-100">
                  {e.cover_photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={e.cover_photo_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-50 to-purple-50 text-indigo-300">
                      <Calendar className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="text-xs font-medium uppercase tracking-wide text-indigo-600 tabular-nums">
                    {e.event_date ?? "Coming soon"}
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-base font-semibold text-gray-900 group-hover:text-indigo-700">
                    {e.title}
                  </h3>
                  {e.description && (
                    <p className="mt-2 line-clamp-3 text-sm text-gray-600">{e.description}</p>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 group-hover:text-indigo-800">
                    View details <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
