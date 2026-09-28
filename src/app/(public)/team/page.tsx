import { Users, Mail, Phone } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import PageIntro from "../PageIntro";

export const metadata = { title: "Our Team" };

const CATEGORY_ORDER = ["leadership", "management", "faculty"] as const;
const CATEGORY_LABEL: Record<string, string> = {
  leadership: "Leadership",
  management: "Management",
  faculty: "Faculty",
};

export default async function TeamPage() {
  const supabase = await createSupabaseServer();
  const { data: members } = await supabase
    .from("team_members")
    .select("id, name, designation, bio, photo_url, email, phone, category, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const list = members ?? [];

  // Group by category, keeping known order
  const grouped = new Map<string, typeof list>();
  for (const m of list) {
    const arr = grouped.get(m.category) ?? [];
    arr.push(m);
    grouped.set(m.category, arr);
  }
  const groups = [
    ...CATEGORY_ORDER.filter((c) => grouped.has(c)).map((c) => [c, grouped.get(c)!] as const),
    ...Array.from(grouped.entries()).filter(([c]) => !CATEGORY_ORDER.includes(c as never)),
  ];

  return (
    <>
      <PageIntro
        eyebrow="The people behind us"
        title="Our team"
        subtitle="Meet the leaders, teachers and support staff who make it all happen."
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-14 text-center">
            <Users className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-4 text-sm font-medium text-gray-700">Team profiles coming soon</p>
          </div>
        ) : (
          <div className="space-y-14">
            {groups.map(([cat, arr]) => (
              <section key={cat}>
                <h2 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">
                  {CATEGORY_LABEL[cat] ?? cat}
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {arr.map((m) => (
                    <article
                      key={m.id}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                    >
                      <div className="aspect-square w-full overflow-hidden bg-gray-100">
                        {m.photo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={m.photo_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-100 to-purple-100 text-5xl font-bold text-indigo-400">
                            {m.name.trim().charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="line-clamp-1 text-base font-semibold text-gray-900">
                          {m.name}
                        </h3>
                        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                          {m.designation}
                        </p>
                        {m.bio && (
                          <p className="mt-3 line-clamp-4 text-sm text-gray-600">{m.bio}</p>
                        )}
                        {(m.email || m.phone) && (
                          <div className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-600">
                            {m.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <a href={`mailto:${m.email}`} className="hover:text-indigo-600 hover:underline">
                                  {m.email}
                                </a>
                              </div>
                            )}
                            {m.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <a href={`tel:${m.phone}`} className="tabular-nums hover:text-indigo-600 hover:underline">
                                  {m.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
