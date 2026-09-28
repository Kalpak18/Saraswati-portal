import { Trophy } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import PageIntro from "../PageIntro";

export const metadata = { title: "Achievements" };

const CATEGORY_META: Record<string, { label: string; tone: string }> = {
  academic: { label: "Academic",  tone: "bg-indigo-50 text-indigo-700" },
  sports:   { label: "Sports",    tone: "bg-green-50 text-green-700" },
  cultural: { label: "Cultural",  tone: "bg-purple-50 text-purple-700" },
  other:    { label: "Other",     tone: "bg-gray-100 text-gray-700" },
};

export default async function AchievementsPage() {
  const supabase = await createSupabaseServer();
  const { data: list } = await supabase
    .from("achievements")
    .select("id, title, description, category, achieved_on, photo_url")
    .eq("is_published", true)
    .order("achieved_on", { ascending: false, nullsFirst: false });

  const items = list ?? [];

  return (
    <>
      <PageIntro
        eyebrow="Making us proud"
        title="Achievements"
        subtitle="Academic, sports and cultural highlights from our students."
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-14 text-center">
            <Trophy className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-4 text-sm font-medium text-gray-700">Achievements coming soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => {
              const cat = CATEGORY_META[a.category] ?? CATEGORY_META.other;
              return (
                <article
                  key={a.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="aspect-16/9 w-full overflow-hidden bg-gray-100">
                    {a.photo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={a.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-amber-50 to-yellow-50 text-amber-400">
                        <Trophy className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cat.tone}`}>
                        {cat.label}
                      </span>
                      {a.achieved_on && (
                        <span className="text-[11px] text-gray-500 tabular-nums">
                          {a.achieved_on}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-base font-semibold text-gray-900">
                      {a.title}
                    </h3>
                    {a.description && (
                      <p className="mt-2 line-clamp-3 text-sm text-gray-600">{a.description}</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
