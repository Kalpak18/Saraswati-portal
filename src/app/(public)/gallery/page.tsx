import Link from "next/link";
import { Camera, ArrowRight } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import PageIntro from "../PageIntro";

export const metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const supabase = await createSupabaseServer();
  const { data: albums } = await supabase
    .from("gallery_albums")
    .select("id, title, slug, description, cover_photo_url, display_order")
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  const list = albums ?? [];

  return (
    <>
      <PageIntro eyebrow="Moments" title="Photo gallery" subtitle="Snapshots from around campus." />

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-14 text-center">
            <Camera className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-4 text-sm font-medium text-gray-700">Photo albums coming soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((a) => (
              <Link
                key={a.id}
                href={`/gallery/${a.slug}`}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-4/3 w-full overflow-hidden bg-gray-100">
                  {a.cover_photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={a.cover_photo_url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-50 to-purple-50 text-indigo-300">
                      <Camera className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="line-clamp-1 text-base font-semibold text-gray-900 group-hover:text-indigo-700">
                    {a.title}
                  </h3>
                  {a.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{a.description}</p>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                    View album <ArrowRight className="h-3 w-3" />
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
