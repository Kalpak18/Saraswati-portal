import { createSupabaseServer } from "@/lib/supabase/server";
import HeroEditor from "./HeroEditor";

export const dynamic = "force-dynamic";

export default async function HeroEditorPage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("hero_content")
    .select("title, tagline, cover_photo_url, primary_cta_label, primary_cta_href, secondary_cta_label, secondary_cta_href, meta_line")
    .limit(1)
    .maybeSingle();

  return (
    <HeroEditor
      initial={{
        title: data?.title ?? "",
        tagline: data?.tagline ?? "",
        meta_line: data?.meta_line ?? "",
        primary_cta_label: data?.primary_cta_label ?? "परिणाम पहा · Check Result",
        primary_cta_href: data?.primary_cta_href ?? "/lookup",
        secondary_cta_label: data?.secondary_cta_label ?? "",
        secondary_cta_href: data?.secondary_cta_href ?? "",
        cover_photo_url: data?.cover_photo_url ?? null,
      }}
    />
  );
}
