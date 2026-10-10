import type { MetadataRoute } from "next";
import { createSupabaseServer } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/siteUrl";

export const revalidate = 3600;

/** Public pages plus every published event page. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const at = (path: string) => new URL(path, base).toString();
  const pages: MetadataRoute.Sitemap = [
    { url: at("/"), changeFrequency: "weekly", priority: 1 },
    { url: at("/notices"), changeFrequency: "daily", priority: 0.9 },
    { url: at("/achievements"), changeFrequency: "weekly", priority: 0.8 },
    { url: at("/academics/toppers"), changeFrequency: "monthly", priority: 0.7 },
    { url: at("/life"), changeFrequency: "weekly", priority: 0.7 },
    { url: at("/about"), changeFrequency: "monthly", priority: 0.7 },
    { url: at("/academics/faculty"), changeFrequency: "monthly", priority: 0.6 },
    { url: at("/academics/downloads"), changeFrequency: "monthly", priority: 0.6 },
    { url: at("/contact"), changeFrequency: "yearly", priority: 0.6 },
    { url: at("/lookup"), changeFrequency: "yearly", priority: 0.5 },
  ];
  try {
    const supabase = await createSupabaseServer();
    const { data } = await supabase.from("events").select("slug, updated_at").eq("is_published", true);
    for (const e of data ?? []) {
      pages.push({ url: at(`/life/${encodeURIComponent(e.slug)}`), lastModified: e.updated_at, changeFrequency: "yearly", priority: 0.5 });
    }
  } catch {
    // The static list is still a valid sitemap.
  }
  return pages;
}
