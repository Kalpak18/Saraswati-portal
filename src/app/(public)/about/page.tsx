import { createSupabaseServer } from "@/lib/supabase/server";
import PageIntro from "../PageIntro";

export const metadata = { title: "About" };

export default async function AboutPage() {
  const supabase = await createSupabaseServer();
  const { data: sections } = await supabase
    .from("about_sections")
    .select("key, heading, body_html, display_order")
    .order("display_order", { ascending: true });

  const list = sections ?? [];

  return (
    <>
      <PageIntro eyebrow="Our story" title="About the school" />

      <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
            Our story will appear here soon.
          </div>
        ) : (
          <div className="space-y-8">
            {list.map((s) => (
              <article key={s.key} className="prose prose-sm max-w-none sm:prose">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{s.heading}</h2>
                <div dangerouslySetInnerHTML={{ __html: s.body_html }} />
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
